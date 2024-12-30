const ApiError = require('../error/ApiError');
const sendPromocode = require('../sendPromocode');

class SendPromocodeController {
  async sendToNewMember(req, res, next) {
    const { userEmail, userName, promocode, promocodeValue } = req.body;
    try {
      sendPromocode(userEmail, userName, promocode, promocodeValue);
      return res.json(req.body);
    } catch (error) {
      next(ApiError.badRequest(error.message));
    }
  }
}
module.exports = new SendPromocodeController();
