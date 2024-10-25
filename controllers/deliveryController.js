const { DeliveryPrice } = require('../models/models');
const ApiError = require('../error/ApiError');

class DeliveryController {
  async create(req, res, next) {
    try {
      const { price, type, requiredSum } = req.body;
      const delivery = await DeliveryPrice.create({ price, type, requiredSum });
      return res.json(delivery);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async getOne(req, res) {
    const { id } = req.params;
    const delivery = await DeliveryPrice.findOne({
      where: { id },
    });
    return res.json(delivery);
  }

  async getAll(req, res) {
    const deliveries = await DeliveryPrice.findAll({
      order: [['id', 'ASC']],
    });
    return res.json(deliveries);
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { price, type, requiredSum } = req.body;
      const options = { where: { id: id } };
      let props = {};
      if (price) {
        props = { ...props, price };
      }
      if (requiredSum) {
        props = { ...props, requiredSum };
      }
      if (type) {
        props = { ...props, type };
      }
      const delivery = await DeliveryPrice.update(props, options);
      return res.json(delivery);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }
}

module.exports = new DeliveryController();
