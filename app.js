/* ══════════════════════════════════════════════════
   منصة التاكسي — طولكرم | app.js
   Firebase Auth + Realtime Database
   ══════════════════════════════════════════════════ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, set, get, push, onValue, update, remove, off, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, signInAnonymously }
  from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
/* ══════════════════════════════════════════════════
   TENANT MAP  — uid → tenantId
   ضع هنا الـ UID من Firebase Console
   ══════════════════════════════════════════════════ */
const EMAIL_TO_TENANT = {
  'tk1@taxi.ps': 'tk1',
  'tk2@taxi.ps': 'tk2',
  'tk3@taxi.ps': 'tk3',
  'tk4@taxi.ps': 'tk4',
  'tk5@taxi.ps': 'tk5',
  'tk6@taxi.ps': 'tk6',
  'tk7@taxi.ps': 'tk7',
  'tk8@taxi.ps': 'tk8',
  'tk9@taxi.ps': 'tk9',
  'tk10@taxi.ps': 'tk10',
  'tk11@taxi.ps': 'tk11',
  'tk12@taxi.ps': 'tk12',
  'tk13@taxi.ps': 'tk13',
  'tk14@taxi.ps': 'tk14',
  'tk15@taxi.ps': 'tk15',
  'tk16@taxi.ps': 'tk16',
  'tk17@taxi.ps': 'tk17',
  'tk18@taxi.ps': 'tk18',
  'tk19@taxi.ps': 'tk19',
  'tk20@taxi.ps': 'tk20',
  'tk21@taxi.ps': 'tk21',
  'tk22@taxi.ps': 'tk22',
  'tk23@taxi.ps': 'tk23',
  'tk24@taxi.ps': 'tk24',
  'tk25@taxi.ps': 'tk25',
};
const TENANT_NAMES = {
  'tk1': 'مكتب طولكرم 1',
  'tk2': 'مكتب طولكرم 2',
  'tk3': 'مكتب طولكرم 3',
  'tk4': 'مكتب طولكرم 4',
  'tk5': 'مكتب طولكرم 5',
  'tk6': 'مكتب طولكرم 6',
  'tk7': 'مكتب طولكرم 7',
  'tk8': 'مكتب طولكرم 8',
  'tk9': 'مكتب طولكرم 9',
  'tk10': 'مكتب طولكرم 10',
  'tk11': 'مكتب طولكرم 11',
  'tk12': 'مكتب طولكرم 12',
  'tk13': 'مكتب طولكرم 13',
  'tk14': 'مكتب طولكرم 14',
  'tk15': 'مكتب طولكرم 15',
  'tk16': 'مكتب طولكرم 16',
  'tk17': 'مكتب طولكرم 17',
  'tk18': 'مكتب طولكرم 18',
  'tk19': 'مكتب طولكرم 19',
  'tk20': 'مكتب طولكرم 20',
  'tk21': 'مكتب طولكرم 21',
  'tk22': 'مكتب طولكرم 22',
  'tk23': 'مكتب طولكرم 23',
  'tk24': 'مكتب طولكرم 24',
  'tk25': 'مكتب طولكرم 25'
};

/* ── كود الدعوة لكل مكتب (يظهر في صفحة الملف الشخصي للمشرف) ── */
const TENANT_INVITE = {
  'tk1': 'INV-TLK1-X9M7Q3R', 'tk2': 'INV-TLK2-P5W8N2K', 'tk3': 'INV-TLK3-H4B6V1Q',
  'tk4': 'INV-TLK4-W2Z9S5Y', 'tk5': 'INV-TLK5-F7X3K8U', 'tk6': 'INV-TLK6-R1J4A6O',
  'tk7': 'INV-TLK7-C8T2E9I', 'tk8': 'INV-TLK8-G3N7D4A', 'tk9': 'INV-TLK9-L6S1Z8E',
  'tk10': 'INV-TLK10-M5Y3J7F', 'tk11': 'INV-TLK11-B9U6K2W', 'tk12': 'INV-TLK12-Q4O8T5D',
  'tk13': 'INV-TLK13-V7H2S1N', 'tk14': 'INV-TLK14-Y1C5R9G', 'tk15': 'INV-TLK15-D6V3W4M',
  'tk16': 'INV-TLK16-K2I7U8B', 'tk17': 'INV-TLK17-N8Q4X3T', 'tk18': 'INV-TLK18-Z5F9H6U',
  'tk19': 'INV-TLK19-E3P1M7V', 'tk20': 'INV-TLK20-I7W5G2K', 'tk21': 'INV-TLK21-T4L8N6R',
  'tk22': 'INV-TLK22-S9Z2B4H', 'tk23': 'INV-TLK23-A1M6V8P', 'tk24': 'INV-TLK24-J3E7W5Q',
  'tk25': 'INV-TLK25-O6K4R9Z',
};

/* ── SHA-256 (للسائقين فقط) ── */
const _h = async s => {
  const b = new TextEncoder().encode(s);
  const d = await crypto.subtle.digest('SHA-256', b);
  return Array.from(new Uint8Array(d)).map(x => x.toString(16).padStart(2, '0')).join('');
};

/* ══════════════════════════════════════════════════
   FIREBASE INIT
   ══════════════════════════════════════════════════ */
const _DB_URL = "https://hamode-a2ac1-default-rtdb.firebaseio.com/";

const firebaseConfig = {
  apiKey: "AIzaSyBefjpLw7ju5z7Pc7UZFGpOPJcKCHGD9f4",
  authDomain: "hamode-a2ac1.firebaseapp.com",
  databaseURL: _DB_URL,
  projectId: "hamode-a2ac1",
  storageBucket: "hamode-a2ac1.firebasestorage.app",
  messagingSenderId: "1005224583727",
  appId: "1:1005224583727:web:ea0befa1db595ab48adcda"
};

const _app = initializeApp(firebaseConfig, "main");

const _db = getDatabase(_app);
const _auth = getAuth(_app);



let TENANT_ID = '';
let TENANT_INFO = null;

const T = path => `tenants/${TENANT_ID || 'default'}/${path}`;
const tRef = path => ref(_db, T(path));

/* ══════════════════════════════════════════════════
   GPS
   ══════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════
   GPS
   ══════════════════════════════════════════════════ */
const GPS_INTERVAL = 90000;
const GPS_MIN_DIST = 20;
let _gpsWatcher = null;
let _gpsLastSent = 0;
let _gpsLastLat = null;
let _gpsLastLng = null;
let _gpsSendTimer = null;
let _gpsFailCount = 0;
let _gpsRetryTimer = null;
let _gpsWatchFail = 0;
const GPS_MAX_FAIL = 3;

const _gpsOnError = (err, source) => {
  _gpsFailCount++;
  _gpsWatchFail++;

  const reasons = {
    1: 'رفضت الإذن بالوصول للموقع',
    2: 'تعذّر تحديد الموقع',
    3: 'انتهت مهلة تحديد الموقع',
  };
  const msg = reasons[err?.code] || 'خطأ غير معروف في GPS';

  if (_gpsFailCount === 1) {
    toast('warn', '⚠️ تحذير GPS', msg);
    const el = $('gpsStatus');
    if (el) el.innerHTML = `<i class="fas fa-location-dot" style="color:var(--amber);margin-left:3px"></i>GPS: ⚠️ ${msg}`;
  }

  if (_gpsFailCount >= GPS_MAX_FAIL) {
    toast('err', '❌ GPS متوقف', 'تعذّر تحديد موقعك — يرى المشرف موقعك القديم');
    vibrate([300, 100, 300]);
    const el = $('gpsStatus');
    if (el) el.innerHTML = `<i class="fas fa-location-dot" style="color:var(--red);margin-left:3px"></i>GPS: ❌ متوقف — ${msg}`;
    _gpsFailCount = 0;
  }

  if (_gpsWatchFail >= 2 && source === 'watch') {
    _gpsWatchFail = 0;
    if (_gpsWatcher !== null) {
      try { navigator.geolocation.clearWatch(_gpsWatcher); } catch (e) { }
      _gpsWatcher = null;
    }
    if (_gpsRetryTimer) clearTimeout(_gpsRetryTimer);
    _gpsRetryTimer = setTimeout(() => {
      if (!CU || CR !== 'driver') return;
      toast('info', '🔄 إعادة تشغيل GPS', '');
      _startWatchPosition(CU.id);
    }, 5000);
  }
};

const _startWatchPosition = drvId => {
  if (_gpsWatcher !== null) {
    try { navigator.geolocation.clearWatch(_gpsWatcher); } catch (e) { }
    _gpsWatcher = null;
  }
  /* iOS: enableHighAccuracy false وtimeout طويل */
  _gpsWatcher = navigator.geolocation.watchPosition(
    pos => {
      _gpsWatchFail = 0;
      _gpsFailCount = 0;
      const { latitude: lat, longitude: lng } = pos.coords;
      const now = Date.now();
      if (_gpsLastLat !== null) {
        const dist = Math.sqrt((_gpsLastLat - lat) ** 2 + (_gpsLastLng - lng) ** 2) * 111320;
        if (dist < GPS_MIN_DIST && now - _gpsLastSent < GPS_INTERVAL) return;
      }
      if (now - _gpsLastSent < GPS_INTERVAL) return;
      sendGPS(drvId, lat, lng, false);
    },
    err => _gpsOnError(err, 'watch'),
    { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 }
  );
};

const startGPS = drvId => {
  stopGPS();
  if (!navigator.geolocation) {
    toast('err', '❌ GPS غير مدعوم', 'متصفحك لا يدعم تحديد الموقع');
    const el = $('gpsStatus');
    if (el) el.innerHTML = `<i class="fas fa-location-dot" style="color:var(--red);margin-left:3px"></i>GPS: ❌ غير مدعوم`;
    return;
  }

  /* iOS يحتاج أول طلب بـ enableHighAccuracy: false وtimeout طويل */
  navigator.geolocation.getCurrentPosition(
    pos => {
      _gpsFailCount = 0;
      sendGPS(drvId, pos.coords.latitude, pos.coords.longitude, true);
      _startWatchPosition(drvId);
    },
    err => {
      /* إذا فشل الأول حاول مرة ثانية بإعدادات أخف */
      navigator.geolocation.getCurrentPosition(
        pos => {
          _gpsFailCount = 0;
          sendGPS(drvId, pos.coords.latitude, pos.coords.longitude, true);
          _startWatchPosition(drvId);
        },
        err2 => {
          _gpsOnError(err2, 'initial');
          /* حتى لو فشل GPS ابدأ الـ watch عشان يحاول لاحقاً */
          _startWatchPosition(drvId);
        },
        { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 }
      );
    },
    { enableHighAccuracy: false, timeout: 30000, maximumAge: 0 }
  );

  /* Timer للإرسال كل 90 ثانية */
  _gpsSendTimer = setInterval(() => {
    if (Date.now() - _gpsLastSent < GPS_INTERVAL) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        _gpsFailCount = 0;
        _gpsWatchFail = 0;
        sendGPS(drvId, pos.coords.latitude, pos.coords.longitude, false);
      },
      err => _gpsOnError(err, 'timer'),
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 }
    );
  }, GPS_INTERVAL);
};

const sendGPS = async (drvId, lat, lng, isFirst) => {
  _gpsLastLat = lat; _gpsLastLng = lng; _gpsLastSent = Date.now();
  await update(ref(_db, T(`drivers/${drvId}`)), { lat, lng, locUpdated: Date.now() }).catch(() => { });
  if (isFirst) toast('ok', '📍 موقعك محدّد', 'يظهر على الخريطة');
};

const stopGPS = () => {
  if (_gpsWatcher !== null) {
    try { navigator.geolocation.clearWatch(_gpsWatcher); } catch (e) { }
    _gpsWatcher = null;
  }
  if (_gpsSendTimer) { clearInterval(_gpsSendTimer); _gpsSendTimer = null; }
  if (_gpsRetryTimer) { clearTimeout(_gpsRetryTimer); _gpsRetryTimer = null; }
  _gpsLastSent = 0;
  _gpsLastLat = null;
  _gpsLastLng = null;
  _gpsFailCount = 0;
  _gpsWatchFail = 0;
};

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (_gpsSendTimer) { clearInterval(_gpsSendTimer); _gpsSendTimer = null; }
  } else if (CU && CR === 'driver' && CU.status !== 'offline' && !_gpsSendTimer) {
    _gpsSendTimer = setInterval(() => {
      if (Date.now() - _gpsLastSent >= GPS_INTERVAL)
        navigator.geolocation.getCurrentPosition(
          pos => sendGPS(CU.id, pos.coords.latitude, pos.coords.longitude, false),
          err => _gpsOnError(err, 'timer'),
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 30000 }
        );
    }, GPS_INTERVAL);
  }
});
window.addEventListener('pagehide', stopGPS);
window.addEventListener('beforeunload', stopGPS);



/* ══════════════════════════════════════════════════
   SHARED DRIVER CACHE
   ══════════════════════════════════════════════════ */
let allDrvs = {};
const _drvCBs = new Set();
let _drvListener = null;

const onDriversUpdate = cb => { _drvCBs.add(cb); return () => _drvCBs.delete(cb); };
const _notifyDrvCBs = () => _drvCBs.forEach(cb => { try { cb(allDrvs); } catch (e) { } });

const startDriverListener = () => {
  if (_drvListener) return;
  const r = tRef('drivers');
  _drvListener = onValue(r, snap => {
    allDrvs = {};
    if (snap.exists()) Object.entries(snap.val()).forEach(([id, d]) => { const { avatar, ...dn } = d; allDrvs[id] = dn; });
    updateStatsUI(); _notifyDrvCBs();
  });
};
const stopDriverListener = () => {
  if (_drvListener) { try { off(tRef('drivers')); } catch (e) { } _drvListener = null; }
  _drvCBs.clear();
};

/* ══════════════════════════════════════════════════
   CLEAN OLD NOTIFICATIONS
   ══════════════════════════════════════════════════ */
const MAX_NOTIFS = 200;
const NOTIF_TTL = 24 * 60 * 60 * 1000;

const cleanNotifs = async () => {
  const snap = await get(tRef('notifications')).catch(() => null);
  if (!snap || !snap.exists()) return;
  const all = Object.entries(snap.val()), cutoff = Date.now() - NOTIF_TTL, updates = {};
  all.forEach(([k, v]) => { if ((v.ts || 0) < cutoff) updates[k] = null; });
  const remaining = all.filter(([k, v]) => !updates[k] && (v.ts || 0) >= cutoff);
  if (remaining.length > MAX_NOTIFS)
    remaining.sort((a, b) => (a[1].ts || 0) - (b[1].ts || 0))
      .slice(0, remaining.length - MAX_NOTIFS)
      .forEach(([k]) => { updates[k] = null; });
  if (Object.keys(updates).length > 0) await update(tRef('notifications'), updates).catch(() => { });
};
setInterval(() => { if (CR === 'supervisor') cleanNotifs(); }, 3600000);

/* ══════════════════════════════════════════════════
   AUDIO
   ══════════════════════════════════════════════════ */
const AC = window.AudioContext || window.webkitAudioContext;
let aCtx = null;
const getAC = () => { if (!aCtx && AC) { try { aCtx = new AC(); } catch (e) { return null; } } return aCtx; };
['click', 'touchstart', 'keydown'].forEach(ev =>
  document.addEventListener(ev, () => { try { const c = getAC(); if (c && c.state === 'suspended') c.resume(); } catch (e) { } }, { passive: true })
);

const playSound = t => {
  try {
    const ctx = getAC(); if (!ctx || ctx.state !== 'running') return;
    const P = {
      request: [{ f: 880, d: .12, g: .9, t: 0 }, { f: 1100, d: .12, g: .9, t: .15 }, { f: 880, d: .12, g: .9, t: .30 }, { f: 1100, d: .18, g: .9, t: .45 }],
      accept: [{ f: 523, d: .12, g: .7, t: 0 }, { f: 659, d: .12, g: .7, t: .13 }, { f: 784, d: .2, g: .7, t: .26 }],
      reject: [{ f: 784, d: .12, g: .6, t: 0 }, { f: 523, d: .2, g: .6, t: .15 }],
      cancel: [{ f: 600, d: .1, g: .7, t: 0 }, { f: 400, d: .25, g: .7, t: .15 }],
      edit: [{ f: 660, d: .1, g: .6, t: 0 }, { f: 880, d: .1, g: .6, t: .12 }, { f: 660, d: .1, g: .6, t: .24 }],
      sos: [{ f: 1200, d: .1, g: 1, t: 0 }, { f: 1200, d: .1, g: 1, t: .15 }, { f: 1200, d: .1, g: 1, t: .3 }, { f: 800, d: .3, g: 1, t: .5 }],
      notif: [{ f: 660, d: .18, g: .6, t: 0 }, { f: 880, d: .1, g: .4, t: .2 }],
      shift: [{ f: 523, d: .1, g: .7, t: 0 }, { f: 659, d: .1, g: .7, t: .12 }, { f: 784, d: .1, g: .7, t: .24 }, { f: 1047, d: .25, g: .7, t: .36 }],
    };
    (P[t] || P.notif).forEach(({ f, d, g, t: s }) => {
      const o = ctx.createOscillator(), gn = ctx.createGain();
      o.connect(gn); gn.connect(ctx.destination);
      o.type = 'sine'; o.frequency.value = f;
      gn.gain.setValueAtTime(0, ctx.currentTime + s);
      gn.gain.linearRampToValueAtTime(g, ctx.currentTime + s + .02);
      gn.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + s + d);
      o.start(ctx.currentTime + s); o.stop(ctx.currentTime + s + d + .05);
    });
  } catch (e) { }
};
const vibrate = p => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { } };

/* ══════════════════════════════════════════════════
   PUSH NOTIFICATIONS
   ══════════════════════════════════════════════════ */
const NOTIF_ICON = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="26" fill="#D97706"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="72">🚕</text></svg>')}`;
let swReg = null;

const registerSW = async () => {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const src = `self.addEventListener('install',e=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(clients.claim()));self.addEventListener('message',e=>{if(!e.data||e.data.action!=='NOTIFY')return;e.waitUntil(self.registration.showNotification(e.data.title||'منصة التاكسي',{body:e.data.body||'',icon:e.data.icon,vibrate:e.data.vibrate||[200],requireInteraction:e.data.require||false,tag:e.data.tag||('n_'+Date.now()),dir:'rtl',lang:'ar'}));});`;
    const blob = new Blob([src], { type: 'text/javascript' });
    swReg = await navigator.serviceWorker.register(URL.createObjectURL(blob)).catch(() => null);
    return swReg;
  } catch (e) { return null; }
};

const reqPushPerm = async () => {
  if (!('Notification' in window)) return false;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try { return (await Notification.requestPermission()) === 'granted'; } catch (e) { return false; }
};

const _nt = {};
const showPushNotif = async (title, body, type = 'info') => {
  const key = type + '_' + title.slice(0, 20), now = Date.now();
  if (_nt[key] && now - _nt[key] < 3000) return; _nt[key] = now;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const cfg = {
    new_request: { vibrate: [400, 100, 400, 100, 400], require: true },
    edit_request: { vibrate: [200, 100, 200], require: true },
    cancel: { vibrate: [300], require: false },
    sos: { vibrate: [500, 100, 500, 100, 500], require: true },
    done: { vibrate: [200], require: false },
    user_request: { vibrate: [300, 100, 300], require: true },
    info: { vibrate: [150], require: false },
  }[type] || { vibrate: [150], require: false };
  try {
    const r = swReg || await navigator.serviceWorker.getRegistration().catch(() => null);
    if (r) { await r.showNotification(title, { body, icon: NOTIF_ICON, vibrate: cfg.vibrate, requireInteraction: cfg.require, tag: type + '_' + Date.now(), dir: 'rtl', lang: 'ar' }); return; }
    new Notification(title, { body, icon: NOTIF_ICON, tag: type + '_' + Date.now(), dir: 'rtl' });
  } catch (e) { }
};

