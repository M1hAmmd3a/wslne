
import { initializeApp }          from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, set, get, push, onValue, update, remove, off }
                                   from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged }
                                   from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
/* ══════════════════════════════════════════════════
   TENANT MAP  — uid → tenantId
   ضع هنا الـ UID من Firebase Console
   ══════════════════════════════════════════════════ */
const EMAIL_TO_TENANT = {
  'tk1@taxi.ps':  'tk1',
  'tk2@taxi.ps':  'tk2',
  'tk3@taxi.ps':  'tk3',
  'tk4@taxi.ps':  'tk4',
  'tk5@taxi.ps':  'tk5',
  'tk6@taxi.ps':  'tk6',
  'tk7@taxi.ps':  'tk7',
  'tk8@taxi.ps':  'tk8',
  'tk9@taxi.ps':  'tk9',
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
  'tk1':'مكتب طولكرم 1',
  'tk2':'مكتب طولكرم 2',
  'tk3':'مكتب طولكرم 3',
  'tk4':'مكتب طولكرم 4',
  'tk5':'مكتب طولكرم 5',
  'tk6':'مكتب طولكرم 6',
  'tk7':'مكتب طولكرم 7',
  'tk8':'مكتب طولكرم 8',
  'tk9':'مكتب طولكرم 9',
  'tk10':'مكتب طولكرم 10',
  'tk11':'مكتب طولكرم 11',
  'tk12':'مكتب طولكرم 12',
  'tk13':'مكتب طولكرم 13',
  'tk14':'مكتب طولكرم 14',
  'tk15':'مكتب طولكرم 15',
  'tk16':'مكتب طولكرم 16',
  'tk17':'مكتب طولكرم 17',
  'tk18':'مكتب طولكرم 18',
  'tk19':'مكتب طولكرم 19',
  'tk20':'مكتب طولكرم 20',
  'tk21':'مكتب طولكرم 21',
  'tk22':'مكتب طولكرم 22',
  'tk23':'مكتب طولكرم 23',
  'tk24':'مكتب طولكرم 24',
  'tk25':'مكتب طولكرم 25'
};

/* ── كود الدعوة لكل مكتب (يظهر في صفحة الملف الشخصي للمشرف) ── */
const TENANT_INVITE = {
  'tk1':'INV-TLK1-X9M7Q3R','tk2':'INV-TLK2-P5W8N2K','tk3':'INV-TLK3-H4B6V1Q',
  'tk4':'INV-TLK4-W2Z9S5Y','tk5':'INV-TLK5-F7X3K8U','tk6':'INV-TLK6-R1J4A6O',
  'tk7':'INV-TLK7-C8T2E9I','tk8':'INV-TLK8-G3N7D4A','tk9':'INV-TLK9-L6S1Z8E',
  'tk10':'INV-TLK10-M5Y3J7F','tk11':'INV-TLK11-B9U6K2W','tk12':'INV-TLK12-Q4O8T5D',
  'tk13':'INV-TLK13-V7H2S1N','tk14':'INV-TLK14-Y1C5R9G','tk15':'INV-TLK15-D6V3W4M',
  'tk16':'INV-TLK16-K2I7U8B','tk17':'INV-TLK17-N8Q4X3T','tk18':'INV-TLK18-Z5F9H6U',
  'tk19':'INV-TLK19-E3P1M7V','tk20':'INV-TLK20-I7W5G2K','tk21':'INV-TLK21-T4L8N6R',
  'tk22':'INV-TLK22-S9Z2B4H','tk23':'INV-TLK23-A1M6V8P','tk24':'INV-TLK24-J3E7W5Q',
  'tk25':'INV-TLK25-O6K4R9Z',
};

/* ── SHA-256 (للسائقين فقط) ── */
const _h = async s => {
  const b = new TextEncoder().encode(s);
  const d = await crypto.subtle.digest('SHA-256', b);
  return Array.from(new Uint8Array(d)).map(x => x.toString(16).padStart(2,'0')).join('');
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



let TENANT_ID   = '';
let TENANT_INFO = null;

const T    = path => `tenants/${TENANT_ID || 'default'}/${path}`;
const tRef = path => ref(_db, T(path));

/* ══════════════════════════════════════════════════
   GPS
   ══════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════
   GPS
   ══════════════════════════════════════════════════ */
const GPS_INTERVAL = 90000;
const GPS_MIN_DIST = 20;
let _gpsWatcher    = null;
let _gpsLastSent   = 0;
let _gpsLastLat    = null;
let _gpsLastLng    = null;
let _gpsSendTimer  = null;
let _gpsFailCount  = 0;
let _gpsRetryTimer = null;
let _gpsWatchFail  = 0;
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
      try { navigator.geolocation.clearWatch(_gpsWatcher); } catch (e) {}
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
    try { navigator.geolocation.clearWatch(_gpsWatcher); } catch (e) {}
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
  await update(ref(_db, T(`drivers/${drvId}`)), { lat, lng, locUpdated: Date.now() }).catch(() => {});
  if (isFirst) toast('ok', '📍 موقعك محدّد', 'يظهر على الخريطة');
};

const stopGPS = () => {
  if (_gpsWatcher !== null) {
    try { navigator.geolocation.clearWatch(_gpsWatcher); } catch (e) {}
    _gpsWatcher = null;
  }
  if (_gpsSendTimer)  { clearInterval(_gpsSendTimer);  _gpsSendTimer  = null; }
  if (_gpsRetryTimer) { clearTimeout(_gpsRetryTimer);  _gpsRetryTimer = null; }
  _gpsLastSent  = 0;
  _gpsLastLat   = null;
  _gpsLastLng   = null;
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
window.addEventListener('pagehide',     stopGPS);
window.addEventListener('beforeunload', stopGPS);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (_gpsSendTimer) { clearInterval(_gpsSendTimer); _gpsSendTimer = null; }
  } else if (CU && CR === 'driver' && CU.status !== 'offline' && !_gpsSendTimer) {
    _gpsSendTimer = setInterval(() => {
      if (Date.now() - _gpsLastSent >= GPS_INTERVAL)
        navigator.geolocation.getCurrentPosition(
          pos => sendGPS(CU.id, pos.coords.latitude, pos.coords.longitude, false),
          () => {}, { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
        );
    }, GPS_INTERVAL);
  }
});
window.addEventListener('pagehide',      stopGPS);
window.addEventListener('beforeunload',  stopGPS);

/* ══════════════════════════════════════════════════
   SHARED DRIVER CACHE
   ══════════════════════════════════════════════════ */
let allDrvs    = {};
const _drvCBs  = new Set();
let _drvListener = null;

const onDriversUpdate = cb => { _drvCBs.add(cb); return () => _drvCBs.delete(cb); };
const _notifyDrvCBs   = () => _drvCBs.forEach(cb => { try { cb(allDrvs); } catch(e) {} });

const startDriverListener = () => {
  if (_drvListener) return;
  const r = tRef('drivers');
  _drvListener = onValue(r, snap => {
    allDrvs = {};
    if (snap.exists()) Object.entries(snap.val()).forEach(([id, d]) => { const {avatar, ...dn} = d; allDrvs[id] = dn; });
    updateStatsUI(); _notifyDrvCBs();
  });
};
const stopDriverListener = () => {
  if (_drvListener) { try { off(tRef('drivers')); } catch(e) {} _drvListener = null; }
  _drvCBs.clear();
};

/* ══════════════════════════════════════════════════
   CLEAN OLD NOTIFICATIONS
   ══════════════════════════════════════════════════ */
const MAX_NOTIFS  = 200;
const NOTIF_TTL   = 24 * 60 * 60 * 1000;

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
  if (Object.keys(updates).length > 0) await update(tRef('notifications'), updates).catch(() => {});
};
setInterval(() => { if (CR === 'supervisor') cleanNotifs(); }, 3600000);

/* ══════════════════════════════════════════════════
   AUDIO
   ══════════════════════════════════════════════════ */
const AC    = window.AudioContext || window.webkitAudioContext;
let aCtx    = null;
const getAC = () => { if (!aCtx && AC) { try { aCtx = new AC(); } catch(e) { return null; } } return aCtx; };
['click','touchstart','keydown'].forEach(ev =>
  document.addEventListener(ev, () => { try { const c = getAC(); if (c && c.state === 'suspended') c.resume(); } catch(e) {} }, { passive: true })
);

const playSound = t => {
  try {
    const ctx = getAC(); if (!ctx || ctx.state !== 'running') return;
    const P = {
      request: [{f:880,d:.12,g:.9,t:0},{f:1100,d:.12,g:.9,t:.15},{f:880,d:.12,g:.9,t:.30},{f:1100,d:.18,g:.9,t:.45}],
      accept:  [{f:523,d:.12,g:.7,t:0},{f:659,d:.12,g:.7,t:.13},{f:784,d:.2,g:.7,t:.26}],
      reject:  [{f:784,d:.12,g:.6,t:0},{f:523,d:.2,g:.6,t:.15}],
      cancel:  [{f:600,d:.1,g:.7,t:0},{f:400,d:.25,g:.7,t:.15}],
      edit:    [{f:660,d:.1,g:.6,t:0},{f:880,d:.1,g:.6,t:.12},{f:660,d:.1,g:.6,t:.24}],
      sos:     [{f:1200,d:.1,g:1,t:0},{f:1200,d:.1,g:1,t:.15},{f:1200,d:.1,g:1,t:.3},{f:800,d:.3,g:1,t:.5}],
      notif:   [{f:660,d:.18,g:.6,t:0},{f:880,d:.1,g:.4,t:.2}],
      shift:   [{f:523,d:.1,g:.7,t:0},{f:659,d:.1,g:.7,t:.12},{f:784,d:.1,g:.7,t:.24},{f:1047,d:.25,g:.7,t:.36}],
    };
    (P[t] || P.notif).forEach(({f,d,g,t:s}) => {
      const o = ctx.createOscillator(), gn = ctx.createGain();
      o.connect(gn); gn.connect(ctx.destination);
      o.type = 'sine'; o.frequency.value = f;
      gn.gain.setValueAtTime(0, ctx.currentTime + s);
      gn.gain.linearRampToValueAtTime(g, ctx.currentTime + s + .02);
      gn.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + s + d);
      o.start(ctx.currentTime + s); o.stop(ctx.currentTime + s + d + .05);
    });
  } catch(e) {}
};
const vibrate = p => { try { if (navigator.vibrate) navigator.vibrate(p); } catch(e) {} };

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
  } catch(e) { return null; }
};

const reqPushPerm = async () => {
  if (!('Notification' in window)) return false;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied')  return false;
  try { return (await Notification.requestPermission()) === 'granted'; } catch(e) { return false; }
};

const _nt = {};
const showPushNotif = async (title, body, type = 'info') => {
  const key = type + '_' + title.slice(0, 20), now = Date.now();
  if (_nt[key] && now - _nt[key] < 3000) return; _nt[key] = now;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const cfg = {
    new_request:  { vibrate:[400,100,400,100,400], require: true  },
    edit_request: { vibrate:[200,100,200],          require: true  },
    cancel:       { vibrate:[300],                  require: false },
    sos:          { vibrate:[500,100,500,100,500],  require: true  },
    done:         { vibrate:[200],                  require: false },
    user_request: { vibrate:[300,100,300],          require: true  },
    info:         { vibrate:[150],                  require: false },
  }[type] || { vibrate:[150], require: false };
  try {
    const r = swReg || await navigator.serviceWorker.getRegistration().catch(() => null);
    if (r) { await r.showNotification(title, { body, icon: NOTIF_ICON, vibrate: cfg.vibrate, requireInteraction: cfg.require, tag: type + '_' + Date.now(), dir:'rtl', lang:'ar' }); return; }
    new Notification(title, { body, icon: NOTIF_ICON, tag: type + '_' + Date.now(), dir:'rtl' });
  } catch(e) {}
};

