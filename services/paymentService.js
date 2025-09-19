const { PaymentInformation, UserOrder, OrderItem, UserAddress } = require('../models/models');
const email = require('../sendEmail');

async function processPaymentWebhook(webhookModel) {
  console.log('[paymentService] Processing webhook:', webhookModel.transactionID);

  const order = await PaymentInformation.findOne({
    where: { transactionID: webhookModel.transactionID },
  });

  if (!order) {
    throw new Error(
      `[paymentService] Order not found for transactionID: ${webhookModel.transactionID}`
    );
  }

  order.paymentStatus = webhookModel.paymentStatus;

  if (webhookModel.paymentMethod === 'MBWAY' && webhookModel.token?.value) {
    order.phoneNumber = webhookModel.token.value;
    console.log(`[paymentService] MBWAY phone number saved: ${webhookModel.token.value}`);
  }

  if (webhookModel.paymentMethod === 'REFERENCE' && webhookModel.paymentReference) {
    order.reference = webhookModel.paymentReference.reference;
    order.entity = webhookModel.paymentReference.entity;
  }

  await order.save();
  console.log(`[paymentService] Order status updated to: ${webhookModel.paymentStatus}`);

  if (webhookModel.paymentStatus === 'Success') {
    await sendSuccessEmails(order, webhookModel);
  }

  return order;
}

async function sendSuccessEmails(order, webhookModel) {
  try {
    if (webhookModel.paymentMethod === 'REFERENCE') {
      webhookModel.paymentReference = {
        reference: order.reference,
        entity: order.entity,
      };
    }

    const userOrder = await UserOrder.findOne({
      where: { orderNumber: order.orderID },
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
    const customerAddress = await UserAddress.findOne({
      where: {
        email: order.customerEmail,
        mainAddress: true,
      },
    });

    if (!customerAddress) {
      throw new Error('Nenhum Cliente encontrado para este pedido.');
    }

    if (webhookModel.paymentMethod === 'REFERENCE') {
      await email.referencePaidEmail(
        customerAddress.email,
        customerAddress.firstName,
        customerAddress.lastName,
        order.orderID,
        customerAddress.company,
        `Rua: ${customerAddress.firstAddress}, Número da porta: ${customerAddress.secondAddress}, Código postal/ZIP: ${customerAddress.postalCode}, ${customerAddress.city}, ${customerAddress.region}, ${customerAddress.country}`,
        userOrder.userComment,
        customerAddress.phone,
        webhookModel.paymentStatus
      );

      await email.sendEmailToStore(
        customerAddress.email,
        customerAddress.firstName,
        customerAddress.lastName,
        order.orderID,
        customerAddress.company,
        `Rua: ${customerAddress.firstAddress}, Número da porta: ${customerAddress.secondAddress}, Código postal/ZIP: ${customerAddress.postalCode}, ${customerAddress.city}, ${customerAddress.region}, ${customerAddress.country}`,
        userOrder.userComment,
        customerAddress.phone,
        orderHTML
      );
    } else {
      email.sendCompletedEmail(
        customerAddress.email,
        customerAddress.firstName,
        customerAddress.lastName,
        order.orderID,
        customerAddress.company,
        `Rua: ${customerAddress.firstAddress}, Número da porta: ${customerAddress.secondAddress}, Código postal/ZIP: ${customerAddress.postalCode}, ${customerAddress.city}, ${customerAddress.region}, ${customerAddress.country}`,
        userOrder.userComment,
        customerAddress.phone,
        orderHTML,
        webhookModel
      );
    }
  } catch (emailError) {
    console.error(`[sendEmail] Email sending failed:: ${emailError.message}`);
    throw error;
  }
}

module.exports = { processPaymentWebhook };
