const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

/**
 * 20 requests/hour per user for AI endpoints.
 * Closes audit gap #7 (no rate limiting on AI endpoints).
 */
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: parseInt(process.env.AI_RATE_LIMIT_PER_HOUR) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many AI requests. You are limited to 20 requests per hour. Please try again later.',
    retryAfter: '1 hour',
  },
  keyGenerator: (req, res) => {
    if (req.user?.id) return `user:${req.user.id}`;
    return ipKeyGenerator(req, res);
  },
});

module.exports = { aiRateLimiter };
