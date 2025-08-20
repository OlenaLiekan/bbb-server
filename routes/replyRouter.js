const Router = require('express');
const router = new Router();
const replyController = require('../controllers/replyController');
const checkRole = require('../middleware/checkRoleMiddleware');

router.post('/', checkRole('ADMIN'), replyController.create);
router.get('/', replyController.getAll);
router.patch('/:id', checkRole('ADMIN'), replyController.update);

module.exports = router;
