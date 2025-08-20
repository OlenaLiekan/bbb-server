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
}

module.exports = new ReplyController();
