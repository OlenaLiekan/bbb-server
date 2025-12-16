const { PaymentInformation, UserAddress, User, UserOrder, OrderItem } = require('./models/models');
const axios = require('axios');
const email = require('./sendEmail');
const crypto = require('crypto');
const getRawBody = require('raw-body');
const { Op } = require('sequelize');

const SIBSForm = async (
  userId,
  to,
  name,
  surname,
  orderNumber,
  company,
  address,
  postalCode,
  comment,
  phone,
  order,
  paymentList,
  sum,
  countryCode
) => {
  console.log('[sibs] SIBSForm called with orderNumber:', orderNumber);
  try {
    if (!to || !orderNumber || !sum) {
      throw new Error('Parâmetros faltando');
    }

    /*const foundCustomer = await User.findOne({
      where: { id: userId },
    });

    if (!foundCustomer) {
      throw new Error('Cliente não encontrado');
    }*/

    if (!userId) {
      throw new Error('Cliente não encontrado');
    }

    let addressParts = address.split(',');
    addressParts = addressParts.map(part => {
      return part.replace(/(Rua:|Número da porta:|Cidade:|Conselho:|País:)/gi, '').trim();
    });

    if (addressParts.length < 5) {
      throw new Error('Endereço incompleto ou mal formatado');
    }

    const firstAddressLower = addressParts[0].toLowerCase();
    const cityLower = addressParts[2].toLowerCase();
    const postalCodeLower = postalCode.toLowerCase();
    const existingAddress = await UserAddress.findOne({
      where: {
        userId: userId,
        firstAddress: { [Op.iLike]: firstAddressLower },
        city: { [Op.iLike]: cityLower },
        postalCode: { [Op.iLike]: postalCodeLower },
      },
    });

    const existingMainAddress = await UserAddress.findOne({
      where: {
        userId: userId,
        mainAddress: true,
      },
    });

    if (!existingAddress) {
      if (existingMainAddress) {
        let options = {
          where: { id: existingMainAddress.id },
        };
        let props = {};
        props = { ...props, mainAddress: false };
        await UserAddress.update(props, options);
      }
      await UserAddress.create({
        firstName: name,
        lastName: surname,
        email: to,
        phone: phone,
        company: company || null,
        firstAddress: addressParts[0],
        secondAddress: addressParts[1],
        city: addressParts[2],
        region: addressParts[3],
        country: addressParts[4],
        postalCode: postalCode,
        mainAddress: true,
        userId: userId,
      });
    }

    const orderTotal = parseFloat(sum);

    const customer = {
      customerInfo: {
        customerName: `${name} ${surname}`,
        customerEmail: to,
        shippingAddress: {
          street1: address.split(',')[0],
          street2: address.split(',')[1],
          city: address.split(',')[2],
          postcode: postalCode,
          country: countryCode,
        },
        billingAddress: {
          street1: address.split(',')[0],
          city: address.split(',')[2],
          postcode: postalCode,
          country: countryCode,
        },
      },
      extendedInfo: [],
    };

    const request = {
      merchant: {
        terminalId: parseInt(process.env.TERMINAL_ID, 10),
        channel: 'web',
        merchantTransactionId: orderNumber,
      },
      customer: customer,
      transaction: {
        transactionTimestamp: new Date().toISOString(),
        description: orderNumber,
        moto: false,
        paymentType: 'PURS',
        paymentMethod: ['CARD', 'MBWAY', 'REFERENCE'],
        amount: {
          value: orderTotal,
          currency: 'EUR',
        },
        paymentReference: {
          entity: process.env.ENTITY_ID,
          minAmount: { value: orderTotal, currency: 'EUR' },
          maxAmount: { value: orderTotal, currency: 'EUR' },
          initialDatetime: new Date().toISOString(),
          finalDatetime: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(),
        },
      },
    };

    const headers = {
      Authorization: `Bearer ${process.env.TOKEN}`,
      'X-IBM-Client-Id': process.env.CLIENT_ID,
      'Content-Type': 'application/json',
    };
    const response = await axios.post(process.env.SIBS_URL, request, { headers });
    const jsonResponse = response.data;

    if (response.status === 200) {
      await PaymentInformation.create({
        transactionID: jsonResponse.transactionID,
        transactionSignature: jsonResponse.transactionSignature,
        orderID: orderNumber,
        customerName: `${name} ${surname}`,
        customerEmail: to,
        amount: jsonResponse.amount.value,
        startTime: new Date(),
        orderAddress: `${addressParts[0]}, ${addressParts[1]}, ${postalCode}, ${addressParts[2]}, ${addressParts[3]}, ${addressParts[4]}`,
        customerPhone: phone,
        userId: userId,
        customerCompany: company || null,
      });

      return {
        success: true,
        paymentInfo: {
          transactionID: jsonResponse.transactionID,
          transactionSignature: jsonResponse.transactionSignature,
          formContext: jsonResponse.formContext,
          amount: parseFloat(jsonResponse.amount.value).toFixed(2),
        },
      };
    } else {
      throw new Error('Erro na API da SIBS');
    }
  } catch (error) {
    console.error('Erro ao processar o pagamento:', error);
    throw new Error('Erro ao processar o pagamento');
  }
};

