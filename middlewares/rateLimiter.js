const buckets = new Map();

const getClientKey = (req, scope) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : String(forwardedFor || req.ip || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
  const email = req.body?.email ? String(req.body.email).trim().toLowerCase() : "";

  return `${scope}:${ip}:${email}`;
};

const rateLimit = ({ limit, windowMs, scope, message }) => (req, res, next) => {
  const key = getClientKey(req, scope);
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (current.count >= limit) {
    const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
    res.set("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({
      success: false,
      message,
      retryAfterSeconds,
    });
  }

  current.count += 1;
  buckets.set(key, current);
  return next();
};

const authRateLimiters = {
  login: rateLimit({
    scope: "login",
    limit: Number(process.env.LOGIN_RATE_LIMIT_MAX || 8),
    windowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MINUTES || 15) * 60 * 1000,
    message: "Too many login attempts. Please wait and try again.",
  }),
  passwordReset: rateLimit({
    scope: "password-reset",
    limit: Number(process.env.PASSWORD_RESET_RATE_LIMIT_MAX || 5),
    windowMs: Number(process.env.PASSWORD_RESET_RATE_LIMIT_WINDOW_MINUTES || 30) * 60 * 1000,
    message: "Too many password reset attempts. Please wait and try again.",
  }),
};

module.exports = {
  authRateLimiters,
  rateLimit,
};
