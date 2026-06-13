const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9]{10,15}$/;
const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

const sendValidationError = (res, message) =>
  res.status(400).json({
    success: false,
    message,
  });

const isStrongEnoughPassword = (password) => typeof password === "string" && passwordComplexityRegex.test(password);

const passwordStrengthMessage = "Password must be at least 8 characters long and include an uppercase letter, lowercase letter, number, and special character (@$!%*?&#)";

const validateRegister = (req, res, next) => {
  const { firstName, lastName, email, phone, password } = req.body;

  if (!firstName || String(firstName).trim().length < 3) {
    return sendValidationError(res, "First name must be at least 3 characters");
  }
  if (!lastName || String(lastName).trim().length < 3) {
    return sendValidationError(res, "Last name must be at least 3 characters");
  }
  if (!email || !emailPattern.test(String(email).trim())) {
    return sendValidationError(res, "Enter a valid email address");
  }
  if (!phone || !phonePattern.test(String(phone).trim())) {
    return sendValidationError(res, "Phone number must be 10 to 15 digits");
  }
  if (!isStrongEnoughPassword(password)) {
    return sendValidationError(res, passwordStrengthMessage);
  }

  return next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !emailPattern.test(String(email).trim())) {
    return sendValidationError(res, "Enter a valid email address");
  }
  if (!password) {
    return sendValidationError(res, "Password is required");
  }

  return next();
};

const validateForgotPassword = (req, res, next) => {
  const { email } = req.body;

  if (!email || !emailPattern.test(String(email).trim())) {
    return sendValidationError(res, "Enter a valid email address");
  }

  return next();
};

const validateResetPassword = (req, res, next) => {
  const token = req.params.token || req.body.token;
  const { password } = req.body;

  if (!token) {
    return sendValidationError(res, "Reset token is required");
  }
  if (!isStrongEnoughPassword(password)) {
    return sendValidationError(res, passwordStrengthMessage);
  }

  return next();
};

const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword) {
    return sendValidationError(res, "Current password is required");
  }
  if (!isStrongEnoughPassword(newPassword)) {
    return sendValidationError(res, passwordStrengthMessage);
  }
  if (currentPassword === newPassword) {
    return sendValidationError(res, "New password must be different from current password");
  }

  return next();
};

const validateProfileUpdate = (req, res, next) => {
  const { firstName, lastName, email, phone } = req.body;

  if (firstName !== undefined && String(firstName).trim().length < 3) {
    return sendValidationError(res, "First name must be at least 3 characters");
  }
  if (lastName !== undefined && String(lastName).trim().length < 3) {
    return sendValidationError(res, "Last name must be at least 3 characters");
  }
  if (email !== undefined && !emailPattern.test(String(email).trim())) {
    return sendValidationError(res, "Enter a valid email address");
  }
  if (phone !== undefined && !phonePattern.test(String(phone).trim())) {
    return sendValidationError(res, "Phone number must be 10 to 15 digits");
  }

  return next();
};

module.exports = {
  validateChangePassword,
  validateForgotPassword,
  validateLogin,
  validateRegister,
  validateResetPassword,
  validateProfileUpdate,
};