const checkPaymentStatus = async id => {
  console.log('[sibs] checkPaymentStatus called for transactionID:', id);
  try {
    const apiUrl = `${process.env.SIBS_URL}/${id}/status`;

    const headers = {
      Authorization: `Bearer ${process.env.TOKEN}`,
      'X-IBM-Client-Id': process.env.CLIENT_ID,
    };
    const response = await axios.get(apiUrl, { headers });
    const jsonResponse = response.data;

    if (response.status === 200) {
      const paymentStatus = jsonResponse.paymentStatus;
      const paymentMethod = jsonResponse.paymentMethod;

      console.log(
        `[sibs DEBUG] Looking for transactionID: ${id}, current time: ${new Date().toISOString()}`
      );

      const order = await PaymentInformation.findOne({
        where: { transactionID: id },
      });

      if (order) {
        order.paymentStatus = paymentStatus;
        order.paymentMethod = paymentMethod;

        if (paymentMethod === 'MBWAY') {
          order.phoneNumber = jsonResponse.token.value;
        } else if (paymentMethod === 'REFERENCE') {
          order.reference = jsonResponse.paymentReference.reference;
          order.entity = jsonResponse.paymentReference.entity;
        }

        try {
          await order.save();
          console.log('Informações da ordem atualizadas com sucesso.');
        } catch (error) {
          console.error('Erro ao atualizar as informações da ordem na BD:', error);
          throw new Error('Erro ao atualizar as informações da ordem');
        }
      } else {
        console.warn(`[Payment] Order with transactionID ${id} not found in database`);
        return null;
      }

      return jsonResponse;
    } else {
      console.error(`Erro ao verificar o pagamento: ${response.status}, ${jsonResponse}`);
      return null;
    }
  } catch (error) {
    console.error(`Erro na requisição para a SIBS: ${error.message}`);
    return null;
  }
};

