const ApiError = require('../error/ApiError');
const sendEmail = require('../sendEmail');
const { UserOrder, OrderItem } = require('../models/models');

class MailController {
  async send(req, res, next) {
    const {
      userEmail,
      userName,
      userSurname,
      orderNumber,
      userCompany,
      userAddress,
      userPostalCode,
      userComment,
      userPhone,
      userOrder,
      paymentList,
    } = req.body;
    try {
      if (!userEmail || !userName || !orderNumber) {
        return next(ApiError.badRequest('Missing required fields: email, name or order number'));
      }

      const userOrder = await UserOrder.findOne({
        where: { orderNumber: orderNumber },
        include: [
          {
            model: OrderItem,
            as: 'item',
          },
        ],
      });

      if (!userOrder || !userOrder.item || userOrder.item.length === 0) {
        throw ApiError.badRequest('Nenhum item encontrado para este pedido.');
      }

      const orderItems = userOrder.item.map(orderItem => {
        const descriptionLines = orderItem.description.split('\n');
        const priceIndex = descriptionLines.findIndex(line => line.startsWith('Preço:'));
        const hasOptions = descriptionLines.some(line => line.startsWith('Opções:'));

        const descriptionObject = {
          name: orderItem.title,
          company: descriptionLines[0].replace('Marca: ', ''),
          code: descriptionLines[1].replace('Código: ', ''),
          price: parseFloat(
            descriptionLines[priceIndex].replace('Preço: ', '').replace(' €', '')
          ).toFixed(2),
          count: parseInt(
            descriptionLines[descriptionLines.length - 1].replace('Quantidade: ', '')
          ),
          isLashes: hasOptions,
          info: {},
          img: orderItem.img,
        };

        descriptionLines.slice(2, priceIndex).forEach(line => {
          const cleanLine = line.startsWith(',') ? line.slice(1).trim() : line.trim();
          if (line.startsWith('Opções:')) {
            const options = cleanLine.replace('Opções: ', '').split(' / ');
            descriptionObject.curlArr = options[0];
            descriptionObject.thicknessArr = options[1];
            descriptionObject.lengthArr = options[2];
          } else {
            const [title, description] = cleanLine.split(':').map(part => part.trim());
            descriptionObject.info[title] = description;
          }
        });

        return descriptionObject;
      });

      const totalCount = orderItems.reduce((total, item) => total + item.count, 0);
      const deliveryPrice = userOrder.deliveryPrice;
      const totalPrice = userOrder.sum;
      const promocodeName = userOrder.promocodeName;
      const promocodeValue = userOrder.promocodeValue;
      const orderHTML = sendEmail.formatOrderToHTML(
        orderItems,
        totalCount,
        deliveryPrice,
        totalPrice,
        promocodeName,
        promocodeValue
      );
      await sendEmail(
        userEmail,
        userName,
        userSurname,
        orderNumber,
        userCompany,
        userAddress,
        userPostalCode,
        userComment,
        userPhone,
        orderHTML,
        paymentList
      );
      return res.json({
        success: true,
        message: 'Email sent successfully',
      });
    } catch (error) {
      console.error(`[mailController] Email sending failed: `, error);
      if (
        error.message.includes('missing required fields') ||
        error.message.includes('Nenhum item encontrado')
      ) {
        next(ApiError.badRequest(error.message));
      } else {
        next(ApiError.internal(error.message || 'Failed to send email'));
      }
    }
  }
}
module.exports = new MailController();