/* ══════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════ */
const $    = id  => document.getElementById(id);
const H    = (id, v) => { const e = $(id); if (e) e.classList[v ? 'add' : 'remove']('h'); };
const fmt  = ts  => new Date(ts).toLocaleTimeString('ar', { hour:'2-digit', minute:'2-digit' });
const esc  = s   => { if (s == null) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;'); };
const eAt  = s   => (s || '').replace(/'/g,"&#39;").replace(/"/g,'&quot;');
const fmtElapsed = ms => { const t = Math.floor(ms/1000), h = Math.floor(t/3600), m = Math.floor((t%3600)/60), s = t%60; return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`; };

window.OM  = id => { const e = $(id); if (e) e.classList.add('on'); };
window.CM  = id => { const e = $(id); if (e) e.classList.remove('on'); clrAl(); };
const clrAl = () => document.querySelectorAll('.al').forEach(a => { a.className = 'al'; a.textContent = ''; });
const shAl  = (id, t, m) => { const e = $(id); if (!e) return; e.className = `al ${t}`; e.innerHTML = `<i class="fas fa-${t==='err'?'circle-exclamation':'circle-check'}"></i> ${m}`; };

window.toast = (t, ti, s = '') => {
  const ic = { ok:'✅', err:'❌', warn:'⚠️', info:'ℹ️' };
  const container = $('toasts'); if (!container) return;
  while (container.children.length >= 4) container.removeChild(container.firstChild);
  const el = document.createElement('div'); el.className = 'toast';
  el.innerHTML = `<div class="tst">${ic[t] || 'ℹ️'}</div><div><div class="ttt">${esc(String(ti))}</div>${s ? `<div class="tts">${esc(String(s))}</div>` : ''}</div>`;
  container.appendChild(el);
  const tid = setTimeout(() => { el.style.cssText = 'opacity:0;transform:translateX(-110%);transition:.2s'; setTimeout(() => { try { el.remove(); } catch(e) {} }, 220); }, 3800);
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
const addL  = (r, keep = false) => LSNRS.push({ r, keep });

window.addEventListener('online',  () => toast('ok',  '🌐 عاد الاتصال',    ''));
window.addEventListener('offline', () => toast('err', '🔌 انقطع الاتصال',  ''));

/* ── Public Map State ── */
let _pubMap = null, _pubOfficesListener = null;
let _userReqId = null, _userReqTenantId = null, _userRating = 0, _pubReqListener = null;
let _officeLocMap = null, _officeLocMarker = null, _officeLocLat = null, _officeLocLng = null;
let _lastTrackStatus = '';


/* ══════════════════════════════════════════════════
   TENANT GATE — بوابة الدخول
   ══════════════════════════════════════════════════ */
const initTenantGate = () => {
  $('PL').style.display         = 'none';
  $('PTenantGate').style.display = 'block';
};

/* مسح الخطأ عند الكتابة فقط */
window.gateClearErr = () => {
  const err = $('gate-err'); if (err) err.textContent = '';
  const inp = $('gate-office-code');
  if (inp) inp.style.borderColor = 'rgba(255,255,255,.2)';
  /* أخفِ الأزرار والتحقق إذا غيّر الرمز */
  const btns     = $('gate-btns');     if (btns)     btns.style.display = 'none';
  const verified = $('gate-verified'); if (verified) verified.style.display = 'none';
  TENANT_ID = ''; TENANT_INFO = null;
};

/* زر "تحقق" */
window.gateCheckCode = () => {
  const inp  = $('gate-office-code');
  const code = (inp ? inp.value : '').toLowerCase().trim();
  const err  = $('gate-err');
  const verified = $('gate-verified');
  const btns     = $('gate-btns');
  const label    = $('gate-office-name-label');
  const btn      = $('gate-check-btn');

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
      TENANT_ID   = code;
      TENANT_INFO = { name: TENANT_NAMES[code] };
      if (label)    label.textContent      = TENANT_NAMES[code];
      if (verified) verified.style.display = 'flex';
      if (btns)     btns.style.display     = 'flex';
      if (err)      err.textContent        = '';
      if (inp)      inp.style.borderColor  = 'rgba(52,211,153,.6)';
      /* حفظ الرمز للمرة القادمة */
      localStorage.setItem('txOfficeCode', code);
    } else {
      /* رمز خاطئ */
      TENANT_ID = ''; TENANT_INFO = null;
      if (verified) verified.style.display = 'none';
      if (btns)     btns.style.display     = 'none';
      if (err)      err.textContent        = '❌ رمز المكتب غير صحيح';
      if (inp) {
        inp.style.borderColor = 'rgba(248,113,113,.6)';
        inp.style.animation   = 'shake .4s';
        setTimeout(() => { if (inp) inp.style.animation = ''; }, 400);
      }
    }
  }, 400);
};

/* الضغط على زر الدخول */
window.gateEnter = role => {
  if (!TENANT_ID || !TENANT_INFO) {
    const err = $('gate-err');
    if (err) err.textContent = '❌ يرجى التحقق من رمز المكتب أولاً';
    return;
  }
  tenantEnter(role);
};

document.addEventListener('DOMContentLoaded', initTenantGate);

/* من أي زر دخل المستخدم (مشرف / مستقبل / سائق) */
window.tenantEnter = role => {
  $('PTenantGate').style.display = 'none';
  $('PL').style.display          = 'block';

  if (role === 'driver') {
    setTimeout(() => OM('Mdriver'), 80);
  } else if (role === 'receiver') {
    IS_RECV = true;
    setTimeout(() => {
      const t = $('supModalTitle');    if (t) t.textContent = 'بوابة المستقبل';
      const o = $('supModalOfficeName'); if (o) o.textContent = 'سجّل بنفس بيانات المشرف';
      const n = $('recvLoginNote');    if (n) n.style.display = 'block';
      OM('Msup');
    }, 80);
  } else {
    IS_RECV = false;
    setTimeout(() => {
      const t = $('supModalTitle');    if (t) t.textContent = 'بوابة المشرف';
      const o = $('supModalOfficeName'); if (o) o.textContent = 'سجّل الدخول بحساب مكتبك';
      const n = $('recvLoginNote');    if (n) n.style.display = 'none';
      OM('Msup');
    }, 80);
  }
};

/* فتح الخريطة العامة من Gate */
window.openPubPageDirect = () => {
  $('PTenantGate').style.display = 'none';
  $('PL').style.display          = 'block';
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
  const pw    = ($('sl-pw')    ? ($('sl-pw').value    || '').trim() : '');

  if (!email || !pw) return shAl('al-sup', 'err', 'يرجى إدخال البريد وكلمة المرور');

  const btn  = $('sl-pw').closest('.mdl').querySelector('.ba');
  const orig = btn.innerHTML;
  btn.innerHTML = '<span class="spin"></span> جار الدخول...';
  btn.disabled  = true;

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
    TENANT_ID   = tenantId;
    TENANT_INFO = { name: TENANT_NAMES[tenantId] || tenantId };

    document.querySelectorAll('.lgn1').forEach(el => el.textContent = TENANT_INFO.name);
    document.title = TENANT_INFO.name + ' — منصة التاكسي';

    /* 3. إنشاء / جلب سجل المشرف */
    const supId   = 'admin_' + tenantId;
    const supSnap = await get(tRef(`supervisors/${supId}`)).catch(() => null);
    if (!supSnap || !supSnap.exists()) {
      await set(tRef(`supervisors/${supId}`), {
        name: 'مشرف ' + TENANT_INFO.name,
        role: 'admin', officeId: tenantId, createdAt: Date.now(),
      });
    }
    CU = { id: supId, name: TENANT_NAMES[tenantId], role:'admin', officeId: tenantId };
    CR = 'supervisor';

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
  } catch(err) {
    const msgs = {
      'auth/wrong-password':     '❌ كلمة المرور غير صحيحة',
      'auth/user-not-found':     '❌ البريد الإلكتروني غير موجود',
      'auth/invalid-email':      '❌ البريد الإلكتروني غير صحيح',
      'auth/invalid-credential': '❌ بيانات الدخول غير صحيحة',
      'auth/too-many-requests':  '⚠️ محاولات كثيرة — انتظر قليلاً',
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
  const nm      = ($('dr-nm').value   || '').trim();
  const ph      = ($('dr-ph').value   || '').trim();
  const car     = ($('dr-car').value  || '').trim();
  const pw      = $('dr-pw').value    || '';
  const pw2     = $('dr-pw2').value   || '';
  const invCode = ($('dr-invite') ? ($('dr-invite').value || '').trim().toUpperCase() : '');

  if (!nm || !ph || !pw || !car) return shAl('al-drv', 'err', 'يرجى ملء جميع الحقول');
  if (pw !== pw2)                 return shAl('al-drv', 'err', 'كلمات المرور غير متطابقة');
  if (!/^[0-9+]{7,15}$/.test(ph.replace(/ /g,''))) return shAl('al-drv', 'err', 'رقم الهاتف غير صحيح');
  if (pw.length < 6)              return shAl('al-drv', 'err', 'كلمة المرور قصيرة جداً');
  if (!TENANT_ID)                 return shAl('al-drv', 'err', 'لا يوجد مكتب محدد — ادخل برمز المكتب أولاً');

  /* التحقق من كود الدعوة */
  if (invCode) {
    const expectedInvite = TENANT_INVITE[TENANT_ID] || '';
    /* مقارنة بدون الرمز ! في النهاية للتوافق */
    const clean = code => code.replace(/[!]/g, '').toUpperCase();
    if (clean(invCode) !== clean(expectedInvite)) return shAl('al-drv', 'err', '❌ كود الدعوة غير صحيح');
  }

  const phKey = ph.replace(/[.#$[\]/ ]/g, '_');
  const btn   = $('dr-nm').closest('.mdl').querySelector('.bp');
  const orig  = btn.innerHTML;
  btn.innerHTML = '<span class="spin"></span> جار الإنشاء...'; btn.disabled = true;

  try {
    const chk = await get(tRef(`drivers/${phKey}`));
    if (chk.exists()) { shAl('al-drv', 'err', 'رقم الهاتف مسجل مسبقاً'); btn.innerHTML = orig; btn.disabled = false; return; }

    const pwHash = await _h(pw);
    await set(tRef(`drivers/${phKey}`), {
      name: nm, phone: ph, carNumber: car, pwHash,
      status: 'offline', taxiColor: 'green',
      deliveries: 0, totalDeliveries: 0,
      createdAt: Date.now(), role: 'driver',
      officeId: TENANT_ID, approvalStatus: 'pending', lastSeen: Date.now(),
    });
    await push(tRef('notifications'), { type:'new_driver', msg:`🆕 سائق جديد: ${nm} (${ph})`, ts: Date.now(), read: false, driverId: phKey });
    shAl('al-drv', 'ok', '✅ تم التسجيل! انتظر موافقة المشرف');
    ['dr-nm','dr-ph','dr-car','dr-pw','dr-pw2','dr-invite'].forEach(id => { const el = $(id); if (el) el.value = ''; });
    setTimeout(() => dtab('li'), 2500);
  } catch(err) { shAl('al-drv', 'err', 'خطأ: ' + (err.message || '')); }

  btn.innerHTML = orig; btn.disabled = false;
};

/* ══════════════════════════════════════════════════
   AUTH — DRIVER LOGIN
   ══════════════════════════════════════════════════ */
window.dLogin = async () => {
  const ph  = ($('dl-ph').value  || '').trim();
  const pw  =  $('dl-pw').value  || '';
  const car = ($('dl-car').value || '').trim();

  if (!ph || !pw || !car) return shAl('al-drv', 'err', 'يرجى ملء جميع الحقول');

  const phKey = ph.replace(/[.#$[\]/ ]/g, '_');
  const btn   = $('dl-pw').closest('.mdl').querySelector('.bp');
  const orig  = btn.innerHTML;
  btn.innerHTML = '<span class="spin"></span> جار الدخول...'; btn.disabled = true;

  try {
    const snap = await get(tRef(`drivers/${phKey}`));
    if (!snap.exists()) { shAl('al-drv', 'err', 'رقم الهاتف غير مسجل'); btn.innerHTML = orig; btn.disabled = false; return; }

    const found = snap.val();
    if (found.approvalStatus === 'pending')  { shAl('al-drv', 'warn', '⏳ حسابك قيد المراجعة'); btn.innerHTML = orig; btn.disabled = false; return; }
    if (found.approvalStatus === 'rejected') { shAl('al-drv', 'err',  '❌ تم رفض حسابك');       btn.innerHTML = orig; btn.disabled = false; return; }

    /* لا يمكن السائق الدخول دون tenant */
    if (!TENANT_ID) {
      /* استخدم officeId المحفوظة مع الحساب */
      if (found.officeId) { TENANT_ID = found.officeId; TENANT_INFO = { name: TENANT_NAMES[found.officeId] || found.officeId }; }
      else { shAl('al-drv', 'err', 'ادخل برمز مكتبك أولاً'); btn.innerHTML = orig; btn.disabled = false; return; }
    }

    if (TENANT_ID && found.officeId && found.officeId !== TENANT_ID) {
      shAl('al-drv', 'err', 'هذا الحساب مسجل في مكتب آخر'); btn.innerHTML = orig; btn.disabled = false; return;
    }

    const pwHash  = await _h(pw);
    const validPw = found.pwHash ? pwHash === found.pwHash : found.password === pw;
    if (!validPw) { shAl('al-drv', 'err', 'كلمة المرور خاطئة'); btn.innerHTML = orig; btn.disabled = false; return; }
    if ((found.carNumber || '').toLowerCase() !== car.toLowerCase()) { shAl('al-drv', 'err', 'رقم السيارة غير صحيح'); btn.innerHTML = orig; btn.disabled = false; return; }

    if (!found.pwHash) await update(tRef(`drivers/${phKey}`), { pwHash, password: null }).catch(() => {});
    await update(tRef(`drivers/${phKey}`), { status:'online', lastSeen: Date.now(), taxiColor:'green' });

    CU = { ...found, id: phKey, pwHash, password: undefined };
    CR = 'driver'; IS_RECV = false;
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
  } catch(err) { shAl('al-drv', 'err', 'خطأ: ' + (err.message || '')); btn.innerHTML = orig; btn.disabled = false; }
};


/* ══════════════════════════════════════════════════
   STATUS HELPERS
   ══════════════════════════════════════════════════ */
const getTCS = d => {
  const s = d.status || '', c = d.taxiColor || 'green';
  if (c==='red'   || s==='busy')    return {border:'#DC2626',dot:'#DC2626',label:'مشغول 🔴',  cls:'sb-red',   monCls:'st-busy',   dotCls:'msd-red',   badgeCls:'mtb-red',   emoji:'🔴'};
  if (c==='orange'|| s==='break' || s==='pray' || s==='waiting' || s==='near') {
    const lbl = s==='near'?'قريب ⚠️':s==='waiting'?'بالانتظار 🟠':s==='pray'?'صلاة 🕌':'استراحة 🟠';
    return {border:'#EA580C',dot:'#EA580C',label:lbl,cls:'sb-orange',monCls:'st-break',dotCls:'msd-orange',badgeCls:'mtb-orange',emoji:'🟠'};
  }
  if (s==='offline') return {border:'#64748B',dot:'#64748B',label:'غير متصل ⚫',cls:'sb-gray',monCls:'st-offline',dotCls:'msd-gray',badgeCls:'mtb-gray',emoji:'⚫'};
  return {border:'#059669',dot:'#059669',label:'متاح 🟢',cls:'sb-green',monCls:'st-online',dotCls:'msd-green',badgeCls:'mtb-green',emoji:'🟢'};
};
const getStatusBadge = d => { const cs = getTCS(d); return `<span class="sbadge ${cs.cls}"><span class="pdot" style="background:${cs.dot}"></span>${cs.label}</span>`; };

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
    $('sosBcMsg').textContent  = d.msg || '-';
    $('sosBcFrom').textContent = `من: ${d.senderName || 'المشرف'} • ${fmt(d.ts)}`;
    $('SosBroadcastNotif').classList.add('on');
    vibrate([500,100,500,100,500]); playSound('sos');
    showPushNotif('🆘 تنبيه طوارئ!', d.msg || '', 'sos');
  });
  LSNRS.push({ r });
};
window.ackSosBroadcast = async () => {
  if (CU) await update(tRef('sosActive/acked'), { [CU.id]: true }).catch(() => {});
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
      const sm = { new_request:'request', edit_request:'edit', cancel:'cancel', sos:'sos', user_request:'request' };
      playSound(sm[n.type] || 'notif');
      vibrate(n.type==='new_request'||n.type==='user_request'?[300,100,300]:n.type==='sos'?[500,100,500]:[200]);
      await showPushNotif(n.title || 'منصة الطلبات', n.body || '', n.type || 'info');
      update(tRef(`driverPushNotifs/${drvId}/${k}`), { read: true }).catch(() => {});
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
        update(tRef(`drivers/${CU.id}`), { taxiColor:'green', status:'online', lastSeen: Date.now() }).catch(() => {});
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
  $('reqPhone').textContent    = rd.phone   || '-';
  $('reqLocation').textContent = rd.details || '-';
  $('reqTime').textContent     = fmt(rd.ts  || Date.now());
  $('reqRejectArea').classList.remove('on'); $('reqRejectReason').value = '';
  const msgBox = $('reqMsgBox');
  if (rd.message) { msgBox.style.display = 'block'; $('reqMsgText').textContent = rd.message; }
  else             msgBox.style.display = 'none';
  const modNotice = $('reqModNotice');
  if (rd.status === 'modified' && rd.prevPhone) {
    modNotice.style.display = 'block';
    $('reqModText').textContent = `تعديل • ${rd.prevPhone} ← ${rd.phone}`;
    playSound('edit'); vibrate([200,100,200]);
    showPushNotif('✏️ تم تعديل طلبك', `📞 ${rd.phone}\n📍 ${rd.details}`, 'edit_request');
  } else {
    modNotice.style.display = 'none';
    const rt = $('reqTitle'); if (rt) rt.textContent = rd.fromUser ? '🌐 طلب من مستخدم' : 'طلب جديد من المشرف';
    playSound('request'); vibrate([300,100,300,100,300]);
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
        await push(tRef('notifications'), { type:'timeout', driverId:CU.id, driverName:CU.name, reqId:rid, msg:`⏰ السائق ${CU.name} لم يرد`, ts:Date.now(), read:false });
        const rdSnap = await get(tRef(`driverRequests/${CU.id}/${rid}`)).catch(() => null);
        if (rdSnap && rdSnap.exists()) {
          const rdv = rdSnap.val();
          if (rdv.fromUser && rdv.userReqRef) await update(ref(_db, rdv.userReqRef), { driverStatus:'no_response' }).catch(() => {});
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
        await update(ref(_db, d.userReqRef), { driverStatus: status, driverName: CU?.name || '', ...extra }).catch(() => {});
    }
  } catch(e) {}
};

window.acceptReq = async () => {
  const rid = $('currentReqId').value; if (!rid) return;
  clearInterval(reqCountdownTimer);
  const snap = await get(tRef(`driverRequests/${CU.id}/${rid}`)).catch(() => null);
  if (!snap || !snap.exists()) { $('ReqNotif').classList.remove('on'); return; }
  const st = snap.val().status;
  if (st === 'cancelled') { $('ReqNotif').classList.remove('on'); toast('warn','تم إلغاء هذا الطلب',''); return; }
  if (st !== 'pending' && st !== 'modified') { $('ReqNotif').classList.remove('on'); return; }
  const ts = Date.now();
  await update(tRef(`driverRequests/${CU.id}/${rid}`), { status:'accepted', acceptedAt: ts });
  await update(tRef(`drivers/${CU.id}`), { taxiColor:'red', status:'busy' });
  CU.taxiColor = 'red';
  await push(tRef('notifications'), { type:'accept', driverId:CU.id, driverName:CU.name, reqId:rid, msg:`✅ السائق ${CU.name} قبل الطلب`, ts, read:false });
  await _notifyUserReq(tRef(`driverRequests/${CU.id}/${rid}`), 'accepted', { acceptedAt: ts });
  $('ReqNotif').classList.remove('on'); vibrate([200]); playSound('accept'); toast('ok','تم قبول الطلب 🚕','');
};
window.showRejectInput = () => $('reqRejectArea').classList.toggle('on');
window.submitReject = async () => {
  const rid = $('currentReqId').value, reason = ($('reqRejectReason').value || '').trim();
  if (!reason) return toast('warn','اكتب سبب الرفض','');
  clearInterval(reqCountdownTimer);
  await _notifyUserReq(tRef(`driverRequests/${CU.id}/${rid}`), 'rejected');
  await update(tRef(`driverRequests/${CU.id}/${rid}`), { status:'rejected', rejectedAt:Date.now(), reason });
  await push(tRef('notifications'), { type:'reject', driverId:CU.id, driverName:CU.name, reqId:rid, reason, msg:`❌ السائق ${CU.name} رفض — ${reason}`, ts:Date.now(), read:false });
  $('ReqNotif').classList.remove('on'); vibrate([100,50,100]); playSound('reject'); toast('info','تم رفض الطلب','');
};

window.inlineAccept = async id => {
  const snap = await get(tRef(`driverRequests/${CU.id}/${id}`)).catch(() => null);
  if (!snap || !snap.exists()) return toast('warn','الطلب غير موجود','');
  const rd = snap.val();
  if (rd.status === 'cancelled') return toast('warn','تم إلغاء هذا الطلب','');
  if (rd.status !== 'pending' && rd.status !== 'modified') return;
  const ts = Date.now();
  await update(tRef(`driverRequests/${CU.id}/${id}`), { status:'accepted', acceptedAt:ts });
  await update(tRef(`drivers/${CU.id}`), { taxiColor:'red', status:'busy' });
  CU.taxiColor = 'red'; CU.status = 'busy';
  if ($('currentReqId').value === id) { clearInterval(reqCountdownTimer); $('ReqNotif').classList.remove('on'); $('currentReqId').value = ''; }
  await push(tRef('notifications'), { type:'accept', driverId:CU.id, driverName:CU.name, reqId:id, msg:`✅ السائق ${CU.name} قبل الطلب`, ts, read:false });
  if (rd.fromUser && rd.userReqRef) await update(ref(_db, rd.userReqRef), { driverStatus:'accepted', driverName:CU.name, acceptedAt:ts }).catch(() => {});
  vibrate([200]); playSound('accept'); toast('ok','تم قبول الطلب 🚕','');
  const b = $('drvStatusBadge'); if (b) b.innerHTML = getStatusBadge(CU);
};
window.inlineReject = async id => {
  const reason = prompt('سبب الرفض (مطلوب):',''); if (!reason || !reason.trim()) return toast('warn','يرجى كتابة سبب الرفض','');
  const snap = await get(tRef(`driverRequests/${CU.id}/${id}`)).catch(() => null);
  const rd   = snap && snap.exists() ? snap.val() : {};
  await update(tRef(`driverRequests/${CU.id}/${id}`), { status:'rejected', rejectedAt:Date.now(), reason:reason.trim() });
  if ($('currentReqId').value === id) { clearInterval(reqCountdownTimer); $('ReqNotif').classList.remove('on'); $('currentReqId').value = ''; }
  await push(tRef('notifications'), { type:'reject', driverId:CU.id, driverName:CU.name, reqId:id, reason:reason.trim(), msg:`❌ السائق ${CU.name} رفض — ${reason.trim()}`, ts:Date.now(), read:false });
  if (rd.fromUser && rd.userReqRef) await update(ref(_db, rd.userReqRef), { driverStatus:'rejected' }).catch(() => {});
  vibrate([100,50,100]); playSound('reject'); toast('info','تم رفض الطلب','');
};

const updStatus = async s => {
  if (!CU) return;
  const cm = { online:'green', busy:'red', break:'orange', pray:'orange', waiting:'orange', near:'orange', offline:'green' };
  await update(tRef(`drivers/${CU.id}`), { status:s, taxiColor:cm[s]||'green', lastSeen:Date.now() });
  CU.taxiColor = cm[s]||'green'; CU.status = s;
};


/* ══════════════════════════════════════════════════
   SUPERVISOR — NOTIFS LISTENER
   ══════════════════════════════════════════════════ */
const listenSupNotifs = () => {
  cleanNotifs();
  const rPending = tRef('drivers');
  onValue(rPending, snap => {
    if (!snap.exists()) return;
    const pending = Object.values(snap.val()).filter(d => d.approvalStatus === 'pending').length;
    ['approval-badge','mob-approval-badge'].forEach(bid => {
      const b = $(bid); if (b) { b.textContent = pending; b.style.display = pending > 0 ? 'inline' : 'none'; }
    });
  });
  LSNRS.push({ r: rPending, keep: true });

  const r = tRef('notifications');
  onValue(r, snap => {
    if (!snap.exists()) return;
    const unread = Object.values(snap.val()).filter(n => !n.read).length;
    ['notif-badge','mob-notif-badge'].forEach(bid => {
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
        playSound('request'); vibrate([300,100,300]);
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
const initDash = () => {
  $('PL').style.display = 'none'; $('PD').style.display = 'block';
  const nav = $('navav'); nav.textContent = CR === 'driver' ? '🚕' : '👨‍💼';
  if (CR === 'supervisor') nav.classList.add('sup-av');

  const tabs = $('ntabs'), mobNav = $('mobileNav'), mobTabs = $('mobTabs');

  if (CR === 'driver') {
    const cfg = [
      {id:'reqs',    icon:'fas fa-inbox',    label:'الطلبات'},
      {id:'reports', icon:'fas fa-chart-bar', label:'تقاريري'},
      {id:'support', icon:'fas fa-headset',   label:'دعم فني'},
      {id:'profile', icon:'fas fa-user-cog',  label:'حسابي'},
    ];
    tabs.innerHTML = cfg.map((t,i) => `<button class="ntab${i===0?' on':''}" id="nt-${t.id}" onclick="nTab('${t.id}')"><i class="${t.icon}"></i> ${t.label}</button>`).join('');
    if (mobNav && mobTabs) {
      mobNav.style.display = 'block';
      mobTabs.innerHTML = cfg.map((t,i) => `<button class="mob-tab${i===0?' on':''}" id="mnt-${t.id}" onclick="nTab('${t.id}')"><i class="${t.icon}"></i><span class="mob-label">${t.label}</span></button>`).join('');
    }
    renderDriverReqs();
  } else {
    const cfg = [
      {id:'reqs',      icon:'fas fa-inbox',           label:'الطلبات'},
      {id:'map',       icon:'fas fa-map-location-dot', label:'الخريطة'},
      {id:'notifs',    icon:'fas fa-bell',             label:'التنبيهات',  badge:true},
      {id:'approvals', icon:'fas fa-user-check',       label:'الموافقات',  badge2:true},
      {id:'reports',   icon:'fas fa-chart-bar',        label:'التقارير'},
      {id:'accounts',  icon:'fas fa-users',            label:'السائقون'},
      {id:'support',   icon:'fas fa-headset',          label:'دعم فني'},
      {id:'profile',   icon:'fas fa-user-cog',         label:'حسابي'},
    ];
    tabs.innerHTML = cfg.map((t,i) =>
      `<button class="ntab${i===0?' sup-on':''}" id="nt-${t.id}" onclick="nTab('${t.id}')">
        <i class="${t.icon}"></i> ${t.label}
        ${t.badge  ? `<span class="ntab-badge" id="notif-badge"    style="display:none">0</span>` : ''}
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
      mobTabs.innerHTML = cfg.map((t,i) =>
        `<button class="mob-tab${i===0?' sup-on':''}" id="mnt-${t.id}" onclick="nTab('${t.id}')">
          ${t.badge  ? `<span class="mob-tab-badge" id="mob-notif-badge"    style="display:none">0</span>` : ''}
          ${t.badge2 ? `<span class="mob-tab-badge" id="mob-approval-badge" style="display:none;background:var(--green)">0</span>` : ''}
          <i class="${t.icon}"></i><span class="mob-label">${t.label}</span>
        </button>`
      ).join('');
      mobTabs.innerHTML += `<button class="mob-tab" onclick="openMonitor()"><i class="fas fa-tv"></i><span class="mob-label">مراقبة</span></button>`;
    }
    renderSupReqs();
  }
};