async function processPayment(orderData, paymentStatus) {
  console.log('[processPayment] started...');
  const clientEmail = orderData.clientEmail;
  const clientName = orderData.clientName;
  const clientSurname = orderData.clientSurname;
  const clientCompany = orderData.clientCompany;
  const clientAddress = orderData.clientAddress;
  const clientComment = orderData.clientComment;
  const clientPhone = orderData.clientPhone;
  const orderDetails = orderData.order;
  const orderId = orderData.orderId;

  const userOrder = await UserOrder.findOne({
    where: { orderNumber: orderId },
    include: [
      {
        model: OrderItem,
        as: 'item',
      },
    ],
  });

  if (!userOrder || !userOrder.item || userOrder.item.length === 0) {
    throw new Error('Nenhum item encontrado para este pedido.');
  }

  const orderItems = userOrder.item.map(orderItem => {
    const descriptionLines = orderItem.description.split('\n');
    const priceIndex = descriptionLines.findIndex(line => line.startsWith('Preço:'));
    const hasOptions = descriptionLines.some(line => line.startsWith('Opções:'));

    const descriptionObject = {
      name: orderItem.title,
      company: descriptionLines[0].replace('Marca: ', ''),
      code: descriptionLines[1].replace('Código: ', ''),
      price: parseFloat(
        descriptionLines[priceIndex].replace('Preço: ', '').replace(' €', '')
      ).toFixed(2),
      count: parseInt(descriptionLines[descriptionLines.length - 1].replace('Quantidade: ', '')),
      isLashes: hasOptions,
      info: {},
      img: orderItem.img,
    };

    descriptionLines.slice(2, priceIndex).forEach(line => {
      const cleanLine = line.startsWith(',') ? line.slice(1).trim() : line.trim();
      if (line.startsWith('Opções:')) {
        const options = cleanLine.replace('Opções: ', '').split(' / ');
        descriptionObject.curlArr = options[0];
        descriptionObject.thicknessArr = options[1];
        descriptionObject.lengthArr = options[2];
      } else {
        const [title, description] = cleanLine.split(':').map(part => part.trim());
        descriptionObject.info[title] = description;
      }
    });

    return descriptionObject;
  });

  const totalCount = orderItems.reduce((total, item) => total + item.count, 0);
  const deliveryPrice = userOrder.deliveryPrice;
  const totalPrice = userOrder.sum;
  const promocodeName = userOrder.promocodeName;
  const promocodeValue = userOrder.promocodeValue;
  const orderHTML = email.formatOrderToHTML(
    orderItems,
    totalCount,
    deliveryPrice,
    totalPrice,
    promocodeName,
    promocodeValue
  );

  if (paymentStatus.paymentStatus === 'Success') {
    await email.sendCompletedEmail(
      clientEmail,
      clientName,
      clientSurname,
      orderId,
      clientCompany,
      clientAddress,
      clientComment,
      clientPhone,
      orderHTML,
      paymentStatus
    );

    return {
      state: paymentStatus.paymentStatus,
      method: paymentStatus.paymentMethod,
    };
  } else if (
    paymentStatus.paymentStatus === 'Pending' &&
    paymentStatus.paymentMethod === 'REFERENCE'
  ) {
    const referenceViewModel = {
      reference: paymentStatus.paymentReference.reference,
      entity: paymentStatus.paymentReference.entity,
      value: paymentStatus.amount.value,
    };

    await email.sendCompletedEmail(
      clientEmail,
      clientName,
      clientSurname,
      orderId,
      clientCompany,
      clientAddress,
      clientComment,
      clientPhone,
      orderHTML,
      paymentStatus
    );

    return {
      state: paymentStatus.paymentStatus,
      method: paymentStatus.paymentMethod,
      data: referenceViewModel,
    };
  } else if (paymentStatus.paymentMethod === 'MBWAY') {
    return {
      state: paymentStatus.paymentStatus,
      method: paymentStatus.paymentMethod,
    };
  } else {
    throw new Error('Lamentamos, mas não foi possível concluir o processo de pagamento.');
  }
}

async function webhook(req) {
  try {
    const webhookModel = await processWebhookRequest(req);

    if (!webhookModel) {
      return null;
    }

    return webhookModel;
  } catch (error) {
    console.error('Erro no webhook:', error);
    return null;
  }
}

async function processWebhookRequest(req) {
  console.log('[sibs] processWebhookRequest started');
  const requestTag = req.headers['x-authentication-tag'];
  const requestVector = req.headers['x-initialization-vector'];
  const secretKey = Buffer.from(process.env.WEBHOOK_SECRET_KEY, 'base64');
  const encryptedBody = await readRawBody(req);
  const ciphertext = Buffer.from(encryptedBody, 'base64');
  const nonce = Buffer.from(requestVector, 'base64');
  const tag = Buffer.from(requestTag, 'base64');

  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', secretKey, nonce);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(ciphertext, null, 'utf8');
    decrypted += decipher.final('utf8');
    const webhookModel = JSON.parse(decrypted);

    if (!webhookModel.amount || !webhookModel.amount.value) {
      console.error('[sibs webhookModel] Invalid webhook: missing amount', webhookModel);
      throw new Error('[sibs webhookModel] Missing amount in webhook');
    }

    console.log('[sibs processWebhookRequest] Webhook received:', {
      transactionID: webhookModel.transactionID,
      paymentStatus: webhookModel.paymentStatus,
      paymentMethod: webhookModel.paymentMethod,
      amount: `${webhookModel.amount.value} ${webhookModel.amount.currency}`,
      merchantTransactionId: webhookModel.merchantTransactionId,
    });

    return webhookModel;
  } catch (error) {
    throw new Error('Erro ao processar o webhook');
  }
}

function generateWebhookResponse(model) {
  return {
    statusMsg: 'Success',
    statusCode: '200',
    notificationID: model.notificationID,
  };
}

async function readRawBody(req) {
  return await getRawBody(req, { encoding: 'utf-8' });
}

module.exports = { SIBSForm, checkPaymentStatus, processPayment, webhook, generateWebhookResponse };
