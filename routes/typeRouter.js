const Router = require('express');
const router = new Router();
const typeController = require('../controllers/typeController');
const checkRole = require('../middleware/checkRoleMiddleware');

router.post('/', checkRole('ADMIN'), typeController.create);
router.get('/', typeController.getAll);
router.get('/:id', typeController.getOne);
router.delete('/', typeController.destroy);
router.patch('/:id', checkRole('ADMIN'), typeController.update);

module.exports = router;
