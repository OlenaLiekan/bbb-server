const Router = require('express');

const router = new Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/registration', userController.registration);
router.post('/login', userController.login);
router.get('/auth', authMiddleware, userController.refreshToken);
router.get('/:id', userController.getById);
router.get('/', userController.getOne);
router.get('/', userController.getAll);
router.patch('/:id', userController.update);
router.delete('/', userController.destroy);

module.exports = router;
