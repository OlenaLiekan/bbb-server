const Router = require('express');
const router = new Router();
const slideController = require('../controllers/slideController');
const checkRole = require('../middleware/checkRoleMiddleware');

router.post('/', checkRole('ADMIN'), slideController.create);
router.get('/', slideController.getAll);
router.get('/:id', slideController.getOne);
router.delete('/', slideController.destroy);
router.patch('/:id', checkRole('ADMIN'), slideController.update);

module.exports = router;
