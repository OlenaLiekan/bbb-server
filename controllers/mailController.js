const ApiError = require('../error/ApiError');
const sendEmail = require('../sendEmail');

class MailController {
  async send(req, res, next) {
    const { userEmail, userName, userSurname, orderNumber, userAddress, userPhone, userOrder } =
      req.body;
    try {
      sendEmail(userEmail, userName, userSurname, orderNumber, userAddress, userPhone, userOrder);
      return res.json(req.body);
    } catch (error) {
      next(ApiError.badRequest(error.message));
    }
  }
}
module.exports = new MailController();
