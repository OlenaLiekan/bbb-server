const { Ticker } = require('../models/models');
const ApiError = require('../error/ApiError');

class TickerController {
  async update(req, res) {
    const { id } = req.params;
    let { text } = req.body;

    const options = { where: { id: id } };
    let props = {};

    if (text) {
      props = { ...props, text };
    }
    const ticker = await Ticker.update(props, options);
    return res.json(ticker);
  }

  async getOne(req, res) {
    const { id } = req.params;
    const ticker = await Ticker.findOne({
      where: { id },
    });
    return res.json(ticker);
  }
}

module.exports = new TickerController();
