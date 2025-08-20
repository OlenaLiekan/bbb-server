const Router = require('express');
const router = new Router();
const replyController = require('../controllers/replyController');

router.post('/', replyController.create);
router.get('/', replyController.getAll);

module.exports = router;