let _tabBusy = false;
window.nTab = t => {
  if (_tabBusy) return; _tabBusy = true;
  document.querySelectorAll('#ntabs .ntab').forEach(b => b.classList.remove('on','sup-on'));
  const el = $('nt-'+t); if (el) el.classList.add(CR === 'supervisor' ? 'sup-on' : 'on');
  document.querySelectorAll('#mobTabs .mob-tab').forEach(b => b.classList.remove('on','sup-on'));
  const mel = $('mnt-'+t); if (mel) mel.classList.add(CR === 'supervisor' ? 'sup-on' : 'on');
  clrListeners(true);
  if (CR === 'driver') {
    if      (t==='reqs')    renderDriverReqs();
    else if (t==='reports') renderDriverReports();
    else if (t==='support') renderSupport('driver');
    else                    renderDProfile();
  } else {
    if      (t==='reqs')      renderSupReqs();
    else if (t==='map')       renderMapSup();
    else if (t==='notifs')    renderNotifs();
    else if (t==='approvals') renderApprovals();
    else if (t==='reports')   renderSupReports();
    else if (t==='accounts')  renderAccs();
    else if (t==='support')   renderSupport('supervisor');
    else                      renderSProfile();
  }
  setTimeout(() => { _tabBusy = false; }, 400);
};

const clrListeners = (keepPerm = false) => {
  LSNRS.forEach(({r, keep, timer}) => {
    if (keepPerm && keep) return;
    if (timer) clearInterval(timer);
    try { if (r) off(r); } catch(e) {}
  });
  if (keepPerm) { const kept = LSNRS.filter(l => l.keep); LSNRS.length = 0; kept.forEach(l => LSNRS.push(l)); }
  else LSNRS.length = 0;
  if (leafletMap)       { try { leafletMap.remove(); } catch(e) {} leafletMap = null; mapMarkers = {}; }
  if (window._inlineMap){ try { window._inlineMap.remove(); } catch(e) {} window._inlineMap = null; window._inlineMarkers = {}; }
};

const updateStatsUI = () => {
  const ent = Object.entries(allDrvs);
  const upd = (id, v) => { const e = $(id); if (e) e.textContent = v; };
  upd('sTot',  ent.length);
  upd('sOn',   ent.filter(([,d]) => getTCS(d).monCls === 'st-online').length);
  upd('sBusy', ent.filter(([,d]) => getTCS(d).monCls === 'st-busy').length);
  upd('sBreak',ent.filter(([,d]) => getTCS(d).monCls === 'st-break').length);
  upd('sNear', ent.filter(([,d]) => d.status === 'near').length);
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
        <div style="font-size:11px;color:var(--text3)"><i class="fas fa-car" style="margin-left:3px"></i>${esc(CU.carNumber||'-')}</div>
        <div style="margin-top:6px"><span class="deliv-badge"><i class="fas fa-box"></i> ${CU.totalDeliveries||0} توصيلة</span></div>
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
    if (age < 100000) el.innerHTML = `<i class="fas fa-location-dot" style="color:var(--green);margin-left:3px"></i>GPS: ${Math.floor(age/1000)}ث مضت ✅`;
    else              el.innerHTML = `<i class="fas fa-location-dot" style="color:var(--amber);margin-left:3px"></i>GPS: ${Math.floor(age/60000)} دقيقة مضت`;
  }, 5000);
};

const updateNotifBar = () => {
  const bar = $('notifBar'); if (!bar) return;
  if (!('Notification' in window))              { bar.innerHTML = '<i class="fas fa-bell-slash" style="color:var(--text4)"></i><span style="color:var(--text4)">الإشعارات غير مدعومة</span>'; return; }
  if (Notification.permission === 'granted')    { bar.innerHTML = '<i class="fas fa-bell" style="color:var(--green)"></i><span style="color:var(--green)">🔔 الإشعارات مفعّلة</span>'; bar.style.background = 'var(--green-l)'; }
  else if (Notification.permission === 'denied'){ bar.innerHTML = '<i class="fas fa-bell-slash" style="color:var(--red)"></i><span style="color:var(--red)">🔕 الإشعارات محجوبة</span>'; bar.style.background = 'var(--red-l)'; }
  else { bar.innerHTML = '<i class="fas fa-bell" style="color:var(--amber)"></i><span style="color:var(--amber)">الإشعارات غير مفعّلة</span><button onclick="enableNotifs()" style="margin-right:auto;padding:4px 10px;background:var(--amber);border:none;border-radius:7px;color:#fff;font-size:11px;font-weight:700;cursor:pointer;font-family:Cairo,sans-serif">🔔 تفعيل</button>'; bar.style.background = 'var(--amber-l)'; }
};
window.enableNotifs = async () => { await registerSW(); const g = await reqPushPerm(); updateNotifBar(); toast(g?'ok':'warn', g?'🔔 تم التفعيل!':'لم يتم التفعيل',''); };

const listenDriverReqsList = () => {
  const r = tRef(`driverRequests/${CU.id}`);
  onValue(r, snap => {
    const list = $('DREQLIST'), cnt = $('drvReqCount'); if (!list) return;
    if (!snap.exists()) { list.innerHTML = '<div class="dreq-empty"><i class="fas fa-box-open"></i><p>لا توجد طلبات بعد</p></div>'; if (cnt) cnt.textContent = '0 طلب'; return; }
    const items = Object.entries(snap.val()).sort((a,b) => (b[1].ts||0)-(a[1].ts||0));
    if (cnt) cnt.textContent = items.length + ' طلب';
    list.innerHTML = items.map(([id, req]) => mkDriverReqCard(id, req)).join('');
    const active = items.filter(([,r]) => r.status==='accepted'||r.status==='waiting'||r.status==='near');
    const hasCancelledWithBusy = items.some(([,r]) => r.status==='cancelled') && (CU.status==='busy'||CU.taxiColor==='red');
    if (active.length === 0 && hasCancelledWithBusy) {
      update(tRef(`drivers/${CU.id}`), { taxiColor:'green', status:'online', lastSeen:Date.now() }).catch(() => {});
      CU.taxiColor = 'green'; CU.status = 'online';
      const b = $('drvStatusBadge'); if (b) b.innerHTML = getStatusBadge(CU);
    }
  });
  addL(r);
};

const mkDriverReqCard = (id, req) => {
  const sMap = { pending:'rc-pending',accepted:'rc-accepted',rejected:'rc-rejected',waiting:'rc-waiting',near:'rc-near',cancelled:'rc-cancelled',modified:'rc-pending',no_response:'rc-rejected',done:'rc-done' };
  const sLbl = { pending:'⏳ انتظار',accepted:'✅ مقبول',rejected:'❌ مرفوض',waiting:'🕐 بالانتظار',near:'⚠️ قريب',cancelled:'🚫 ملغي',modified:'✏️ معدّل',no_response:'⏰ لم يُستجب',done:'✅ تم التوصيل' }[req.status] || req.status;
  const sBadgeCls = req.status==='accepted'||req.status==='done'?'sb-green':req.status==='rejected'||req.status==='cancelled'?'sb-red':req.status==='waiting'||req.status==='near'?'sb-orange':'sb-amber';
  const userBadge = req.fromUser ? `<span style="background:#ECFDF5;color:#059669;border:1px solid #A7F3D0;border-radius:20px;padding:2px 7px;font-size:10px;font-weight:700;margin-right:4px">🌐 مستخدم</span>` : '';
  const modDiff   = req.status==='modified'&&req.prevPhone ? `<div class="mod-diff"><div class="mod-old"><i class="fas fa-times-circle"></i>${esc(req.prevPhone)} • ${esc(req.prevDetails||'')}</div><div class="mod-new"><i class="fas fa-check-circle"></i>${esc(req.phone)} • ${esc(req.details||'')}</div></div>` : '';
  const msgShow   = req.message ? `<div class="req-msg-box" style="margin-bottom:9px"><div class="req-msg-from"><i class="fas fa-user-tie"></i> رسالة المشرف</div><div class="req-msg-text">${esc(req.message)}</div></div>` : '';
  const showPending = req.status==='pending'||req.status==='modified';
  const showActive  = (req.status==='accepted'||req.status==='waiting'||req.status==='near')&&!req.doneDelivery;
  const pendingActs = showPending ? `<div style="display:flex;gap:7px;flex-wrap:wrap;padding:10px;background:var(--amber-l);border:1px solid var(--amber-m);border-radius:var(--r);margin-top:6px;animation:reqPulse 2s infinite"><div style="width:100%;font-size:11px;font-weight:700;color:var(--amber);margin-bottom:4px"><i class="fas fa-clock"></i> يرجى الرد</div><button class="rca rca-green" style="flex:1;padding:10px;font-size:13px;font-weight:800" onclick="inlineAccept('${id}')"><i class="fas fa-check"></i> قبول</button><button class="rca rca-red" style="flex:1;padding:10px;font-size:13px;font-weight:800" onclick="inlineReject('${id}')"><i class="fas fa-times"></i> رفض</button></div>` : '';
  const acts = showActive ? `<button class="rca rca-orange" onclick="setDrvWaiting('${id}')"><i class="fas fa-hourglass-half"></i> انتظار</button><button class="rca rca-amber" onclick="setDrvNear('${id}')"><i class="fas fa-map-pin"></i> قريب</button><button class="rca rca-green" onclick="doneDelivery('${id}')"><i class="fas fa-flag-checkered"></i> تم التوصيل</button>` : '';
  return `<div class="reqcard ${sMap[req.status]||''}" id="dreq-${id}">
    <div class="reqtop"><div class="reqphone"><i class="fas fa-phone"></i>${esc(req.phone||'-')}${userBadge}</div>
    <div class="reqtimes"><span class="sbadge ${sBadgeCls}" style="font-size:10px">${sLbl}</span><span class="reqtime"><i class="fas fa-clock"></i>${fmt(req.ts||Date.now())}</span></div></div>
    <div class="reqdetails"><i class="fas fa-map-marker-alt"></i><span>${esc(req.details||'-')}</span></div>
    ${msgShow}${modDiff}
    ${req.status==='waiting'?`<div style="background:var(--orange-l);border:1px solid var(--orange-m);border-radius:var(--r);padding:8px 12px;margin-bottom:8px;font-size:12px;font-weight:700;color:var(--orange);display:flex;align-items:center;gap:7px"><i class="fas fa-hourglass-half"></i> السائق بالانتظار 🕐</div>`:''}
    ${req.status==='near'?`<div style="background:var(--amber-l);border:1.5px solid var(--amber-m);border-radius:var(--r);padding:8px 12px;margin-bottom:8px;font-size:12px;font-weight:700;color:var(--amber);display:flex;align-items:center;gap:7px;animation:reqPulse 1.5s infinite"><i class="fas fa-map-pin"></i> التاكسي قريب من الزبون ⚠️</div>`:''}
    ${req.status==='done'?`<div style="background:var(--green-l);border:1px solid var(--green-m);border-radius:var(--r);padding:8px 12px;margin-bottom:8px;font-size:12px;font-weight:700;color:var(--green);display:flex;align-items:center;gap:7px"><i class="fas fa-check-circle"></i> تم التوصيل بنجاح ✅</div>`:''}
    ${req.status==='cancelled'?`<div class="cancel-msg"><i class="fas fa-ban"></i>تم إلغاء الطلب</div>`:''}
    <div class="reqacts">${acts}</div>${pendingActs}
  </div>`;
};

window.setDrvWaiting = async id => {
  await update(tRef(`driverRequests/${CU.id}/${id}`), { status:'waiting', waitingAt:Date.now() });
  await updStatus('waiting');
  await _notifyUserReq(tRef(`driverRequests/${CU.id}/${id}`), 'waiting');
  await push(tRef('notifications'), { type:'waiting', driverId:CU.id, driverName:CU.name, reqId:id, msg:`🕐 السائق ${CU.name} بالانتظار`, ts:Date.now(), read:false });
  toast('ok','بالانتظار 🟠',''); playSound('notif');
};
window.setDrvNear = async id => {
  await update(tRef(`driverRequests/${CU.id}/${id}`), { status:'near', nearAt:Date.now() });
  await updStatus('near');
  await _notifyUserReq(tRef(`driverRequests/${CU.id}/${id}`), 'near');
  await push(tRef('notifications'), { type:'near', driverId:CU.id, driverName:CU.name, reqId:id, msg:`⚠️ السائق ${CU.name} قريب`, ts:Date.now(), read:false });
  toast('ok','قريب ⚠️',''); playSound('notif');
};
window.confirmMod = async id => { await update(tRef(`driverRequests/${CU.id}/${id}`), { driverConfirmed:true, status:'accepted' }); toast('ok','تم التأكيد',''); };

