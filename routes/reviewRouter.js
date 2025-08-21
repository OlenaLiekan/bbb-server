const Router = require('express');
const router = new Router();
const reviewController = require('../controllers/reviewController');

router.post('/', reviewController.create);
router.get('/', reviewController.getAll);
router.delete('/', reviewController.destroy);

module.exports = router;
