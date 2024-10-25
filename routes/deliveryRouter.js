const Router = require('express');
const router = new Router();
const deliveryController = require('../controllers/deliveryController');
const checkRole = require('../middleware/checkRoleMiddleware');

router.post('/', checkRole('ADMIN'), deliveryController.create);
router.get('/', deliveryController.getAll);
router.get('/:id', deliveryController.getOne);
router.patch('/:id', checkRole('ADMIN'), deliveryController.update);

module.exports = router;