window.doneDelivery = async id => {
  if (!CU) return;
  const chk = await get(tRef(`driverRequests/${CU.id}/${id}`)).catch(() => null);
  if (!chk || !chk.exists()) return toast('warn','الطلب غير موجود','');
  const chkStatus = chk.val().status;
  if (chkStatus === 'cancelled') return toast('warn','الطلب ملغي','');
  if (chkStatus !== 'accepted' && chkStatus !== 'waiting' && chkStatus !== 'near' && chkStatus !== 'modified') return toast('warn','لا يمكن إتمام هذا الطلب','');
  const count = (CU.totalDeliveries||0) + 1;
  await update(tRef(`drivers/${CU.id}`), { taxiColor:'green', status:'online', totalDeliveries:count });
  CU.totalDeliveries = count; CU.taxiColor = 'green'; CU.status = 'online';
  await update(tRef(`driverRequests/${CU.id}/${id}`), { status:'done', doneAt:Date.now(), doneDelivery:true });
  const rd = chk.val();
  if (rd.fromUser && rd.userReqRef) await update(ref(_db, rd.userReqRef), { driverStatus:'done', doneAt:Date.now() }).catch(() => {});
  const today = new Date().toISOString().split('T')[0];
  const lRef  = tRef(`drivers/${CU.id}/dailyReport/${today}`);
  const snap  = await get(lRef).catch(() => null);
  const prev  = snap && snap.exists() ? snap.val() : { deliveries:0 };
  await set(lRef, { ...prev, deliveries:(prev.deliveries||0)+1, lastUpdate:Date.now() });
  await push(tRef('notifications'), { type:'done', driverId:CU.id, driverName:CU.name, msg:`📦 السائق ${CU.name} أتم التوصيل — إجمالي: ${count}`, ts:Date.now(), read:false });
  toast('ok', `تم التوصيل! 🎉`, `إجمالي: ${count} توصيلة`); playSound('accept');
  const b  = $('drvStatusBadge'); if (b) b.innerHTML = getStatusBadge(CU);
  const db = document.querySelector('.deliv-badge'); if (db) db.innerHTML = `<i class="fas fa-box"></i> ${count} توصيلة`;
};

window.quickDoneDelivery = async () => {
  if (!CU) return;
  const snap = await get(tRef(`driverRequests/${CU.id}`)).catch(() => null);
  if (!snap || !snap.exists()) return toast('warn','لا يوجد طلب نشط','');
  const active = Object.entries(snap.val()).find(([,r]) => (r.status==='accepted'||r.status==='waiting'||r.status==='near'||r.status==='modified') && !r.doneDelivery);
  if (!active) return toast('warn','لا يوجد طلب نشط','');
  const [id, req] = active;
  if (!confirm(`تأكيد إتمام التوصيل؟\n📞 ${req.phone||''}\n📍 ${(req.details||'').substring(0,50)}`)) return;
  await doneDelivery(id);
};

window.drvAct = async t => {
  const msgs      = { start:'🟢 بدأت شيفتي', end:'🔴 انتهيت من الشيفت', break:'☕ في استراحة', pray:'🕌 ذاهب للصلاة' };
  const statusMap = { start:'online', end:'offline', break:'break', pray:'pray' };
  if (statusMap[t]) await updStatus(statusMap[t]);
  const today = new Date().toISOString().split('T')[0];
  if (t === 'start') {
    const now = Date.now(); shiftStartTime = now; CU.shiftStart = now;
    await update(tRef(`drivers/${CU.id}`), { shiftStart:now, shiftEnd:null });
    const lRef = tRef(`drivers/${CU.id}/dailyReport/${today}`);
    const snap = await get(lRef).catch(() => null);
    const prev = snap && snap.exists() ? snap.val() : { deliveries:0, shifts:[] };
    await set(lRef, { ...prev, shifts:[...(prev.shifts||[]),{start:now}], lastUpdate:now });
    playSound('shift'); toast('ok','بدأ الشيفت 🟢','');
  } else if (t === 'end') {
    if (!shiftStartTime) return toast('warn','لا يوجد شيفت نشط','');
    const now = Date.now(), dur = Math.round((now - shiftStartTime) / 60000);
    const lRef = tRef(`drivers/${CU.id}/dailyReport/${today}`);
    const snap = await get(lRef).catch(() => null);
    const prev = snap && snap.exists() ? snap.val() : { shifts:[] };
    const shifts = [...(prev.shifts||[])];
    if (shifts.length > 0 && !shifts[shifts.length-1].end) { shifts[shifts.length-1].end = now; shifts[shifts.length-1].durationMin = dur; }
    await set(lRef, { ...prev, shifts, lastUpdate:now });
    await update(tRef(`drivers/${CU.id}`), { shiftStart:null, shiftEnd:now });
    shiftStartTime = null; stopGPS();
    toast('ok','انتهى الشيفت 🏁', `مدة: ${dur} دقيقة`);
  } else toast('ok','تم الإرسال ✅','');
  const b = $('drvStatusBadge'); if (b) b.innerHTML = getStatusBadge(CU);
  await push(tRef('notifications'), { type:'info', driverId:CU.id, driverName:CU.name, msg:`${msgs[t]} — ${CU.name}`, ts:Date.now(), read:false });
};

window.sendExcuse = async () => {
  const e = ($('custom-excuse').value || '').trim(); if (!e) return;
  await push(tRef('notifications'), { type:'info', driverId:CU.id, driverName:CU.name, msg:`📝 ${e} — ${CU.name}`, ts:Date.now(), read:false });
  $('custom-excuse').value = ''; toast('ok','تم الإرسال','');
};

window.doDriverSOS = async () => {
  if (!confirm('إرسال نداء طوارئ للمشرف؟')) return;
  await push(tRef('notifications'), { type:'sos', driverId:CU.id, driverName:CU.name, msg:`🆘 SOS! السائق ${CU.name} يحتاج مساعدة!`, ts:Date.now(), read:false, urgent:true });
  vibrate([500,100,500,100,500]); playSound('sos'); toast('err','🆘 SOS أُرسل','');
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
      const inlineMap = L.map('reqMapInline', { zoomControl:false, scrollWheelZoom:false }).setView([32.31,35.03], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution:'', maxZoom:19 }).addTo(inlineMap);
      window._inlineMap = inlineMap; window._inlineMarkers = {};
      const refreshInline = () => {
        if (!window._inlineMap) return;
        Object.entries(allDrvs).forEach(([id, d]) => {
          if (!d.lat || !d.lng) return;
          const cs = getTCS(d);
          const ic = L.divIcon({ html:`<div class="drv-marker-wrap"><div class="drv-marker" style="border-color:${cs.border}">🚕</div><div class="drv-marker-name">${d.name} ${cs.emoji}</div></div>`, className:'', iconSize:[50,50], iconAnchor:[25,50] });
          if (window._inlineMarkers[id]) { window._inlineMarkers[id].setLatLng([d.lat,d.lng]); window._inlineMarkers[id].setIcon(ic); }
          else { window._inlineMarkers[id] = L.marker([d.lat,d.lng],{icon:ic}).addTo(inlineMap).bindPopup(`<div style="font-family:Cairo,sans-serif;font-size:12px;text-align:center"><b>${d.name}</b><br><span style="color:${cs.dot}">${cs.label}</span></div>`); }
        });
      };
      refreshInline(); onDriversUpdate(() => { if (!window._inlineMap) return; refreshInline(); });
    } catch(e) {}
  }));
};

const loadSupReqList = () => {
  const r = tRef('recvRequests');
  onValue(r, snap => {
    const list = $('supReqList'); if (!list) return;
    if (!snap.exists()) { list.innerHTML = `<div style="text-align:center;padding:32px;color:var(--text4)"><i class="fas fa-inbox" style="font-size:32px;opacity:.2;display:block;margin-bottom:8px"></i>لا يوجد طلبات</div>`; return; }
    const items = Object.entries(snap.val()).sort((a,b) => (b[1].ts||0)-(a[1].ts||0)).slice(0,50);
    list.innerHTML = items.map(([id,d]) => {
      const userBadge = d.fromUser ? `<span style="background:#ECFDF5;color:#059669;font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;border:1px solid #A7F3D0;margin-right:4px">🌐 مستخدم</span>` : '';
      return `<div class="reqcard" id="sreq-${id}" style="margin-bottom:9px">
        <div class="reqtop"><div class="reqphone"><i class="fas fa-phone"></i>${esc(d.phone||'-')}${userBadge}</div><div class="reqtimes"><span class="reqtime"><i class="fas fa-clock"></i>${fmt(d.ts||Date.now())}</span></div></div>
        <div class="reqdetails"><i class="fas fa-map-marker-alt"></i><span>${esc(d.details||'-')}</span></div>
        ${d.addedBy?`<div style="font-size:10px;color:var(--text4);margin-bottom:6px"><i class="fas fa-user" style="margin-left:3px"></i>${esc(d.addedBy)}</div>`:''}
        <div class="reqacts">
          <button class="rca rca-primary" onclick="openTaxiSel('${id}','${eAt(d.phone||'')}','${eAt(d.details||'')}','${id}')"><i class="fas fa-car-side"></i> إرسال لسائق</button>
          ${d.hasGps&&d.userLat&&d.userLng?`<a href="https://www.google.com/maps?q=${d.userLat},${d.userLng}" target="_blank" class="rca rca-green" style="text-decoration:none;font-size:11px"><i class="fas fa-map-pin"></i> موقع الزبون</a>`:''}
          <button class="rca rca-amber"   onclick="openEditReq('${id}','${eAt(d.phone||'')}','${eAt(d.details||'')}')"><i class="fas fa-pen"></i></button>
          <button class="rca rca-red"     onclick="cancelReq('${id}')"><i class="fas fa-ban"></i></button>
          <button class="rca rca-gray"    onclick="delRecvItem('${id}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>`;
    }).join('');
  }); addL(r);
};

const loadSupNotifList = () => {
  const icMap  = { accept:'ni-green',reject:'ni-red',timeout:'ni-red',done:'ni-green',waiting:'ni-amber',near:'ni-amber',sos:'ni-red',info:'ni-blue',cancel:'ni-red',edit:'ni-amber',rating:'ni-green',user_request:'ni-green',new_driver:'ni-amber' };
  const icoMap = { accept:'check',reject:'times',timeout:'clock',done:'flag-checkered',waiting:'hourglass-half',near:'map-pin',sos:'triangle-exclamation',info:'info',cancel:'ban',edit:'pen',rating:'star',user_request:'globe',new_driver:'user-plus' };
  const r = tRef('notifications');
  onValue(r, snap => {
    const list = $('supNotifList'); if (!list) return;
    if (!snap.exists()) { list.innerHTML = `<div style="text-align:center;padding:14px;color:var(--text4);font-size:12px">لا يوجد تنبيهات</div>`; return; }
    const items = Object.entries(snap.val()).sort((a,b) => (b[1].ts||0)-(a[1].ts||0)).slice(0,30);
    list.innerHTML = items.map(([nid,n]) => `<div class="notif-item ${n.read?'':'unread'}" style="padding-left:40px">
      <div class="notif-ic ${icMap[n.type]||'ni-blue'}"><i class="fas fa-${icoMap[n.type]||'bell'}"></i></div>
      <div class="notif-body"><div class="notif-title">${esc(n.msg||'')}</div>${n.reason?`<div class="notif-sub">السبب: ${esc(n.reason)}</div>`:''}<div class="notif-time">${fmt(n.ts||Date.now())}</div></div>
      <button class="notif-del-btn" onclick="delNotif('${nid}')" style="position:absolute;left:8px;top:50%;transform:translateY(-50%)"><i class="fas fa-times"></i></button>
    </div>`).join('');
    items.filter(([,n]) => !n.read).forEach(([nid]) => update(tRef(`notifications/${nid}`), { read:true }).catch(() => {}));
  }); addL(r);
};

let _addReqBusy = false;
window.addReqItem = async () => {
  if (_addReqBusy) return;
  const phone   = ($('req-phone').value   || '').trim();
  const details = ($('req-details').value || '').trim();
  if (!phone || !details) return shAl('al-req','err','يرجى ملء جميع الحقول');
  if (!/^[0-9+]{7,15}$/.test(phone.replace(/\s/g,''))) return shAl('al-req','err','رقم الهاتف غير صحيح');
  _addReqBusy = true;
  const btn = $('MaddReq').querySelector('.bp'), origText = btn ? btn.innerHTML : '';
  if (btn) { btn.innerHTML = '<span class="spin"></span> جار...'; btn.disabled = true; }
  try {
    await push(tRef('recvRequests'), { phone, details, ts:Date.now(), addedBy:CU?.name||'المشرف' });
    $('req-phone').value = ''; $('req-details').value = '';
    toast('ok','✅ تم إضافة الطلب',''); playSound('notif'); CM('MaddReq');
  } catch(err) { shAl('al-req','err','خطأ: '+(err.message||'')); }
  finally { if (btn) { btn.innerHTML = origText; btn.disabled = false; } setTimeout(() => { _addReqBusy = false; }, 1000); }
};

