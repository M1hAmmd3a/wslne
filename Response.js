/**
 * response.js — مساعدات موحدة لردود الـ API
 */

const ok = (res, data = {}, status = 200) => {
    return res.status(status).json({ success: true, ...data });
};

const fail = (res, message, status = 400, details = null) => {
    const body = { success: false, error: message };
    if (details && process.env.NODE_ENV === 'development') body.details = details;
    return res.status(status).json(body);
};

const unauthorized = (res, message = 'غير مصرح') =>
    fail(res, message, 401);

const forbidden = (res, message = 'ممنوع') =>
    fail(res, message, 403);

const notFound = (res, message = 'غير موجود') =>
    fail(res, message, 404);

const serverError = (res, err) => {
    console.error('Server Error:', err);
    const message = process.env.NODE_ENV === 'development'
        ? err.message || 'خطأ داخلي'
        : 'خطأ داخلي في الخادم';
    return fail(res, message, 500);
};

module.exports = { ok, fail, unauthorized, forbidden, notFound, serverError };