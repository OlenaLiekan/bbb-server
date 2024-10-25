const { PaymentDetails } = require('../models/models');
const ApiError = require('../error/ApiError');

class PaymentController {
  async create(req, res, next) {
    try {
      const { account, recipient } = req.body;
      const payment = await PaymentDetails.create({ account, recipient });
      return res.json(payment);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async getAll(req, res) {
    const payments = await PaymentDetails.findAll({
      order: [['id', 'ASC']],
    });
    return res.json(payments);
  }

  async getOne(req, res) {
    const { id } = req.params;
    const payment = await PaymentDetails.findOne({
      where: { id },
    });
    return res.json(payment);
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { account, recipient, available } = req.body;
      const options = { where: { id: id } };
      let props = {};
      if (account) {
        props = { ...props, account };
      }
      if (recipient) {
        props = { ...props, recipient };
      }
      props = { ...props, available };
      const payment = await PaymentDetails.update(props, options);
      return res.json(payment);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }
}

module.exports = new PaymentController();