window.delRecvItem  = async id => { if (!confirm('حذف هذا الطلب؟')) return; await remove(tRef(`recvRequests/${id}`)); toast('ok','تم الحذف',''); };
window.openEditReq  = (id, phone, details) => {
  $('editreq-id').value      = id;
  $('editreq-phone').value   = phone.replace(/&#39;/g,"'");
  $('editreq-details').value = details.replace(/&#39;/g,"'");
  $('editReqOldData').innerHTML = `<div style="background:var(--red-l);border:1px solid var(--red-m);border-radius:var(--r);padding:9px;font-size:12px;margin-bottom:10px"><div style="font-size:10px;font-weight:700;color:var(--red);margin-bottom:3px"><i class="fas fa-times-circle"></i> البيانات الحالية</div><div>${esc(phone.replace(/&#39;/g,"'"))} • ${esc(details.replace(/&#39;/g,"'"))}</div></div>`;
  OM('MeditReq');
};
window.saveReqEdit  = async () => {
  const id = $('editreq-id').value, np = ($('editreq-phone').value||'').trim(), nd = ($('editreq-details').value||'').trim();
  if (!np || !nd) return shAl('al-editreq','err','يرجى ملء جميع الحقول');
  const snap = await get(tRef(`recvRequests/${id}`)).catch(() => null), old = snap&&snap.exists()?snap.val():{};
  await update(tRef(`recvRequests/${id}`), { phone:np, details:nd, editedAt:Date.now(), editedBy:CU.name, prevPhone:old.phone||'', prevDetails:old.details||'' });
  const drsnap = await get(tRef('driverRequests')).catch(() => null);
  if (drsnap && drsnap.exists()) {
    Object.entries(drsnap.val()).forEach(([drvId, reqs]) => {
      if (!reqs) return;
      Object.entries(reqs).forEach(([rid, req]) => {
        if (req.phone===old.phone && req.status!=='rejected'&&req.status!=='done'&&req.status!=='cancelled') {
          update(tRef(`driverRequests/${drvId}/${rid}`), { status:'modified', phone:np, details:nd, prevPhone:old.phone, prevDetails:old.details, modifiedAt:Date.now(), driverConfirmed:false }).catch(() => {});
          push(tRef(`driverPushNotifs/${drvId}`), { title:'✏️ تم تعديل طلبك', body:`📞 ${np}\n📍 ${nd}`, type:'edit_request', ts:Date.now(), read:false }).catch(() => {});
        }
      });
    });
  }
  await push(tRef('notifications'), { type:'edit', msg:`✏️ تعديل طلب: ${np} — ${nd}`, ts:Date.now(), read:false });
  CM('MeditReq'); toast('ok','تم التعديل',''); playSound('edit');
};

window.cancelReq = async id => {
  if (!confirm('إلغاء هذا الطلب؟')) return;
  const snap = await get(tRef(`recvRequests/${id}`)).catch(() => null), old = snap&&snap.exists()?snap.val():{};
  const drsnap = await get(tRef('driverRequests')).catch(() => null);
  if (drsnap && drsnap.exists()) {
    for (const [drvId, reqs] of Object.entries(drsnap.val())) {
      if (!reqs) continue;
      for (const [rid, req] of Object.entries(reqs)) {
        if (req.phone===old.phone && req.status!=='rejected'&&req.status!=='done') {
          await update(tRef(`driverRequests/${drvId}/${rid}`), { status:'cancelled', cancelledAt:Date.now() });
          await update(tRef(`drivers/${drvId}`), { taxiColor:'green', status:'online', lastSeen:Date.now() }).catch(() => {});
          push(tRef(`driverPushNotifs/${drvId}`), { title:'🚫 تم إلغاء الطلب', body:`إلغاء طلب: ${old.phone||''}`, type:'cancel', ts:Date.now(), read:false }).catch(() => {});
        }
      }
    }
  }
  if (old.userReqRef) await update(ref(_db, old.userReqRef), { driverStatus:'cancelled', cancelledAt:Date.now() }).catch(() => {});
  await push(tRef('notifications'), { type:'cancel', msg:`🚫 إلغاء: ${old.phone||id}`, ts:Date.now(), read:false });
  await remove(tRef(`recvRequests/${id}`)); toast('ok','تم الإلغاء',''); playSound('cancel');
};

window.sendSosBroadcast = async () => {
  const msg = ($('sos-sup-msg').value||'').trim(); if (!msg) return toast('warn','يرجى كتابة رسالة الطوارئ','');
  await update(tRef('sosActive'), { msg, senderName:CU.name, ts:Date.now(), acked:{} });
  await push(tRef('notifications'), { type:'sos', msg:`🆘 SOS من المشرف: ${msg}`, ts:Date.now(), read:false });
  $('SosSupModal').classList.remove('on'); $('sos-sup-msg').value = '';
  toast('err','🆘 SOS أُرسل لجميع السائقين',''); playSound('sos'); vibrate([400,100,400,100,400]);
};

/* ══════════════════════════════════════════════════
   SELECT TAXI
   ══════════════════════════════════════════════════ */
window.openTaxiSel = (reqId, phone, details, recvReqId='') => {
  selTaxiId = null; selReqData = { id:reqId, phone:phone.replace(/&#39;/g,"'"), details:details.replace(/&#39;/g,"'"), recvReqId:recvReqId||reqId };
  const list   = $('sel-taxi-list');
  const avail  = Object.entries(allDrvs).sort(([,a],[,b]) => {
    const ao = getTCS(a).monCls==='st-online'?0:getTCS(a).monCls==='st-break'?1:2;
    const bo = getTCS(b).monCls==='st-online'?0:getTCS(b).monCls==='st-break'?1:2;
    return ao - bo;
  });
  if (!avail.length) { list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3)">لا يوجد سائقون</div>'; $('SelTaxiModal').classList.add('on'); return; }
  list.innerHTML = avail.map(([id,d]) => {
    const cs = getTCS(d);
    return `<div class="sel-taxi-item" id="stitem-${id}" onclick="selectTaxi('${id}')">
      <div style="width:40px;height:40px;border-radius:11px;border:2px solid ${cs.border};background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🚕</div>
      <div style="flex:1"><div style="font-weight:800;font-size:13px;color:var(--text)">${esc(d.name)}</div><div style="font-size:11px;color:${cs.dot}">${cs.label}</div>${d.carNumber?`<div style="font-size:10px;color:var(--text4)">🚗 ${esc(d.carNumber)}</div>`:''}<span class="deliv-badge" style="font-size:10px;padding:2px 7px;margin-top:3px;display:inline-flex"><i class="fas fa-box"></i> ${d.totalDeliveries||0}</span></div>
      <i class="fas fa-check-circle" id="stchk-${id}" style="display:none;color:var(--primary);font-size:18px"></i>
    </div>`;
  }).join('');
  $('SelTaxiModal').classList.add('on'); $('confirmSelBtn').disabled = true; $('confirmSelBtn').style.opacity = '.5';
};
window.selectTaxi = id => {
  if (selTaxiId) { const p = $(`stitem-${selTaxiId}`); if (p) p.classList.remove('selected'); const c = $(`stchk-${selTaxiId}`); if (c) c.style.display='none'; }
  selTaxiId = id;
  const el = $(`stitem-${id}`); if (el) el.classList.add('selected');
  const chk = $(`stchk-${id}`); if (chk) chk.style.display = 'block';
  $('confirmSelBtn').disabled = false; $('confirmSelBtn').style.opacity = '1';
};
window.closeTaxiSel = () => { $('SelTaxiModal').classList.remove('on'); selTaxiId = null; selReqData = null; };

let _sendBusy = false;
window.confirmTaxiSel = async () => {
  if (!selTaxiId || !selReqData || _sendBusy) return;
  const msg = prompt('رسالة للسائق (اختياري):',''); if (msg === null) return;
  _sendBusy = true;
  const btn = $('confirmSelBtn'); btn.innerHTML = '<span class="spin"></span>'; btn.disabled = true; btn.style.opacity = '.7';
  try {
    const recvSnap = await get(tRef(`recvRequests/${selReqData.recvReqId}`)).catch(() => null), recvData = recvSnap&&recvSnap.exists()?recvSnap.val():{};
    const payload  = { phone:selReqData.phone, details:selReqData.details, status:'pending', ts:Date.now(), sentBy:CU.name, sentAt:Date.now() };
    if (msg) payload.message = msg;
    if (recvData.fromUser && recvData.userReqRef) { payload.fromUser = true; payload.userReqRef = recvData.userReqRef; }
    const reqRef = await push(tRef(`driverRequests/${selTaxiId}`), payload);
    await push(tRef(`driverPushNotifs/${selTaxiId}`), { title:`📦 ${recvData.fromUser?'طلب مستخدم':'طلب جديد'}`, body:`📞 ${selReqData.phone}\n📍 ${selReqData.details}${msg?'\n💬 '+msg:''}`, type:'new_request', reqId:reqRef.key, ts:Date.now(), read:false });
    toast('ok','تم إرسال الطلب للسائق 🚕',''); playSound('notif'); closeTaxiSel();
  } catch(err) { toast('err','خطأ',err.message||''); }
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
      leafletMap = L.map('driverMap', { zoomControl:true }).setView([32.31,35.03], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution:'© OpenStreetMap', maxZoom:19 }).addTo(leafletMap);
    } catch(e) { return; }
    const refreshMap = () => {
      if (!leafletMap) return;
      const ent = Object.entries(allDrvs);
      const upd = (id, v) => { const e = $(id); if (e) e.textContent = v; };
      upd('mG',   ent.filter(([,d]) => getTCS(d).monCls==='st-online').length);
      upd('mO',   ent.filter(([,d]) => getTCS(d).monCls==='st-break').length);
      upd('mR',   ent.filter(([,d]) => getTCS(d).monCls==='st-busy').length);
      upd('mTot', ent.length);
      ent.forEach(([id, d]) => { if (d.lat && d.lng) updateMapMarker(id, d); });
    };
    refreshMap(); onDriversUpdate(() => { if (!leafletMap) return; refreshMap(); });
  }));
};