/* ══════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════ */
const $ = id => document.getElementById(id);
const H = (id, v) => { const e = $(id); if (e) e.classList[v ? 'add' : 'remove']('h'); };
const fmt = ts => new Date(ts).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
const esc = s => { if (s == null) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;'); };
const eAt = s => (s || '').replace(/'/g, "&#39;").replace(/"/g, '&quot;');
const fmtElapsed = ms => { const t = Math.floor(ms / 1000), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60; return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`; };

window.OM = id => { const e = $(id); if (e) e.classList.add('on'); };
window.CM = id => { const e = $(id); if (e) e.classList.remove('on'); clrAl(); };
const clrAl = () => document.querySelectorAll('.al').forEach(a => { a.className = 'al'; a.textContent = ''; });
const shAl = (id, t, m) => { const e = $(id); if (!e) return; e.className = `al ${t}`; e.innerHTML = `<i class="fas fa-${t === 'err' ? 'circle-exclamation' : 'circle-check'}"></i> ${m}`; };

window.toast = (t, ti, s = '') => {
  const ic = { ok: '✅', err: '❌', warn: '⚠️', info: 'ℹ️' };
  const container = $('toasts'); if (!container) return;
  while (container.children.length >= 4) container.removeChild(container.firstChild);
  const el = document.createElement('div'); el.className = 'toast';
  el.innerHTML = `<div class="tst">${ic[t] || 'ℹ️'}</div><div><div class="ttt">${esc(String(ti))}</div>${s ? `<div class="tts">${esc(String(s))}</div>` : ''}</div>`;
  container.appendChild(el);
  const tid = setTimeout(() => { el.style.cssText = 'opacity:0;transform:translateX(-110%);transition:.2s'; setTimeout(() => { try { el.remove(); } catch (e) { } }, 220); }, 3800);
  el.addEventListener('click', () => { clearTimeout(tid); el.remove(); });
};

/* ══════════════════════════════════════════════════
   STATE
   ══════════════════════════════════════════════════ */
let CU = null, CR = null, IS_RECV = false;
let reqCountdownTimer = null, selTaxiId = null, selReqData = null;
let shiftStartTime = null, monitorInterval = null;
let leafletMap = null, mapMarkers = {};
const LSNRS = [];
const addL = (r, keep = false) => LSNRS.push({ r, keep });

window.addEventListener('online', () => toast('ok', '🌐 عاد الاتصال', ''));
window.addEventListener('offline', () => toast('err', '🔌 انقطع الاتصال', ''));

/* ── Public Map State ── */
let _pubMap = null, _pubOfficesListener = null;
let _userReqId = null, _userReqTenantId = null, _userRating = 0, _pubReqListener = null;
let _officeLocMap = null, _officeLocMarker = null, _officeLocLat = null, _officeLocLng = null;
let _lastTrackStatus = '';


/* ══════════════════════════════════════════════════
   TENANT GATE — بوابة الدخول
   ══════════════════════════════════════════════════ */
const initTenantGate = () => {
  /* أخفِ كل الصفحات */
  $('PTenantGate').style.display = 'none';
  $('PL').style.display = 'none';
  const pu = $('PU');
  if (pu) { pu.style.display = 'flex'; pu.style.flexDirection = 'column'; }

  /* أخفِ جملة "اضغط على مكتب التكسي" إن وجدت */
  document.querySelectorAll('.pub-map-hint, .map-hint, [data-hint="map"]').forEach(el => el.style.display = 'none');
  document.querySelectorAll('p, div, span').forEach(el => {
    if (el.children.length === 0 && el.textContent.includes('اضغط على مكتب التكسي على الخريطة')) el.style.display = 'none';
  });

  /* أضف أزرار تنزيل التطبيق إن لم تكن موجودة */
  if (!$('pwaInstallBtns')) {
    const wrap = document.createElement('div');
    wrap.id = 'pwaInstallBtns';
    wrap.style.cssText = 'display:flex;gap:10px;justify-content:center;padding:12px 16px;flex-wrap:wrap;flex-shrink:0;background:rgba(15,23,42,.8);border-top:1px solid rgba(255,255,255,.08)';
    wrap.innerHTML = `
      <button onclick="window.installPWA_android()" style="display:flex;align-items:center;gap:8px;padding:10px 18px;background:linear-gradient(135deg,#059669,#047857);border:none;border-radius:12px;color:#fff;font-size:13px;font-weight:800;cursor:pointer;font-family:Cairo,sans-serif;box-shadow:0 4px 12px rgba(5,150,105,.3)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.523 15.341a5 5 0 01-3.523 1.46 5 5 0 01-3.523-1.46L4 9.341V18a2 2 0 002 2h12a2 2 0 002-2V9.341l-2.477 6zM12 3a5 5 0 015 5H7a5 5 0 015-5zm-7 5l7 8 7-8H5z"/></svg>
        تنزيل لـ أندرويد
      </button>
      <button onclick="window.installPWA_ios()" style="display:flex;align-items:center;gap:8px;padding:10px 18px;background:linear-gradient(135deg,#0EA5E9,#0284C7);border:none;border-radius:12px;color:#fff;font-size:13px;font-weight:800;cursor:pointer;font-family:Cairo,sans-serif;box-shadow:0 4px 12px rgba(14,165,233,.3)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
        تنزيل لـ آيفون
      </button>`;
    if (pu) pu.appendChild(wrap);
  }

  /* شغّل الخريطة */
  setTimeout(() => {
    if (typeof window.openPubPage === 'function') window.openPubPage();
    else {
      const mapEl = $('publicMap');
      if (mapEl && !_pubMap) {
        try {
          _pubMap = L.map('publicMap', { zoomControl: true }).setView([32.31, 35.03], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(_pubMap);
          loadPublicOffices();
        } catch (e) { }
      }
    }
  }, 100);
  /* أظهر زر الموظفين */
  const btn = $('staffEntryBtn'); if (btn) btn.style.display = 'flex';
};

/* ── منطق تنزيل التطبيق ── */
let _deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); _deferredInstallPrompt = e; });

/* دالة التثبيت المباشر — مرتبطة بالـ HTML و app.js */
window._installAndroid = window.installPWA_android = async () => {
  const prompt = window._deferredInstall || _deferredInstallPrompt;
  if (prompt) {
    try {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        toast('ok', '✅ تم التثبيت!', 'التطبيق جاهز على شاشتك الرئيسية');
        window._deferredInstall = null; _deferredInstallPrompt = null;
      }
    } catch (e) { console.warn('PWA prompt error', e); }
    return;
  }
  /* تعليمات يدوية فقط — بدون أي زر "تنزيل" وهمي */
  const m = document.createElement('div');
  m.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.85);display:flex;align-items:flex-end;justify-content:center;padding:16px';
  m.innerHTML = `<div style="background:#1E293B;border-radius:20px 20px 16px 16px;padding:24px;width:100%;max-width:400px;font-family:Cairo,sans-serif;direction:rtl">
    <div style="font-size:18px;font-weight:900;color:#fff;margin-bottom:16px;display:flex;align-items:center;gap:10px">
      🤖 تثبيت التطبيق — أندرويد
    </div>
    <div style="background:rgba(255,255,255,.06);border-radius:12px;padding:16px;margin-bottom:16px">
      <div style="color:rgba(255,255,255,.8);font-size:13px;line-height:2.4">
        <div>1️⃣ اضغط على قائمة المتصفح <b style="color:#0EA5E9">⋮</b> بالأعلى</div>
        <div>2️⃣ اختر <b style="color:#0EA5E9">"إضافة إلى الشاشة الرئيسية"</b></div>
        <div>3️⃣ اضغط <b style="color:#059669">إضافة</b> ✅</div>
        <div>4️⃣ رح تلاقي أيقونة التطبيق على شاشتك الرئيسية 📱</div>
      </div>
    </div>
    <button id="_pwaAndroidOkBtn" style="width:100%;padding:14px;background:linear-gradient(135deg,#0EA5E9,#0284C7);border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:900;cursor:pointer;font-family:Cairo,sans-serif">
      ✅ فهمت
    </button>
  </div>`;
  document.body.appendChild(m);
  const okBtn = m.querySelector('#_pwaAndroidOkBtn');
  if (okBtn) okBtn.addEventListener('click', () => m.remove());
  m.addEventListener('click', e => { if (e.target === m) m.remove(); });
};

window._installIOS = window.installPWA_ios = () => {
  const m = document.createElement('div');
  m.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.85);display:flex;align-items:flex-end;justify-content:center;padding:16px';
  m.innerHTML = `<div style="background:#1E293B;border-radius:20px 20px 16px 16px;padding:24px;width:100%;max-width:400px;font-family:Cairo,sans-serif;direction:rtl">
    <div style="font-size:18px;font-weight:900;color:#fff;margin-bottom:16px;display:flex;align-items:center;gap:10px">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#0EA5E9"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
      تثبيت على آيفون
    </div>
    <div style="background:rgba(255,255,255,.06);border-radius:12px;padding:16px;margin-bottom:16px">
      <div style="color:rgba(255,255,255,.8);font-size:13px;line-height:2.2">
        <div style="margin-bottom:8px">1️⃣ افتح الموقع في <b style="color:#0EA5E9">Safari</b> (ليس Chrome)</div>
        <div style="margin-bottom:8px">2️⃣ اضغط زر المشاركة <b style="color:#0EA5E9">⬆️</b> في الأسفل</div>
        <div style="margin-bottom:8px">3️⃣ اختر <b style="color:#0EA5E9">"Add to Home Screen"</b></div>
        <div>4️⃣ اضغط <b style="color:#059669">Add</b> وتم ✅</div>
      </div>
    </div>
    <button id="_pwaIosOkBtn" style="width:100%;padding:14px;background:linear-gradient(135deg,#0EA5E9,#0284C7);border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:900;cursor:pointer;font-family:Cairo,sans-serif">
      ✅ فهمت
    </button>
  </div>`;
  document.body.appendChild(m);
  const okBtn = m.querySelector('#_pwaIosOkBtn');
  if (okBtn) okBtn.addEventListener('click', () => m.remove());
  m.addEventListener('click', e => { if (e.target === m) m.remove(); });
};

window.openStaffPanel = () => {
  const panel = $('staffPanel'); if (!panel) return;
  panel.style.display = 'block';
  requestAnimationFrame(() => {
    const inner = $('staffPanelInner');
    if (inner) inner.style.transform = 'translateX(0)';
  });
};

window.closeStaffPanel = () => {
  const inner = $('staffPanelInner');
  if (inner) {
    inner.style.transform = 'translateX(-100%)';
    setTimeout(() => {
      const panel = $('staffPanel'); if (panel) panel.style.display = 'none';
    }, 350);
  }
};

/* إغلاق البانال عند الضغط خارجه */
document.addEventListener('click', e => {
  const panel = $('staffPanel');
  if (panel && panel.style.display === 'block' && e.target === panel) closeStaffPanel();
});

/* مسح الخطأ عند الكتابة فقط */
window.gateClearErr = () => {
  const panel = document.getElementById('staffPanelInner');
  const err = (panel ? panel.querySelector('#gate-err') : null) || $('gate-err');
  if (err) err.textContent = '';
  const inp = (panel ? panel.querySelector('#gate-office-code') : null) || $('gate-office-code');
  if (inp) inp.style.borderColor = 'rgba(255,255,255,.2)';
  const btns = (panel ? panel.querySelector('#gate-btns') : null) || $('gate-btns');
  if (btns) btns.style.display = 'none';
  const verified = (panel ? panel.querySelector('#gate-verified') : null) || $('gate-verified');
  if (verified) verified.style.display = 'none';
  TENANT_ID = ''; TENANT_INFO = null;
};

/* زر "تحقق" */
window.gateCheckCode = () => {
  /* نقرأ من staffPanel لأنه يحتوي على الـ IDs الصحيحة المرئية */
  const panel = document.getElementById('staffPanelInner');
  const inp = (panel ? panel.querySelector('#gate-office-code') : null) || $('gate-office-code');
  const code = (inp ? inp.value : '').toLowerCase().trim();
  const err = (panel ? panel.querySelector('#gate-err') : null) || $('gate-err');
  const verified = (panel ? panel.querySelector('#gate-verified') : null) || $('gate-verified');
  const btns = (panel ? panel.querySelector('#gate-btns') : null) || $('gate-btns');
  const label = (panel ? panel.querySelector('#gate-office-name-label') : null) || $('gate-office-name-label');
  const btn = (panel ? panel.querySelector('#gate-check-btn') : null) || $('gate-check-btn');

  if (!code) {
    if (err) err.textContent = '❌ يرجى إدخال رمز المكتب';
    if (inp) inp.focus();
    return;
  }

  /* تأثير تحميل على الزر */
  if (btn) { btn.innerHTML = '<span class="spin"></span>'; btn.disabled = true; }

  setTimeout(() => {
    if (btn) { btn.innerHTML = 'تحقق'; btn.disabled = false; }

    if (TENANT_NAMES[code]) {
      /* رمز صحيح */
      TENANT_ID = code;
      TENANT_INFO = { name: TENANT_NAMES[code] };
      if (label) label.textContent = TENANT_NAMES[code];
      if (verified) verified.style.display = 'flex';
      if (btns) btns.style.display = 'flex';
      if (err) err.textContent = '';
      if (inp) inp.style.borderColor = 'rgba(52,211,153,.6)';
      /* حفظ الرمز للمرة القادمة */
      localStorage.setItem('txOfficeCode', code);
    } else {
      /* رمز خاطئ */
      TENANT_ID = ''; TENANT_INFO = null;
      if (verified) verified.style.display = 'none';
      if (btns) btns.style.display = 'none';
      if (err) err.textContent = '❌ رمز المكتب غير صحيح';
      if (inp) {
        inp.style.borderColor = 'rgba(248,113,113,.6)';
        inp.style.animation = 'shake .4s';
        setTimeout(() => { if (inp) inp.style.animation = ''; }, 400);
      }
    }
  }, 400);
};

/* الضغط على زر الدخول */
window.gateEnter = role => {
  if (!TENANT_ID || !TENANT_INFO) {
    const panel = document.getElementById('staffPanelInner');
    const err = (panel ? panel.querySelector('#gate-err') : null) || $('gate-err');
    if (err) err.textContent = '❌ يرجى التحقق من رمز المكتب أولاً';
    return;
  }
  tenantEnter(role);
};

/* ══════════════════════════════════════════════════
   SESSION RESTORE
   ══════════════════════════════════════════════════ */
const SESSION_KEYS = { tenant: 'txTenantId', role: 'txRole', driverKey: 'txDriverKey' };
const saveSession = (role, driverKey = '') => {
  try {
    localStorage.setItem(SESSION_KEYS.tenant, TENANT_ID);
    localStorage.setItem(SESSION_KEYS.role, role);
    if (driverKey) localStorage.setItem(SESSION_KEYS.driverKey, driverKey);
    else localStorage.removeItem(SESSION_KEYS.driverKey);
  } catch (e) { }
};
const clearSession = () => {
  try {
    Object.values(SESSION_KEYS).forEach(k => localStorage.removeItem(k));
  } catch (e) { }
};

const restoreSession = () => new Promise(resolve => {
  let settled = false;
  const done = v => { if (settled) return; settled = true; clearTimeout(timer); resolve(v); };
  const timer = setTimeout(() => done(false), 6000);
  let unsub;
  unsub = onAuthStateChanged(_auth, async user => {
    if (settled) return;
    if (typeof unsub === 'function') { try { unsub(); } catch (e) { } }
    if (!user) return done(false);
    try {
      const savedTenant = localStorage.getItem(SESSION_KEYS.tenant) || localStorage.getItem('txOfficeCode') || '';
      const savedRole = localStorage.getItem(SESSION_KEYS.role) || '';
      const savedDrvKey = localStorage.getItem(SESSION_KEYS.driverKey) || '';
      if (savedRole === 'driver' && savedDrvKey && savedTenant && (TENANT_NAMES[savedTenant] || savedTenant)) {
        TENANT_ID = savedTenant; TENANT_INFO = { name: TENANT_NAMES[savedTenant] };
        const snap = await get(ref(_db, `tenants/${savedTenant}/drivers/${savedDrvKey}`)).catch(() => null);
        if (!snap || !snap.exists()) return done(false);
        const found = snap.val();
        if (found.approvalStatus === 'pending' || found.approvalStatus === 'rejected') return done(false);
        CU = { ...found, id: savedDrvKey }; CR = 'driver'; IS_RECV = false;
        if (found.shiftStart && !found.shiftEnd) shiftStartTime = found.shiftStart;
        document.querySelectorAll('.lgn1').forEach(el => el.textContent = TENANT_INFO.name);
        await update(ref(_db, `tenants/${savedTenant}/drivers/${savedDrvKey}`), { status: 'online', lastSeen: Date.now(), taxiColor: 'green' }).catch(() => { });
        await registerSW(); await reqPushPerm();
        startGPS(savedDrvKey); initDash();
        listenDriverRequests(savedDrvKey); listenSosBroadcast(); listenDriverPushNotifs(savedDrvKey);
        return done(true);
      }
      if (savedRole === 'supervisor' || savedRole === 'receiver') {
        const tenantId = EMAIL_TO_TENANT[(user.email || '').toLowerCase()] || savedTenant;
        if (!tenantId) return done(false);
        if (!TENANT_NAMES[tenantId]) TENANT_NAMES[tenantId] = tenantId;
        TENANT_ID = tenantId; TENANT_INFO = { name: TENANT_NAMES[tenantId] };
        document.querySelectorAll('.lgn1').forEach(el => el.textContent = TENANT_INFO.name);
        document.title = TENANT_INFO.name + ' — منصة التاكسي';
        const supId = 'admin_' + tenantId;
        const supSnap = await get(ref(_db, `tenants/${tenantId}/supervisors/${supId}`)).catch(() => null);
        CU = { id: supId, name: supSnap && supSnap.exists() ? supSnap.val().name : TENANT_NAMES[tenantId], role: 'admin', officeId: tenantId };
        CR = 'supervisor'; IS_RECV = savedRole === 'receiver';
        if (IS_RECV) initRecvDash();
        else { initDash(); listenSupNotifs(); startDriverListener(); }
        return done(true);
      }
      return done(false);
    } catch (e) { return done(false); }
  });
});

document.addEventListener('DOMContentLoaded', async () => {
  await registerSW();               // نسجّل Service Worker من أول ما الصفحة تفتح لأي زائر
  const restored = await restoreSession();
  if (!restored) initTenantGate();
});

/* من أي زر دخل المستخدم (مشرف / مستقبل / سائق) */
window.tenantEnter = role => {
  closeStaffPanel();
  const pu = $('PU'); if (pu) pu.style.display = 'none';
  $('PL').style.display = 'block';
  const staffBtn = $('staffEntryBtn'); if (staffBtn) staffBtn.style.display = 'none';

  if (role === 'driver') {
    setTimeout(() => OM('Mdriver'), 80);
  } else if (role === 'receiver') {
    IS_RECV = true;
    setTimeout(() => {
      const t = $('supModalTitle'); if (t) t.textContent = 'بوابة المستقبل';
      const o = $('supModalOfficeName'); if (o) o.textContent = 'سجّل بنفس بيانات المشرف';
      const n = $('recvLoginNote'); if (n) n.style.display = 'block';
      OM('Msup');
    }, 80);
  } else {
    IS_RECV = false;
    setTimeout(() => {
      const t = $('supModalTitle'); if (t) t.textContent = 'بوابة المشرف';
      const o = $('supModalOfficeName'); if (o) o.textContent = 'سجّل الدخول بحساب مكتبك';
      const n = $('recvLoginNote'); if (n) n.style.display = 'none';
      OM('Msup');
    }, 80);
  }
};

/* فتح الخريطة العامة من Gate */
window.openPubPageDirect = () => {
  $('PTenantGate').style.display = 'none';
  $('PL').style.display = 'block';
  let tries = 0;
  const interval = setInterval(() => {
    tries++;
    if (typeof window.openPubPage === 'function') { clearInterval(interval); window.openPubPage(); }
    else if (tries > 30) clearInterval(interval);
  }, 150);
};

window.dtab = t => {
  $('dt1').classList.toggle('on', t === 'li');
  $('dt2').classList.toggle('on', t === 'rg');
  H('dli', t !== 'li'); H('drg', t !== 'rg');
  clrAl();
};

/* ══════════════════════════════════════════════════
   AUTH — SUPERVISOR / RECEIVER LOGIN  (Firebase Auth)
   ══════════════════════════════════════════════════ */
window.sLogin = async () => {
  const email = ($('sl-email') ? ($('sl-email').value || '').trim() : '');
  const pw = ($('sl-pw') ? ($('sl-pw').value || '').trim() : '');

  if (!email || !pw) return shAl('al-sup', 'err', 'يرجى إدخال البريد وكلمة المرور');

  const btn = $('sl-pw').closest('.mdl').querySelector('.ba');
  const orig = btn.innerHTML;
  btn.innerHTML = '<span class="spin"></span> جار الدخول...';
  btn.disabled = true;

  try {
    const cred = await signInWithEmailAndPassword(_auth, email, pw);
    const tenantId = EMAIL_TO_TENANT[email.toLowerCase()];

    if (!tenantId) {
      await signOut(_auth);
      shAl('al-sup', 'err', '❌ هذا الحساب غير مصرح له');
      btn.innerHTML = orig; btn.disabled = false;
      return;
    }

    // ✅ التحقق الجديد: الإيميل يجب أن يطابق رمز المكتب المدخل في Gate
    if (TENANT_ID && tenantId !== TENANT_ID) {
      await signOut(_auth);
      shAl('al-sup', 'err', `❌ هذا الحساب خاص بمكتب آخر (${tenantId}) — أنت في مكتب (${TENANT_ID})`);
      btn.innerHTML = orig; btn.disabled = false;
      return;
    }

    // باقي الكود كما هو...

    /* 2. تعيين الـ Tenant */
    TENANT_ID = tenantId;
    TENANT_INFO = { name: TENANT_NAMES[tenantId] || tenantId };

    document.querySelectorAll('.lgn1').forEach(el => el.textContent = TENANT_INFO.name);
    document.title = TENANT_INFO.name + ' — منصة التاكسي';

    /* 3. إنشاء / جلب سجل المشرف */
    const supId = 'admin_' + tenantId;
    const supSnap = await get(tRef(`supervisors/${supId}`)).catch(() => null);
    if (!supSnap || !supSnap.exists()) {
      await set(tRef(`supervisors/${supId}`), {
        name: 'مشرف ' + TENANT_INFO.name,
        role: 'admin', officeId: tenantId, createdAt: Date.now(),
      });
    }
    CU = { id: supId, name: TENANT_NAMES[tenantId], role: 'admin', officeId: tenantId };
    CR = 'supervisor';
    saveSession(IS_RECV ? 'receiver' : 'supervisor');

    CM('Msup');

    if (IS_RECV) {
      initRecvDash();
      toast('ok', 'مرحباً 👨‍💼', '📥 منصة المستقبل — ' + TENANT_INFO.name);
    } else {
      initDash();
      toast('ok', 'مرحباً 👨‍💼', 'منصة الطلبات — ' + TENANT_INFO.name);
      listenSupNotifs();
      startDriverListener();
    }
  } catch (err) {
    const msgs = {
      'auth/wrong-password': '❌ كلمة المرور غير صحيحة',
      'auth/user-not-found': '❌ البريد الإلكتروني غير موجود',
      'auth/invalid-email': '❌ البريد الإلكتروني غير صحيح',
      'auth/invalid-credential': '❌ بيانات الدخول غير صحيحة',
      'auth/too-many-requests': '⚠️ محاولات كثيرة — انتظر قليلاً',
      'auth/network-request-failed': '❌ تحقق من اتصالك بالإنترنت',
    };
    shAl('al-sup', 'err', msgs[err.code] || '❌ خطأ: ' + (err.message || ''));
  }

  btn.innerHTML = orig; btn.disabled = false;
};

/* ══════════════════════════════════════════════════
   AUTH — DRIVER REGISTER
   ══════════════════════════════════════════════════ */
window.dReg = async () => {
  const nm = ($('dr-nm').value || '').trim();
  const ph = ($('dr-ph').value || '').trim();
  const car = ($('dr-car').value || '').trim();
  const pw = $('dr-pw').value || '';
  const pw2 = $('dr-pw2').value || '';
  const invCode = ($('dr-invite') ? ($('dr-invite').value || '').trim().toUpperCase() : '');

  if (!nm || !ph || !pw || !car) return shAl('al-drv', 'err', 'يرجى ملء جميع الحقول');
  if (pw !== pw2) return shAl('al-drv', 'err', 'كلمات المرور غير متطابقة');
  if (!/^[0-9+]{7,15}$/.test(ph.replace(/ /g, ''))) return shAl('al-drv', 'err', 'رقم الهاتف غير صحيح');
  if (pw.length < 6) return shAl('al-drv', 'err', 'كلمة المرور قصيرة جداً');
  if (!TENANT_ID) return shAl('al-drv', 'err', 'لا يوجد مكتب محدد — ادخل برمز المكتب أولاً');

  if (invCode) {
    const expectedInvite = TENANT_INVITE[TENANT_ID] || '';
    const clean = code => code.replace(/[!]/g, '').toUpperCase();
    if (clean(invCode) !== clean(expectedInvite)) return shAl('al-drv', 'err', '❌ كود الدعوة غير صحيح');
  }

  const phKey = ph.replace(/[.#$[\]/ ]/g, '_');
  const btn = $('dr-nm').closest('.mdl').querySelector('.bp');
  const orig = btn.innerHTML;
  btn.innerHTML = '<span class="spin"></span> جار الإنشاء...'; btn.disabled = true;

  try {
    const chk = await get(tRef(`drivers/${phKey}`));
    if (chk.exists()) { shAl('al-drv', 'err', 'رقم الهاتف مسجل مسبقاً'); btn.innerHTML = orig; btn.disabled = false; return; }

    const driverEmail = `${phKey}@driver.taxi.local`;
    const cred = await createUserWithEmailAndPassword(_auth, driverEmail, pw);

    await set(tRef(`drivers/${phKey}`), {
      name: nm, phone: ph, carNumber: car,
      status: 'offline', taxiColor: 'green',
      deliveries: 0, totalDeliveries: 0,
      createdAt: Date.now(), role: 'driver',
      officeId: TENANT_ID, approvalStatus: 'pending', lastSeen: Date.now(),
    });

    await signOut(_auth);

    await push(tRef('notifications'), { type: 'new_driver', msg: `🆕 سائق جديد: ${nm} (${ph})`, ts: serverTimestamp(), read: false, driverId: phKey });
    shAl('al-drv', 'ok', '✅ تم التسجيل! انتظر موافقة المشرف');
    ['dr-nm', 'dr-ph', 'dr-car', 'dr-pw', 'dr-pw2', 'dr-invite'].forEach(id => { const el = $(id); if (el) el.value = ''; });
    setTimeout(() => dtab('li'), 2500);
  } catch (err) {
    const msgs = { 'auth/email-already-in-use': 'رقم الهاتف مسجل مسبقاً' };
    shAl('al-drv', 'err', msgs[err.code] || ('خطأ: ' + (err.message || '')));
  }

  btn.innerHTML = orig; btn.disabled = false;
};

/* ══════════════════════════════════════════════════
   AUTH — DRIVER LOGIN
   ══════════════════════════════════════════════════ */
window.dLogin = async () => {
  const ph = ($('dl-ph').value || '').trim();
  const pw = $('dl-pw').value || '';
  const car = ($('dl-car').value || '').trim();

  if (!ph || !pw || !car) return shAl('al-drv', 'err', 'يرجى ملء جميع الحقول');

  const phKey = ph.replace(/[.#$[\]/ ]/g, '_');
  const btn = $('dl-pw').closest('.mdl').querySelector('.bp');
  const orig = btn.innerHTML;
  btn.innerHTML = '<span class="spin"></span> جار الدخول...'; btn.disabled = true;

  try {
    const snap = await get(tRef(`drivers/${phKey}`));
    if (!snap.exists()) { shAl('al-drv', 'err', 'رقم الهاتف غير مسجل'); btn.innerHTML = orig; btn.disabled = false; return; }

    const found = snap.val();
    if (found.approvalStatus === 'pending') { shAl('al-drv', 'warn', '⏳ حسابك قيد المراجعة'); btn.innerHTML = orig; btn.disabled = false; return; }
    if (found.approvalStatus === 'rejected') { shAl('al-drv', 'err', '❌ تم رفض حسابك'); btn.innerHTML = orig; btn.disabled = false; return; }

    if (!TENANT_ID) {
      if (found.officeId) { TENANT_ID = found.officeId; TENANT_INFO = { name: TENANT_NAMES[found.officeId] || found.officeId }; }
      else { shAl('al-drv', 'err', 'ادخل برمز مكتبك أولاً'); btn.innerHTML = orig; btn.disabled = false; return; }
    }
    if (TENANT_ID && found.officeId && found.officeId !== TENANT_ID) {
      shAl('al-drv', 'err', 'هذا الحساب مسجل في مكتب آخر'); btn.innerHTML = orig; btn.disabled = false; return;
    }
    if ((found.carNumber || '').toLowerCase() !== car.toLowerCase()) {
      shAl('al-drv', 'err', 'رقم السيارة غير صحيح'); btn.innerHTML = orig; btn.disabled = false; return;
    }

    const driverEmail = `${phKey}@driver.taxi.local`;
    let cred;
    try {
      cred = await signInWithEmailAndPassword(_auth, driverEmail, pw);
    } catch (authErr) {
      shAl('al-drv', 'err', 'كلمة المرور خاطئة');
      btn.innerHTML = orig; btn.disabled = false; return;
    }

    await update(tRef(`drivers/${phKey}`), { status: 'online', lastSeen: Date.now(), taxiColor: 'green' });

    CU = { ...found, id: phKey };
    CR = 'driver'; IS_RECV = false;
    saveSession('driver', phKey);
    if (found.shiftStart && !found.shiftEnd) shiftStartTime = found.shiftStart;

    CM('Mdriver');
    await registerSW();
    const granted = await reqPushPerm();
    if (granted) toast('ok', '🔔 الإشعارات مفعّلة', '');
    startGPS(phKey);
    initDash();
    toast('ok', 'أهلاً ' + found.name, '🚕 جاهز لاستقبال الطلبات');
    listenDriverRequests(phKey);
    listenSosBroadcast();
    listenDriverPushNotifs(phKey);
  } catch (err) { shAl('al-drv', 'err', 'خطأ: ' + (err.message || '')); btn.innerHTML = orig; btn.disabled = false; }
};


/* ══════════════════════════════════════════════════
   STATUS HELPERS
   ══════════════════════════════════════════════════ */
const getTCS = d => {
  const s = d.status || '', c = d.taxiColor || 'green';
  if (c === 'red' || s === 'busy') return { border: '#DC2626', dot: '#DC2626', label: 'مشغول 🔴', cls: 'sb-red', monCls: 'st-busy', dotCls: 'msd-red', badgeCls: 'mtb-red', emoji: '🔴' };
  if (c === 'orange' || s === 'break' || s === 'pray' || s === 'waiting' || s === 'near') {
    const lbl = s === 'near' ? 'قريب ⚠️' : s === 'waiting' ? 'بالانتظار 🟠' : s === 'pray' ? 'صلاة 🕌' : 'استراحة 🟠';
    return { border: '#EA580C', dot: '#EA580C', label: lbl, cls: 'sb-orange', monCls: 'st-break', dotCls: 'msd-orange', badgeCls: 'mtb-orange', emoji: '🟠' };
  }
  if (s === 'offline') return { border: '#64748B', dot: '#64748B', label: 'غير متصل ⚫', cls: 'sb-gray', monCls: 'st-offline', dotCls: 'msd-gray', badgeCls: 'mtb-gray', emoji: '⚫' };
  return { border: '#059669', dot: '#059669', label: 'متاح 🟢', cls: 'sb-green', monCls: 'st-online', dotCls: 'msd-green', badgeCls: 'mtb-green', emoji: '🟢' };
};
const getStatusBadge = d => { const cs = getTCS(d); return `<span class="sbadge ${cs.cls}"><span class="pdot" style="background:${cs.dot}"></span>${cs.label}</span>`; };

/* ══════════════════════════════════════════════════
   SMART HELPERS — المسافة + التوزيع الذكي + التنبيهات
   ══════════════════════════════════════════════════ */
const haversineKm = (lat1, lng1, lat2, lng2) => {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/* يرتب السائقين حسب: متاح أولاً ← الأقرب مسافة ← الأكثر توصيلات */
const getSortedDriversByDistance = (reqLat, reqLng, driversObj) => {
  const list = Object.entries(driversObj || {}).map(([id, d]) => {
    const dist = (reqLat != null && reqLng != null && d.lat != null && d.lng != null) ? haversineKm(reqLat, reqLng, d.lat, d.lng) : null;
    return { id, d, dist, cs: getTCS(d) };
  });
  list.sort((a, b) => {
    const rank = x => x.cs.monCls === 'st-online' ? 0 : x.cs.monCls === 'st-break' ? 1 : x.cs.monCls === 'st-busy' ? 2 : 3;
    const ra = rank(a), rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (a.dist != null && b.dist != null && a.dist !== b.dist) return a.dist - b.dist;
    if (a.dist != null && b.dist == null) return -1;
    if (b.dist != null && a.dist == null) return 1;
    return (b.d.totalDeliveries || 0) - (a.d.totalDeliveries || 0);
  });
  return list;
};

/* ── نظام التنبيهات الذكية ── */
const _alertLastFired = {};
const ALERT_COOLDOWN = 15 * 60 * 1000;
const _canFireAlert = key => {
  const now = Date.now();
  if (_alertLastFired[key] && now - _alertLastFired[key] < ALERT_COOLDOWN) return false;
  _alertLastFired[key] = now; return true;
};

const runSmartAlerts = async () => {
  if (!TENANT_ID || CR !== 'supervisor') return;
  const now = Date.now();

  /* 1) سائق لم يحدّث موقعه منذ أكثر من 10 دقائق */
  Object.entries(allDrvs).forEach(([id, d]) => {
    if (d.status === 'offline' || !d.locUpdated) return;
    const age = now - d.locUpdated;
    if (age > 10 * 60 * 1000 && _canFireAlert('gps_' + id)) {
      push(tRef('notifications'), { type: 'alert_gps', msg: `📡 السائق ${d.name} لم يحدّث موقعه منذ ${Math.floor(age / 60000)} دقيقة`, ts: serverTimestamp(), read: false }).catch(() => {});
    }
  });

  /* 2) سائق يعمل أكثر من 8 ساعات متواصلة */
  Object.entries(allDrvs).forEach(([id, d]) => {
    if (d.status === 'offline' || !d.shiftStart) return;
    const dur = now - d.shiftStart;
    if (dur > 8 * 60 * 60 * 1000 && _canFireAlert('shift_' + id)) {
      push(tRef('notifications'), { type: 'alert_shift', msg: `⏱️ السائق ${d.name} يعمل منذ أكثر من ${Math.floor(dur / 3600000)} ساعات متواصلة — يُفضّل تذكيره بالراحة`, ts: serverTimestamp(), read: false }).catch(() => {});
    }
  });

  /* 3) طلبات كثيرة لم تُرسل لأي سائق */
  const snap = await get(tRef('recvRequests')).catch(() => null);
  if (snap && snap.exists()) {
    const drSnap = await get(tRef('driverRequests')).catch(() => null);
    const sentPhones = new Set();
    if (drSnap && drSnap.exists()) Object.values(drSnap.val()).forEach(reqs => Object.values(reqs || {}).forEach(r => { if (r.status !== 'cancelled') sentPhones.add(r.phone); }));
    const pendingOld = Object.entries(snap.val()).filter(([, d]) => d.status !== 'cancelled' && !sentPhones.has(d.phone) && (now - (d.ts || now)) > 5 * 60 * 1000);
    if (pendingOld.length >= 3 && _canFireAlert('pending_many')) {
      push(tRef('notifications'), { type: 'alert_pending', msg: `⚠️ هناك ${pendingOld.length} طلبات لم تُرسل لأي سائق منذ أكثر من 5 دقائق`, ts: serverTimestamp(), read: false }).catch(() => {});
    } else if (pendingOld.length >= 1 && _canFireAlert('pending_' + pendingOld[0][0])) {
      push(tRef('notifications'), { type: 'alert_pending', msg: `⚠️ طلب لم يُرسل لأي سائق: ${pendingOld[0][1].phone || ''} منذ ${Math.floor((now - (pendingOld[0][1].ts || now)) / 60000)} دقيقة`, ts: serverTimestamp(), read: false }).catch(() => {});
    }
  }
};
let _smartAlertsTimer = null;
const startSmartAlerts = () => {
  if (_smartAlertsTimer) clearInterval(_smartAlertsTimer);
  setTimeout(runSmartAlerts, 8000);
  _smartAlertsTimer = setInterval(runSmartAlerts, 90 * 1000);
};

/* ══════════════════════════════════════════════════
   DRIVER LISTENERS
   ══════════════════════════════════════════════════ */
const listenSosBroadcast = () => {
  const r = tRef('sosActive'); let lastTs = 0;
  onValue(r, snap => {
    if (!snap.exists()) return;
    const d = snap.val();
    if (!d || !d.ts || d.ts <= lastTs) return;
    if (d.acked && CU && d.acked[CU.id]) return;
    lastTs = d.ts;
    $('sosBcMsg').textContent = d.msg || '-';
    $('sosBcFrom').textContent = `من: ${d.senderName || 'المشرف'} • ${fmt(d.ts)}`;
    $('SosBroadcastNotif').classList.add('on');
    vibrate([500, 100, 500, 100, 500]); playSound('sos');
    showPushNotif('🆘 تنبيه طوارئ!', d.msg || '', 'sos');
  });
  LSNRS.push({ r });
};
window.ackSosBroadcast = async () => {
  if (CU) await update(tRef('sosActive/acked'), { [CU.id]: true }).catch(() => { });
  $('SosBroadcastNotif').classList.remove('on');
};

const listenDriverPushNotifs = drvId => {
  const r = tRef(`driverPushNotifs/${drvId}`); let init = false, known = {};
  onValue(r, async snap => {
    if (!snap.exists()) { init = true; return; }
    const all = snap.val(), entries = Object.entries(all);
    if (!init) { entries.forEach(([k]) => { known[k] = true; }); init = true; return; }
    for (const [k, n] of entries) {
      if (known[k]) continue; known[k] = true; if (n.read) continue;
      const sm = { new_request: 'request', edit_request: 'edit', cancel: 'cancel', sos: 'sos', user_request: 'request' };
      playSound(sm[n.type] || 'notif');
      vibrate(n.type === 'new_request' || n.type === 'user_request' ? [300, 100, 300] : n.type === 'sos' ? [500, 100, 500] : [200]);
      await showPushNotif(n.title || 'منصة الطلبات', n.body || '', n.type || 'info');
      update(tRef(`driverPushNotifs/${drvId}/${k}`), { read: true }).catch(() => { });
    }
  });
  LSNRS.push({ r });
};

const listenDriverRequests = drvId => {
  const r = tRef(`driverRequests/${drvId}`);
  onValue(r, snap => {
    if (!snap.exists()) return;
    const all = snap.val(), curId = $('currentReqId').value;
    if (curId && all[curId] && all[curId].status === 'cancelled') {
      clearInterval(reqCountdownTimer);
      $('ReqNotif').classList.remove('on'); $('currentReqId').value = '';
      if (CU && (CU.taxiColor === 'red' || CU.status === 'busy')) {
        update(tRef(`drivers/${CU.id}`), { taxiColor: 'green', status: 'online', lastSeen: Date.now() }).catch(() => { });
        CU.taxiColor = 'green'; CU.status = 'online';
        const b = $('drvStatusBadge'); if (b) b.innerHTML = getStatusBadge(CU);
      }
      playSound('cancel'); toast('info', '🚫 تم إلغاء الطلب', 'أنت الآن متاح 🟢'); return;
    }
    const pending = Object.entries(all)
      .filter(([, rd]) => rd.status === 'pending' || rd.status === 'modified')
      .sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0));
    if (pending.length === 0) return;
    const [rid, rd] = pending[0];
    if (curId === rid && $('ReqNotif').classList.contains('on') && rd.status === 'pending') return;
    if ($('ReqNotif').classList.contains('on')) { clearInterval(reqCountdownTimer); $('ReqNotif').classList.remove('on'); }
    showDriverReq(rid, rd);
  });
  LSNRS.push({ r });
};

const showDriverReq = (rid, rd) => {
  $('currentReqId').value = rid;
  $('reqPhone').textContent = rd.phone || '-';
  $('reqLocation').textContent = rd.details || '-';
  $('reqTime').textContent = fmt(rd.ts || Date.now());
  $('reqRejectArea').classList.remove('on'); $('reqRejectReason').value = '';
  const msgBox = $('reqMsgBox');
  if (rd.message) { msgBox.style.display = 'block'; $('reqMsgText').textContent = rd.message; }
  else msgBox.style.display = 'none';
  const modNotice = $('reqModNotice');
  if (rd.status === 'modified' && rd.prevPhone) {
    modNotice.style.display = 'block';
    $('reqModText').textContent = `تعديل • ${rd.prevPhone} ← ${rd.phone}`;
    playSound('edit'); vibrate([200, 100, 200]);
    showPushNotif('✏️ تم تعديل طلبك', `📞 ${rd.phone}\n📍 ${rd.details}`, 'edit_request');
  } else {
    modNotice.style.display = 'none';
    const rt = $('reqTitle'); if (rt) rt.textContent = rd.fromUser ? '🌐 طلب من مستخدم' : 'طلب جديد من المشرف';
    playSound('request'); vibrate([300, 100, 300, 100, 300]);
    showPushNotif(`📦 ${rd.fromUser ? 'طلب مستخدم' : 'طلب جديد'}`, `📞 ${rd.phone}\n📍 ${rd.details}`, 'new_request');
  }
  $('ReqNotif').classList.add('on');
  let count = 60; $('reqCountNum').textContent = count;
  clearInterval(reqCountdownTimer);
  reqCountdownTimer = setInterval(async () => {
    count--; const el = $('reqCountNum'); if (el) el.textContent = count;
    if (count <= 0) {
      clearInterval(reqCountdownTimer);
      if ($('ReqNotif').classList.contains('on')) {
        await update(tRef(`driverRequests/${CU.id}/${rid}`), { status: 'no_response' });
        await push(tRef('notifications'), { type: 'timeout', driverId: CU.id, driverName: CU.name, reqId: rid, msg: `⏰ السائق ${CU.name} لم يرد`, ts: serverTimestamp(), read: false });
        const rdSnap = await get(tRef(`driverRequests/${CU.id}/${rid}`)).catch(() => null);
        if (rdSnap && rdSnap.exists()) {
          const rdv = rdSnap.val();
          if (rdv.fromUser && rdv.userReqRef) await update(ref(_db, rdv.userReqRef), { driverStatus: 'no_response' }).catch(() => { });
        }
        $('ReqNotif').classList.remove('on'); $('currentReqId').value = '';
        toast('warn', 'انتهى الوقت', '');
      }
    }
  }, 1000);
};

const _notifyUserReq = async (drvReqRef, status, extra = {}) => {
  try {
    const snap = await get(drvReqRef).catch(() => null);
    if (snap && snap.exists()) {
      const d = snap.val();
      if (d.fromUser && d.userReqRef)
        await update(ref(_db, d.userReqRef), { driverStatus: status, driverName: CU?.name || '', ...extra }).catch(() => { });
    }
  } catch (e) { }
};

window.acceptReq = async () => {
  const rid = $('currentReqId').value; if (!rid) return;
  clearInterval(reqCountdownTimer);
  const snap = await get(tRef(`driverRequests/${CU.id}/${rid}`)).catch(() => null);
  if (!snap || !snap.exists()) { $('ReqNotif').classList.remove('on'); return; }
  const st = snap.val().status;
  if (st === 'cancelled') { $('ReqNotif').classList.remove('on'); toast('warn', 'تم إلغاء هذا الطلب', ''); return; }
  if (st !== 'pending' && st !== 'modified') { $('ReqNotif').classList.remove('on'); return; }
  const ts = Date.now();
  await update(tRef(`driverRequests/${CU.id}/${rid}`), { status: 'accepted', acceptedAt: ts });
  await update(tRef(`drivers/${CU.id}`), { taxiColor: 'red', status: 'busy' });
  CU.taxiColor = 'red';
  await push(tRef('notifications'), { type: 'accept', driverId: CU.id, driverName: CU.name, reqId: rid, msg: `✅ السائق ${CU.name} قبل الطلب`, ts, read: false });
  await _notifyUserReq(tRef(`driverRequests/${CU.id}/${rid}`), 'accepted', { acceptedAt: ts });
  $('ReqNotif').classList.remove('on'); vibrate([200]); playSound('accept'); toast('ok', 'تم قبول الطلب 🚕', '');
};
window.showRejectInput = () => $('reqRejectArea').classList.toggle('on');
window.submitReject = async () => {
  const rid = $('currentReqId').value, reason = ($('reqRejectReason').value || '').trim();
  if (!reason) return toast('warn', 'اكتب سبب الرفض', '');
  clearInterval(reqCountdownTimer);
  await _notifyUserReq(tRef(`driverRequests/${CU.id}/${rid}`), 'rejected');
  await update(tRef(`driverRequests/${CU.id}/${rid}`), { status: 'rejected', rejectedAt: Date.now(), reason });
  await push(tRef('notifications'), { type: 'reject', driverId: CU.id, driverName: CU.name, reqId: rid, reason, msg: `❌ السائق ${CU.name} رفض — ${reason}`, ts: serverTimestamp(), read: false });
  $('ReqNotif').classList.remove('on'); vibrate([100, 50, 100]); playSound('reject'); toast('info', 'تم رفض الطلب', '');
};

window.inlineAccept = async id => {
  const snap = await get(tRef(`driverRequests/${CU.id}/${id}`)).catch(() => null);
  if (!snap || !snap.exists()) return toast('warn', 'الطلب غير موجود', '');
  const rd = snap.val();
  if (rd.status === 'cancelled') return toast('warn', 'تم إلغاء هذا الطلب', '');
  if (rd.status !== 'pending' && rd.status !== 'modified') return;
  const ts = Date.now();
  await update(tRef(`driverRequests/${CU.id}/${id}`), { status: 'accepted', acceptedAt: ts });
  await update(tRef(`drivers/${CU.id}`), { taxiColor: 'red', status: 'busy' });
  CU.taxiColor = 'red'; CU.status = 'busy';
  if ($('currentReqId').value === id) { clearInterval(reqCountdownTimer); $('ReqNotif').classList.remove('on'); $('currentReqId').value = ''; }
  await push(tRef('notifications'), { type: 'accept', driverId: CU.id, driverName: CU.name, reqId: id, msg: `✅ السائق ${CU.name} قبل الطلب`, ts, read: false });
  if (rd.fromUser && rd.userReqRef) await update(ref(_db, rd.userReqRef), { driverStatus: 'accepted', driverName: CU.name, acceptedAt: ts }).catch(() => { });
  vibrate([200]); playSound('accept'); toast('ok', 'تم قبول الطلب 🚕', '');
  const b = $('drvStatusBadge'); if (b) b.innerHTML = getStatusBadge(CU);
};
window.inlineReject = async id => {
  const reason = prompt('سبب الرفض (مطلوب):', ''); if (!reason || !reason.trim()) return toast('warn', 'يرجى كتابة سبب الرفض', '');
  const snap = await get(tRef(`driverRequests/${CU.id}/${id}`)).catch(() => null);
  const rd = snap && snap.exists() ? snap.val() : {};
  await update(tRef(`driverRequests/${CU.id}/${id}`), { status: 'rejected', rejectedAt: Date.now(), reason: reason.trim() });
  if ($('currentReqId').value === id) { clearInterval(reqCountdownTimer); $('ReqNotif').classList.remove('on'); $('currentReqId').value = ''; }
  await push(tRef('notifications'), { type: 'reject', driverId: CU.id, driverName: CU.name, reqId: id, reason: reason.trim(), msg: `❌ السائق ${CU.name} رفض — ${reason.trim()}`, ts: serverTimestamp(), read: false });
  if (rd.fromUser && rd.userReqRef) await update(ref(_db, rd.userReqRef), { driverStatus: 'rejected' }).catch(() => { });
  vibrate([100, 50, 100]); playSound('reject'); toast('info', 'تم رفض الطلب', '');
};

const updStatus = async s => {
  if (!CU) return;
  const cm = { online: 'green', busy: 'red', break: 'orange', pray: 'orange', waiting: 'orange', near: 'orange', offline: 'green' };
  await update(tRef(`drivers/${CU.id}`), { status: s, taxiColor: cm[s] || 'green', lastSeen: Date.now() });
  CU.taxiColor = cm[s] || 'green'; CU.status = s;
};


/* ══════════════════════════════════════════════════
   SUPERVISOR — NOTIFS LISTENER
   ══════════════════════════════════════════════════ */
const listenSupNotifs = () => {
  cleanNotifs();
  startSmartAlerts();
  const rPending = tRef('drivers');
  onValue(rPending, snap => {
    if (!snap.exists()) return;
    const pending = Object.values(snap.val()).filter(d => d.approvalStatus === 'pending').length;
    ['approval-badge', 'mob-approval-badge'].forEach(bid => {
      const b = $(bid); if (b) { b.textContent = pending; b.style.display = pending > 0 ? 'inline' : 'none'; }
    });
  });
  LSNRS.push({ r: rPending, keep: true });

  const r = tRef('notifications');
  onValue(r, snap => {
    if (!snap.exists()) return;
    const unread = Object.values(snap.val()).filter(n => !n.read).length;
    ['notif-badge', 'mob-notif-badge'].forEach(bid => {
      const b = $(bid); if (b) { b.textContent = unread; b.style.display = unread > 0 ? 'inline' : 'none'; }
    });
  });
  LSNRS.push({ r, keep: true });
  listenForUserRequests();
};

const listenForUserRequests = () => {
  let knownKeys = {}, init = false;
  const r = tRef('recvRequests');
  onValue(r, snap => {
    if (!snap.exists()) { init = true; return; }
    const all = snap.val(), entries = Object.entries(all);
    if (!init) { entries.forEach(([k]) => { knownKeys[k] = true; }); init = true; return; }
    for (const [k, d] of entries) {
      if (knownKeys[k]) continue; knownKeys[k] = true;
      if (d.fromUser) {
        playSound('request'); vibrate([300, 100, 300]);
        showPushNotif('🌐 طلب مستخدم جديد!', `📞 ${d.phone}\n📍 ${d.details}`, 'user_request');
        toast('info', '🌐 طلب جديد من مستخدم', `📞 ${d.phone}`);
      }
    }
  });
  LSNRS.push({ r, keep: true });
};

/* ══════════════════════════════════════════════════
   INIT DASHBOARD
   ══════════════════════════════════════════════════ */

/* ══ WAKE LOCK ══ */
let _wakeLock = null;
const requestWakeLock = async () => {
  if (!('wakeLock' in navigator)) return;
  try { _wakeLock = await navigator.wakeLock.request('screen'); _wakeLock.addEventListener('release', () => { _wakeLock = null; }); } catch (e) { }
};
const releaseWakeLock = async () => {
  if (_wakeLock) { try { await _wakeLock.release(); } catch (e) { } _wakeLock = null; }
};
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible' && CR === 'driver' && CU) await requestWakeLock();
});

const initDash = () => {
  $('PL').style.display = 'none'; $('PD').style.display = 'block';
  const nav = $('navav'); nav.textContent = CR === 'driver' ? '🚕' : '👨‍💼';
  if (CR === 'supervisor') nav.classList.add('sup-av');
  const btn = $('staffEntryBtn'); if (btn) btn.style.display = 'none';

  const tabs = $('ntabs'), mobNav = $('mobileNav'), mobTabs = $('mobTabs');

  if (CR === 'driver') {
    requestWakeLock();
    const cfg = [
      { id: 'reqs', icon: 'fas fa-inbox', label: 'الطلبات' },
      { id: 'reports', icon: 'fas fa-chart-bar', label: 'تقاريري' },
      { id: 'support', icon: 'fas fa-headset', label: 'دعم فني' },
      { id: 'profile', icon: 'fas fa-user-cog', label: 'حسابي' },
    ];
    tabs.innerHTML = cfg.map((t, i) => `<button class="ntab${i === 0 ? ' on' : ''}" id="nt-${t.id}" onclick="nTab('${t.id}')"><i class="${t.icon}"></i> ${t.label}</button>`).join('');
    if (mobNav && mobTabs) {
      mobNav.style.display = 'block';
      mobTabs.innerHTML = cfg.map((t, i) => `<button class="mob-tab${i === 0 ? ' on' : ''}" id="mnt-${t.id}" onclick="nTab('${t.id}')"><i class="${t.icon}"></i><span class="mob-label">${t.label}</span></button>`).join('');
      mobTabs.innerHTML += `<button class="mob-tab" onclick="logout()" style="color:#F87171"><i class="fas fa-right-from-bracket"></i><span class="mob-label">خروج</span></button>`;
    }
    renderDriverReqs();
  } else {
const cfg = [
      { id: 'reqs', icon: 'fas fa-inbox', label: 'الطلبات' },
      { id: 'map', icon: 'fas fa-map-location-dot', label: 'الخريطة' },
      { id: 'heatmap', icon: 'fas fa-fire', label: 'الخريطة الحرارية' },
      { id: 'notifs', icon: 'fas fa-bell', label: 'التنبيهات', badge: true },
      { id: 'approvals', icon: 'fas fa-user-check', label: 'الموافقات', badge2: true },
      { id: 'reports', icon: 'fas fa-chart-bar', label: 'التقارير' },
      { id: 'accounts', icon: 'fas fa-users', label: 'السائقون' },
      { id: 'support', icon: 'fas fa-headset', label: 'دعم فني' },
      { id: 'profile', icon: 'fas fa-user-cog', label: 'حسابي' },
    ];
    tabs.innerHTML = cfg.map((t, i) =>
      `<button class="ntab${i === 0 ? ' sup-on' : ''}" id="nt-${t.id}" onclick="nTab('${t.id}')">
        <i class="${t.icon}"></i> ${t.label}
        ${t.badge ? `<span class="ntab-badge" id="notif-badge"    style="display:none">0</span>` : ''}
        ${t.badge2 ? `<span class="ntab-badge" id="approval-badge" style="display:none;background:var(--green)">0</span>` : ''}
      </button>`
    ).join('');

    const monBtn = document.createElement('button');
    monBtn.id = 'monitorBtn'; monBtn.className = 'btn-primary';
    monBtn.style.cssText = 'padding:7px 13px;font-size:11px;flex-shrink:0';
    monBtn.innerHTML = '<i class="fas fa-tv"></i>'; monBtn.onclick = openMonitor;
    const navr = $('navr'); if (navr && !$('monitorBtn')) navr.insertBefore(monBtn, navr.firstChild);

    if (mobNav && mobTabs) {
      mobNav.style.display = 'block';
      mobTabs.innerHTML = cfg.map((t, i) =>
        `<button class="mob-tab${i === 0 ? ' sup-on' : ''}" id="mnt-${t.id}" onclick="nTab('${t.id}')">
          ${t.badge ? `<span class="mob-tab-badge" id="mob-notif-badge"    style="display:none">0</span>` : ''}
          ${t.badge2 ? `<span class="mob-tab-badge" id="mob-approval-badge" style="display:none;background:var(--green)">0</span>` : ''}
          <i class="${t.icon}"></i><span class="mob-label">${t.label}</span>
        </button>`
      ).join('');
      mobTabs.innerHTML += `<button class="mob-tab" onclick="openMonitor()"><i class="fas fa-tv"></i><span class="mob-label">مراقبة</span></button>`;
      mobTabs.innerHTML += `<button class="mob-tab" onclick="logout()" style="color:#F87171"><i class="fas fa-right-from-bracket"></i><span class="mob-label">خروج</span></button>`;
    }
    renderSupReqs();
  }
};

let _tabBusy = false;
window.nTab = t => {
  if (_tabBusy) return; _tabBusy = true;
  document.querySelectorAll('#ntabs .ntab').forEach(b => b.classList.remove('on', 'sup-on'));
  const el = $('nt-' + t); if (el) el.classList.add(CR === 'supervisor' ? 'sup-on' : 'on');
  document.querySelectorAll('#mobTabs .mob-tab').forEach(b => b.classList.remove('on', 'sup-on'));
  const mel = $('mnt-' + t); if (mel) mel.classList.add(CR === 'supervisor' ? 'sup-on' : 'on');
  clrListeners(true);
  if (CR === 'driver') {
    if (t === 'reqs') renderDriverReqs();
    else if (t === 'reports') renderDriverReports();
    else if (t === 'support') renderSupport('driver');
    else renderDProfile();
  } else {
    if (t === 'reqs') renderSupReqs();
    else if (t === 'map') renderMapSup();
    else if (t === 'heatmap') renderHeatmap();
    else if (t === 'notifs') renderNotifs();
    else if (t === 'approvals') renderApprovals();
    else if (t === 'reports') renderSupReports();
    else if (t === 'accounts') renderAccs();
    else if (t === 'support') renderSupport('supervisor');
    else renderSProfile();
  }
  setTimeout(() => { _tabBusy = false; }, 400);
};

const clrListeners = (keepPerm = false) => {
  LSNRS.forEach(({ r, keep, timer }) => {
    if (keepPerm && keep) return;
    if (timer) clearInterval(timer);
    try { if (r) off(r); } catch (e) { }
  });
  if (keepPerm) { const kept = LSNRS.filter(l => l.keep); LSNRS.length = 0; kept.forEach(l => LSNRS.push(l)); }
  else LSNRS.length = 0;
  if (leafletMap) { try { leafletMap.remove(); } catch (e) { } leafletMap = null; mapMarkers = {}; }
  if (window._inlineMap) { try { window._inlineMap.remove(); } catch (e) { } window._inlineMap = null; window._inlineMarkers = {}; }
};

const updateStatsUI = () => {
  const ent = Object.entries(allDrvs);
  const upd = (id, v) => { const e = $(id); if (e) e.textContent = v; };
  upd('sTot', ent.length);
  upd('sOn', ent.filter(([, d]) => getTCS(d).monCls === 'st-online').length);
  upd('sBusy', ent.filter(([, d]) => getTCS(d).monCls === 'st-busy').length);
  upd('sBreak', ent.filter(([, d]) => getTCS(d).monCls === 'st-break').length);
  upd('sNear', ent.filter(([, d]) => d.status === 'near').length);
};


/* ══════════════════════════════════════════════════
   DRIVER REQUESTS VIEW
   ══════════════════════════════════════════════════ */
const renderDriverReqs = () => {
  $('dbody').innerHTML = `
  <div class="dlayout">
    <div class="dside">
      <div class="pcard">
        <div class="pav">🚕</div>
        <div class="pname">${esc(CU.name)}</div>
        <div style="font-size:10px;padding:3px 10px;border-radius:20px;background:var(--primary-l);color:var(--primary);border:1px solid var(--primary-m);display:inline-block">🚕 سائق تكسي</div>
        <div style="margin:5px 0"><span id="drvStatusBadge">${getStatusBadge(CU)}</span></div>
        <div style="font-size:11px;color:var(--text3)"><i class="fas fa-car" style="margin-left:3px"></i>${esc(CU.carNumber || '-')}</div>
        <div style="margin-top:6px"><span class="deliv-badge"><i class="fas fa-box"></i> ${CU.totalDeliveries || 0} توصيلة</span></div>
        <div id="gpsStatus" style="margin-top:6px;font-size:10px;color:var(--text4)">GPS: انتظار...</div>
      </div>
      <div class="ssec">
        <div class="slbl"><i class="fas fa-bolt"></i> إجراءات سريعة</div>
        <div class="qbtns">
          <button class="qbtn" onclick="drvAct('start')"><i class="fas fa-play-circle" style="color:var(--green)"></i>بدء الشيفت</button>
          <button class="qbtn" onclick="drvAct('end')"><i class="fas fa-stop-circle" style="color:var(--red)"></i>إنهاء الشيفت</button>
          <button class="qbtn" onclick="drvAct('break')"><i class="fas fa-coffee" style="color:var(--amber)"></i>استراحة</button>
          <button class="qbtn" onclick="drvAct('pray')"><i class="fas fa-mosque" style="color:#7C3AED"></i>صلاة</button>
          <button class="qbtn" style="background:var(--orange-l);border-color:var(--orange-m);color:var(--orange)" onclick="updStatus('waiting').then(()=>toast('ok','بالانتظار 🟠',''))"><i class="fas fa-hourglass-half"></i>بالانتظار</button>
          <button class="qbtn" style="background:var(--amber-l);border-color:var(--amber-m);color:var(--amber)" onclick="updStatus('near').then(()=>toast('ok','قريب ⚠️',''))"><i class="fas fa-map-pin"></i>قريب</button>
          <button class="qbtn done-all" onclick="quickDoneDelivery()"><i class="fas fa-flag-checkered"></i>تم التوصيل</button>
          <button class="qbtn sos" onclick="doDriverSOS()"><i class="fas fa-triangle-exclamation"></i>🆘 SOS</button>
        </div>
        <div class="fg" style="margin-top:10px">
          <input type="text" class="fi" id="custom-excuse" placeholder="رسالة مخصصة..." style="font-size:12px">
          <button class="bp" style="margin-top:6px;padding:8px;font-size:12px" onclick="sendExcuse()"><i class="fas fa-paper-plane"></i> إرسال</button>
        </div>
      </div>
    </div>
    <div class="dmain">
      <div class="dreq-wrap">
        <div class="dreq-hd">
          <div class="dreq-hd-title"><i class="fas fa-inbox" style="color:var(--primary)"></i> طلباتي الواردة</div>
          <span class="sbadge sb-gray" id="drvReqCount">--</span>
        </div>
        <div id="notifBar" style="padding:8px 14px;font-size:11px;font-weight:700;display:flex;align-items:center;gap:7px;border-bottom:1px solid var(--border);flex-shrink:0;background:var(--bg)"></div>
        <div class="dreq-list" id="DREQLIST"><div class="dreq-empty"><i class="fas fa-box-open"></i><p>لا توجد طلبات بعد</p></div></div>
      </div>
    </div>
  </div>`;
  listenDriverReqsList(); updateNotifBar();
  setInterval(() => {
    const el = $('gpsStatus'); if (!el) return;
    const age = Date.now() - _gpsLastSent;
    if (_gpsLastSent === 0) { el.textContent = 'GPS: انتظار...'; return; }
    if (age < 100000) el.innerHTML = `<i class="fas fa-location-dot" style="color:var(--green);margin-left:3px"></i>GPS: ${Math.floor(age / 1000)}ث مضت ✅`;
    else el.innerHTML = `<i class="fas fa-location-dot" style="color:var(--amber);margin-left:3px"></i>GPS: ${Math.floor(age / 60000)} دقيقة مضت`;
  }, 5000);
};

const updateNotifBar = () => {
  const bar = $('notifBar'); if (!bar) return;
  if (!('Notification' in window)) { bar.innerHTML = '<i class="fas fa-bell-slash" style="color:var(--text4)"></i><span style="color:var(--text4)">الإشعارات غير مدعومة</span>'; return; }
  if (Notification.permission === 'granted') { bar.innerHTML = '<i class="fas fa-bell" style="color:var(--green)"></i><span style="color:var(--green)">🔔 الإشعارات مفعّلة</span>'; bar.style.background = 'var(--green-l)'; }
  else if (Notification.permission === 'denied') { bar.innerHTML = '<i class="fas fa-bell-slash" style="color:var(--red)"></i><span style="color:var(--red)">🔕 الإشعارات محجوبة</span>'; bar.style.background = 'var(--red-l)'; }
  else { bar.innerHTML = '<i class="fas fa-bell" style="color:var(--amber)"></i><span style="color:var(--amber)">الإشعارات غير مفعّلة</span><button onclick="enableNotifs()" style="margin-right:auto;padding:4px 10px;background:var(--amber);border:none;border-radius:7px;color:#fff;font-size:11px;font-weight:700;cursor:pointer;font-family:Cairo,sans-serif">🔔 تفعيل</button>'; bar.style.background = 'var(--amber-l)'; }
};
window.enableNotifs = async () => { await registerSW(); const g = await reqPushPerm(); updateNotifBar(); toast(g ? 'ok' : 'warn', g ? '🔔 تم التفعيل!' : 'لم يتم التفعيل', ''); };

const listenDriverReqsList = () => {
  const r = tRef(`driverRequests/${CU.id}`);
  onValue(r, snap => {
    const list = $('DREQLIST'), cnt = $('drvReqCount'); if (!list) return;
    if (!snap.exists()) { list.innerHTML = '<div class="dreq-empty"><i class="fas fa-box-open"></i><p>لا توجد طلبات بعد</p></div>'; if (cnt) cnt.textContent = '0 طلب'; return; }
    const items = Object.entries(snap.val()).sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0));
    if (cnt) cnt.textContent = items.length + ' طلب';
    list.innerHTML = items.map(([id, req]) => mkDriverReqCard(id, req)).join('');
    const active = items.filter(([, r]) => r.status === 'accepted' || r.status === 'waiting' || r.status === 'near');
    const hasCancelledWithBusy = items.some(([, r]) => r.status === 'cancelled') && (CU.status === 'busy' || CU.taxiColor === 'red');
    if (active.length === 0 && hasCancelledWithBusy) {
      update(tRef(`drivers/${CU.id}`), { taxiColor: 'green', status: 'online', lastSeen: Date.now() }).catch(() => { });
      CU.taxiColor = 'green'; CU.status = 'online';
      const b = $('drvStatusBadge'); if (b) b.innerHTML = getStatusBadge(CU);
    }
  });
  addL(r);
};

const mkDriverReqCard = (id, req) => {
  const sMap = { pending: 'rc-pending', accepted: 'rc-accepted', rejected: 'rc-rejected', waiting: 'rc-waiting', near: 'rc-near', cancelled: 'rc-cancelled', modified: 'rc-pending', no_response: 'rc-rejected', done: 'rc-done' };
  const sLbl = { pending: '⏳ انتظار', accepted: '✅ مقبول', rejected: '❌ مرفوض', waiting: '🕐 بالانتظار', near: '⚠️ قريب', cancelled: '🚫 ملغي', modified: '✏️ معدّل', no_response: '⏰ لم يُستجب', done: '✅ تم التوصيل' }[req.status] || req.status;
  const sBadgeCls = req.status === 'accepted' || req.status === 'done' ? 'sb-green' : req.status === 'rejected' || req.status === 'cancelled' ? 'sb-red' : req.status === 'waiting' || req.status === 'near' ? 'sb-orange' : 'sb-amber';
  const userBadge = req.fromUser ? `<span style="background:#ECFDF5;color:#059669;border:1px solid #A7F3D0;border-radius:20px;padding:2px 7px;font-size:10px;font-weight:700;margin-right:4px">🌐 مستخدم</span>` : '';
  const modDiff = req.status === 'modified' && req.prevPhone ? `<div class="mod-diff"><div class="mod-old"><i class="fas fa-times-circle"></i>${esc(req.prevPhone)} • ${esc(req.prevDetails || '')}</div><div class="mod-new"><i class="fas fa-check-circle"></i>${esc(req.phone)} • ${esc(req.details || '')}</div></div>` : '';
  const msgShow = req.message ? `<div class="req-msg-box" style="margin-bottom:9px"><div class="req-msg-from"><i class="fas fa-user-tie"></i> رسالة المشرف</div><div class="req-msg-text">${esc(req.message)}</div></div>` : '';
  const showPending = req.status === 'pending' || req.status === 'modified';
  const showActive = (req.status === 'accepted' || req.status === 'waiting' || req.status === 'near') && !req.doneDelivery;
  const pendingActs = showPending ? `<div style="display:flex;gap:7px;flex-wrap:wrap;padding:10px;background:var(--amber-l);border:1px solid var(--amber-m);border-radius:var(--r);margin-top:6px;animation:reqPulse 2s infinite"><div style="width:100%;font-size:11px;font-weight:700;color:var(--amber);margin-bottom:4px"><i class="fas fa-clock"></i> يرجى الرد</div><button class="rca rca-green" style="flex:1;padding:10px;font-size:13px;font-weight:800" onclick="inlineAccept('${id}')"><i class="fas fa-check"></i> قبول</button><button class="rca rca-red" style="flex:1;padding:10px;font-size:13px;font-weight:800" onclick="inlineReject('${id}')"><i class="fas fa-times"></i> رفض</button></div>` : '';
  const acts = showActive ? `<button class="rca rca-orange" onclick="setDrvWaiting('${id}')"><i class="fas fa-hourglass-half"></i> انتظار</button><button class="rca rca-amber" onclick="setDrvNear('${id}')"><i class="fas fa-map-pin"></i> قريب</button><button class="rca rca-green" onclick="doneDelivery('${id}')"><i class="fas fa-flag-checkered"></i> تم التوصيل</button>` : '';
  return `<div class="reqcard ${sMap[req.status] || ''}" id="dreq-${id}">
    <div class="reqtop"><div class="reqphone"><i class="fas fa-phone"></i>${esc(req.phone || '-')}${userBadge}</div>
    <div class="reqtimes"><span class="sbadge ${sBadgeCls}" style="font-size:10px">${sLbl}</span><span class="reqtime"><i class="fas fa-clock"></i>${fmt(req.ts || Date.now())}</span></div></div>
    <div class="reqdetails"><i class="fas fa-map-marker-alt"></i><span>${esc(req.details || '-')}</span></div>
    ${msgShow}${modDiff}
    ${req.status === 'waiting' ? `<div style="background:var(--orange-l);border:1px solid var(--orange-m);border-radius:var(--r);padding:8px 12px;margin-bottom:8px;font-size:12px;font-weight:700;color:var(--orange);display:flex;align-items:center;gap:7px"><i class="fas fa-hourglass-half"></i> السائق بالانتظار 🕐</div>` : ''}
    ${req.status === 'near' ? `<div style="background:var(--amber-l);border:1.5px solid var(--amber-m);border-radius:var(--r);padding:8px 12px;margin-bottom:8px;font-size:12px;font-weight:700;color:var(--amber);display:flex;align-items:center;gap:7px;animation:reqPulse 1.5s infinite"><i class="fas fa-map-pin"></i> التاكسي قريب من الزبون ⚠️</div>` : ''}
    ${req.status === 'done' ? `<div style="background:var(--green-l);border:1px solid var(--green-m);border-radius:var(--r);padding:8px 12px;margin-bottom:8px;font-size:12px;font-weight:700;color:var(--green);display:flex;align-items:center;gap:7px"><i class="fas fa-check-circle"></i> تم التوصيل بنجاح ✅</div>` : ''}
    ${req.status === 'cancelled' ? `<div class="cancel-msg"><i class="fas fa-ban"></i>تم إلغاء الطلب</div>` : ''}
    <div class="reqacts">${acts}</div>${pendingActs}
  </div>`;
};

window.setDrvWaiting = async id => {
  await update(tRef(`driverRequests/${CU.id}/${id}`), { status: 'waiting', waitingAt: Date.now() });
  await updStatus('waiting');
  await _notifyUserReq(tRef(`driverRequests/${CU.id}/${id}`), 'waiting');
  await push(tRef('notifications'), { type: 'waiting', driverId: CU.id, driverName: CU.name, reqId: id, msg: `🕐 السائق ${CU.name} بالانتظار`, ts: serverTimestamp(), read: false });
  toast('ok', 'بالانتظار 🟠', ''); playSound('notif');
};
window.setDrvNear = async id => {
  await update(tRef(`driverRequests/${CU.id}/${id}`), { status: 'near', nearAt: Date.now() });
  await updStatus('near');
  await _notifyUserReq(tRef(`driverRequests/${CU.id}/${id}`), 'near');
  await push(tRef('notifications'), { type: 'near', driverId: CU.id, driverName: CU.name, reqId: id, msg: `⚠️ السائق ${CU.name} قريب`, ts: serverTimestamp(), read: false });
  toast('ok', 'قريب ⚠️', ''); playSound('notif');
};
window.confirmMod = async id => { await update(tRef(`driverRequests/${CU.id}/${id}`), { driverConfirmed: true, status: 'accepted' }); toast('ok', 'تم التأكيد', ''); };

window.doneDelivery = async id => {
  if (!CU) return;
  const chk = await get(tRef(`driverRequests/${CU.id}/${id}`)).catch(() => null);
  if (!chk || !chk.exists()) return toast('warn', 'الطلب غير موجود', '');
  const chkStatus = chk.val().status;
  if (chkStatus === 'cancelled') return toast('warn', 'الطلب ملغي', '');
  if (chkStatus !== 'accepted' && chkStatus !== 'waiting' && chkStatus !== 'near' && chkStatus !== 'modified') return toast('warn', 'لا يمكن إتمام هذا الطلب', '');
  const count = (CU.totalDeliveries || 0) + 1;
  await update(tRef(`drivers/${CU.id}`), { taxiColor: 'green', status: 'online', totalDeliveries: count });
  CU.totalDeliveries = count; CU.taxiColor = 'green'; CU.status = 'online';
  await update(tRef(`driverRequests/${CU.id}/${id}`), { status: 'done', doneAt: Date.now(), doneDelivery: true });
  const rd = chk.val();
  if (rd.fromUser && rd.userReqRef) await update(ref(_db, rd.userReqRef), { driverStatus: 'done', doneAt: Date.now() }).catch(() => { });
  const today = new Date().toISOString().split('T')[0];
  const lRef = tRef(`drivers/${CU.id}/dailyReport/${today}`);
  const snap = await get(lRef).catch(() => null);
  const prev = snap && snap.exists() ? snap.val() : { deliveries: 0 };
  await set(lRef, { ...prev, deliveries: (prev.deliveries || 0) + 1, lastUpdate: Date.now() });
  await push(tRef('notifications'), { type: 'done', driverId: CU.id, driverName: CU.name, msg: `📦 السائق ${CU.name} أتم التوصيل — إجمالي: ${count}`, ts: serverTimestamp(), read: false });
  toast('ok', `تم التوصيل! 🎉`, `إجمالي: ${count} توصيلة`); playSound('accept');
  const b = $('drvStatusBadge'); if (b) b.innerHTML = getStatusBadge(CU);
  const db = document.querySelector('.deliv-badge'); if (db) db.innerHTML = `<i class="fas fa-box"></i> ${count} توصيلة`;
};

window.quickDoneDelivery = async () => {
  if (!CU) return;
  const snap = await get(tRef(`driverRequests/${CU.id}`)).catch(() => null);
  if (!snap || !snap.exists()) return toast('warn', 'لا يوجد طلب نشط', '');
  const active = Object.entries(snap.val()).find(([, r]) => (r.status === 'accepted' || r.status === 'waiting' || r.status === 'near' || r.status === 'modified') && !r.doneDelivery);
  if (!active) return toast('warn', 'لا يوجد طلب نشط', '');
  const [id, req] = active;
  if (!confirm(`تأكيد إتمام التوصيل؟\n📞 ${req.phone || ''}\n📍 ${(req.details || '').substring(0, 50)}`)) return;
  await doneDelivery(id);
};

window.drvAct = async t => {
  const msgs = { start: '🟢 بدأت شيفتي', end: '🔴 انتهيت من الشيفت', break: '☕ في استراحة', pray: '🕌 ذاهب للصلاة' };
  const statusMap = { start: 'online', end: 'offline', break: 'break', pray: 'pray' };
  if (statusMap[t]) await updStatus(statusMap[t]);
  const today = new Date().toISOString().split('T')[0];
  if (t === 'start') {
    const now = Date.now(); shiftStartTime = now; CU.shiftStart = now;
    await update(tRef(`drivers/${CU.id}`), { shiftStart: now, shiftEnd: null });
    const lRef = tRef(`drivers/${CU.id}/dailyReport/${today}`);
    const snap = await get(lRef).catch(() => null);
    const prev = snap && snap.exists() ? snap.val() : { deliveries: 0, shifts: [] };
    await set(lRef, { ...prev, shifts: [...(prev.shifts || []), { start: now }], lastUpdate: now });
    playSound('shift'); toast('ok', 'بدأ الشيفت 🟢', '');
  } else if (t === 'end') {
    if (!shiftStartTime) return toast('warn', 'لا يوجد شيفت نشط', '');
    const now = Date.now(), dur = Math.round((now - shiftStartTime) / 60000);
    const lRef = tRef(`drivers/${CU.id}/dailyReport/${today}`);
    const snap = await get(lRef).catch(() => null);
    const prev = snap && snap.exists() ? snap.val() : { shifts: [] };
    const shifts = [...(prev.shifts || [])];
    if (shifts.length > 0 && !shifts[shifts.length - 1].end) { shifts[shifts.length - 1].end = now; shifts[shifts.length - 1].durationMin = dur; }
    await set(lRef, { ...prev, shifts, lastUpdate: now });
    await update(tRef(`drivers/${CU.id}`), { shiftStart: null, shiftEnd: now });
    shiftStartTime = null; stopGPS();
    toast('ok', 'انتهى الشيفت 🏁', `مدة: ${dur} دقيقة`);
  } else toast('ok', 'تم الإرسال ✅', '');
  const b = $('drvStatusBadge'); if (b) b.innerHTML = getStatusBadge(CU);
  await push(tRef('notifications'), { type: 'info', driverId: CU.id, driverName: CU.name, msg: `${msgs[t]} — ${CU.name}`, ts: serverTimestamp(), read: false });
};

window.sendExcuse = async () => {
  const e = ($('custom-excuse').value || '').trim(); if (!e) return;
  await push(tRef('notifications'), { type: 'info', driverId: CU.id, driverName: CU.name, msg: `📝 ${e} — ${CU.name}`, ts: serverTimestamp(), read: false });
  $('custom-excuse').value = ''; toast('ok', 'تم الإرسال', '');
};

window.doDriverSOS = async () => {
  if (!confirm('إرسال نداء طوارئ للمشرف؟')) return;
  await push(tRef('notifications'), { type: 'sos', driverId: CU.id, driverName: CU.name, msg: `🆘 SOS! السائق ${CU.name} يحتاج مساعدة!`, ts: serverTimestamp(), read: false, urgent: true });
  vibrate([500, 100, 500, 100, 500]); playSound('sos'); toast('err', '🆘 SOS أُرسل', '');
};


/* ══════════════════════════════════════════════════
   SUPERVISOR REQUESTS
   ══════════════════════════════════════════════════ */
const renderSupReqs = () => {
  $('dbody').innerHTML = `
  <div class="sup-req-layout">
    <div class="sup-req-col">
      <div class="col-hd">
        <div class="col-hd-title"><i class="fas fa-inbox" style="color:var(--primary)"></i> الطلبات الواردة</div>
        <div style="display:flex;gap:6px">
          <button class="btn-primary" style="padding:7px 12px;font-size:11px" onclick="OM('MaddReq')"><i class="fas fa-plus"></i> جديد</button>
          <button style="padding:7px 12px;background:var(--red-l);border:1px solid var(--red-m);border-radius:var(--r);color:var(--red);font-size:11px;font-weight:700;cursor:pointer;font-family:'Cairo',sans-serif" onclick="OM('SosSupModal')"><i class="fas fa-triangle-exclamation"></i> SOS</button>
        </div>
      </div>
      <div class="col-scroll" id="supReqList"><div style="text-align:center;padding:32px;color:var(--text4)"><div class="spin dark"></div></div></div>
    </div>
    <div class="sup-req-main">
      <div class="ststrip">
        <div class="st"><div class="stic" style="background:var(--primary-l)"><i class="fas fa-users" style="color:var(--primary)"></i></div><div><div class="stv" id="sTot">0</div><div class="stl">سائقون</div></div></div>
        <div class="st"><div class="stic" style="background:var(--green-l)"><i class="fas fa-circle-dot" style="color:var(--green)"></i></div><div><div class="stv" id="sOn">0</div><div class="stl">متاح 🟢</div></div></div>
        <div class="st"><div class="stic" style="background:var(--red-l)"><i class="fas fa-car" style="color:var(--red)"></i></div><div><div class="stv" id="sBusy">0</div><div class="stl">مشغول 🔴</div></div></div>
        <div class="st"><div class="stic" style="background:var(--orange-l)"><i class="fas fa-hourglass-half" style="color:var(--orange)"></i></div><div><div class="stv" id="sBreak">0</div><div class="stl">استراحة 🟠</div></div></div>
        <div class="st"><div class="stic" style="background:var(--amber-l)"><i class="fas fa-map-pin" style="color:var(--amber)"></i></div><div><div class="stv" id="sNear">0</div><div class="stl">قريب</div></div></div>
      </div>
      <div style="position:relative;height:220px;flex-shrink:0;border-bottom:1px solid var(--border)">
        <div id="reqMapInline" style="height:100%;width:100%"></div>
        <div class="map-legend" style="bottom:8px;right:8px;padding:7px 10px;font-size:10px">
          <div class="map-legend-item"><div class="leg-dot" style="background:#059669"></div>متاح 🟢</div>
          <div class="map-legend-item"><div class="leg-dot" style="background:#EA580C"></div>انتظار 🟠</div>
          <div class="map-legend-item"><div class="leg-dot" style="background:#DC2626"></div>مشغول 🔴</div>
        </div>
      </div>
      <div style="flex:1;overflow-y:auto;padding:12px" id="supNotifReqs">
        <div style="font-family:'Tajawal',sans-serif;font-size:14px;font-weight:900;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;color:var(--text)">
          <span><i class="fas fa-bell" style="color:var(--amber)"></i> تنبيهات الطلبات</span>
          <button onclick="clearAllNotifs()" style="padding:5px 10px;background:var(--red-l);border:1px solid var(--red-m);border-radius:7px;color:var(--red);font-size:10px;font-weight:700;cursor:pointer;font-family:'Cairo',sans-serif"><i class="fas fa-trash"></i> حذف الكل</button>
        </div>
        <div id="supNotifList"><div style="text-align:center;padding:20px;color:var(--text4);font-size:12px">لا يوجد تنبيهات</div></div>
      </div>
    </div>
  </div>`;
  loadSupReqList(); loadSupNotifList();
  onDriversUpdate(() => updateStatsUI()); updateStatsUI();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const el = $('reqMapInline'); if (!el) return;
    try {
      const inlineMap = L.map('reqMapInline', { zoomControl: false, scrollWheelZoom: false }).setView([32.31, 35.03], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '', maxZoom: 19 }).addTo(inlineMap);
      window._inlineMap = inlineMap; window._inlineMarkers = {};
      const refreshInline = () => {
        if (!window._inlineMap) return;
        Object.entries(allDrvs).forEach(([id, d]) => {
          if (!d.lat || !d.lng) return;
          const cs = getTCS(d);
          const ic = L.divIcon({ html: `<div class="drv-marker-wrap"><div class="drv-marker" style="border-color:${cs.border}">🚕</div><div class="drv-marker-name">${d.name} ${cs.emoji}</div></div>`, className: '', iconSize: [50, 50], iconAnchor: [25, 50] });
          if (window._inlineMarkers[id]) { window._inlineMarkers[id].setLatLng([d.lat, d.lng]); window._inlineMarkers[id].setIcon(ic); }
          else { window._inlineMarkers[id] = L.marker([d.lat, d.lng], { icon: ic }).addTo(inlineMap).bindPopup(`<div style="font-family:Cairo,sans-serif;font-size:12px;text-align:center"><b>${d.name}</b><br><span style="color:${cs.dot}">${cs.label}</span></div>`); }
        });
      };
      refreshInline(); onDriversUpdate(() => { if (!window._inlineMap) return; refreshInline(); });
    } catch (e) { }
  }));
};

const loadSupReqList = () => {
  const r = tRef('recvRequests');
  onValue(r, snap => {
    const list = $('supReqList'); if (!list) return;
    if (!snap.exists()) { list.innerHTML = `<div style="text-align:center;padding:32px;color:var(--text4)"><i class="fas fa-inbox" style="font-size:32px;opacity:.2;display:block;margin-bottom:8px"></i>لا يوجد طلبات</div>`; return; }
   list.innerHTML = items.map(([id, d]) => {
      const userBadge = d.fromUser ? `<span style="background:#ECFDF5;color:#059669;border:1px solid #A7F3D0;border-radius:20px;padding:2px 7px;font-size:10px;font-weight:700;margin-right:4px">🌐 مستخدم</span>` : '';

      /* ── نظام توزيع الطلبات الذكي: اقتراح فقط (المشرف يقرر) ── */
      const reqLat = d.lat || d.userLat || null, reqLng = d.lng || d.userLng || null;
      let nearestBadge = '';
      if (reqLat && reqLng) {
        const sortedNear = getSortedDriversByDistance(reqLat, reqLng, allDrvs).filter(x => x.cs.monCls === 'st-online' && x.dist != null);
        if (sortedNear.length) {
          nearestBadge = `<div style="background:var(--cyan-l);border:1px solid var(--cyan-m);border-radius:var(--r);padding:7px 11px;margin-bottom:8px;font-size:11px;font-weight:700;color:#0E7490;display:flex;align-items:center;gap:6px">
            <i class="fas fa-route"></i> 🎯 أقرب سائق مقترح: ${esc(sortedNear[0].d.name)} — ${sortedNear[0].dist.toFixed(1)} كم
          </div>`;
        }
      }

      /* ── حالة الطلب: وصل / اتلغى ── */
      let statusBanner = '';
      /* ── حالة الطلب: وصل / اتلغى ── */
      let statusBanner = '';
      if (d.status === 'cancelled' && d.cancelledBy === 'user') {
        statusBanner = `<div style="background:var(--red-l);border:1px solid var(--red-m);border-radius:var(--r);padding:8px 12px;margin-bottom:8px;font-size:12px;font-weight:700;color:var(--red);display:flex;align-items:center;gap:7px"><i class="fas fa-ban"></i> المستخدم ألغى الطلب 🚫</div>`;
      } else if (d.status === 'cancelled') {
        statusBanner = `<div style="background:var(--red-l);border:1px solid var(--red-m);border-radius:var(--r);padding:8px 12px;margin-bottom:8px;font-size:12px;font-weight:700;color:var(--red);display:flex;align-items:center;gap:7px"><i class="fas fa-ban"></i> تم إلغاء الطلب 🚫</div>`;
      } else if (d.driverStatus === 'done') {
        statusBanner = `<div style="background:var(--green-l);border:1px solid var(--green-m);border-radius:var(--r);padding:8px 12px;margin-bottom:8px;font-size:12px;font-weight:700;color:var(--green);display:flex;align-items:center;gap:7px"><i class="fas fa-check-circle"></i> تم التوصيل بنجاح ✅</div>`;
      } else if (d.driverStatus === 'near') {
        statusBanner = `<div style="background:var(--amber-l);border:1px solid var(--amber-m);border-radius:var(--r);padding:8px 12px;margin-bottom:8px;font-size:12px;font-weight:700;color:var(--amber);display:flex;align-items:center;gap:7px"><i class="fas fa-map-pin"></i> السائق قريب من الزبون ⚠️</div>`;
      } else if (d.driverStatus === 'accepted' || d.driverStatus === 'waiting') {
        statusBanner = `<div style="background:var(--primary-l);border:1px solid var(--primary-m);border-radius:var(--r);padding:8px 12px;margin-bottom:8px;font-size:12px;font-weight:700;color:var(--primary);display:flex;align-items:center;gap:7px"><i class="fas fa-car"></i> السائق ${d.driverName ? esc(d.driverName) + ' ' : ''}في الطريق 🚕</div>`;
      }

  return `<div class="reqcard" id="sreq-${id}" style="margin-bottom:9px">
        <div class="reqtop"><div class="reqphone"><i class="fas fa-phone"></i>${esc(d.phone || '-')}${userBadge}</div><div class="reqtimes"><span class="reqtime"><i class="fas fa-clock"></i>${fmt(d.ts || Date.now())}</span></div></div>
        <div class="reqdetails"><i class="fas fa-map-marker-alt"></i><span>${esc(d.details || '-')}</span></div>
        ${nearestBadge}
        ${d.addedBy ? `<div style="font-size:10px;color:var(--text4);margin-bottom:6px"><i class="fas fa-user" style="margin-left:3px"></i>${esc(d.addedBy)}</div>` : ''}
        ${statusBanner}
        <div class="reqacts">
          <button class="rca rca-primary" onclick="openTaxiSel('${id}','${eAt(d.phone || '')}','${eAt(d.details || '')}','${id}',${reqLat || 'null'},${reqLng || 'null'})"><i class="fas fa-car-side"></i> إرسال لسائق</button>
          ${(d.lat && d.lng) || (d.hasGps && d.userLat && d.userLng) ? `
  <button class="rca rca-green" onclick="showUserGpsOnMap('${id}',${d.lat || d.userLat},${d.lng || d.userLng},'${esc(d.phone || '')}')">
    <i class="fas fa-map-location-dot"></i> موقع الزبون
  </button>
`: ''}
          <button class="rca rca-amber"   onclick="openEditReq('${id}','${eAt(d.phone || '')}','${eAt(d.details || '')}')"><i class="fas fa-pen"></i></button>
          <button class="rca rca-red"     onclick="cancelReq('${id}')"><i class="fas fa-ban"></i></button>
          <button class="rca rca-gray"    onclick="delRecvItem('${id}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>`;
    }).join('');
  }); addL(r);
};

