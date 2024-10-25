const Router = require('express');
const router = new Router();
const logoController = require('../controllers/logoController');
const checkRole = require('../middleware/checkRoleMiddleware');

router.get('/:id', logoController.getOne);
router.patch('/:id', checkRole('ADMIN'), logoController.update);

module.exports = router;