const updateMapMarker = (id, d) => {
  if (!leafletMap) return;
  const cs  = getTCS(d);
  const age = d.locUpdated ? Date.now() - d.locUpdated : 999999;
  const stale = age > 300000 ? `<div style="background:#FEF2F2;color:#DC2626;font-size:8px;font-weight:700;padding:1px 5px;border-radius:4px;white-space:nowrap">⚠️ موقع قديم</div>` : '';
  const shiftLbl = d.shiftStart && d.status !== 'offline' ? `<div class="drv-marker-time">⏱ ${fmtElapsed(Date.now()-d.shiftStart)}</div>` : '';
  const icon = L.divIcon({ html:`<div class="drv-marker-wrap"><div class="drv-marker" style="border-color:${cs.border}">🚕</div><div class="drv-marker-name">${d.name} ${cs.emoji}</div>${shiftLbl}${stale}</div>`, className:'', iconSize:[60,72], iconAnchor:[30,72] });
  const pop  = `<div style="text-align:center;padding:4px;min-width:140px;font-family:'Cairo',sans-serif">
    <div style="font-weight:800;font-size:13px;margin-bottom:4px">${d.name}</div>
    <div style="font-size:11px;color:${cs.dot}">${cs.label}</div>
    ${d.phone?`<div style="font-size:11px;color:var(--text3)">${d.phone}</div>`:''}
    <div style="font-size:11px;color:var(--primary);margin-top:3px;font-weight:700">📦 ${d.totalDeliveries||0} توصيلة</div>
    ${d.locUpdated?`<div style="font-size:10px;color:${age>300000?'var(--red)':'var(--text4)'};margin-top:2px">آخر تحديث: ${fmt(d.locUpdated)}</div>`:''}
    <a href="https://www.google.com/maps?q=${d.lat},${d.lng}" target="_blank" style="display:inline-block;margin-top:8px;padding:5px 12px;background:var(--primary);color:#fff;border-radius:7px;font-size:11px;text-decoration:none;font-family:Cairo,sans-serif">Google Maps</a>
  </div>`;
  if (mapMarkers[id]) { mapMarkers[id].setLatLng([d.lat,d.lng]); mapMarkers[id].setIcon(icon); mapMarkers[id].getPopup()?.setContent(pop); }
  else { mapMarkers[id] = L.marker([d.lat,d.lng],{icon}).addTo(leafletMap).bindPopup(pop); }
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
  const icMap  = { accept:'ni-green',reject:'ni-red',timeout:'ni-red',done:'ni-green',waiting:'ni-amber',near:'ni-amber',sos:'ni-red',cancel:'ni-red',edit:'ni-amber',info:'ni-blue',rating:'ni-green',user_request:'ni-green',new_driver:'ni-amber' };
  const icoMap = { accept:'check',reject:'times',timeout:'clock',done:'flag-checkered',waiting:'hourglass-half',near:'map-pin',sos:'triangle-exclamation',cancel:'ban',edit:'pen',info:'info',rating:'star',user_request:'globe',new_driver:'user-plus' };
  const r = tRef('notifications');
  onValue(r, snap => {
    const list = $('NLIST'); if (!list) return;
    if (!snap.exists()) { list.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text4)">لا يوجد تنبيهات</div>'; return; }
    const items = Object.entries(snap.val()).sort((a,b) => (b[1].ts||0)-(a[1].ts||0)).slice(0,100);
    list.innerHTML = items.map(([nid,n]) => `<div class="notif-item ${n.read?'':'unread'}">
      <div class="notif-ic ${icMap[n.type]||'ni-blue'}"><i class="fas fa-${icoMap[n.type]||'bell'}"></i></div>
      <div class="notif-body"><div class="notif-title">${esc(n.msg||'')}</div>${n.reason?`<div class="notif-sub">السبب: ${esc(n.reason)}</div>`:''}<div class="notif-time">${fmt(n.ts||Date.now())}</div></div>
      <button class="notif-del-btn" onclick="delNotif('${nid}')"><i class="fas fa-times"></i></button>
    </div>`).join('');
    items.filter(([,n]) => !n.read).forEach(([nid]) => update(tRef(`notifications/${nid}`), { read:true }).catch(() => {}));
    const b = $('notif-badge'); if (b) b.style.display = 'none';
    const mb = $('mob-notif-badge'); if (mb) mb.style.display = 'none';
  }); addL(r);
};
window.delNotif       = async nid => remove(tRef(`notifications/${nid}`)).catch(() => {});
window.clearAllNotifs = async () => { if (!confirm('حذف كل التنبيهات؟')) return; if (!confirm('تأكيد نهائي؟')) return; await remove(tRef('notifications')).catch(() => {}); toast('ok','تم الحذف',''); };

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
  const all      = Object.entries(snap.val());
  const pending  = all.filter(([,d]) => d.approvalStatus === 'pending');
  const approved = all.filter(([,d]) => d.approvalStatus === 'approved' || (!d.approvalStatus && d.role==='driver'));
  const rejected = all.filter(([,d]) => d.approvalStatus === 'rejected');
  list.innerHTML = `
    ${pending.length > 0 ? `<div style="margin-bottom:20px">
      <div style="font-family:'Tajawal',sans-serif;font-size:16px;font-weight:900;color:var(--amber);margin-bottom:12px"><i class="fas fa-clock"></i> ينتظر الموافقة (${pending.length})</div>
      ${pending.map(([id,d]) => `<div style="background:var(--bg);border:1.5px solid var(--amber-m);border-radius:var(--rl);padding:16px;margin-bottom:10px;box-shadow:var(--shadow)">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
          <div style="width:48px;height:48px;border-radius:13px;background:var(--amber-l);border:2px solid var(--amber-m);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0">🚕</div>
          <div style="flex:1"><div style="font-size:14px;font-weight:800;color:var(--text)">${esc(d.name)}</div><div style="font-size:12px;color:var(--text3)">${esc(d.phone||'-')}</div><div style="font-size:11px;color:var(--text4)">🚗 ${esc(d.carNumber||'-')}</div></div>
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
  await update(tRef(`drivers/${drvId}`), { approvalStatus:'approved', status:'online', taxiColor:'green', approvedBy:CU.name, approvedAt:Date.now() });
  await push(tRef('notifications'), { type:'accept', msg:`✅ تم قبول السائق: ${drvId}`, ts:Date.now(), read:false });
  await push(tRef(`driverPushNotifs/${drvId}`), { title:'✅ تم قبول حسابك!', body:'يمكنك الآن الدخول والعمل', type:'info', ts:Date.now(), read:false });
  toast('ok','تم قبول السائق ✅',''); playSound('accept'); loadPendingDrivers();
};
window.rejectDriver = async (drvId, drvName) => {
  const reason = prompt(`سبب رفض "${drvName}" (اختياري):`,''); if (reason === null) return;
  await update(tRef(`drivers/${drvId}`), { approvalStatus:'rejected', status:'offline', rejectedBy:CU.name, rejectedAt:Date.now(), rejectionReason:reason||'-' });
  await push(tRef('notifications'), { type:'reject', msg:`❌ رفض: ${drvId}`, ts:Date.now(), read:false });
  toast('info','تم الرفض',''); loadPendingDrivers();
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
    list.innerHTML = all.map(([id,d]) => {
      const cst = getTCS(d);
      const statusBadge = d.approvalStatus==='pending'
        ? `<span style="background:var(--amber-l);color:var(--amber);border:1px solid var(--amber-m);border-radius:20px;padding:2px 8px;font-size:10px;font-weight:700">⏳ ينتظر</span>`
        : d.approvalStatus==='rejected'
        ? `<span style="background:var(--red-l);color:var(--red);border:1px solid var(--red-m);border-radius:20px;padding:2px 8px;font-size:10px;font-weight:700">❌ مرفوض</span>`
        : `<span style="background:var(--green-l);color:var(--green);border:1px solid var(--green-m);border-radius:20px;padding:2px 8px;font-size:10px;font-weight:700">✅ مقبول</span>`;
      return `<div class="acccard"><div class="acctop">
        <div class="accav">🚕</div>
        <div style="flex:1;min-width:0">
          <div class="accnm">${esc(d.name)}</div>
          <div class="accph"><i class="fas fa-phone"></i> ${esc(d.phone||id)}</div>
          <div class="accph"><i class="fas fa-car"></i> ${esc(d.carNumber||'-')}</div>
          <div style="margin-top:3px;display:flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:${cst.dot}"><div style="width:7px;height:7px;border-radius:50%;background:${cst.dot}"></div>${cst.label}</div>
          <div style="margin-top:3px">${statusBadge}</div>
          <div style="margin-top:4px"><span class="deliv-badge" style="font-size:10px;padding:2px 7px"><i class="fas fa-box"></i> ${d.totalDeliveries||0} توصيلة</span></div>
        </div>
      </div>
      <div class="accbts">
        <button class="accbtn aedit" onclick="opnEac('${id}','${eAt(d.name)}')"><i class="fas fa-pen"></i> تعديل</button>
        <button class="accbtn adel"  onclick="delAcc('${id}')"><i class="fas fa-trash"></i> حذف</button>
      </div></div>`;
    }).join('');
  } catch(err) { if ($('ALIST')) $('ALIST').innerHTML = `<div style="color:var(--red);text-align:center;padding:32px;grid-column:1/-1">خطأ: ${err.message||''}</div>`; }
};
window.filterDrvAccs = q => {
  q = q.toLowerCase().trim();
  document.querySelectorAll('#ALIST .acccard').forEach(c => { c.style.display = (!q || c.innerText.toLowerCase().includes(q)) ? '' : 'none'; });
};
window.opnEac = (id, nm) => {
  $('eac-id').value = id; $('eac-nm').value = nm.replace(/&#39;/g,"'").replace(/&quot;/g,'"');
  $('eac-pw').value = ''; $('eacsub').textContent = 'السائق: ' + nm.replace(/&#39;/g,"'"); OM('Meditacc');
};
window.saveEac = async () => {
  const id = $('eac-id').value, nm = ($('eac-nm').value||'').trim(), pw = $('eac-pw').value||'';
  if (!nm) return shAl('al-eac','err','الاسم مطلوب');
  const btn = $('Meditacc').querySelector('.ba'), orig = btn.innerHTML;
  btn.innerHTML = '<span class="spin"></span>'; btn.disabled = true;
  try {
    const u = { name:nm }; if (pw) { u.pwHash = await _h(pw); u.password = null; }
    await update(tRef(`drivers/${id}`), u); CM('Meditacc'); toast('ok','تم التعديل ✅',''); loadAccs();
  } catch(err) { shAl('al-eac','err','خطأ: '+(err.message||'')); }
  btn.innerHTML = orig; btn.disabled = false;
};
window.delAcc = async id => {
  const sn = await get(tRef(`drivers/${id}`)).catch(() => null);
  const nm = sn && sn.exists() ? sn.val().name : id;
  if (!confirm(`حذف حساب "${nm}"؟`)) return;
  try { await remove(tRef(`drivers/${id}`)); toast('ok','تم الحذف',''); loadAccs(); }
  catch(err) { toast('err','خطأ',err.message||''); }
};


/* ══════════════════════════════════════════════════
   REPORTS — DRIVER
   ══════════════════════════════════════════════════ */
const renderDriverReports = async () => {
  $('dbody').innerHTML = `<div class="panel"><div class="atitle"><i class="fas fa-chart-bar"></i> تقاريري</div><div id="DREP"><div style="text-align:center;padding:32px;color:var(--text4)"><div class="spin dark"></div></div></div></div>`;
  const today = new Date().toISOString().split('T')[0];
  const snap  = await get(tRef(`drivers/${CU.id}/dailyReport/${today}`)).catch(() => null);
  const td    = snap && snap.exists() ? snap.val() : { deliveries:0, shifts:[] };
  const shifts = td.shifts || [];
  let totalMin = 0;
  const shiftRows = shifts.map((s, i) => {
    const sf  = s.start ? new Date(s.start).toLocaleTimeString('ar', {hour:'2-digit',minute:'2-digit'}) : '-';
    const ef  = s.end   ? new Date(s.end).toLocaleTimeString('ar',   {hour:'2-digit',minute:'2-digit'}) : 'جارٍ';
    const dur = s.durationMin || (s.end ? Math.round((s.end-s.start)/60000) : s.start ? Math.round((Date.now()-s.start)/60000) : 0);
    totalMin += dur;
    return `<div class="report-stat"><span class="report-stat-label">شيفت ${i+1}: ${sf} — ${ef}</span><span class="report-stat-val" style="color:var(--amber)">${Math.floor(dur/60)}س ${dur%60}د</span></div>`;
  }).join('');
  const list = $('DREP'); if (!list) return;
  list.innerHTML = `
    <div class="report-card">
      <div class="report-title"><i class="fas fa-calendar-day"></i> تقرير اليوم — ${today}</div>
      <div class="report-stat"><span class="report-stat-label">توصيلات اليوم</span><span class="report-stat-val">${td.deliveries||0} 📦</span></div>
      <div class="report-stat"><span class="report-stat-label">إجمالي التوصيلات</span><span class="report-stat-val" style="color:var(--primary)">${CU.totalDeliveries||0} 📦</span></div>
      <div class="report-stat"><span class="report-stat-label">إجمالي العمل اليوم</span><span class="report-stat-val" style="color:var(--primary)">${Math.floor(totalMin/60)}س ${totalMin%60}د</span></div>
      <div class="report-stat"><span class="report-stat-label">عدد الشيفتات</span><span class="report-stat-val">${shifts.length}</span></div>
      ${shiftStartTime ? `<div class="report-stat"><span class="report-stat-label">⏱ الشيفت الحالي</span><span class="report-stat-val" style="color:var(--green)" id="liveTimer">${fmtElapsed(Date.now()-shiftStartTime)}</span></div>` : ''}
    </div>
    ${shifts.length ? `<div class="report-card"><div class="report-title"><i class="fas fa-clock"></i> تفصيل الشيفتات</div>${shiftRows}</div>` : ''}`;
  if (shiftStartTime) setInterval(() => { const e = $('liveTimer'); if (e && shiftStartTime) e.textContent = fmtElapsed(Date.now()-shiftStartTime); }, 1000);
};

/* ══════════════════════════════════════════════════
   REPORTS — SUPERVISOR
   ══════════════════════════════════════════════════ */
const renderSupReports = async () => {
  $('dbody').innerHTML = `<div class="panel"><div class="atitle"><i class="fas fa-chart-bar"></i> تقارير السائقين</div><div id="SREP"><div style="text-align:center;padding:32px;color:var(--text4)"><div class="spin dark"></div></div></div></div>`;
  const today  = new Date().toISOString().split('T')[0];
  const snap   = await get(tRef('drivers')).catch(() => null);
  const list   = $('SREP'); if (!list) return;
  if (!snap || !snap.exists()) { list.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text4)">لا يوجد سائقون</div>'; return; }
  const all  = Object.entries(snap.val());
  const reps = await Promise.all(all.map(([id]) => get(tRef(`drivers/${id}/dailyReport/${today}`)).catch(() => null)));
  const totalDel    = reps.reduce((s,r) => s + (r&&r.exists() ? r.val().deliveries||0 : 0), 0);
  const totalAllDel = all.reduce((s,[,d]) => s + (d.totalDeliveries||0), 0);
  const fmtMin = m => `${Math.floor(m/60)}س ${m%60}د`;
  const calcMin = rep => { if (!rep||!rep.shifts) return 0; return rep.shifts.reduce((s,sh) => s+(sh.durationMin||(sh.end?Math.round((sh.end-sh.start)/60000):sh.start?Math.round((Date.now()-sh.start)/60000):0)),0); };

  /* التقييمات */
  const ratingsSnap = await get(tRef('ratings')).catch(() => null);
  let avgRating = 0, ratingCount = 0;
  if (ratingsSnap && ratingsSnap.exists()) {
    const rArr = Object.values(ratingsSnap.val());
    ratingCount = rArr.length;
    avgRating   = rArr.reduce((s,r) => s+(r.stars||0), 0) / ratingCount;
  }

  list.innerHTML = `
    <div class="report-card">
      <div class="report-title"><i class="fas fa-globe"></i> ملخص اليوم — ${today}</div>
      <div class="report-stat"><span class="report-stat-label">إجمالي السائقين</span><span class="report-stat-val">${all.length}</span></div>
      <div class="report-stat"><span class="report-stat-label">متاح الآن 🟢</span><span class="report-stat-val" style="color:var(--green)">${all.filter(([,d])=>getTCS(d).monCls==='st-online').length}</span></div>
      <div class="report-stat"><span class="report-stat-label">مشغول الآن 🔴</span><span class="report-stat-val" style="color:var(--red)">${all.filter(([,d])=>getTCS(d).monCls==='st-busy').length}</span></div>
      <div class="report-stat"><span class="report-stat-label">توصيلات اليوم</span><span class="report-stat-val">${totalDel} 📦</span></div>
      <div class="report-stat"><span class="report-stat-label">إجمالي التوصيلات</span><span class="report-stat-val" style="color:var(--primary)">${totalAllDel} 📦</span></div>
      ${ratingCount>0?`<div class="report-stat"><span class="report-stat-label">متوسط التقييمات ⭐</span><span class="report-stat-val" style="color:var(--amber)">${avgRating.toFixed(1)} / 5 (${ratingCount} تقييم)</span></div>`:''}
    </div>
    <div class="report-card">
      <div class="report-title"><i class="fas fa-list"></i> تفصيل كل سائق</div>
      ${all.map(([id,d],i) => {
        const rep = reps[i]&&reps[i].exists() ? reps[i].val() : {deliveries:0,shifts:[]};
        const cst = getTCS(d), sm = calcMin(rep);
        return `<div class="report-drv-card"><div style="display:flex;align-items:center;gap:10px">
          <div style="width:44px;height:44px;border-radius:12px;background:var(--bg3);border:2px solid ${cst.border};display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🚕</div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:800;font-size:13px;color:var(--text)">${esc(d.name)}</div>
            <div style="font-size:11px;color:${cst.dot}">${cst.label}</div>
            ${d.shiftStart&&d.status!=='offline'?`<div style="font-size:11px;color:var(--green)">⏱ ${fmtElapsed(Date.now()-d.shiftStart)}</div>`:''}
          </div>
          <div style="text-align:center;flex-shrink:0">
            <div style="font-size:16px;font-weight:900;color:var(--green)">${rep.deliveries||0}</div><div style="font-size:9px;color:var(--text4)">اليوم</div>
            <div style="font-size:14px;font-weight:900;color:var(--primary);margin-top:3px">${d.totalDeliveries||0}</div><div style="font-size:9px;color:var(--text4)">الكلي</div>
            <div style="font-size:12px;font-weight:800;color:var(--amber);margin-top:3px">${fmtMin(sm)}</div><div style="font-size:9px;color:var(--text4)">عمل</div>
          </div>
        </div></div>`;
      }).join('')}
    </div>
    ${ratingCount>0&&ratingsSnap ? `<div class="report-card">
      <div class="report-title"><i class="fas fa-star"></i> التقييمات الأخيرة</div>
      ${Object.entries(ratingsSnap.val()).sort((a,b)=>(b[1].ts||0)-(a[1].ts||0)).slice(0,10).map(([,r]) =>
        `<div style="padding:10px 0;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;gap:10px">
          <div style="font-size:18px">${'⭐'.repeat(r.stars||0)}</div>
          <div style="flex:1"><div style="font-size:12px;font-weight:700;color:var(--text)">${esc(r.comment||'بدون تعليق')}</div>
          <div style="font-size:10px;color:var(--text4);margin-top:3px">📞 ${r.phone||'-'} • ${fmt(r.ts||Date.now())}</div></div>
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
    ${role==='supervisor'?`<div style="margin-bottom:16px;padding:14px;background:var(--red-l);border:1.5px solid var(--red-m);border-radius:var(--rl);display:flex;align-items:center;gap:12px">
      <div style="width:44px;height:44px;border-radius:12px;background:var(--red);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🆘</div>
      <div style="flex:1"><div style="font-weight:800;font-size:14px;color:var(--red);margin-bottom:3px">إرسال SOS لجميع السائقين</div></div>
      <button style="padding:10px 18px;background:var(--red);border:none;border-radius:var(--r);color:#fff;font-size:13px;font-weight:800;cursor:pointer;font-family:'Cairo',sans-serif" onclick="OM('SosSupModal')"><i class="fas fa-triangle-exclamation"></i> SOS</button>
    </div>`:''}
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
    if (supSnap && supSnap.exists()) Object.entries(supSnap.val()).forEach(([id,s]) => { all.unshift(['sup_'+id, {...s, isSuper:true}]); });
    const drSnap  = await get(tRef('drivers')).catch(() => null);
    if (drSnap  && drSnap.exists())  Object.entries(drSnap.val()).forEach(([id,d])  => { if (id!==CU.id&&d.approvalStatus!=='rejected') all.push([id,d]); });
  } else {
    const snap = await get(tRef('drivers')).catch(() => null);
    if (snap && snap.exists()) Object.entries(snap.val()).forEach(([id,d]) => all.push([id,d]));
  }

  const list = $('SLIST'); if (!list) return;
  if (!all.length) { list.innerHTML = `<div style="text-align:center;padding:32px;color:var(--text4);grid-column:1/-1">لا يوجد جهات اتصال</div>`; return; }
  list.innerHTML = all.map(([id,d]) => {
    const phone  = (d.phone||'').replace(/[^0-9]/g,'').replace(/^0/,'972');
    const waLink = `https://wa.me/${phone}`;
    const c      = d.isSuper ? {dot:'#D97706',label:'👨‍💼 المشرف'} : getTCS(d);
    return `<div class="support-drv-card">
      <div style="width:52px;height:52px;border-radius:14px;background:var(--bg2);border:2px solid ${c.dot};display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0">${d.isSuper?'👨‍💼':'🚕'}</div>
      <div style="flex:1;min-width:0">
        <div class="support-drv-name">${esc(d.name)}</div>
        <div class="support-drv-phone" style="color:${c.dot}">${c.label}</div>
        ${d.phone?`<div style="font-size:11px;color:var(--text4)">${d.phone}</div>`:''}
      </div>
      <a href="${waLink}" target="_blank" class="support-wa-btn"><i class="fab fa-whatsapp"></i> واتساب</a>
    </div>`;
  }).join('');
};
window.reportBug = async () => {
  const msg = prompt('صف المشكلة التي واجهتها:',''); if (!msg||!msg.trim()) return;
  window.open(`https://wa.me/972595125423?text=${encodeURIComponent(`🐛 بلاغ مشكلة:\n${msg.trim()}`)}`, '_blank');
  await push(tRef('errorLogs'), { msg:msg.trim(), userId:CU?.id||'anon', userName:CU?.name||'زائر', role:CR||'unknown', officeId:TENANT_ID||'-', ts:Date.now() }).catch(() => {});
  toast('ok','✅ تم فتح واتساب','');
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
      <div style="margin-top:6px"><span class="deliv-badge"><i class="fas fa-box"></i> ${CU.totalDeliveries||0} توصيلة</span></div>
    </div>
    <div class="cbox">
      <div class="atitle" style="margin-bottom:14px"><i class="fas fa-user-pen"></i> تعديل بياناتي</div>
      <div class="fg"><label class="fl"><i class="fas fa-user"></i> الاسم</label><input class="fi" id="ep-nm" value="${esc(CU.name)}"></div>
      <div class="fg"><label class="fl"><i class="fas fa-phone"></i> رقم الهاتف</label><input class="fi" value="${esc(CU.phone||'')}" disabled style="opacity:.6"></div>
      <div class="fg"><label class="fl"><i class="fas fa-car"></i> رقم السيارة</label><input class="fi" id="ep-car" value="${esc(CU.carNumber||'')}"></div>
      <div class="fg"><label class="fl"><i class="fas fa-lock"></i> كلمة مرور جديدة</label><input class="fi" type="password" id="ep-pw" placeholder="••••••••"></div>
      <button class="bp" onclick="saveDProf()"><i class="fas fa-save"></i> حفظ التعديلات</button>
      <button class="bdng" onclick="delMyAcc()"><i class="fas fa-trash"></i> حذف حسابي نهائياً</button>
    </div>
  </div>`;
};
window.saveDProf = async () => {
  const nm  = ($('ep-nm').value  || '').trim();
  const pw  =  $('ep-pw').value  || '';
  const car = ($('ep-car').value || '').trim();
  if (!nm) return toast('err','الاسم مطلوب','');
  const u = { name:nm }; if (pw) { if (pw.length < 6) return toast('err','كلمة المرور قصيرة',''); u.pwHash = await _h(pw); u.password = null; } if (car) u.carNumber = car;
  await update(tRef(`drivers/${CU.id}`), u); CU = {...CU,...u}; toast('ok','تم الحفظ ✅','');
};
window.delMyAcc = async () => { if (!confirm('حذف حسابك نهائياً؟')) return; await remove(tRef(`drivers/${CU.id}`)); toast('info','تم الحذف',''); setTimeout(() => logout(), 1200); };

const renderSProfile = () => {
  const info            = TENANT_INFO || { name:'-' };
  const inviteCodePlain = TENANT_INVITE[TENANT_ID] || `DRV-${(TENANT_ID||'XXXX').toUpperCase()}`;
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
window.copyInviteCode = code => { navigator.clipboard.writeText(code).catch(() => {}); toast('ok','✅ تم نسخ الكود','شاركه مع السائقين الجدد'); };
window.saveSProf = async () => {
  const nm = ($('sp-nm').value||'').trim(); if (!nm) return toast('err','الاسم مطلوب','');
  await update(tRef(`supervisors/${CU.id}`), { name:nm }); CU = {...CU, name:nm}; toast('ok','تم الحفظ ✅','');
};


/* ══════════════════════════════════════════════════
   OFFICE LOCATION MAP
   ══════════════════════════════════════════════════ */
const initOfficeLocMap = async () => {
  const snap    = await get(ref(_db, `publicOffices/${TENANT_ID}`)).catch(() => null);
  const existing = snap && snap.exists() ? snap.val() : null;
  if (existing) {
    _officeLocLat = existing.lat; _officeLocLng = existing.lng;
    const el  = $('office-display-name'); if (el)  el.value  = existing.displayName || '';
    const el2 = $('office-desc');         if (el2) el2.value = existing.desc        || '';
    const txt = $('officeLocText');
    if (txt) txt.textContent = `✅ موقع محدد: ${existing.lat?.toFixed(5)}, ${existing.lng?.toFixed(5)} — ${existing.displayName||''}`;
  }
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const el = $('officeLocMap'); if (!el) return;
    if (_officeLocMap) { try { _officeLocMap.remove(); } catch(e) {} }
    const center = existing ? [existing.lat, existing.lng] : [32.31, 35.03];
    try {
      _officeLocMap = L.map('officeLocMap', { zoomControl:true }).setView(center, 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution:'© OpenStreetMap', maxZoom:19 }).addTo(_officeLocMap);
      if (existing) {
        _officeLocMarker = L.marker([existing.lat, existing.lng], { draggable:true }).addTo(_officeLocMap)
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
          _officeLocMarker = L.marker(e.latlng, { draggable:true }).addTo(_officeLocMap)
            .bindPopup('<div style="font-family:Cairo,sans-serif;font-size:13px;text-align:center;font-weight:700">📍 موقع مكتبك</div>').openPopup();
          _officeLocMarker.on('dragend', ev => {
            const pos = ev.target.getLatLng(); _officeLocLat = pos.lat; _officeLocLng = pos.lng;
            const txt = $('officeLocText'); if (txt) txt.textContent = `📍 موقع محدد: ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;
          });
        }
        const txt = $('officeLocText'); if (txt) txt.textContent = `📍 موقع محدد: ${_officeLocLat.toFixed(5)}, ${_officeLocLng.toFixed(5)}`;
      });
    } catch(e) { console.warn('officeLocMap error', e); }
  }));
};
window.saveOfficeLocation = async () => {
  if (!_officeLocLat || !_officeLocLng) return toast('warn','يرجى تحديد موقع على الخريطة أولاً','');
  const displayName = ($('office-display-name').value||'').trim() || (TENANT_INFO?.name||'مكتب تاكسي');
  const desc        = ($('office-desc').value||'').trim();
  await set(ref(_db, `publicOffices/${TENANT_ID}`), { lat:_officeLocLat, lng:_officeLocLng, displayName, desc, tenantId:TENANT_ID, officeName:TENANT_INFO?.name||'', visible:true, updatedAt:Date.now() });
  toast('ok','✅ تم حفظ موقع المكتب','يظهر الآن على خريطة المستخدمين'); playSound('accept');
  const txt = $('officeLocText'); if (txt) txt.textContent = `✅ موقع محفوظ: ${_officeLocLat.toFixed(5)}, ${_officeLocLng.toFixed(5)} — ${displayName}`;
};
window.hideOfficeFromMap = async () => {
  if (!confirm('إخفاء مكتبك من الخريطة العامة؟')) return;
  await update(ref(_db, `publicOffices/${TENANT_ID}`), { visible:false }).catch(() => {});
  toast('ok','تم الإخفاء','مكتبك لن يظهر للمستخدمين');
};

/* ══════════════════════════════════════════════════
   MONITORING SCREEN
   ══════════════════════════════════════════════════ */
window.openMonitor  = () => { $('MonitorScreen').classList.add('on'); refreshMonitor(); if (monitorInterval) clearInterval(monitorInterval); monitorInterval = setInterval(refreshMonitor, 30000); };
window.closeMonitor = () => { $('MonitorScreen').classList.remove('on'); if (monitorInterval) { clearInterval(monitorInterval); monitorInterval = null; } };

