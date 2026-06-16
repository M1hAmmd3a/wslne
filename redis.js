/**
 * Redis Client
 * يُستخدم لـ:
 *  - تخزين OTP codes (مع TTL تلقائي)
 *  - جلسات المستخدمين
 *  - مواقع GPS الحية
 *  - Rate limiting مخصص
 *
 * Fallback: إذا Redis غير متاح، يستخدم Map في الذاكرة (للتطوير فقط)
 */
const { createClient } = require('redis');

/* ── In-Memory Fallback (للتطوير بدون Redis) ── */
class MemoryStore {
    constructor() {
        this._store = new Map();
        this._timers = new Map();
        console.warn('⚠️  Redis غير متصل — يستخدم ذاكرة مؤقتة (للتطوير فقط)');
    }

    async get(key) {
        const item = this._store.get(key);
        if (!item) return null;
        if (item.expiresAt && Date.now() > item.expiresAt) {
            this._store.delete(key);
            return null;
        }
        return item.value;
    }

    async set(key, value) {
        this._store.set(key, { value });
        return 'OK';
    }

    async setEx(key, seconds, value) {
        if (this._timers.has(key)) clearTimeout(this._timers.get(key));
        this._store.set(key, { value, expiresAt: Date.now() + seconds * 1000 });
        const timer = setTimeout(() => this._store.delete(key), seconds * 1000);
        this._timers.set(key, timer);
        return 'OK';
    }

    async del(key) {
        if (this._timers.has(key)) clearTimeout(this._timers.get(key));
        this._store.delete(key);
        return 1;
    }

    async exists(key) {
        const val = await this.get(key);
        return val !== null ? 1 : 0;
    }

    async incr(key) {
        const val = parseInt((await this.get(key)) || '0') + 1;
        await this.set(key, String(val));
        return val;
    }

    async expire(key, seconds) {
        const item = this._store.get(key);
        if (!item) return 0;
        item.expiresAt = Date.now() + seconds * 1000;
        return 1;
    }
}

/* ── Redis Client ── */
let redisClient = null;
let _usingMemory = false;

const initRedis = async () => {
    if (redisClient) return redisClient;

    const url = process.env.REDIS_URL || 'redis://localhost:6379';

    try {
        const client = createClient({ url });

        client.on('error', (err) => {
            if (!_usingMemory) console.error('Redis error:', err.message);
        });
        client.on('connect', () => console.log('✅ Redis connected'));

        await client.connect();
        redisClient = client;
        return redisClient;
    } catch (err) {
        console.warn('⚠️  Redis connection failed:', err.message);
        console.warn('    يعمل بذاكرة مؤقتة — نصب Redis للإنتاج');
        _usingMemory = true;
        redisClient = new MemoryStore();
        return redisClient;
    }
};

const getRedis = () => {
    if (!redisClient) throw new Error('Redis لم يُهيَّأ — استدعِ initRedis() أولاً');
    return redisClient;
};

module.exports = { initRedis, getRedis };