window.showUserGpsOnMap = (reqId, lat, lng, phone) => {
  // إزالة خريطة قديمة إن وجدت
  const old = document.getElementById('user-gps-modal');
  if (old) old.remove();

  const modal = document.createElement('div');
  modal.id = 'user-gps-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:7000;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px';
  modal.innerHTML = `
    <div style="background:var(--bg-card);border-radius:16px;width:100%;max-width:500px;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,.5)">
      <div style="padding:14px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border)">
        <div style="font-weight:800;font-size:14px;color:var(--text);display:flex;align-items:center;gap:8px">
          <i class="fas fa-map-location-dot" style="color:var(--green)"></i>
          موقع الزبون — ${phone}
        </div>
        <button onclick="document.getElementById('user-gps-modal').remove()" 
          style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:18px;padding:4px">✕</button>
      </div>
      <div id="ugps-map" style="height:320px"></div>
      <div style="padding:10px 14px;display:flex;gap:8px">
        <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank"
          style="flex:1;padding:10px;background:var(--primary);border-radius:9px;color:#fff;font-size:12px;font-weight:700;text-align:center;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px">
          <i class="fas fa-map"></i> فتح Google Maps
        </a>
        <button onclick="document.getElementById('user-gps-modal').remove()"
          style="padding:10px 16px;background:var(--bg2);border:1px solid var(--border);border-radius:9px;color:var(--text2);font-size:12px;font-weight:700;cursor:pointer;font-family:'Cairo',sans-serif">
          إغلاق
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  // تهيئة الخريطة
  setTimeout(() => {
    try {
      const m = L.map('ugps-map', { zoomControl: true }).setView([lat, lng], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(m);
      const icon = L.divIcon({
        html: `<div style="display:flex;flex-direction:column;align-items:center;gap:3px">
          <div style="width:20px;height:20px;background:#10B981;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(16,185,129,.3)"></div>
          <div style="background:#10B981;color:#fff;font-size:10px;font-weight:800;padding:2px 8px;border-radius:5px;white-space:nowrap;font-family:Cairo,sans-serif">📍 ${phone}</div>
        </div>`,
        className: '', iconSize: [80, 45], iconAnchor: [40, 20]
      });
      L.marker([lat, lng], { icon }).addTo(m).bindPopup(`<div style="font-family:Cairo,sans-serif;text-align:center;font-weight:700">📞 ${phone}</div>`).openPopup();
    } catch (e) { console.warn('ugps map error', e); }
  }, 200);
};

const loadSupNotifList = () => {
const icMap = { accept: 'ni-green', reject: 'ni-red', timeout: 'ni-red', done: 'ni-green', waiting: 'ni-amber', near: 'ni-amber', sos: 'ni-red', cancel: 'ni-red', edit: 'ni-amber', info: 'ni-blue', rating: 'ni-green', user_request: 'ni-green', new_driver: 'ni-amber', alert_gps: 'ni-red', alert_shift: 'ni-amber', alert_pending: 'ni-red' };
  const icoMap = { accept: 'check', reject: 'times', timeout: 'clock', done: 'flag-checkered', waiting: 'hourglass-half', near: 'map-pin', sos: 'triangle-exclamation', cancel: 'ban', edit: 'pen', info: 'info', rating: 'star', user_request: 'globe', new_driver: 'user-plus', alert_gps: 'location-crosshairs', alert_shift: 'hourglass-end', alert_pending: 'triangle-exclamation' };
  const r = tRef('notifications');
  onValue(r, snap => {
    const list = $('supNotifList'); if (!list) return;
    if (!snap.exists()) { list.innerHTML = `<div style="text-align:center;padding:14px;color:var(--text4);font-size:12px">لا يوجد تنبيهات</div>`; return; }
    const items = Object.entries(snap.val()).sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0)).slice(0, 30);
    list.innerHTML = items.map(([nid, n]) => `<div class="notif-item ${n.read ? '' : 'unread'}" style="padding-left:40px">
      <div class="notif-ic ${icMap[n.type] || 'ni-blue'}"><i class="fas fa-${icoMap[n.type] || 'bell'}"></i></div>
      <div class="notif-body"><div class="notif-title">${esc(n.msg || '')}</div>${n.reason ? `<div class="notif-sub">السبب: ${esc(n.reason)}</div>` : ''}<div class="notif-time">${fmt(n.ts || Date.now())}</div></div>
      <button class="notif-del-btn" onclick="delNotif('${nid}')" style="position:absolute;left:8px;top:50%;transform:translateY(-50%)"><i class="fas fa-times"></i></button>
    </div>`).join('');
    items.filter(([, n]) => !n.read).forEach(([nid]) => update(tRef(`notifications/${nid}`), { read: true }).catch(() => { }));
  }); addL(r);
};

let _addReqBusy = false;
window.addReqItem = async () => {
  if (_addReqBusy) return;
  const phone = ($('req-phone').value || '').trim();
  const details = ($('req-details').value || '').trim();
  if (!phone || !details) return shAl('al-req', 'err', 'يرجى ملء جميع الحقول');
  if (!/^[0-9+]{7,15}$/.test(phone.replace(/\s/g, ''))) return shAl('al-req', 'err', 'رقم الهاتف غير صحيح');
  _addReqBusy = true;
  const btn = $('MaddReq').querySelector('.bp'), origText = btn ? btn.innerHTML : '';
  if (btn) { btn.innerHTML = '<span class="spin"></span> جار...'; btn.disabled = true; }
  try {
    await push(tRef('recvRequests'), { phone, details, ts: serverTimestamp(), addedBy: CU?.name || 'المشرف' });
    $('req-phone').value = ''; $('req-details').value = '';
    toast('ok', '✅ تم إضافة الطلب', ''); playSound('notif'); CM('MaddReq');
  } catch (err) { shAl('al-req', 'err', 'خطأ: ' + (err.message || '')); }
  finally { if (btn) { btn.innerHTML = origText; btn.disabled = false; } setTimeout(() => { _addReqBusy = false; }, 1000); }
};

window.delRecvItem = async id => { if (!confirm('حذف هذا الطلب؟')) return; await remove(tRef(`recvRequests/${id}`)); toast('ok', 'تم الحذف', ''); };
window.openEditReq = (id, phone, details) => {
  $('editreq-id').value = id;
  $('editreq-phone').value = phone.replace(/&#39;/g, "'");
  $('editreq-details').value = details.replace(/&#39;/g, "'");
  $('editReqOldData').innerHTML = `<div style="background:var(--red-l);border:1px solid var(--red-m);border-radius:var(--r);padding:9px;font-size:12px;margin-bottom:10px"><div style="font-size:10px;font-weight:700;color:var(--red);margin-bottom:3px"><i class="fas fa-times-circle"></i> البيانات الحالية</div><div>${esc(phone.replace(/&#39;/g, "'"))} • ${esc(details.replace(/&#39;/g, "'"))}</div></div>`;
  OM('MeditReq');
};
window.saveReqEdit = async () => {
  const id = $('editreq-id').value, np = ($('editreq-phone').value || '').trim(), nd = ($('editreq-details').value || '').trim();
  if (!np || !nd) return shAl('al-editreq', 'err', 'يرجى ملء جميع الحقول');
  const snap = await get(tRef(`recvRequests/${id}`)).catch(() => null), old = snap && snap.exists() ? snap.val() : {};
  await update(tRef(`recvRequests/${id}`), { phone: np, details: nd, editedAt: Date.now(), editedBy: CU.name, prevPhone: old.phone || '', prevDetails: old.details || '' });
  const drsnap = await get(tRef('driverRequests')).catch(() => null);
  if (drsnap && drsnap.exists()) {
    Object.entries(drsnap.val()).forEach(([drvId, reqs]) => {
      if (!reqs) return;
      Object.entries(reqs).forEach(([rid, req]) => {
        if (req.phone === old.phone && req.status !== 'rejected' && req.status !== 'done' && req.status !== 'cancelled') {
          update(tRef(`driverRequests/${drvId}/${rid}`), { status: 'modified', phone: np, details: nd, prevPhone: old.phone, prevDetails: old.details, modifiedAt: Date.now(), driverConfirmed: false }).catch(() => { });
          push(tRef(`driverPushNotifs/${drvId}`), { title: '✏️ تم تعديل طلبك', body: `📞 ${np}\n📍 ${nd}`, type: 'edit_request', ts: Date.now(), read: false }).catch(() => { });
        }
      });
    });
  }
  await push(tRef('notifications'), { type: 'edit', msg: `✏️ تعديل طلب: ${np} — ${nd}`, ts: serverTimestamp(), read: false });
  CM('MeditReq'); toast('ok', 'تم التعديل', ''); playSound('edit');
};

window.cancelReq = async id => {
  if (!confirm('إلغاء هذا الطلب؟')) return;
  const snap = await get(tRef(`recvRequests/${id}`)).catch(() => null), old = snap && snap.exists() ? snap.val() : {};
  const drsnap = await get(tRef('driverRequests')).catch(() => null);
  if (drsnap && drsnap.exists()) {
    for (const [drvId, reqs] of Object.entries(drsnap.val())) {
      if (!reqs) continue;
      for (const [rid, req] of Object.entries(reqs)) {
        if (req.phone === old.phone && req.status !== 'rejected' && req.status !== 'done') {
          await update(tRef(`driverRequests/${drvId}/${rid}`), { status: 'cancelled', cancelledAt: Date.now() });
          await update(tRef(`drivers/${drvId}`), { taxiColor: 'green', status: 'online', lastSeen: Date.now() }).catch(() => { });
          push(tRef(`driverPushNotifs/${drvId}`), { title: '🚫 تم إلغاء الطلب', body: `إلغاء طلب: ${old.phone || ''}`, type: 'cancel', ts: Date.now(), read: false }).catch(() => { });
        }
      }
    }
  }
  if (old.userReqRef) await update(ref(_db, old.userReqRef), { driverStatus: 'cancelled', cancelledAt: Date.now() }).catch(() => { });
  await push(tRef('notifications'), { type: 'cancel', msg: `🚫 إلغاء: ${old.phone || id}`, ts: serverTimestamp(), read: false });
  await remove(tRef(`recvRequests/${id}`)); toast('ok', 'تم الإلغاء', ''); playSound('cancel');
};

window.sendSosBroadcast = async () => {
  const msg = ($('sos-sup-msg').value || '').trim(); if (!msg) return toast('warn', 'يرجى كتابة رسالة الطوارئ', '');
  await update(tRef('sosActive'), { msg, senderName: CU.name, ts: Date.now(), acked: {} });
  await push(tRef('notifications'), { type: 'sos', msg: `🆘 SOS من المشرف: ${msg}`, ts: serverTimestamp(), read: false });
  $('SosSupModal').classList.remove('on'); $('sos-sup-msg').value = '';
  toast('err', '🆘 SOS أُرسل لجميع السائقين', ''); playSound('sos'); vibrate([400, 100, 400, 100, 400]);
};

/* ══════════════════════════════════════════════════
   SELECT TAXI
   ══════════════════════════════════════════════════ */
window.openTaxiSel = (reqId, phone, details, recvReqId = '', reqLat = null, reqLng = null) => {
  selTaxiId = null; selReqData = { id: reqId, phone: phone.replace(/&#39;/g, "'"), details: details.replace(/&#39;/g, "'"), recvReqId: recvReqId || reqId };
  const list = $('sel-taxi-list');
  const hasGps = !!(reqLat && reqLng);
  const sorted = hasGps ? getSortedDriversByDistance(reqLat, reqLng, allDrvs) : Object.entries(allDrvs).map(([id, d]) => ({ id, d, dist: null, cs: getTCS(d) })).sort((a, b) => {
    const ao = a.cs.monCls === 'st-online' ? 0 : a.cs.monCls === 'st-break' ? 1 : 2;
    const bo = b.cs.monCls === 'st-online' ? 0 : b.cs.monCls === 'st-break' ? 1 : 2;
    return ao - bo;
  });
  if (!sorted.length) { list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3)">لا يوجد سائقون</div>'; $('SelTaxiModal').classList.add('on'); return; }
  const recommendedId = (sorted.find(x => x.cs.monCls === 'st-online') || {}).id || null;
  const alSel = $('al-seltaxi');
  if (alSel) alSel.innerHTML = (hasGps && recommendedId)
    ? `<div style="background:var(--cyan-l);border:1px solid var(--cyan-m);border-radius:var(--r);padding:9px 12px;margin-bottom:10px;font-size:12px;font-weight:700;color:#0E7490"><i class="fas fa-route"></i> اقتراح النظام: أقرب سائق متاح محدّد أدناه ⭐ — يمكنك تغيير الاختيار قبل الإرسال</div>`
    : (!hasGps ? `<div style="background:var(--amber-l);border:1px solid var(--amber-m);border-radius:var(--r);padding:9px 12px;margin-bottom:10px;font-size:11px;color:var(--amber)"><i class="fas fa-info-circle"></i> لا يوجد موقع GPS لهذا الطلب — اختر السائق يدوياً</div>` : '');
  list.innerHTML = sorted.map(({ id, d, dist, cs }) => `<div class="sel-taxi-item" id="stitem-${id}" onclick="selectTaxi('${id}')" style="${id === recommendedId ? 'border:1.5px solid #0EA5E9;background:var(--primary-l)' : ''}">
      <div style="width:40px;height:40px;border-radius:11px;border:2px solid ${cs.border};background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🚕</div>
      <div style="flex:1"><div style="font-weight:800;font-size:13px;color:var(--text)">${esc(d.name)} ${id === recommendedId ? '<span style="color:#0EA5E9;font-size:10px">⭐ الأقرب</span>' : ''}</div><div style="font-size:11px;color:${cs.dot}">${cs.label}</div>${dist != null ? `<div style="font-size:10px;color:var(--primary);font-weight:700">📍 ${dist.toFixed(1)} كم</div>` : ''}${d.carNumber ? `<div style="font-size:10px;color:var(--text4)">🚗 ${esc(d.carNumber)}</div>` : ''}<span class="deliv-badge" style="font-size:10px;padding:2px 7px;margin-top:3px;display:inline-flex"><i class="fas fa-box"></i> ${d.totalDeliveries || 0}</span></div>
      <i class="fas fa-check-circle" id="stchk-${id}" style="display:none;color:var(--primary);font-size:18px"></i>
    </div>`).join('');
  $('SelTaxiModal').classList.add('on'); $('confirmSelBtn').disabled = true; $('confirmSelBtn').style.opacity = '.5';
  if (recommendedId) selectTaxi(recommendedId);
};
window.selectTaxi = id => {
  if (selTaxiId) { const p = $(`stitem-${selTaxiId}`); if (p) p.classList.remove('selected'); const c = $(`stchk-${selTaxiId}`); if (c) c.style.display = 'none'; }
  selTaxiId = id;
  const el = $(`stitem-${id}`); if (el) el.classList.add('selected');
  const chk = $(`stchk-${id}`); if (chk) chk.style.display = 'block';
  $('confirmSelBtn').disabled = false; $('confirmSelBtn').style.opacity = '1';
};
window.closeTaxiSel = () => { $('SelTaxiModal').classList.remove('on'); selTaxiId = null; selReqData = null; };

let _sendBusy = false;
window.confirmTaxiSel = async () => {
  if (!selTaxiId || !selReqData || _sendBusy) return;
  const msg = prompt('رسالة للسائق (اختياري):', ''); if (msg === null) return;
  _sendBusy = true;
  const btn = $('confirmSelBtn'); btn.innerHTML = '<span class="spin"></span>'; btn.disabled = true; btn.style.opacity = '.7';
  try {
    const recvSnap = await get(tRef(`recvRequests/${selReqData.recvReqId}`)).catch(() => null), recvData = recvSnap && recvSnap.exists() ? recvSnap.val() : {};
    const payload = { phone: selReqData.phone, details: selReqData.details, status: 'pending', ts: Date.now(), sentBy: CU.name, sentAt: Date.now() };
    if (msg) payload.message = msg;
    if (recvData.fromUser && recvData.userReqRef) { payload.fromUser = true; payload.userReqRef = recvData.userReqRef; }
    const reqRef = await push(tRef(`driverRequests/${selTaxiId}`), payload);
    await push(tRef(`driverPushNotifs/${selTaxiId}`), { title: `📦 ${recvData.fromUser ? 'طلب مستخدم' : 'طلب جديد'}`, body: `📞 ${selReqData.phone}\n📍 ${selReqData.details}${msg ? '\n💬 ' + msg : ''}`, type: 'new_request', reqId: reqRef.key, ts: Date.now(), read: false });
    toast('ok', 'تم إرسال الطلب للسائق 🚕', ''); playSound('notif'); closeTaxiSel();
  } catch (err) { toast('err', 'خطأ', err.message || ''); }
  btn.innerHTML = '<i class="fas fa-paper-plane"></i> إرسال'; btn.disabled = false; btn.style.opacity = '1';
  setTimeout(() => { _sendBusy = false; }, 1500);
};


/* ══════════════════════════════════════════════════
   FULL MAP — SUPERVISOR
   ══════════════════════════════════════════════════ */
const renderMapSup = () => {
  $('dbody').innerHTML = `
  <div style="height:calc(100vh - 60px - 70px);display:flex;flex-direction:column;position:relative;overflow:hidden">
    <div class="ststrip" style="flex-shrink:0">
      <div class="st"><div class="stic" style="background:var(--green-l)"><i class="fas fa-circle" style="color:var(--green)"></i></div><div><div class="stv" id="mG">0</div><div class="stl">متاح 🟢</div></div></div>
      <div class="st"><div class="stic" style="background:var(--orange-l)"><i class="fas fa-hourglass-half" style="color:var(--orange)"></i></div><div><div class="stv" id="mO">0</div><div class="stl">استراحة 🟠</div></div></div>
      <div class="st"><div class="stic" style="background:var(--red-l)"><i class="fas fa-car" style="color:var(--red)"></i></div><div><div class="stv" id="mR">0</div><div class="stl">مشغول 🔴</div></div></div>
      <div class="st"><div class="stic" style="background:var(--bg3)"><i class="fas fa-users" style="color:var(--text3)"></i></div><div><div class="stv" id="mTot">0</div><div class="stl">المجموع</div></div></div>
    </div>
    <div id="driverMap" style="flex:1;min-height:0;position:relative;z-index:1"></div>
    <div class="map-legend">
      <div style="font-size:11px;font-weight:800;color:var(--text);margin-bottom:6px">🚕 حالات السائقين</div>
      <div class="map-legend-item"><div class="leg-dot" style="background:#059669"></div>متاح 🟢</div>
      <div class="map-legend-item"><div class="leg-dot" style="background:#EA580C"></div>استراحة 🟠</div>
      <div class="map-legend-item"><div class="leg-dot" style="background:#DC2626"></div>مشغول 🔴</div>
      <div class="map-legend-item"><div class="leg-dot" style="background:#64748B"></div>غير متصل ⚫</div>
      <div style="margin-top:6px;font-size:10px;color:var(--text4)">GPS: كل 90 ثانية</div>
    </div>
  </div>`;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const el = $('driverMap'); if (!el || leafletMap) return;
    try {
      leafletMap = L.map('driverMap', { zoomControl: true }).setView([32.31, 35.03], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(leafletMap);
    } catch (e) { return; }
    const refreshMap = () => {
      if (!leafletMap) return;
      const ent = Object.entries(allDrvs);
      const upd = (id, v) => { const e = $(id); if (e) e.textContent = v; };
      upd('mG', ent.filter(([, d]) => getTCS(d).monCls === 'st-online').length);
      upd('mO', ent.filter(([, d]) => getTCS(d).monCls === 'st-break').length);
      upd('mR', ent.filter(([, d]) => getTCS(d).monCls === 'st-busy').length);
      upd('mTot', ent.length);
      ent.forEach(([id, d]) => { if (d.lat && d.lng) updateMapMarker(id, d); });
    };
    refreshMap(); onDriversUpdate(() => { if (!leafletMap) return; refreshMap(); });
  }));
};

const updateMapMarker = (id, d) => {
  if (!leafletMap) return;
  const cs = getTCS(d);
  const age = d.locUpdated ? Date.now() - d.locUpdated : 999999;
  const stale = age > 300000 ? `<div style="background:#FEF2F2;color:#DC2626;font-size:8px;font-weight:700;padding:1px 5px;border-radius:4px;white-space:nowrap">⚠️ موقع قديم</div>` : '';
  const shiftLbl = d.shiftStart && d.status !== 'offline' ? `<div class="drv-marker-time">⏱ ${fmtElapsed(Date.now() - d.shiftStart)}</div>` : '';
  const icon = L.divIcon({ html: `<div class="drv-marker-wrap"><div class="drv-marker" style="border-color:${cs.border}">🚕</div><div class="drv-marker-name">${d.name} ${cs.emoji}</div>${shiftLbl}${stale}</div>`, className: '', iconSize: [60, 72], iconAnchor: [30, 72] });
  const pop = `<div style="text-align:center;padding:4px;min-width:140px;font-family:'Cairo',sans-serif">
    <div style="font-weight:800;font-size:13px;margin-bottom:4px">${d.name}</div>
    <div style="font-size:11px;color:${cs.dot}">${cs.label}</div>
    ${d.phone ? `<div style="font-size:11px;color:var(--text3)">${d.phone}</div>` : ''}
    <div style="font-size:11px;color:var(--primary);margin-top:3px;font-weight:700">📦 ${d.totalDeliveries || 0} توصيلة</div>
    ${d.locUpdated ? `<div style="font-size:10px;color:${age > 300000 ? 'var(--red)' : 'var(--text4)'};margin-top:2px">آخر تحديث: ${fmt(d.locUpdated)}</div>` : ''}
    <a href="https://www.google.com/maps?q=${d.lat},${d.lng}" target="_blank" style="display:inline-block;margin-top:8px;padding:5px 12px;background:var(--primary);color:#fff;border-radius:7px;font-size:11px;text-decoration:none;font-family:Cairo,sans-serif">Google Maps</a>
  </div>`;
  if (mapMarkers[id]) { mapMarkers[id].setLatLng([d.lat, d.lng]); mapMarkers[id].setIcon(icon); mapMarkers[id].getPopup()?.setContent(pop); }
  else { mapMarkers[id] = L.marker([d.lat, d.lng], { icon }).addTo(leafletMap).bindPopup(pop); }
};

/* ══════════════════════════════════════════════════
   HEATMAP TAB
   ══════════════════════════════════════════════════ */
const loadHeatPlugin = () => new Promise(resolve => {
  if (window.L && window.L.heatLayer) return resolve();
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js';
  s.onload = () => resolve();
  s.onerror = () => resolve();
  document.head.appendChild(s);
});

const renderHeatmap = async () => {
  $('dbody').innerHTML = `
  <div style="height:calc(100vh - 60px - 70px);display:flex;flex-direction:column">
    <div class="ststrip" style="flex-shrink:0">
      <div class="st"><div class="stic" style="background:var(--red-l)"><i class="fas fa-fire" style="color:var(--red)"></i></div><div><div class="stv" id="hmTotal">0</div><div class="stl">إجمالي الطلبات المسجّلة</div></div></div>
      <div class="st"><div class="stic" style="background:var(--amber-l)"><i class="fas fa-clock" style="color:var(--amber)"></i></div><div><div class="stv" id="hmPeak">--</div><div class="stl">ساعة الذروة</div></div></div>
    </div>
    <div id="heatMapEl" style="flex:1;min-height:0"></div>
    <div style="padding:8px 14px;background:var(--bg-card);border-top:1px solid var(--border)">
      <div style="font-size:11px;color:var(--text3);margin-bottom:6px;font-weight:700"><i class="fas fa-chart-column"></i> الطلبات حسب ساعة اليوم</div>
      <div id="hmHours" style="display:flex;gap:4px;align-items:flex-end;height:70px;overflow-x:auto"></div>
    </div>
  </div>`;
  await loadHeatPlugin();
  const snap = await get(tRef('requestsLog')).catch(() => null);
  const pts = []; const hourCounts = new Array(24).fill(0);
  if (snap && snap.exists()) {
    Object.values(snap.val()).forEach(p => {
      if (p.lat && p.lng) pts.push([p.lat, p.lng, 1]);
      if (p.ts) hourCounts[new Date(p.ts).getHours()]++;
    });
  }
  const hmTotalEl = $('hmTotal'); if (hmTotalEl) hmTotalEl.textContent = pts.length;
  const maxH = Math.max(...hourCounts, 1);
  const peakHour = hourCounts.indexOf(maxH);
  const hmPeakEl = $('hmPeak'); if (hmPeakEl) hmPeakEl.textContent = pts.length ? `${peakHour}:00 - ${peakHour + 1}:00` : '--';
  const hoursEl = $('hmHours');
  if (hoursEl) hoursEl.innerHTML = hourCounts.map((c, h) => `<div style="display:flex;flex-direction:column;align-items:center;gap:3px;min-width:22px">
      <div style="width:16px;height:${Math.max(4, (c / maxH) * 55)}px;background:${c === maxH && c > 0 ? 'var(--red)' : 'var(--primary)'};border-radius:3px 3px 0 0"></div>
      <div style="font-size:8px;color:var(--text4)">${h}</div>
    </div>`).join('');
  setTimeout(() => {
    const el = $('heatMapEl'); if (!el) return;
    try {
      const hm = L.map('heatMapEl', { zoomControl: true }).setView([32.31, 35.03], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(hm);
      if (window.L.heatLayer && pts.length) L.heatLayer(pts, { radius: 28, blur: 22, maxZoom: 15 }).addTo(hm);
      else if (!pts.length) L.popup().setLatLng([32.31, 35.03]).setContent('<div style="font-family:Cairo,sans-serif;text-align:center">لا توجد بيانات كافية بعد</div>').openOn(hm);
    } catch (e) { console.warn('heatmap error', e); }
  }, 150);
};

/* ══════════════════════════════════════════════════
   NOTIFICATIONS TAB
   ══════════════════════════════════════════════════ */
const renderNotifs = () => {
  $('dbody').innerHTML = `<div class="panel">
    <div class="atitle" style="justify-content:space-between">
      <span style="display:flex;align-items:center;gap:10px"><i class="fas fa-bell"></i> التنبيهات</span>
      <button onclick="clearAllNotifs()" style="padding:7px 14px;background:var(--red-l);border:1px solid var(--red-m);border-radius:9px;color:var(--red);font-size:11px;font-weight:700;cursor:pointer;font-family:'Cairo',sans-serif"><i class="fas fa-trash"></i> حذف الكل</button>
    </div>
    <div id="NLIST"><div style="text-align:center;padding:32px;color:var(--text4)"><div class="spin dark"></div></div></div>
  </div>`;
  const icMap = { accept: 'ni-green', reject: 'ni-red', timeout: 'ni-red', done: 'ni-green', waiting: 'ni-amber', near: 'ni-amber', sos: 'ni-red', cancel: 'ni-red', edit: 'ni-amber', info: 'ni-blue', rating: 'ni-green', user_request: 'ni-green', new_driver: 'ni-amber' };
  const icoMap = { accept: 'check', reject: 'times', timeout: 'clock', done: 'flag-checkered', waiting: 'hourglass-half', near: 'map-pin', sos: 'triangle-exclamation', cancel: 'ban', edit: 'pen', info: 'info', rating: 'star', user_request: 'globe', new_driver: 'user-plus' };
  const r = tRef('notifications');
  onValue(r, snap => {
    const list = $('NLIST'); if (!list) return;
    if (!snap.exists()) { list.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text4)">لا يوجد تنبيهات</div>'; return; }
    const items = Object.entries(snap.val()).sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0)).slice(0, 100);
    list.innerHTML = items.map(([nid, n]) => `<div class="notif-item ${n.read ? '' : 'unread'}">
      <div class="notif-ic ${icMap[n.type] || 'ni-blue'}"><i class="fas fa-${icoMap[n.type] || 'bell'}"></i></div>
      <div class="notif-body"><div class="notif-title">${esc(n.msg || '')}</div>${n.reason ? `<div class="notif-sub">السبب: ${esc(n.reason)}</div>` : ''}<div class="notif-time">${fmt(n.ts || Date.now())}</div></div>
      <button class="notif-del-btn" onclick="delNotif('${nid}')"><i class="fas fa-times"></i></button>
    </div>`).join('');
    items.filter(([, n]) => !n.read).forEach(([nid]) => update(tRef(`notifications/${nid}`), { read: true }).catch(() => { }));
    const b = $('notif-badge'); if (b) b.style.display = 'none';
    const mb = $('mob-notif-badge'); if (mb) mb.style.display = 'none';
  }); addL(r);
};
window.delNotif = async nid => remove(tRef(`notifications/${nid}`)).catch(() => { });
window.clearAllNotifs = async () => { if (!confirm('حذف كل التنبيهات؟')) return; if (!confirm('تأكيد نهائي؟')) return; await remove(tRef('notifications')).catch(() => { }); toast('ok', 'تم الحذف', ''); };

/* ══════════════════════════════════════════════════
   APPROVALS TAB
   ══════════════════════════════════════════════════ */
const renderApprovals = () => {
  $('dbody').innerHTML = `<div class="panel"><div class="atitle"><i class="fas fa-user-check" style="color:var(--green)"></i> طلبات انضمام السائقين</div><div id="PENDING_LIST"><div style="text-align:center;padding:32px;color:var(--text4)"><div class="spin dark"></div></div></div></div>`;
  loadPendingDrivers();
};
const loadPendingDrivers = async () => {
  const list = $('PENDING_LIST'); if (!list) return;
  const snap = await get(tRef('drivers')).catch(() => null);
  if (!snap || !snap.exists()) { list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text4)">لا يوجد طلبات انضمام</div>'; return; }
  const all = Object.entries(snap.val());
  const pending = all.filter(([, d]) => d.approvalStatus === 'pending');
  const approved = all.filter(([, d]) => d.approvalStatus === 'approved' || (!d.approvalStatus && d.role === 'driver'));
  const rejected = all.filter(([, d]) => d.approvalStatus === 'rejected');
  list.innerHTML = `
    ${pending.length > 0 ? `<div style="margin-bottom:20px">
      <div style="font-family:'Tajawal',sans-serif;font-size:16px;font-weight:900;color:var(--amber);margin-bottom:12px"><i class="fas fa-clock"></i> ينتظر الموافقة (${pending.length})</div>
      ${pending.map(([id, d]) => `<div style="background:var(--bg);border:1.5px solid var(--amber-m);border-radius:var(--rl);padding:16px;margin-bottom:10px;box-shadow:var(--shadow)">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
          <div style="width:48px;height:48px;border-radius:13px;background:var(--amber-l);border:2px solid var(--amber-m);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0">🚕</div>
          <div style="flex:1"><div style="font-size:14px;font-weight:800;color:var(--text)">${esc(d.name)}</div><div style="font-size:12px;color:var(--text3)">${esc(d.phone || '-')}</div><div style="font-size:11px;color:var(--text4)">🚗 ${esc(d.carNumber || '-')}</div></div>
        </div>
        <div style="display:flex;gap:8px">
          <button onclick="approveDriver('${id}')" style="flex:1;padding:10px;background:var(--green);border:none;border-radius:10px;color:#fff;font-size:13px;font-weight:800;cursor:pointer;font-family:'Cairo',sans-serif"><i class="fas fa-check"></i> قبول</button>
          <button onclick="rejectDriver('${id}','${eAt(d.name)}')" style="flex:1;padding:10px;background:var(--red-l);border:1px solid var(--red-m);border-radius:10px;color:var(--red);font-size:13px;font-weight:800;cursor:pointer;font-family:'Cairo',sans-serif"><i class="fas fa-times"></i> رفض</button>
        </div>
      </div>`).join('')}
    </div>` : ''}
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px">
      <div style="flex:1;min-width:100px;background:var(--green-l);border:1.5px solid var(--green-m);border-radius:var(--rl);padding:16px;text-align:center"><div style="font-size:28px;font-weight:900;color:var(--green)">${approved.length}</div><div style="font-size:12px;color:var(--text3);margin-top:4px">✅ مقبولون</div></div>
      <div style="flex:1;min-width:100px;background:var(--amber-l);border:1.5px solid var(--amber-m);border-radius:var(--rl);padding:16px;text-align:center"><div style="font-size:28px;font-weight:900;color:var(--amber)">${pending.length}</div><div style="font-size:12px;color:var(--text3);margin-top:4px">⏳ معلقون</div></div>
      <div style="flex:1;min-width:100px;background:var(--red-l);border:1.5px solid var(--red-m);border-radius:var(--rl);padding:16px;text-align:center"><div style="font-size:28px;font-weight:900;color:var(--red)">${rejected.length}</div><div style="font-size:12px;color:var(--text3);margin-top:4px">❌ مرفوضون</div></div>
    </div>`;
};
window.approveDriver = async drvId => {
  if (!confirm('قبول هذا السائق؟')) return;
  await update(tRef(`drivers/${drvId}`), { approvalStatus: 'approved', status: 'online', taxiColor: 'green', approvedBy: CU.name, approvedAt: Date.now() });
  await push(tRef('notifications'), { type: 'accept', msg: `✅ تم قبول السائق: ${drvId}`, ts: serverTimestamp(), read: false });
  await push(tRef(`driverPushNotifs/${drvId}`), { title: '✅ تم قبول حسابك!', body: 'يمكنك الآن الدخول والعمل', type: 'info', ts: Date.now(), read: false });
  toast('ok', 'تم قبول السائق ✅', ''); playSound('accept'); loadPendingDrivers();
};
window.rejectDriver = async (drvId, drvName) => {
  const reason = prompt(`سبب رفض "${drvName}" (اختياري):`, ''); if (reason === null) return;
  await update(tRef(`drivers/${drvId}`), { approvalStatus: 'rejected', status: 'offline', rejectedBy: CU.name, rejectedAt: Date.now(), rejectionReason: reason || '-' });
  await push(tRef('notifications'), { type: 'reject', msg: `❌ رفض: ${drvId}`, ts: serverTimestamp(), read: false });
  toast('info', 'تم الرفض', ''); loadPendingDrivers();
};

/* ══════════════════════════════════════════════════
   ACCOUNTS TAB
   ══════════════════════════════════════════════════ */
const renderAccs = () => {
  $('dbody').innerHTML = `<div class="panel">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <div class="atitle" style="margin-bottom:0;flex:1"><i class="fas fa-users"></i> إدارة السائقين</div>
      <input type="text" id="drv-search" placeholder="🔍 بحث..." style="padding:9px 14px;border:1.5px solid var(--border);border-radius:var(--r);font-size:13px;font-family:'Cairo',sans-serif;outline:none;min-width:180px" oninput="filterDrvAccs(this.value)">
    </div>
    <div class="acc-grid" id="ALIST"><div style="text-align:center;padding:32px;color:var(--text4);grid-column:1/-1"><div class="spin dark"></div></div></div>
  </div>`;
  requestAnimationFrame(loadAccs);
};
const loadAccs = async () => {
  const list = $('ALIST'); if (!list) return;
  try {
    const snap = await get(tRef('drivers')).catch(() => null); if (!$('ALIST')) return;
    if (!snap || !snap.exists()) { list.innerHTML = '<div style="color:var(--text3);text-align:center;padding:32px;grid-column:1/-1">لا يوجد سائقون</div>'; return; }
    const all = Object.entries(snap.val());
    list.innerHTML = all.map(([id, d]) => {
      const cst = getTCS(d);
      const statusBadge = d.approvalStatus === 'pending'
        ? `<span style="background:var(--amber-l);color:var(--amber);border:1px solid var(--amber-m);border-radius:20px;padding:2px 8px;font-size:10px;font-weight:700">⏳ ينتظر</span>`
        : d.approvalStatus === 'rejected'
          ? `<span style="background:var(--red-l);color:var(--red);border:1px solid var(--red-m);border-radius:20px;padding:2px 8px;font-size:10px;font-weight:700">❌ مرفوض</span>`
          : `<span style="background:var(--green-l);color:var(--green);border:1px solid var(--green-m);border-radius:20px;padding:2px 8px;font-size:10px;font-weight:700">✅ مقبول</span>`;
      return `<div class="acccard"><div class="acctop">
        <div class="accav">🚕</div>
        <div style="flex:1;min-width:0">
          <div class="accnm">${esc(d.name)}</div>
          <div class="accph"><i class="fas fa-phone"></i> ${esc(d.phone || id)}</div>
          <div class="accph"><i class="fas fa-car"></i> ${esc(d.carNumber || '-')}</div>
          <div style="margin-top:3px;display:flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:${cst.dot}"><div style="width:7px;height:7px;border-radius:50%;background:${cst.dot}"></div>${cst.label}</div>
          <div style="margin-top:3px">${statusBadge}</div>
          <div style="margin-top:4px"><span class="deliv-badge" style="font-size:10px;padding:2px 7px"><i class="fas fa-box"></i> ${d.totalDeliveries || 0} توصيلة</span></div>
        </div>
      </div>
      <div class="accbts">
        <button class="accbtn aedit" onclick="opnEac('${id}','${eAt(d.name)}')"><i class="fas fa-pen"></i> تعديل</button>
        <button class="accbtn adel"  onclick="delAcc('${id}')"><i class="fas fa-trash"></i> حذف</button>
      </div></div>`;
    }).join('');
  } catch (err) { if ($('ALIST')) $('ALIST').innerHTML = `<div style="color:var(--red);text-align:center;padding:32px;grid-column:1/-1">خطأ: ${err.message || ''}</div>`; }
};
window.filterDrvAccs = q => {
  q = q.toLowerCase().trim();
  document.querySelectorAll('#ALIST .acccard').forEach(c => { c.style.display = (!q || c.innerText.toLowerCase().includes(q)) ? '' : 'none'; });
};
window.opnEac = (id, nm) => {
  $('eac-id').value = id; $('eac-nm').value = nm.replace(/&#39;/g, "'").replace(/&quot;/g, '"');
  $('eac-pw').value = ''; $('eacsub').textContent = 'السائق: ' + nm.replace(/&#39;/g, "'"); OM('Meditacc');
};
window.saveEac = async () => {
  const id = $('eac-id').value, nm = ($('eac-nm').value || '').trim(), pw = $('eac-pw').value || '';
  if (!nm) return shAl('al-eac', 'err', 'الاسم مطلوب');
  const btn = $('Meditacc').querySelector('.ba'), orig = btn.innerHTML;
  btn.innerHTML = '<span class="spin"></span>'; btn.disabled = true;
  try {
    const u = { name: nm }; if (pw) { u.pwHash = await _h(pw); u.password = null; }
    await update(tRef(`drivers/${id}`), u); CM('Meditacc'); toast('ok', 'تم التعديل ✅', ''); loadAccs();
  } catch (err) { shAl('al-eac', 'err', 'خطأ: ' + (err.message || '')); }
  btn.innerHTML = orig; btn.disabled = false;
};
window.delAcc = async id => {
  const sn = await get(tRef(`drivers/${id}`)).catch(() => null);
  const nm = sn && sn.exists() ? sn.val().name : id;
  if (!confirm(`حذف حساب "${nm}"؟`)) return;
  try { await remove(tRef(`drivers/${id}`)); toast('ok', 'تم الحذف', ''); loadAccs(); }
  catch (err) { toast('err', 'خطأ', err.message || ''); }
};


/* ══════════════════════════════════════════════════
   REPORTS — DRIVER
   ══════════════════════════════════════════════════ */
const renderDriverReports = async () => {
  $('dbody').innerHTML = `<div class="panel"><div class="atitle"><i class="fas fa-chart-bar"></i> تقاريري</div><div id="DREP"><div style="text-align:center;padding:32px;color:var(--text4)"><div class="spin dark"></div></div></div></div>`;
  const today = new Date().toISOString().split('T')[0];
  const snap = await get(tRef(`drivers/${CU.id}/dailyReport/${today}`)).catch(() => null);
  const td = snap && snap.exists() ? snap.val() : { deliveries: 0, shifts: [] };
  const shifts = td.shifts || [];
  let totalMin = 0;
  const shiftRows = shifts.map((s, i) => {
    const sf = s.start ? new Date(s.start).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) : '-';
    const ef = s.end ? new Date(s.end).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) : 'جارٍ';
    const dur = s.durationMin || (s.end ? Math.round((s.end - s.start) / 60000) : s.start ? Math.round((Date.now() - s.start) / 60000) : 0);
    totalMin += dur;
    return `<div class="report-stat"><span class="report-stat-label">شيفت ${i + 1}: ${sf} — ${ef}</span><span class="report-stat-val" style="color:var(--amber)">${Math.floor(dur / 60)}س ${dur % 60}د</span></div>`;
  }).join('');
  const list = $('DREP'); if (!list) return;
  list.innerHTML = `
    <div class="report-card">
      <div class="report-title"><i class="fas fa-calendar-day"></i> تقرير اليوم — ${today}</div>
      <div class="report-stat"><span class="report-stat-label">توصيلات اليوم</span><span class="report-stat-val">${td.deliveries || 0} 📦</span></div>
      <div class="report-stat"><span class="report-stat-label">إجمالي التوصيلات</span><span class="report-stat-val" style="color:var(--primary)">${CU.totalDeliveries || 0} 📦</span></div>
      <div class="report-stat"><span class="report-stat-label">إجمالي العمل اليوم</span><span class="report-stat-val" style="color:var(--primary)">${Math.floor(totalMin / 60)}س ${totalMin % 60}د</span></div>
      <div class="report-stat"><span class="report-stat-label">عدد الشيفتات</span><span class="report-stat-val">${shifts.length}</span></div>
      ${shiftStartTime ? `<div class="report-stat"><span class="report-stat-label">⏱ الشيفت الحالي</span><span class="report-stat-val" style="color:var(--green)" id="liveTimer">${fmtElapsed(Date.now() - shiftStartTime)}</span></div>` : ''}
    </div>
    ${shifts.length ? `<div class="report-card"><div class="report-title"><i class="fas fa-clock"></i> تفصيل الشيفتات</div>${shiftRows}</div>` : ''}`;
  if (shiftStartTime) setInterval(() => { const e = $('liveTimer'); if (e && shiftStartTime) e.textContent = fmtElapsed(Date.now() - shiftStartTime); }, 1000);
};

/* ══════════════════════════════════════════════════
   REPORTS — SUPERVISOR
   ══════════════════════════════════════════════════ */
const renderSupReports = async () => {
  $('dbody').innerHTML = `<div class="panel"><div class="atitle"><i class="fas fa-chart-bar"></i> تقارير السائقين</div><div id="SREP"><div style="text-align:center;padding:32px;color:var(--text4)"><div class="spin dark"></div></div></div></div>`;
  const today = new Date().toISOString().split('T')[0];
  const snap = await get(tRef('drivers')).catch(() => null);
  const list = $('SREP'); if (!list) return;
  if (!snap || !snap.exists()) { list.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text4)">لا يوجد سائقون</div>'; return; }
  const all = Object.entries(snap.val());
  const reps = await Promise.all(all.map(([id]) => get(tRef(`drivers/${id}/dailyReport/${today}`)).catch(() => null)));
  const totalDel = reps.reduce((s, r) => s + (r && r.exists() ? r.val().deliveries || 0 : 0), 0);
  const totalAllDel = all.reduce((s, [, d]) => s + (d.totalDeliveries || 0), 0);
  const fmtMin = m => `${Math.floor(m / 60)}س ${m % 60}د`;
  const calcMin = rep => { if (!rep || !rep.shifts) return 0; return rep.shifts.reduce((s, sh) => s + (sh.durationMin || (sh.end ? Math.round((sh.end - sh.start) / 60000) : sh.start ? Math.round((Date.now() - sh.start) / 60000) : 0)), 0); };

  /* التقييمات */
  const ratingsSnap = await get(tRef('ratings')).catch(() => null);
  let avgRating = 0, ratingCount = 0;
  if (ratingsSnap && ratingsSnap.exists()) {
    const rArr = Object.values(ratingsSnap.val());
    ratingCount = rArr.length;
    avgRating = rArr.reduce((s, r) => s + (r.stars || 0), 0) / ratingCount;
  }

  list.innerHTML = `
    <div class="report-card">
      <div class="report-title"><i class="fas fa-globe"></i> ملخص اليوم — ${today}</div>
      <div class="report-stat"><span class="report-stat-label">إجمالي السائقين</span><span class="report-stat-val">${all.length}</span></div>
      <div class="report-stat"><span class="report-stat-label">متاح الآن 🟢</span><span class="report-stat-val" style="color:var(--green)">${all.filter(([, d]) => getTCS(d).monCls === 'st-online').length}</span></div>
      <div class="report-stat"><span class="report-stat-label">مشغول الآن 🔴</span><span class="report-stat-val" style="color:var(--red)">${all.filter(([, d]) => getTCS(d).monCls === 'st-busy').length}</span></div>
      <div class="report-stat"><span class="report-stat-label">توصيلات اليوم</span><span class="report-stat-val">${totalDel} 📦</span></div>
      <div class="report-stat"><span class="report-stat-label">إجمالي التوصيلات</span><span class="report-stat-val" style="color:var(--primary)">${totalAllDel} 📦</span></div>
      ${ratingCount > 0 ? `<div class="report-stat"><span class="report-stat-label">متوسط التقييمات ⭐</span><span class="report-stat-val" style="color:var(--amber)">${avgRating.toFixed(1)} / 5 (${ratingCount} تقييم)</span></div>` : ''}
    </div>
    <div class="report-card">
      <div class="report-title"><i class="fas fa-list"></i> تفصيل كل سائق</div>
      ${all.map(([id, d], i) => {
    const rep = reps[i] && reps[i].exists() ? reps[i].val() : { deliveries: 0, shifts: [] };
    const cst = getTCS(d), sm = calcMin(rep);
    return `<div class="report-drv-card"><div style="display:flex;align-items:center;gap:10px">
          <div style="width:44px;height:44px;border-radius:12px;background:var(--bg3);border:2px solid ${cst.border};display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🚕</div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:800;font-size:13px;color:var(--text)">${esc(d.name)}</div>
            <div style="font-size:11px;color:${cst.dot}">${cst.label}</div>
            ${d.shiftStart && d.status !== 'offline' ? `<div style="font-size:11px;color:var(--green)">⏱ ${fmtElapsed(Date.now() - d.shiftStart)}</div>` : ''}
          </div>
          <div style="text-align:center;flex-shrink:0">
            <div style="font-size:16px;font-weight:900;color:var(--green)">${rep.deliveries || 0}</div><div style="font-size:9px;color:var(--text4)">اليوم</div>
            <div style="font-size:14px;font-weight:900;color:var(--primary);margin-top:3px">${d.totalDeliveries || 0}</div><div style="font-size:9px;color:var(--text4)">الكلي</div>
            <div style="font-size:12px;font-weight:800;color:var(--amber);margin-top:3px">${fmtMin(sm)}</div><div style="font-size:9px;color:var(--text4)">عمل</div>
          </div>
        </div></div>`;
  }).join('')}
    </div>
    ${ratingCount > 0 && ratingsSnap ? `<div class="report-card">
      <div class="report-title"><i class="fas fa-star"></i> التقييمات الأخيرة</div>
      ${Object.entries(ratingsSnap.val()).sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0)).slice(0, 10).map(([, r]) =>
    `<div style="padding:10px 0;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;gap:10px">
          <div style="font-size:18px">${'⭐'.repeat(r.stars || 0)}</div>
          <div style="flex:1"><div style="font-size:12px;font-weight:700;color:var(--text)">${esc(r.comment || 'بدون تعليق')}</div>
          <div style="font-size:10px;color:var(--text4);margin-top:3px">📞 ${r.phone || '-'} • ${fmt(r.ts || Date.now())}</div></div>
        </div>`
  ).join('')}
    </div>` : ''}`;
};

