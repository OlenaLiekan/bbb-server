const Router = require('express');
const router = new Router();
const promocodeController = require('../controllers/promocodeController');
const checkRole = require('../middleware/checkRoleMiddleware');

router.post('/', checkRole('ADMIN'), promocodeController.create);
router.get('/', promocodeController.getAll);
router.get('/:id', promocodeController.getOne);
router.delete('/', promocodeController.destroy);
router.patch('/:id', checkRole('ADMIN'), promocodeController.update);

module.exports = router;
