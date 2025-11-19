const ApiError = require('../error/ApiError');
const { PaymentInformation, PendingWebhook } = require('../models/models');
const sibs = require('../sibs');
const { processPaymentWebhook } = require('../services/paymentService');
const ordersInMemory = {};

class SIBSController {
  async Form(req, res, next) {
    console.log('[SIBSController] SIBS Form called, orderNumber:', req.body.orderNumber);
    const {
      userId,
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
        userId,
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
    console.log('[SIBSController] FormHandler called, query:', req.query);
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
    console.log('[SIBSController] SaveOrder called, orderId:', req.body.orderId);
    const { orderId } = req.body;

    ordersInMemory[orderId] = req.body;

    res.status(200).json({ success: true });
  }

  async Confirmed(req, res) {
    console.log('[SIBSController] Webhook Confirmed received, headers:', req.headers);
    let webhookModel;
    try {
      webhookModel = await sibs.webhook(req);

      if (!webhookModel) {
        console.error('[SIBSController] Invalid webhook data received');
        return res.status(200).json({
          result: false,
          message: 'Invalid webhook data',
        });
      }

      console.log(
        `[sibsController] Processing webhook for transaction: ${webhookModel.transactionID}, status: ${webhookModel.paymentStatus}`
      );

      try {
        await processPaymentWebhook(webhookModel);
      } catch (processingError) {
        console.error(
          `[sibsController] Processing failed, saving to pending: ${processingError.message}`
        );

        await PendingWebhook.create({
          transactionID: webhookModel.transactionID,
          payload: JSON.stringify(webhookModel),
          paymentStatus: webhookModel.paymentStatus,
          paymentMethod: webhookModel.paymentMethod,
          errorReason: processingError.message,
        });
      }

      return res.json(sibs.generateWebhookResponse(webhookModel));
    } catch (error) {
      console.error('[SIBSController] Critical error in webhook processing:', error);

      let response;
      if (webhookModel && sibs && typeof sibs.generateWebhookResponse === 'function') {
        response = res.json(sibs.generateWebhookResponse(webhookModel));
      } else {
        response = res.status(200).json({ result: false, message: 'Webhook processing failed' });
      }

      return response;
    }
  }

  async checkPayment(req, res, next) {
    console.log('[SIBSController] checkPayment called, transactionID:', req.body.transactionID);
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