/* ══════════════════════════════════════════════════
   SUPPORT TAB
   ══════════════════════════════════════════════════ */
const renderSupport = async role => {
  $('dbody').innerHTML = `<div class="panel">
    <div class="atitle"><i class="fas fa-headset"></i> الدعم الفني</div>
    ${role === 'supervisor' ? `<div style="margin-bottom:16px;padding:14px;background:var(--red-l);border:1.5px solid var(--red-m);border-radius:var(--rl);display:flex;align-items:center;gap:12px">
      <div style="width:44px;height:44px;border-radius:12px;background:var(--red);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🆘</div>
      <div style="flex:1"><div style="font-weight:800;font-size:14px;color:var(--red);margin-bottom:3px">إرسال SOS لجميع السائقين</div></div>
      <button style="padding:10px 18px;background:var(--red);border:none;border-radius:var(--r);color:#fff;font-size:13px;font-weight:800;cursor:pointer;font-family:'Cairo',sans-serif" onclick="OM('SosSupModal')"><i class="fas fa-triangle-exclamation"></i> SOS</button>
    </div>`: ''}
    <div style="background:var(--red-l);border:1.5px solid var(--red-m);border-radius:var(--rl);padding:14px;margin-bottom:16px;display:flex;align-items:center;gap:12px">
      <div style="width:44px;height:44px;border-radius:12px;background:var(--red);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🐛</div>
      <div style="flex:1"><div style="font-weight:800;font-size:14px;color:var(--red)">الإبلاغ عن مشكلة</div><div style="font-size:12px;color:var(--text3)">ساعدنا في تحسين المنصة</div></div>
      <button onclick="reportBug()" style="padding:10px 16px;background:var(--red);border:none;border-radius:var(--r);color:#fff;font-size:12px;font-weight:800;cursor:pointer;font-family:'Cairo',sans-serif"><i class="fas fa-bug"></i> إبلاغ</button>
    </div>
    <div class="support-grid" id="SLIST"><div style="text-align:center;padding:32px;color:var(--text4);grid-column:1/-1"><div class="spin dark"></div></div></div>
  </div>`;

  let all = [];
  if (role === 'driver') {
    const supSnap = await get(tRef('supervisors')).catch(() => null);
    if (supSnap && supSnap.exists()) Object.entries(supSnap.val()).forEach(([id, s]) => { all.unshift(['sup_' + id, { ...s, isSuper: true }]); });
    const drSnap = await get(tRef('drivers')).catch(() => null);
    if (drSnap && drSnap.exists()) Object.entries(drSnap.val()).forEach(([id, d]) => { if (id !== CU.id && d.approvalStatus !== 'rejected') all.push([id, d]); });
  } else {
    const snap = await get(tRef('drivers')).catch(() => null);
    if (snap && snap.exists()) Object.entries(snap.val()).forEach(([id, d]) => all.push([id, d]));
  }

  const list = $('SLIST'); if (!list) return;
  if (!all.length) { list.innerHTML = `<div style="text-align:center;padding:32px;color:var(--text4);grid-column:1/-1">لا يوجد جهات اتصال</div>`; return; }
  list.innerHTML = all.map(([id, d]) => {
    const phone = (d.phone || '').replace(/[^0-9]/g, '').replace(/^0/, '972');
    const waLink = `https://wa.me/${phone}`;
    const c = d.isSuper ? { dot: '#D97706', label: '👨‍💼 المشرف' } : getTCS(d);
    return `<div class="support-drv-card">
      <div style="width:52px;height:52px;border-radius:14px;background:var(--bg2);border:2px solid ${c.dot};display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0">${d.isSuper ? '👨‍💼' : '🚕'}</div>
      <div style="flex:1;min-width:0">
        <div class="support-drv-name">${esc(d.name)}</div>
        <div class="support-drv-phone" style="color:${c.dot}">${c.label}</div>
        ${d.phone ? `<div style="font-size:11px;color:var(--text4)">${d.phone}</div>` : ''}
      </div>
      <a href="${waLink}" target="_blank" class="support-wa-btn"><i class="fab fa-whatsapp"></i> واتساب</a>
    </div>`;
  }).join('');
};
window.reportBug = async () => {
  const msg = prompt('صف المشكلة التي واجهتها:', ''); if (!msg || !msg.trim()) return;
  window.open(`https://wa.me/972595125423?text=${encodeURIComponent(`🐛 بلاغ مشكلة:\n${msg.trim()}`)}`, '_blank');
  await push(tRef('errorLogs'), { msg: msg.trim(), userId: CU?.id || 'anon', userName: CU?.name || 'زائر', role: CR || 'unknown', officeId: TENANT_ID || '-', ts: serverTimestamp() }).catch(() => { });
  toast('ok', '✅ تم فتح واتساب', '');
};

