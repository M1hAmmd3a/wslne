/**
 * rateLimit.js — حماية الـ APIs من الإساءة
 */
const rateLimit = require('express-rate-limit');

/* حد عام لكل الـ APIs */
const globalLimiter = rateLimit({
    windowMs: parseInt(process.env.GLOBAL_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.GLOBAL_RATE_LIMIT_MAX) || 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'طلبات كثيرة — حاول لاحقاً' },
});

/* حد صارم لطلبات OTP */
const otpLimiter = rateLimit({
    windowMs: parseInt(process.env.OTP_RATE_LIMIT_WINDOW_MS) || 2 * 60 * 1000,
    max: parseInt(process.env.OTP_RATE_LIMIT_MAX) || 3,
    keyGenerator: (req) => req.body?.phone || req.ip,
    message: { success: false, error: 'طلبات OTP كثيرة — انتظر دقيقتين' },
});

/* حد لتسجيل الدخول */
const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    keyGenerator: (req) => req.body?.phone || req.ip,
    message: { success: false, error: 'محاولات دخول كثيرة — انتظر 10 دقائق' },
});

/* حد لإرسال طلبات التاكسي من المستخدمين */
const userRequestLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 1,
    keyGenerator: (req) => req.user?.phone || req.ip,
    message: { success: false, error: 'يمكنك إرسال طلب واحد كل 5 دقائق' },
});

/* حد لـ GPS updates */
const gpsLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    keyGenerator: (req) => req.user?.id || req.ip,
    message: { success: false, error: 'تحديثات GPS كثيرة جداً' },
});

module.exports = {
    globalLimiter,
    otpLimiter,
    loginLimiter,
    userRequestLimiter,
    gpsLimiter,
};