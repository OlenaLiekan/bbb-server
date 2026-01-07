const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const { Kit } = require('../models/models');
const ApiError = require('../error/ApiError');
const { upload } = require('../cloudinary');

class KitController {
  async create(req, res, next) {
    try {
      let {
        name,
        price,
        discountPrice,
        isPromo,
        categoryId,
        brandId,
        typeId,
        isLashes,
        newProduct,
      } = req.body;

      let fileName = null;

      if (req.files) {
        const { img } = req.files;
        const fileTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!fileTypes.includes(img.mimetype)) {
          return res.send('Image formats supported: JPG, PNG, JPEG');
        }
        const cloudFile = await upload(img.tempFilePath);
        fileName = cloudFile.secure_url.split('/').pop();
      }

      const kit = await Kit.create({
        name,
        price,
        discountPrice,
        isPromo,
        categoryId,
        brandId,
        typeId,
        img: fileName,
        isLashes,
        newProduct,
      });

      return res.json(kit);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async update(req, res, next) {
    const { id } = req.params;
    let { name, price, discountPrice, isPromo, categoryId, brandId, typeId, isLashes, newProduct } =
      req.body;

    const { img } = req.files ? req.files : '';

    let fileName = '';

    if (img) {
      const cloudFile = await upload(img.tempFilePath);
      fileName = cloudFile.secure_url.split('/').pop();
    }

    const options = { where: { id: id } };
    let props = {};

    if (img) {
      props = { ...props, img: fileName };
    }
    if (name) {
      props = { ...props, name };
    }

    if (price) {
      props = { ...props, price };
    }
    if (brandId) {
      props = { ...props, brandId };
    }
    if (typeId) {
      props = { ...props, typeId };
    }

    props = {
      ...props,
      isLashes,
      isPromo,
      categoryId,
      discountPrice,
      newProduct,
    };

    const kit = await Kit.update(props, options);

    return res.json(kit);
  }

  async getAll(req, res) {
    const { name } = req.query;

    let options = {
      distinct: true,
      where: {},
    };

    if (name) {
      options.where = { ...options.where, name: { [Op.iLike]: `%${name}%` } };
    }

    const kits = await Kit.findAll(options);

    return res.json(kits);
  }

  async getOne(req, res) {
    try {
      const { id } = req.params;
      const kit = await Kit.findOne({
        where: { id },
      });
      return res.json(kit);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }
}

module.exports = new KitController();