const refreshMonitor = () => {
  const grid = $('monGrid'); if (!grid) return;
  const all  = Object.entries(allDrvs);
  const cnts = { online:0, busy:0, brk:0, offline:0, total:0 };
  all.forEach(([,d]) => {
    const cs = getTCS(d);
    if (cs.monCls==='st-online')  cnts.online++;
    else if (cs.monCls==='st-busy')  cnts.busy++;
    else if (cs.monCls==='st-break') cnts.brk++;
    else cnts.offline++;
    cnts.total += (d.totalDeliveries||0);
  });
  const upd = (id, v) => { const e = $(id); if (e) e.textContent = v; };
  upd('mon-online', cnts.online); upd('mon-busy', cnts.busy);
  upd('mon-break',  cnts.brk);   upd('mon-offline', cnts.offline);
  upd('mon-total-del', cnts.total);
  if (!all.length) { grid.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text4);grid-column:1/-1">لا يوجد سائقون</div>`; return; }
  grid.innerHTML = all.map(([id,d]) => {
    const cs = getTCS(d), age = d.locUpdated ? Date.now()-d.locUpdated : 999999;
    return `<div class="monitor-taxi-card ${cs.monCls}">
      <div style="width:50px;height:50px;border-radius:14px;background:var(--bg2);border:2px solid ${cs.border};display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0">🚕</div>
      <div class="monitor-taxi-info">
        <div class="monitor-taxi-name">${esc(d.name)}</div>
        <div class="monitor-taxi-status"><span class="monitor-status-dot ${cs.dotCls}"></span><span style="color:${cs.dot};font-weight:800">${cs.label}</span></div>
        ${d.phone?`<div style="font-size:11px;color:var(--text4)">${d.phone}</div>`:''}
        <div style="margin-top:6px;display:flex;gap:5px;flex-wrap:wrap">
          <span class="monitor-taxi-badge ${cs.badgeCls}"><i class="fas fa-box" style="font-size:9px"></i> ${d.totalDeliveries||0}</span>
          ${d.shiftStart&&cs.monCls!=='st-offline'?`<span class="monitor-taxi-badge" style="background:var(--primary-l);color:var(--primary);border:1px solid var(--primary-m)">⏱ ${fmtElapsed(Date.now()-d.shiftStart)}</span>`:''}
        </div>
      </div>
    </div>`;
  }).join('');
};
onDriversUpdate(() => { if ($('MonitorScreen').classList.contains('on')) refreshMonitor(); });

/* ══════════════════════════════════════════════════
   PUBLIC USER MAP
   ══════════════════════════════════════════════════ */
window.openPubPage = () => {
  $('PL').style.display  = 'none';
  $('PTenantGate').style.display = 'none';
  const pu = $('PU');
  pu.style.display       = 'flex';
  pu.style.flexDirection = 'column';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const mapEl = $('publicMap'); if (!mapEl) return;
    if (!_pubMap) {
      try {
        _pubMap = L.map('publicMap', { zoomControl:true }).setView([32.31,35.03], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution:'© OpenStreetMap', maxZoom:19 }).addTo(_pubMap);
      } catch(e) { console.warn('map init error', e); return; }
    } else { setTimeout(() => { try { _pubMap.invalidateSize(); } catch(e) {} }, 300); }
    loadPublicOffices();
  }));
};

window.closePubPage = () => {
  $('PU').style.display          = 'none';
  $('PL').style.display          = 'none';
  $('PTenantGate').style.display = 'block';
};

const loadPublicOffices = async () => {
  if (!_pubMap) return;
  const layersToRemove = [];
  _pubMap.eachLayer(l => { if (l instanceof L.Marker) layersToRemove.push(l); });
  layersToRemove.forEach(l => _pubMap.removeLayer(l));
  try {
    const snap = await get(ref(_db, 'publicOffices')).catch(() => null);
    if (!snap || !snap.exists()) {
      L.popup().setLatLng([32.31,35.03]).setContent('<div style="font-family:Cairo,sans-serif;text-align:center;padding:12px;direction:rtl"><div style="font-size:16px;margin-bottom:6px">🚕</div><b>لا يوجد مكاتب مسجلة بعد</b><br><span style="font-size:11px;color:#666">المكاتب ستظهر هنا عند تسجيلها</span></div>').openOn(_pubMap);
      return;
    }
    const offices = Object.entries(snap.val()).filter(([,o]) => o.lat && o.lng && o.visible);
    if (!offices.length) {
      L.popup().setLatLng([32.31,35.03]).setContent('<div style="font-family:Cairo,sans-serif;text-align:center;padding:12px;direction:rtl"><b>لا يوجد مكاتب نشطة حالياً</b></div>').openOn(_pubMap);
      return;
    }
    for (const [tenantId, office] of offices) await addOfficeMarkerToMap(tenantId, office);
    if (offices.length > 0) {
      const bounds = L.latLngBounds(offices.map(([,o]) => [o.lat, o.lng]));
      _pubMap.fitBounds(bounds, { padding:[40,40], maxZoom:15 });
    }
  } catch(e) { console.warn('loadPublicOffices error', e); }
};

const addOfficeMarkerToMap = async (tenantId, office) => {
  if (!_pubMap) return;
  let avgStars = 0, ratingCount = 0;
  try {
    const rSnap = await get(ref(_db, `tenants/${tenantId}/ratings`)).catch(() => null);
    if (rSnap && rSnap.exists()) {
      const rArr = Object.values(rSnap.val());
      ratingCount = rArr.length;
      avgStars    = rArr.reduce((s,r) => s+(r.stars||0), 0) / ratingCount;
    }
  } catch(e) {}
  const ratingBadge = ratingCount > 0 ? `<div class="office-rating-badge">⭐ ${avgStars.toFixed(1)} <span style="opacity:.7">(${ratingCount})</span></div>` : '';
  const icon = L.divIcon({ html:`<div class="office-marker-wrap"><div class="office-marker">🚕</div><div class="office-marker-name">${office.displayName||'مكتب تاكسي'}</div>${ratingBadge}</div>`, className:'', iconSize:[70,75], iconAnchor:[35,68] });
  const dn = esc(office.displayName||'مكتب تاكسي'), dc = esc(office.desc||'');
  const starsHtml = ratingCount > 0
    ? `<div style="text-align:center;margin:8px 0;font-size:13px;color:#D97706;font-weight:700">⭐ ${avgStars.toFixed(1)} / 5 <span style="font-size:10px;color:#64748B;font-weight:400">(${ratingCount} تقييم)</span></div>`
    : '<div style="text-align:center;font-size:11px;color:#94A3B8;margin:6px 0">لا يوجد تقييمات بعد</div>';
  const popup = `<div class="pub-office-popup"><h3>🚕 ${dn}</h3>${dc?`<p class="office-desc">${dc}</p>`:''}${starsHtml}<button class="pub-req-btn" onclick="openUserReqModal('${tenantId}','${dn}','${dc}')"><i class="fas fa-taxi"></i> اطلب تكسي من هذا المكتب</button></div>`;
  L.marker([office.lat, office.lng], { icon }).addTo(_pubMap).bindPopup(popup, { maxWidth:260, minWidth:200 });
};

/* ── User Request Modal ── */
window.openUserReqModal = (tenantId, name, desc) => {
  window._pendingTenant = tenantId;
  window._pendingName   = name;
  window._pendingDesc   = desc;
  var last = parseInt(localStorage.getItem('txLastReq')||'0', 10);
  if (last && Date.now() - last < 5*60*1000) {
    window.showRateLimitAlert(Math.ceil((5*60*1000-(Date.now()-last))/1000));
    return;
  }
  var saved = localStorage.getItem('txUserPhone') || '';
  if (saved.startsWith('1|')) window._userVerifiedPhone = saved.slice(2);
  if (!window._userVerifiedPhone) {
    document.getElementById('UserVerifyScreen').classList.add('on');
    window.showVStep && window.showVStep(1);
  } else {
    window._gpsOk = false; window._userGpsLat = null; window._userGpsLng = null;
    document.getElementById('UserVerifyScreen').classList.add('on');
    window.showVStep && window.showVStep(3);
  }
};

window.submitUserReq = async () => {
  // ← فحص Rate Limit
  const lastReq = parseInt(localStorage.getItem('txLastReq')||'0',10);
  if(lastReq && Date.now()-lastReq < 5*60*1000){
    const rem = Math.ceil((5*60*1000-(Date.now()-lastReq))/1000);
    if(typeof window.showRateLimitAlert==='function') window.showRateLimitAlert(rem);
    return;
  }
  // ← فحص GPS
  if(!window._gpsOk){ toast('err','📍 الموقع مطلوب','يجب تفعيل GPS لإرسال الطلب'); return; }
  const phone    = (window._userVerifiedPhone || ($('ur-phone').value || '')).trim();
  const from     = ($('ur-from').value  || '').trim();
  const to       = ($('ur-to').value    || '').trim();
  const tenantId =  $('ur-office-tenant').value;
  if (!phone || !from || !to) return shAl('al-userreq','err','يرجى ملء جميع الحقول');
  if (!/^[0-9+]{7,15}$/.test(phone.replace(/\s/g,''))) return shAl('al-userreq','err','رقم الهاتف غير صحيح');
  const btn = $('MuserReq').querySelector('.bp'), orig = btn.innerHTML;
  btn.innerHTML = '<span class="spin"></span> جار الإرسال...'; btn.disabled = true;
  try {
    const details = `من: ${from} ← إلى: ${to}`;
    const reqRef  = await push(ref(_db, `tenants/${tenantId}/recvRequests`), {
      phone, details, ts:Date.now(), addedBy:'مستخدم عام 🌐', fromUser:true,
      userFrom:from, userTo:to, userReqRef:null,
      ...(window._gpsOk && window._userGpsLat ? { userLat:window._userGpsLat, userLng:window._userGpsLng, hasGps:true } : { hasGps:false }),
    });
    const userReqRefPath = `tenants/${tenantId}/recvRequests/${reqRef.key}`;
    await update(reqRef, { userReqRef: userReqRefPath });
    _userReqId = reqRef.key; _userReqTenantId = tenantId;
    CM('MuserReq');
    localStorage.setItem('txLastReq', String(Date.now()));
    openTrackScreen(phone, details, $('userReqOfficeName').textContent);
    listenUserReqStatus(tenantId, reqRef.key);
  } catch(err) { shAl('al-userreq','err','خطأ: '+(err.message||'')); }
  btn.innerHTML = orig; btn.disabled = false;
};

/* ── Tracking Screen ── */
const openTrackScreen = (phone, details, officeName) => {
  $('trackPhone').textContent   = phone;
  $('trackDetails').textContent = details;
  $('trackOfficeLabel').textContent = officeName;
  [0,1,2,3].forEach(i => {
    const ic = $(`ts-icon-${i}`); if (ic) ic.className = 'track-step-icon';
    const ln = $(`ts-line-${i}`); if (ln) ln.className = 'track-step-line';
  });
  setTrackStep(0); updateTrackBanner('waiting');
  $('trackArrivedSection').style.display = 'none';
  $('trackRatingSection').style.display  = 'none';
  $('trackCancelBtn').style.display      = 'inline-flex';
  _lastTrackStatus = '';
  $('UserTrackScreen').classList.add('on');
};
const setTrackStep = step => {
  [0,1,2,3].forEach(i => {
    const ic = $(`ts-icon-${i}`); if (!ic) return;
    ic.className = 'track-step-icon' + (i<step?' done':i===step?' active':'');
    const ln = $(`ts-line-${i}`); if (ln) ln.className = 'track-step-line' + (i<=step?' done':'');
  });
};
const updateTrackBanner = status => {
  const banner = $('trackStatusBanner'); if (!banner) return;
  const cfg = {
    waiting:     { cls:'tsb-waiting',  msg:'⏳ في انتظار قبول الطلب...' },
    accepted:    { cls:'tsb-accepted', msg:'✅ تم قبول طلبك! التاكسي في الطريق إليك 🚕' },
    waiting2:    { cls:'tsb-accepted', msg:'🕐 التاكسي بالانتظار قريباً منك' },
    near:        { cls:'tsb-near',     msg:'⚠️ التاكسي اقترب منك! ترقّب الآن' },
    done:        { cls:'tsb-done',     msg:'🎉 وصل التاكسي! شكراً لاستخدامك خدمتنا' },
    cancelled:   { cls:'tsb-cancelled',msg:'🚫 تم إلغاء الطلب' },
    no_response: { cls:'tsb-cancelled',msg:'⏰ لم يستجب السائق — جاري البحث عن بديل' },
    rejected:    { cls:'tsb-cancelled',msg:'❌ السائق رفض الطلب — جاري البحث عن بديل' },
  }[status] || { cls:'tsb-waiting', msg:'⏳ جاري المعالجة...' };
  banner.className   = `track-status-banner ${cfg.cls}`;
  banner.textContent = cfg.msg;
};

const listenUserReqStatus = (tenantId, reqId) => {
  if (_pubReqListener) { try { off(ref(_db, `tenants/${_userReqTenantId}/recvRequests/${_userReqId}`)); } catch(e) {} _pubReqListener = null; }
  const r = ref(_db, `tenants/${tenantId}/recvRequests/${reqId}`);
  _pubReqListener = onValue(r, snap => { if (!snap || !snap.exists()) return; updateTrackUI(snap.val()); });
};

const updateTrackUI = req => {
  const ds = req.driverStatus || req.status || 'pending';
  if (ds === _lastTrackStatus) return;
  const stepMap = { pending:0, accepted:1, waiting:1, near:2, done:3, cancelled:0, no_response:0, rejected:0 };
  setTrackStep(stepMap[ds] ?? 0);
  const bannerMap = { pending:'waiting', accepted:'accepted', waiting:'waiting2', near:'near', done:'done', cancelled:'cancelled', no_response:'no_response', rejected:'rejected' };
  updateTrackBanner(bannerMap[ds] || 'waiting');
  $('trackArrivedSection').style.display = (ds==='near'||ds==='accepted') ? 'block' : 'none';
  $('trackCancelBtn').style.display      = (ds==='done'||ds==='cancelled')? 'none'  : 'inline-flex';
  if (_lastTrackStatus !== ds) {
    if      (ds==='accepted')    { playSound('accept');  vibrate([200,100,200]);     showPushNotif('✅ تم قبول طلبك!','التاكسي في الطريق إليك 🚕','info'); }
    else if (ds==='waiting')     { playSound('notif');   vibrate([200]);             showPushNotif('🕐 التاكسي بالانتظار قريباً','ترقّب وصوله','info'); }
    else if (ds==='near')        { playSound('notif');   vibrate([300,100,300]);     showPushNotif('⚠️ التاكسي اقترب منك!','اضغط «وصل» عند وصوله','info'); }
    else if (ds==='done')        { playSound('shift');   vibrate([200,100,200,100,200]); }
    else if (ds==='cancelled'||ds==='rejected') { playSound('cancel'); vibrate([400]); }
  }
  _lastTrackStatus = ds;
  if (ds==='cancelled'||ds==='rejected') {
    setTimeout(() => { if ($('UserTrackScreen').classList.contains('on')) { $('UserTrackScreen').classList.remove('on'); $('PTenantGate').style.display='block'; } }, 4000);
  }
  if (ds==='done' && $('trackRatingSection').style.display==='none') $('trackArrivedSection').style.display = 'block';
};

window.userCancelReq = async () => {
  if (!_userReqId || !_userReqTenantId) return;
  if (!confirm('هل تريد إلغاء الطلب؟')) return;
  try {
    await update(ref(_db, `tenants/${_userReqTenantId}/recvRequests/${_userReqId}`), { status:'cancelled', cancelledAt:Date.now(), cancelledBy:'user' });
    await push(ref(_db,  `tenants/${_userReqTenantId}/notifications`), { type:'cancel', msg:`🚫 مستخدم ألغى الطلب: ${$('trackPhone').textContent}`, ts:Date.now(), read:false });
    $('UserTrackScreen').classList.remove('on'); toast('info','تم إلغاء الطلب','');
    if (_pubReqListener) { try { off(ref(_db, `tenants/${_userReqTenantId}/recvRequests/${_userReqId}`)); } catch(e) {} _pubReqListener = null; }
    _userReqId = null; _userReqTenantId = null;
  } catch(err) { toast('err','خطأ',err.message||''); }
};

