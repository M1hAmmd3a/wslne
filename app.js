
/* ══════════════════════════════════════════════════
   منصة التاكسي — طولكرم | app.js
   Firebase Auth فقط + Backend API: https://wslne.onrender.com
   ══════════════════════════════════════════════════ */

import { initializeApp }     from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut }
                              from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

/* ══════════════════════════════════════════════════
   CONFIG
   ══════════════════════════════════════════════════ */
const API = 'https://wslne.onrender.com';

const firebaseConfig = {
  apiKey:            "AIzaSyBefjpLw7ju5z7Pc7UZFGpOPJcKCHGD9f4",
  authDomain:        "hamode-a2ac1.firebaseapp.com",
  projectId:         "hamode-a2ac1",
  storageBucket:     "hamode-a2ac1.firebasestorage.app",
  messagingSenderId: "1005224583727",
  appId:             "1:1005224583727:web:ea0befa1db595ab48adcda"
};

const _app  = initializeApp(firebaseConfig, "main");
const _auth = getAuth(_app);

/* Session token من Backend (يُخزَّن في memory فقط) */
let _sessionToken = null;
let _wsConnection = null;          /* WebSocket للإشعارات الفورية */

/* ══════════════════════════════════════════════════
   API HELPER
   ══════════════════════════════════════════════════ */
const apiFetch = async (path, options = {}) => {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (_sessionToken) headers['Authorization'] = `Bearer ${_sessionToken}`;

  const res = await fetch(API + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data   = data;
    throw err;
  }
  return data;
};

/* ══════════════════════════════════════════════════
   TENANT MAP (Frontend فقط للعرض — المنطق في Backend)
   ══════════════════════════════════════════════════ */
const TENANT_NAMES = {
  tk1:'مكتب طولكرم 1', tk2:'مكتب طولكرم 2', tk3:'مكتب طولكرم 3',
  tk4:'مكتب طولكرم 4', tk5:'مكتب طولكرم 5', tk6:'مكتب طولكرم 6',
  tk7:'مكتب طولكرم 7', tk8:'مكتب طولكرم 8', tk9:'مكتب طولكرم 9',
  tk10:'مكتب طولكرم 10', tk11:'مكتب طولكرم 11', tk12:'مكتب طولكرم 12',
  tk13:'مكتب طولكرم 13', tk14:'مكتب طولكرم 14', tk15:'مكتب طولكرم 15',
  tk16:'مكتب طولكرم 16', tk17:'مكتب طولكرم 17', tk18:'مكتب طولكرم 18',
  tk19:'مكتب طولكرم 19', tk20:'مكتب طولكرم 20', tk21:'مكتب طولكرم 21',
  tk22:'مكتب طولكرم 22', tk23:'مكتب طولكرم 23', tk24:'مكتب طولكرم 24',
  tk25:'مكتب طولكرم 25',
};

/* ══════════════════════════════════════════════════
   STATE
   ══════════════════════════════════════════════════ */
let CU = null, CR = null, IS_RECV = false;
let TENANT_ID = '', TENANT_INFO = null;
let reqCountdownTimer = null, selTaxiId = null, selReqData = null;
let shiftStartTime = null, monitorInterval = null;
let leafletMap = null, mapMarkers = {};
let allDrvs = {};
const _drvCBs = new Set();
let _pollTimer = null;   /* polling timer بدل Firebase listeners */

/* Public Map */
let _pubMap = null;
let _userReqId = null, _userReqTenantId = null, _userRating = 0;
let _pubReqPollTimer = null;
let _officeLocMap = null, _officeLocMarker = null;
let _officeLocLat = null, _officeLocLng = null;
let _lastTrackStatus = '';

window.addEventListener('online',  () => toast('ok',  '🌐 عاد الاتصال', ''));
window.addEventListener('offline', () => toast('err', '🔌 انقطع الاتصال', ''));

/* ══════════════════════════════════════════════════
   GPS
   ══════════════════════════════════════════════════ */
const GPS_INTERVAL = 90000;
const GPS_MIN_DIST = 20;
let _gpsWatcher   = null;
let _gpsLastSent  = 0;
let _gpsLastLat   = null;
let _gpsLastLng   = null;
let _gpsSendTimer = null;
let _gpsFailCount = 0;
let _gpsRetryTimer = null;
let _gpsWatchFail = 0;
const GPS_MAX_FAIL = 3;

const _gpsOnError = (err, source) => {
  _gpsFailCount++; _gpsWatchFail++;
  const reasons = { 1:'رفضت الإذن', 2:'تعذّر التحديد', 3:'انتهت المهلة' };
  const msg = reasons[err?.code] || 'خطأ GPS';
  if (_gpsFailCount === 1) {
    toast('warn', '⚠️ تحذير GPS', msg);
    const el = $('gpsStatus');
    if (el) el.innerHTML = `<i class="fas fa-location-dot" style="color:var(--amber);margin-left:3px"></i>GPS: ⚠️ ${msg}`;
  }
  if (_gpsFailCount >= GPS_MAX_FAIL) {
    toast('err', '❌ GPS متوقف', 'يرى المشرف موقعك القديم');
    vibrate([300,100,300]);
    const el = $('gpsStatus');
    if (el) el.innerHTML = `<i class="fas fa-location-dot" style="color:var(--red);margin-left:3px"></i>GPS: ❌ متوقف`;
    _gpsFailCount = 0;
  }
  if (_gpsWatchFail >= 2 && source === 'watch') {
    _gpsWatchFail = 0;
    if (_gpsWatcher !== null) {
      try { navigator.geolocation.clearWatch(_gpsWatcher); } catch(e) {}
      _gpsWatcher = null;
    }
    if (_gpsRetryTimer) clearTimeout(_gpsRetryTimer);
    _gpsRetryTimer = setTimeout(() => {
      if (!CU || CR !== 'driver') return;
      _startWatchPosition(CU.id);
    }, 5000);
  }
};

