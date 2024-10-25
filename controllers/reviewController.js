const { Review } = require('../models/models');
const ApiError = require('../error/ApiError');

class ReviewController {
  async create(req, res, next) {
    try {
      let { text, userId, productId } = req.body;
      const review = await Review.create({ text, userId, productId });
      return res.json(review);
    } catch (e) {
      next(ApiError.badRequest(e.message));
    }
  }

  async getAll(req, res) {
    const reviews = await Review.findAll();
    return res.json(reviews);
  }
}

module.exports = new ReviewController();