/* ══════════════════════════════════════════════════
   PROFILES
   ══════════════════════════════════════════════════ */
const renderDProfile = () => {
  $('dbody').innerHTML = `<div class="ptab">
    <div class="cbox" style="text-align:center">
      <div class="pav" style="width:84px;height:84px;margin:0 auto 12px;font-size:32px">🚕</div>
      <div style="font-size:17px;font-weight:900;margin-bottom:6px">${esc(CU.name)}</div>
      <span class="sbadge sb-blue">🚕 سائق تكسي</span>
      <div style="margin-top:6px"><span class="deliv-badge"><i class="fas fa-box"></i> ${CU.totalDeliveries || 0} توصيلة</span></div>
    </div>
    <div class="cbox">
      <div class="atitle" style="margin-bottom:14px"><i class="fas fa-user-pen"></i> تعديل بياناتي</div>
      <div class="fg"><label class="fl"><i class="fas fa-user"></i> الاسم</label><input class="fi" id="ep-nm" value="${esc(CU.name)}"></div>
      <div class="fg"><label class="fl"><i class="fas fa-phone"></i> رقم الهاتف</label><input class="fi" value="${esc(CU.phone || '')}" disabled style="opacity:.6"></div>
      <div class="fg"><label class="fl"><i class="fas fa-car"></i> رقم السيارة</label><input class="fi" id="ep-car" value="${esc(CU.carNumber || '')}"></div>
      <div class="fg"><label class="fl"><i class="fas fa-lock"></i> كلمة مرور جديدة</label><input class="fi" type="password" id="ep-pw" placeholder="••••••••"></div>
      <button class="bp" onclick="saveDProf()"><i class="fas fa-save"></i> حفظ التعديلات</button>
      <button class="bdng" onclick="delMyAcc()"><i class="fas fa-trash"></i> حذف حسابي نهائياً</button>
    </div>
  </div>`;
};
window.saveDProf = async () => {
  const nm = ($('ep-nm').value || '').trim();
  const pw = $('ep-pw').value || '';
  const car = ($('ep-car').value || '').trim();
  if (!nm) return toast('err', 'الاسم مطلوب', '');
  const u = { name: nm }; if (pw) { if (pw.length < 6) return toast('err', 'كلمة المرور قصيرة', ''); u.pwHash = await _h(pw); u.password = null; } if (car) u.carNumber = car;
  await update(tRef(`drivers/${CU.id}`), u); CU = { ...CU, ...u }; toast('ok', 'تم الحفظ ✅', '');
};
window.delMyAcc = async () => { if (!confirm('حذف حسابك نهائياً؟')) return; await remove(tRef(`drivers/${CU.id}`)); toast('info', 'تم الحذف', ''); setTimeout(() => logout(), 1200); };