const _startWatchPosition = drvId => {
  if (_gpsWatcher !== null) {
    try { navigator.geolocation.clearWatch(_gpsWatcher); } catch(e) {}
    _gpsWatcher = null;
  }
  _gpsWatcher = navigator.geolocation.watchPosition(
    pos => {
      _gpsWatchFail = 0; _gpsFailCount = 0;
      const { latitude: lat, longitude: lng } = pos.coords;
      const now = Date.now();
      if (_gpsLastLat !== null) {
        const dist = Math.sqrt((_gpsLastLat-lat)**2 + (_gpsLastLng-lng)**2) * 111320;
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
    toast('err', '❌ GPS غير مدعوم', '');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => {
      _gpsFailCount = 0;
      sendGPS(drvId, pos.coords.latitude, pos.coords.longitude, true);
      _startWatchPosition(drvId);
    },
    err => {
      navigator.geolocation.getCurrentPosition(
        pos => { _gpsFailCount = 0; sendGPS(drvId, pos.coords.latitude, pos.coords.longitude, true); _startWatchPosition(drvId); },
        err2 => { _gpsOnError(err2, 'initial'); _startWatchPosition(drvId); },
        { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 }
      );
    },
    { enableHighAccuracy: false, timeout: 30000, maximumAge: 0 }
  );
  _gpsSendTimer = setInterval(() => {
    if (Date.now() - _gpsLastSent < GPS_INTERVAL) return;
    navigator.geolocation.getCurrentPosition(
      pos => { _gpsFailCount = 0; _gpsWatchFail = 0; sendGPS(drvId, pos.coords.latitude, pos.coords.longitude, false); },
      err => _gpsOnError(err, 'timer'),
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 }
    );
  }, GPS_INTERVAL);
};

/* ── إرسال GPS للـ Backend ── */
const sendGPS = async (drvId, lat, lng, isFirst) => {
  _gpsLastLat = lat; _gpsLastLng = lng; _gpsLastSent = Date.now();
  try {
    await apiFetch('/api/gps/update', {
      method: 'POST',
      body: JSON.stringify({ lat, lng, userId: drvId, tenantId: TENANT_ID, role: 'driver' }),
    });
  } catch(e) {
    console.warn('GPS send failed:', e.message);
  }
  if (isFirst) toast('ok', '📍 موقعك محدّد', 'يظهر على الخريطة');
};

const stopGPS = () => {
  if (_gpsWatcher !== null) {
    try { navigator.geolocation.clearWatch(_gpsWatcher); } catch(e) {}
    _gpsWatcher = null;
  }
  if (_gpsSendTimer)  { clearInterval(_gpsSendTimer);  _gpsSendTimer  = null; }
  if (_gpsRetryTimer) { clearTimeout(_gpsRetryTimer);  _gpsRetryTimer = null; }
  _gpsLastSent = 0; _gpsLastLat = null; _gpsLastLng = null;
  _gpsFailCount = 0; _gpsWatchFail = 0;
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

/* ══════════════════════════════════════════════════
   POLLING — بدل Firebase real-time listeners
   ══════════════════════════════════════════════════ */
const onDriversUpdate = cb => { _drvCBs.add(cb); return () => _drvCBs.delete(cb); };
const _notifyDrvCBs   = () => _drvCBs.forEach(cb => { try { cb(allDrvs); } catch(e) {} });

const startDriversPolling = () => {
  if (_pollTimer) return;
  const fetchDrivers = async () => {
    try {
      const data = await apiFetch(`/api/drivers?tenantId=${TENANT_ID}`);
      allDrvs = {};
      (data.drivers || []).forEach(d => { allDrvs[d.id] = d; });
      updateStatsUI();
      _notifyDrvCBs();
    } catch(e) { /* silent */ }
  };
  fetchDrivers();
  _pollTimer = setInterval(fetchDrivers, 8000);
};

const stopDriversPolling = () => {
  if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
  _drvCBs.clear();
};

/* ══════════════════════════════════════════════════
   AUDIO
   ══════════════════════════════════════════════════ */
const AC = window.AudioContext || window.webkitAudioContext;
let aCtx = null;
const getAC = () => { if (!aCtx && AC) { try { aCtx = new AC(); } catch(e) { return null; } } return aCtx; };
['click','touchstart','keydown'].forEach(ev =>
  document.addEventListener(ev, () => { try { const c=getAC(); if(c&&c.state==='suspended') c.resume(); } catch(e){} }, { passive:true })
);
const playSound = t => {
  try {
    const ctx = getAC(); if (!ctx || ctx.state !== 'running') return;
    const P = {
      request:[{f:880,d:.12,g:.9,t:0},{f:1100,d:.12,g:.9,t:.15},{f:880,d:.12,g:.9,t:.30},{f:1100,d:.18,g:.9,t:.45}],
      accept: [{f:523,d:.12,g:.7,t:0},{f:659,d:.12,g:.7,t:.13},{f:784,d:.2,g:.7,t:.26}],
      reject: [{f:784,d:.12,g:.6,t:0},{f:523,d:.2,g:.6,t:.15}],
      cancel: [{f:600,d:.1,g:.7,t:0},{f:400,d:.25,g:.7,t:.15}],
      edit:   [{f:660,d:.1,g:.6,t:0},{f:880,d:.1,g:.6,t:.12},{f:660,d:.1,g:.6,t:.24}],
      sos:    [{f:1200,d:.1,g:1,t:0},{f:1200,d:.1,g:1,t:.15},{f:1200,d:.1,g:1,t:.3},{f:800,d:.3,g:1,t:.5}],
      notif:  [{f:660,d:.18,g:.6,t:0},{f:880,d:.1,g:.4,t:.2}],
      shift:  [{f:523,d:.1,g:.7,t:0},{f:659,d:.1,g:.7,t:.12},{f:784,d:.1,g:.7,t:.24},{f:1047,d:.25,g:.7,t:.36}],
    };
    (P[t]||P.notif).forEach(({f,d,g,t:s}) => {
      const o=ctx.createOscillator(), gn=ctx.createGain();
      o.connect(gn); gn.connect(ctx.destination);
      o.type='sine'; o.frequency.value=f;
      gn.gain.setValueAtTime(0, ctx.currentTime+s);
      gn.gain.linearRampToValueAtTime(g, ctx.currentTime+s+.02);
      gn.gain.exponentialRampToValueAtTime(.001, ctx.currentTime+s+d);
      o.start(ctx.currentTime+s); o.stop(ctx.currentTime+s+d+.05);
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
    const blob = new Blob([src], { type:'text/javascript' });
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
const showPushNotif = async (title, body, type='info') => {
  const key = type+'_'+title.slice(0,20), now = Date.now();
  if (_nt[key] && now-_nt[key] < 3000) return; _nt[key] = now;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const cfg = {
    new_request: {vibrate:[400,100,400,100,400],require:true},
    edit_request:{vibrate:[200,100,200],require:true},
    cancel:      {vibrate:[300],require:false},
    sos:         {vibrate:[500,100,500,100,500],require:true},
    done:        {vibrate:[200],require:false},
    user_request:{vibrate:[300,100,300],require:true},
    info:        {vibrate:[150],require:false},
  }[type] || {vibrate:[150],require:false};
  try {
    const r = swReg || await navigator.serviceWorker.getRegistration().catch(()=>null);
    if (r) { await r.showNotification(title,{body,icon:NOTIF_ICON,vibrate:cfg.vibrate,requireInteraction:cfg.require,tag:type+'_'+Date.now(),dir:'rtl',lang:'ar'}); return; }
    new Notification(title, {body,icon:NOTIF_ICON,tag:type+'_'+Date.now(),dir:'rtl'});
  } catch(e) {}
};

/* ══════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════ */
const $       = id  => document.getElementById(id);
const H       = (id,v) => { const e=$(id); if(e) e.classList[v?'add':'remove']('h'); };
const fmt     = ts  => new Date(ts).toLocaleTimeString('ar',{hour:'2-digit',minute:'2-digit'});
const esc     = s   => { if(s==null)return''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;'); };
const eAt     = s   => (s||'').replace(/'/g,"&#39;").replace(/"/g,'&quot;');
const fmtElapsed = ms => { const t=Math.floor(ms/1000),h=Math.floor(t/3600),m=Math.floor((t%3600)/60),s=t%60; return h>0?`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${m}:${String(s).padStart(2,'0')}`; };

window.OM  = id => { const e=$(id); if(e) e.classList.add('on'); };
window.CM  = id => { const e=$(id); if(e) e.classList.remove('on'); clrAl(); };
const clrAl = () => document.querySelectorAll('.al').forEach(a=>{a.className='al';a.textContent='';});
const shAl  = (id,t,m) => { const e=$(id); if(!e)return; e.className=`al ${t}`; e.innerHTML=`<i class="fas fa-${t==='err'?'circle-exclamation':'circle-check'}"></i> ${m}`; };

window.toast = (t,ti,s='') => {
  const ic={ok:'✅',err:'❌',warn:'⚠️',info:'ℹ️'};
  const container=$('toasts'); if(!container)return;
  while(container.children.length>=4) container.removeChild(container.firstChild);
  const el=document.createElement('div'); el.className='toast';
  el.innerHTML=`<div class="tst">${ic[t]||'ℹ️'}</div><div><div class="ttt">${esc(String(ti))}</div>${s?`<div class="tts">${esc(String(s))}</div>`:''}</div>`;
  container.appendChild(el);
  const tid=setTimeout(()=>{el.style.cssText='opacity:0;transform:translateX(-110%);transition:.2s';setTimeout(()=>{try{el.remove();}catch(e){}},220);},3800);
  el.addEventListener('click',()=>{clearTimeout(tid);el.remove();});
};

/* ══════════════════════════════════════════════════
   TENANT GATE
   ══════════════════════════════════════════════════ */
const initTenantGate = () => {
  $('PL').style.display         = 'none';
  $('PTenantGate').style.display = 'block';
};

window.gateClearErr = () => {
  const err=$('gate-err'); if(err) err.textContent='';
  const inp=$('gate-office-code');
  if(inp) inp.style.borderColor='rgba(255,255,255,.2)';
  const btns=$('gate-btns');     if(btns)     btns.style.display='none';
  const verified=$('gate-verified'); if(verified) verified.style.display='none';
  TENANT_ID=''; TENANT_INFO=null;
};

window.gateCheckCode = async () => {
  const inp  = $('gate-office-code');
  const code = (inp ? inp.value : '').toLowerCase().trim();
  const err  = $('gate-err');
  const btn  = $('gate-check-btn');

  if (!code) { if(err) err.textContent='❌ يرجى إدخال رمز المكتب'; if(inp) inp.focus(); return; }
  if (btn) { btn.innerHTML='<span class="spin"></span>'; btn.disabled=true; }

  try {
    /* التحقق من رمز المكتب عبر Backend */
    const data = await apiFetch(`/api/tenants/verify?code=${code}`);
    TENANT_ID   = data.tenantId;
    TENANT_INFO = { name: data.name };

    const label    = $('gate-office-name-label');
    const verified = $('gate-verified');
    const btns     = $('gate-btns');
    if (label)    label.textContent      = data.name;
    if (verified) verified.style.display = 'flex';
    if (btns)     btns.style.display     = 'flex';
    if (err)      err.textContent        = '';
    if (inp)      inp.style.borderColor  = 'rgba(52,211,153,.6)';
    localStorage.setItem('txOfficeCode', code);
  } catch(e) {
    /* fallback: تحقق محلي */
    if (TENANT_NAMES[code]) {
      TENANT_ID   = code;
      TENANT_INFO = { name: TENANT_NAMES[code] };
      const label=$('gate-office-name-label'), verified=$('gate-verified'), btns=$('gate-btns');
      if(label)    label.textContent      = TENANT_NAMES[code];
      if(verified) verified.style.display = 'flex';
      if(btns)     btns.style.display     = 'flex';
      if(err)      err.textContent        = '';
      if(inp)      inp.style.borderColor  = 'rgba(52,211,153,.6)';
      localStorage.setItem('txOfficeCode', code);
    } else {
      TENANT_ID=''; TENANT_INFO=null;
      const verified=$('gate-verified'), btns=$('gate-btns');
      if(verified) verified.style.display='none';
      if(btns)     btns.style.display='none';
      if(err)      err.textContent='❌ رمز المكتب غير صحيح';
      if(inp) { inp.style.borderColor='rgba(248,113,113,.6)'; inp.style.animation='shake .4s'; setTimeout(()=>{if(inp)inp.style.animation='';},400); }
    }
  } finally {
    if (btn) { btn.innerHTML='<i class="fas fa-check"></i> تحقق'; btn.disabled=false; }
  }
};

window.gateEnter = role => {
  if (!TENANT_ID || !TENANT_INFO) {
    const err=$('gate-err'); if(err) err.textContent='❌ يرجى التحقق من رمز المكتب أولاً';
    return;
  }
  tenantEnter(role);
};

document.addEventListener('DOMContentLoaded', initTenantGate);

window.tenantEnter = role => {
  $('PTenantGate').style.display='none';
  $('PL').style.display='block';
  if (role==='driver') {
    setTimeout(()=>OM('Mdriver'),80);
  } else if (role==='receiver') {
    IS_RECV=true;
    setTimeout(()=>{
      const t=$('supModalTitle'); if(t) t.textContent='بوابة المستقبل';
      const o=$('supModalOfficeName'); if(o) o.textContent='سجّل بنفس بيانات المشرف';
      const n=$('recvLoginNote'); if(n) n.style.display='block';
      OM('Msup');
    },80);
  } else {
    IS_RECV=false;
    setTimeout(()=>{
      const t=$('supModalTitle'); if(t) t.textContent='بوابة المشرف';
      const o=$('supModalOfficeName'); if(o) o.textContent='سجّل الدخول بحساب مكتبك';
      const n=$('recvLoginNote'); if(n) n.style.display='none';
      OM('Msup');
    },80);
  }
};

window.openPubPageDirect = () => {
  $('PTenantGate').style.display='none';
  $('PL').style.display='block';
  let tries=0;
  const interval=setInterval(()=>{
    tries++;
    if(typeof window.openPubPage==='function'){clearInterval(interval);window.openPubPage();}
    else if(tries>30) clearInterval(interval);
  },150);
};

window.dtab = t => {
  $('dt1').classList.toggle('on',t==='li');
  $('dt2').classList.toggle('on',t==='rg');
  H('dli',t!=='li'); H('drg',t!=='rg');
  clrAl();
};

/* ══════════════════════════════════════════════════
   AUTH — SUPERVISOR LOGIN
   Firebase Auth → Backend verify → session token
   ══════════════════════════════════════════════════ */
window.sLogin = async () => {
  const email = ($('sl-email')?($('sl-email').value||'').trim():'');
  const pw    = ($('sl-pw')   ?($('sl-pw').value   ||'').trim():'');
  if (!email || !pw) return shAl('al-sup','err','يرجى إدخال البريد وكلمة المرور');

  const btn=$('sl-pw').closest('.mdl').querySelector('.ba');
  const orig=btn.innerHTML;
  btn.innerHTML='<span class="spin"></span> جار الدخول...';
  btn.disabled=true;

  try {
    /* 1. Firebase Auth */
    const cred  = await signInWithEmailAndPassword(_auth, email, pw);
    const token = await cred.user.getIdToken();

    /* 2. Backend verify — يعيد session token + tenantId */
    const data = await apiFetch('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ idToken: token, tenantCode: TENANT_ID, role: IS_RECV ? 'receiver' : 'supervisor' }),
    });

    _sessionToken = data.sessionToken;
    TENANT_ID     = data.tenantId   || TENANT_ID;
    TENANT_INFO   = { name: data.officeName || TENANT_NAMES[TENANT_ID] || TENANT_ID };

    document.querySelectorAll('.lgn1').forEach(el=>el.textContent=TENANT_INFO.name);
    document.title = TENANT_INFO.name + ' — منصة التاكسي';

    CU = { id:'admin_'+TENANT_ID, name:TENANT_INFO.name, role:'admin', officeId:TENANT_ID };
    CR = 'supervisor';

    CM('Msup');

    if (IS_RECV) {
      initRecvDash();
      toast('ok','مرحباً 👨‍💼','📥 منصة المستقبل — '+TENANT_INFO.name);
    } else {
      initDash();
      toast('ok','مرحباً 👨‍💼','منصة الطلبات — '+TENANT_INFO.name);
      startSupPolling();
      startDriversPolling();
    }
  } catch(err) {
    const fbMsgs = {
      'auth/wrong-password':    '❌ كلمة المرور غير صحيحة',
      'auth/user-not-found':    '❌ البريد الإلكتروني غير موجود',
      'auth/invalid-email':     '❌ البريد الإلكتروني غير صحيح',
      'auth/invalid-credential':'❌ بيانات الدخول غير صحيحة',
      'auth/too-many-requests': '⚠️ محاولات كثيرة — انتظر قليلاً',
      'auth/network-request-failed':'❌ تحقق من اتصالك بالإنترنت',
    };
    shAl('al-sup','err', fbMsgs[err.code] || err.message || '❌ خطأ في الدخول');
  }
  btn.innerHTML=orig; btn.disabled=false;
};

/* ══════════════════════════════════════════════════
   AUTH — DRIVER REGISTER
   ══════════════════════════════════════════════════ */
window.dReg = async () => {
  const nm      = ($('dr-nm').value  ||'').trim();
  const ph      = ($('dr-ph').value  ||'').trim();
  const car     = ($('dr-car').value ||'').trim();
  const pw      =  $('dr-pw').value  ||'';
  const pw2     =  $('dr-pw2').value ||'';
  const invCode = ($('dr-invite')?($('dr-invite').value||'').trim().toUpperCase():'');

  if(!nm||!ph||!pw||!car) return shAl('al-drv','err','يرجى ملء جميع الحقول');
  if(pw!==pw2)             return shAl('al-drv','err','كلمات المرور غير متطابقة');
  if(!/^[0-9+]{7,15}$/.test(ph.replace(/ /g,''))) return shAl('al-drv','err','رقم الهاتف غير صحيح');
  if(pw.length<6)          return shAl('al-drv','err','كلمة المرور قصيرة جداً');
  if(!TENANT_ID)           return shAl('al-drv','err','ادخل برمز المكتب أولاً');

  const btn=$('dr-nm').closest('.mdl').querySelector('.bp');
  const orig=btn.innerHTML;
  btn.innerHTML='<span class="spin"></span> جار الإنشاء...'; btn.disabled=true;

  try {
    await apiFetch('/api/drivers/register', {
      method: 'POST',
      body: JSON.stringify({ name:nm, phone:ph, carNumber:car, password:pw, tenantId:TENANT_ID, inviteCode:invCode }),
    });
    shAl('al-drv','ok','✅ تم التسجيل! انتظر موافقة المشرف');
    ['dr-nm','dr-ph','dr-car','dr-pw','dr-pw2','dr-invite'].forEach(id=>{const el=$(id);if(el)el.value='';});
    setTimeout(()=>dtab('li'),2500);
  } catch(err) {
    shAl('al-drv','err', err.data?.error || err.message || 'خطأ في التسجيل');
  }
  btn.innerHTML=orig; btn.disabled=false;
};

/* ══════════════════════════════════════════════════
   AUTH — DRIVER LOGIN
   ══════════════════════════════════════════════════ */
window.dLogin = async () => {
  const ph  = ($('dl-ph').value  ||'').trim();
  const pw  =  $('dl-pw').value  ||'';
  const car = ($('dl-car').value ||'').trim();
  if(!ph||!pw||!car) return shAl('al-drv','err','يرجى ملء جميع الحقول');

  const btn=$('dl-pw').closest('.mdl').querySelector('.bp');
  const orig=btn.innerHTML;
  btn.innerHTML='<span class="spin"></span> جار الدخول...'; btn.disabled=true;

  try {
    const data = await apiFetch('/api/drivers/login', {
      method: 'POST',
      body: JSON.stringify({ phone:ph, password:pw, carNumber:car, tenantId:TENANT_ID }),
    });

    _sessionToken = data.sessionToken;
    TENANT_ID     = data.driver.tenantId || TENANT_ID;
    TENANT_INFO   = { name: TENANT_NAMES[TENANT_ID] || TENANT_ID };

    CU = { ...data.driver };
    CR = 'driver'; IS_RECV=false;
    if (data.driver.shiftStart && !data.driver.shiftEnd) shiftStartTime = data.driver.shiftStart;

    CM('Mdriver');
    await registerSW();
    const granted = await reqPushPerm();
    if (granted) toast('ok','🔔 الإشعارات مفعّلة','');
    startGPS(CU.id);
    initDash();
    toast('ok','أهلاً '+CU.name,'🚕 جاهز لاستقبال الطلبات');
    startDriverRequestsPolling(CU.id);
    startSosBroadcastPolling();
  } catch(err) {
    const msgs = {
      PENDING:       '⏳ حسابك قيد المراجعة',
      REJECTED:      '❌ تم رفض حسابك',
      NOT_FOUND:     '❌ رقم الهاتف غير مسجل',
      WRONG_PASSWORD:'❌ كلمة المرور خاطئة',
      WRONG_CAR:     '❌ رقم السيارة غير صحيح',
      WRONG_TENANT:  '❌ هذا الحساب مسجل في مكتب آخر',
    };
    shAl('al-drv','err', msgs[err.data?.code] || err.data?.error || err.message || 'خطأ في الدخول');
  }
  btn.innerHTML=orig; btn.disabled=false;
};

/* ══════════════════════════════════════════════════
   STATUS HELPERS
   ══════════════════════════════════════════════════ */
const getTCS = d => {
  const s=d.status||'', c=d.taxiColor||'green';
  if(c==='red'||s==='busy')    return{border:'#DC2626',dot:'#DC2626',label:'مشغول 🔴',cls:'sb-red',monCls:'st-busy',dotCls:'msd-red',badgeCls:'mtb-red',emoji:'🔴'};
  if(c==='orange'||s==='break'||s==='pray'||s==='waiting'||s==='near'){
    const lbl=s==='near'?'قريب ⚠️':s==='waiting'?'بالانتظار 🟠':s==='pray'?'صلاة 🕌':'استراحة 🟠';
    return{border:'#EA580C',dot:'#EA580C',label:lbl,cls:'sb-orange',monCls:'st-break',dotCls:'msd-orange',badgeCls:'mtb-orange',emoji:'🟠'};
  }
  if(s==='offline') return{border:'#64748B',dot:'#64748B',label:'غير متصل ⚫',cls:'sb-gray',monCls:'st-offline',dotCls:'msd-gray',badgeCls:'mtb-gray',emoji:'⚫'};
  return{border:'#059669',dot:'#059669',label:'متاح 🟢',cls:'sb-green',monCls:'st-online',dotCls:'msd-green',badgeCls:'mtb-green',emoji:'🟢'};
};
const getStatusBadge = d => { const cs=getTCS(d); return `<span class="sbadge ${cs.cls}"><span class="pdot" style="background:${cs.dot}"></span>${cs.label}</span>`; };

/* ══════════════════════════════════════════════════
   DRIVER POLLING — طلبات + SOS
   ══════════════════════════════════════════════════ */
let _drvReqPollTimer = null;
let _sosPollTimer    = null;
let _knownReqIds     = new Set();
let _lastSosTs       = 0;

const startDriverRequestsPolling = drvId => {
  if (_drvReqPollTimer) return;
  const fetchReqs = async () => {
    try {
      const data = await apiFetch(`/api/requests/driver/${drvId}?tenantId=${TENANT_ID}`);
      const reqs = data.requests || [];

      /* طلبات pending جديدة */
      reqs.filter(r=>r.status==='pending'||r.status==='modified').forEach(req => {
        if (!_knownReqIds.has(req.id)) {
          _knownReqIds.add(req.id);
          showDriverReq(req.id, req);
        }
      });

      /* إذا الطلب الحالي أُلغي */
      const curId=$('currentReqId').value;
      if (curId) {
        const cur = reqs.find(r=>r.id===curId);
        if (cur?.status==='cancelled') {
          clearInterval(reqCountdownTimer);
          $('ReqNotif').classList.remove('on'); $('currentReqId').value='';
          playSound('cancel'); toast('info','🚫 تم إلغاء الطلب','أنت الآن متاح 🟢');
        }
      }

      /* تحديث قائمة الطلبات */
      const list=$('DREQLIST'), cnt=$('drvReqCount');
      if (list) {
        if (!reqs.length) { list.innerHTML='<div class="dreq-empty"><i class="fas fa-box-open"></i><p>لا توجد طلبات بعد</p></div>'; if(cnt) cnt.textContent='0 طلب'; }
        else { if(cnt) cnt.textContent=reqs.length+' طلب'; list.innerHTML=reqs.sort((a,b)=>(b.ts||0)-(a.ts||0)).map(([id,req])=>mkDriverReqCard(id,req)).join(''); }
      }
    } catch(e) { /* silent */ }
  };
  fetchReqs();
  _drvReqPollTimer = setInterval(fetchReqs, 5000);
};

const startSosBroadcastPolling = () => {
  if (_sosPollTimer) return;
  const fetchSos = async () => {
    try {
      const data = await apiFetch(`/api/sos/active?tenantId=${TENANT_ID}`);
      if (!data.sos || !data.sos.ts || data.sos.ts <= _lastSosTs) return;
      if (data.sos.acked?.[CU?.id]) return;
      _lastSosTs = data.sos.ts;
      $('sosBcMsg').textContent  = data.sos.msg || '-';
      $('sosBcFrom').textContent = `من: ${data.sos.senderName||'المشرف'} • ${fmt(data.sos.ts)}`;
      $('SosBroadcastNotif').classList.add('on');
      vibrate([500,100,500,100,500]); playSound('sos');
      showPushNotif('🆘 تنبيه طوارئ!', data.sos.msg||'', 'sos');
    } catch(e) { /* silent */ }
  };
  fetchSos();
  _sosPollTimer = setInterval(fetchSos, 10000);
};

window.ackSosBroadcast = async () => {
  try { await apiFetch('/api/sos/ack',{method:'POST',body:JSON.stringify({tenantId:TENANT_ID,driverId:CU?.id})}); } catch(e){}
  $('SosBroadcastNotif').classList.remove('on');
};

const showDriverReq = (rid, rd) => {
  $('currentReqId').value=rid;
  $('reqPhone').textContent    = rd.phone  ||'-';
  $('reqLocation').textContent = rd.details||'-';
  $('reqTime').textContent     = fmt(rd.ts ||Date.now());
  $('reqRejectArea').classList.remove('on'); $('reqRejectReason').value='';
  const msgBox=$('reqMsgBox');
  if(rd.message){msgBox.style.display='block';$('reqMsgText').textContent=rd.message;}
  else msgBox.style.display='none';
  const modNotice=$('reqModNotice');
  if(rd.status==='modified'&&rd.prevPhone){
    modNotice.style.display='block';
    $('reqModText').textContent=`تعديل • ${rd.prevPhone} ← ${rd.phone}`;
    playSound('edit'); vibrate([200,100,200]);
    showPushNotif('✏️ تم تعديل طلبك',`📞 ${rd.phone}\n📍 ${rd.details}`,'edit_request');
  } else {
    modNotice.style.display='none';
    const rt=$('reqTitle'); if(rt) rt.textContent=rd.fromUser?'🌐 طلب من مستخدم':'طلب جديد من المشرف';
    playSound('request'); vibrate([300,100,300,100,300]);
    showPushNotif(`📦 ${rd.fromUser?'طلب مستخدم':'طلب جديد'}`,`📞 ${rd.phone}\n📍 ${rd.details}`,'new_request');
  }
  $('ReqNotif').classList.add('on');
  let count=60; $('reqCountNum').textContent=count;
  clearInterval(reqCountdownTimer);
  reqCountdownTimer=setInterval(async()=>{
    count--; const el=$('reqCountNum'); if(el) el.textContent=count;
    if(count<=0){
      clearInterval(reqCountdownTimer);
      if($('ReqNotif').classList.contains('on')){
        try { await apiFetch(`/api/requests/${rid}/timeout`,{method:'POST',body:JSON.stringify({tenantId:TENANT_ID,driverId:CU.id})}); } catch(e){}
        $('ReqNotif').classList.remove('on'); $('currentReqId').value='';
        toast('warn','انتهى الوقت','');
      }
    }
  },1000);
};

window.acceptReq = async () => {
  const rid=$('currentReqId').value; if(!rid) return;
  clearInterval(reqCountdownTimer);
  try {
    await apiFetch(`/api/requests/${rid}/accept`,{method:'POST',body:JSON.stringify({tenantId:TENANT_ID,driverId:CU.id})});
    CU.taxiColor='red'; CU.status='busy';
    $('ReqNotif').classList.remove('on'); vibrate([200]); playSound('accept'); toast('ok','تم قبول الطلب 🚕','');
    const b=$('drvStatusBadge'); if(b) b.innerHTML=getStatusBadge(CU);
  } catch(err) { toast('err','خطأ',err.message||''); }
};
window.showRejectInput = () => $('reqRejectArea').classList.toggle('on');
window.submitReject = async () => {
  const rid=$('currentReqId').value, reason=($('reqRejectReason').value||'').trim();
  if(!reason) return toast('warn','اكتب سبب الرفض','');
  clearInterval(reqCountdownTimer);
  try {
    await apiFetch(`/api/requests/${rid}/reject`,{method:'POST',body:JSON.stringify({tenantId:TENANT_ID,driverId:CU.id,reason})});
    $('ReqNotif').classList.remove('on'); vibrate([100,50,100]); playSound('reject'); toast('info','تم رفض الطلب','');
  } catch(err) { toast('err','خطأ',err.message||''); }
};

window.inlineAccept = async id => {
  try {
    await apiFetch(`/api/requests/${id}/accept`,{method:'POST',body:JSON.stringify({tenantId:TENANT_ID,driverId:CU.id})});
    CU.taxiColor='red'; CU.status='busy';
    if($('currentReqId').value===id){clearInterval(reqCountdownTimer);$('ReqNotif').classList.remove('on');$('currentReqId').value='';}
    vibrate([200]); playSound('accept'); toast('ok','تم قبول الطلب 🚕','');
    const b=$('drvStatusBadge'); if(b) b.innerHTML=getStatusBadge(CU);
  } catch(err){toast('err','خطأ',err.message||'');}
};
window.inlineReject = async id => {
  const reason=prompt('سبب الرفض (مطلوب):',''); if(!reason||!reason.trim()) return toast('warn','يرجى كتابة سبب الرفض','');
  try {
    await apiFetch(`/api/requests/${id}/reject`,{method:'POST',body:JSON.stringify({tenantId:TENANT_ID,driverId:CU.id,reason:reason.trim()})});
    if($('currentReqId').value===id){clearInterval(reqCountdownTimer);$('ReqNotif').classList.remove('on');$('currentReqId').value='';}
    vibrate([100,50,100]); playSound('reject'); toast('info','تم رفض الطلب','');
  } catch(err){toast('err','خطأ',err.message||'');}
};

const updStatus = async s => {
  if(!CU) return;
  try {
    await apiFetch('/api/drivers/status',{method:'POST',body:JSON.stringify({driverId:CU.id,tenantId:TENANT_ID,status:s})});
    const cm={online:'green',busy:'red',break:'orange',pray:'orange',waiting:'orange',near:'orange',offline:'green'};
    CU.taxiColor=cm[s]||'green'; CU.status=s;
  } catch(err){toast('err','خطأ GPS',err.message||'');}
};

/* ══════════════════════════════════════════════════
   SUPERVISOR POLLING
   ══════════════════════════════════════════════════ */
let _supPollTimer   = null;
let _supReqPollTimer= null;
let _knownSupReqs   = new Set();
let _pendingBadge   = 0;
let _unreadNotifs   = 0;

const startSupPolling = () => {
  /* طلبات واردة */
  const fetchReqs = async () => {
    try {
      const data=await apiFetch(`/api/requests?tenantId=${TENANT_ID}`);
      const reqs=data.requests||[];
      reqs.filter(r=>r.fromUser).forEach(r=>{
        if(!_knownSupReqs.has(r.id)){
          _knownSupReqs.add(r.id);
          playSound('request'); vibrate([300,100,300]);
          showPushNotif('🌐 طلب مستخدم جديد!',`📞 ${r.phone}\n📍 ${r.details}`,'user_request');
          toast('info','🌐 طلب جديد من مستخدم',`📞 ${r.phone}`);
        }
      });
      /* badge */
      const supList=$('supReqList');
      if(supList) _renderSupReqItems(reqs, supList);
      /* تحديث badges */
      ['recv-req-badge','mob-recv-badge'].forEach(bid=>{const b=$(bid);if(b){b.textContent=reqs.length;b.style.display=reqs.length>0?'inline':'none';}});
    } catch(e){}
  };
  /* سائقون pending */
  const fetchPending = async () => {
    try {
      const data=await apiFetch(`/api/drivers/pending?tenantId=${TENANT_ID}`);
      const count=(data.drivers||[]).length;
      ['approval-badge','mob-approval-badge'].forEach(bid=>{const b=$(bid);if(b){b.textContent=count;b.style.display=count>0?'inline':'none';}});
    } catch(e){}
  };
  /* تنبيهات */
  const fetchNotifs = async () => {
    try {
      const data=await apiFetch(`/api/notifications?tenantId=${TENANT_ID}`);
      const unread=(data.notifications||[]).filter(n=>!n.read).length;
      ['notif-badge','mob-notif-badge'].forEach(bid=>{const b=$(bid);if(b){b.textContent=unread;b.style.display=unread>0?'inline':'none';}});
      const supList=$('supNotifList');
      if(supList) _renderSupNotifItems(data.notifications||[], supList);
    } catch(e){}
  };

  fetchReqs(); fetchPending(); fetchNotifs();
  if(_supPollTimer) return;
  _supPollTimer=setInterval(()=>{fetchReqs();fetchPending();fetchNotifs();},6000);
};

const _renderSupReqItems = (reqs, list) => {
  if(!reqs.length){list.innerHTML=`<div style="text-align:center;padding:32px;color:var(--text4)"><i class="fas fa-inbox" style="font-size:32px;opacity:.2;display:block;margin-bottom:8px"></i>لا يوجد طلبات</div>`;return;}
  list.innerHTML=reqs.sort((a,b)=>(b.ts||0)-(a.ts||0)).slice(0,50).map(d=>{
    const userBadge=d.fromUser?`<span style="background:#ECFDF5;color:#059669;font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;border:1px solid #A7F3D0;margin-right:4px">🌐 مستخدم</span>`:'';
    return `<div class="reqcard" id="sreq-${d.id}" style="margin-bottom:9px">
      <div class="reqtop"><div class="reqphone"><i class="fas fa-phone"></i>${esc(d.phone||'-')}${userBadge}</div><div class="reqtimes"><span class="reqtime"><i class="fas fa-clock"></i>${fmt(d.ts||Date.now())}</span></div></div>
      <div class="reqdetails"><i class="fas fa-map-marker-alt"></i><span>${esc(d.details||'-')}</span></div>
      ${d.addedBy?`<div style="font-size:10px;color:var(--text4);margin-bottom:6px"><i class="fas fa-user" style="margin-left:3px"></i>${esc(d.addedBy)}</div>`:''}
      <div class="reqacts">
        <button class="rca rca-primary" onclick="openTaxiSel('${d.id}','${eAt(d.phone||'')}','${eAt(d.details||'')}','${d.id}')"><i class="fas fa-car-side"></i> إرسال لسائق</button>
        ${d.hasGps&&d.userLat&&d.userLng?`<button class="rca rca-green" onclick="showUserGpsOnMap('${d.id}',${d.userLat},${d.userLng},'${esc(d.phone||'')}')"><i class="fas fa-map-location-dot"></i> خريطة الزبون</button>`:''}
        <button class="rca rca-amber" onclick="openEditReq('${d.id}','${eAt(d.phone||'')}','${eAt(d.details||'')}')"><i class="fas fa-pen"></i></button>
        <button class="rca rca-red"   onclick="cancelReq('${d.id}')"><i class="fas fa-ban"></i></button>
        <button class="rca rca-gray"  onclick="delRecvItem('${d.id}')"><i class="fas fa-trash"></i></button>
      </div>
    </div>`;
  }).join('');
};

const _renderSupNotifItems = (notifs, list) => {
  const icMap ={accept:'ni-green',reject:'ni-red',timeout:'ni-red',done:'ni-green',waiting:'ni-amber',near:'ni-amber',sos:'ni-red',info:'ni-blue',cancel:'ni-red',edit:'ni-amber',rating:'ni-green',user_request:'ni-green',new_driver:'ni-amber'};
  const icoMap={accept:'check',reject:'times',timeout:'clock',done:'flag-checkered',waiting:'hourglass-half',near:'map-pin',sos:'triangle-exclamation',info:'info',cancel:'ban',edit:'pen',rating:'star',user_request:'globe',new_driver:'user-plus'};
  if(!notifs.length){list.innerHTML=`<div style="text-align:center;padding:14px;color:var(--text4);font-size:12px">لا يوجد تنبيهات</div>`;return;}
  list.innerHTML=notifs.sort((a,b)=>(b.ts||0)-(a.ts||0)).slice(0,30).map(n=>`<div class="notif-item ${n.read?'':'unread'}" style="padding-left:40px">
    <div class="notif-ic ${icMap[n.type]||'ni-blue'}"><i class="fas fa-${icoMap[n.type]||'bell'}"></i></div>
    <div class="notif-body"><div class="notif-title">${esc(n.msg||'')}</div>${n.reason?`<div class="notif-sub">السبب: ${esc(n.reason)}</div>`:''}<div class="notif-time">${fmt(n.ts||Date.now())}</div></div>
    <button class="notif-del-btn" onclick="delNotif('${n.id}')" style="position:absolute;left:8px;top:50%;transform:translateY(-50%)"><i class="fas fa-times"></i></button>
  </div>`).join('');
  /* قراءة الكل */
  notifs.filter(n=>!n.read).forEach(n=>apiFetch(`/api/notifications/${n.id}/read`,{method:'POST',body:JSON.stringify({tenantId:TENANT_ID})}).catch(()=>{}));
};

/* ══════════════════════════════════════════════════
   INIT DASHBOARD
   ══════════════════════════════════════════════════ */
const initDash = () => {
  $('PL').style.display='none'; $('PD').style.display='block';
  const nav=$('navav'); nav.textContent=CR==='driver'?'🚕':'👨‍💼';
  if(CR==='supervisor') nav.classList.add('sup-av');

  const tabs=$('ntabs'), mobNav=$('mobileNav'), mobTabs=$('mobTabs');

  if(CR==='driver'){
    const cfg=[
      {id:'reqs',    icon:'fas fa-inbox',    label:'الطلبات'},
      {id:'reports', icon:'fas fa-chart-bar', label:'تقاريري'},
      {id:'support', icon:'fas fa-headset',   label:'دعم فني'},
      {id:'profile', icon:'fas fa-user-cog',  label:'حسابي'},
    ];
    tabs.innerHTML=cfg.map((t,i)=>`<button class="ntab${i===0?' on':''}" id="nt-${t.id}" onclick="nTab('${t.id}')"><i class="${t.icon}"></i> ${t.label}</button>`).join('');
    if(mobNav&&mobTabs){
      mobNav.style.display='block';
      mobTabs.innerHTML=cfg.map((t,i)=>`<button class="mob-tab${i===0?' on':''}" id="mnt-${t.id}" onclick="nTab('${t.id}')"><i class="${t.icon}"></i><span class="mob-label">${t.label}</span></button>`).join('');
    }
    renderDriverReqs();
  } else {
    const cfg=[
      {id:'reqs',      icon:'fas fa-inbox',           label:'الطلبات'},
      {id:'map',       icon:'fas fa-map-location-dot', label:'الخريطة'},
      {id:'notifs',    icon:'fas fa-bell',             label:'التنبيهات',  badge:true},
      {id:'approvals', icon:'fas fa-user-check',       label:'الموافقات',  badge2:true},
      {id:'reports',   icon:'fas fa-chart-bar',        label:'التقارير'},
      {id:'accounts',  icon:'fas fa-users',            label:'السائقون'},
      {id:'support',   icon:'fas fa-headset',          label:'دعم فني'},
      {id:'profile',   icon:'fas fa-user-cog',         label:'حسابي'},
    ];
    tabs.innerHTML=cfg.map((t,i)=>`<button class="ntab${i===0?' sup-on':''}" id="nt-${t.id}" onclick="nTab('${t.id}')"><i class="${t.icon}"></i> ${t.label}${t.badge?`<span class="ntab-badge" id="notif-badge" style="display:none">0</span>`:''}${t.badge2?`<span class="ntab-badge" id="approval-badge" style="display:none;background:var(--green)">0</span>`:''}</button>`).join('');

    const monBtn=document.createElement('button');
    monBtn.id='monitorBtn'; monBtn.className='btn-primary';
    monBtn.style.cssText='padding:7px 13px;font-size:11px;flex-shrink:0';
    monBtn.innerHTML='<i class="fas fa-tv"></i>'; monBtn.onclick=openMonitor;
    const navr=$('navr'); if(navr&&!$('monitorBtn')) navr.insertBefore(monBtn,navr.firstChild);

    if(mobNav&&mobTabs){
      mobNav.style.display='block';
      mobTabs.innerHTML=cfg.map((t,i)=>`<button class="mob-tab${i===0?' sup-on':''}" id="mnt-${t.id}" onclick="nTab('${t.id}')">${t.badge?`<span class="mob-tab-badge" id="mob-notif-badge" style="display:none">0</span>`:''}${t.badge2?`<span class="mob-tab-badge" id="mob-approval-badge" style="display:none;background:var(--green)">0</span>`:''}<i class="${t.icon}"></i><span class="mob-label">${t.label}</span></button>`).join('');
      mobTabs.innerHTML+=`<button class="mob-tab" onclick="openMonitor()"><i class="fas fa-tv"></i><span class="mob-label">مراقبة</span></button>`;
    }
    renderSupReqs();
  }
};

let _tabBusy=false;
window.nTab = t => {
  if(_tabBusy) return; _tabBusy=true;
  document.querySelectorAll('#ntabs .ntab').forEach(b=>b.classList.remove('on','sup-on'));
  const el=$('nt-'+t); if(el) el.classList.add(CR==='supervisor'?'sup-on':'on');
  document.querySelectorAll('#mobTabs .mob-tab').forEach(b=>b.classList.remove('on','sup-on'));
  const mel=$('mnt-'+t); if(mel) mel.classList.add(CR==='supervisor'?'sup-on':'on');
  /* أوقف خرائط قديمة */
  if(leafletMap){try{leafletMap.remove();}catch(e){} leafletMap=null; mapMarkers={};}
  if(window._inlineMap){try{window._inlineMap.remove();}catch(e){} window._inlineMap=null; window._inlineMarkers={};}
  if(CR==='driver'){
    if(t==='reqs')         renderDriverReqs();
    else if(t==='reports') renderDriverReports();
    else if(t==='support') renderSupport('driver');
    else                   renderDProfile();
  } else {
    if(t==='reqs')         renderSupReqs();
    else if(t==='map')     renderMapSup();
    else if(t==='notifs')  renderNotifs();
    else if(t==='approvals')renderApprovals();
    else if(t==='reports') renderSupReports();
    else if(t==='accounts')renderAccs();
    else if(t==='support') renderSupport('supervisor');
    else                   renderSProfile();
  }
  setTimeout(()=>{_tabBusy=false;},400);
};

const updateStatsUI = () => {
  const ent=Object.entries(allDrvs);
  const upd=(id,v)=>{const e=$(id);if(e)e.textContent=v;};
  upd('sTot', ent.length);
  upd('sOn',  ent.filter(([,d])=>getTCS(d).monCls==='st-online').length);
  upd('sBusy',ent.filter(([,d])=>getTCS(d).monCls==='st-busy').length);
  upd('sBreak',ent.filter(([,d])=>getTCS(d).monCls==='st-break').length);
  upd('sNear', ent.filter(([,d])=>d.status==='near').length);
};

/* ══════════════════════════════════════════════════
   DRIVER REQUESTS VIEW
   ══════════════════════════════════════════════════ */
const renderDriverReqs = () => {
  $('dbody').innerHTML=`
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
  updateNotifBar();
  setInterval(()=>{
    const el=$('gpsStatus'); if(!el)return;
    const age=Date.now()-_gpsLastSent;
    if(_gpsLastSent===0){el.textContent='GPS: انتظار...';return;}
    if(age<100000) el.innerHTML=`<i class="fas fa-location-dot" style="color:var(--green);margin-left:3px"></i>GPS: ${Math.floor(age/1000)}ث مضت ✅`;
    else           el.innerHTML=`<i class="fas fa-location-dot" style="color:var(--amber);margin-left:3px"></i>GPS: ${Math.floor(age/60000)} دقيقة مضت`;
  },5000);
};

const updateNotifBar = () => {
  const bar=$('notifBar'); if(!bar)return;
  if(!('Notification' in window))             {bar.innerHTML='<i class="fas fa-bell-slash" style="color:var(--text4)"></i><span style="color:var(--text4)">الإشعارات غير مدعومة</span>';return;}
  if(Notification.permission==='granted')     {bar.innerHTML='<i class="fas fa-bell" style="color:var(--green)"></i><span style="color:var(--green)">🔔 الإشعارات مفعّلة</span>';bar.style.background='var(--green-l)';}
  else if(Notification.permission==='denied') {bar.innerHTML='<i class="fas fa-bell-slash" style="color:var(--red)"></i><span style="color:var(--red)">🔕 الإشعارات محجوبة</span>';bar.style.background='var(--red-l)';}
  else{bar.innerHTML='<i class="fas fa-bell" style="color:var(--amber)"></i><span style="color:var(--amber)">الإشعارات غير مفعّلة</span><button onclick="enableNotifs()" style="margin-right:auto;padding:4px 10px;background:var(--amber);border:none;border-radius:7px;color:#fff;font-size:11px;font-weight:700;cursor:pointer;font-family:Cairo,sans-serif">🔔 تفعيل</button>';bar.style.background='var(--amber-l)';}
};
window.enableNotifs = async () => { await registerSW(); const g=await reqPushPerm(); updateNotifBar(); toast(g?'ok':'warn',g?'🔔 تم التفعيل!':'لم يتم التفعيل',''); };

const mkDriverReqCard = (id, req) => {
  const sMap={pending:'rc-pending',accepted:'rc-accepted',rejected:'rc-rejected',waiting:'rc-waiting',near:'rc-near',cancelled:'rc-cancelled',modified:'rc-pending',no_response:'rc-rejected',done:'rc-done'};
  const sLbl={pending:'⏳ انتظار',accepted:'✅ مقبول',rejected:'❌ مرفوض',waiting:'🕐 بالانتظار',near:'⚠️ قريب',cancelled:'🚫 ملغي',modified:'✏️ معدّل',no_response:'⏰ لم يُستجب',done:'✅ تم التوصيل'}[req.status]||req.status;
  const sBadgeCls=req.status==='accepted'||req.status==='done'?'sb-green':req.status==='rejected'||req.status==='cancelled'?'sb-red':req.status==='waiting'||req.status==='near'?'sb-orange':'sb-amber';
  const userBadge=req.fromUser?`<span style="background:#ECFDF5;color:#059669;border:1px solid #A7F3D0;border-radius:20px;padding:2px 7px;font-size:10px;font-weight:700;margin-right:4px">🌐 مستخدم</span>`:'';
  const modDiff=req.status==='modified'&&req.prevPhone?`<div class="mod-diff"><div class="mod-old"><i class="fas fa-times-circle"></i>${esc(req.prevPhone)} • ${esc(req.prevDetails||'')}</div><div class="mod-new"><i class="fas fa-check-circle"></i>${esc(req.phone)} • ${esc(req.details||'')}</div></div>`:'';
  const msgShow=req.message?`<div class="req-msg-box" style="margin-bottom:9px"><div class="req-msg-from"><i class="fas fa-user-tie"></i> رسالة المشرف</div><div class="req-msg-text">${esc(req.message)}</div></div>`:'';
  const showPending=req.status==='pending'||req.status==='modified';
  const showActive=(req.status==='accepted'||req.status==='waiting'||req.status==='near')&&!req.doneDelivery;
  const pendingActs=showPending?`<div style="display:flex;gap:7px;flex-wrap:wrap;padding:10px;background:var(--amber-l);border:1px solid var(--amber-m);border-radius:var(--r);margin-top:6px;animation:reqPulse 2s infinite"><div style="width:100%;font-size:11px;font-weight:700;color:var(--amber);margin-bottom:4px"><i class="fas fa-clock"></i> يرجى الرد</div><button class="rca rca-green" style="flex:1;padding:10px;font-size:13px;font-weight:800" onclick="inlineAccept('${id}')"><i class="fas fa-check"></i> قبول</button><button class="rca rca-red" style="flex:1;padding:10px;font-size:13px;font-weight:800" onclick="inlineReject('${id}')"><i class="fas fa-times"></i> رفض</button></div>`:'';
  const acts=showActive?`<button class="rca rca-orange" onclick="setDrvWaiting('${id}')"><i class="fas fa-hourglass-half"></i> انتظار</button><button class="rca rca-amber" onclick="setDrvNear('${id}')"><i class="fas fa-map-pin"></i> قريب</button><button class="rca rca-green" onclick="doneDelivery('${id}')"><i class="fas fa-flag-checkered"></i> تم التوصيل</button>`:'';
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
  await apiFetch(`/api/requests/${id}/waiting`,{method:'POST',body:JSON.stringify({tenantId:TENANT_ID,driverId:CU.id})});
  await updStatus('waiting');
  toast('ok','بالانتظار 🟠',''); playSound('notif');
};
window.setDrvNear = async id => {
  await apiFetch(`/api/requests/${id}/near`,{method:'POST',body:JSON.stringify({tenantId:TENANT_ID,driverId:CU.id})});
  await updStatus('near');
  toast('ok','قريب ⚠️',''); playSound('notif');
};

window.doneDelivery = async id => {
  if(!CU) return;
  try {
    const data=await apiFetch(`/api/requests/${id}/done`,{method:'POST',body:JSON.stringify({tenantId:TENANT_ID,driverId:CU.id})});
    CU.totalDeliveries=(data.totalDeliveries||0);
    CU.taxiColor='green'; CU.status='online';
    toast('ok',`تم التوصيل! 🎉`,`إجمالي: ${CU.totalDeliveries} توصيلة`); playSound('accept');
    const b=$('drvStatusBadge'); if(b) b.innerHTML=getStatusBadge(CU);
    const db=document.querySelector('.deliv-badge'); if(db) db.innerHTML=`<i class="fas fa-box"></i> ${CU.totalDeliveries} توصيلة`;
  } catch(err){toast('err','خطأ',err.message||'');}
};

window.quickDoneDelivery = async () => {
  if(!CU) return;
  try {
    const data=await apiFetch(`/api/requests/active?tenantId=${TENANT_ID}&driverId=${CU.id}`);
    if(!data.request) return toast('warn','لا يوجد طلب نشط','');
    const req=data.request;
    if(!confirm(`تأكيد إتمام التوصيل؟\n📞 ${req.phone||''}\n📍 ${(req.details||'').substring(0,50)}`)) return;
    await doneDelivery(req.id);
  } catch(err){toast('warn','لا يوجد طلب نشط','');}
};

window.drvAct = async t => {
  const msgs={start:'🟢 بدأت شيفتي',end:'🔴 انتهيت من الشيفت',break:'☕ في استراحة',pray:'🕌 ذاهب للصلاة'};
  const statusMap={start:'online',end:'offline',break:'break',pray:'pray'};
  if(statusMap[t]) await updStatus(statusMap[t]);
  try {
    if(t==='start'){
      const data=await apiFetch('/api/drivers/shift/start',{method:'POST',body:JSON.stringify({driverId:CU.id,tenantId:TENANT_ID})});
      shiftStartTime=data.shiftStart||Date.now(); CU.shiftStart=shiftStartTime;
      playSound('shift'); toast('ok','بدأ الشيفت 🟢','');
    } else if(t==='end'){
      if(!shiftStartTime) return toast('warn','لا يوجد شيفت نشط','');
      const data=await apiFetch('/api/drivers/shift/end',{method:'POST',body:JSON.stringify({driverId:CU.id,tenantId:TENANT_ID})});
      const dur=Math.round(((data.shiftEnd||Date.now())-shiftStartTime)/60000);
      shiftStartTime=null; stopGPS();
      toast('ok','انتهى الشيفت 🏁',`مدة: ${dur} دقيقة`);
    } else {
      await apiFetch('/api/notifications',{method:'POST',body:JSON.stringify({tenantId:TENANT_ID,type:'info',msg:`${msgs[t]} — ${CU.name}`})});
      toast('ok','تم الإرسال ✅','');
    }
  } catch(err){toast('err','خطأ',err.message||'');}
  const b=$('drvStatusBadge'); if(b) b.innerHTML=getStatusBadge(CU);
};

window.sendExcuse = async () => {
  const e=($('custom-excuse').value||'').trim(); if(!e) return;
  try { await apiFetch('/api/notifications',{method:'POST',body:JSON.stringify({tenantId:TENANT_ID,type:'info',msg:`📝 ${e} — ${CU.name}`})}); } catch(err){}
  $('custom-excuse').value=''; toast('ok','تم الإرسال','');
};

window.doDriverSOS = async () => {
  if(!confirm('إرسال نداء طوارئ للمشرف؟')) return;
  try { await apiFetch('/api/notifications',{method:'POST',body:JSON.stringify({tenantId:TENANT_ID,type:'sos',msg:`🆘 SOS! السائق ${CU.name} يحتاج مساعدة!`,urgent:true})}); } catch(err){}
  vibrate([500,100,500,100,500]); playSound('sos'); toast('err','🆘 SOS أُرسل','');
};

/* ══════════════════════════════════════════════════
   SUPERVISOR REQUESTS VIEW
   ══════════════════════════════════════════════════ */
const renderSupReqs = () => {
  $('dbody').innerHTML=`
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

  onDriversUpdate(()=>updateStatsUI()); updateStatsUI();

  /* خريطة مصغرة */
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const el=$('reqMapInline'); if(!el)return;
    try {
      const inlineMap=L.map('reqMapInline',{zoomControl:false,scrollWheelZoom:false}).setView([32.31,35.03],11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'',maxZoom:19}).addTo(inlineMap);
      window._inlineMap=inlineMap; window._inlineMarkers={};
      const refreshInline=()=>{
        if(!window._inlineMap)return;
        Object.entries(allDrvs).forEach(([id,d])=>{
          if(!d.lat||!d.lng)return;
          const cs=getTCS(d);
          const ic=L.divIcon({html:`<div class="drv-marker-wrap"><div class="drv-marker" style="border-color:${cs.border}">🚕</div><div class="drv-marker-name">${d.name} ${cs.emoji}</div></div>`,className:'',iconSize:[50,50],iconAnchor:[25,50]});
          if(window._inlineMarkers[id]){window._inlineMarkers[id].setLatLng([d.lat,d.lng]);window._inlineMarkers[id].setIcon(ic);}
          else{window._inlineMarkers[id]=L.marker([d.lat,d.lng],{icon:ic}).addTo(inlineMap).bindPopup(`<div style="font-family:Cairo,sans-serif;font-size:12px;text-align:center"><b>${d.name}</b><br><span style="color:${cs.dot}">${cs.label}</span></div>`);}
        });
      };
      refreshInline();
      onDriversUpdate(()=>{if(!window._inlineMap)return;refreshInline();});
    } catch(e){}
  }));
};

/* ══ SUPERVISOR ACTIONS ══ */
let _addReqBusy=false;
window.addReqItem = async () => {
  if(_addReqBusy) return;
  const phone=($('req-phone').value||'').trim();
  const details=($('req-details').value||'').trim();
  if(!phone||!details) return shAl('al-req','err','يرجى ملء جميع الحقول');
  if(!/^[0-9+]{7,15}$/.test(phone.replace(/\s/g,''))) return shAl('al-req','err','رقم الهاتف غير صحيح');
  _addReqBusy=true;
  const btn=$('MaddReq').querySelector('.bp'), origText=btn?btn.innerHTML:'';
  if(btn){btn.innerHTML='<span class="spin"></span> جار...';btn.disabled=true;}
  try {
    await apiFetch('/api/requests',{method:'POST',body:JSON.stringify({phone,details,tenantId:TENANT_ID,addedBy:CU?.name||'المشرف'})});
    $('req-phone').value=''; $('req-details').value='';
    toast('ok','✅ تم إضافة الطلب',''); playSound('notif'); CM('MaddReq');
  } catch(err){shAl('al-req','err',err.data?.error||err.message||'خطأ');}
  finally{if(btn){btn.innerHTML=origText;btn.disabled=false;}setTimeout(()=>{_addReqBusy=false;},1000);}
};

window.delRecvItem  = async id => { if(!confirm('حذف هذا الطلب؟'))return; try{await apiFetch(`/api/requests/${id}`,{method:'DELETE',body:JSON.stringify({tenantId:TENANT_ID})});toast('ok','تم الحذف','');}catch(err){toast('err','خطأ',err.message||'');} };
window.openEditReq  = (id,phone,details) => {
  $('editreq-id').value=id; $('editreq-phone').value=phone.replace(/&#39;/g,"'"); $('editreq-details').value=details.replace(/&#39;/g,"'");
  $('editReqOldData').innerHTML=`<div style="background:var(--red-l);border:1px solid var(--red-m);border-radius:var(--r);padding:9px;font-size:12px;margin-bottom:10px"><div style="font-size:10px;font-weight:700;color:var(--red);margin-bottom:3px"><i class="fas fa-times-circle"></i> البيانات الحالية</div><div>${esc(phone.replace(/&#39;/g,"'"))} • ${esc(details.replace(/&#39;/g,"'"))}</div></div>`;
  OM('MeditReq');
};
window.saveReqEdit  = async () => {
  const id=$('editreq-id').value, np=($('editreq-phone').value||'').trim(), nd=($('editreq-details').value||'').trim();
  if(!np||!nd) return shAl('al-editreq','err','يرجى ملء جميع الحقول');
  try {
    await apiFetch(`/api/requests/${id}`,{method:'PUT',body:JSON.stringify({phone:np,details:nd,tenantId:TENANT_ID,editedBy:CU.name})});
    CM('MeditReq'); toast('ok','تم التعديل',''); playSound('edit');
  } catch(err){shAl('al-editreq','err',err.data?.error||err.message||'خطأ');}
};
window.cancelReq = async id => {
  if(!confirm('إلغاء هذا الطلب؟'))return;
  try {
    await apiFetch(`/api/requests/${id}/cancel`,{method:'POST',body:JSON.stringify({tenantId:TENANT_ID,cancelledBy:CU.name})});
    toast('ok','تم الإلغاء',''); playSound('cancel');
  } catch(err){toast('err','خطأ',err.message||'');}
};
window.sendSosBroadcast = async () => {
  const msg=($('sos-sup-msg').value||'').trim(); if(!msg) return toast('warn','يرجى كتابة رسالة الطوارئ','');
  try {
    await apiFetch('/api/sos/broadcast',{method:'POST',body:JSON.stringify({tenantId:TENANT_ID,msg,senderName:CU.name})});
    $('SosSupModal').classList.remove('on'); $('sos-sup-msg').value='';
    toast('err','🆘 SOS أُرسل لجميع السائقين',''); playSound('sos'); vibrate([400,100,400,100,400]);
  } catch(err){toast('err','خطأ',err.message||'');}
};

/* ══ GPS MAP MODAL ══ */
window.showUserGpsOnMap = (reqId,lat,lng,phone) => {
  const old=document.getElementById('user-gps-modal'); if(old)old.remove();
  const modal=document.createElement('div'); modal.id='user-gps-modal';
  modal.style.cssText='position:fixed;inset:0;z-index:7000;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px';
  modal.innerHTML=`<div style="background:var(--bg-card);border-radius:16px;width:100%;max-width:500px;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,.5)">
    <div style="padding:14px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border)">
      <div style="font-weight:800;font-size:14px;color:var(--text);display:flex;align-items:center;gap:8px"><i class="fas fa-map-location-dot" style="color:var(--green)"></i>موقع الزبون — ${phone}</div>
      <button onclick="document.getElementById('user-gps-modal').remove()" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:18px;padding:4px">✕</button>
    </div>
    <div id="ugps-map" style="height:320px"></div>
    <div style="padding:10px 14px;display:flex;gap:8px">
      <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" style="flex:1;padding:10px;background:var(--primary);border-radius:9px;color:#fff;font-size:12px;font-weight:700;text-align:center;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px"><i class="fas fa-map"></i> فتح Google Maps</a>
      <button onclick="document.getElementById('user-gps-modal').remove()" style="padding:10px 16px;background:var(--bg2);border:1px solid var(--border);border-radius:9px;color:var(--text2);font-size:12px;font-weight:700;cursor:pointer;font-family:'Cairo',sans-serif">إغلاق</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  setTimeout(()=>{
    try {
      const m=L.map('ugps-map',{zoomControl:true}).setView([lat,lng],16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(m);
      const icon=L.divIcon({html:`<div style="display:flex;flex-direction:column;align-items:center;gap:3px"><div style="width:20px;height:20px;background:#10B981;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(16,185,129,.3)"></div><div style="background:#10B981;color:#fff;font-size:10px;font-weight:800;padding:2px 8px;border-radius:5px;white-space:nowrap;font-family:Cairo,sans-serif">📍 ${phone}</div></div>`,className:'',iconSize:[80,45],iconAnchor:[40,20]});
      L.marker([lat,lng],{icon}).addTo(m).bindPopup(`<div style="font-family:Cairo,sans-serif;text-align:center;font-weight:700">📞 ${phone}</div>`).openPopup();
    } catch(e){}
  },200);
};

/* ══ SELECT TAXI ══ */
window.openTaxiSel = (reqId,phone,details,recvReqId='') => {
  selTaxiId=null; selReqData={id:reqId,phone:phone.replace(/&#39;/g,"'"),details:details.replace(/&#39;/g,"'"),recvReqId:recvReqId||reqId};
  const list=$('sel-taxi-list');
  const avail=Object.entries(allDrvs).sort(([,a],[,b])=>{const ao=getTCS(a).monCls==='st-online'?0:getTCS(a).monCls==='st-break'?1:2,bo=getTCS(b).monCls==='st-online'?0:getTCS(b).monCls==='st-break'?1:2;return ao-bo;});
  if(!avail.length){list.innerHTML='<div style="text-align:center;padding:20px;color:var(--text3)">لا يوجد سائقون</div>';$('SelTaxiModal').classList.add('on');return;}
  list.innerHTML=avail.map(([id,d])=>{const cs=getTCS(d);return`<div class="sel-taxi-item" id="stitem-${id}" onclick="selectTaxi('${id}')"><div style="width:40px;height:40px;border-radius:11px;border:2px solid ${cs.border};background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🚕</div><div style="flex:1"><div style="font-weight:800;font-size:13px;color:var(--text)">${esc(d.name)}</div><div style="font-size:11px;color:${cs.dot}">${cs.label}</div>${d.carNumber?`<div style="font-size:10px;color:var(--text4)">🚗 ${esc(d.carNumber)}</div>`:''}<span class="deliv-badge" style="font-size:10px;padding:2px 7px;margin-top:3px;display:inline-flex"><i class="fas fa-box"></i> ${d.totalDeliveries||0}</span></div><i class="fas fa-check-circle" id="stchk-${id}" style="display:none;color:var(--primary);font-size:18px"></i></div>`;}).join('');
  $('SelTaxiModal').classList.add('on'); $('confirmSelBtn').disabled=true; $('confirmSelBtn').style.opacity='.5';
};
window.selectTaxi = id => {
  if(selTaxiId){const p=$(`stitem-${selTaxiId}`);if(p)p.classList.remove('selected');const c=$(`stchk-${selTaxiId}`);if(c)c.style.display='none';}
  selTaxiId=id;
  const el=$(`stitem-${id}`);if(el)el.classList.add('selected');
  const chk=$(`stchk-${id}`);if(chk)chk.style.display='block';
  $('confirmSelBtn').disabled=false; $('confirmSelBtn').style.opacity='1';
};
window.closeTaxiSel = () => { $('SelTaxiModal').classList.remove('on'); selTaxiId=null; selReqData=null; };

let _sendBusy=false;
window.confirmTaxiSel = async () => {
  if(!selTaxiId||!selReqData||_sendBusy)return;
  const msg=prompt('رسالة للسائق (اختياري):',''); if(msg===null)return;
  _sendBusy=true;
  const btn=$('confirmSelBtn'); btn.innerHTML='<span class="spin"></span>'; btn.disabled=true; btn.style.opacity='.7';
  try {
    await apiFetch('/api/requests/assign',{method:'POST',body:JSON.stringify({
      requestId:selReqData.id, driverId:selTaxiId, tenantId:TENANT_ID,
      phone:selReqData.phone, details:selReqData.details,
      message:msg||null, sentBy:CU.name,
    })});
    toast('ok','تم إرسال الطلب للسائق 🚕',''); playSound('notif'); closeTaxiSel();
  } catch(err){toast('err','خطأ',err.message||'');}
  btn.innerHTML='<i class="fas fa-paper-plane"></i> إرسال'; btn.disabled=false; btn.style.opacity='1';
  setTimeout(()=>{_sendBusy=false;},1500);
};

/* ══════════════════════════════════════════════════
   FULL MAP — SUPERVISOR
   ══════════════════════════════════════════════════ */
const renderMapSup = () => {
  $('dbody').innerHTML=`
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
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const el=$('driverMap'); if(!el||leafletMap)return;
    try{
      leafletMap=L.map('driverMap',{zoomControl:true}).setView([32.31,35.03],12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:19}).addTo(leafletMap);
    }catch(e){return;}
    const refreshMap=()=>{
      if(!leafletMap)return;
      const ent=Object.entries(allDrvs);
      const upd=(id,v)=>{const e=$(id);if(e)e.textContent=v;};
      upd('mG',  ent.filter(([,d])=>getTCS(d).monCls==='st-online').length);
      upd('mO',  ent.filter(([,d])=>getTCS(d).monCls==='st-break').length);
      upd('mR',  ent.filter(([,d])=>getTCS(d).monCls==='st-busy').length);
      upd('mTot',ent.length);
      ent.forEach(([id,d])=>{if(d.lat&&d.lng)updateMapMarker(id,d);});
    };
    refreshMap(); onDriversUpdate(()=>{if(!leafletMap)return;refreshMap();});
  }));
};

const updateMapMarker = (id,d) => {
  if(!leafletMap)return;
  const cs=getTCS(d);
  const age=d.locUpdated?Date.now()-d.locUpdated:999999;
  const stale=age>300000?`<div style="background:#FEF2F2;color:#DC2626;font-size:8px;font-weight:700;padding:1px 5px;border-radius:4px;white-space:nowrap">⚠️ موقع قديم</div>`:'';
  const shiftLbl=d.shiftStart&&d.status!=='offline'?`<div class="drv-marker-time">⏱ ${fmtElapsed(Date.now()-d.shiftStart)}</div>`:'';
  const icon=L.divIcon({html:`<div class="drv-marker-wrap"><div class="drv-marker" style="border-color:${cs.border}">🚕</div><div class="drv-marker-name">${d.name} ${cs.emoji}</div>${shiftLbl}${stale}</div>`,className:'',iconSize:[60,72],iconAnchor:[30,72]});
  const pop=`<div style="text-align:center;padding:4px;min-width:140px;font-family:'Cairo',sans-serif">
    <div style="font-weight:800;font-size:13px;margin-bottom:4px">${d.name}</div>
    <div style="font-size:11px;color:${cs.dot}">${cs.label}</div>
    ${d.phone?`<div style="font-size:11px;color:var(--text3)">${d.phone}</div>`:''}
    <div style="font-size:11px;color:var(--primary);margin-top:3px;font-weight:700">📦 ${d.totalDeliveries||0} توصيلة</div>
    ${d.locUpdated?`<div style="font-size:10px;color:${age>300000?'var(--red)':'var(--text4)'};margin-top:2px">آخر تحديث: ${fmt(d.locUpdated)}</div>`:''}
    <a href="https://www.google.com/maps?q=${d.lat},${d.lng}" target="_blank" style="display:inline-block;margin-top:8px;padding:5px 12px;background:var(--primary);color:#fff;border-radius:7px;font-size:11px;text-decoration:none;font-family:Cairo,sans-serif">Google Maps</a>
  </div>`;
  if(mapMarkers[id]){mapMarkers[id].setLatLng([d.lat,d.lng]);mapMarkers[id].setIcon(icon);mapMarkers[id].getPopup()?.setContent(pop);}
  else{mapMarkers[id]=L.marker([d.lat,d.lng],{icon}).addTo(leafletMap).bindPopup(pop);}
};

/* ══════════════════════════════════════════════════
   NOTIFICATIONS TAB
   ══════════════════════════════════════════════════ */
const renderNotifs = async () => {
  $('dbody').innerHTML=`<div class="panel">
    <div class="atitle" style="justify-content:space-between">
      <span style="display:flex;align-items:center;gap:10px"><i class="fas fa-bell"></i> التنبيهات</span>
      <button onclick="clearAllNotifs()" style="padding:7px 14px;background:var(--red-l);border:1px solid var(--red-m);border-radius:9px;color:var(--red);font-size:11px;font-weight:700;cursor:pointer;font-family:'Cairo',sans-serif"><i class="fas fa-trash"></i> حذف الكل</button>
    </div>
    <div id="NLIST"><div style="text-align:center;padding:32px;color:var(--text4)"><div class="spin dark"></div></div></div>
  </div>`;
  try {
    const data=await apiFetch(`/api/notifications?tenantId=${TENANT_ID}&limit=100`);
    const list=$('NLIST'); if(!list)return;
    const notifs=data.notifications||[];
    const icMap={accept:'ni-green',reject:'ni-red',timeout:'ni-red',done:'ni-green',waiting:'ni-amber',near:'ni-amber',sos:'ni-red',cancel:'ni-red',edit:'ni-amber',info:'ni-blue',rating:'ni-green',user_request:'ni-green',new_driver:'ni-amber'};
    const icoMap={accept:'check',reject:'times',timeout:'clock',done:'flag-checkered',waiting:'hourglass-half',near:'map-pin',sos:'triangle-exclamation',cancel:'ban',edit:'pen',info:'info',rating:'star',user_request:'globe',new_driver:'user-plus'};
    if(!notifs.length){list.innerHTML='<div style="text-align:center;padding:32px;color:var(--text4)">لا يوجد تنبيهات</div>';return;}
    list.innerHTML=notifs.sort((a,b)=>(b.ts||0)-(a.ts||0)).map(n=>`<div class="notif-item ${n.read?'':'unread'}">
      <div class="notif-ic ${icMap[n.type]||'ni-blue'}"><i class="fas fa-${icoMap[n.type]||'bell'}"></i></div>
      <div class="notif-body"><div class="notif-title">${esc(n.msg||'')}</div>${n.reason?`<div class="notif-sub">السبب: ${esc(n.reason)}</div>`:''}<div class="notif-time">${fmt(n.ts||Date.now())}</div></div>
      <button class="notif-del-btn" onclick="delNotif('${n.id}')"><i class="fas fa-times"></i></button>
    </div>`).join('');
    const b=$('notif-badge');if(b)b.style.display='none';
    const mb=$('mob-notif-badge');if(mb)mb.style.display='none';
  } catch(e){const l=$('NLIST');if(l)l.innerHTML='<div style="text-align:center;padding:32px;color:var(--text4)">خطأ في تحميل التنبيهات</div>';}
};
window.delNotif = async nid => {
  try{await apiFetch(`/api/notifications/${nid}`,{method:'DELETE',body:JSON.stringify({tenantId:TENANT_ID})});}catch(e){}
  const el=document.getElementById('notif-'+nid)||document.querySelector(`[onclick*="${nid}"]`)?.closest('.notif-item');
  if(el)el.remove();
};
window.clearAllNotifs = async () => {
  if(!confirm('حذف كل التنبيهات؟'))return; if(!confirm('تأكيد نهائي؟'))return;
  try{await apiFetch('/api/notifications/clear',{method:'DELETE',body:JSON.stringify({tenantId:TENANT_ID})});toast('ok','تم الحذف','');}catch(e){}
  const l=$('NLIST');if(l)l.innerHTML='<div style="text-align:center;padding:32px;color:var(--text4)">لا يوجد تنبيهات</div>';
  const sn=$('supNotifList');if(sn)sn.innerHTML='<div style="text-align:center;padding:14px;color:var(--text4);font-size:12px">لا يوجد تنبيهات</div>';
};

/* ══════════════════════════════════════════════════
   APPROVALS TAB
   ══════════════════════════════════════════════════ */
const renderApprovals = () => {
  $('dbody').innerHTML=`<div class="panel"><div class="atitle"><i class="fas fa-user-check" style="color:var(--green)"></i> طلبات انضمام السائقين</div><div id="PENDING_LIST"><div style="text-align:center;padding:32px;color:var(--text4)"><div class="spin dark"></div></div></div></div>`;
  loadPendingDrivers();
};
const loadPendingDrivers = async () => {
  const list=$('PENDING_LIST'); if(!list)return;
  try {
    const data=await apiFetch(`/api/drivers?tenantId=${TENANT_ID}`);
    const all=data.drivers||[];
    const pending =all.filter(d=>d.approvalStatus==='pending');
    const approved=all.filter(d=>d.approvalStatus==='approved'||(!d.approvalStatus&&d.role==='driver'));
    const rejected=all.filter(d=>d.approvalStatus==='rejected');
    list.innerHTML=`
      ${pending.length>0?`<div style="margin-bottom:20px">
        <div style="font-family:'Tajawal',sans-serif;font-size:16px;font-weight:900;color:var(--amber);margin-bottom:12px"><i class="fas fa-clock"></i> ينتظر الموافقة (${pending.length})</div>
        ${pending.map(d=>`<div style="background:var(--bg);border:1.5px solid var(--amber-m);border-radius:var(--rl);padding:16px;margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
            <div style="width:48px;height:48px;border-radius:13px;background:var(--amber-l);border:2px solid var(--amber-m);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0">🚕</div>
            <div style="flex:1"><div style="font-size:14px;font-weight:800;color:var(--text)">${esc(d.name)}</div><div style="font-size:12px;color:var(--text3)">${esc(d.phone||'-')}</div><div style="font-size:11px;color:var(--text4)">🚗 ${esc(d.carNumber||'-')}</div></div>
          </div>
          <div style="display:flex;gap:8px">
            <button onclick="approveDriver('${d.id}')" style="flex:1;padding:10px;background:var(--green);border:none;border-radius:10px;color:#fff;font-size:13px;font-weight:800;cursor:pointer;font-family:'Cairo',sans-serif"><i class="fas fa-check"></i> قبول</button>
            <button onclick="rejectDriver('${d.id}','${eAt(d.name)}')" style="flex:1;padding:10px;background:var(--red-l);border:1px solid var(--red-m);border-radius:10px;color:var(--red);font-size:13px;font-weight:800;cursor:pointer;font-family:'Cairo',sans-serif"><i class="fas fa-times"></i> رفض</button>
          </div>
        </div>`).join('')}
      </div>`:''}
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px">
        <div style="flex:1;min-width:100px;background:var(--green-l);border:1.5px solid var(--green-m);border-radius:var(--rl);padding:16px;text-align:center"><div style="font-size:28px;font-weight:900;color:var(--green)">${approved.length}</div><div style="font-size:12px;color:var(--text3);margin-top:4px">✅ مقبولون</div></div>
        <div style="flex:1;min-width:100px;background:var(--amber-l);border:1.5px solid var(--amber-m);border-radius:var(--rl);padding:16px;text-align:center"><div style="font-size:28px;font-weight:900;color:var(--amber)">${pending.length}</div><div style="font-size:12px;color:var(--text3);margin-top:4px">⏳ معلقون</div></div>
        <div style="flex:1;min-width:100px;background:var(--red-l);border:1.5px solid var(--red-m);border-radius:var(--rl);padding:16px;text-align:center"><div style="font-size:28px;font-weight:900;color:var(--red)">${rejected.length}</div><div style="font-size:12px;color:var(--text3);margin-top:4px">❌ مرفوضون</div></div>
      </div>`;
  } catch(e){list.innerHTML='<div style="text-align:center;padding:40px;color:var(--text4)">خطأ في تحميل البيانات</div>';}
};
window.approveDriver = async drvId => {
  if(!confirm('قبول هذا السائق؟'))return;
  try{
    await apiFetch(`/api/drivers/${drvId}/approve`,{method:'POST',body:JSON.stringify({tenantId:TENANT_ID,approvedBy:CU.name})});
    toast('ok','تم قبول السائق ✅',''); playSound('accept'); loadPendingDrivers();
  }catch(err){toast('err','خطأ',err.message||'');}
};
window.rejectDriver = async (drvId,drvName) => {
  const reason=prompt(`سبب رفض "${drvName}" (اختياري):`,''); if(reason===null)return;
  try{
    await apiFetch(`/api/drivers/${drvId}/reject`,{method:'POST',body:JSON.stringify({tenantId:TENANT_ID,rejectedBy:CU.name,reason:reason||'-'})});
    toast('info','تم الرفض',''); loadPendingDrivers();
  }catch(err){toast('err','خطأ',err.message||'');}
};

/* ══════════════════════════════════════════════════
   ACCOUNTS TAB
   ══════════════════════════════════════════════════ */
const renderAccs = () => {
  $('dbody').innerHTML=`<div class="panel">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <div class="atitle" style="margin-bottom:0;flex:1"><i class="fas fa-users"></i> إدارة السائقين</div>
      <input type="text" id="drv-search" placeholder="🔍 بحث..." style="padding:9px 14px;border:1.5px solid var(--border);border-radius:var(--r);font-size:13px;font-family:'Cairo',sans-serif;outline:none;min-width:180px" oninput="filterDrvAccs(this.value)">
    </div>
    <div class="acc-grid" id="ALIST"><div style="text-align:center;padding:32px;color:var(--text4);grid-column:1/-1"><div class="spin dark"></div></div></div>
  </div>`;
  requestAnimationFrame(loadAccs);
};
const loadAccs = async () => {
  const list=$('ALIST'); if(!list)return;
  try {
    const data=await apiFetch(`/api/drivers?tenantId=${TENANT_ID}`);
    const all=data.drivers||[];
    if(!$('ALIST'))return;
    if(!all.length){list.innerHTML='<div style="color:var(--text3);text-align:center;padding:32px;grid-column:1/-1">لا يوجد سائقون</div>';return;}
    list.innerHTML=all.map(d=>{
      const cst=getTCS(d);
      const statusBadge=d.approvalStatus==='pending'?`<span style="background:var(--amber-l);color:var(--amber);border:1px solid var(--amber-m);border-radius:20px;padding:2px 8px;font-size:10px;font-weight:700">⏳ ينتظر</span>`:d.approvalStatus==='rejected'?`<span style="background:var(--red-l);color:var(--red);border:1px solid var(--red-m);border-radius:20px;padding:2px 8px;font-size:10px;font-weight:700">❌ مرفوض</span>`:`<span style="background:var(--green-l);color:var(--green);border:1px solid var(--green-m);border-radius:20px;padding:2px 8px;font-size:10px;font-weight:700">✅ مقبول</span>`;
      return `<div class="acccard"><div class="acctop"><div class="accav">🚕</div><div style="flex:1;min-width:0"><div class="accnm">${esc(d.name)}</div><div class="accph"><i class="fas fa-phone"></i> ${esc(d.phone||d.id)}</div><div class="accph"><i class="fas fa-car"></i> ${esc(d.carNumber||'-')}</div><div style="margin-top:3px;display:flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:${cst.dot}"><div style="width:7px;height:7px;border-radius:50%;background:${cst.dot}"></div>${cst.label}</div><div style="margin-top:3px">${statusBadge}</div><div style="margin-top:4px"><span class="deliv-badge" style="font-size:10px;padding:2px 7px"><i class="fas fa-box"></i> ${d.totalDeliveries||0} توصيلة</span></div></div></div>
      <div class="accbts"><button class="accbtn aedit" onclick="opnEac('${d.id}','${eAt(d.name)}')"><i class="fas fa-pen"></i> تعديل</button><button class="accbtn adel" onclick="delAcc('${d.id}')"><i class="fas fa-trash"></i> حذف</button></div></div>`;
    }).join('');
  } catch(err){if($('ALIST'))$('ALIST').innerHTML=`<div style="color:var(--red);text-align:center;padding:32px;grid-column:1/-1">خطأ: ${err.message||''}</div>`;}
};
window.filterDrvAccs = q => {
  q=q.toLowerCase().trim();
  document.querySelectorAll('#ALIST .acccard').forEach(c=>{c.style.display=(!q||c.innerText.toLowerCase().includes(q))?'':'none';});
};
window.opnEac = (id,nm) => {
  $('eac-id').value=id; $('eac-nm').value=nm.replace(/&#39;/g,"'").replace(/&quot;/g,'"');
  $('eac-pw').value=''; $('eacsub').textContent='السائق: '+nm.replace(/&#39;/g,"'"); OM('Meditacc');
};
window.saveEac = async () => {
  const id=$('eac-id').value, nm=($('eac-nm').value||'').trim(), pw=$('eac-pw').value||'';
  if(!nm) return shAl('al-eac','err','الاسم مطلوب');
  const btn=$('Meditacc').querySelector('.ba'), orig=btn.innerHTML;
  btn.innerHTML='<span class="spin"></span>'; btn.disabled=true;
  try{
    await apiFetch(`/api/drivers/${id}`,{method:'PUT',body:JSON.stringify({tenantId:TENANT_ID,name:nm,...(pw?{password:pw}:{})})});
    CM('Meditacc'); toast('ok','تم التعديل ✅',''); loadAccs();
  }catch(err){shAl('al-eac','err',err.data?.error||err.message||'خطأ');}
  btn.innerHTML=orig; btn.disabled=false;
};
window.delAcc = async id => {
  const sn=allDrvs[id]; const nm=sn?sn.name:id;
  if(!confirm(`حذف حساب "${nm}"؟`))return;
  try{await apiFetch(`/api/drivers/${id}`,{method:'DELETE',body:JSON.stringify({tenantId:TENANT_ID})});toast('ok','تم الحذف','');loadAccs();}
  catch(err){toast('err','خطأ',err.message||'');}
};

/* ══════════════════════════════════════════════════
   REPORTS
   ══════════════════════════════════════════════════ */
const renderDriverReports = async () => {
  $('dbody').innerHTML=`<div class="panel"><div class="atitle"><i class="fas fa-chart-bar"></i> تقاريري</div><div id="DREP"><div style="text-align:center;padding:32px;color:var(--text4)"><div class="spin dark"></div></div></div></div>`;
  try {
    const data=await apiFetch(`/api/reports/driver/${CU.id}?tenantId=${TENANT_ID}`);
    const td=data.today||{deliveries:0,shifts:[]};
    const shifts=td.shifts||[];
    let totalMin=0;
    const shiftRows=shifts.map((s,i)=>{
      const sf=s.start?new Date(s.start).toLocaleTimeString('ar',{hour:'2-digit',minute:'2-digit'}):'-';
      const ef=s.end?new Date(s.end).toLocaleTimeString('ar',{hour:'2-digit',minute:'2-digit'}):'جارٍ';
      const dur=s.durationMin||(s.end?Math.round((s.end-s.start)/60000):s.start?Math.round((Date.now()-s.start)/60000):0);
      totalMin+=dur;
      return `<div class="report-stat"><span class="report-stat-label">شيفت ${i+1}: ${sf} — ${ef}</span><span class="report-stat-val" style="color:var(--amber)">${Math.floor(dur/60)}س ${dur%60}د</span></div>`;
    }).join('');
    const list=$('DREP'); if(!list)return;
    list.innerHTML=`<div class="report-card">
      <div class="report-title"><i class="fas fa-calendar-day"></i> تقرير اليوم</div>
      <div class="report-stat"><span class="report-stat-label">توصيلات اليوم</span><span class="report-stat-val">${td.deliveries||0} 📦</span></div>
      <div class="report-stat"><span class="report-stat-label">إجمالي التوصيلات</span><span class="report-stat-val" style="color:var(--primary)">${CU.totalDeliveries||0} 📦</span></div>
      <div class="report-stat"><span class="report-stat-label">إجمالي العمل اليوم</span><span class="report-stat-val" style="color:var(--primary)">${Math.floor(totalMin/60)}س ${totalMin%60}د</span></div>
      <div class="report-stat"><span class="report-stat-label">عدد الشيفتات</span><span class="report-stat-val">${shifts.length}</span></div>
      ${shiftStartTime?`<div class="report-stat"><span class="report-stat-label">⏱ الشيفت الحالي</span><span class="report-stat-val" style="color:var(--green)" id="liveTimer">${fmtElapsed(Date.now()-shiftStartTime)}</span></div>`:''}
    </div>${shifts.length?`<div class="report-card"><div class="report-title"><i class="fas fa-clock"></i> تفصيل الشيفتات</div>${shiftRows}</div>`:''}`;
    if(shiftStartTime)setInterval(()=>{const e=$('liveTimer');if(e&&shiftStartTime)e.textContent=fmtElapsed(Date.now()-shiftStartTime);},1000);
  } catch(e){const l=$('DREP');if(l)l.innerHTML='<div style="text-align:center;padding:32px;color:var(--text4)">خطأ في تحميل التقرير</div>';}
};

const renderSupReports = async () => {
  $('dbody').innerHTML=`<div class="panel"><div class="atitle"><i class="fas fa-chart-bar"></i> تقارير السائقين</div><div id="SREP"><div style="text-align:center;padding:32px;color:var(--text4)"><div class="spin dark"></div></div></div></div>`;
  try {
    const data=await apiFetch(`/api/reports/supervisor?tenantId=${TENANT_ID}`);
    const all=data.drivers||[];
    const summary=data.summary||{};
    const list=$('SREP'); if(!list)return;
    const fmtMin=m=>`${Math.floor(m/60)}س ${m%60}د`;
    list.innerHTML=`
    <div class="report-card">
      <div class="report-title"><i class="fas fa-globe"></i> ملخص اليوم</div>
      <div class="report-stat"><span class="report-stat-label">إجمالي السائقين</span><span class="report-stat-val">${all.length}</span></div>
      <div class="report-stat"><span class="report-stat-label">متاح الآن 🟢</span><span class="report-stat-val" style="color:var(--green)">${summary.online||0}</span></div>
      <div class="report-stat"><span class="report-stat-label">مشغول الآن 🔴</span><span class="report-stat-val" style="color:var(--red)">${summary.busy||0}</span></div>
      <div class="report-stat"><span class="report-stat-label">توصيلات اليوم</span><span class="report-stat-val">${summary.todayDeliveries||0} 📦</span></div>
      <div class="report-stat"><span class="report-stat-label">إجمالي التوصيلات</span><span class="report-stat-val" style="color:var(--primary)">${summary.totalDeliveries||0} 📦</span></div>
      ${summary.avgRating?`<div class="report-stat"><span class="report-stat-label">متوسط التقييمات ⭐</span><span class="report-stat-val" style="color:var(--amber)">${summary.avgRating.toFixed(1)} / 5 (${summary.ratingCount} تقييم)</span></div>`:''}
    </div>
    <div class="report-card">
      <div class="report-title"><i class="fas fa-list"></i> تفصيل كل سائق</div>
      ${all.map(d=>{const cst=getTCS(d);return`<div class="report-drv-card"><div style="display:flex;align-items:center;gap:10px">
        <div style="width:44px;height:44px;border-radius:12px;background:var(--bg3);border:2px solid ${cst.border};display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🚕</div>
        <div style="flex:1;min-width:0"><div style="font-weight:800;font-size:13px;color:var(--text)">${esc(d.name)}</div><div style="font-size:11px;color:${cst.dot}">${cst.label}</div>${d.shiftStart&&d.status!=='offline'?`<div style="font-size:11px;color:var(--green)">⏱ ${fmtElapsed(Date.now()-d.shiftStart)}</div>`:''}</div>
        <div style="text-align:center;flex-shrink:0">
          <div style="font-size:16px;font-weight:900;color:var(--green)">${d.todayDeliveries||0}</div><div style="font-size:9px;color:var(--text4)">اليوم</div>
          <div style="font-size:14px;font-weight:900;color:var(--primary);margin-top:3px">${d.totalDeliveries||0}</div><div style="font-size:9px;color:var(--text4)">الكلي</div>
          <div style="font-size:12px;font-weight:800;color:var(--amber);margin-top:3px">${fmtMin(d.workMinutes||0)}</div><div style="font-size:9px;color:var(--text4)">عمل</div>
        </div>
      </div></div>`;}).join('')}
    </div>`;
  } catch(e){const l=$('SREP');if(l)l.innerHTML='<div style="text-align:center;padding:32px;color:var(--text4)">خطأ في تحميل التقارير</div>';}
};

/* ══════════════════════════════════════════════════
   SUPPORT
   ══════════════════════════════════════════════════ */
const renderSupport = async role => {
  $('dbody').innerHTML=`<div class="panel">
    <div class="atitle"><i class="fas fa-headset"></i> الدعم الفني</div>
    ${role==='supervisor'?`<div style="margin-bottom:16px;padding:14px;background:var(--red-l);border:1.5px solid var(--red-m);border-radius:var(--rl);display:flex;align-items:center;gap:12px"><div style="width:44px;height:44px;border-radius:12px;background:var(--red);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🆘</div><div style="flex:1"><div style="font-weight:800;font-size:14px;color:var(--red)">إرسال SOS لجميع السائقين</div></div><button style="padding:10px 18px;background:var(--red);border:none;border-radius:var(--r);color:#fff;font-size:13px;font-weight:800;cursor:pointer;font-family:'Cairo',sans-serif" onclick="OM('SosSupModal')"><i class="fas fa-triangle-exclamation"></i> SOS</button></div>`:''}
    <div style="background:var(--red-l);border:1.5px solid var(--red-m);border-radius:var(--rl);padding:14px;margin-bottom:16px;display:flex;align-items:center;gap:12px"><div style="width:44px;height:44px;border-radius:12px;background:var(--red);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🐛</div><div style="flex:1"><div style="font-weight:800;font-size:14px;color:var(--red)">الإبلاغ عن مشكلة</div><div style="font-size:12px;color:var(--text3)">ساعدنا في تحسين المنصة</div></div><button onclick="reportBug()" style="padding:10px 16px;background:var(--red);border:none;border-radius:var(--r);color:#fff;font-size:12px;font-weight:800;cursor:pointer;font-family:'Cairo',sans-serif"><i class="fas fa-bug"></i> إبلاغ</button></div>
    <div class="support-grid" id="SLIST"><div style="text-align:center;padding:32px;color:var(--text4);grid-column:1/-1"><div class="spin dark"></div></div></div>
  </div>`;
  try {
    const data=await apiFetch(`/api/drivers?tenantId=${TENANT_ID}&approved=true`);
    const drivers=data.drivers||[];
    let all=[];
    if(role==='driver'){
      try{const sup=await apiFetch(`/api/supervisors?tenantId=${TENANT_ID}`);(sup.supervisors||[]).forEach(s=>all.unshift({...s,isSuper:true}));}catch(e){}
      drivers.filter(d=>d.id!==CU?.id).forEach(d=>all.push(d));
    } else { all=drivers; }
    const list=$('SLIST'); if(!list)return;
    if(!all.length){list.innerHTML=`<div style="text-align:center;padding:32px;color:var(--text4);grid-column:1/-1">لا يوجد جهات اتصال</div>`;return;}
    list.innerHTML=all.map(d=>{
      const phone=(d.phone||'').replace(/[^0-9]/g,'').replace(/^0/,'972');
      const waLink=`https://wa.me/${phone}`;
      const c=d.isSuper?{dot:'#D97706',label:'👨‍💼 المشرف'}:getTCS(d);
      return `<div class="support-drv-card"><div style="width:52px;height:52px;border-radius:14px;background:var(--bg2);border:2px solid ${c.dot};display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0">${d.isSuper?'👨‍💼':'🚕'}</div><div style="flex:1;min-width:0"><div class="support-drv-name">${esc(d.name)}</div><div class="support-drv-phone" style="color:${c.dot}">${c.label}</div>${d.phone?`<div style="font-size:11px;color:var(--text4)">${d.phone}</div>`:''}</div><a href="${waLink}" target="_blank" class="support-wa-btn"><i class="fab fa-whatsapp"></i> واتساب</a></div>`;
    }).join('');
  } catch(e){const l=$('SLIST');if(l)l.innerHTML='<div style="text-align:center;padding:32px;color:var(--text4);grid-column:1/-1">خطأ في التحميل</div>';}
};
window.reportBug = async () => {
  const msg=prompt('صف المشكلة التي واجهتها:',''); if(!msg||!msg.trim())return;
  window.open(`https://wa.me/972595125423?text=${encodeURIComponent(`🐛 بلاغ مشكلة:\n${msg.trim()}`)}`, '_blank');
  try{await apiFetch('/api/errors',{method:'POST',body:JSON.stringify({tenantId:TENANT_ID,msg:msg.trim(),userId:CU?.id||'anon',role:CR||'unknown'})});}catch(e){}
  toast('ok','✅ تم فتح واتساب','');
};

/* ══════════════════════════════════════════════════
   PROFILES
   ══════════════════════════════════════════════════ */
const renderDProfile = () => {
  $('dbody').innerHTML=`<div class="ptab">
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
  const nm=($('ep-nm').value||'').trim(), pw=$('ep-pw').value||'', car=($('ep-car').value||'').trim();
  if(!nm) return toast('err','الاسم مطلوب','');
  try{
    await apiFetch(`/api/drivers/${CU.id}`,{method:'PUT',body:JSON.stringify({tenantId:TENANT_ID,name:nm,...(pw?{password:pw}:{}),...(car?{carNumber:car}:{})})});
    CU={...CU,name:nm,...(car?{carNumber:car}:{})}; toast('ok','تم الحفظ ✅','');
  }catch(err){toast('err','خطأ',err.message||'');}
};
window.delMyAcc = async () => {
  if(!confirm('حذف حسابك نهائياً؟'))return;
  try{await apiFetch(`/api/drivers/${CU.id}`,{method:'DELETE',body:JSON.stringify({tenantId:TENANT_ID})});toast('info','تم الحذف','');setTimeout(()=>logout(),1200);}
  catch(err){toast('err','خطأ',err.message||'');}
};

const renderSProfile = async () => {
  const info=TENANT_INFO||{name:'-'};
  let inviteCode='';
  try{const data=await apiFetch(`/api/tenants/${TENANT_ID}/invite`);inviteCode=data.inviteCode||'';}catch(e){inviteCode=`INV-${TENANT_ID.toUpperCase()}`;}
  $('dbody').innerHTML=`<div class="ptab">
    <div class="cbox" style="text-align:center">
      <div class="pav" style="width:84px;height:84px;margin:0 auto 12px;font-size:32px;border-color:var(--amber)">👨‍💼</div>
      <div style="font-size:17px;font-weight:900;margin-bottom:6px">${esc(CU.name)}</div>
      <span class="sbadge sb-amber">👨‍💼 مشرف المكتب</span>
      <div style="margin-top:10px;padding:12px;background:var(--primary-l);border:1.5px solid var(--primary-m);border-radius:var(--r);text-align:right">
        <div style="font-size:11px;color:var(--text3);margin-bottom:4px">🏢 المكتب</div>
        <div style="font-size:14px;font-weight:800;color:var(--text)">${esc(info.name)}</div>
      </div>
      ${inviteCode?`<div style="margin-top:8px;padding:12px;background:linear-gradient(135deg,#D97706,#B45309);border-radius:var(--r);text-align:center">
        <div style="font-size:10px;color:rgba(255,255,255,.7);margin-bottom:4px">🎟️ كود دعوة السائقين</div>
        <div style="font-size:18px;font-weight:900;color:#fff;letter-spacing:3px;font-family:monospace;direction:ltr">${inviteCode}</div>
        <div style="font-size:10px;color:rgba(255,255,255,.5);margin-top:4px">أعطِ هذا الكود للسائقين الجدد</div>
        <button onclick="navigator.clipboard.writeText('${inviteCode}').then(()=>toast('ok','✅ تم النسخ',''))" style="margin-top:8px;padding:5px 12px;background:rgba(255,255,255,.2);border:none;border-radius:8px;color:#fff;font-size:11px;cursor:pointer"><i class="fas fa-copy"></i> نسخ</button>
      </div>`:''}
    </div>
    <div class="cbox">
      <div class="atitle" style="margin-bottom:14px"><i class="fas fa-user-pen"></i> تعديل بياناتي</div>
      <div class="fg"><label class="fl"><i class="fas fa-user"></i> الاسم</label><input class="fi" id="sp-nm" value="${esc(CU.name)}"></div>
      <button class="ba" onclick="saveSProf()"><i class="fas fa-save"></i> حفظ التعديلات</button>
    </div>
    <div class="cbox">
      <div class="atitle" style="margin-bottom:14px"><i class="fas fa-map-location-dot" style="color:var(--green)"></i> موقع مكتبك على خريطة المستخدمين</div>
      <div style="font-size:12px;color:var(--text3);margin-bottom:10px;padding:10px;background:var(--green-l);border:1px solid var(--green-m);border-radius:var(--r)"><i class="fas fa-info-circle" style="color:var(--green)"></i> اضغط على الخريطة لتحديد موقع مكتبك</div>
      <div id="officeLocMap"></div>
      <div id="officeLocInfo" style="font-size:12px;color:var(--text3);margin-bottom:10px;padding:8px;background:var(--bg2);border-radius:var(--r);border:1px solid var(--border)"><i class="fas fa-map-pin" style="color:var(--amber);margin-left:5px"></i><span id="officeLocText">لم يتم تحديد موقع بعد</span></div>
      <div class="fg"><label class="fl"><i class="fas fa-store"></i> اسم المكتب للعرض العام</label><input type="text" class="fi" id="office-display-name" placeholder="مثال: مكتب تاكسي المركز"></div>
      <div class="fg"><label class="fl"><i class="fas fa-info-circle"></i> وصف المكتب (اختياري)</label><input type="text" class="fi" id="office-desc" placeholder="مثال: يعمل 24 ساعة • طولكرم"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button onclick="saveOfficeLocation()" style="flex:1;padding:11px;background:var(--green);border:none;border-radius:var(--r);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:'Cairo',sans-serif"><i class="fas fa-save"></i> حفظ الموقع</button>
        <button onclick="hideOfficeFromMap()" style="flex:1;padding:11px;background:var(--red-l);border:1px solid var(--red-m);border-radius:var(--r);color:var(--red);font-size:13px;font-weight:700;cursor:pointer;font-family:'Cairo',sans-serif"><i class="fas fa-eye-slash"></i> إخفاء من الخريطة</button>
      </div>
    </div>
  </div>`;
  setTimeout(()=>initOfficeLocMap(),600);
};
window.saveSProf = async () => {
  const nm=($('sp-nm').value||'').trim(); if(!nm)return toast('err','الاسم مطلوب','');
  try{await apiFetch(`/api/supervisors/${CU.id}`,{method:'PUT',body:JSON.stringify({tenantId:TENANT_ID,name:nm})});CU={...CU,name:nm};toast('ok','تم الحفظ ✅','');}
  catch(err){toast('err','خطأ',err.message||'');}
};

/* ══ OFFICE LOCATION MAP ══ */
const initOfficeLocMap = async () => {
  try{
    const data=await apiFetch(`/api/offices/${TENANT_ID}`);
    if(data.office){
      _officeLocLat=data.office.lat; _officeLocLng=data.office.lng;
      const el=$('office-display-name');if(el)el.value=data.office.displayName||'';
      const el2=$('office-desc');if(el2)el2.value=data.office.desc||'';
      const txt=$('officeLocText');if(txt)txt.textContent=`✅ موقع محدد: ${data.office.lat?.toFixed(5)}, ${data.office.lng?.toFixed(5)} — ${data.office.displayName||''}`;
    }
  }catch(e){}
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const el=$('officeLocMap'); if(!el)return;
    if(_officeLocMap){try{_officeLocMap.remove();}catch(e){}}
    const center=_officeLocLat?[_officeLocLat,_officeLocLng]:[32.31,35.03];
    try{
      _officeLocMap=L.map('officeLocMap',{zoomControl:true}).setView(center,15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:19}).addTo(_officeLocMap);
      if(_officeLocLat){
        _officeLocMarker=L.marker([_officeLocLat,_officeLocLng],{draggable:true}).addTo(_officeLocMap).bindPopup('<div style="font-family:Cairo,sans-serif;font-size:13px;text-align:center;font-weight:700">📍 موقع مكتبك الحالي</div>').openPopup();
        _officeLocMarker.on('dragend',e=>{const pos=e.target.getLatLng();_officeLocLat=pos.lat;_officeLocLng=pos.lng;const txt=$('officeLocText');if(txt)txt.textContent=`📍 موقع محدد: ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;});
      }
      _officeLocMap.on('click',e=>{
        _officeLocLat=e.latlng.lat; _officeLocLng=e.latlng.lng;
        if(_officeLocMarker)_officeLocMarker.setLatLng(e.latlng);
        else{_officeLocMarker=L.marker(e.latlng,{draggable:true}).addTo(_officeLocMap).bindPopup('<div style="font-family:Cairo,sans-serif;font-size:13px;text-align:center;font-weight:700">📍 موقع مكتبك</div>').openPopup();_officeLocMarker.on('dragend',ev=>{const pos=ev.target.getLatLng();_officeLocLat=pos.lat;_officeLocLng=pos.lng;const txt=$('officeLocText');if(txt)txt.textContent=`📍 موقع محدد: ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;});}
        const txt=$('officeLocText');if(txt)txt.textContent=`📍 موقع محدد: ${_officeLocLat.toFixed(5)}, ${_officeLocLng.toFixed(5)}`;
      });
    }catch(e){}
  }));
};
window.saveOfficeLocation = async () => {
  if(!_officeLocLat||!_officeLocLng)return toast('warn','يرجى تحديد موقع على الخريطة أولاً','');
  const displayName=($('office-display-name').value||'').trim()||(TENANT_INFO?.name||'مكتب تاكسي');
  const desc=($('office-desc').value||'').trim();
  try{
    await apiFetch(`/api/offices/${TENANT_ID}`,{method:'PUT',body:JSON.stringify({lat:_officeLocLat,lng:_officeLocLng,displayName,desc,visible:true})});
    toast('ok','✅ تم حفظ موقع المكتب','يظهر الآن على خريطة المستخدمين'); playSound('accept');
    const txt=$('officeLocText');if(txt)txt.textContent=`✅ موقع محفوظ: ${_officeLocLat.toFixed(5)}, ${_officeLocLng.toFixed(5)} — ${displayName}`;
  }catch(err){toast('err','خطأ',err.message||'');}
};
window.hideOfficeFromMap = async () => {
  if(!confirm('إخفاء مكتبك من الخريطة العامة؟'))return;
  try{await apiFetch(`/api/offices/${TENANT_ID}`,{method:'PUT',body:JSON.stringify({visible:false})});toast('ok','تم الإخفاء','مكتبك لن يظهر للمستخدمين');}
  catch(err){toast('err','خطأ',err.message||'');}
};

/* ══════════════════════════════════════════════════
   MONITORING SCREEN
   ══════════════════════════════════════════════════ */
window.openMonitor  = () => { $('MonitorScreen').classList.add('on'); refreshMonitor(); if(monitorInterval)clearInterval(monitorInterval); monitorInterval=setInterval(refreshMonitor,30000); };
window.closeMonitor = () => { $('MonitorScreen').classList.remove('on'); if(monitorInterval){clearInterval(monitorInterval);monitorInterval=null;} };
const refreshMonitor = () => {
  const grid=$('monGrid'); if(!grid)return;
  const all=Object.entries(allDrvs);
  const cnts={online:0,busy:0,brk:0,offline:0,total:0};
  all.forEach(([,d])=>{const cs=getTCS(d);if(cs.monCls==='st-online')cnts.online++;else if(cs.monCls==='st-busy')cnts.busy++;else if(cs.monCls==='st-break')cnts.brk++;else cnts.offline++;cnts.total+=(d.totalDeliveries||0);});
  const upd=(id,v)=>{const e=$(id);if(e)e.textContent=v;};
  upd('mon-online',cnts.online);upd('mon-busy',cnts.busy);upd('mon-break',cnts.brk);upd('mon-offline',cnts.offline);upd('mon-total-del',cnts.total);
  if(!all.length){grid.innerHTML=`<div style="text-align:center;padding:40px;color:var(--text4);grid-column:1/-1">لا يوجد سائقون</div>`;return;}
  grid.innerHTML=all.map(([id,d])=>{const cs=getTCS(d);return`<div class="monitor-taxi-card ${cs.monCls}"><div style="width:50px;height:50px;border-radius:14px;background:var(--bg2);border:2px solid ${cs.border};display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0">🚕</div><div class="monitor-taxi-info"><div class="monitor-taxi-name">${esc(d.name)}</div><div class="monitor-taxi-status"><span class="monitor-status-dot ${cs.dotCls}"></span><span style="color:${cs.dot};font-weight:800">${cs.label}</span></div>${d.phone?`<div style="font-size:11px;color:var(--text4)">${d.phone}</div>`:''}<div style="margin-top:6px;display:flex;gap:5px;flex-wrap:wrap"><span class="monitor-taxi-badge ${cs.badgeCls}"><i class="fas fa-box" style="font-size:9px"></i> ${d.totalDeliveries||0}</span>${d.shiftStart&&cs.monCls!=='st-offline'?`<span class="monitor-taxi-badge" style="background:var(--primary-l);color:var(--primary);border:1px solid var(--primary-m)">⏱ ${fmtElapsed(Date.now()-d.shiftStart)}</span>`:''}</div></div></div>`;}).join('');
};
onDriversUpdate(()=>{if($('MonitorScreen').classList.contains('on'))refreshMonitor();});

/* ══════════════════════════════════════════════════
   PUBLIC USER MAP
   ══════════════════════════════════════════════════ */
window.openPubPage = () => {
  $('PL').style.display='none'; $('PTenantGate').style.display='none';
  const pu=$('PU'); pu.style.display='flex'; pu.style.flexDirection='column';
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const mapEl=$('publicMap'); if(!mapEl)return;
    if(!_pubMap){
      try{_pubMap=L.map('publicMap',{zoomControl:true}).setView([32.31,35.03],13);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:19}).addTo(_pubMap);}
      catch(e){return;}
    } else {setTimeout(()=>{try{_pubMap.invalidateSize();}catch(e){}},300);}
    loadPublicOffices();
  }));
};
window.closePubPage = () => {
  $('PU').style.display='none'; $('PL').style.display='none'; $('PTenantGate').style.display='block';
};

const loadPublicOffices = async () => {
  if(!_pubMap)return;
  const layersToRemove=[]; _pubMap.eachLayer(l=>{if(l instanceof L.Marker)layersToRemove.push(l);}); layersToRemove.forEach(l=>_pubMap.removeLayer(l));
  try{
    const data=await apiFetch('/api/offices/public');
    const offices=data.offices||[];
    if(!offices.length){L.popup().setLatLng([32.31,35.03]).setContent('<div style="font-family:Cairo,sans-serif;text-align:center;padding:12px;direction:rtl"><div style="font-size:16px;margin-bottom:6px">🚕</div><b>لا يوجد مكاتب مسجلة بعد</b></div>').openOn(_pubMap);return;}
    for(const office of offices)addOfficeMarkerToMap(office);
    const bounds=L.latLngBounds(offices.map(o=>[o.lat,o.lng]));
    _pubMap.fitBounds(bounds,{padding:[40,40],maxZoom:15});
  }catch(e){console.warn('loadPublicOffices error',e);}
};

const addOfficeMarkerToMap = (office) => {
  if(!_pubMap)return;
  const ratingBadge=office.avgRating>0?`<div class="office-rating-badge">⭐ ${office.avgRating.toFixed(1)} <span style="opacity:.7">(${office.ratingCount})</span></div>`:'';
  const icon=L.divIcon({html:`<div class="office-marker-wrap"><div class="office-marker">🚕</div><div class="office-marker-name">${office.displayName||'مكتب تاكسي'}</div>${ratingBadge}</div>`,className:'',iconSize:[70,75],iconAnchor:[35,68]});
  const dn=esc(office.displayName||'مكتب تاكسي'), dc=esc(office.desc||'');
  const starsHtml=office.avgRating>0?`<div style="text-align:center;margin:8px 0;font-size:13px;color:#D97706;font-weight:700">⭐ ${office.avgRating.toFixed(1)} / 5 <span style="font-size:10px;color:#64748B;font-weight:400">(${office.ratingCount} تقييم)</span></div>`:'<div style="text-align:center;font-size:11px;color:#94A3B8;margin:6px 0">لا يوجد تقييمات بعد</div>';
  const popup=`<div class="pub-office-popup"><h3>🚕 ${dn}</h3>${dc?`<p class="office-desc">${dc}</p>`:''}${starsHtml}<button class="pub-req-btn" onclick="openUserReqModal('${office.tenantId}','${dn}','${dc}')"><i class="fas fa-taxi"></i> اطلب تكسي من هذا المكتب</button></div>`;
  L.marker([office.lat,office.lng],{icon}).addTo(_pubMap).bindPopup(popup,{maxWidth:260,minWidth:200});
};

/* ══ USER REQUEST ══ */
window.openUserReqModal = (tenantId,name,desc) => {
  window._pendingTenant=tenantId; window._pendingName=name; window._pendingDesc=desc;
  var last=parseInt(localStorage.getItem('txLastReq')||'0',10);
  if(last&&Date.now()-last<5*60*1000){window.showRateLimitAlert(Math.ceil((5*60*1000-(Date.now()-last))/1000));return;}
  var saved=localStorage.getItem('txUserPhone')||'';
  if(saved.startsWith('1|'))window._userVerifiedPhone=saved.slice(2);
  if(!window._userVerifiedPhone){document.getElementById('UserVerifyScreen').classList.add('on');window.showVStep&&window.showVStep(1);}
  else{window._gpsOk=false;window._userGpsLat=null;window._userGpsLng=null;document.getElementById('UserVerifyScreen').classList.add('on');window.showVStep&&window.showVStep(3);}
};

window.submitUserReq = async () => {
  const lastReq=parseInt(localStorage.getItem('txLastReq')||'0',10);
  if(lastReq&&Date.now()-lastReq<5*60*1000){const rem=Math.ceil((5*60*1000-(Date.now()-lastReq))/1000);if(typeof window.showRateLimitAlert==='function')window.showRateLimitAlert(rem);return;}
  if(!window._gpsOk){toast('err','📍 الموقع مطلوب','يجب تفعيل GPS لإرسال الطلب');return;}
  const phone=(window._userVerifiedPhone||($('ur-phone').value||'')).trim();
  const from=($('ur-from').value||'').trim();
  const to=($('ur-to').value||'').trim();
  const tenantId=$('ur-office-tenant').value;
  if(!phone||!from||!to)return shAl('al-userreq','err','يرجى ملء جميع الحقول');
  if(!/^[0-9+]{7,15}$/.test(phone.replace(/\s/g,'')))return shAl('al-userreq','err','رقم الهاتف غير صحيح');
  const btn=$('MuserReq').querySelector('.bp'), orig=btn.innerHTML;
  btn.innerHTML='<span class="spin"></span> جار الإرسال...'; btn.disabled=true;
  try{
    const details=`من: ${from} ← إلى: ${to}`;
    const data=await apiFetch('/api/requests/user',{method:'POST',body:JSON.stringify({
      phone, details, tenantId, userFrom:from, userTo:to,
      ...(window._gpsOk&&window._userGpsLat?{userLat:window._userGpsLat,userLng:window._userGpsLng,hasGps:true}:{hasGps:false}),
    })});
    _userReqId=data.requestId; _userReqTenantId=tenantId;
    CM('MuserReq');
    localStorage.setItem('txLastReq',String(Date.now()));
    openTrackScreen(phone,details,$('userReqOfficeName').textContent);
    startUserReqPolling(tenantId,data.requestId);
  }catch(err){shAl('al-userreq','err',err.data?.error||err.message||'خطأ');}
  btn.innerHTML=orig; btn.disabled=false;
};

/* ══ TRACK SCREEN ══ */
const openTrackScreen = (phone,details,officeName) => {
  $('trackPhone').textContent=phone; $('trackDetails').textContent=details; $('trackOfficeLabel').textContent=officeName;
  [0,1,2,3].forEach(i=>{const ic=$(`ts-icon-${i}`);if(ic)ic.className='track-step-icon';const ln=$(`ts-line-${i}`);if(ln)ln.className='track-step-line';});
  setTrackStep(0); updateTrackBanner('waiting');
  $('trackArrivedSection').style.display='none'; $('trackRatingSection').style.display='none'; $('trackCancelBtn').style.display='inline-flex';
  _lastTrackStatus=''; $('UserTrackScreen').classList.add('on');
};
const setTrackStep = step => {
  [0,1,2,3].forEach(i=>{const ic=$(`ts-icon-${i}`);if(!ic)return;ic.className='track-step-icon'+(i<step?' done':i===step?' active':'');const ln=$(`ts-line-${i}`);if(ln)ln.className='track-step-line'+(i<=step?' done':'');});
};
const updateTrackBanner = status => {
  const banner=$('trackStatusBanner'); if(!banner)return;
  const cfg={waiting:{cls:'tsb-waiting',msg:'⏳ في انتظار قبول الطلب...'},accepted:{cls:'tsb-accepted',msg:'✅ تم قبول طلبك! التاكسي في الطريق إليك 🚕'},waiting2:{cls:'tsb-accepted',msg:'🕐 التاكسي بالانتظار قريباً منك'},near:{cls:'tsb-near',msg:'⚠️ التاكسي اقترب منك! ترقّب الآن'},done:{cls:'tsb-done',msg:'🎉 وصل التاكسي! شكراً لاستخدامك خدمتنا'},cancelled:{cls:'tsb-cancelled',msg:'🚫 تم إلغاء الطلب'},no_response:{cls:'tsb-cancelled',msg:'⏰ لم يستجب السائق — جاري البحث عن بديل'},rejected:{cls:'tsb-cancelled',msg:'❌ السائق رفض الطلب — جاري البحث عن بديل'}}[status]||{cls:'tsb-waiting',msg:'⏳ جاري المعالجة...'};
  banner.className=`track-status-banner ${cfg.cls}`; banner.textContent=cfg.msg;
};

const startUserReqPolling = (tenantId,reqId) => {
  if(_pubReqPollTimer){clearInterval(_pubReqPollTimer);_pubReqPollTimer=null;}
  const fetchStatus=async()=>{
    try{
      const data=await apiFetch(`/api/requests/user/${reqId}?tenantId=${tenantId}`);
      if(data.request)updateTrackUI(data.request);
    }catch(e){}
  };
  fetchStatus();
  _pubReqPollTimer=setInterval(fetchStatus,4000);
};

const updateTrackUI = req => {
  const ds=req.driverStatus||req.status||'pending';
  if(ds===_lastTrackStatus)return;
  const stepMap={pending:0,accepted:1,waiting:1,near:2,done:3,cancelled:0,no_response:0,rejected:0};
  setTrackStep(stepMap[ds]??0);
  const bannerMap={pending:'waiting',accepted:'accepted',waiting:'waiting2',near:'near',done:'done',cancelled:'cancelled',no_response:'no_response',rejected:'rejected'};
  updateTrackBanner(bannerMap[ds]||'waiting');
  $('trackArrivedSection').style.display=(ds==='near'||ds==='accepted')?'block':'none';
  $('trackCancelBtn').style.display=(ds==='done'||ds==='cancelled')?'none':'inline-flex';
  if(_lastTrackStatus!==ds){
    if(ds==='accepted'){playSound('accept');vibrate([200,100,200]);showPushNotif('✅ تم قبول طلبك!','التاكسي في الطريق إليك 🚕','info');}
    else if(ds==='waiting'){playSound('notif');vibrate([200]);showPushNotif('🕐 التاكسي بالانتظار قريباً','ترقّب وصوله','info');}
    else if(ds==='near'){playSound('notif');vibrate([300,100,300]);showPushNotif('⚠️ التاكسي اقترب منك!','اضغط «وصل» عند وصوله','info');}
    else if(ds==='done'){playSound('shift');vibrate([200,100,200,100,200]);}
    else if(ds==='cancelled'||ds==='rejected'){playSound('cancel');vibrate([400]);}
  }
  _lastTrackStatus=ds;
  if(ds==='cancelled'||ds==='rejected'){
    if(_pubReqPollTimer){clearInterval(_pubReqPollTimer);_pubReqPollTimer=null;}
    setTimeout(()=>{if($('UserTrackScreen').classList.contains('on')){$('UserTrackScreen').classList.remove('on');$('PTenantGate').style.display='block';}},4000);
  }
  if(ds==='done'&&$('trackRatingSection').style.display==='none')$('trackArrivedSection').style.display='block';
};

window.userCancelReq = async () => {
  if(!_userReqId||!_userReqTenantId)return;
  if(!confirm('هل تريد إلغاء الطلب؟'))return;
  try{
    await apiFetch(`/api/requests/user/${_userReqId}/cancel`,{method:'POST',body:JSON.stringify({tenantId:_userReqTenantId})});
    $('UserTrackScreen').classList.remove('on'); toast('info','تم إلغاء الطلب','');
    if(_pubReqPollTimer){clearInterval(_pubReqPollTimer);_pubReqPollTimer=null;}
    _userReqId=null; _userReqTenantId=null;
  }catch(err){toast('err','خطأ',err.message||'');}
};

window.confirmTaxiArrived = async () => {
  setTrackStep(3); updateTrackBanner('done');
  $('trackArrivedSection').style.display='none'; $('trackRatingSection').style.display='block'; $('trackCancelBtn').style.display='none';
  playSound('shift');
  if(!_userReqId||!_userReqTenantId)return;
  try{await apiFetch(`/api/requests/user/${_userReqId}/arrived`,{method:'POST',body:JSON.stringify({tenantId:_userReqTenantId})});}catch(e){}
};

window.setRating = n => {
  _userRating=n;
  document.querySelectorAll('.rating-star').forEach((s,i)=>s.classList.toggle('on',i<n));
  const labels=['','سيء جداً 😞','سيء 😐','مقبول 🙂','جيد 😊','ممتاز 🌟'];
  const lb=$('ratingLabel'); if(lb)lb.textContent=labels[n]||'';
};
window.submitRating = async () => {
  if(_userRating===0)return toast('warn','يرجى اختيار تقييم','');
  const comment=($('ratingComment').value||'').trim();
  if(_userReqTenantId){
    try{await apiFetch('/api/ratings',{method:'POST',body:JSON.stringify({tenantId:_userReqTenantId,reqId:_userReqId,stars:_userRating,comment,phone:$('trackPhone').textContent})});}catch(e){}
  }
  toast('ok','✅ شكراً على تقييمك!',''); closeTrackScreen();
  if(_pubMap)setTimeout(()=>loadPublicOffices(),1000);
};
window.closeTrackScreen = () => {
  $('UserTrackScreen').classList.remove('on');
  _lastTrackStatus=''; _userReqId=null; _userReqTenantId=null; _userRating=0;
  if(_pubReqPollTimer){clearInterval(_pubReqPollTimer);_pubReqPollTimer=null;}
  if($('PU').style.display==='flex'){/* الخريطة مفتوحة */}
  else{$('PL').style.display='none';$('PTenantGate').style.display='block';}
};

/* ══════════════════════════════════════════════════
   RECEIVER DASHBOARD
   ══════════════════════════════════════════════════ */
let recvAllDrvs={};
let _recvPollTimer=null;

const initRecvDash = () => {
  $('PL').style.display='none'; $('PR').style.display='block';
  const recvCfg=[
    {id:'requests',icon:'fas fa-inbox',           label:'الطلبات',badge:true},
    {id:'map',     icon:'fas fa-map-location-dot', label:'الخريطة'},
    {id:'add',     icon:'fas fa-plus-circle',      label:'إضافة طلب'},
    {id:'history', icon:'fas fa-history',          label:'السجل'},
  ];
  $('recv-ntabs').innerHTML=recvCfg.map((t,i)=>`<button class="ntab${i===0?' sup-on':''}" id="rnt-${t.id}" onclick="recvTab('${t.id}')"><i class="${t.icon}"></i> ${t.label}${t.badge?`<span class="ntab-badge" id="recv-req-badge" style="display:none">0</span>`:''}</button>`).join('');
  const mobNav=$('mobileNav'),mobTabs=$('mobTabs');
  if(mobNav&&mobTabs){mobNav.style.display='block';mobTabs.innerHTML=recvCfg.map((t,i)=>`<button class="mob-tab${i===0?' sup-on':''}" id="rmnt-${t.id}" onclick="recvTab('${t.id}')">${t.badge?`<span class="mob-tab-badge" id="mob-recv-badge" style="display:none">0</span>`:''}<i class="${t.icon}"></i><span class="mob-label">${t.label}</span></button>`).join('');}
  startRecvPolling(); recvTab('requests');
};

const startRecvPolling = () => {
  if(_recvPollTimer)return;
  const fetchAll=async()=>{
    try{
      const [drvData,reqData]=await Promise.all([apiFetch(`/api/drivers?tenantId=${TENANT_ID}`),apiFetch(`/api/requests?tenantId=${TENANT_ID}`)]);
      recvAllDrvs={};(drvData.drivers||[]).forEach(d=>{recvAllDrvs[d.id]=d;});
      const count=(reqData.requests||[]).length;
      ['recv-req-badge','mob-recv-badge'].forEach(bid=>{const b=$(bid);if(b){b.textContent=count;b.style.display=count>0?'inline':'none';}});
    }catch(e){}
  };
  fetchAll();
  _recvPollTimer=setInterval(fetchAll,7000);
};

window.recvTab = t => {
  document.querySelectorAll('#recv-ntabs .ntab').forEach(b=>b.classList.remove('on','sup-on'));
  const el=$('rnt-'+t);if(el)el.classList.add('sup-on');
  document.querySelectorAll('#mobTabs .mob-tab').forEach(b=>b.classList.remove('on','sup-on'));
  const mel=$('rmnt-'+t);if(mel)mel.classList.add('sup-on');
  if(window._recvMap){try{window._recvMap.remove();}catch(e){} window._recvMap=null;}
  const body=$('recv-dbody');
  if(t==='requests')      renderRecvRequests(body);
  else if(t==='map')      renderRecvMap(body);
  else if(t==='add')      renderRecvAdd(body);
  else                    renderRecvHistory(body);
};

const renderRecvRequests = async body => {
  body.innerHTML=`<div style="padding:16px;overflow-y:auto;height:calc(100vh - 60px - 70px)">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">
      <div style="font-family:'Tajawal',sans-serif;font-size:18px;font-weight:900;color:var(--text);display:flex;align-items:center;gap:8px"><i class="fas fa-inbox" style="color:var(--primary)"></i> الطلبات الواردة</div>
      <button onclick="recvTab('add')" style="padding:8px 14px;background:var(--primary);border:none;border-radius:9px;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:'Cairo',sans-serif"><i class="fas fa-plus"></i> إضافة</button>
    </div>
    <div id="RECV_LIST"><div style="text-align:center;padding:32px;color:var(--text4)"><div class="spin dark"></div></div></div>
  </div>`;
  const refreshList=async()=>{
    try{
      const data=await apiFetch(`/api/requests?tenantId=${TENANT_ID}`);
      const list=$('RECV_LIST');if(!list)return;
      const reqs=data.requests||[];
      if(!reqs.length){list.innerHTML=`<div style="text-align:center;padding:40px;color:var(--text4)"><i class="fas fa-inbox" style="font-size:40px;opacity:.2;display:block;margin-bottom:12px"></i><p style="font-size:13px">لا توجد طلبات حالياً</p></div>`;return;}
      list.innerHTML=reqs.sort((a,b)=>(b.ts||0)-(a.ts||0)).map(d=>{
        const userBadge=d.fromUser?`<span style="background:#ECFDF5;color:#059669;font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;border:1px solid #A7F3D0;margin-right:4px">🌐 مستخدم</span>`:'';
        return `<div class="recv-req-card">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px"><div style="font-size:15px;font-weight:900;color:var(--text);display:flex;align-items:center;gap:6px"><i class="fas fa-phone" style="color:var(--primary);font-size:12px"></i>${esc(d.phone||'-')}${userBadge}</div><span style="font-size:10px;color:var(--text4)">${fmt(d.ts||Date.now())}</span></div>
          <div style="font-size:12px;color:var(--text2);margin-bottom:10px;display:flex;align-items:flex-start;gap:6px"><i class="fas fa-map-marker-alt" style="color:var(--amber);margin-top:3px;flex-shrink:0"></i>${esc(d.details||'-')}</div>
          ${d.addedBy?`<div style="font-size:10px;color:var(--text4);margin-bottom:8px"><i class="fas fa-user" style="margin-left:3px"></i>${esc(d.addedBy)}</div>`:''}
          <div style="display:flex;gap:7px;flex-wrap:wrap">
            <button class="rca rca-primary" onclick="recvSendReqToTaxi('${d.id}','${eAt(d.phone||'')}','${eAt(d.details||'')}')"><i class="fas fa-car-side"></i> إرسال لسائق</button>
            <button class="rca rca-amber" onclick="recvEditReq('${d.id}','${eAt(d.phone||'')}','${eAt(d.details||'')}')"><i class="fas fa-pen"></i></button>
            <button class="rca rca-red" onclick="recvDelReq('${d.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </div>`;
      }).join('');
    }catch(e){}
  };
  refreshList();
  if(_recvPollTimer)clearInterval(_recvPollTimer);
  _recvPollTimer=setInterval(refreshList,6000);
};

