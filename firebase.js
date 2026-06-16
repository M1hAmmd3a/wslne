/**
 * Firebase Admin SDK
 * يستخدم فقط في الـ Backend — مفاتيحه سرية تماماً
 * يقوم بـ:
 *  - التحقق من tokens المشرفين
 *  - قراءة/كتابة Firebase DB (مرحلياً حتى نكمل الانتقال)
 */
const admin = require('firebase-admin');
const path = require('path');

let _initialized = false;

const initFirebase = () => {
    if (_initialized) return admin;

    try {
        const serviceAccountPath = path.resolve(
            process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './src/config/serviceAccountKey.json'
        );
        const serviceAccount = require(serviceAccountPath);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: process.env.FIREBASE_DB_URL,
        });

        _initialized = true;
        console.log('✅ Firebase Admin initialized');
    } catch (err) {
        // في بيئة التطوير بدون ملف حقيقي — نكمل بدون Firebase
        console.warn('⚠️  Firebase Admin: serviceAccountKey.json غير موجود');
        console.warn('    ضع الملف في src/config/serviceAccountKey.json');
        console.warn('    أو حدد FIREBASE_SERVICE_ACCOUNT_PATH في .env');
    }

    return admin;
};

const getFirebaseAdmin = () => {
    if (!_initialized) initFirebase();
    return admin;
};

const getFirebaseDB = () => {
    const fb = getFirebaseAdmin();
    try {
        return fb.database();
    } catch {
        return null;
    }
};

module.exports = { initFirebase, getFirebaseAdmin, getFirebaseDB };