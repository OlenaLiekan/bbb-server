const Router = require('express');
const router = new Router();
const sibsController = require('../controllers/sibsController');

router.post('/', sibsController.Form);
router.get('/formHandler', sibsController.FormHandler);
router.post('/saveOrder', sibsController.SaveOrder);
router.post('/Hook', sibsController.Confirmed);
router.post('/check-payment', sibsController.checkPayment);
router.post('/check-Status', sibsController.checkPaymentStatus);

module.exports = router;
