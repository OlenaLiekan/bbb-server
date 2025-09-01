const Router = require('express');
const router = new Router();
const promotionController = require('../controllers/promotionController');
const checkRole = require('../middleware/checkRoleMiddleware');

router.post('/', checkRole('ADMIN'), promotionController.create);
router.get('/', promotionController.getAll);
router.patch('/:id', checkRole('ADMIN'), promotionController.update);
router.delete('/', promotionController.destroy);

module.exports = router;
