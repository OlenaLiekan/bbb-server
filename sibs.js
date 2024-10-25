const { PaymentInformation, UserAddress, User } = require("./models/models");
const axios = require("axios");
const email = require("./sendEmail");
const crypto = require("crypto");
const getRawBody = require("raw-body");
const { Op } = require('sequelize');

const SIBSForm = async (
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
  try {
    if (!to || !orderNumber || !sum) {
      throw new Error("Parâmetros faltando");
    }

    const foundCustomer = await User.findOne({
      where: { email: to },
    });

    if (!foundCustomer) {
      throw new Error("Cliente não encontrado");
    }

    let addressParts = address.split(",");
    addressParts = addressParts.map(part => {
      return part.replace(/(Rua:|Número da porta:|Cidade:|Conselho:|País:)/gi, "").trim();
    });

    if (addressParts.length < 5) {
      throw new Error("Endereço incompleto ou mal formatado");
    }

    const firstAddressLower = addressParts[0].toLowerCase();
    const cityLower = addressParts[2].toLowerCase();
    const postalCodeLower = postalCode.toLowerCase();
    const existingAddress = await UserAddress.findOne({
      where: {
        userId: foundCustomer.id,
        firstAddress: { [Op.iLike]: firstAddressLower },
        city: { [Op.iLike]: cityLower },
        postalCode: { [Op.iLike]: postalCodeLower }
      }
    });

    if (!existingAddress) {
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
        userId: foundCustomer.id
      });
    }

    const orderTotal = parseFloat(sum);

    const customer = {
      customerInfo: {
        customerName: `${name} ${surname}`,
        customerEmail: to,
        shippingAddress: {
          street1: address.split(",")[0],
          street2: address.split(",")[1],
          city: address.split(",")[2],
          postcode: postalCode,
          country: countryCode,
        },
        billingAddress: {
          street1: address.split(",")[0],
          city: address.split(",")[2],
          postcode: postalCode,
          country: countryCode,
        },
      },
      extendedInfo: [],
    };

    const request = {
      merchant: {
        terminalId: parseInt(process.env.TERMINAL_ID, 10),
        channel: "web",
        merchantTransactionId: orderNumber,
      },
      customer: customer,
      transaction: {
        transactionTimestamp: new Date().toISOString(),
        description: orderNumber,
        moto: false,
        paymentType: "PURS",
        paymentMethod: ["CARD", "MBWAY", "REFERENCE"],
        amount: {
          value: orderTotal,
          currency: "EUR",
        },
        paymentReference: {
          entity: process.env.ENTITY_ID,
          minAmount: { value: orderTotal, currency: "EUR" },
          maxAmount: { value: orderTotal, currency: "EUR" },
          initialDatetime: new Date().toISOString(),
          finalDatetime: new Date(
            new Date().setDate(new Date().getDate() + 3)
          ).toISOString(),
        },
      },
    };

    const headers = {
      Authorization: `Bearer ${process.env.TOKEN}`,
      "X-IBM-Client-Id": process.env.CLIENT_ID,
      "Content-Type": "application/json"
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
      });

      return {
        success: true,
        paymentInfo: {
          transactionID: jsonResponse.transactionID,
          transactionSignature: jsonResponse.transactionSignature,
          formContext: jsonResponse.formContext,
          amount: jsonResponse.amount.value,
        },
      };
    } else {
      throw new Error("Erro na API da SIBS");
    }
  } catch (error) {
    console.error("Erro ao processar o pagamento:", error);
    throw new Error("Erro ao processar o pagamento");
  }
};

const checkPaymentStatus = async (id) => {
  try {
    const apiUrl = `${process.env.SIBS_URL}/${id}/status`;

    const headers = {
      Authorization: `Bearer ${process.env.TOKEN}`,
      "X-IBM-Client-Id": process.env.CLIENT_ID,
    };
    const response = await axios.get(apiUrl, { headers });
    const jsonResponse = response.data;

    if (response.status === 200) {
      const paymentStatus = jsonResponse.paymentStatus;
      const paymentMethod = jsonResponse.paymentMethod;
      const order = await PaymentInformation.findOne({
        where: { transactionID: id },
      });

      if (order) {
        order.paymentStatus = paymentStatus;
        order.paymentMethod = paymentMethod;

        if (paymentMethod === "MBWAY") {
          order.phoneNumber = jsonResponse.token.value;
        } else if (paymentMethod === "REFERENCE") {
          order.reference = jsonResponse.paymentReference.reference;
          order.entity = jsonResponse.paymentReference.entity;
        }

        try {
          await order.save();
          console.log("Informações da ordem atualizadas com sucesso.");
        } catch (error) {
          console.error("Erro ao atualizar as informações da ordem na BD:", error);
          throw new Error("Erro ao atualizar as informações da ordem");
        }
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
  const clientEmail = orderData.clientEmail;
  const clientName = orderData.clientName;
  const clientSurname = orderData.clientSurname;
  const clientCompany = orderData.clientCompany;
  const clientAddress = orderData.clientAddress;
  const clientComment = orderData.clientComment;
  const clientPhone = orderData.clientPhone;
  const orderDetails = orderData.order;
  const orderId = orderData.orderId;

  if (paymentStatus.paymentStatus === "Success") {
    await email.sendCompletedEmail(
      clientEmail,
      clientName,
      clientSurname,
      orderId,
      clientCompany,
      clientAddress,
      clientComment,
      clientPhone,
      orderDetails,
      paymentStatus
    );

    return {
      state: paymentStatus.paymentStatus,
      method: paymentStatus.paymentMethod,
    };
  } else if (
    paymentStatus.paymentStatus === "Pending" && paymentStatus.paymentMethod === "REFERENCE") {
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
      orderDetails,
      paymentStatus
    );

    return {
      state: paymentStatus.paymentStatus,
      method: paymentStatus.paymentMethod,
      data: referenceViewModel,
    };
  } else if (paymentStatus.paymentMethod === "MBWAY") {
    return {
      state: paymentStatus.paymentStatus,
      method: paymentStatus.paymentMethod,
    };
  } else {
    throw new Error(
      "Lamentamos, mas não foi possível concluir o processo de pagamento."
    );
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
    console.error("Erro no webhook:", error);
    return null;
  }
}

async function processWebhookRequest(req) {
  const requestTag = req.headers["x-authentication-tag"];
  const requestVector = req.headers["x-initialization-vector"];
  const secretKey = Buffer.from(process.env.SECRET_KEY, "base64");
  const encryptedBody = await readRawBody(req);
  const ciphertext = Buffer.from(encryptedBody, "base64");
  const nonce = Buffer.from(requestVector, "base64");
  const tag = Buffer.from(requestTag, "base64");

  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", secretKey, nonce);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertext, null, "utf8");
    decrypted += decipher.final("utf8");

    const webhookModel = JSON.parse(decrypted);
    return webhookModel;
  } catch (error) {
    throw new Error("Erro ao processar o webhook");
  }
}

function generateWebhookResponse(model) {
  return {
    statusMsg: "Success",
    statusCode: "200",
    notificationID: model.notificationID,
  };
}

async function readRawBody(req) {
  return await getRawBody(req, { encoding: "utf-8" });
}

module.exports = { SIBSForm, checkPaymentStatus, processPayment, webhook, generateWebhookResponse };