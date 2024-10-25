const { Brand } = require('../models/models');
const ApiError = require('../error/ApiError');
const { upload } = require('../cloudinary');

class BrandController {
  async create(req, res, next) {
    try {
      const { name } = req.body;
      const { img } = req.files;
      const cloudFile = await upload(img.tempFilePath);
      const fileName = cloudFile.secure_url.split('/').pop();
      const brand = await Brand.create({ name, img: fileName });
      return res.json(brand);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async destroy(req, res) {
    const { id } = req.query;
    const brand = await Brand.destroy({
      where: { id },
    });
    return res.json(brand);
  }

  async update(req, res) {
    const { id } = req.params;
    let { name } = req.body;

    const { img } = req.files ? req.files : '';

    const options = { where: { id: id } };
    let props = {};

    if (name) {
      props = { ...props, name };
    }
    if (img) {
      const cloudFile = await upload(img.tempFilePath);
      const fileName = cloudFile.secure_url.split('/').pop();
      props = { ...props, img: fileName };
    }
    const brand = await Brand.update(props, options);
    return res.json(brand);
  }

  async getAll(req, res) {
    const brands = await Brand.findAll({
      order: [['id', 'ASC']],
    });
    return res.json(brands);
  }
  async getOne(req, res) {
    const { id } = req.params;
    const brand = await Brand.findOne({
      where: { id },
    });
    return res.json(brand);
  }
}

module.exports = new BrandController();
