const ApiError = require('../error/ApiError');
const { PaymentInformation, UserOrder, OrderItem, UserAddress } = require('../models/models');
const sibs = require('../sibs');
const email = require('../sendEmail');
const { options } = require('../db');
const ordersInMemory = {};

class SIBSController {
  async Form(req, res, next) {
    const {
      userEmail,
      userName,
      userSurname,
      orderNumber,
      userCompany,
      userAddress,
      userPostalCode,
      userComment,
      userPhone,
      userOrder,
      paymentList,
      sum,
      countryCode,
    } = req.body;
    try {
      const paymentResponse = await sibs.SIBSForm(
        userEmail,
        userName,
        userSurname,
        orderNumber,
        userCompany,
        userAddress,
        userPostalCode,
        userComment,
        userPhone,
        userOrder,
        paymentList,
        sum,
        countryCode
      );

      return res.json(paymentResponse);
    } catch (error) {
      next(ApiError.badRequest(error.message));
    }
  }

  async getAll(req, res) {
    const { paymentStatus } = req.query;
    let options = {
      where: {},
      order: [['startTime', 'DESC']],
    };
    if (paymentStatus) {
      options.where = { ...options.where, paymentStatus };
    }
    const paymentInformations = await PaymentInformation.findAll(options);
    return res.json(paymentInformations);
  }

  async FormHandler(req, res, next) {
    const { id, resourcePath, orderId } = req.query;
    const orderData = ordersInMemory[orderId];

    if (!id || !resourcePath || !orderId) {
      const error = encodeURIComponent('Missing required parameters.');
      return res.redirect(`${process.env.FRONT_END}/#/order?error=${error}`);
    }

    if (!orderData) {
      const error = encodeURIComponent('Missing required orderData.');
      return res.redirect(`${process.env.FRONT_END}/#/order?error=${error}`);
    }

    try {
      const paymentStatus = await sibs.checkPaymentStatus(id, resourcePath);

      if (paymentStatus) {
        const result = await sibs.processPayment(orderData, paymentStatus);

        if (result.state === 'Success') {
          return res.redirect(`${process.env.FRONT_END}/#/send-email?method=${result.method}`);
        } else if (result.state === 'Pending' && result.method === 'REFERENCE') {
          const referenceData = encodeURIComponent(JSON.stringify(result.data));
          return res.redirect(
            `${process.env.FRONT_END}/#/send-email?method=${result.method}&data=${referenceData}`
          );
        } else if (result.state === 'Pending' && result.method === 'MBWAY') {
          return res.redirect(
            `${process.env.FRONT_END}/#/sibs-mbway?phone=${encodeURIComponent(
              paymentStatus.token.value
            )}&transactionID=${encodeURIComponent(paymentStatus.transactionID)}`
          );
        }

        const error = encodeURIComponent('O pagamento foi cancelado, por favor, tente novamente.');
        return res.redirect(`${process.env.FRONT_END}/#/order?error=${error}`);
      } else {
        const error = encodeURIComponent('Erro ao verificar o pagamento.');
        return res.redirect(`${process.env.FRONT_END}/#/order?error=${error}`);
      }
    } catch (error) {
      const encodedError = encodeURIComponent(error.message);
      return res.redirect(`${process.env.FRONT_END}/#/order?error=${encodedError}`);
    }
  }

  async SaveOrder(req, res) {
    const { orderId } = req.body;

    ordersInMemory[orderId] = req.body;

    res.status(200).json({ success: true });
  }

  async Confirmed(req, res) {
    try {
      const webhookModel = await sibs.webhook(req);

      if (!webhookModel) {
        return res.status(500).json({ message: 'Erro ao processar o conteúdo do webhook.' });
      }

      const order = await PaymentInformation.findOne({
        where: { transactionID: webhookModel.transactionID },
      });

      if (order) {
        order.paymentStatus = webhookModel.paymentStatus;
        await order.save();

        if (webhookModel.paymentStatus === 'Success') {
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
                count: parseInt(
                  descriptionLines[descriptionLines.length - 1].replace('Quantidade: ', '')
                ),
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
            const orderHTML = email.formatOrderToHTML(
              orderItems,
              totalCount,
              deliveryPrice,
              totalPrice
            );
            const customerAddress = await UserAddress.findOne({
              where: { email: order.customerEmail },
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
          } catch (error) {
            console.error(`Erro durante o processamento do email: ${error.message}`);
          }
        }
      }

      return res.json(sibs.generateWebhookResponse(webhookModel));
    } catch (error) {
      return res.status(500).json({ message: 'Erro no processamento do webhook.' });
    }
  }

  async checkPayment(req, res, next) {
    try {
      const { transactionID } = req.body;

      if (!transactionID) {
        return res.status(400).json({ success: false, message: 'O transactionID é necessário.' });
      }

      const paymentStatus = await sibs.checkPaymentStatus(transactionID);

      if (paymentStatus) {
        if (paymentStatus.paymentStatus === 'Success') {
          return res.json({ success: true });
        } else if (paymentStatus.paymentStatus === 'Declined') {
          return res
            .status(400)
            .json({ success: false, message: 'O pagamento foi rejeitado, tente novamente.' });
        } else {
          return res
            .status(400)
            .json({ success: false, message: 'Excedeu o tempo limite para pagamento.' });
        }
      }

      return res.status(500).json({
        success: false,
        message:
          'Lamentamos, mas não foi possível concluir o processo de pagamento. Por favor, tente novamente.',
      });
    } catch (error) {
      next(error);
    }
  }

  async checkPaymentStatus(req, res, next) {
    try {
      const { transactionID } = req.body;

      const order = await PaymentInformation.findOne({
        where: { transactionID: transactionID },
      });

      if (order) {
        return res.json({ success: true, paymentStatus: order.paymentStatus });
      } else {
        return res.status(404).json({ success: false, message: 'Pedido não encontrado.' });
      }
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SIBSController();
