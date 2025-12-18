const Router = require('express');
const router = new Router();
const kitController = require('../controllers/kitController');
const checkRole = require('../middleware/checkRoleMiddleware');

router.post('/', checkRole('ADMIN'), kitController.create);
router.get('/', kitController.getAll);
router.get('/:id', kitController.getOne);
router.patch('/:id', checkRole('ADMIN'), kitController.update);

module.exports = router;
