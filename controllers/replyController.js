const { Reply } = require('../models/models');
const ApiError = require('../error/ApiError');

class ReplyController {
  async create(req, res, next) {
    try {
      let { text, reviewId } = req.body;
      const reply = await Reply.create({ text, reviewId });
      return res.json(reply);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async getAll(req, res) {
    const replies = await Reply.findAll();
    return res.json(replies);
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { text } = req.body;
      const options = { where: { id: id } };
      let props = {};
      if (text) {
        props = { ...props, text };
      }
      const reply = await Reply.update(props, options);
      return res.json(reply);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }
}

module.exports = new ReplyController();