window.confirmTaxiArrived = async () => {
  setTrackStep(3); updateTrackBanner('done');
  $('trackArrivedSection').style.display = 'none';
  $('trackRatingSection').style.display  = 'block';
  $('trackCancelBtn').style.display      = 'none';
  playSound('shift');
  if (!_userReqId || !_userReqTenantId) return;
  await update(ref(_db, `tenants/${_userReqTenantId}/recvRequests/${_userReqId}`), { userConfirmedArrival:true, arrivedAt:Date.now(), driverStatus:'done' }).catch(() => {});
  try {
    const drvReqsSnap = await get(ref(_db, `tenants/${_userReqTenantId}/driverRequests`)).catch(() => null);
    if (drvReqsSnap && drvReqsSnap.exists()) {
      for (const [drvId, reqs] of Object.entries(drvReqsSnap.val())) {
        if (!reqs) continue;
        for (const [rid, req] of Object.entries(reqs)) {
          if (req.userReqRef===`tenants/${_userReqTenantId}/recvRequests/${_userReqId}` && (req.status==='accepted'||req.status==='waiting'||req.status==='near') && !req.doneDelivery) {
            const drvSnap  = await get(ref(_db, `tenants/${_userReqTenantId}/drivers/${drvId}`)).catch(() => null);
            const drvData  = drvSnap && drvSnap.exists() ? drvSnap.val() : { totalDeliveries:0 };
            const newCount = (drvData.totalDeliveries||0) + 1;
            await update(ref(_db, `tenants/${_userReqTenantId}/drivers/${drvId}`),                  { taxiColor:'green', status:'online', totalDeliveries:newCount }).catch(() => {});
            await update(ref(_db, `tenants/${_userReqTenantId}/driverRequests/${drvId}/${rid}`),    { status:'done', doneAt:Date.now(), doneDelivery:true, doneByUser:true }).catch(() => {});
            const today = new Date().toISOString().split('T')[0];
            const lRef  = ref(_db, `tenants/${_userReqTenantId}/drivers/${drvId}/dailyReport/${today}`);
            const lSnap = await get(lRef).catch(() => null);
            const prev  = lSnap && lSnap.exists() ? lSnap.val() : { deliveries:0 };
            await set(lRef, { ...prev, deliveries:(prev.deliveries||0)+1, lastUpdate:Date.now() }).catch(() => {});
            await push(ref(_db, `tenants/${_userReqTenantId}/notifications`), { type:'done', driverId:drvId, driverName:drvData.name||drvId, msg:`📦 تأكد المستخدم وصول التكسي — ${drvData.name||drvId} — إجمالي: ${newCount}`, ts:Date.now(), read:false }).catch(() => {});
            break;
          }
        }
      }
    }
  } catch(e) { console.warn('auto-done error', e); }
};

window.setRating = n => {
  _userRating = n;
  document.querySelectorAll('.rating-star').forEach((s, i) => s.classList.toggle('on', i < n));
  const labels = ['','سيء جداً 😞','سيء 😐','مقبول 🙂','جيد 😊','ممتاز 🌟'];
  const lb = $('ratingLabel'); if (lb) lb.textContent = labels[n] || '';
};

window.submitRating = async () => {
  if (_userRating === 0) return toast('warn','يرجى اختيار تقييم','');
  const comment = ($('ratingComment').value||'').trim();
  if (_userReqTenantId) {
    await push(ref(_db, `tenants/${_userReqTenantId}/ratings`), { stars:_userRating, comment, reqId:_userReqId, phone:$('trackPhone').textContent, ts:Date.now() }).catch(() => {});
    await push(ref(_db, `tenants/${_userReqTenantId}/notifications`), { type:'rating', msg:`⭐ تقييم جديد: ${'⭐'.repeat(_userRating)} — ${comment||'بدون تعليق'}`, ts:Date.now(), read:false }).catch(() => {});
  }
  toast('ok','✅ شكراً على تقييمك!','');
  closeTrackScreen();
  if (_pubMap) setTimeout(() => loadPublicOffices(), 1000);
};

window.closeTrackScreen = () => {
  $('UserTrackScreen').classList.remove('on');
  _lastTrackStatus = ''; _userReqId = null; _userReqTenantId = null; _userRating = 0;
  if (_pubReqListener) { try { off(_pubReqListener); } catch(e) {} _pubReqListener = null; }
  if ($('PU').style.display === 'flex') { /* الخريطة مفتوحة */ }
  else { $('PL').style.display = 'none'; $('PTenantGate').style.display = 'block'; }
};


/* ══════════════════════════════════════════════════
   RECEIVER DASHBOARD
   ══════════════════════════════════════════════════ */
let recvAllDrvs = {};

const initRecvDash = () => {
  $('PL').style.display = 'none'; $('PR').style.display = 'block';
  const recvCfg = [
    { id:'requests', icon:'fas fa-inbox',           label:'الطلبات', badge:true },
    { id:'map',      icon:'fas fa-map-location-dot', label:'الخريطة' },
    { id:'add',      icon:'fas fa-plus-circle',      label:'إضافة طلب' },
    { id:'history',  icon:'fas fa-history',          label:'السجل' },
  ];
  $('recv-ntabs').innerHTML = recvCfg.map((t,i) =>
    `<button class="ntab${i===0?' sup-on':''}" id="rnt-${t.id}" onclick="recvTab('${t.id}')">
      <i class="${t.icon}"></i> ${t.label}
      ${t.badge ? `<span class="ntab-badge" id="recv-req-badge" style="display:none">0</span>` : ''}
    </button>`
  ).join('');
  const mobNav = $('mobileNav'), mobTabs = $('mobTabs');
  if (mobNav && mobTabs) {
    mobNav.style.display = 'block';
    mobTabs.innerHTML = recvCfg.map((t,i) =>
      `<button class="mob-tab${i===0?' sup-on':''}" id="rmnt-${t.id}" onclick="recvTab('${t.id}')">
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
  onValue(r, snap => { recvAllDrvs = {}; if (snap.exists()) Object.entries(snap.val()).forEach(([id,d]) => { const {avatar,...dn} = d; recvAllDrvs[id] = dn; }); });
  LSNRS.push({ r });
};

const listenRecvNewReqs = () => {
  let lastCount = null;
  const r = tRef('recvRequests');
  onValue(r, snap => {
    const count = snap.exists() ? Object.keys(snap.val()).length : 0;
    if (lastCount !== null && count > lastCount) { playSound('notif'); vibrate([200,100,200]); toast('info','📥 طلب جديد وارد!',''); }
    lastCount = count;
    ['recv-req-badge','mob-recv-badge'].forEach(bid => { const b = $(bid); if (b) { b.textContent = count>0?count:''; b.style.display = count>0?'inline':'none'; } });
  }); LSNRS.push({ r });
};

window.recvTab = t => {
  document.querySelectorAll('#recv-ntabs .ntab').forEach(b => b.classList.remove('on','sup-on'));
  const el = $('rnt-'+t); if (el) el.classList.add('sup-on');
  document.querySelectorAll('#mobTabs .mob-tab').forEach(b => b.classList.remove('on','sup-on'));
  const mel = $('rmnt-'+t); if (mel) mel.classList.add('sup-on');
  clrListeners(false);
  if (window._recvMap) { try { window._recvMap.remove(); } catch(e) {} window._recvMap = null; }
  const body = $('recv-dbody');
  if      (t==='requests') renderRecvRequests(body);
  else if (t==='map')      renderRecvMap(body);
  else if (t==='add')      renderRecvAdd(body);
  else                     renderRecvHistory(body);
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
    const items = Object.entries(snap.val()).sort((a,b) => (b[1].ts||0)-(a[1].ts||0));
    list.innerHTML = items.map(([id,d]) => {
      const userBadge = d.fromUser ? `<span style="background:#ECFDF5;color:#059669;font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;border:1px solid #A7F3D0;margin-right:4px">🌐 مستخدم</span>` : '';
      return `<div class="recv-req-card">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px">
          <div style="font-size:15px;font-weight:900;color:var(--text);display:flex;align-items:center;gap:6px"><i class="fas fa-phone" style="color:var(--primary);font-size:12px"></i>${esc(d.phone||'-')}${userBadge}</div>
          <span style="font-size:10px;color:var(--text4)">${fmt(d.ts||Date.now())}</span>
        </div>
        <div style="font-size:12px;color:var(--text2);margin-bottom:10px;display:flex;align-items:flex-start;gap:6px"><i class="fas fa-map-marker-alt" style="color:var(--amber);margin-top:3px;flex-shrink:0"></i>${esc(d.details||'-')}</div>
        ${d.addedBy?`<div style="font-size:10px;color:var(--text4);margin-bottom:8px"><i class="fas fa-user" style="margin-left:3px"></i>${esc(d.addedBy)}</div>`:''}
        <div style="display:flex;gap:7px;flex-wrap:wrap">
          <button class="rca rca-primary" onclick="recvSendReqToTaxi('${id}','${eAt(d.phone||'')}','${eAt(d.details||'')}')"><i class="fas fa-car-side"></i> إرسال لسائق</button>
          <button class="rca rca-amber"   onclick="recvEditReq('${id}','${eAt(d.phone||'')}','${eAt(d.details||'')}')"><i class="fas fa-pen"></i></button>
          <button class="rca rca-red"     onclick="recvDelReq('${id}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>`;
    }).join('');
  }); LSNRS.push({ r });
};

window.recvSendReqToTaxi = (reqId, phone, details) => {
  selTaxiId = null; selReqData = { id:reqId, phone:phone.replace(/&#39;/g,"'"), details:details.replace(/&#39;/g,"'"), recvReqId:reqId };
  const list  = $('sel-taxi-list');
  const avail = Object.entries(recvAllDrvs).sort(([,a],[,b]) => { const ao=getTCS(a).monCls==='st-online'?0:1, bo=getTCS(b).monCls==='st-online'?0:1; return ao-bo; });
  if (!avail.length) { list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3)">لا يوجد سائقون</div>'; $('SelTaxiModal').classList.add('on'); return; }
  list.innerHTML = avail.map(([id,d]) => {
    const cs = getTCS(d);
    return `<div class="sel-taxi-item" id="stitem-${id}" onclick="selectTaxi('${id}')">
      <div style="width:40px;height:40px;border-radius:11px;border:2px solid ${cs.border};background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🚕</div>
      <div style="flex:1"><div style="font-weight:800;font-size:13px;color:var(--text)">${esc(d.name)}</div><div style="font-size:11px;color:${cs.dot}">${cs.label}</div>${d.carNumber?`<div style="font-size:10px;color:var(--text4)">🚗 ${esc(d.carNumber)}</div>`:''}</div>
      <i class="fas fa-check-circle" id="stchk-${id}" style="display:none;color:var(--primary);font-size:18px"></i>
    </div>`;
  }).join('');
  $('SelTaxiModal').classList.add('on'); $('confirmSelBtn').disabled=true; $('confirmSelBtn').style.opacity='.5';
};
window.recvDelReq  = async id => { if (!confirm('حذف هذا الطلب؟')) return; await remove(tRef(`recvRequests/${id}`)); toast('ok','تم الحذف',''); };
window.recvEditReq = (id, phone, details) => {
  const np = prompt('رقم الهاتف الجديد:', phone.replace(/&#39;/g,"'")); if (!np) return;
  const nd = prompt('التفاصيل الجديدة:', details.replace(/&#39;/g,"'")); if (!nd) return;
  update(tRef(`recvRequests/${id}`), { phone:np, details:nd, editedAt:Date.now() }).then(() => toast('ok','تم التعديل',''));
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
      window._recvMap     = L.map('recvMap', { zoomControl:true }).setView([32.31,35.03], 12);
      window._recvMarkers = {};
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution:'© OpenStreetMap', maxZoom:19 }).addTo(window._recvMap);
      const refresh = () => {
        if (!window._recvMap) return;
        const ent = Object.entries(recvAllDrvs);
        const upd = (id, v) => { const e = $(id); if (e) e.textContent = v; };
        upd('rmT', ent.length);
        upd('rmG', ent.filter(([,d]) => getTCS(d).monCls==='st-online').length);
        upd('rmR', ent.filter(([,d]) => getTCS(d).monCls==='st-busy').length);
        ent.forEach(([id,d]) => {
          if (!d.lat || !d.lng) return;
          const cs = getTCS(d);
          const ic = L.divIcon({ html:`<div class="drv-marker-wrap"><div class="drv-marker" style="border-color:${cs.border}">🚕</div><div class="drv-marker-name">${d.name}</div></div>`, className:'', iconSize:[50,50], iconAnchor:[25,50] });
          if (window._recvMarkers[id]) { window._recvMarkers[id].setLatLng([d.lat,d.lng]); window._recvMarkers[id].setIcon(ic); }
          else { window._recvMarkers[id] = L.marker([d.lat,d.lng],{icon:ic}).addTo(window._recvMap).bindPopup(`<div style="font-family:Cairo,sans-serif;text-align:center"><b>${d.name}</b><br><span style="color:${cs.dot}">${cs.label}</span><br><button onclick="recvSendToDriver('${id}','${(d.name||'').replace(/'/g,'')}')"><i class='fas fa-paper-plane'></i> إرسال طلب</button></div>`); }
        });
      };
      refresh();
      const r = tRef('drivers');
      onValue(r, snap => { if (!window._recvMap) return; recvAllDrvs={}; if(snap.exists()) Object.entries(snap.val()).forEach(([id,d])=>{const{avatar,...dn}=d;recvAllDrvs[id]=dn;}); refresh(); });
      LSNRS.push({ r });
    } catch(e) {}
  }));
};
window.recvSendToDriver = async (drvId, drvName) => {
  const phone   = prompt('📞 رقم هاتف الزبون:','');   if (!phone?.trim())   return;
  const details = prompt('📍 التفاصيل والموقع:',''); if (!details?.trim()) return;
  try {
    const ts = Date.now();
    await push(tRef('recvRequests'), { phone:phone.trim(), details:details.trim(), ts, addedBy:CU?CU.name:'المستقبل', assignedTo:drvId });
    await push(tRef(`driverRequests/${drvId}`), { phone:phone.trim(), details:details.trim(), status:'pending', ts, sentBy:CU?CU.name:'المستقبل', sentAt:ts });
    await push(tRef(`driverPushNotifs/${drvId}`), { title:'📦 طلب جديد', body:`📞 ${phone.trim()}\n📍 ${details.trim()}`, type:'new_request', ts, read:false });
    toast('ok', `✅ تم الإرسال لـ ${drvName}`, ''); playSound('notif');
    if (window._recvMap) window._recvMap.closePopup();
  } catch(err) { toast('err','خطأ',err.message||''); }
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
  const phone   = ($('recv-phone').value   || '').trim();
  const details = ($('recv-details').value || '').trim();
  if (!phone || !details) return shAl('al-recv-add','err','يرجى ملء جميع الحقول');
  await push(tRef('recvRequests'), { phone, details, ts:Date.now(), addedBy:CU?CU.name:'المستقبل' });
  $('recv-phone').value = ''; $('recv-details').value = '';
  shAl('al-recv-add','ok','✅ تم إضافة الطلب'); playSound('notif');
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
  const icMap  = { accept:'ni-green',reject:'ni-red',timeout:'ni-red',done:'ni-green',waiting:'ni-amber',near:'ni-amber',sos:'ni-red',info:'ni-blue',cancel:'ni-red',edit:'ni-amber',rating:'ni-green',user_request:'ni-green' };
  const icoMap = { accept:'check',reject:'times',timeout:'clock',done:'flag-checkered',waiting:'hourglass-half',near:'map-pin',sos:'triangle-exclamation',info:'info',cancel:'ban',edit:'pen',rating:'star',user_request:'globe' };
  const r = tRef('notifications');
  onValue(r, snap => {
    const list = $('RECV_HIST'); if (!list) return;
    if (!snap.exists()) { list.innerHTML = `<div style="text-align:center;padding:32px;color:var(--text4)">لا يوجد سجل</div>`; return; }
    const items = Object.entries(snap.val()).sort((a,b) => (b[1].ts||0)-(a[1].ts||0)).slice(0,50);
    list.innerHTML = items.map(([nid,n]) => `<div class="notif-item">
      <div class="notif-ic ${icMap[n.type]||'ni-blue'}"><i class="fas fa-${icoMap[n.type]||'bell'}"></i></div>
      <div class="notif-body"><div class="notif-title">${esc(n.msg||'')}</div><div class="notif-time">${fmt(n.ts||Date.now())}</div></div>
      <button class="notif-del-btn" onclick="delNotif('${nid}')"><i class="fas fa-times"></i></button>
    </div>`).join('');
  }); LSNRS.push({ r });
};

/* ══════════════════════════════════════════════════
   LOGOUT
   ══════════════════════════════════════════════════ */
window.logout = async () => {
  stopGPS();
  if (reqCountdownTimer) { clearInterval(reqCountdownTimer); reqCountdownTimer = null; }
  if (monitorInterval)   { clearInterval(monitorInterval);   monitorInterval   = null; }
  stopDriverListener();
  $('ReqNotif').classList.remove('on');
  $('SosBroadcastNotif').classList.remove('on');
  $('MonitorScreen').classList.remove('on');
  if (CR === 'driver' && CU) await update(tRef(`drivers/${CU.id}`), { status:'offline', lastSeen:Date.now() }).catch(() => {});
  /* تسجيل خروج من Firebase Auth */
  await signOut(_auth).catch(() => {});
  clrListeners(false);
  CU = null; CR = null; shiftStartTime = null; allDrvs = {}; IS_RECV = false;
  TENANT_ID = ''; TENANT_INFO = null;
  $('PD').style.display = 'none'; $('PR').style.display = 'none'; $('PL').style.display = 'none';
  $('PTenantGate').style.display = 'block';
  $('ntabs').innerHTML = '';
  const navav = $('navav'); if (navav) { navav.textContent = '🚕'; navav.classList.remove('sup-av'); }
  const monBtn = $('monitorBtn'); if (monBtn) monBtn.remove();
  const mn = $('mobileNav'); if (mn) mn.style.display = 'none';
  const mb = $('mobTabs');   if (mb) mb.innerHTML = '';
};

window.logoutRecv = async () => {
  clrListeners(false);
  await signOut(_auth).catch(() => {});
  CU = null; CR = null; IS_RECV = false; recvAllDrvs = {};
  TENANT_ID = ''; TENANT_INFO = null;
  if (window._recvMap) { try { window._recvMap.remove(); } catch(e) {} window._recvMap = null; }
  $('PR').style.display  = 'none'; $('PL').style.display = 'none';
  $('PTenantGate').style.display = 'block';
  $('recv-ntabs').innerHTML = '';
  const mn = $('mobileNav'); if (mn) mn.style.display = 'none';
  const mb = $('mobTabs');   if (mb) mb.innerHTML = '';
};
