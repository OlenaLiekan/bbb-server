const { Category } = require('../models/models');
const ApiError = require('../error/ApiError');

class CategoryController {
  async create(req, res, next) {
    try {
      const { name, subMenu, position } = req.body;
      const category = await Category.create({ name, subMenu, position });
      return res.json(category);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async getAll(req, res) {
    const categories = await Category.findAll({
      order: [['id', 'ASC']],
    });
    return res.json(categories);
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { position, name } = req.body;
      const options = { where: { id: id } };
      let props = {};
      if (position) {
        props = { ...props, position };
      }
      if (name) {
        props = { ...props, name };
      }
      const category = await Category.update(props, options);
      return res.json(category);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }
}

module.exports = new CategoryController();
