const express = require('express');
const {
  registerUser,
  loginUser,
  getLoggedInUser,
  updateUser,
  uploadFile,
  forgotPassword,
  resetPassword,
  changePassword,
} = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authRateLimiters } = require('../middlewares/rateLimiter');
const {
  validateChangePassword,
  validateForgotPassword,
  validateLogin,
  validateRegister,
  validateResetPassword,
  validateProfileUpdate,
} = require('../middlewares/authValidation');
const upload = require('../config/upload');
const router = express.Router();

router.post('/register', validateRegister, registerUser);
router.post('/login', authRateLimiters.login, validateLogin, loginUser);
router.post('/forgot-password', authRateLimiters.passwordReset, validateForgotPassword, forgotPassword);
router.post('/reset-password', authRateLimiters.passwordReset, validateResetPassword, resetPassword);
router.get('/reset-password/:token', (req, res) => {
  return res.status(405).json({
    success: false,
    message: "Open the Movieflix reset-password page from your email. This API endpoint only accepts PATCH requests with a new password.",
  });
});
router.patch('/reset-password/:token', authRateLimiters.passwordReset, validateResetPassword, resetPassword);
router.get('/user', getLoggedInUser);
router.post('/upload',authMiddleware,upload.single('file'),uploadFile)
router.put('/updateUser', authMiddleware, validateProfileUpdate, updateUser);
router.put('/change-password', authMiddleware, validateChangePassword, changePassword);
router.patch('/change-password', authMiddleware, validateChangePassword, changePassword);

module.exports = router;
