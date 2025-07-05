const express = require('express');
const { registerUser, loginUser, getLoggedInUser, updateUser, uploadFile } = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../config/upload');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/user', getLoggedInUser);
router.post('/upload',authMiddleware,upload.single('file'),uploadFile)
router.put('/updateUser',authMiddleware, updateUser);

module.exports = router;