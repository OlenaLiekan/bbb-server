const { Promocode } = require('../models/models');
const ApiError = require('../error/ApiError');

class PromocodeController {
  async create(req, res, next) {
    try {
      const { name, value, newMember, reusable, brandId } = req.body;
      const promocode = await Promocode.create({ name, value, newMember, reusable, brandId });
      return res.json(promocode);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async getOne(req, res) {
    const { id } = req.params;
    const promocode = await Promocode.findOne({
      where: { id },
    });
    return res.json(promocode);
  }

  async getAll(req, res) {
    const promocodes = await Promocode.findAll({
      order: [['id', 'ASC']],
    });
    return res.json(promocodes);
  }

  async destroy(req, res) {
    const { id } = req.query;
    const promocode = await Promocode.destroy({
      where: { id },
    });
    return res.json(promocode);
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, value, newMember, reusable, brandId } = req.body;
      const options = { where: { id: id } };
      let props = {};
      if (name) {
        props = { ...props, name };
      }
      if (value) {
        props = { ...props, value };
      }
      props = { ...props, newMember };
      props = { ...props, reusable };
      props = { ...props, brandId };
      const promocode = await Promocode.update(props, options);
      return res.json(promocode);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }
}

module.exports = new PromocodeController();
