const Router = require('express');
const router = new Router();
const paymentController = require('../controllers/paymentController');
const checkRole = require('../middleware/checkRoleMiddleware');

router.post('/', checkRole('ADMIN'), paymentController.create);
router.get('/', paymentController.getAll);
router.get('/:id', paymentController.getOne);
router.patch('/:id', checkRole('ADMIN'), paymentController.update);

module.exports = router;
