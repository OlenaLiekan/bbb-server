const Router = require('express');

const router = new Router();

const kitRouter = require('./kitRouter');
const productRouter = require('./productRouter');
const userRouter = require('./userRouter');
const brandRouter = require('./brandRouter');
const typeRouter = require('./typeRouter');
const categoryRouter = require('./categoryRouter');
const slideRouter = require('./slideRouter');
const logoRouter = require('./logoRouter');
const ratingRouter = require('./ratingRouter');
const reviewRouter = require('./reviewRouter');
const replyRouter = require('./replyRouter');
const deliveryRouter = require('./deliveryRouter');
const paymentRouter = require('./paymentRouter');
const mailRouter = require('./mailRouter');
const newPassRouter = require('./newPassRouter');
const sendPromocodeRouter = require('./sendPromocodeRouter');
const promocodeRouter = require('./promocodeRouter');
const promotionRouter = require('./promotionRouter');
const sibsRouter = require('./sibsRouter');
const tickerRouter = require('./tickerRouter');

router.use('/user', userRouter);
router.use('/type', typeRouter);
router.use('/brand', brandRouter);
router.use('/product', productRouter);
router.use('/kit', kitRouter);
router.use('/category', categoryRouter);
router.use('/slide', slideRouter);
router.use('/rating', ratingRouter);
router.use('/review', reviewRouter);
router.use('/reply', replyRouter);
router.use('/delivery', deliveryRouter);
router.use('/payment', paymentRouter);
router.use('/logo', logoRouter);
router.use('/ticker', tickerRouter);
router.use('/send-email', mailRouter);
router.use('/reset-password', newPassRouter);
router.use('/newMember', sendPromocodeRouter);
router.use('/promocode', promocodeRouter);
router.use('/promotion', promotionRouter);
router.use('/sibs', sibsRouter);

module.exports = router;
