import rateLimit from "express-rate-limit";

// ─────────────────────────────────────────────────────────────
// SHARED RESPONSE HANDLER
// ─────────────────────────────────────────────────────────────
const rateLimitHandler = (req, res, next, options) => {
  res.status(options.statusCode).json({
    success: false,
    message: options.message,
    retryAfter: Math.ceil(options.windowMs / 1000 / 60), // minutes
  });
};

// ─────────────────────────────────────────────────────────────
// 1. GLOBAL LIMITER
// Protects all API endpoints from Denial-of-Service (DoS) attacks.
// Allows 100 requests per IP per 15 minutes.
// ─────────────────────────────────────────────────────────────
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,   // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,     // Disable X-RateLimit-* legacy headers
  handler: (req, res, next, options) => {
    rateLimitHandler(req, res, next, {
      ...options,
      message: "Too many requests from this IP. Please try again after 15 minutes.",
    });
  },
});

// ─────────────────────────────────────────────────────────────
// 2. AUTH LIMITER
// Protects login, register, forgot-password, reset-password
// from brute-force password attacks.
// Allows only 5 attempts per IP per 15 minutes.
// ─────────────────────────────────────────────────────────────
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
  handler: (req, res, next, options) => {
    rateLimitHandler(req, res, next, {
      ...options,
      message:
        "Too many failed login attempts from this IP. Please try again after 15 minutes.",
    });
  },
});

// ─────────────────────────────────────────────────────────────
// 3. PAYMENT LIMITER
// Protects /api/payments/initiate from payment spamming,
// card testing fraud and subscription abuse.
// Allows only 3 payment attempts per IP per 15 minutes.
// ─────────────────────────────────────────────────────────────
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    rateLimitHandler(req, res, next, {
      ...options,
      message:
        "Too many payment attempts from this IP. Please wait 15 minutes before trying again.",
    });
  },
});

// ─────────────────────────────────────────────────────────────
// 4. OTP / PASSWORD RESET LIMITER
// Protects forgot-password and reset-password from OTP/token
// spamming and email-bombing attacks.
// Allows only 3 requests per IP per 60 minutes.
// ─────────────────────────────────────────────────────────────
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    rateLimitHandler(req, res, next, {
      ...options,
      message:
        "Too many password reset requests. Please try again after 1 hour.",
    });
  },
});
