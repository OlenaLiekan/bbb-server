const { Slide } = require('../models/models');
const ApiError = require('../error/ApiError');
const { upload } = require('../cloudinary');

class SlideController {
  async create(req, res, next) {
    try {
      const { img } = req.files;
      const { url } = req.body;
      const cloudFile = await upload(img.tempFilePath);
      const fileName = cloudFile.secure_url.split('/').pop();
      const slide = await Slide.create({ img: fileName, url });
      return res.json(slide);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async update(req, res) {
    const { id } = req.params;
    let { url } = req.body;

    const { img } = req.files ? req.files : '';

    const options = { where: { id: id } };
    let props = {};

    if (url) {
      props = { ...props, url };
    }
    if (img) {
      const cloudFile = await upload(img.tempFilePath);
      const fileName = cloudFile.secure_url.split('/').pop();
      props = { ...props, img: fileName };
    }
    const slide = await Slide.update(props, options);
    return res.json(slide);
  }

  async destroy(req, res) {
    const { id } = req.query;
    const slide = await Slide.destroy({
      where: { id },
    });
    return res.json(slide);
  }

  async getAll(req, res) {
    const slides = await Slide.findAll();
    return res.json(slides);
  }
  async getOne(req, res) {
    const { id } = req.params;
    const slide = await Slide.findOne({
      where: { id },
    });
    return res.json(slide);
  }
}

module.exports = new SlideController();
