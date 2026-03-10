const Router = require('express');
const router = new Router();
const tickerController = require('../controllers/tickerController');
const checkRole = require('../middleware/checkRoleMiddleware');

router.get('/:id', tickerController.getOne);
router.patch('/:id', checkRole('ADMIN'), tickerController.update);

module.exports = router;