const renderSProfile = () => {
  const info = TENANT_INFO || { name: '-' };
  const inviteCodePlain = TENANT_INVITE[TENANT_ID] || `DRV-${(TENANT_ID || 'XXXX').toUpperCase()}`;
  $('dbody').innerHTML = `<div class="ptab">
    <div class="cbox" style="text-align:center">
      <div class="pav" style="width:84px;height:84px;margin:0 auto 12px;font-size:32px;border-color:var(--amber)">👨‍💼</div>
      <div style="font-size:17px;font-weight:900;margin-bottom:6px">${esc(CU.name)}</div>
      <span class="sbadge sb-amber">👨‍💼 مشرف المكتب</span>
      <div style="margin-top:10px;padding:12px;background:var(--primary-l);border:1.5px solid var(--primary-m);border-radius:var(--r);text-align:right">
        <div style="font-size:11px;color:var(--text3);margin-bottom:4px">🏢 المكتب</div>
        <div style="font-size:14px;font-weight:800;color:var(--text)">${esc(info.name)}</div>
      </div>
      <div style="margin-top:8px;padding:12px;background:linear-gradient(135deg,#D97706,#B45309);border-radius:var(--r);text-align:center">
        <div style="font-size:10px;color:rgba(255,255,255,.7);margin-bottom:4px">🎟️ كود دعوة السائقين</div>
        <div style="font-size:18px;font-weight:900;color:#fff;letter-spacing:3px;font-family:monospace;direction:ltr">${inviteCodePlain}</div>
        <div style="font-size:10px;color:rgba(255,255,255,.5);margin-top:4px">أعطِ هذا الكود للسائقين الجدد</div>
        <button onclick="copyInviteCode('${inviteCodePlain}')" style="margin-top:8px;padding:5px 12px;background:rgba(255,255,255,.2);border:none;border-radius:8px;color:#fff;font-size:11px;cursor:pointer"><i class="fas fa-copy"></i> نسخ</button>
      </div>
    </div>
    <div class="cbox">
      <div class="atitle" style="margin-bottom:14px"><i class="fas fa-user-pen"></i> تعديل بياناتي</div>
      <div class="fg"><label class="fl"><i class="fas fa-user"></i> الاسم</label><input class="fi" id="sp-nm" value="${esc(CU.name)}"></div>
      <button class="ba" onclick="saveSProf()"><i class="fas fa-save"></i> حفظ التعديلات</button>
    </div>
    <div class="cbox">
      <div class="atitle" style="margin-bottom:14px"><i class="fas fa-map-location-dot" style="color:var(--green)"></i> موقع مكتبك على خريطة المستخدمين</div>
      <div style="font-size:12px;color:var(--text3);margin-bottom:10px;padding:10px;background:var(--green-l);border:1px solid var(--green-m);border-radius:var(--r)">
        <i class="fas fa-info-circle" style="color:var(--green)"></i> اضغط على الخريطة لتحديد موقع مكتبك — سيظهر على خريطة المستخدمين العامة
      </div>
      <div id="officeLocMap"></div>
      <div id="officeLocInfo" style="font-size:12px;color:var(--text3);margin-bottom:10px;padding:8px;background:var(--bg2);border-radius:var(--r);border:1px solid var(--border)">
        <i class="fas fa-map-pin" style="color:var(--amber);margin-left:5px"></i>
        <span id="officeLocText">لم يتم تحديد موقع بعد — اضغط على الخريطة</span>
      </div>
      <div class="fg"><label class="fl"><i class="fas fa-store"></i> اسم المكتب للعرض العام</label><input type="text" class="fi" id="office-display-name" placeholder="مثال: مكتب تاكسي المركز"></div>
      <div class="fg"><label class="fl"><i class="fas fa-info-circle"></i> وصف المكتب (اختياري)</label><input type="text" class="fi" id="office-desc" placeholder="مثال: يعمل 24 ساعة • طولكرم"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button onclick="saveOfficeLocation()" style="flex:1;padding:11px;background:var(--green);border:none;border-radius:var(--r);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:'Cairo',sans-serif"><i class="fas fa-save"></i> حفظ الموقع</button>
        <button onclick="hideOfficeFromMap()" style="flex:1;padding:11px;background:var(--red-l);border:1px solid var(--red-m);border-radius:var(--r);color:var(--red);font-size:13px;font-weight:700;cursor:pointer;font-family:'Cairo',sans-serif"><i class="fas fa-eye-slash"></i> إخفاء من الخريطة</button>
      </div>
    </div>
  </div>`;
  setTimeout(() => initOfficeLocMap(), 600);
};
window.copyInviteCode = code => { navigator.clipboard.writeText(code).catch(() => { }); toast('ok', '✅ تم نسخ الكود', 'شاركه مع السائقين الجدد'); };
window.saveSProf = async () => {
  const nm = ($('sp-nm').value || '').trim(); if (!nm) return toast('err', 'الاسم مطلوب', '');
  await update(tRef(`supervisors/${CU.id}`), { name: nm }); CU = { ...CU, name: nm }; toast('ok', 'تم الحفظ ✅', '');
};


/* ══════════════════════════════════════════════════
   OFFICE LOCATION MAP
   ══════════════════════════════════════════════════ */
const initOfficeLocMap = async () => {
  const snap = await get(ref(_db, `publicOffices/${TENANT_ID}`)).catch(() => null);
  const existing = snap && snap.exists() ? snap.val() : null;
  if (existing) {
    _officeLocLat = existing.lat; _officeLocLng = existing.lng;
    const el = $('office-display-name'); if (el) el.value = existing.displayName || '';
    const el2 = $('office-desc'); if (el2) el2.value = existing.desc || '';
    const txt = $('officeLocText');
    if (txt) txt.textContent = `✅ موقع محدد: ${existing.lat?.toFixed(5)}, ${existing.lng?.toFixed(5)} — ${existing.displayName || ''}`;
  }
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const el = $('officeLocMap'); if (!el) return;
    if (_officeLocMap) { try { _officeLocMap.remove(); } catch (e) { } }
    const center = existing ? [existing.lat, existing.lng] : [32.31, 35.03];
    try {
      _officeLocMap = L.map('officeLocMap', { zoomControl: true }).setView(center, 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(_officeLocMap);
      if (existing) {
        _officeLocMarker = L.marker([existing.lat, existing.lng], { draggable: true }).addTo(_officeLocMap)
          .bindPopup('<div style="font-family:Cairo,sans-serif;font-size:13px;text-align:center;font-weight:700">📍 موقع مكتبك الحالي</div>').openPopup();
        _officeLocMarker.on('dragend', e => {
          const pos = e.target.getLatLng(); _officeLocLat = pos.lat; _officeLocLng = pos.lng;
          const txt = $('officeLocText'); if (txt) txt.textContent = `📍 موقع محدد: ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;
        });
      }
      _officeLocMap.on('click', e => {
        _officeLocLat = e.latlng.lat; _officeLocLng = e.latlng.lng;
        if (_officeLocMarker) _officeLocMarker.setLatLng(e.latlng);
        else {
          _officeLocMarker = L.marker(e.latlng, { draggable: true }).addTo(_officeLocMap)
            .bindPopup('<div style="font-family:Cairo,sans-serif;font-size:13px;text-align:center;font-weight:700">📍 موقع مكتبك</div>').openPopup();
          _officeLocMarker.on('dragend', ev => {
            const pos = ev.target.getLatLng(); _officeLocLat = pos.lat; _officeLocLng = pos.lng;
            const txt = $('officeLocText'); if (txt) txt.textContent = `📍 موقع محدد: ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;
          });
        }
        const txt = $('officeLocText'); if (txt) txt.textContent = `📍 موقع محدد: ${_officeLocLat.toFixed(5)}, ${_officeLocLng.toFixed(5)}`;
      });
    } catch (e) { console.warn('officeLocMap error', e); }
  }));
};
window.saveOfficeLocation = async () => {
  if (!_officeLocLat || !_officeLocLng) return toast('warn', 'يرجى تحديد موقع على الخريطة أولاً', '');
  const displayName = ($('office-display-name').value || '').trim() || (TENANT_INFO?.name || 'مكتب تاكسي');
  const desc = ($('office-desc').value || '').trim();
  await set(ref(_db, `publicOffices/${TENANT_ID}`), { lat: _officeLocLat, lng: _officeLocLng, displayName, desc, tenantId: TENANT_ID, officeName: TENANT_INFO?.name || '', visible: true, updatedAt: Date.now() });
  toast('ok', '✅ تم حفظ موقع المكتب', 'يظهر الآن على خريطة المستخدمين'); playSound('accept');
  const txt = $('officeLocText'); if (txt) txt.textContent = `✅ موقع محفوظ: ${_officeLocLat.toFixed(5)}, ${_officeLocLng.toFixed(5)} — ${displayName}`;
};
window.hideOfficeFromMap = async () => {
  if (!confirm('إخفاء مكتبك من الخريطة العامة؟')) return;
  await update(ref(_db, `publicOffices/${TENANT_ID}`), { visible: false }).catch(() => { });
  toast('ok', 'تم الإخفاء', 'مكتبك لن يظهر للمستخدمين');
};

/* ══════════════════════════════════════════════════
   MONITORING SCREEN
   ══════════════════════════════════════════════════ */
window.openMonitor = () => { $('MonitorScreen').classList.add('on'); refreshMonitor(); if (monitorInterval) clearInterval(monitorInterval); monitorInterval = setInterval(refreshMonitor, 30000); };
window.closeMonitor = () => { $('MonitorScreen').classList.remove('on'); if (monitorInterval) { clearInterval(monitorInterval); monitorInterval = null; } };

