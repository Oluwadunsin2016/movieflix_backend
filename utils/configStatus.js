const { hasMailConfig } = require("./sendEmail");

const hasValue = (key) => Boolean(String(process.env[key] || "").trim());

const parseOrigins = (value = "") =>
  String(value)
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

const getConfiguredOrigins = () => {
  const configuredOrigins = [
    ...parseOrigins(process.env.CLIENT_ORIGINS),
    ...parseOrigins(process.env.FRONTEND_URL),
    ...parseOrigins(process.env.CLIENT_URL),
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
  ];

  return [...new Set(configuredOrigins)];
};

const getConfigStatus = () => ({
  environment: process.env.NODE_ENV || "development",
  auth: {
    jwtSecretConfigured: hasValue("JWT_SECRET"),
    loginRateLimit: {
      max: Number(process.env.LOGIN_RATE_LIMIT_MAX || 8),
      windowMinutes: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MINUTES || 15),
    },
    passwordResetRateLimit: {
      max: Number(process.env.PASSWORD_RESET_RATE_LIMIT_MAX || 5),
      windowMinutes: Number(process.env.PASSWORD_RESET_RATE_LIMIT_WINDOW_MINUTES || 30),
    },
  },
  integrations: {
    youtubeConfigured: hasValue("YOUTUBE_API_KEY"),
    emailConfigured: hasMailConfig(),
    cloudinaryConfigured:
      hasValue("CLOUDINARY_CLOUD_NAME") &&
      hasValue("CLOUDINARY_API_KEY") &&
      hasValue("CLOUDINARY_API_SECRET"),
  },
  cors: {
    allowedOrigins: getConfiguredOrigins(),
  },
});

module.exports = {
  getConfigStatus,
  getConfiguredOrigins,
};
