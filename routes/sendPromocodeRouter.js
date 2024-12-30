const Router = require('express');
const router = new Router();
const sendPromocodeController = require('../controllers/sendPromocodeController');

router.post('/', sendPromocodeController.sendToNewMember);

module.exports = router;