window.recvSendReqToTaxi=(reqId,phone,details)=>{selTaxiId=null;selReqData={id:reqId,phone:phone.replace(/&#39;/g,"'"),details:details.replace(/&#39;/g,"'"),recvReqId:reqId};const list=$('sel-taxi-list');const avail=Object.entries(recvAllDrvs).sort(([,a],[,b])=>{const ao=getTCS(a).monCls==='st-online'?0:1,bo=getTCS(b).monCls==='st-online'?0:1;return ao-bo;});if(!avail.length){list.innerHTML='<div style="text-align:center;padding:20px;color:var(--text3)">لا يوجد سائقون</div>';$('SelTaxiModal').classList.add('on');return;}list.innerHTML=avail.map(([id,d])=>{const cs=getTCS(d);return`<div class="sel-taxi-item" id="stitem-${id}" onclick="selectTaxi('${id}')"><div style="width:40px;height:40px;border-radius:11px;border:2px solid ${cs.border};background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🚕</div><div style="flex:1"><div style="font-weight:800;font-size:13px;color:var(--text)">${esc(d.name)}</div><div style="font-size:11px;color:${cs.dot}">${cs.label}</div>${d.carNumber?`<div style="font-size:10px;color:var(--text4)">🚗 ${esc(d.carNumber)}</div>`:''}</div><i class="fas fa-check-circle" id="stchk-${id}" style="display:none;color:var(--primary);font-size:18px"></i></div>`;}).join('');$('SelTaxiModal').classList.add('on');$('confirmSelBtn').disabled=true;$('confirmSelBtn').style.opacity='.5';};
window.recvDelReq=async id=>{if(!confirm('حذف هذا الطلب؟'))return;try{await apiFetch(`/api/requests/${id}`,{method:'DELETE',body:JSON.stringify({tenantId:TENANT_ID})});toast('ok','تم الحذف','');}catch(err){toast('err','خطأ',err.message||'');}};
window.recvEditReq=(id,phone,details)=>{const np=prompt('رقم الهاتف الجديد:',phone.replace(/&#39;/g,"'"));if(!np)return;const nd=prompt('التفاصيل الجديدة:',details.replace(/&#39;/g,"'"));if(!nd)return;apiFetch(`/api/requests/${id}`,{method:'PUT',body:JSON.stringify({phone:np,details:nd,tenantId:TENANT_ID})}).then(()=>toast('ok','تم التعديل','')).catch(()=>{});};

const renderRecvMap = body => {
  body.innerHTML=`<div style="height:calc(100vh - 60px - 70px);display:flex;flex-direction:column;position:relative"><div class="ststrip" style="flex-shrink:0;position:relative;z-index:2"><div class="st"><div class="stic" style="background:var(--green-l)"><i class="fas fa-circle" style="color:var(--green)"></i></div><div><div class="stv" id="rmG">0</div><div class="stl">متاح 🟢</div></div></div><div class="st"><div class="stic" style="background:var(--red-l)"><i class="fas fa-car" style="color:var(--red)"></i></div><div><div class="stv" id="rmR">0</div><div class="stl">مشغول 🔴</div></div></div><div class="st"><div class="stic" style="background:var(--primary-l)"><i class="fas fa-users" style="color:var(--primary)"></i></div><div><div class="stv" id="rmT">0</div><div class="stl">المجموع</div></div></div></div><div id="recvMap" style="flex:1;min-height:0"></div></div>`;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const el=$('recvMap');if(!el)return;
    try{
      window._recvMap=L.map('recvMap',{zoomControl:true}).setView([32.31,35.03],12);window._recvMarkers={};
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:19}).addTo(window._recvMap);
      const refresh=()=>{if(!window._recvMap)return;const ent=Object.entries(recvAllDrvs);const upd=(id,v)=>{const e=$(id);if(e)e.textContent=v;};upd('rmT',ent.length);upd('rmG',ent.filter(([,d])=>getTCS(d).monCls==='st-online').length);upd('rmR',ent.filter(([,d])=>getTCS(d).monCls==='st-busy').length);ent.forEach(([id,d])=>{if(!d.lat||!d.lng)return;const cs=getTCS(d);const ic=L.divIcon({html:`<div class="drv-marker-wrap"><div class="drv-marker" style="border-color:${cs.border}">🚕</div><div class="drv-marker-name">${d.name}</div></div>`,className:'',iconSize:[50,50],iconAnchor:[25,50]});if(window._recvMarkers[id]){window._recvMarkers[id].setLatLng([d.lat,d.lng]);window._recvMarkers[id].setIcon(ic);}else{window._recvMarkers[id]=L.marker([d.lat,d.lng],{icon:ic}).addTo(window._recvMap).bindPopup(`<div style="font-family:Cairo,sans-serif;text-align:center"><b>${d.name}</b><br><span style="color:${cs.dot}">${cs.label}</span></div>`);}});};
      refresh(); onDriversUpdate(()=>{if(!window._recvMap)return;recvAllDrvs={...allDrvs};refresh();});
    }catch(e){}
  }));
};
const renderRecvAdd = body => {
  body.innerHTML=`<div style="padding:16px;overflow-y:auto;height:calc(100vh - 60px - 70px);max-width:500px;margin:0 auto"><div style="font-family:'Tajawal',sans-serif;font-size:18px;font-weight:900;color:var(--text);margin-bottom:16px;display:flex;align-items:center;gap:8px"><i class="fas fa-plus-circle" style="color:var(--primary)"></i> إضافة طلب جديد</div><div class="cbox"><div class="al" id="al-recv-add"></div><div class="fg"><label class="fl"><i class="fas fa-phone"></i> رقم هاتف الزبون</label><input type="tel" class="fi" id="recv-phone" placeholder="05xxxxxxxx"></div><div class="fg"><label class="fl"><i class="fas fa-map-marker-alt"></i> التفاصيل والموقع</label><textarea class="fi" id="recv-details" rows="4" placeholder="من شارع فلسطين إلى مستشفى طولكرم..."></textarea></div><button class="ba" onclick="addRecvReq()"><i class="fas fa-paper-plane"></i> حفظ الطلب</button></div></div>`;
};
window.addRecvReq = async () => {
  const phone=($('recv-phone').value||'').trim(), details=($('recv-details').value||'').trim();
  if(!phone||!details)return shAl('al-recv-add','err','يرجى ملء جميع الحقول');
  try{await apiFetch('/api/requests',{method:'POST',body:JSON.stringify({phone,details,tenantId:TENANT_ID,addedBy:CU?CU.name:'المستقبل'})});$('recv-phone').value='';$('recv-details').value='';shAl('al-recv-add','ok','✅ تم إضافة الطلب');playSound('notif');setTimeout(()=>recvTab('requests'),1200);}
  catch(err){shAl('al-recv-add','err',err.data?.error||err.message||'خطأ');}
};
const renderRecvHistory = async body => {
  body.innerHTML=`<div style="padding:16px;overflow-y:auto;height:calc(100vh - 60px - 70px)"><div style="font-family:'Tajawal',sans-serif;font-size:18px;font-weight:900;color:var(--text);margin-bottom:14px;display:flex;align-items:center;justify-content:space-between"><span style="display:flex;align-items:center;gap:8px"><i class="fas fa-history" style="color:var(--amber)"></i> سجل التنبيهات</span><button onclick="clearAllNotifs()" style="padding:7px 14px;background:var(--red-l);border:1px solid var(--red-m);border-radius:9px;color:var(--red);font-size:11px;font-weight:700;cursor:pointer;font-family:'Cairo',sans-serif"><i class="fas fa-trash"></i> حذف الكل</button></div><div id="RECV_HIST"><div style="text-align:center;padding:32px;color:var(--text4)"><div class="spin dark"></div></div></div></div>`;
  try{
    const data=await apiFetch(`/api/notifications?tenantId=${TENANT_ID}&limit=50`);
    const list=$('RECV_HIST');if(!list)return;
    const notifs=data.notifications||[];
    const icMap={accept:'ni-green',reject:'ni-red',timeout:'ni-red',done:'ni-green',waiting:'ni-amber',near:'ni-amber',sos:'ni-red',info:'ni-blue',cancel:'ni-red',edit:'ni-amber',rating:'ni-green',user_request:'ni-green'};
    const icoMap={accept:'check',reject:'times',timeout:'clock',done:'flag-checkered',waiting:'hourglass-half',near:'map-pin',sos:'triangle-exclamation',info:'info',cancel:'ban',edit:'pen',rating:'star',user_request:'globe'};
    if(!notifs.length){list.innerHTML=`<div style="text-align:center;padding:32px;color:var(--text4)">لا يوجد سجل</div>`;return;}
    list.innerHTML=notifs.sort((a,b)=>(b.ts||0)-(a.ts||0)).map(n=>`<div class="notif-item"><div class="notif-ic ${icMap[n.type]||'ni-blue'}"><i class="fas fa-${icoMap[n.type]||'bell'}"></i></div><div class="notif-body"><div class="notif-title">${esc(n.msg||'')}</div><div class="notif-time">${fmt(n.ts||Date.now())}</div></div><button class="notif-del-btn" onclick="delNotif('${n.id}')"><i class="fas fa-times"></i></button></div>`).join('');
  }catch(e){const l=$('RECV_HIST');if(l)l.innerHTML='<div style="text-align:center;padding:32px;color:var(--text4)">خطأ في التحميل</div>';}
};

/* ══════════════════════════════════════════════════
   LOGOUT
   ══════════════════════════════════════════════════ */
window.logout = async () => {
  stopGPS();
  if(reqCountdownTimer){clearInterval(reqCountdownTimer);reqCountdownTimer=null;}
  if(monitorInterval){clearInterval(monitorInterval);monitorInterval=null;}
  if(_pollTimer){clearInterval(_pollTimer);_pollTimer=null;}
  if(_supPollTimer){clearInterval(_supPollTimer);_supPollTimer=null;}
  if(_drvReqPollTimer){clearInterval(_drvReqPollTimer);_drvReqPollTimer=null;}
  if(_sosPollTimer){clearInterval(_sosPollTimer);_sosPollTimer=null;}
  if(_recvPollTimer){clearInterval(_recvPollTimer);_recvPollTimer=null;}
  stopDriversPolling();
  $('ReqNotif').classList.remove('on'); $('SosBroadcastNotif').classList.remove('on'); $('MonitorScreen').classList.remove('on');
  /* إخبار Backend بالخروج */
  if(CR==='driver'&&CU){
    try{await apiFetch('/api/drivers/status',{method:'POST',body:JSON.stringify({driverId:CU.id,tenantId:TENANT_ID,status:'offline'})});}catch(e){}
  }
  await signOut(_auth).catch(()=>{});
  _sessionToken=null;
  CU=null;CR=null;shiftStartTime=null;allDrvs={};IS_RECV=false;TENANT_ID='';TENANT_INFO=null;
  $('PD').style.display='none';$('PR').style.display='none';$('PL').style.display='none';$('PTenantGate').style.display='block';
  $('ntabs').innerHTML='';
  const navav=$('navav');if(navav){navav.textContent='🚕';navav.classList.remove('sup-av');}
  const monBtn=$('monitorBtn');if(monBtn)monBtn.remove();
  const mn=$('mobileNav');if(mn)mn.style.display='none';
  const mb=$('mobTabs');if(mb)mb.innerHTML='';
};

window.logoutRecv = async () => {
  if(_recvPollTimer){clearInterval(_recvPollTimer);_recvPollTimer=null;}
  await signOut(_auth).catch(()=>{});
  _sessionToken=null; CU=null;CR=null;IS_RECV=false;recvAllDrvs={};TENANT_ID='';TENANT_INFO=null;
  if(window._recvMap){try{window._recvMap.remove();}catch(e){}window._recvMap=null;}
  $('PR').style.display='none';$('PL').style.display='none';$('PTenantGate').style.display='block';
  $('recv-ntabs').innerHTML='';
  const mn=$('mobileNav');if(mn)mn.style.display='none';
  const mb=$('mobTabs');if(mb)mb.innerHTML='';
};