const refreshMonitor = () => {
  const grid = $('monGrid'); if (!grid) return;
  const all = Object.entries(allDrvs);
  const cnts = { online: 0, busy: 0, brk: 0, offline: 0, total: 0 };
  all.forEach(([, d]) => {
    const cs = getTCS(d);
    if (cs.monCls === 'st-online') cnts.online++;
    else if (cs.monCls === 'st-busy') cnts.busy++;
    else if (cs.monCls === 'st-break') cnts.brk++;
    else cnts.offline++;
    cnts.total += (d.totalDeliveries || 0);
  });
  const upd = (id, v) => { const e = $(id); if (e) e.textContent = v; };
  upd('mon-online', cnts.online); upd('mon-busy', cnts.busy);
  upd('mon-break', cnts.brk); upd('mon-offline', cnts.offline);
  upd('mon-total-del', cnts.total);
  if (!all.length) { grid.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text4);grid-column:1/-1">لا يوجد سائقون</div>`; return; }
  grid.innerHTML = all.map(([id, d]) => {
    const cs = getTCS(d), age = d.locUpdated ? Date.now() - d.locUpdated : 999999;
    return `<div class="monitor-taxi-card ${cs.monCls}">
      <div style="width:50px;height:50px;border-radius:14px;background:var(--bg2);border:2px solid ${cs.border};display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0">🚕</div>
      <div class="monitor-taxi-info">
        <div class="monitor-taxi-name">${esc(d.name)}</div>
        <div class="monitor-taxi-status"><span class="monitor-status-dot ${cs.dotCls}"></span><span style="color:${cs.dot};font-weight:800">${cs.label}</span></div>
        ${d.phone ? `<div style="font-size:11px;color:var(--text4)">${d.phone}</div>` : ''}
        <div style="margin-top:6px;display:flex;gap:5px;flex-wrap:wrap">
          <span class="monitor-taxi-badge ${cs.badgeCls}"><i class="fas fa-box" style="font-size:9px"></i> ${d.totalDeliveries || 0}</span>
          ${d.shiftStart && cs.monCls !== 'st-offline' ? `<span class="monitor-taxi-badge" style="background:var(--primary-l);color:var(--primary);border:1px solid var(--primary-m)">⏱ ${fmtElapsed(Date.now() - d.shiftStart)}</span>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
};
onDriversUpdate(() => { if ($('MonitorScreen').classList.contains('on')) refreshMonitor(); });

/* ══════════════════════════════════════════════════
   PUBLIC USER MAP
   ══════════════════════════════════════════════════ */
/* دالة موحّدة تضمن ظهور أزرار التنزيل بأي طريق وصلت فيها للخريطة */
const ensurePwaInstallBtns = () => {
  const pu = $('PU');
  if (!pu || $('pwaInstallBtns')) return;
  const wrap = document.createElement('div');
  wrap.id = 'pwaInstallBtns';
  wrap.style.cssText = 'display:flex;gap:10px;justify-content:center;padding:12px 16px;flex-wrap:wrap;flex-shrink:0;background:rgba(15,23,42,.8);border-top:1px solid rgba(255,255,255,.08)';
  wrap.innerHTML = `
    <button onclick="window.installPWA_android()" style="display:flex;align-items:center;gap:8px;padding:10px 18px;background:linear-gradient(135deg,#059669,#047857);border:none;border-radius:12px;color:#fff;font-size:13px;font-weight:800;cursor:pointer;font-family:Cairo,sans-serif;box-shadow:0 4px 12px rgba(5,150,105,.3)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.523 15.341a5 5 0 01-3.523 1.46 5 5 0 01-3.523-1.46L4 9.341V18a2 2 0 002 2h12a2 2 0 002-2V9.341l-2.477 6zM12 3a5 5 0 015 5H7a5 5 0 015-5zm-7 5l7 8 7-8H5z"/></svg>
      تنزيل لـ أندرويد
    </button>
    <button onclick="window.installPWA_ios()" style="display:flex;align-items:center;gap:8px;padding:10px 18px;background:linear-gradient(135deg,#0EA5E9,#0284C7);border:none;border-radius:12px;color:#fff;font-size:13px;font-weight:800;cursor:pointer;font-family:Cairo,sans-serif;box-shadow:0 4px 12px rgba(14,165,233,.3)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
      تنزيل لـ آيفون
    </button>`;
  pu.appendChild(wrap);
};

window.openPubPage = () => {
  $('PL').style.display = 'none';
  $('PTenantGate').style.display = 'none';
  const pu = $('PU');
  pu.style.display = 'flex';
  pu.style.flexDirection = 'column';

  /* هاي السطرين هم الإصلاح الأساسي: */
  ensurePwaInstallBtns();
  const staffBtn = $('staffEntryBtn'); if (staffBtn) staffBtn.style.display = 'flex';

  requestAnimationFrame(() => requestAnimationFrame(() => {
    const mapEl = $('publicMap'); if (!mapEl) return;
    if (!_pubMap) {
      try {
        _pubMap = L.map('publicMap', { zoomControl: true }).setView([32.31, 35.03], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(_pubMap);
      } catch (e) { console.warn('map init error', e); return; }
    } else { setTimeout(() => { try { _pubMap.invalidateSize(); } catch (e) { } }, 300); }
    loadPublicOffices();
  }));
};

window.closePubPage = () => {
  const pu = $('PU'); if (pu) pu.style.display = 'none';
  $('PL').style.display = 'none';
  initTenantGate();
};

const loadPublicOffices = async () => {
  if (!_pubMap) return;
  const layersToRemove = [];
  _pubMap.eachLayer(l => { if (l instanceof L.Marker) layersToRemove.push(l); });
  layersToRemove.forEach(l => _pubMap.removeLayer(l));
  try {
    const snap = await get(ref(_db, 'publicOffices')).catch(() => null);
    if (!snap || !snap.exists()) {
      L.popup().setLatLng([32.31, 35.03]).setContent('<div style="font-family:Cairo,sans-serif;text-align:center;padding:12px;direction:rtl"><div style="font-size:16px;margin-bottom:6px">🚕</div><b>لا يوجد مكاتب مسجلة بعد</b><br><span style="font-size:11px;color:#666">المكاتب ستظهر هنا عند تسجيلها</span></div>').openOn(_pubMap);
      return;
    }
    const offices = Object.entries(snap.val()).filter(([, o]) => o.lat && o.lng && o.visible);
    if (!offices.length) {
      L.popup().setLatLng([32.31, 35.03]).setContent('<div style="font-family:Cairo,sans-serif;text-align:center;padding:12px;direction:rtl"><b>لا يوجد مكاتب نشطة حالياً</b></div>').openOn(_pubMap);
      return;
    }
    for (const [tenantId, office] of offices) await addOfficeMarkerToMap(tenantId, office);
    if (offices.length > 0) {
      const bounds = L.latLngBounds(offices.map(([, o]) => [o.lat, o.lng]));
      _pubMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  } catch (e) { console.warn('loadPublicOffices error', e); }
};

const addOfficeMarkerToMap = async (tenantId, office) => {
  if (!_pubMap) return;
  let avgStars = 0, ratingCount = 0;
  try {
    const rSnap = await get(ref(_db, `tenants/${tenantId}/ratings`)).catch(() => null);
    if (rSnap && rSnap.exists()) {
      const rArr = Object.values(rSnap.val());
      ratingCount = rArr.length;
      avgStars = rArr.reduce((s, r) => s + (r.stars || 0), 0) / ratingCount;
    }
  } catch (e) { }
  const ratingBadge = ratingCount > 0 ? `<div class="office-rating-badge">⭐ ${avgStars.toFixed(1)} <span style="opacity:.7">(${ratingCount})</span></div>` : '';
  const icon = L.divIcon({ html: `<div class="office-marker-wrap"><div class="office-marker">🚕</div><div class="office-marker-name">${office.displayName || 'مكتب تاكسي'}</div>${ratingBadge}</div>`, className: '', iconSize: [70, 75], iconAnchor: [35, 68] });
  const dn = esc(office.displayName || 'مكتب تاكسي'), dc = esc(office.desc || '');
  const starsHtml = ratingCount > 0
    ? `<div style="text-align:center;margin:8px 0;font-size:13px;color:#D97706;font-weight:700">⭐ ${avgStars.toFixed(1)} / 5 <span style="font-size:10px;color:#64748B;font-weight:400">(${ratingCount} تقييم)</span></div>`
    : '<div style="text-align:center;font-size:11px;color:#94A3B8;margin:6px 0">لا يوجد تقييمات بعد</div>';
  const popup = `<div class="pub-office-popup"><h3>🚕 ${dn}</h3>${dc ? `<p class="office-desc">${dc}</p>` : ''}${starsHtml}<button class="pub-req-btn" onclick="openUserReqModal('${tenantId}','${dn}','${dc}')"><i class="fas fa-taxi"></i> اطلب تكسي من هذا المكتب</button></div>`;
  L.marker([office.lat, office.lng], { icon }).addTo(_pubMap).bindPopup(popup, { maxWidth: 260, minWidth: 200 });
};

/* ══════════════════════════════════════════════════
   TAXI REQUEST SYSTEM — نظام طلب التكسي المتكامل (4 شاشات)
   ══════════════════════════════════════════════════ */

let _reqSystem = {
  tenantId: null,
  officeName: null,
  officeDesc: null,
  userLat: null,
  userLng: null,
  userPhone: null,
  userDestination: null,
  userNotes: null,
  container: null,
  localMap: null,
  reqRef: null
};

// === الشاشة 1: تحديد الـ GPS ===
window.showGPSScreen = (tenantId, officeName, officeDesc) => {
  _reqSystem = {
    tenantId: tenantId,
    officeName: officeName,
    officeDesc: officeDesc,
    userLat: null,
    userLng: null,
    userPhone: null,
    userDestination: null,
    userNotes: null,
    localMap: null,
    reqRef: null
  };

  const container = document.createElement('div');
  container.id = 'reqSystemContainer';
  container.style.cssText = 'position:fixed;inset:0;z-index:9000;font-family:Cairo,sans-serif;direction:rtl;background:linear-gradient(135deg,#0F172A 0%,#1E293B 100%)';
  container.innerHTML = `
  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:32px 24px;text-align:center">
    <div style="width:120px;height:120px;background:rgba(14,165,233,.15);border:3px solid rgba(14,165,233,.3);border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:32px;animation:gpsPulse 2s ease infinite">
      <i class="fas fa-location-dot" style="font-size:56px;color:#0EA5E9"></i>
    </div>
    <div style="font-size:28px;font-weight:900;color:#fff;margin-bottom:12px;font-family:Tajawal,sans-serif">تحديد موقعك 📍</div>
    <div style="font-size:14px;color:rgba(255,255,255,.6);margin-bottom:40px;max-width:280px;line-height:1.8">
      نحتاج موقعك لإرسال التاكسي إليك بدقة وسرعة<br>اضغط الزر أدناه
    </div>
    <button id="gpsBtn" onclick="window._reqGPS()"
      style="padding:18px 50px;background:linear-gradient(135deg,#0EA5E9,#0284C7);border:none;border-radius:16px;color:#fff;font-size:16px;font-weight:900;cursor:pointer;font-family:Cairo,sans-serif;box-shadow:0 10px 30px rgba(14,165,233,.4);display:flex;align-items:center;gap:10px;transition:all .3s;margin-bottom:20px">
      <i class="fas fa-location-crosshairs"></i> تحديد موقعي الآن
    </button>
    <div id="gpsStatus" style="font-size:13px;color:rgba(255,255,255,.4);min-height:20px"></div>
    <button onclick="window._closeReqSystem()" style="margin-top:40px;background:none;border:none;color:rgba(255,255,255,.3);font-size:12px;cursor:pointer;font-family:Cairo,sans-serif;padding:6px 12px;border-radius:6px;transition:all .2s;hover{color:rgba(255,255,255,.5)}"
      onmouseover="this.style.color='rgba(255,255,255,.5)'" onmouseout="this.style.color='rgba(255,255,255,.3)'">إلغاء ✕</button>
    <style>
      @keyframes gpsPulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.1);opacity:.7} }
    </style>
  </div>`;
  document.body.appendChild(container);
  _reqSystem.container = container;
};

// === تحديد الـ GPS ===
window._reqGPS = async () => {
  const btn = $('gpsBtn');
  const status = $('gpsStatus');

  if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }
  if (status) status.textContent = '⏳ جاري تحديد موقعك...';

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      _reqSystem.userLat = pos.coords.latitude;
      _reqSystem.userLng = pos.coords.longitude;
      if (status) status.textContent = '✅ تم تحديد موقعك!';
      setTimeout(() => window._showDataScreen(), 800);
    },
    (err) => {
      if (status) status.innerHTML = `❌ خطأ: ${err.message}<br><span style="font-size:11px">تأكد من السماح بالموقع</span>`;
      if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
};

// === الشاشة 2: إدخال البيانات ===
window._showDataScreen = () => {
  const container = $('reqSystemContainer');
  if (!container) return;

  container.innerHTML = `
  <div style="display:flex;flex-direction:column;height:100%;background:#F8FAFC">
    <!-- رأس -->
    <div style="background:linear-gradient(135deg,#0F172A,#1E293B);padding:18px 20px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
      <div>
        <div style="font-size:16px;font-weight:900;color:#fff;font-family:Tajawal,sans-serif">بيانات الطلب</div>
        <div style="font-size:12px;color:#0EA5E9;margin-top:2px">من: ${esc(_reqSystem.officeName)}</div>
      </div>
      <button onclick="window._closeReqSystem()" style="background:rgba(255,255,255,.1);border:none;border-radius:8px;width:36px;height:36px;color:#fff;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center">✕</button>
    </div>
    
    <!-- المحتوى -->
    <div style="flex:1;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:16px">
      
      <!-- رقم الهاتف -->
      <div>
        <label style="display:block;font-size:12px;font-weight:700;color:#0F172A;margin-bottom:6px">📞 رقم الهاتف *</label>
        <input id="taxiReqPhone" type="tel" placeholder="05xxxxxxxxx" 
          style="width:100%;padding:13px 14px;border:1.5px solid #E2E8F0;border-radius:10px;font-size:14px;font-family:Cairo,sans-serif;outline:none;transition:all .2s"
          onmouseover="this.style.borderColor='#0EA5E9'" onmouseout="this.style.borderColor='#E2E8F0'"
          onfocus="this.style.borderColor='#0EA5E9';this.style.boxShadow='0 0 0 3px rgba(14,165,233,.1)'" onblur="this.style.boxShadow='none'"/>
      </div>

      <!-- الموقع الحالي (من GPS) -->
      <div>
        <label style="display:block;font-size:12px;font-weight:700;color:#0F172A;margin-bottom:6px">📍 موقعك الحالي</label>
        <div style="padding:13px 14px;background:#fff;border:1.5px solid #10B981;border-radius:10px;font-size:13px;color:#059669;font-weight:700;display:flex;align-items:center;gap:8px">
          <i class="fas fa-check-circle"></i> تم تحديده من الـ GPS ✓
        </div>
      </div>

      <!-- الوجهة -->
      <div>
        <label style="display:block;font-size:12px;font-weight:700;color:#0F172A;margin-bottom:6px">🎯 أين تريد الذهاب؟ *</label>
        <textarea id="taxiReqDestination" placeholder="حدد الموقع أو اكتب العنوان..." 
          style="width:100%;padding:13px 14px;border:1.5px solid #E2E8F0;border-radius:10px;font-size:13px;font-family:Cairo,sans-serif;resize:vertical;min-height:70px;outline:none;transition:all .2s"
          onmouseover="this.style.borderColor='#0EA5E9'" onmouseout="this.style.borderColor='#E2E8F0'"
          onfocus="this.style.borderColor='#0EA5E9';this.style.boxShadow='0 0 0 3px rgba(14,165,233,.1)'" onblur="this.style.boxShadow='none'"></textarea>
      </div>

<!-- ملاحظات -->
      <div>
        <label style="display:block;font-size:12px;font-weight:700;color:#0F172A;margin-bottom:6px">💬 ملاحظات (اختياري)</label>
        <textarea id="taxiReqNotes" placeholder="مثلاً: بجانب المسجد، حمراء، إلخ..."
                  style="width:100%;padding:13px 14px;border:1.5px solid #E2E8F0;border-radius:10px;font-size:13px;font-family:Cairo,sans-serif;resize:vertical;min-height:60px;outline:none;transition:all .2s"
          onmouseover="this.style.borderColor='#0EA5E9'" onmouseout="this.style.borderColor='#E2E8F0'"
          onfocus="this.style.borderColor='#0EA5E9';this.style.boxShadow='0 0 0 3px rgba(14,165,233,.1)'" onblur="this.style.boxShadow='none'"></textarea>
      </div>
    </div>

    <!-- زر الإرسال -->
    <div style="padding:16px 20px;background:#fff;border-top:1px solid #E2E8F0;flex-shrink:0">
      <button onclick="window._submitRequest()"
        style="width:100%;padding:16px;background:linear-gradient(135deg,#0EA5E9,#0284C7);border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:Cairo,sans-serif;box-shadow:0 6px 20px rgba(14,165,233,.3);transition:all .2s"
        onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 28px rgba(14,165,233,.4)'" 
        onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 6px 20px rgba(14,165,233,.3)'">
        📤 إرسال الطلب
      </button>
    </div>
  </div>`;
};

// === إرسال الطلب ===
window._submitRequest = async () => {
  const phoneEl = $('taxiReqPhone');
  const destEl = $('taxiReqDestination');
  const notesEl = $('taxiReqNotes');

  let phone = (phoneEl?.value || '').trim();
  const destination = (destEl?.value || '').trim();
  const notes = (notesEl?.value || '').trim();

  if (!phone || !destination) {
    toast('warn', '⚠️ مطلوب', 'الرجاء إدخال رقم الهاتف والوجهة');
    return;
  }

  /* تنظيف الرقم من أي مسافات/رموز غير مسموحة عشان يطابق قاعدة الأمان بالضبط */
  phone = phone.replace(/[^0-9+]/g, '');

  if (!/^[0-9+]{7,15}$/.test(phone)) {
    toast('warn', '❌ خطأ', 'رقم الهاتف غير صحيح');
    return;
  }

  _reqSystem.userPhone = phone;
  _reqSystem.userDestination = destination;
  _reqSystem.userNotes = notes;

  try {
    if (!_auth.currentUser) {
      await signInAnonymously(_auth);
    }

    const reqData = {
      phone: phone,
      details: destination,
      notes: notes,
      fromUser: true,
      lat: _reqSystem.userLat,
      lng: _reqSystem.userLng,
      status: 'pending',
      ts: serverTimestamp(),
      createdAt: Date.now()
    };

const reqRef = await push(ref(_db, `tenants/${_reqSystem.tenantId}/recvRequests`), reqData);
    _reqSystem.reqRef = reqRef;
    await update(reqRef, { userReqRef: `tenants/${_reqSystem.tenantId}/recvRequests/${reqRef.key}` });
    if (_reqSystem.userLat && _reqSystem.userLng) {
      push(ref(_db, `tenants/${_reqSystem.tenantId}/requestsLog`), { lat: _reqSystem.userLat, lng: _reqSystem.userLng, ts: serverTimestamp() }).catch(() => {});
    }
    await push(ref(_db, `tenants/${_reqSystem.tenantId}/notifications`), {
      type: 'new_request',
      msg: `🌐 طلب جديد من مستخدم: ${phone}`,
      phone: phone,
      details: destination,
      ts: serverTimestamp(),
      read: false
    }).catch(() => { });

    setTimeout(() => window._showTrackingScreen(), 300);
} catch (e) {
    console.error('Submit error:', e);
    toast('err', '❌ خطأ حقيقي', `${e.code || e.name || ''} :: ${e.message || 'غير معروف'}`);
  }
};

  // === الشاشة 3: تأكيد الإرسال مع الخريطة ===
 window._showTrackingScreen = () => {
  const container = $('reqSystemContainer');
  if (!container) return;
  container.innerHTML = `
  <div style="display:flex;flex-direction:column;height:100%;background:#F8FAFC">
    <div id="trkBanner" style="padding:20px;background:#0EA5E9;color:#fff;text-align:center;font-family:Tajawal,sans-serif;font-weight:900;font-size:16px;flex-shrink:0;transition:background .3s">
      ⏳ بانتظار قبول الطلب
    </div>
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;text-align:center;gap:16px">
      <div id="trkIcon" style="font-size:64px">⏳</div>
      <div id="trkMsg" style="font-size:15px;color:#334155;line-height:1.8;max-width:300px">تم إرسال طلبك، ننتظر رد المكتب...</div>
    </div>
    <div style="padding:16px 20px;background:#fff;border-top:1px solid #E2E8F0">
      <button id="trkCancelBtn" onclick="window._reqSystemCancel()" style="width:100%;padding:14px;background:#FEF2F2;border:1.5px solid #FCA5A5;border-radius:12px;color:#EF4444;font-size:14px;font-weight:800;cursor:pointer;font-family:Cairo,sans-serif">
        <i class="fas fa-times"></i> إلغاء الطلب
      </button>
    </div>
  </div>`;
  _reqSystemListenStatus();
};

const _reqSystemListenStatus = () => {
  if (_reqSystem.statusRef) { try { off(_reqSystem.statusRef); } catch (e) { } }
  const r = ref(_db, `tenants/${_reqSystem.tenantId}/recvRequests/${_reqSystem.reqRef.key}`);
  _reqSystem.statusRef = r;
  let lastStatus = '';
  onValue(r, snap => {
    if (!snap.exists()) return;
    const d = snap.val();
    const ds = d.driverStatus || d.status || 'pending';
    if (ds === lastStatus) return;
    lastStatus = ds;
    _reqSystemUpdateBanner(ds);
  });
};

const _reqSystemUpdateBanner = ds => {
  const banner = $('trkBanner'), icon = $('trkIcon'), msg = $('trkMsg'), cancelBtn = $('trkCancelBtn');
  const cfg = {
    pending: { color: '#0EA5E9', icon: '⏳', title: 'بانتظار قبول الطلب', msg: 'تم إرسال طلبك، ننتظر رد المكتب...' },
    sent: { color: '#0EA5E9', icon: '🚕', title: 'تم إرسال طلبك إلى سائق', msg: 'ننتظر رد السائق...' },
    accepted: { color: '#10B981', icon: '✅', title: 'تم قبول طلبك', msg: 'السائق في الطريق إليك 🚕' },
    waiting: { color: '#F59E0B', icon: '🕐', title: 'السائق بالانتظار', msg: 'السائق بالانتظار قريباً منك' },
    near: { color: '#F59E0B', icon: '⚠️', title: 'السائق قريب منك!', msg: 'ترقّب وصول السائق الآن' },
    done: { color: '#10B981', icon: '🎉', title: 'تم التوصيل!', msg: 'شكراً لاستخدامك خدمتنا' },
    cancelled: { color: '#EF4444', icon: '🚫', title: 'تم إلغاء الطلب', msg: 'تم إلغاء طلبك' },
    rejected: { color: '#EF4444', icon: '❌', title: 'تم رفض الطلب', msg: 'جاري إيجاد سائق بديل' },
    no_response: { color: '#EF4444', icon: '⏰', title: 'لم يتم الرد', msg: 'جاري إيجاد سائق بديل' },
  }[ds] || { color: '#0EA5E9', icon: '⏳', title: 'جاري المعالجة', msg: '' };

  if (banner) { banner.style.background = cfg.color; banner.textContent = cfg.icon + ' ' + cfg.title; }
  if (icon) icon.textContent = cfg.icon;
  if (msg) msg.textContent = cfg.msg;
  if (cancelBtn) cancelBtn.style.display = (ds === 'done' || ds === 'cancelled') ? 'none' : 'block';

  if (ds === 'accepted') playSound('accept');
  else if (ds === 'near') playSound('notif');
  else if (ds === 'done') playSound('shift');
  else if (ds === 'cancelled' || ds === 'rejected') playSound('cancel');
  showPushNotif(cfg.title, cfg.msg, 'info');

  if (ds === 'done') {
    if (_reqSystem.statusRef) { try { off(_reqSystem.statusRef); } catch (e) { } _reqSystem.statusRef = null; }
    setTimeout(() => { window.showRatingScreen('السائق', _reqSystem.officeName); }, 1200);
  }
};

window._reqSystemCancel = async () => {
  if (!confirm('هل تريد إلغاء الطلب؟')) return;
  try {
    const tenantId = _reqSystem.tenantId;
    const reqId = _reqSystem.reqRef.key;
    const userReqPath = `tenants/${tenantId}/recvRequests/${reqId}`;

    /* 1) تحديث حالة الطلب نفسه */
    await update(ref(_db, userReqPath), { status: 'cancelled', cancelledAt: Date.now(), cancelledBy: 'user' });

    /* 2) إشعار المشرف */
    await push(ref(_db, `tenants/${tenantId}/notifications`), {
      type: 'cancel',
      msg: `🚫 مستخدم ألغى الطلب: ${_reqSystem.userPhone || ''}`,
      ts: serverTimestamp(),
      read: false
    }).catch(() => {});

    /* 3) إشعار السائق (إذا كان الطلب أُرسل له فعلاً) + إرجاعه متاح */
    const drvReqsSnap = await get(ref(_db, `tenants/${tenantId}/driverRequests`)).catch(() => null);
    if (drvReqsSnap && drvReqsSnap.exists()) {
      for (const [drvId, reqs] of Object.entries(drvReqsSnap.val())) {
        if (!reqs) continue;
        for (const [rid, req] of Object.entries(reqs)) {
          if (req.userReqRef === userReqPath && req.status !== 'done' && req.status !== 'cancelled' && req.status !== 'rejected') {
            await update(ref(_db, `tenants/${tenantId}/driverRequests/${drvId}/${rid}`), { status: 'cancelled', cancelledAt: Date.now() }).catch(() => {});
            await update(ref(_db, `tenants/${tenantId}/drivers/${drvId}`), { taxiColor: 'green', status: 'online', lastSeen: Date.now() }).catch(() => {});
            await push(ref(_db, `tenants/${tenantId}/driverPushNotifs/${drvId}`), {
              title: '🚫 تم إلغاء الطلب',
              body: `الزبون ألغى الطلب: ${_reqSystem.userPhone || ''}`,
              type: 'cancel',
              ts: Date.now(),
              read: false
            }).catch(() => {});
          }
        }
      }
    }
  } catch (e) { console.error('cancel error', e); }
  window._closeReqSystem();
};

    setTimeout(() => {
  try {
    const mapEl = $('confirmMap');
    if (!mapEl) return;

    if (!_reqSystem.localMap) {
      _reqSystem.localMap = L.map('confirmMap', {
        zoom: 15,
        dragging: false,
        zoomControl: false,
        scrollWheelZoom: false
      }).setView([_reqSystem.userLat, _reqSystem.userLng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(_reqSystem.localMap);

      const userIcon = L.divIcon({
        html: `
          <div style="
            width:40px;
            height:40px;
            background:linear-gradient(135deg,#10B981,#059669);
            border:3px solid #fff;
            border-radius:50%;
            box-shadow:0 4px 12px rgba(16,185,129,.3);
            display:flex;
            align-items:center;
            justify-content:center;
            color:#fff;
            font-size:18px;
          ">📍</div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });

      L.marker([_reqSystem.userLat, _reqSystem.userLng], {
        icon: userIcon
      }).addTo(_reqSystem.localMap);
    } else {
      _reqSystem.localMap.setView(
        [_reqSystem.userLat, _reqSystem.userLng],
        15
      );
    }

    // إصلاح مشكلة ظهور الخريطة عند فتح النافذة
    setTimeout(() => {
      _reqSystem.localMap.invalidateSize();
    }, 100);

  } catch (e) {
    console.warn('Map error:', e);
  }
}, 100);

  // === إغلاق النظام ===
window._closeReqSystem = () => {
    const container = $('reqSystemContainer');
    if (container) container.remove();
    if (_reqSystem.localMap) {
      try { _reqSystem.localMap.remove(); } catch (e) { }
      _reqSystem.localMap = null;
    }
  };

  // === الشاشة 4: التقييم (تستدعى من Firebase عند انتهاء التوصيل) ===
  window.showRatingScreen = (driverName, officeName) => {
    let selectedStars = 0;

    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;font-family:Cairo,sans-serif;direction:rtl;padding:20px';
    container.innerHTML = `
  <div style="background:#fff;border-radius:20px;padding:32px;max-width:380px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3)">
    <div style="font-size:48px;margin-bottom:16px">⭐</div>
    <div style="font-size:22px;font-weight:900;color:#0F172A;margin-bottom:8px;font-family:Tajawal,sans-serif">كيف كانت الخدمة؟</div>
    <div style="font-size:13px;color:#64748B;margin-bottom:28px">قيّم سائقك ${driverName} من فضلك</div>
    
    <!-- النجوم -->
    <div style="display:flex;justify-content:center;gap:10px;margin-bottom:24px;font-size:40px">
      <span id="star1" onclick="selectStars(1)" style="cursor:pointer;opacity:.3;transition:all .2s;transform:scale(1)">⭐</span>
      <span id="star2" onclick="selectStars(2)" style="cursor:pointer;opacity:.3;transition:all .2s;transform:scale(1)">⭐</span>
      <span id="star3" onclick="selectStars(3)" style="cursor:pointer;opacity:.3;transition:all .2s;transform:scale(1)">⭐</span>
      <span id="star4" onclick="selectStars(4)" style="cursor:pointer;opacity:.3;transition:all .2s;transform:scale(1)">⭐</span>
      <span id="star5" onclick="selectStars(5)" style="cursor:pointer;opacity:.3;transition:all .2s;transform:scale(1)">⭐</span>
    </div>

    <!-- التعليق -->
    <textarea id="ratingComment" placeholder="أضف تعليق (اختياري)..." 
      style="width:100%;padding:12px;border:1.5px solid #E2E8F0;border-radius:10px;font-size:13px;font-family:Cairo,sans-serif;resize:none;min-height:70px;margin-bottom:20px;outline:none"
      onfocus="this.style.borderColor='#0EA5E9'" onblur="this.style.borderColor='#E2E8F0'"></textarea>

    <!-- الأزرار -->
    <div style="display:flex;gap:10px">
      <button onclick="this.closest('div[style*=fixed]').remove()" style="flex:1;padding:12px;background:#F1F5F9;border:none;border-radius:10px;color:#0F172A;font-size:14px;font-weight:700;cursor:pointer;font-family:Cairo,sans-serif;transition:all .2s"
        onmouseover="this.style.background='#E2E8F0'" onmouseout="this.style.background='#F1F5F9'">إلغاء</button>
      <button id="submitRatingBtn" onclick="window._submitRating()" style="flex:1;padding:12px;background:linear-gradient(135deg,#10B981,#059669);border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:Cairo,sans-serif" disabled
        onmouseover="if(!this.disabled)this.style.opacity='.9'" onmouseout="if(!this.disabled)this.style.opacity='1'">✓ تم</button>
    </div>
  </div>`;

    document.body.appendChild(container);

    window.selectStars = (count) => {
      selectedStars = count;
      for (let i = 1; i <= 5; i++) {
        const star = $(`star${i}`);
        if (!star) continue;
        if (i <= count) {
          star.style.opacity = '1';
          star.style.transform = 'scale(1.2)';
        } else {
          star.style.opacity = '.3';
          star.style.transform = 'scale(1)';
        }
      }
      const btn = $('submitRatingBtn');
      if (btn) btn.disabled = false;
    };

window._submitRating = async () => {
      const comment = ($('ratingComment')?.value || '').trim();
      const btn = $('submitRatingBtn');
      if (btn) btn.disabled = true;

      try {
        if (!_auth.currentUser) {
          await signInAnonymously(_auth);
        }

        await push(ref(_db, `tenants/${_reqSystem.tenantId}/ratings`), {
          stars: selectedStars,
          comment: comment,
          phone: _reqSystem.userPhone || '0000000',
          ts: serverTimestamp()
        });

        /* إشعار للمشرف بقائمة التنبيهات */
        await push(ref(_db, `tenants/${_reqSystem.tenantId}/notifications`), {
          type: 'rating',
          msg: `⭐ تقييم جديد: ${'⭐'.repeat(selectedStars)} — ${comment || 'بدون تعليق'}`,
          ts: serverTimestamp(),
          read: false
        }).catch(() => {});

        toast('ok', '✅ شكراً!', 'تقييمك مهم لنا');
        container.remove();
      } catch (e) {
        console.error('Rating error:', e);
        toast('err', '❌ خطأ', 'تعذّر إرسال التقييم');
        if (btn) btn.disabled = false;
      }
    };
  };

  window.openUserReqModal = (tenantId, officeName, officeDesc) => {
    window.showGPSScreen(tenantId, officeName, officeDesc);
  };


  /* ══════════════════════════════════════════════════
     USER VERIFY SCREEN — بناء شاشة التحقق برمجياً
     ══════════════════════════════════════════════════ */
  (function buildVerifyScreen() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', buildVerifyScreen);
      return;
    }
    if (document.getElementById('UserVerifyScreen')) {
      /* الشاشة موجودة بالـ HTML، تأكد من وجود الدوال */
      ensureVerifyFunctions();
      return;
    }
    const el = document.createElement('div');
    el.id = 'UserVerifyScreen';
    el.className = 'user-verify-screen';
    el.innerHTML = `
  <div class="mdl-box" style="max-width:400px;padding:0;overflow:hidden;border-radius:20px">
    <div style="background:linear-gradient(135deg,#0F172A,#1E293B);padding:20px 24px;display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:38px;height:38px;background:linear-gradient(135deg,#D97706,#B45309);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px">🚕</div>
        <div>
          <div style="font-size:14px;font-weight:900;color:#fff;font-family:Tajawal,sans-serif">طلب تكسي</div>
          <div id="vStepLabel" style="font-size:11px;color:rgba(255,255,255,.5);font-family:Cairo,sans-serif">التحقق من هويتك</div>
        </div>
      </div>
      <button onclick="document.getElementById('UserVerifyScreen').classList.remove('on')" style="background:rgba(255,255,255,.1);border:none;border-radius:8px;width:32px;height:32px;color:#fff;cursor:pointer;font-size:15px">✕</button>
    </div>
    <div style="display:flex;gap:4px;padding:14px 24px 0;background:#0F172A">
      <div id="vp1" style="flex:1;height:3px;border-radius:2px;background:#0EA5E9;transition:.3s"></div>
      <div id="vp2" style="flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.15);transition:.3s"></div>
      <div id="vp3" style="flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.15);transition:.3s"></div>
    </div>
    <div style="padding:20px 24px 24px;background:#0F172A">
      <div id="vErr" style="display:none;background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.3);border-radius:10px;padding:10px 14px;margin-bottom:14px;color:#F87171;font-size:13px;font-family:Cairo,sans-serif"></div>
      <div id="vStep1">
        <div style="font-size:15px;font-weight:800;color:#fff;font-family:Tajawal,sans-serif;margin-bottom:6px">📞 أدخل رقم هاتفك</div>
        <div style="font-size:12px;color:rgba(255,255,255,.5);font-family:Cairo,sans-serif;margin-bottom:16px">سيتم التحقق بسؤال بسيط</div>
        <input id="v-phone" type="tel" placeholder="05xxxxxxxx" dir="ltr" style="width:100%;box-sizing:border-box;padding:13px 14px;background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.15);border-radius:10px;color:#fff;font-size:15px;font-family:Cairo,sans-serif;outline:none;text-align:center">
        <button onclick="window.vGoStep2()" style="width:100%;margin-top:12px;padding:13px;background:#0EA5E9;border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:800;cursor:pointer;font-family:Cairo,sans-serif">متابعة ←</button>
      </div>
      <div id="vStep2" style="display:none">
        <div style="font-size:15px;font-weight:800;color:#fff;font-family:Tajawal,sans-serif;margin-bottom:6px">🤖 تأكيد: لست روبوت</div>
        <div style="font-size:12px;color:rgba(255,255,255,.5);font-family:Cairo,sans-serif;margin-bottom:16px">أجب على السؤال</div>
        <div id="vMathQ" style="text-align:center;font-size:28px;font-weight:900;color:#0EA5E9;font-family:Tajawal,sans-serif;margin-bottom:16px;padding:16px;background:rgba(14,165,233,.1);border-radius:12px"></div>
        <input id="v-math-ans" type="number" placeholder="الجواب" dir="ltr" style="width:100%;box-sizing:border-box;padding:13px 14px;background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.15);border-radius:10px;color:#fff;font-size:20px;font-family:Cairo,sans-serif;outline:none;text-align:center">
        <button onclick="window.vCheckMath()" style="width:100%;margin-top:12px;padding:13px;background:#0EA5E9;border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:800;cursor:pointer;font-family:Cairo,sans-serif">تحقق ✓</button>
        <button onclick="window.showVStep(1)" style="width:100%;margin-top:8px;padding:10px;background:transparent;border:1px solid rgba(255,255,255,.15);border-radius:10px;color:rgba(255,255,255,.6);font-size:12px;cursor:pointer;font-family:Cairo,sans-serif">← رجوع</button>
      </div>
      <div id="vStep3" style="display:none">
        <div style="font-size:15px;font-weight:800;color:#fff;font-family:Tajawal,sans-serif;margin-bottom:4px">🚕 تفاصيل الطلب</div>
        <div id="vOfficeName" style="font-size:12px;color:#0EA5E9;font-family:Cairo,sans-serif;margin-bottom:14px"></div>
        <input type="hidden" id="ur-office-tenant">
        <div style="margin-bottom:10px">
          <label style="display:block;color:rgba(255,255,255,.6);font-size:11px;font-weight:700;margin-bottom:5px;font-family:Cairo,sans-serif">📞 رقم هاتفك</label>
          <input id="ur-phone" type="tel" dir="ltr" readonly style="width:100%;box-sizing:border-box;padding:11px 14px;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.1);border-radius:10px;color:#94A3B8;font-size:14px;font-family:Cairo,sans-serif;outline:none;text-align:center">
        </div>
        <div style="margin-bottom:10px">
          <label style="display:block;color:rgba(255,255,255,.6);font-size:11px;font-weight:700;margin-bottom:5px;font-family:Cairo,sans-serif">📍 من أين؟</label>
          <input id="ur-from" type="text" placeholder="موقعك الحالي..." dir="rtl" style="width:100%;box-sizing:border-box;padding:11px 14px;background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.15);border-radius:10px;color:#fff;font-size:13px;font-family:Cairo,sans-serif;outline:none">
        </div>
        <div style="margin-bottom:14px">
          <label style="display:block;color:rgba(255,255,255,.6);font-size:11px;font-weight:700;margin-bottom:5px;font-family:Cairo,sans-serif">🏁 إلى أين؟</label>
          <input id="ur-to" type="text" placeholder="وجهتك..." dir="rtl" style="width:100%;box-sizing:border-box;padding:11px 14px;background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.15);border-radius:10px;color:#fff;font-size:13px;font-family:Cairo,sans-serif;outline:none">
        </div>
        <div id="vGpsStatus" style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:rgba(255,255,255,.05);border-radius:10px;margin-bottom:14px">
          <div id="vGpsDot" style="width:10px;height:10px;border-radius:50%;background:#64748B;flex-shrink:0"></div>
          <div id="vGpsTxt" style="font-size:12px;color:rgba(255,255,255,.6);font-family:Cairo,sans-serif;flex:1">جاري تحديد موقعك...</div>
          <button id="vGpsBtn" onclick="window.vRequestGPS()" style="display:none;padding:5px 10px;background:#0EA5E9;border:none;border-radius:7px;color:#fff;font-size:11px;cursor:pointer;font-family:Cairo,sans-serif">تفعيل</button>
        </div>
        <div id="al-userreq" class="al"></div>
        <div id="userReqOfficeName" style="display:none"></div>
        <button class="bp" onclick="window.submitUserReq()" style="width:100%;padding:14px;background:linear-gradient(135deg,#D97706,#B45309);border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:900;cursor:pointer;font-family:Tajawal,sans-serif;display:flex;align-items:center;justify-content:center;gap:8px">
          <i class="fas fa-taxi"></i> إرسال الطلب
        </button>
      </div>
    </div>
  </div>`;
    document.body.appendChild(el);
    ensureVerifyFunctions();
  })();

  function ensureVerifyFunctions() { }
  let _vMathAns = 0;

  window.showVStep = step => {
    ['vStep1', 'vStep2', 'vStep3'].forEach((id, i) => {
      const el = document.getElementById(id); if (el) el.style.display = i + 1 === step ? 'block' : 'none';
    });
    const labels = ['', 'إدخال رقم الهاتف', 'التحقق من الهوية', 'تفاصيل الطلب'];
    const lbl = document.getElementById('vStepLabel'); if (lbl) lbl.textContent = labels[step] || '';
    ['vp1', 'vp2', 'vp3'].forEach((id, i) => {
      const bar = document.getElementById(id); if (bar) bar.style.background = i < step ? '#0EA5E9' : 'rgba(255,255,255,.15)';
    });
    const errEl = document.getElementById('vErr'); if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
  };

  window.resetVerifyScreen = () => {
    const ph = document.getElementById('v-phone'); if (ph) ph.value = '';
    const ans = document.getElementById('v-math-ans'); if (ans) ans.value = '';
    window._gpsOk = false; window._userGpsLat = null; window._userGpsLng = null;
    window.showVStep(1);
  };

  window.vGoStep2 = () => {
    const ph = (document.getElementById('v-phone')?.value || '').trim();
    if (!ph || !/^[0-9+]{7,15}$/.test(ph.replace(/[^0-9+]/g, ''))) {
      const e = document.getElementById('vErr'); if (e) { e.textContent = '❌ أدخل رقم هاتف صحيح'; e.style.display = 'block'; } return;
    }
    window._userVerifiedPhone = ph;
    window.showVStep(2);
    setTimeout(() => initDragSlider(), 100);
  };

  function initDragSlider() {
    const handle = document.getElementById('dragHandle');
    const fill = document.getElementById('dragFill');
    const txt = document.getElementById('dragText');
    const wrap = document.getElementById('dragSliderWrap');
    const errEl = document.getElementById('dragErr');
    if (!handle || !wrap) return;
    let dragging = false, startX = 0, curX = 0;
    const maxMove = () => wrap.clientWidth - handle.offsetWidth - 8;

    function onStart(e) {
      dragging = true; startX = (e.touches ? e.touches[0].clientX : e.clientX);
      handle.style.transition = 'none'; fill.style.transition = 'none';
      if (txt) txt.style.opacity = '0'; e.preventDefault();
    }
    function onMove(e) {
      if (!dragging) return;
      const x = (e.touches ? e.touches[0].clientX : e.clientX);
      const delta = startX - x;
      curX = Math.max(0, Math.min(delta, maxMove()));
      handle.style.right = (4 + curX) + 'px';
      const pct = curX / maxMove();
      fill.style.width = (60 + curX) + 'px';
      fill.style.background = 'linear-gradient(90deg,rgba(14,165,233,' + (pct * .6) + '),rgba(14,165,233,.4))';
      if (pct >= 0.95) onSuccess(); e.preventDefault();
    }
    function onEnd() {
      if (!dragging) return; dragging = false;
      const pct = curX / maxMove();
      if (pct < 0.95) {
        handle.style.transition = 'right .3s ease'; fill.style.transition = 'width .3s ease';
        handle.style.right = '4px'; fill.style.width = '60px';
        fill.style.background = 'linear-gradient(90deg,rgba(14,165,233,0),rgba(14,165,233,.3))';
        if (txt) { txt.style.opacity = '1'; } curX = 0;
        if (errEl) { errEl.textContent = 'اسحب حتى النهاية'; setTimeout(() => { if (errEl) errEl.textContent = ''; }, 1500); }
      }
    }
    function removeListeners() {
      handle.removeEventListener('mousedown', onStart); handle.removeEventListener('touchstart', onStart);
      document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onEnd);
    }
    function onSuccess() {
      dragging = false; removeListeners();
      handle.style.transition = 'right .2s ease';
      handle.style.right = (wrap.clientWidth - handle.offsetWidth - 4) + 'px';
      handle.style.background = 'linear-gradient(135deg,#10B981,#059669)';
      fill.style.background = 'rgba(16,185,129,.4)';
      handle.innerHTML = '<i class="fas fa-check" style="color:#fff;font-size:18px"></i>';
      if (txt) { txt.textContent = '✅ تم التأكيد'; txt.style.opacity = '1'; txt.style.color = '#10B981'; }
      setTimeout(() => {
        localStorage.setItem('txUserPhone', '1|' + window._userVerifiedPhone);
        const phEl = document.getElementById('ur-phone'); if (phEl) phEl.value = window._userVerifiedPhone;
        const tenEl = document.getElementById('ur-office-tenant'); if (tenEl) tenEl.value = _pendingTenant || '';
        const onm = document.getElementById('vOfficeName'); if (onm) onm.textContent = '🏢 ' + (_pendingName || '');
        const onm2 = document.getElementById('userReqOfficeName'); if (onm2) onm2.textContent = _pendingName || '';
        window.showVStep(3); window.vRequestGPS();
      }, 600);
    }
    /* إعادة تعيين */
    handle.style.right = '4px'; fill.style.width = '60px';
    handle.style.background = 'linear-gradient(135deg,#0EA5E9,#0284C7)';
    handle.innerHTML = '<i class="fas fa-arrow-left" style="color:#fff;font-size:18px"></i>';
    if (txt) { txt.textContent = '← اسحب للتأكيد'; txt.style.opacity = '1'; txt.style.color = 'rgba(255,255,255,.4)'; }
    curX = 0;
    handle.addEventListener('mousedown', onStart);
    handle.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }


  window.vCheckMath = () => {
    const ans = parseInt(document.getElementById('v-math-ans')?.value || '', 10);
    if (isNaN(ans) || ans !== _vMathAns) {
      const a = Math.floor(Math.random() * 15) + 5, b = Math.floor(Math.random() * 9) + 1;
      const ops = [{ s: '+', r: a + b }, { s: '×', r: a * b }, { s: '−', r: a - b > 0 ? a - b : b - a }];
      const op = ops[Math.floor(Math.random() * ops.length)];
      _vMathAns = op.r;
      const q = document.getElementById('vMathQ'); if (q) q.textContent = `${a} ${op.s} ${b} = ?`;
      const ae = document.getElementById('v-math-ans'); if (ae) { ae.value = ''; ae.style.borderColor = 'rgba(248,113,113,.6)'; setTimeout(() => { if (ae) ae.style.borderColor = 'rgba(255,255,255,.15)'; }, 700); ae.focus(); }
      const e = document.getElementById('vErr'); if (e) { e.textContent = '❌ الجواب خاطئ، سؤال جديد'; e.style.display = 'block'; }
      return;
    }
    localStorage.setItem('txUserPhone', '1|' + window._userVerifiedPhone);
    const ph = document.getElementById('ur-phone'); if (ph) ph.value = window._userVerifiedPhone;
    const ten = document.getElementById('ur-office-tenant'); if (ten) ten.value = window._pendingTenant || '';
    const onm = document.getElementById('vOfficeName'); if (onm) onm.textContent = '🏢 ' + (window._pendingName || '');
    const onm2 = document.getElementById('userReqOfficeName'); if (onm2) onm2.textContent = window._pendingName || '';
    window.showVStep(3);
    window.vRequestGPS();
  };

  window.vRequestGPS = () => {
    const waiting = document.getElementById('vGpsWaiting');
    const okBox = document.getElementById('vGpsOkBox');
    const denied = document.getElementById('vGpsDenied');
    const txt = document.getElementById('vGpsTxt');
    const sendBtn = document.getElementById('vSendBtn');
    if (waiting) { waiting.style.display = 'flex'; waiting.style.flexDirection = 'column'; }
    if (okBox) okBox.style.display = 'none';
    if (denied) denied.style.display = 'none';
    if (sendBtn) { sendBtn.disabled = true; sendBtn.style.opacity = '.5'; sendBtn.style.cursor = 'not-allowed'; }
    if (!navigator.geolocation) {
      if (waiting) waiting.style.display = 'none';
      if (denied) denied.style.display = 'flex';
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        _gpsOk = true; _userGpsLat = pos.coords.latitude; _userGpsLng = pos.coords.longitude;
        window._gpsOk = true; window._userGpsLat = _userGpsLat; window._userGpsLng = _userGpsLng;
        if (waiting) waiting.style.display = 'none';
        if (okBox) okBox.style.display = 'flex';
        if (txt) txt.textContent = 'دقة: ' + Math.round(pos.coords.accuracy) + ' متر';
        if (sendBtn) { sendBtn.disabled = false; sendBtn.style.opacity = '1'; sendBtn.style.cursor = 'pointer'; }
      },
      () => {
        _gpsOk = false; window._gpsOk = false;
        if (waiting) waiting.style.display = 'none';
        if (denied) denied.style.display = 'flex';
        if (sendBtn) { sendBtn.disabled = true; sendBtn.style.opacity = '.5'; }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  window.submitUserReq = async () => {
    const lastReq = parseInt(localStorage.getItem('txLastReq') || '0', 10);
    if (lastReq && Date.now() - lastReq < 5 * 60 * 1000) {
      const rem = Math.ceil((5 * 60 * 1000 - (Date.now() - lastReq)) / 1000);
      if (typeof window.showRateLimitAlert === 'function') window.showRateLimitAlert(rem);
      return;
    }

    /* قراءة الحقول من UserVerifyScreen (vStep3) أو MuserReq */
    const uvs = document.getElementById('UserVerifyScreen');
    const scope = uvs || document;
    const phoneEl = scope.querySelector('#ur-phone');
    const fromEl = scope.querySelector('#ur-from');
    const toEl = scope.querySelector('#ur-to');
    const tenantEl = scope.querySelector('#ur-office-tenant');
    const offNameEl = scope.querySelector('#userReqOfficeName') || scope.querySelector('#vOfficeName');
    const errEl = scope.querySelector('#al-userreq');

    const phone = (window._userVerifiedPhone || (phoneEl ? phoneEl.value : '') || '').trim();
    const from = (fromEl ? fromEl.value : '').trim();
    const to = (toEl ? toEl.value : '').trim();
    const tenantId = (tenantEl ? tenantEl.value : '') || window._pendingTenant || '';

    const showErr = msg => {
      if (errEl) { errEl.textContent = '⚠️ ' + msg; errEl.style.color = '#EF4444'; }
      else if (typeof shAl === 'function') shAl('al-userreq', 'err', msg);
    };

    if (!phone) return showErr('أدخل رقم هاتفك');
    if (!from) return showErr('أدخل موقعك الحالي (من أين؟)');
    if (!to) return showErr('أدخل وجهتك (إلى أين؟)');
    if (!tenantId) return showErr('خطأ: لم يتم تحديد المكتب — أغلق وأعد المحاولة');
    if (!/^[0-9+]{7,15}$/.test(phone.replace(/\s/g, ''))) return showErr('رقم الهاتف غير صحيح');
    if (!window._gpsOk || !window._userGpsLat) return showErr('⚠️ الموقع الجغرافي مطلوب — فعّله أولاً');

    /* زر الإرسال — نستهدف الزر الظاهر في vStep3 */
    const sendBtn = uvs ? uvs.querySelector('button.verify-btn-wa:last-of-type, button[onclick*="submitUserReq"]') : null;
    const origTxt = sendBtn ? sendBtn.innerHTML : '';
    if (sendBtn) { sendBtn.innerHTML = '<span class="spin"></span> جار الإرسال...'; sendBtn.disabled = true; }

    try {
      const details = `من: ${from} ← إلى: ${to}`;
      const reqRef = await push(ref(_db, `tenants/${tenantId}/recvRequests`), {
        phone, details, ts: serverTimestamp(), addedBy: 'مستخدم عام 🌐', fromUser: true,
        userFrom: from, userTo: to, userReqRef: null,
        ...(window._gpsOk && window._userGpsLat ? { userLat: window._userGpsLat, userLng: window._userGpsLng, hasGps: true } : { hasGps: false }),
      });
const userReqRefPath = `tenants/${tenantId}/recvRequests/${reqRef.key}`;
      await update(reqRef, { userReqRef: userReqRefPath });
      if (window._gpsOk && window._userGpsLat && window._userGpsLng) {
        push(ref(_db, `tenants/${tenantId}/requestsLog`), { lat: window._userGpsLat, lng: window._userGpsLng, ts: serverTimestamp() }).catch(() => {});
      }
      _userReqId = reqRef.key; _userReqTenantId = tenantId;
      if (uvs) uvs.classList.remove('on');
      localStorage.setItem('txLastReq', String(Date.now()));
      const officeName = (offNameEl ? offNameEl.textContent : '') || window._pendingName || '';
      openTrackScreen(phone, details, officeName);
      listenUserReqStatus(tenantId, reqRef.key);
    } catch (err) {
      showErr('خطأ في الإرسال: ' + (err.message || 'تأكد من الاتصال'));
      if (sendBtn) { sendBtn.innerHTML = origTxt; sendBtn.disabled = false; }
    }
  };

  /* ── Tracking Screen ── */
  let _trackUserMapObj = null;
  const openTrackScreen = (phone, details, officeName) => {
    $('trackPhone').textContent = phone;
    $('trackDetails').textContent = details;
    $('trackOfficeLabel').textContent = officeName || '';
    [0, 1, 2, 3].forEach(i => {
      const ic = $(`ts-icon-${i}`); if (ic) ic.className = 'track-step-icon';
      const ln = $(`ts-line-${i}`); if (ln) ln.className = 'track-step-line';
    });
    setTrackStep(0); updateTrackBanner('waiting');
    $('trackArrivedSection').style.display = 'none';
    $('trackRatingSection').style.display = 'none';
    $('trackCancelBtn').style.display = 'inline-flex';
    _lastTrackStatus = '';
    $('UserTrackScreen').classList.add('on');

    /* خريطة موقع المستخدم */
    const lat = window._userGpsLat, lng = window._userGpsLng;
    const placeholder = $('trackMapPlaceholder');
    if (lat && lng && window.L) {
      if (placeholder) placeholder.style.display = 'none';
      setTimeout(() => {
        try {
          if (_trackUserMapObj) { _trackUserMapObj.remove(); _trackUserMapObj = null; }
          _trackUserMapObj = L.map('trackUserMap', { zoomControl: true, attributionControl: false })
            .setView([lat, lng], 16);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(_trackUserMapObj);
          const icon = L.divIcon({
            html: '<div style="background:#0EA5E9;width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(14,165,233,.6)"></div>',
            className: '', iconSize: [18, 18], iconAnchor: [9, 9]
          });
          L.marker([lat, lng], { icon }).addTo(_trackUserMapObj)
            .bindPopup('<b style="font-family:Cairo,sans-serif">موقعك الحالي 📍</b>').openPopup();
        } catch (e) { }
      }, 400);
    } else {
      if (placeholder) placeholder.style.display = 'flex';
    }
  };
  const setTrackStep = step => {
    [0, 1, 2, 3].forEach(i => {
      const ic = $(`ts-icon-${i}`); if (!ic) return;
      ic.className = 'track-step-icon' + (i < step ? ' done' : i === step ? ' active' : '');
      const ln = $(`ts-line-${i}`); if (ln) ln.className = 'track-step-line' + (i <= step ? ' done' : '');
    });
  };
  const updateTrackBanner = status => {
    const banner = $('trackStatusBanner'); if (!banner) return;
    const cfg = {
      waiting: { cls: 'tsb-waiting', msg: '⏳ في انتظار قبول الطلب...' },
      accepted: { cls: 'tsb-accepted', msg: '✅ تم قبول طلبك! التاكسي في الطريق إليك 🚕' },
      waiting2: { cls: 'tsb-accepted', msg: '🕐 التاكسي بالانتظار قريباً منك' },
      near: { cls: 'tsb-near', msg: '⚠️ التاكسي اقترب منك! ترقّب الآن' },
      done: { cls: 'tsb-done', msg: '🎉 وصل التاكسي! شكراً لاستخدامك خدمتنا' },
      cancelled: { cls: 'tsb-cancelled', msg: '🚫 تم إلغاء الطلب' },
      no_response: { cls: 'tsb-cancelled', msg: '⏰ لم يستجب السائق — جاري البحث عن بديل' },
      rejected: { cls: 'tsb-cancelled', msg: '❌ السائق رفض الطلب — جاري البحث عن بديل' },
    }[status] || { cls: 'tsb-waiting', msg: '⏳ جاري المعالجة...' };
    banner.className = `track-status-banner ${cfg.cls}`;
    banner.textContent = cfg.msg;
  };

  const listenUserReqStatus = (tenantId, reqId) => {
    if (_pubReqListener) { try { off(ref(_db, `tenants/${_userReqTenantId}/recvRequests/${_userReqId}`)); } catch (e) { } _pubReqListener = null; }
    const r = ref(_db, `tenants/${tenantId}/recvRequests/${reqId}`);
    _pubReqListener = onValue(r, snap => { if (!snap || !snap.exists()) return; updateTrackUI(snap.val()); });
  };

  const updateTrackUI = req => {
    const ds = req.driverStatus || req.status || 'pending';
    if (ds === _lastTrackStatus) return;
    const stepMap = { pending: 0, accepted: 1, waiting: 1, near: 2, done: 3, cancelled: 0, no_response: 0, rejected: 0 };
    setTrackStep(stepMap[ds] ?? 0);
    const bannerMap = { pending: 'waiting', accepted: 'accepted', waiting: 'waiting2', near: 'near', done: 'done', cancelled: 'cancelled', no_response: 'no_response', rejected: 'rejected' };
    updateTrackBanner(bannerMap[ds] || 'waiting');
    $('trackArrivedSection').style.display = (ds === 'near' || ds === 'accepted') ? 'block' : 'none';
    $('trackCancelBtn').style.display = (ds === 'done' || ds === 'cancelled') ? 'none' : 'inline-flex';
    if (_lastTrackStatus !== ds) {
      if (ds === 'accepted') { playSound('accept'); vibrate([200, 100, 200]); showPushNotif('✅ تم قبول طلبك!', 'التاكسي في الطريق إليك 🚕', 'info'); }
      else if (ds === 'waiting') { playSound('notif'); vibrate([200]); showPushNotif('🕐 التاكسي بالانتظار قريباً', 'ترقّب وصوله', 'info'); }
      else if (ds === 'near') { playSound('notif'); vibrate([300, 100, 300]); showPushNotif('⚠️ التاكسي اقترب منك!', 'اضغط «وصل» عند وصوله', 'info'); }
      else if (ds === 'done') { playSound('shift'); vibrate([200, 100, 200, 100, 200]); }
      else if (ds === 'cancelled' || ds === 'rejected') { playSound('cancel'); vibrate([400]); }
    }
    _lastTrackStatus = ds;
    if (ds === 'cancelled' || ds === 'rejected') {
      setTimeout(() => { if ($('UserTrackScreen').classList.contains('on')) { $('UserTrackScreen').classList.remove('on'); } }, 4000);
    }
    if (ds === 'done') {
      $('trackArrivedSection').style.display = 'none';
      if ($('trackRatingSection').style.display === 'none') {
        $('trackRatingSection').style.display = 'block';
        /* إخفاء زر التراجع */
        $('trackCancelBtn').style.display = 'none';
      }
    }
  };

  window.userCancelReq = async () => {
    if (!_userReqId || !_userReqTenantId) return;
    if (!confirm('هل تريد إلغاء الطلب؟')) return;
    try {
      await update(ref(_db, `tenants/${_userReqTenantId}/recvRequests/${_userReqId}`), { status: 'cancelled', cancelledAt: Date.now(), cancelledBy: 'user' });
      await push(ref(_db, `tenants/${_userReqTenantId}/notifications`), { type: 'cancel', msg: `🚫 مستخدم ألغى الطلب: ${$('trackPhone').textContent}`, ts: serverTimestamp(), read: false });
      $('UserTrackScreen').classList.remove('on');
      toast('info', 'تم إلغاء الطلب', '');
      if (_pubReqListener) { try { off(ref(_db, `tenants/${_userReqTenantId}/recvRequests/${_userReqId}`)); } catch (e) { } _pubReqListener = null; }
      _userReqId = null; _userReqTenantId = null;
    } catch (err) { toast('err', 'خطأ', err.message || ''); }
  };

  window.confirmTaxiArrived = async () => {
    setTrackStep(3); updateTrackBanner('done');
    $('trackArrivedSection').style.display = 'none';
    $('trackRatingSection').style.display = 'block';
    $('trackCancelBtn').style.display = 'none';
    playSound('shift');
    if (!_userReqId || !_userReqTenantId) return;
    await update(ref(_db, `tenants/${_userReqTenantId}/recvRequests/${_userReqId}`), { userConfirmedArrival: true, arrivedAt: Date.now(), driverStatus: 'done' }).catch(() => { });
    try {
      const drvReqsSnap = await get(ref(_db, `tenants/${_userReqTenantId}/driverRequests`)).catch(() => null);
      if (drvReqsSnap && drvReqsSnap.exists()) {
        for (const [drvId, reqs] of Object.entries(drvReqsSnap.val())) {
          if (!reqs) continue;
          for (const [rid, req] of Object.entries(reqs)) {
            if (req.userReqRef === `tenants/${_userReqTenantId}/recvRequests/${_userReqId}` && (req.status === 'accepted' || req.status === 'waiting' || req.status === 'near') && !req.doneDelivery) {
              const drvSnap = await get(ref(_db, `tenants/${_userReqTenantId}/drivers/${drvId}`)).catch(() => null);
              const drvData = drvSnap && drvSnap.exists() ? drvSnap.val() : { totalDeliveries: 0 };
              const newCount = (drvData.totalDeliveries || 0) + 1;
              await update(ref(_db, `tenants/${_userReqTenantId}/drivers/${drvId}`), { taxiColor: 'green', status: 'online', totalDeliveries: newCount }).catch(() => { });
              await update(ref(_db, `tenants/${_userReqTenantId}/driverRequests/${drvId}/${rid}`), { status: 'done', doneAt: Date.now(), doneDelivery: true, doneByUser: true }).catch(() => { });
              const today = new Date().toISOString().split('T')[0];
              const lRef = ref(_db, `tenants/${_userReqTenantId}/drivers/${drvId}/dailyReport/${today}`);
              const lSnap = await get(lRef).catch(() => null);
              const prev = lSnap && lSnap.exists() ? lSnap.val() : { deliveries: 0 };
              await set(lRef, { ...prev, deliveries: (prev.deliveries || 0) + 1, lastUpdate: Date.now() }).catch(() => { });
              await push(ref(_db, `tenants/${_userReqTenantId}/notifications`), { type: 'done', driverId: drvId, driverName: drvData.name || drvId, msg: `📦 تأكد المستخدم وصول التكسي — ${drvData.name || drvId} — إجمالي: ${newCount}`, ts: serverTimestamp(), read: false }).catch(() => { });
              break;
            }
          }
        }
      }
    } catch (e) { console.warn('auto-done error', e); }
  };

  window.setRating = n => {
    _userRating = n;
    document.querySelectorAll('.rating-star').forEach((s, i) => s.classList.toggle('on', i < n));
    const labels = ['', 'سيء جداً 😞', 'سيء 😐', 'مقبول 🙂', 'جيد 😊', 'ممتاز 🌟'];
    const lb = $('ratingLabel'); if (lb) lb.textContent = labels[n] || '';
  };

  window.submitRating = async () => {
    if (_userRating === 0) return toast('warn', 'يرجى اختيار تقييم', '');
    const comment = ($('ratingComment').value || '').trim();
    if (_userReqTenantId) {
      await push(ref(_db, `tenants/${_userReqTenantId}/ratings`), { stars: _userRating, comment, reqId: _userReqId, phone: $('trackPhone').textContent, ts: serverTimestamp() }).catch(() => { });
      await push(ref(_db, `tenants/${_userReqTenantId}/notifications`), { type: 'rating', msg: `⭐ تقييم جديد: ${'⭐'.repeat(_userRating)} — ${comment || 'بدون تعليق'}`, ts: serverTimestamp(), read: false }).catch(() => { });
    }
    toast('ok', '✅ شكراً على تقييمك!', '');
    closeTrackScreen();
    if (_pubMap) setTimeout(() => loadPublicOffices(), 1000);
  };

  window.closeTrackScreen = () => {
    $('UserTrackScreen').classList.remove('on');
    _lastTrackStatus = ''; _userReqId = null; _userReqTenantId = null; _userRating = 0;
    if (_pubReqListener) { try { off(_pubReqListener); } catch (e) { } _pubReqListener = null; }
    const pu = $('PU');
    if (!pu || pu.style.display !== 'flex') { $('PL').style.display = 'none'; initTenantGate(); }
  };


  /* ══════════════════════════════════════════════════
     RECEIVER DASHBOARD
     ══════════════════════════════════════════════════ */
  let recvAllDrvs = {};

  const initRecvDash = () => {
    $('PL').style.display = 'none'; $('PR').style.display = 'block';
    const recvCfg = [
      { id: 'requests', icon: 'fas fa-inbox', label: 'الطلبات', badge: true },
      { id: 'map', icon: 'fas fa-map-location-dot', label: 'الخريطة' },
      { id: 'add', icon: 'fas fa-plus-circle', label: 'إضافة طلب' },
      { id: 'history', icon: 'fas fa-history', label: 'السجل' },
    ];
    $('recv-ntabs').innerHTML = recvCfg.map((t, i) =>
      `<button class="ntab${i === 0 ? ' sup-on' : ''}" id="rnt-${t.id}" onclick="recvTab('${t.id}')">
      <i class="${t.icon}"></i> ${t.label}
      ${t.badge ? `<span class="ntab-badge" id="recv-req-badge" style="display:none">0</span>` : ''}
    </button>`
    ).join('');
    const mobNav = $('mobileNav'), mobTabs = $('mobTabs');
    if (mobNav && mobTabs) {
      mobNav.style.display = 'block';
      mobTabs.innerHTML = recvCfg.map((t, i) =>
        `<button class="mob-tab${i === 0 ? ' sup-on' : ''}" id="rmnt-${t.id}" onclick="recvTab('${t.id}')">
        ${t.badge ? `<span class="mob-tab-badge" id="mob-recv-badge" style="display:none">0</span>` : ''}
        <i class="${t.icon}"></i><span class="mob-label">${t.label}</span>
      </button>`
      ).join('');
    }
    loadRecvDrivers(); listenRecvNewReqs(); recvTab('requests');
  };

  const loadRecvDrivers = () => {
    recvAllDrvs = {};
    const r = tRef('drivers');
    onValue(r, snap => { recvAllDrvs = {}; if (snap.exists()) Object.entries(snap.val()).forEach(([id, d]) => { const { avatar, ...dn } = d; recvAllDrvs[id] = dn; }); });
    LSNRS.push({ r });
  };

  const listenRecvNewReqs = () => {
    let lastCount = null;
    const r = tRef('recvRequests');
    onValue(r, snap => {
      const count = snap.exists() ? Object.keys(snap.val()).length : 0;
      if (lastCount !== null && count > lastCount) { playSound('notif'); vibrate([200, 100, 200]); toast('info', '📥 طلب جديد وارد!', ''); }
      lastCount = count;
      ['recv-req-badge', 'mob-recv-badge'].forEach(bid => { const b = $(bid); if (b) { b.textContent = count > 0 ? count : ''; b.style.display = count > 0 ? 'inline' : 'none'; } });
    }); LSNRS.push({ r });
  };

  window.recvTab = t => {
    document.querySelectorAll('#recv-ntabs .ntab').forEach(b => b.classList.remove('on', 'sup-on'));
    const el = $('rnt-' + t); if (el) el.classList.add('sup-on');
    document.querySelectorAll('#mobTabs .mob-tab').forEach(b => b.classList.remove('on', 'sup-on'));
    const mel = $('rmnt-' + t); if (mel) mel.classList.add('sup-on');
    clrListeners(false);
    if (window._recvMap) { try { window._recvMap.remove(); } catch (e) { } window._recvMap = null; }
    const body = $('recv-dbody');
    if (t === 'requests') renderRecvRequests(body);
    else if (t === 'map') renderRecvMap(body);
    else if (t === 'add') renderRecvAdd(body);
    else renderRecvHistory(body);
  };

  const renderRecvRequests = body => {
    body.innerHTML = `<div style="padding:16px;overflow-y:auto;height:calc(100vh - 60px - 70px)">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">
      <div style="font-family:'Tajawal',sans-serif;font-size:18px;font-weight:900;color:var(--text);display:flex;align-items:center;gap:8px"><i class="fas fa-inbox" style="color:var(--primary)"></i> الطلبات الواردة</div>
      <button onclick="recvTab('add')" style="padding:8px 14px;background:var(--primary);border:none;border-radius:9px;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:'Cairo',sans-serif"><i class="fas fa-plus"></i> إضافة</button>
    </div>
    <div id="RECV_LIST"><div style="text-align:center;padding:32px;color:var(--text4)"><div class="spin dark"></div></div></div>
  </div>`;
    const r = tRef('recvRequests');
    onValue(r, snap => {
      const list = $('RECV_LIST'); if (!list) return;
      if (!snap.exists()) { list.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text4)"><i class="fas fa-inbox" style="font-size:40px;opacity:.2;display:block;margin-bottom:12px"></i><p style="font-size:13px">لا توجد طلبات حالياً</p></div>`; return; }
      const items = Object.entries(snap.val()).sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0));
      list.innerHTML = items.map(([id, d]) => {
        const userBadge = d.fromUser ? `<span style="background:#ECFDF5;color:#059669;font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;border:1px solid #A7F3D0;margin-right:4px">🌐 مستخدم</span>` : '';
        return `<div class="recv-req-card">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px">
          <div style="font-size:15px;font-weight:900;color:var(--text);display:flex;align-items:center;gap:6px"><i class="fas fa-phone" style="color:var(--primary);font-size:12px"></i>${esc(d.phone || '-')}${userBadge}</div>
          <span style="font-size:10px;color:var(--text4)">${fmt(d.ts || Date.now())}</span>
        </div>
        <div style="font-size:12px;color:var(--text2);margin-bottom:10px;display:flex;align-items:flex-start;gap:6px"><i class="fas fa-map-marker-alt" style="color:var(--amber);margin-top:3px;flex-shrink:0"></i>${esc(d.details || '-')}</div>
        ${d.addedBy ? `<div style="font-size:10px;color:var(--text4);margin-bottom:8px"><i class="fas fa-user" style="margin-left:3px"></i>${esc(d.addedBy)}</div>` : ''}
        <div style="display:flex;gap:7px;flex-wrap:wrap">
          <button class="rca rca-primary" onclick="recvSendReqToTaxi('${id}','${eAt(d.phone || '')}','${eAt(d.details || '')}')"><i class="fas fa-car-side"></i> إرسال لسائق</button>
          <button class="rca rca-amber"   onclick="recvEditReq('${id}','${eAt(d.phone || '')}','${eAt(d.details || '')}')"><i class="fas fa-pen"></i></button>
          <button class="rca rca-red"     onclick="recvDelReq('${id}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>`;
      }).join('');
    }); LSNRS.push({ r });
  };

  window.recvSendReqToTaxi = (reqId, phone, details) => {
    selTaxiId = null; selReqData = { id: reqId, phone: phone.replace(/&#39;/g, "'"), details: details.replace(/&#39;/g, "'"), recvReqId: reqId };
    const list = $('sel-taxi-list');
    const avail = Object.entries(recvAllDrvs).sort(([, a], [, b]) => { const ao = getTCS(a).monCls === 'st-online' ? 0 : 1, bo = getTCS(b).monCls === 'st-online' ? 0 : 1; return ao - bo; });
    if (!avail.length) { list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3)">لا يوجد سائقون</div>'; $('SelTaxiModal').classList.add('on'); return; }
    list.innerHTML = avail.map(([id, d]) => {
      const cs = getTCS(d);
      return `<div class="sel-taxi-item" id="stitem-${id}" onclick="selectTaxi('${id}')">
      <div style="width:40px;height:40px;border-radius:11px;border:2px solid ${cs.border};background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🚕</div>
      <div style="flex:1"><div style="font-weight:800;font-size:13px;color:var(--text)">${esc(d.name)}</div><div style="font-size:11px;color:${cs.dot}">${cs.label}</div>${d.carNumber ? `<div style="font-size:10px;color:var(--text4)">🚗 ${esc(d.carNumber)}</div>` : ''}</div>
      <i class="fas fa-check-circle" id="stchk-${id}" style="display:none;color:var(--primary);font-size:18px"></i>
    </div>`;
    }).join('');
    $('SelTaxiModal').classList.add('on'); $('confirmSelBtn').disabled = true; $('confirmSelBtn').style.opacity = '.5';
  };
  window.recvDelReq = async id => { if (!confirm('حذف هذا الطلب؟')) return; await remove(tRef(`recvRequests/${id}`)); toast('ok', 'تم الحذف', ''); };
  window.recvEditReq = (id, phone, details) => {
    const np = prompt('رقم الهاتف الجديد:', phone.replace(/&#39;/g, "'")); if (!np) return;
    const nd = prompt('التفاصيل الجديدة:', details.replace(/&#39;/g, "'")); if (!nd) return;
    update(tRef(`recvRequests/${id}`), { phone: np, details: nd, editedAt: Date.now() }).then(() => toast('ok', 'تم التعديل', ''));
  };

  const renderRecvMap = body => {
    body.innerHTML = `<div style="height:calc(100vh - 60px - 70px);display:flex;flex-direction:column;position:relative">
    <div class="ststrip" style="flex-shrink:0;position:relative;z-index:2">
      <div class="st"><div class="stic" style="background:var(--green-l)"><i class="fas fa-circle" style="color:var(--green)"></i></div><div><div class="stv" id="rmG">0</div><div class="stl">متاح 🟢</div></div></div>
      <div class="st"><div class="stic" style="background:var(--red-l)"><i class="fas fa-car" style="color:var(--red)"></i></div><div><div class="stv" id="rmR">0</div><div class="stl">مشغول 🔴</div></div></div>
      <div class="st"><div class="stic" style="background:var(--primary-l)"><i class="fas fa-users" style="color:var(--primary)"></i></div><div><div class="stv" id="rmT">0</div><div class="stl">المجموع</div></div></div>
    </div>
    <div id="recvMap" style="flex:1;min-height:0"></div>
  </div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = $('recvMap'); if (!el) return;
      try {
        window._recvMap = L.map('recvMap', { zoomControl: true }).setView([32.31, 35.03], 12);
        window._recvMarkers = {};
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(window._recvMap);
        const refresh = () => {
          if (!window._recvMap) return;
          const ent = Object.entries(recvAllDrvs);
          const upd = (id, v) => { const e = $(id); if (e) e.textContent = v; };
          upd('rmT', ent.length);
          upd('rmG', ent.filter(([, d]) => getTCS(d).monCls === 'st-online').length);
          upd('rmR', ent.filter(([, d]) => getTCS(d).monCls === 'st-busy').length);
          ent.forEach(([id, d]) => {
            if (!d.lat || !d.lng) return;
            const cs = getTCS(d);
            const ic = L.divIcon({ html: `<div class="drv-marker-wrap"><div class="drv-marker" style="border-color:${cs.border}">🚕</div><div class="drv-marker-name">${d.name}</div></div>`, className: '', iconSize: [50, 50], iconAnchor: [25, 50] });
            if (window._recvMarkers[id]) { window._recvMarkers[id].setLatLng([d.lat, d.lng]); window._recvMarkers[id].setIcon(ic); }
            else { window._recvMarkers[id] = L.marker([d.lat, d.lng], { icon: ic }).addTo(window._recvMap).bindPopup(`<div style="font-family:Cairo,sans-serif;text-align:center"><b>${d.name}</b><br><span style="color:${cs.dot}">${cs.label}</span><br><button onclick="recvSendToDriver('${id}','${(d.name || '').replace(/'/g, '')}')"><i class='fas fa-paper-plane'></i> إرسال طلب</button></div>`); }
          });
        };
        refresh();
        const r = tRef('drivers');
        onValue(r, snap => { if (!window._recvMap) return; recvAllDrvs = {}; if (snap.exists()) Object.entries(snap.val()).forEach(([id, d]) => { const { avatar, ...dn } = d; recvAllDrvs[id] = dn; }); refresh(); });
        LSNRS.push({ r });
      } catch (e) { }
    }));
  };
  window.recvSendToDriver = async (drvId, drvName) => {
    const phone = prompt('📞 رقم هاتف الزبون:', ''); if (!phone?.trim()) return;
    const details = prompt('📍 التفاصيل والموقع:', ''); if (!details?.trim()) return;
    try {
      const ts = Date.now();
      await push(tRef('recvRequests'), { phone: phone.trim(), details: details.trim(), ts, addedBy: CU ? CU.name : 'المستقبل', assignedTo: drvId });
      await push(tRef(`driverRequests/${drvId}`), { phone: phone.trim(), details: details.trim(), status: 'pending', ts, sentBy: CU ? CU.name : 'المستقبل', sentAt: ts });
      await push(tRef(`driverPushNotifs/${drvId}`), { title: '📦 طلب جديد', body: `📞 ${phone.trim()}\n📍 ${details.trim()}`, type: 'new_request', ts, read: false });
      toast('ok', `✅ تم الإرسال لـ ${drvName}`, ''); playSound('notif');
      if (window._recvMap) window._recvMap.closePopup();
    } catch (err) { toast('err', 'خطأ', err.message || ''); }
  };

  const renderRecvAdd = body => {
    body.innerHTML = `<div style="padding:16px;overflow-y:auto;height:calc(100vh - 60px - 70px);max-width:500px;margin:0 auto">
    <div style="font-family:'Tajawal',sans-serif;font-size:18px;font-weight:900;color:var(--text);margin-bottom:16px;display:flex;align-items:center;gap:8px"><i class="fas fa-plus-circle" style="color:var(--primary)"></i> إضافة طلب جديد</div>
    <div class="cbox">
      <div class="al" id="al-recv-add"></div>
      <div class="fg"><label class="fl"><i class="fas fa-phone"></i> رقم هاتف الزبون</label><input type="tel" class="fi" id="recv-phone" placeholder="05xxxxxxxx"></div>
      <div class="fg"><label class="fl"><i class="fas fa-map-marker-alt"></i> التفاصيل والموقع</label><textarea class="fi" id="recv-details" rows="4" placeholder="من شارع فلسطين إلى مستشفى طولكرم..."></textarea></div>
      <button class="ba" onclick="addRecvReq()"><i class="fas fa-paper-plane"></i> حفظ الطلب</button>
    </div>
  </div>`;
  };
  window.addRecvReq = async () => {
    const phone = ($('recv-phone').value || '').trim();
    const details = ($('recv-details').value || '').trim();
    if (!phone || !details) return shAl('al-recv-add', 'err', 'يرجى ملء جميع الحقول');
    await push(tRef('recvRequests'), { phone, details, ts: serverTimestamp(), addedBy: CU ? CU.name : 'المستقبل' });
    $('recv-phone').value = ''; $('recv-details').value = '';
    shAl('al-recv-add', 'ok', '✅ تم إضافة الطلب'); playSound('notif');
    setTimeout(() => recvTab('requests'), 1200);
  };

  const renderRecvHistory = body => {
    body.innerHTML = `<div style="padding:16px;overflow-y:auto;height:calc(100vh - 60px - 70px)">
    <div style="font-family:'Tajawal',sans-serif;font-size:18px;font-weight:900;color:var(--text);margin-bottom:14px;display:flex;align-items:center;justify-content:space-between">
      <span style="display:flex;align-items:center;gap:8px"><i class="fas fa-history" style="color:var(--amber)"></i> سجل التنبيهات</span>
      <button onclick="clearAllNotifs()" style="padding:7px 14px;background:var(--red-l);border:1px solid var(--red-m);border-radius:9px;color:var(--red);font-size:11px;font-weight:700;cursor:pointer;font-family:'Cairo',sans-serif"><i class="fas fa-trash"></i> حذف الكل</button>
    </div>
    <div id="RECV_HIST"><div style="text-align:center;padding:32px;color:var(--text4)"><div class="spin dark"></div></div></div>
  </div>`;
    const icMap = { accept: 'ni-green', reject: 'ni-red', timeout: 'ni-red', done: 'ni-green', waiting: 'ni-amber', near: 'ni-amber', sos: 'ni-red', info: 'ni-blue', cancel: 'ni-red', edit: 'ni-amber', rating: 'ni-green', user_request: 'ni-green' };
    const icoMap = { accept: 'check', reject: 'times', timeout: 'clock', done: 'flag-checkered', waiting: 'hourglass-half', near: 'map-pin', sos: 'triangle-exclamation', info: 'info', cancel: 'ban', edit: 'pen', rating: 'star', user_request: 'globe' };
    const r = tRef('notifications');
    onValue(r, snap => {
      const list = $('RECV_HIST'); if (!list) return;
      if (!snap.exists()) { list.innerHTML = `<div style="text-align:center;padding:32px;color:var(--text4)">لا يوجد سجل</div>`; return; }
      const items = Object.entries(snap.val()).sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0)).slice(0, 50);
      list.innerHTML = items.map(([nid, n]) => `<div class="notif-item">
      <div class="notif-ic ${icMap[n.type] || 'ni-blue'}"><i class="fas fa-${icoMap[n.type] || 'bell'}"></i></div>
      <div class="notif-body"><div class="notif-title">${esc(n.msg || '')}</div><div class="notif-time">${fmt(n.ts || Date.now())}</div></div>
      <button class="notif-del-btn" onclick="delNotif('${nid}')"><i class="fas fa-times"></i></button>
    </div>`).join('');
    }); LSNRS.push({ r });
  };

  /* ══════════════════════════════════════════════════
     LOGOUT
     ══════════════════════════════════════════════════ */
  window.logout = async () => {
    const wasDriver = CR === 'driver';

    stopGPS();
    if (reqCountdownTimer) { clearInterval(reqCountdownTimer); reqCountdownTimer = null; }
    if (monitorInterval) { clearInterval(monitorInterval); monitorInterval = null; }
    stopDriverListener();
    $('ReqNotif').classList.remove('on');
    $('SosBroadcastNotif').classList.remove('on');
    $('MonitorScreen').classList.remove('on');

    if (CR === 'driver' && CU)
      await update(tRef(`drivers/${CU.id}`), { status: 'offline', lastSeen: Date.now() }).catch(() => { });

    await signOut(_auth).catch(() => { });
    clrListeners(false);

    CU = null; CR = null; shiftStartTime = null; allDrvs = {}; IS_RECV = false;
    TENANT_ID = ''; TENANT_INFO = null;

    clearSession();
    releaseWakeLock();
    $('PD').style.display = 'none';
    $('PR').style.display = 'none';
    $('PL').style.display = 'none';
    const puEl = $('PU'); if (puEl) puEl.style.display = 'none';

    /* أخفِ staffPanel لو كان مفتوحاً */
    if (typeof closeStaffPanel === 'function') closeStaffPanel();
    const sp = $('staffPanel'); if (sp) sp.style.display = 'none';
    const si = $('staffPanelInner'); if (si) si.style.transform = 'translateX(-100%)';

    $('ntabs').innerHTML = '';
    const navav = $('navav');
    if (navav) { navav.textContent = '🚕'; navav.classList.remove('sup-av'); }

    const monBtn = $('monitorBtn');
    if (monBtn) monBtn.remove();

    const mn = $('mobileNav');
    if (mn) mn.style.display = 'none';

    const mb = $('mobTabs');
    if (mb) mb.innerHTML = '';

    const staffBtn = $('staffEntryBtn');
    if (staffBtn) staffBtn.style.display = 'flex';

 // عند خروج السائق أو المشرف، اعرض خريطة طلب التكسي مباشرة
  TENANT_ID = ''; TENANT_INFO = null;
  setTimeout(() => {
    initTenantGate();
  }, 300);
};

window.logoutRecv = async () => {
  clrListeners(false);
  await signOut(_auth).catch(() => { });
  CU = null; CR = null; IS_RECV = false; recvAllDrvs = {};
  TENANT_ID = ''; TENANT_INFO = null;
  if (window._recvMap) { try { window._recvMap.remove(); } catch (e) { } window._recvMap = null; }
  clearSession();
  $('PR').style.display = 'none'; $('PL').style.display = 'none';
  $('recv-ntabs').innerHTML = '';
  const spR = $('staffPanel'); if (spR) spR.style.display = 'none';
  const siR = $('staffPanelInner'); if (siR) siR.style.transform = 'translateX(-100%)';
  const mn = $('mobileNav'); if (mn) mn.style.display = 'none';
  const mb = $('mobTabs'); if (mb) mb.innerHTML = '';
  initTenantGate();
};
