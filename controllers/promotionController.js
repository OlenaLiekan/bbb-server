const Sequelize = require('sequelize');
const { Promotion, PromotionInfo } = require('../models/models');
const ApiError = require('../error/ApiError');

class PromotionController {
  async create(req, res, next) {
    try {
      let { name, startDate, finishDate, info } = req.body;

      const promotion = await Promotion.create({
        name,
        startDate,
        finishDate,
      });

      if (info) {
        info = JSON.parse(info);
        info.forEach(i =>
          PromotionInfo.create({
            title: i.title,
            description: i.description,
            promotionId: promotion.id,
          })
        );
      }
      return res.json(promotion);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async update(req, res, next) {
    const { id } = req.params;
    let { name, startDate, finishDate, info } = req.body;

    const options = { where: { id: id } };
    let props = {};

    if (name) {
      props = { ...props, name };
    }
    if (startDate) {
      props = { ...props, startDate };
    }
    if (finishDate) {
      props = { ...props, finishDate };
    }

    const promotion = await Promotion.update(props, options);

    if (info) {
      const promotionId = req.params.id;
      const infoOps = { where: { promotionId: promotionId } };
      PromotionInfo.destroy(infoOps);
      info = JSON.parse(info);
      info.forEach(i =>
        PromotionInfo.create({
          title: i.title,
          description: i.description,
          promotionId: promotionId,
        })
      );
    }

    return res.json(promotion);
  }

  async getAll(req, res) {
    let options = {
      order: [['id', 'DESC']],
      include: [{ model: PromotionInfo, as: 'info' }],
    };

    const promotions = await Promotion.findAll(options);
    return res.json(promotions);
  }
}

module.exports = new PromotionController();
