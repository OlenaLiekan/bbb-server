const { Logo } = require('../models/models');
const ApiError = require('../error/ApiError');
const { upload } = require('../cloudinary');

class LogoController {

  async update(req, res) {
    const { id } = req.params;
    let { logoName } = req.body;

    const { logoImg } = req.files ? req.files : '';

    const options = { where: { id: id } };
    let props = {};

    if (logoName) {
      props = { ...props, logoName };
    }
    if (logoImg) {
      const cloudFile = await upload(logoImg.tempFilePath);
      const fileName = cloudFile.secure_url.split('/').pop();
      props = { ...props, img: fileName };
    }
    const logo = await Logo.update(props, options);
    return res.json(logo);
  }

  async getOne(req, res) {
    const { id } = req.params;
    const logo = await Logo.findOne({
      where: { id },
    });
    return res.json(logo);
  }
}

module.exports = new LogoController();
