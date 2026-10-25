(() => {
'use strict';

/* ═════════ basics ═════════ */
const API = '/app/api/r6.php?a=';
const KEY = 'residim-06';
const DAYS = ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'];
const TODAY = (new Date().getDay() + 1) % 7;
const fa = v => String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
const en = v => String(v ?? '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const sep = n => String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
const money = n => fa(sep(n)) + ' تومان';
const clock = t => fa(String(t || '').replace(/^0/, ''));
const km1 = d => fa((Math.round(d * 10) / 10).toString().replace('.', '٫'));
const mins = s => fa(Math.max(1, Math.round(s / 60)));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $ = s => document.querySelector(s);
const ic = (n, cls = 'i') => `<svg class="${cls}"><use href="#i-${n}"/></svg>`;
const uid = () => Math.random().toString(36).slice(2, 10);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const hav = (a, b, c, d) => { const R = 6371000, t = Math.PI / 180, x = Math.sin((c - a) * t / 2) ** 2 + Math.cos(a * t) * Math.cos(c * t) * Math.sin((d - b) * t / 2) ** 2; return 2 * R * Math.asin(Math.min(1, Math.sqrt(x))); };
let JY = (() => { try { return parseInt(new Intl.DateTimeFormat('en-u-ca-persian', { year: 'numeric' }).format(new Date()), 10) || 1405; } catch (e) { return 1405; } })();

const KINDS = {
  school:    { n: 'مدرسه', ic: 'school', child: true,  c: 0, lbl: 'مدرسه‌ی بچه‌ها', dest: 'مدرسه' },
  kinder:    { n: 'مهدکودک', ic: 'kinder', child: true,  c: 5, lbl: 'مهدکودک', dest: 'مهد' },
  institute: { n: 'آموزشگاه', ic: 'book', child: true,  c: 4, lbl: 'کلاس زبان بچه‌ها', dest: 'آموزشگاه' },
  club:      { n: 'باشگاه و ورزشگاه', ic: 'ball', child: true,  c: 2, lbl: 'باشگاه بچه‌ها', dest: 'باشگاه' },
  work:      { n: 'محل کار', ic: 'brief', child: false, c: 1, lbl: 'محل کار', dest: 'محل کار' },
  uni:       { n: 'دانشگاه', ic: 'cap', child: false, c: 6, lbl: 'دانشگاه', dest: 'دانشگاه' },
  other:     { n: 'سایر', ic: 'dots', child: null,  c: 3, lbl: '', dest: 'مقصد' }
};
const COLORS = [
  { c: '#22C55E', i: '#04140B' }, { c: '#2563EB', i: '#FFFFFF' }, { c: '#F97316', i: '#1A0D00' }, { c: '#DB2777', i: '#FFFFFF' },
  { c: '#7C3AED', i: '#FFFFFF' }, { c: '#F59E0B', i: '#1A1400' }, { c: '#0D9488', i: '#FFFFFF' }, { c: '#DC2626', i: '#FFFFFF' }
];
const VALUES = { religious: 'خانواده‌ای مذهبی باشند', nomusic: 'موسیقی پخش نشود', parent: 'راننده حتماً از والدین باشد', samegender: 'راننده هم‌جنس فرزندم باشد', quiet: 'گفتگوی کم و محترمانه' };
const CITIES = ['تهران','کرج','مشهد','اصفهان','شیراز','تبریز','قم','اهواز','رشت','کرمان','یزد','ارومیه','همدان','سایر'];
const HOOK = {
  child: 'اگر هم‌محله و هم‌مسیریم، چرا هر کدام جدا؟ بچه‌ها را نوبتی ببریم و بیاوریم؛ وقت آزاد، خرج نصف، خیال راحت.',
  adult: 'اگر هم‌مسیریم، چرا هر روز جدا جدا؟ نوبتی برانیم؛ ترافیک کمتر، خرج نصف، صبح‌های شادتر.'
};
const isChild = p => { const k = KINDS[p.kind] || KINDS.other; return k.child ?? !!(p.data && p.data.forKids); };
const col = i => COLORS[((i % 8) + 8) % 8];

/* ═════════ store ═════════ */
let S = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })();
S.drafts = S.drafts || [];
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
let P = [];
let CFG = { flags: {}, web_key: '', service: false };
const ui = { tab: 'peers', view: 'map', filter: 'all', cand: null, inbox: null, team: null, wiz: null, slot: null, linkPlace: null, admin: false, adm: null, open: { profiles: false, test: false } };

async function api(a, body, admin) {
  let r;
  try { r = await fetch(API + a, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Token': (admin ? S.admin : S.token) || '' }, body: JSON.stringify(body || {}) }); }
  catch (e) { const er = new Error('اتصال به سرور برقرار نشد؛ اینترنت را بررسی کنید.'); er.code = 'net'; throw er; }
  let j; try { j = await r.json(); } catch (e) { const er = new Error('سرور پاسخ درستی نداد.'); er.code = 'net'; throw er; }
  if (!j.ok) {
    if (j.error === 'auth' && !admin && S.token) { S.token = null; P = []; persist(); }
    const er = new Error(j.message || 'خطا'); er.code = j.error; throw er;
  }
  return j;
}
const fail = e => toast(e && e.message ? e.message : 'خطایی پیش آمد.');

/* ═════════ profiles ═════════ */
const allProfiles = () => [...P, ...S.drafts];
const active = () => allProfiles().find(p => p.id === S.active) || null;
const profColor = p => p.team ? col(p.team.color) : col(p.color ?? (KINDS[p.kind] || KINDS.other).c);
const placeName = p => p.place ? p.place.name : (p.placeDraft ? p.placeDraft.name : '');
const destWord = p => (KINDS[p.kind] || KINDS.other).dest;
function missingStep(p) {
  const d = p.data || {};
  if (!p.kind) return 'kind';
  if (!d.family || !d.pg) return 'family';
  if (isChild(p) && (!d.kids || !d.kids.length || d.kids.some(k => !k.first || !k.g || !k.by))) return 'kids';
  if (!d.lat || !d.hood) return 'home';
  if (!d.role || (d.role !== 'pay' && !(d.days || []).length)) return 'role';
  if (!p.place && !p.placeDraft) return 'place';
  if (!d.snapp) return 'snapp';
  if (!d.rules_at) return 'rules';
  return null;
}
async function refreshMe() {
  if (!S.token) { P = []; return; }
  try { const r = await api('me'); P = r.profiles; S.phone = r.phone; persist(); } catch (e) { if (e.code !== 'net') P = []; }
}
function setActive(id, opts = {}) {
  S.active = id; persist();
  ui.cand = null; ui.team = null; ui.inbox = null; ui.slot = null;
  const p = active();
  ui.tab = p && p.team ? 'team' : 'peers';
  applyAccent(); render(true);
  if (p && !p.complete && !opts.noWizard) wizOpen(p, { mode: 'resume' });
  if (p && p.complete) { loadPeers(); loadInbox(); if (p.team) loadTeam(); }
}
function applyAccent() {
  const p = active(), c = p ? profColor(p) : COLORS[0];
  document.documentElement.style.setProperty('--ac', c.c);
  document.documentElement.style.setProperty('--ac-ink', c.i);
}

/* ═════════ map kit (Neshan → MapLibre/OpenFreeMap → radial) ═════════ */
const MapKit = { lib: null, loading: null, failed: false };
function loadCss(href) { return new Promise(res => { if (document.querySelector(`link[href="${href}"]`)) return res(); const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.onload = res; l.onerror = res; document.head.appendChild(l); }); }
function loadJs(src, test, ms = 9000) {
  return new Promise((res, rej) => {
    if (test()) return res();
    const s = document.createElement('script'); s.src = src; s.async = true;
    const t = setTimeout(() => rej(new Error('timeout')), ms);
    s.onload = () => { clearTimeout(t); test() ? res() : rej(new Error('missing')); };
    s.onerror = () => { clearTimeout(t); rej(new Error('load')); };
    document.head.appendChild(s);
  });
}
async function mapLib() {
  if (MapKit.lib) return MapKit.lib;
  if (MapKit.loading) return MapKit.loading;
  MapKit.loading = (async () => {
    if (CFG.web_key) {
      try {
        await loadCss('https://static.neshan.org/sdk/mapboxgl/v1.13.2/neshan-sdk/v1.1.3/index.css');
        await loadJs('https://static.neshan.org/sdk/mapboxgl/v1.13.2/neshan-sdk/v1.1.3/index.js', () => !!window.nmp_mapboxgl, 8000);
        return (MapKit.lib = { name: 'neshan', G: window.nmp_mapboxgl });
      } catch (e) { /* fall through to open map */ }
    }
    await loadCss('assets/maplibre-gl.css');
    await loadJs('assets/maplibre-gl.js', () => !!window.maplibregl, 12000);
    try { const pr = window.maplibregl.setRTLTextPlugin('https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.3.0/dist/mapbox-gl-rtl-text.js', true); if (pr && pr.catch) pr.catch(() => { MapKit.noRtl = true; }); } catch (e) { MapKit.noRtl = true; }
    return (MapKit.lib = { name: 'libre', G: window.maplibregl });
  })();
  try { return await MapKit.loading; } catch (e) { MapKit.failed = true; MapKit.loading = null; throw e; }
}
async function makeMap(el, center, zoom) {
  const L = await mapLib();
  let map;
  if (L.name === 'neshan') map = new L.G.Map({ mapType: L.G.Map.mapTypes.neshanVector, container: el, zoom, pitch: 0, center: [center[1], center[0]], minZoom: 4, maxZoom: 19, trackResize: true, mapKey: CFG.web_key, poi: false, traffic: false, mapTypeControllerOptions: { show: false } });
  else map = new L.G.Map({ container: el, style: 'https://tiles.openfreemap.org/styles/positron', center: [center[1], center[0]], zoom, attributionControl: { compact: true }, dragRotate: false, pitchWithRotate: false });
  await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('map-timeout')), 10000);
    map.on('load', () => { clearTimeout(t); res(); });
    map.on('error', ev => { if (ev && ev.error && /style|Failed to fetch/i.test(String(ev.error.message || ev.error))) { clearTimeout(t); rej(new Error('style')); } });
  });
  if (L.name === 'libre') softenStyle(map);
  try { map.touchZoomRotate && map.touchZoomRotate.disableRotation(); } catch (e) {}
  return { map, L };
}
function softenStyle(map) { // Persian names first; no broken Arabic shaping if the RTL plugin can't load
  try {
    for (const l of map.getStyle().layers) {
      if (l.type !== 'symbol' || !map.getLayoutProperty(l.id, 'text-field')) continue;
      if (MapKit.noRtl) map.setLayoutProperty(l.id, 'visibility', 'none');
      else map.setLayoutProperty(l.id, 'text-field', ['coalesce', ['get', 'name:fa'], ['get', 'name']]);
    }
    for (const l of map.getStyle().layers) if (l.type === 'background') map.setPaintProperty(l.id, 'background-color', '#F4F6F2');
  } catch (e) {}
}
function markerEl(m, mine) {
  const el = document.createElement('div');
  const t = m.team, c = t ? col(t.color) : null;
  el.className = 'mk' + (mine ? ' me' : '') + (m.invite && m.invite.dir === 'out' ? ' sent' : '');
  el.style.setProperty('--mc', c ? c.c : '#8E9892'); el.style.setProperty('--mi', c ? c.i : '#fff');
  const roles = (m.role === 'drive' || m.role === 'both' ? ic('wheel', '') : '') + (m.role === 'pay' || m.role === 'both' ? ic('coin', '') : '');
  el.innerHTML = `<div class="pill">${mine ? 'شما' : esc(m.family)} ${roles}${mine ? '' : ic(m.pg === 'f' ? 'woman' : 'man', '')}</div><div class="tip"></div>`;
  el.setAttribute('role', 'button'); el.tabIndex = 0;
  el.setAttribute('aria-label', mine ? 'موقعیت شما' : `خانواده ${m.family}، ${m.role === 'pay' ? 'هزینه می‌دهند' : 'رانندگی می‌کنند'}${t ? '، تیم ' + fa(t.no) : '، بدون تیم'}`);
  return el;
}

/* peer map: one persistent node moved between renders (no tile reloads) */
const PM = { node: null, map: null, L: null, markers: [], key: '', state: 'idle' };
async function mountPeerMap() {
  const slot = $('#peermap-slot'); if (!slot) return;
  const p = active(); if (!p || !p.data || !p.data.lat) return;
  if (!PM.node) { PM.node = document.createElement('div'); PM.node.className = 'mapc'; }
  slot.appendChild(PM.node);
  if (PM.state === 'failed') return radialInto(slot, p);
  if (!PM.map && PM.state !== 'loading') {
    PM.state = 'loading';
    try { const r = await makeMap(PM.node, [p.data.lat, p.data.lng], 14); PM.map = r.map; PM.L = r.L; PM.state = 'ok'; }
    catch (e) { PM.state = 'failed'; const s2 = $('#peermap-slot'); if (s2) radialInto(s2, p); return; }
  }
  if (PM.map) { PM.map.resize(); drawPeers(); }
  const src = $('#map-src'); if (src) src.textContent = PM.L ? (PM.L.name === 'neshan' ? 'نقشه‌ی نشان' : 'نقشه‌ی باز (OSM)') : '';
}
function drawPeers() {
  if (!PM.map || !ui.cand) return;
  const p = active(); const list = filtered(ui.cand.list);
  const key = p.id + '|' + list.map(m => m.id + (m.team ? m.team.id : '') + (m.invite ? m.invite.dir : '')).join(',');
  if (key === PM.key) return; PM.key = key;
  PM.markers.forEach(m => m.remove()); PM.markers = [];
  const G = PM.L.G, B = new G.LngLatBounds();
  const add = (m, mine) => { const el = markerEl(m, mine); if (!mine) el.addEventListener('click', () => famSheet(m)); el.addEventListener('keydown', e => { if (e.key === 'Enter' && !mine) famSheet(m); }); PM.markers.push(new G.Marker({ element: el, anchor: 'bottom' }).setLngLat([m.lng, m.lat]).addTo(PM.map)); };
  add({ lat: p.data.lat, lng: p.data.lng, family: 'شما', role: p.data.role, pg: p.data.pg, team: p.team }, true);
  B.extend([p.data.lng, p.data.lat]);
  const near = list.filter(m => !m.dist || m.dist.m < 4500).slice(0, 14);
  list.forEach(m => add(m, false));
  near.forEach(m => B.extend([m.lng, m.lat]));
  if (near.length) PM.map.fitBounds(B, { padding: { top: 70, bottom: 40, left: 40, right: 40 }, maxZoom: 15.5, duration: 600 });
  else PM.map.flyTo({ center: [p.data.lng, p.data.lat], zoom: 14.5, duration: 400 });
}
function radialInto(slot, p) {
  const list = ui.cand ? filtered(ui.cand.list) : [], c0 = { lat: p.data.lat, lng: p.data.lng };
  const pts = list.map(m => { let dx = (m.lng - c0.lng) * 111.32 * Math.cos(c0.lat * Math.PI / 180), dy = (m.lat - c0.lat) * 110.57; const r = Math.hypot(dx, dy); if (r > 3) { dx *= 3 / r; dy *= 3 / r; } return [dx * 31, -dy * 31, m]; });
  for (let it = 0; it < 6; it++) for (let i = 0; i < pts.length; i++) for (let k = 0; k < i; k++) { const dx = pts[i][0] - pts[k][0], dy = pts[i][1] - pts[k][1], d = Math.hypot(dx, dy) || .01; if (d < 22) { const m = (22 - d) / 2; pts[i][0] += dx / d * m; pts[i][1] += dy / d * m; pts[k][0] -= dx / d * m; pts[k][1] -= dy / d * m; } }
  slot.innerHTML = `<svg viewBox="-104 -104 208 208" style="width:100%;height:100%;display:block;background:var(--brand-soft)" role="img" aria-label="نقشه‌ی ساده‌ی همسایه‌ها">
    ${[1, 2, 3].map(k => `<circle r="${k * 31}" fill="none" stroke="var(--line-2)" stroke-dasharray="2 3" stroke-width=".6"/><text x="2" y="${-k * 31 + 5}" font-size="4.2" fill="var(--muted)">${fa(k)} کیلومتر از شما</text>`).join('')}
    <g><circle r="7" fill="#0C1410"/><text y="15" text-anchor="middle" font-size="5" font-weight="900" fill="var(--ink)">شما</text></g>
    ${pts.map(([x, y, m]) => { const c = m.team ? col(m.team.color) : { c: '#8E9892', i: '#fff' }; return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" data-a="cand" data-id="${m.id}" style="cursor:pointer"><rect x="-13" y="-6" width="26" height="11" rx="5.5" fill="${c.c}" stroke="#fff" stroke-width="1.2"/><text y="2" text-anchor="middle" font-size="4.6" font-weight="800" fill="${c.i}">${esc(m.family)}</text></g>`; }).join('')}</svg>`;
  const src = $('#map-src'); if (src) src.textContent = 'نقشه‌ی ساده (نقشه‌ی خیابانی در دسترس نیست)';
}

/* picker map (wizard): fixed centre pin, Snapp-style */
const PK = { map: null, L: null, node: null, cb: null, loading: false };
async function mountPicker(slotSel, center, cb) {
  const slot = $(slotSel); if (!slot) return;
  PK.cb = cb;
  if (!PK.node) { PK.node = document.createElement('div'); PK.node.className = 'mapc'; }
  slot.querySelector('.mapc-holder').appendChild(PK.node);
  if (PK.loading) return;
  if (!PK.map) {
    PK.loading = true;
    try {
      const r = await makeMap(PK.node, center, 15.5); PK.map = r.map; PK.L = r.L; PK.loading = false;
      PK.map.on('movestart', () => { const b = PK.node.closest('.mapbox'); b && b.classList.add('moving'); });
      PK.map.on('moveend', () => { const b = PK.node.closest('.mapbox'); b && b.classList.remove('moving'); const c = PK.map.getCenter(); if (PK.prog && Math.abs(c.lat - PK.prog[0]) < 1e-6 && Math.abs(c.lng - PK.prog[1]) < 1e-6) { PK.prog = null; return; } PK.prog = null; PK.cb && PK.cb(+c.lat.toFixed(5), +c.lng.toFixed(5)); });
    } catch (e) { PK.loading = false; const h = document.querySelector(slotSel + ' .mapc-holder'); if (!h) return; h.innerHTML = `<div class="empty" style="height:100%;align-content:center">${ic('pin')}<b>نقشه در دسترس نیست</b><span class="small">با «موقعیت فعلی من» یا چسباندن لینک موقعیت ادامه دهید.</span></div>`; return; }
  } else { PK.map.resize(); PK.prog = [center[0], center[1]]; PK.map.jumpTo({ center: [center[1], center[0]] }); }
}

/* ═════════ matching (client ranking; server validates) ═════════ */
function score(p, m) {
  const d = p.data, r = []; let s = 0;
  if (m.dist) { s += Math.max(0, 45 * (1 - m.dist.m / 5000)); r.push([`${km1(m.dist.m / 1000)} کیلومتر مسیر · ${mins(m.dist.s)} دقیقه${m.dist.src === 'road' ? '' : ' (تقریبی)'}`, m.dist.m <= 2000]); }
  const dA = d.role === 'drive' || d.role === 'both', dB = m.role === 'drive' || m.role === 'both';
  if (dA && dB) { s += 28; r.push(['هر دو رانندگی می‌کنید', 1]); } else if (dA || dB) { s += 25; r.push([dB ? 'رانندگی می‌کنند' : 'شما رانندگی می‌کنید', 1]); } else r.push(['هر دو هزینه می‌دهید؛ راننده لازم است', 0]);
  const myG = (d.kids && d.kids[0] && d.kids[0].g) || d.pg;
  if ((d.values || []).includes('samegender') && dB && m.pg !== myG) { s -= 18; r.push(['با ترجیح «راننده هم‌جنس» شما جور نیست', 0]); }
  if ((m.values || []).includes('samegender') && dA && d.pg !== (m.kids[0] || {}).g) { s -= 18; r.push(['با ترجیح «راننده هم‌جنس» ایشان جور نیست', 0]); }
  (d.values || []).filter(v => v !== 'samegender' && (m.values || []).includes(v)).forEach(v => { s += 6; r.push(['ارزش مشترک: ' + VALUES[v], 1]); });
  if ((d.needs || {}).out === (m.needs || {}).out || (d.needs || {}).back === (m.needs || {}).back) s += 12;
  return { score: Math.max(0, Math.min(100, Math.round(s))), reasons: r };
}
function filtered(list) {
  return list.filter(m => ui.filter === 'free' ? !m.team : ui.filter === 'drivers' ? (m.role !== 'pay') : ui.filter === 'teams' ? !!m.team : true);
}
function smartTeam(p, list) {
  const free = list.filter(m => !m.team && m.rule_ok && !m.mate).sort((a, b) => (a.dist ? a.dist.m : 9e9) - (b.dist ? b.dist.m : 9e9));
  const d = p.data, drives = d.role !== 'pay', pick = [];
  if (!drives) { const dv = free.find(m => m.role !== 'pay'); if (dv) pick.push(dv); }
  const mine = d.kids && d.kids.length ? d.kids.map(k => ({ g: k.g, age: k.by ? JY - k.by : null })) : [{ g: d.pg, age: 30 }];
  const seats = () => Math.max(drives ? d.seats || 0 : 0, ...pick.filter(m => m.role !== 'pay').map(m => m.seats || 0), 0);
  const kids = () => mine.length + pick.reduce((a, m) => a + m.kids.length, 0);
  const genders = () => [...mine, ...pick.flatMap(m => m.kids)];
  const ruleOk = arr => { const g = arr.filter(k => k.g === 'f'), b = arr.filter(k => k.g === 'm'); if (!g.length || !b.length) return true; return g.every(k => k.age != null && k.age <= 8) && b.every(k => k.age != null && k.age <= 12); };
  for (const m of free) { if (pick.includes(m) || pick.length >= 3) continue; if (m.dist && m.dist.m > 4000) break; if (kids() + m.kids.length > Math.max(seats(), m.role !== 'pay' ? m.seats : 0)) continue; if (!ruleOk([...genders(), ...m.kids])) continue; pick.push(m); }
  if (!pick.length) return null;
  return { list: pick, drivers: pick.filter(m => m.role !== 'pay').length + (drives ? 1 : 0), seats: seats(), kids: kids() };
}
async function loadPeers() {
  const p = active(); if (!p || !p.complete || !S.token) return;
  try { ui.cand = await api('candidates', { profile_id: p.id }); PM.key = ''; if (ui.tab === 'peers' && !ui.wiz) { renderMain(); } } catch (e) { if (e.code !== 'net') fail(e); }
}
async function loadInbox(mark) {
  const p = active(); if (!p || !p.complete || !S.token) return;
  try {
    const prevTeam = p.team && p.team.id, prevInv = ui.inbox ? ui.inbox.invites.length : 0;
    ui.inbox = await api('inbox', { profile_id: p.id, mark: !!mark });
    const np = ui.inbox.profile; const idx = P.findIndex(x => x.id === np.id); if (idx >= 0) P[idx] = np;
    if ((np.team && np.team.id) !== prevTeam) { applyAccent(); if (np.team) { toast(`${teamName(np.team)} شکل گرفت! رنگ تیم شما روی اپ نشست.`); notify('رسیدیم', `${teamName(np.team)} شکل گرفت!`); ui.tab = 'team'; loadTeam(); } loadPeers(); }
    if (ui.inbox.invites.length > prevInv && prevInv >= 0 && ui.inbox.invites.length) notify('رسیدیم', 'یک دعوت هم‌مسیری تازه دارید.');
    paintBell(); if (!ui.wiz) renderTop();
  } catch (e) {}
}
async function loadTeam() {
  const p = active(); if (!p || !p.team) { ui.team = null; return; }
  try { ui.team = await api('team_state', { profile_id: p.id }); if (!ui.wiz && ui.tab !== 'peers') renderMain(); } catch (e) { if (e.code !== 'net') fail(e); }
}
const teamName = t => `تیم ${fa(t.no)} · محله ${t.hood}`;

/* ═════════ daily plan (deterministic on every device) ═════════ */
function slotsOf(place) { const days = (place && place.days && place.days.length) ? place.days : [0, 1, 2, 3, 4]; const out = []; days.forEach(d => ['out', 'back'].forEach(dir => out.push({ id: d + '-' + dir, d, dir, time: dir === 'out' ? (place && place.in) || '07:30' : (place && place.out) || '13:30' }))); return out; }
const ridersOf = (T, dir) => T.members.filter(m => (m.needs || {})[dir] !== false).flatMap(m => m.kids.map(k => ({ ...k, pid: m.id })));
const driverOk = (T, m, dir) => (m.role === 'drive' || m.role === 'both') && ridersOf(T, dir).every(k => { const o = T.members.find(x => x.id === k.pid); return !(o.values || []).includes('samegender') || o.id === m.id || m.pg === k.g; });
function planOf(T) {
  const c = {}, plan = {}; T.members.forEach(m => c[m.id] = 0);
  slotsOf(T.place).forEach(x => {
    if (!ridersOf(T, x.dir).length) { plan[x.id] = null; return; }
    const pool = T.members.filter(m => driverOk(T, m, x.dir)).sort((a, b) => ((b.days || []).includes(x.d) - (a.days || []).includes(x.d)) || (c[a.id] - c[b.id]) || ((b.seats || 0) - (a.seats || 0)) || (a.id < b.id ? -1 : 1));
    plan[x.id] = pool[0] ? pool[0].id : null; if (pool[0]) c[pool[0].id]++;
  });
  return plan;
}
const recOf = (T, x, plan) => T.trips[x.id] || { status: 'pending', exec: plan[x.id], arr: {}, empty: 0 };
const mem = (T, id) => T.members.find(m => m.id === id);
const fam = m => m ? 'خانواده ' + m.family : '—';
const kidName = (k, m) => k.first ? k.first + ' ' + m.family : (m.pg === 'f' ? 'خانم ' : 'آقای ') + m.family;
function focusSlot(T, plan) { const L = slotsOf(T.place); if (ui.slot) { const f = L.find(x => x.id === ui.slot); if (f) return f; } const ord = [...L.filter(x => x.d >= TODAY), ...L.filter(x => x.d < TODAY)]; return ord.find(x => recOf(T, x, plan).status !== 'done') || ord[0]; }
const dayWord = d => d === TODAY ? 'امروز' : d === (TODAY + 1) % 7 ? 'فردا' : DAYS[d];
function balances(T) { const b = {}; T.members.forEach(m => b[m.id] = 0); T.ledger.forEach(e => Object.entries(e.d || {}).forEach(([k, v]) => { if (b[k] != null) b[k] += v; })); Object.keys(b).forEach(k => b[k] = Math.round(b[k])); return b; }
function settle(T) {
  const b = balances(T), deb = Object.entries(b).filter(([, v]) => v < -999).map(([k, v]) => [k, -v]).sort((x, y) => y[1] - x[1]), cre = Object.entries(b).filter(([, v]) => v > 999).sort((x, y) => y[1] - x[1]), out = []; let i = 0, j = 0;
  while (i < deb.length && j < cre.length) { const a = Math.min(deb[i][1], cre[j][1]), r = Math.round(a / 1000) * 1000; if (r >= 1000) out.push({ from: deb[i][0], to: cre[j][0], amt: r }); deb[i][1] -= a; cre[j][1] -= a; if (deb[i][1] < 1) i++; if (cre[j][1] < 1) j++; }
  return out;
}

/* ═════════ screens ═════════ */
function home() {
  const dr = S.drafts[0];
  return `<section class="hero-g"><span class="small" style="font-weight:800">سرویس مشارکتی!</span><h1>مامان، بابا،<br>رسیدیم!</h1>
    <p>هم‌مسیرهای نزدیک‌تان را پیدا کنید، تیم شوید و نوبتی ببرید و بیاورید؛ برای مدرسه، مهد، آموزشگاه، باشگاه، محل کار و دانشگاه.</p>
    <div class="row wrap">${dr ? `<button class="btn" data-a="resume-draft">ادامه‌ی ثبت‌نام «${esc(dr.label || 'پرونده')}»</button>` : `<button class="btn" data-a="new-profile">شروع کنیم؛ ۲ دقیقه</button>`}<button class="btn line" data-a="login">قبلاً ثبت‌نام کرده‌ام</button></div>${artCar('deco')}</section>
  <section class="card stack" style="margin-top:14px"><h2>برای کجا هم‌مسیر می‌خواهید؟</h2>
    <div class="kinds">${Object.entries(KINDS).filter(([k]) => k !== 'other').map(([k, v]) => `<button class="choice" data-a="new-profile" data-kind="${k}">${kindIc(k, true)}${v.n}</button>`).join('')}</div></section>
  <section class="card stack" style="margin-top:14px"><h2>کد یا لینک دعوت دارید؟</h2><div class="row"><div class="field grow"><label for="code" class="hide">کد</label><input id="code" dir="ltr" placeholder="مثلاً ABCD2345" maxlength="40"></div><button class="btn" data-a="go-code">برو</button></div></section>
  <section class="card" style="margin-top:14px"><h2 style="margin-bottom:10px">چطور کار می‌کند؟</h2><ol class="steps3"><li>چند سؤال ساده؛ کجا زندگی می‌کنید، کی می‌روید، چه سهمی دارید.</li><li>نزدیک‌ترین هم‌مسیرها را روی نقشه و فهرست می‌بینید؛ با یک تپ «هم‌مسیر شویم؟»</li><li>تیم که شدید، نوبت‌ها، رسیدن بچه‌ها و حساب‌ها روشن است.</li></ol></section>`;
}
function placeLanding(pl) {
  const k = KINDS[pl.kind] || KINDS.other;
  return `<section class="hero-g"><span class="small" style="font-weight:800">لینک رسیدیمِ ${esc(k.n)}</span><div class="row">${kindIc(pl.kind, true, true)}<h1 style="font-size:clamp(1.6rem,6vw,2.4rem)">${esc(pl.name)}</h1></div>
    <p>${esc(pl.city)}${pl.shift ? ' · ' + esc(pl.shift) : ''} · ورود ${clock(pl.in)} · پایان ${clock(pl.out)}</p>
    <p>${pl.families ? `${fa(pl.families)} خانواده از همین‌جا آمده‌اند؛ هم‌مسیرهای نزدیک‌تان را پیدا کنید.` : 'اولین نفر باشید و لینک را در گروه‌ها بفرستید!'}</p>
    <div class="row wrap"><button class="btn" data-a="join-place">پیوستن در ۲ دقیقه</button>${S.token ? '' : '<button class="btn line" data-a="login">ورود</button>'}</div>${artCar('deco')}</section>
    <div class="stats" style="margin-top:14px"><div class="stat"><b>${fa(pl.families || 0)}</b><span>خانواده</span></div><div class="stat"><b>${fa(pl.drivers || 0)}</b><span>راننده</span></div><div class="stat"><b>${fa(pl.teams || 0)}</b><span>تیم</span></div></div>
    <section class="card" style="margin-top:14px"><ol class="steps3"><li>چند سؤال ساده، گام‌به‌گام.</li><li>هم‌مسیرهای نزدیک روی نقشه.</li><li>با یک تپ «هم‌مسیر شویم؟»</li></ol></section>`;
}
function resumeCard(p) {
  const steps = wizSteps({ p, d: p.data || {}, kind: p.kind, link: null }), mk = missingStep(p), idx = Math.max(0, steps.findIndex(s => s.key === mk));
  return `<section class="card empty">${kindIc(p.kind, true, true)}<h1 style="font-size:1.5rem">پرونده‌ی «${esc(p.label)}» نیمه‌کاره است</h1>
    <p class="muted">${fa(idx)} گام از ${fa(steps.length)} پاسخ داده‌اید. از همان‌جا ادامه دهید؛ چیزی از دست نرفته.</p>
    <div style="width:100%;max-width:340px" class="prog"><i style="width:${Math.round(idx / steps.length * 100)}%"></i></div>
    <button class="btn ac" data-a="wiz-resume">ادامه‌ی پرونده</button></section>`;
}
function peersTab(p) {
  const d = p.data, C = ui.cand, list = C ? C.list : null, t = p.team;
  const mk = missingStep(p);
  const fix = mk ? `<div class="hint warn">${ic('warn')}<span class="grow">یک پاسخ مهم در پرونده مانده است.</span><button class="btn sm" data-a="wiz-fix">پاسخ می‌دهم</button></div>` : '';
  if (!list) return `${fix}<div class="mapbox"><div id="peermap-slot" style="position:absolute;inset:0"></div><span class="badge-src" id="map-src"></span></div><p class="muted" style="text-align:center;margin-top:14px">در حال پیدا کردن هم‌مسیرهای نزدیک…</p>`;
  const avail = list.filter(m => m.rule_ok && !m.mate);
  const sorted = filtered(list).filter(m => !m.mate).sort((a, b) => (b.rule_ok - a.rule_ok) || ((a.dist ? a.dist.m : 9e9) - (b.dist ? b.dist.m : 9e9)));
  const sm = !t ? smartTeam(p, list) : null;
  let hint;
  if (!list.length) hint = `فعلاً اولین نفر هستید! لینک ${esc(placeName(p))} را در گروه‌ها بفرستید؛ هر کس نزدیک شما بیاید خبرتان می‌کنیم.`;
  else if (!t) hint = `${fa(avail.filter(m => !m.team && m.dist && m.dist.m < 3000).length)} خانواده‌ی بی‌تیم در فاصله‌ی ۳ کیلومتری شما هستند. نزدیک‌ترین‌ها بالای فهرست‌اند.`;
  else hint = `شما در ${teamName(t)} هستید. برای اضافه کردن هم‌تیمی، از همین فهرست دعوت کنید.`;
  return `${fix}<div class="split"><div class="stack">
      <div class="hint">${ic(t ? 'team' : 'spark')}<span>${hint}</span></div>
      <div class="mapbox"><div id="peermap-slot" style="position:absolute;inset:0"></div>
        <div class="tools"><div class="chiprow">${[['all', 'همه'], ['free', 'بی‌تیم'], ['drivers', 'راننده‌ها'], ['teams', 'تیم‌ها']].map(([k, v]) => `<button class="fchip" data-a="filter" data-v="${k}" aria-pressed="${ui.filter === k}">${v}</button>`).join('')}</div></div>
        <button class="fab" data-a="fit" aria-label="نمایش همه‌ی هم‌مسیرها">${ic('locate')}</button><span class="badge-src" id="map-src"></span></div>
      <div class="legend" style="border:0;padding:0 4px">${ic('wheel')} رانندگی ${ic('coin')} هزینه ${ic('woman')} مادر ${ic('man')} پدر <span><i class="team-dot" style="background:#8E9892;box-shadow:none"></i>بی‌تیم</span></div>
      ${!list.length ? `<div class="card empty">${artTeam()}<b>اینجا به‌زودی شلوغ می‌شود!</b><p class="muted small">پوستر و لینک ${esc(placeName(p))} را بفرستید؛ هر ثبت‌نام نزدیک شما را خبر می‌دهیم.</p><button class="btn ac" data-a="poster">${ic('share')}لینک و پوستر</button></div>` : ''}
    </div>
    <aside class="stack">
      ${sm ? `<div class="card stack"><div class="row between"><h2>${ic('spark')} چینش پیشنهادی برای شما</h2></div>
        <p class="small">شما + ${sm.list.map(m => esc('خانواده ' + m.family)).join(' + ')}</p><p class="muted small">${fa(sm.drivers)} راننده · ${fa(sm.kids)} مسافر · ${fa(sm.seats)} صندلی</p>
        ${sm.drivers ? '' : `<p class="note" style="color:var(--warn)">${ic('warn')}راننده ندارد؛ یک خانواده‌ی راننده هم دعوت کنید.</p>`}
        <button class="btn ac block" data-a="invite-all">دعوت از همه: هم‌مسیر شویم؟</button></div>` : ''}
      ${sorted.length ? `<div class="row between"><h2>هم‌مسیرهای بالقوه</h2><span class="muted small">از نزدیک به دور</span></div>${sorted.slice(0, 30).map(m => candCard(p, m)).join('')}` : ''}
      <div class="row wrap"><button class="btn line sm" data-a="poster">${ic('print')}لینک و پوستر ${esc(destWord(p))}</button></div>
    </aside></div>`;
}
function candCard(p, m) {
  const sc = score(p, m), t = m.team, c = t ? col(t.color) : null;
  let act;
  if (!m.rule_ok) act = `<button class="btn line sm" disabled>طبق قانون سن و جنسیت ممکن نیست</button>`;
  else if (m.invite && m.invite.dir === 'in') act = `<button class="btn ac sm" data-a="accept" data-id="${m.invite.id}">پذیرفتن دعوت‌شان</button>`;
  else if (m.invite) act = `<button class="btn line sm" disabled>دعوت رفت؛ منتظر پاسخ…</button>`;
  else if (t && p.team) act = `<span class="muted small">هر دو در تیم هستید</span>`;
  else act = `<button class="btn ac sm" data-a="invite" data-id="${m.id}">${t ? 'درخواست پیوستن' : 'هم‌مسیر شویم؟'}</button>`;
  return `<article class="cand ${m.rule_ok ? '' : 'blocked'}"><div class="head"><span class="av ${t ? '' : 'grey'}" style="${c ? `--pc:${c.c};--pi:${c.i}` : ''}">${esc(m.family[0] || '؟')}</span>
    <span class="grow"><b>خانواده ${esc(m.family)}</b> <span class="roles">${m.role !== 'pay' ? ic('wheel') : ''}${m.role !== 'drive' ? ic('coin') : ''}${ic(m.pg === 'f' ? 'woman' : 'man')}</span><br>
    <span class="meta">${m.dist ? `<span><b>${km1(m.dist.m / 1000)} کیلومتر</b> مسیر · ${mins(m.dist.s)} دقیقه</span>` : ''}<span>${esc(m.hood)}</span><span>${t ? teamName(t) : 'بی‌تیم'}</span></span></span>
    <span class="score">${fa(sc.score)}٪<small>هم‌خوانی</small></span></div>
    <div class="why">${sc.reasons.slice(1, 3).map(([x, ok]) => (ok ? '✓ ' : '! ') + esc(x)).join(' · ')}</div>
    <div class="row between wrap"><button class="link" data-a="cand" data-id="${m.id}">جزئیات</button>${act}</div></article>`;
}

function teamTab(p) {
  const t = p.team;
  if (!t) return `<section class="card empty">${artTeam()}<h1 style="font-size:1.5rem">هنوز تیم ندارید</h1><p class="muted" style="max-width:40ch">در «هم‌مسیرها» نزدیک‌ترین خانواده‌ها را ببینید و با یک تپ دعوت کنید. هر تیم دست‌کم یک راننده لازم دارد.</p><button class="btn ac" data-tab="peers">دیدن هم‌مسیرها</button></section>`;
  const T = ui.team; if (!T || !T.team) return `<p class="muted" style="text-align:center;padding:40px">در حال بارگذاری تیم…</p>`;
  const plan = planOf(T), x = focusSlot(T, plan), me = mem(T, p.id), issues = teamIssues(T);
  return `<div class="split"><div class="stack">${x ? todayCard(T, x, plan, p) : ''}${issues.map(i => `<div class="hint warn">${ic('warn')}<span>${esc(i)}</span></div>`).join('')}
      <button class="card row" data-a="quiz" style="text-align:right;border-color:var(--ac)">${ic('trophy')}<span class="grow"><b>لیگ راه ${esc(destWord(p))}</b><br><span class="muted small">معمای امروز را با هم حل کنید؛ پاسخ بعد از رسیدن.</span></span>${ic('back')}</button></div>
    <aside class="stack"><div class="card stack"><div class="row between"><h2>این هفته</h2><span class="muted small">بزنید تا جزئیات و جایگزین</span></div>${weekGrid(T, plan)}</div>
      <div class="card"><div class="row between" style="margin-bottom:6px"><h2><i class="team-dot"></i>${esc(teamName(t))}</h2><span class="tag ac">هر سفر ${money(T.team.price)}</span></div>
        ${T.members.map(m => `<div class="member"><span class="av" style="--pc:var(--ac);--pi:var(--ac-ink)">${esc(m.family[0])}</span><span class="grow"><b>${esc(fam(m))}</b>${m.id === p.id ? ' <span class="tag ac">شما</span>' : ''}${T.team.coord === m.id ? ' <span class="tag">هماهنگ‌کننده</span>' : ''}<br><span class="muted small">${m.kids.map(k => esc(kidName(k, m))).join('، ')}</span></span>
          <span class="roles">${m.role !== 'pay' ? ic('wheel') : ''}${m.role !== 'drive' ? ic('coin') : ''}</span>${m.id !== p.id && m.phone ? `<a class="icon-btn" href="tel:${esc(m.phone)}" aria-label="تماس">${ic('phone')}</a>` : ''}</div>`).join('')}
        <p class="muted small" style="margin-top:8px">مبلغ هر سفر ۶۰٪ میانگین برآورد اسنپ اعضاست. هماهنگ‌کننده خودکار است؛ اگر برود، نفر بعدی می‌شود.</p></div></aside></div>`;
}
function teamIssues(T) {
  const out = [], dr = T.members.filter(m => m.role !== 'pay'), kids = ridersOf(T, 'out').length;
  if (!dr.length) out.push('این تیم راننده ندارد؛ یک خانواده‌ی راننده دعوت کنید.');
  else if (kids > Math.max(...dr.map(m => m.seats || 0))) out.push(`${fa(kids)} مسافر داریم اما بزرگ‌ترین خودرو ${fa(Math.max(...dr.map(m => m.seats || 0)))} صندلی دارد؛ بعضی روزها دو خودرو لازم است.`);
  return out;
}
function todayCard(T, x, plan, p) {
  const r = recOf(T, x, plan), ex = mem(T, r.exec), planned = mem(T, plan[x.id]), ks = ridersOf(T, x.dir), same = slotsOf(T.place).filter(y => y.d === x.d);
  const rem = ex ? [...new Set(T.members.filter(m => m.id !== ex.id).flatMap(m => (m.values || []).filter(v => v !== 'samegender' && v !== 'parent').map(v => VALUES[v])))] : [];
  let body = '', act = '';
  if (r.status === 'pending') {
    body = `<div class="kids">${ks.map(k => `<span class="kid" style="--kc:var(--ac)"><i></i>${esc(kidName(k, mem(T, k.pid)))}</span>`).join('')}</div>`;
    act = `<button class="btn ac block" data-a="t-start" ${ex ? '' : 'disabled'}>راه افتادیم</button><button class="btn line block" data-a="t-swap">${ex && ex.id === p.id ? 'برایم مشکلی پیش آمد' : ex ? 'جایگزین لازم است؟' : 'من می‌برم'}</button>`;
  } else if (r.status === 'started') {
    const all = ks.every(k => r.arr[k.id]);
    body = `<p class="muted small">هر کس رسید رویش بزنید؛ خانواده‌اش خبردار می‌شود.</p><div class="kids">${ks.map(k => `<button class="kid ${r.arr[k.id] ? 'ok' : ''}" style="--kc:var(--ac)" data-a="t-arrive" data-k="${k.id}" ${r.arr[k.id] ? 'aria-pressed="true"' : ''}>${r.arr[k.id] ? ic('check') : '<i></i>'}${esc(kidName(k, mem(T, k.pid)))}${r.arr[k.id] ? ' رسید' : ''}</button>`).join('')}</div>`;
    act = `<label class="check"><input type="checkbox" data-a="t-empty" ${r.empty ? 'checked' : ''} ${all ? '' : 'disabled'}>خودرو خالی است و چیزی جا نمانده</label><button class="btn ac block" data-a="t-finish" ${all && r.empty ? '' : 'disabled'}>ثبت پایان سفر</button>`;
  } else {
    body = `<div class="done"><b>خدا قوت! همه به سلامت رسیدند.</b><span class="muted">${money(T.team.price)} به اعتبار ${esc(fam(ex))} ثبت شد.</span></div>`;
    act = `<button class="btn line block" data-a="t-thanks" ${r.thanks ? 'disabled' : ''}>${ic('heart')}${r.thanks ? 'تشکر شما رسید' : 'دست‌شان درد نکند'}</button><button class="btn ac block" data-a="t-next">نوبت بعدی</button>`;
  }
  const notes = [];
  if (ex && planned && ex.id !== planned.id) notes.push(`به‌جای ${esc(fam(planned))}؛ ممنون از هم‌دلی‌شان.`);
  if (ex && !(ex.days || []).includes(x.d) && r.status === 'pending') notes.push('این روز را اعلام نکرده بودند؛ یک پیام هماهنگی کافی است.');
  if (!ex) notes.push('راننده‌ی سازگاری برای این نوبت نیست؛ یک داوطلب لازم است.');
  return `<article class="today" aria-live="polite">
    <div class="row between wrap"><div class="seg" role="group">${same.map(y => `<button data-a="t-pick" data-s="${y.id}" aria-pressed="${y.id === x.id}">${y.dir === 'out' ? 'رفت' : 'برگشت'} ${clock(y.time)}</button>`).join('')}</div>
      <span class="tag ${r.status === 'done' ? 'ok' : r.status === 'started' ? 'ac' : ''}">${{ pending: 'هنوز راه نیفتاده', started: 'در مسیر', done: 'رسیدیم' }[r.status]}</span></div>
    <div class="when"><b>${dayWord(x.d)}${x.d === TODAY ? '، ' + DAYS[x.d] : ''}</b><span>${x.dir === 'out' ? 'به ' + esc(T.place.name) : 'برگشت به خانه'}</span></div>
    <div class="who">${ex ? `${esc(fam(ex))}<em>می‌برند</em>` : 'بدون راننده'}</div>
    ${notes.map(n => `<p class="note">${ic('warn')}${n}</p>`).join('')}${body}
    ${rem.length && r.status !== 'done' ? `<p class="note">${ic('heart')}یادآوری محترمانه: ${rem.map(esc).join(' · ')}</p>` : ''}
    <div class="stack" style="gap:10px">${act}</div></article>`;
}
function weekGrid(T, plan) {
  const L = slotsOf(T.place), days = [...new Set(L.map(x => x.d))];
  return `<div class="week">${days.map(d => `<div class="wrow ${d === TODAY ? 'now' : ''}"><span class="d">${DAYS[d]}</span>${['out', 'back'].map(dir => {
    const x = L.find(y => y.d === d && y.dir === dir), r = recOf(T, x, plan), f = mem(T, r.exec), pl = plan[x.id];
    const st = r.status === 'done' ? ['ok', 'رسیدیم ✓'] : !f ? ['none', 'داوطلب لازم'] : (pl && pl !== r.exec) ? ['', 'جایگزین'] : !(f.days || []).includes(d) ? ['ask', 'هماهنگی'] : ['', (dir === 'out' ? 'رفت ' : 'برگشت ') + clock(x.time)];
    return `<button class="slot ${st[0]}" style="--sc:${f ? 'var(--ac)' : 'var(--warn)'}" data-a="t-slot" data-s="${x.id}"><b>${f ? esc(f.family) : '—'}</b><small>${st[1]}</small></button>`;
  }).join('')}</div>`).join('')}</div>`;
}
function moneyTab(p) {
  if (!p.team) return `<section class="card empty">${ic('money')}<h1 style="font-size:1.5rem">حساب، بعد از تیم شدن</h1><p class="muted">وقتی تیم شدید، هر سفر خودکار و شفاف حساب می‌شود.</p><button class="btn ac" data-tab="peers">پیدا کردن هم‌مسیر</button></section>`;
  const T = ui.team; if (!T || !T.team) return `<p class="muted" style="text-align:center;padding:40px">در حال بارگذاری…</p>`;
  const b = balances(T), mine = b[p.id] || 0, sg = settle(T), max = Math.max(1, ...Object.values(b).map(Math.abs));
  const log = T.ledger.slice().reverse().slice(0, 14).map(e => { const v = (e.d || {})[p.id] || 0; return `<div><span>${e.kind === 'pay' ? '💳 ' : e.kind === 'gift' ? '🤍 ' : ''}${esc(e.text)}</span><span class="num ${v > 0 ? 'plus' : v < 0 ? 'minus' : 'muted'}">${v ? (v > 0 ? '+' : '−') + fa(sep(v)) : '—'}</span></div>`; }).join('');
  return `<div class="split"><div class="stack"><section class="bal"><span class="muted small">تراز شما در ${esc(teamName(p.team))}</span><span class="big ${mine > 0 ? 'plus' : mine < 0 ? 'minus' : ''}">${mine > 0 ? '+' : mine < 0 ? '−' : ''}${money(mine)}</span>
      <span class="muted">${mine > 0 ? 'بیشتر از سهم‌تان زحمت کشیده‌اید.' : mine < 0 ? 'سهم شما برای تسویه؛ با پرداخت یا رانندگی جبران می‌شود.' : 'حساب شما صاف است. دل‌تان روشن!'}</span></section>
    <section class="card stack"><div class="row between"><h2>پیشنهاد تسویه</h2><button class="link" data-a="how">حساب چطور است؟</button></div>
      ${sg.length ? sg.map((x, i) => `<div class="srow"><b>${esc(fam(mem(T, x.from)))} ← ${esc(fam(mem(T, x.to)))} · <span class="num">${money(x.amt)}</span></b><div class="row">${x.from === p.id || x.to === p.id ? `<button class="btn line sm grow" data-a="t-pay" data-i="${i}">پرداخت شد</button>` : ''}${x.to === p.id ? `<button class="btn line sm grow" data-a="t-gift" data-i="${i}">حلال است</button>` : ''}${x.from !== p.id && x.to !== p.id ? '<span class="muted small">بین دو خانواده‌ی دیگر</span>' : ''}</div></div>`).join('') : '<p class="muted">فعلاً تسویه‌ای لازم نیست.</p>'}</section></div>
    <aside class="stack"><section class="card"><h2 style="margin-bottom:8px">اعضا</h2>${T.members.map(m => `<div class="member"><span class="av" style="--pc:var(--ac);--pi:var(--ac-ink)">${esc(m.family[0])}</span><span class="grow"><b>${esc(fam(m))}</b><div style="height:6px;border-radius:9px;background:var(--surface-2);margin-top:4px;overflow:hidden"><i style="display:block;height:100%;width:${Math.round(Math.abs(b[m.id] || 0) / max * 100)}%;background:var(--ac)"></i></div></span><span class="num ${b[m.id] > 0 ? 'plus' : b[m.id] < 0 ? 'minus' : 'muted'}">${b[m.id] > 0 ? '+' : b[m.id] < 0 ? '−' : ''}${fa(sep(b[m.id] || 0))}</span></div>`).join('')}<p class="muted small" style="margin-top:6px">جمع ترازها همیشه صفر است.</p></section>
      <section class="card"><div class="row between" style="margin-bottom:6px"><h2>دفتر شفاف</h2><span class="muted small">چیزی پاک نمی‌شود</span></div><div class="log">${log || '<p class="muted small">هنوز سفری ثبت نشده.</p>'}</div></section></aside></div>`;
}

/* ═════════ render ═════════ */
function renderTop() {
  const p = active();
  let t;
  if (ui.admin) t = `<img src="assets/icon.svg" alt=""><span><b>پیشخوان مدیریت</b><small>رسیدیم</small></span>`;
  else if (p) { const c = profColor(p); t = `<span class="kind-ic" style="--kc:${c.c};--ki:${c.i}">${ic(KINDS[p.kind] ? KINDS[p.kind].ic : 'dots', '')}</span><span class="grow" style="min-width:0"><b>${esc(p.label)} <span class="pchip">${ic('down', '')}</span></b><small>${p.team ? esc(teamName(p.team)) + ' · ' : ''}${esc(placeName(p) || 'مکان انتخاب نشده')}</small></span>`; }
  else t = `<img src="assets/icon.svg" alt=""><span><b>رسیدیم</b><small>سرویس مشارکتی والدین</small></span>`;
  $('#title').innerHTML = t; $('#title').dataset.a = p && !ui.admin ? 'switcher' : '';
  $('#title').setAttribute('role', p ? 'button' : ''); $('#title').tabIndex = p ? 0 : -1;
  paintBell();
}
function paintBell() { const n = ui.inbox ? ui.inbox.invites.length + ui.inbox.unread : 0; const p = active(); $('#bell').innerHTML = ic('bell') + (n ? `<span class="badge">${fa(n)}</span>` : ''); $('#bell').classList.toggle('hide', !(p && p.complete && S.token) || ui.admin); }
function renderMain(anim) {
  const main = $('#main'), p = active(), dock = $('#dock');
  if (PM.node && PM.node.parentNode) PM.node.parentNode.removeChild(PM.node);
  let html;
  if (ui.admin) html = adminView();
  else if (ui.linkPlace && !(p && p.place && p.place.id === ui.linkPlace.id)) html = placeLanding(ui.linkPlace);
  else if (!p) html = home();
  else if (!p.complete) html = resumeCard(p);
  else html = { peers: peersTab, team: teamTab, money: moneyTab }[ui.tab](p);
  main.innerHTML = html;
  dock.classList.toggle('hide', !(p && p.complete) || ui.admin || (ui.linkPlace && !(p.place && p.place.id === ui.linkPlace.id)));
  dock.querySelectorAll('[data-tab]').forEach(b => b.dataset.tab === ui.tab ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  if (anim) { main.classList.remove('enter'); void main.offsetWidth; main.classList.add('enter'); }
  if ($('#peermap-slot')) mountPeerMap();
}
function render(anim) { renderTop(); renderMain(anim); }

/* ═════════ layers ═════════ */
let lastFocus;
function sheet(title, body, sub) {
  lastFocus = document.activeElement;
  $('#layer').innerHTML = `<div class="scrim" data-a="close"></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-t" tabindex="-1"><div class="sheet-h"><div><h2 id="sh-t">${title}</h2>${sub ? `<p class="muted small">${sub}</p>` : ''}</div><button class="icon-btn" data-a="close" aria-label="بستن">${ic('close')}</button></div><div class="sheet-b">${body}</div></div>`;
  $('.sheet').focus();
}
function closeLayer() { $('#layer').innerHTML = ''; if (lastFocus && document.contains(lastFocus)) lastFocus.focus(); }
const kindIc = (k, big, anim) => { const K = KINDS[k] || KINDS.other, c = col(K.c); return `<span class="kind-ic ${big ? 'lg' : ''} ${anim === false ? '' : 'anim'}" style="--kc:${c.c};--ki:${c.i}">${ic(K.ic, '')}</span>`; };

function switcher() {
  const ps = allProfiles();
  sheet('پرونده‌های شما', `${ps.map(p => profRow(p)).join('')}<button class="btn line" data-a="new-profile">${ic('plus')}پرونده‌ی تازه</button>
    <p class="muted small">برای هر جا یک پرونده: مدرسه، کلاس زبان بچه‌ها، باشگاه، محل کار… با یک تپ بین‌شان جابه‌جا شوید.</p>`);
}
function profRow(p) {
  const c = profColor(p), mk = p.complete ? missingStep(p) : null;
  const st = !p.complete ? '<span class="st warn">نیمه‌کاره</span>' : p.team ? `<span class="st team">تیم ${fa(p.team.no)}</span>` : mk ? '<span class="st warn">یک سؤال مانده</span>' : '<span class="st">بی‌تیم</span>';
  return `<button class="prof ${p.id === S.active ? 'active' : ''}" style="--kc:${c.c};--ki:${c.i}" data-a="use" data-id="${p.id}">${kindIc(p.kind, false, false)}<span class="grow" style="min-width:0"><b>${esc(p.label)}</b><small>${esc(placeName(p) || (KINDS[p.kind] || KINDS.other).n)}</small></span>${st}</button>`;
}
function drawer() {
  const p = active(), ps = allProfiles();
  lastFocus = document.activeElement;
  const mi = (a, i, txt, extra = '') => `<button class="mi" data-a="${a}" ${extra}>${ic(i)}<span class="grow">${txt}</span></button>`;
  $('#layer').innerHTML = `<div class="scrim" data-a="close"></div><nav class="drawer" aria-label="منوی کناری" tabindex="-1">
    <div class="row" style="padding:6px 6px 10px"><img src="assets/icon.svg" width="40" height="40" style="border-radius:12px" alt=""><span class="grow"><b>رسیدیم</b><br><span class="muted small" dir="ltr">${S.phone ? esc(fa(S.phone.replace(/^(\d{4})\d{3}/, '$1•••'))) : 'هنوز وارد نشده‌اید'}</span></span><button class="icon-btn" data-a="theme" aria-label="شب و روز">${ic('moon')}</button><button class="icon-btn" data-a="close" aria-label="بستن">${ic('close')}</button></div>
    <button class="sec-h" data-a="toggle" data-v="profiles" aria-expanded="${ui.open.profiles}"><span>پرونده‌ها (${fa(ps.length)})</span>${ic('down', 'i chev' + (ui.open.profiles ? ' open' : ''))}</button>
    ${p ? profRow(p) : ''}
    <div class="plist ${ui.open.profiles ? '' : 'closed'}" style="max-height:${ui.open.profiles ? 600 : 0}px">${ps.filter(x => x.id !== S.active).map(profRow).join('')}<button class="mi" data-a="new-profile">${ic('plus')}<span class="grow">پرونده‌ی تازه</span></button></div>
    ${p ? `<div class="pacts"><button class="btn line" data-a="wiz-review">مرور پاسخ‌ها</button>${p.complete && (p.place || p.placeDraft) ? `<button class="btn line" data-a="poster">${ic('share', 'i')}لینک و پوستر</button>` : ''}${p.team ? `<button class="btn line" data-a="leave">جدا شدن از تیم</button>` : ''}</div>` : ''}
    <div class="sep"></div>
    ${p && p.complete ? mi('inbox', 'bell', 'دعوت‌ها و پیام‌ها') : ''}
    ${p && p.team ? mi('quiz', 'trophy', 'لیگ راه ' + destWord(p)) : ''}
    ${mi('radio', 'radio', 'رادیو رسیدیم')}
    ${S.token ? mi('ticket', 'ticket', 'پشتیبانی و تیکت') : ''}
    ${mi('rules', 'shield', 'قوانین و حریم خصوصی')}
    ${mi('notify', 'bell', 'روشن کردن نوتیف')}
    ${S.token ? mi('logout', 'logout', 'خروج از حساب') : mi('login', 'user', 'ورود')}
    ${CFG.flags.test_tools ? `<div class="sep"></div><div class="test-zone"><button class="sec-h" data-a="toggle" data-v="test" aria-expanded="${ui.open.test}"><span>${ic('flask', 'i')} گزینه‌های آزمایشی</span>${ic('down', 'i chev' + (ui.open.test ? ' open' : ''))}</button>
      <div class="plist ${ui.open.test ? '' : 'closed'}" style="max-height:${ui.open.test ? 600 : 0}px">
      ${p && p.complete ? mi('t-fake5', 'plus', 'افزودن ۵ همسایه‌ی آزمایشی') + mi('t-fake1', 'car', 'افزودن ۱ راننده‌ی آزمایشی') + mi('t-invme', 'bell', 'یک همسایه به من پیشنهاد بدهد') + mi('t-clear', 'close', 'پاک کردن همسایه‌های آزمایشی') : ''}
      ${p ? mi('t-delprof', 'close', 'پاک کردن کامل این پرونده') : ''}
      ${mi('t-splash', 'spark', 'نمایش دوباره‌ی اسپلش')}
      ${mi('t-reset', 'logout', 'بازنشانی کامل (از صفر)')}
      ${mi('admin', 'gear', 'پیشخوان مدیریت')}</div></div>` : ''}
    <p class="muted small" style="padding:8px">نسخه ۰۶ · ${CFG.service ? 'فاصله‌ها از نقشه‌ی نشان' : 'فاصله‌ها تقریبی (کلید سرویس نشان تنظیم نشده)'}</p></nav>`;
  $('.drawer').focus();
}

/* ═════════ sheets ═════════ */
function famSheet(m) {
  const p = active(), sc = score(p, m), t = m.team, c = t ? col(t.color) : null;
  sheet('خانواده ' + esc(m.family), `
    <div class="row wrap"><span class="tag">${ic(m.pg === 'f' ? 'woman' : 'man')}${m.pg === 'f' ? 'مادر' : 'پدر'}</span>
      ${m.role !== 'pay' ? `<span class="tag">${ic('wheel')}رانندگی${(m.days || []).length ? ': ' + m.days.map(d => DAYS[d]).join('، ') : ''} · ${fa(m.seats)} صندلی</span>` : ''}${m.role !== 'drive' ? `<span class="tag">${ic('coin')}مشارکت مالی</span>` : ''}
      <span class="tag">${fa(m.kids.length)} ${isChild(p) ? (m.kids.every(k => k.g === 'f') ? 'دختر' : m.kids.every(k => k.g === 'm') ? 'پسر' : 'فرزند') : 'نفر'}${isChild(p) ? ' · ' + m.kids.map(k => k.age != null ? fa(k.age) + ' ساله' : '').filter(Boolean).join('، ') : ''}</span>
      ${t ? `<span class="tag" style="background:${c.c};color:${c.i};border-color:${c.c}">${esc(teamName(t))}</span>` : '<span class="tag">بی‌تیم</span>'}</div>
    ${(m.values || []).length ? `<div><span class="lbl">برای‌شان مهم است</span><div class="row wrap" style="margin-top:6px">${m.values.map(v => `<span class="tag">${VALUES[v]}</span>`).join('')}</div></div>` : ''}
    <div class="card stack" style="padding:14px"><div class="row between"><b>هم‌خوانی با شما</b><span class="score big">${fa(sc.score)}٪</span></div><ul class="reason">${sc.reasons.map(([x, ok]) => `<li class="${ok ? '' : 'x'}">${esc(x)}</li>`).join('')}</ul>${m.rule_ok ? '' : '<p class="note" style="color:var(--warn)">طبق قانون رسیدیم، دختران بالای ۸ و پسران بالای ۱۲ سال با غیرهم‌جنس در یک سرویس قرار نمی‌گیرند.</p>'}</div>
    ${m.phone ? `<div class="row between card" style="padding:12px 14px"><span><span class="muted small">شماره</span><br><b class="num" dir="ltr">${esc(fa(m.phone))}</b></span><a class="icon-btn" href="tel:${esc(m.phone)}" aria-label="تماس">${ic('phone')}</a></div>` : '<p class="muted small">شماره‌شان بعد از هم‌تیمی شدن نمایش داده می‌شود.</p>'}
    ${m.rule_ok && !m.mate ? (m.invite ? (m.invite.dir === 'in' ? `<button class="btn ac block" data-a="accept" data-id="${m.invite.id}">پذیرفتن دعوت‌شان</button>` : '<button class="btn line block" disabled>دعوت رفت؛ منتظر پاسخ…</button>') : (t && p.team ? '' : `<button class="btn ac block" data-a="invite" data-id="${m.id}">${t ? 'درخواست پیوستن به ' + esc(teamName(t)) : 'هم‌مسیر شویم؟'}</button>`)) : ''}
    <div class="navs"><a href="geo:${m.lat},${m.lng}?q=${m.lat},${m.lng}">مسیریاب گوشی</a><a href="https://neshan.org/maps/@${m.lat},${m.lng},16z,0p" target="_blank" rel="noopener">نشان</a><a href="https://balad.ir/location?latitude=${m.lat}&longitude=${m.lng}" target="_blank" rel="noopener">بلد</a></div>
    <p class="muted small">${m.exact ? '' : 'موقعیت تقریبی (حدود ۱۵۰ متر) است؛ نقطه‌ی دقیق فقط برای هم‌تیمی‌ها.'}</p>`,
    `${esc(m.hood)}${m.dist ? ' · ' + km1(m.dist.m / 1000) + ' کیلومتر مسیر از شما' : ''}`);
}
async function inboxSheet() {
  await loadInbox(true); const I = ui.inbox; if (!I) return;
  sheet('دعوت‌ها و پیام‌ها', `${I.invites.map(v => `<div class="card stack" style="padding:14px"><b>خانواده ${esc(v.from.family)} دعوت به هم‌مسیری داده‌اند</b><span class="muted small">${esc(v.from.hood)}${v.from.dist ? ' · ' + km1(v.from.dist.m / 1000) + ' کیلومتر مسیر' : ''}</span>
      <div class="row"><button class="btn ac sm grow" data-a="accept" data-id="${v.id}">پذیرفتن</button><button class="btn line sm grow" data-a="decline" data-id="${v.id}">فعلاً نه</button></div></div>`).join('')}
    ${I.notes.map(n => `<div class="row" style="padding:6px 0;border-bottom:1px dashed var(--line)">${ic(n.kind === 'invite' ? 'team' : n.kind === 'arrive' ? 'check' : 'bell')}<span class="grow small">${esc(n.text)}</span></div>`).join('') || (I.invites.length ? '' : '<p class="muted">فعلاً پیامی نیست. وقتی کسی نزدیک شما ثبت‌نام کند یا دعوتی برسد، اینجا می‌بینید.</p>')}
    <button class="btn line sm" data-a="notify">${ic('bell')}روشن کردن نوتیف</button>`);
  paintBell();
}
function posterSheet() {
  const p = active(); const pl = p && p.place; if (!pl) return toast('اول مکان را در پرونده انتخاب کنید.');
  const link = `${location.origin}/${pl.code}`, pretty = `${location.host}/${pl.code}`, hook = isChild(p) ? HOOK.child : HOOK.adult, K = KINDS[pl.kind] || KINDS.other;
  const caption = `🚗 سرویس مشارکتی «${pl.name}»\n${hook}\n\nثبت‌نام در ۲ دقیقه و پیدا کردن هم‌مسیرهای نزدیک:\n${link}\n\n#رسیدیم`;
  ui.caption = caption;
  let qr = ''; try { const q = qrcode(0, 'M'); q.addData(link); q.make(); qr = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); } catch (e) {}
  sheet('لینک و پوستر ' + esc(K.n), `
    <div class="poster" id="poster"><div class="ph"><b>سرویس مشارکتی!</b><h2>${isChild(p) ? 'مامان، بابا، رسیدیم!' : 'هم‌مسیریم؟ رسیدیم!'}</h2><span>${esc(hook)}</span></div>
      <div class="car">${artCar('')}</div><h3 style="font-size:1.25rem">${esc(pl.name)}${pl.shift ? ' · ' + esc(pl.shift) : ''}</h3><div class="qr">${qr}</div>
      <p>QR را اسکن کنید یا وارد این لینک شوید:</p><p class="url">${esc(pretty)}</p><b>با رسیدیم همیشه ما زود می‌رسیم!</b></div>
    <div class="share-grid no-print"><button class="btn sm" data-a="share">${ic('share')}فرستادن</button><button class="btn line sm" data-a="copy-cap">${ic('copy')}کپی متن و لینک</button>
      <button class="btn line sm" data-a="img">${ic('download')}عکس‌نوشت (PNG)</button><button class="btn line sm" data-a="print">${ic('print')}چاپ پوستر</button>
      <a class="btn line sm" target="_blank" rel="noopener" href="https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(caption.replace(link, ''))}">تلگرام</a><a class="btn line sm" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(caption)}">واتساپ</a></div>
    <div class="caption no-print">${esc(caption)}</div>`, 'برای دیوار، بورد اعلانات، گروه کلاس و شبکه‌های اجتماعی');
}
async function posterPng() {
  const p = active(), pl = p.place, link = `${location.origin}/${pl.code}`, hook = isChild(p) ? HOOK.child : HOOK.adult;
  await document.fonts.load('900 40px Vazirmatn'); await document.fonts.load('400 30px Vazirmatn');
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  g.fillStyle = '#1DBF73'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#fff'; roundRect(g, 60, 420, W - 120, 860, 48); g.fill();
  g.direction = 'rtl'; g.textAlign = 'center'; g.fillStyle = '#04140B';
  g.font = '900 44px Vazirmatn'; g.fillText('سرویس مشارکتی!', W / 2, 110);
  g.font = '900 92px Vazirmatn'; g.fillText(isChild(p) ? 'مامان، بابا، رسیدیم!' : 'هم‌مسیریم؟ رسیدیم!', W / 2, 225);
  wrap(g, hook, W / 2, 300, W - 180, 46, '400 34px Vazirmatn');
  const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(artCar('').replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="220" '));
  await new Promise(r => { img.onload = r; img.onerror = r; }); try { g.drawImage(img, W / 2 - 200, 440, 400, 220); } catch (e) {}
  g.fillStyle = '#04140B'; wrap(g, pl.name + (pl.shift ? ' · ' + pl.shift : ''), W / 2, 720, W - 200, 58, '900 50px Vazirmatn');
  try { const q = qrcode(0, 'M'); q.addData(link); q.make(); const n = q.getModuleCount(), size = 340, cell = size / n, x0 = W / 2 - size / 2, y0 = 800; g.fillStyle = '#fff'; g.fillRect(x0 - 16, y0 - 16, size + 32, size + 32); g.fillStyle = '#04140B'; for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) g.fillRect(x0 + k * cell, y0 + r * cell, Math.ceil(cell), Math.ceil(cell)); } catch (e) {}
  g.direction = 'ltr'; g.font = '900 46px Vazirmatn'; g.fillText(`${location.host}/${pl.code}`, W / 2, 1220);
  g.direction = 'rtl'; g.fillStyle = '#04140B'; g.font = '900 40px Vazirmatn'; g.fillText('با رسیدیم همیشه ما زود می‌رسیم!', W / 2, 1320);
  return new Promise(r => c.toBlob(r, 'image/png'));
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function wrap(g, text, x, y, maxW, lh, font) { g.font = font; const words = text.split(' '); let line = '', yy = y; for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, yy); line = w; yy += lh; } else line = t; } if (line) g.fillText(line, x, yy); }

async function quizSheet() {
  const p = active(); if (!p) return;
  sheet('لیگ راه ' + esc(destWord(p)), '<p class="muted">در حال آوردن معمای امروز…</p>');
  let Q; try { Q = await api('quiz_today', { profile_id: p.id }); } catch (e) { return fail(e); }
  const T = ui.team, q = Q.q; if (!$('.sheet')) return;
  const board = T && T.board && T.board.length ? `<div class="board">${T.board.map((b, i) => `<div style="${b.team === (p.team || {}).id ? 'outline:2px solid var(--ac)' : ''}"><b>${fa(i + 1)}</b><i class="team-dot" style="background:${col(b.color).c}"></i><span class="grow">تیم ${fa(b.no)} · ${esc(b.hood)}</span><b>${fa(b.score)}</b> امتیاز</div>`).join('')}</div>` : '<p class="muted small">هنوز امتیازی این هفته ثبت نشده؛ اولین تیم باشید!</p>';
  $('.sheet-b').innerHTML = `<p class="note">${ic('shield')}در مسیر با هم فکر کنید؛ پاسخ را بعد از رسیدن ثبت کنید. راننده درگیر بازی نمی‌شود.</p>
    ${q ? `<div class="card stack"><span class="tag ac">سطح ${fa(q.level)}</span><p class="quiz-q">${esc(q.text)}</p>
      ${Q.done != null ? `<div class="${Q.done ? 'done' : 'hint warn'}"><b>${Q.done ? 'آفرین! درست بود.' : 'این بار نشد؛ فردا!'}</b><span>${esc(Q.why || '')}</span></div>` :
        q.type === 'mc' ? `<div class="stack">${q.choices.map((c, i) => `<button class="btn line" data-a="q-ans" data-v="${i}" data-q="${q.id}">${esc(c)}</button>`).join('')}</div>` :
        `<div class="row"><div class="field grow"><input id="qa" inputmode="numeric" placeholder="پاسخ عددی"></div><button class="btn ac" data-a="q-ans" data-q="${q.id}">ثبت</button></div>`}</div>` : '<p class="muted">معمای امروز آماده نیست.</p>'}
    <h3>جدول این هفته‌ی ${esc(placeName(p))}</h3>${board}
    <div class="card stack"><b>جایزه‌ی این فصل (به انتخاب خودتان)</b><div class="row"><div class="field grow"><input id="prize" value="${esc((T && T.team && T.team.prize) || '')}" placeholder="مثلاً: تیم‌های بازنده بستنی مهمان کنند 🍦"></div><button class="btn line sm" data-a="q-prize">ذخیره</button></div>
      <span class="muted small">قول دوستانه است؛ پولی از رسیدیم جابه‌جا نمی‌شود.</span></div>`;
}
function rulesHtml() {
  return `<div class="rules"><b>پیش‌نویس قوانین استفاده از رسیدیم</b>
    <h4>۱. رسیدیم چیست</h4>رسیدیم بستری برای آشنایی و هماهنگی خانواده‌ها، همکاران و هم‌دانشگاهی‌هاست. رسیدیم خدمات حمل‌ونقل ارائه نمی‌کند، راننده استخدام نمی‌کند و صلاحیت رانندگان را تأیید نمی‌کند.
    <h4>۲. مسئولیت‌ها</h4>هر راننده مسئول داشتن گواهینامه‌ی معتبر، بیمه‌ی خودرو و سرنشین، سلامت فنی خودرو و رعایت قوانین راهنمایی و رانندگی است. هر خانواده خودش هم‌تیمی‌ها را انتخاب و ارزیابی می‌کند و مسئولیت این انتخاب با خودش است.
    <h4>۳. ایمنی کودکان</h4>کمربند ایمنی برای همه، صندلی کودک طبق قانون، تحویل حضوری و ثبت «رسید» برای هر کودک. استفاده از تلفن همراه حین رانندگی ممنوع است.
    <h4>۴. قانون سن و جنسیت</h4>دختران بالای ۸ سال و پسران بالای ۱۲ سال با غیرهم‌جنس در یک سرویس قرار نمی‌گیرند؛ در مدرسه، مهد، آموزشگاه، باشگاه و ورزشگاه.
    <h4>۵. حریم خصوصی</h4>موقعیت خانه‌ها روی نقشه تقریبی است و نقطه‌ی دقیق فقط برای هم‌تیمی‌ها. شماره‌ی تماس فقط با اجازه‌ی شما نمایش داده می‌شود. نام کودکان فقط برای هم‌تیمی‌ها. داده‌ی فردی به تبلیغ‌دهندگان داده نمی‌شود.
    <h4>۶. حساب‌ها</h4>رسیدیم پول نگه نمی‌دارد؛ تسویه مستقیم بین خانواده‌هاست و فقط ثبت می‌شود. مبلغ پیشنهادی هر سفر توافقی است.
    <h4>۷. رفتار محترمانه</h4>احترام، وقت‌شناسی و اطلاع‌رسانی زودهنگام لازم است. مزاحمت، تبعیض یا سوءاستفاده باعث مسدود شدن حساب می‌شود؛ از «پشتیبانی» گزارش دهید.
    <h4>۸. محدودیت مسئولیت</h4>رسیدیم مسئول حوادث، خسارت‌ها، تأخیرها یا اختلافات میان کاربران نیست. استفاده از رسیدیم به معنای پذیرش این قوانین است.
    <p class="muted small" style="margin-top:8px">این متن پیش‌نویس است و پیش از انتشار عمومی باید با یک حقوق‌دان بازبینی شود.</p></div>`;
}

/* ═════════ wizard ═════════ */
const ART = {
  family: '<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="34" cy="28" r="9"/><circle cx="62" cy="28" r="9"/><path d="M18 74c0-12 7-22 16-22s16 10 16 22M46 74c0-12 7-22 16-22s16 10 16 22"/><path class="bob" d="M48 12c2-5 10-5 10 1 0 5-10 10-10 10S38 18 38 13c0-6 8-6 10-1Z" fill="#FF6B8B" stroke-width="2"/></svg>',
  kids: '<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="34" cy="36" r="9"/><path d="M34 46 24 70h20Z" fill="#FFD84D"/><circle cx="64" cy="40" r="8"/><path d="M64 49l-8 20h16Z" fill="#7FD8FF"/><path class="bob" d="M74 18l3 6 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1Z" fill="#1DBF73" stroke-width="2"/></svg>',
  home: '<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M16 48 44 24l28 24"/><path d="M24 44v30h40V44"/><rect x="38" y="56" width="12" height="18"/><path class="bob" d="M76 20c-6 0-10 4-10 10 0 8 10 16 10 16s10-8 10-16c0-6-4-10-10-10Z" fill="#1DBF73"/><circle cx="76" cy="30" r="3" fill="#fff"/></svg>',
  clock: '<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="48" cy="50" r="30"/><path d="M48 32v18l12 8"/><path class="bob" d="M20 20l10 8M76 20l-10 8" stroke="#1DBF73" stroke-width="4"/></svg>',
  wheel: '<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="40" cy="50" r="26"/><circle cx="40" cy="50" r="6"/><path d="M16 44c8 2 16 2 24 2s16 0 24-2M40 56v20"/><g class="bob"><circle cx="76" cy="26" r="13" fill="#FFD84D"/><path d="M76 19v14M80 22c-1-2-7-2-7 1s7 2 7 5-6 3-7 1" stroke-width="2"/></g></svg>',
  coin: '<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><rect x="14" y="30" width="58" height="40" rx="8"/><path d="M14 42h58"/><g class="bob"><circle cx="72" cy="66" r="14" fill="#1DBF73"/><path d="M72 58v16" stroke="#fff"/></g></svg>',
  heart: '<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path class="bob" d="M48 78S18 60 18 38a14 14 0 0 1 30-6 14 14 0 0 1 30 6c0 22-30 40-30 40Z" fill="#FFB3C4"/><path d="M36 44l8 8 16-16"/></svg>',
  phone: '<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><rect x="30" y="14" width="34" height="66" rx="8"/><path d="M42 70h10"/><g class="bob"><rect x="56" y="18" width="30" height="20" rx="8" fill="#1DBF73"/><path d="M63 28h2M70 28h2M77 28h2" stroke="#fff"/></g></svg>',
  shield: '<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M48 12 20 24v20c0 18 12 31 28 38 16-7 28-20 28-38V24Z" fill="#E6F9EF"/><path class="bob" d="m36 48 9 9 16-18" stroke="#1DBF73" stroke-width="5"/></svg>',
  party: '<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:130px;height:130px"><path d="M18 80 34 30l32 32Z" fill="#FFD84D"/><path d="M26 56l14 14M30 44l22 22"/><g class="bob"><path d="M62 18l2 6M78 26l-5 4M82 44h-6M56 34c4-6 10-6 12-2" stroke="#1DBF73" stroke-width="4"/><circle cx="70" cy="14" r="3" fill="#FF6B8B" stroke="none"/><circle cx="86" cy="34" r="3" fill="#4F8CFF" stroke="none"/></g></svg>'
};
function artCar(cls) { return `<svg class="${cls}" viewBox="0 0 200 110" fill="none" stroke="#04140B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 80V62c0-5 3-8 8-9l14-3 12-18c2-3 5-5 9-5h44c4 0 8 2 10 6l11 17 10 2c5 1 8 5 8 10v18Z" fill="#fff"/><path d="M52 50l10-15c1-2 3-2 4-2h16v17ZM90 33h12c2 0 4 1 5 3l9 14H90Z" fill="#BFF3D8"/><circle cx="52" cy="84" r="11" fill="#04140B"/><circle cx="128" cy="84" r="11" fill="#04140B"/><path d="M10 96h180"/></svg>`; }
function artTeam() { return `<svg width="120" height="90" viewBox="0 0 120 90" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" class="draw"><circle cx="30" cy="30" r="10"/><circle cx="60" cy="24" r="10"/><circle cx="90" cy="30" r="10"/><path d="M14 74c0-12 7-22 16-22s16 10 16 22M44 70c0-12 7-24 16-24s16 12 16 24M74 74c0-12 7-22 16-22s16 10 16 22"/><path class="bob" d="M50 6l3 5 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1Z" fill="var(--ac)" stroke-width="2"/></svg>`; }

const placeGender = w => (w.link && w.link.gender) || (w.place && w.place.gender) || null;
const wChild = w => { const k = KINDS[w.kind] || KINDS.other; return k.child ?? !!w.d.forKids; };
function wizSteps(w) {
  const all = [
    { key: 'place0', show: w => !!w.link && w.mode === 'new', art: () => kindIcWiz(w.link.kind), q: w => `«${esc(w.link.name)}» همان‌جایی است که می‌روید؟`, help: w => `${esc(w.link.city)}${w.link.shift ? ' · ' + esc(w.link.shift) : ''} · ورود ${clock(w.link.in)} · پایان ${clock(w.link.out)}`,
      body: w => `<div class="choices"><button class="choice" data-a="w-set" data-k="ok0" data-v="1" aria-pressed="${w.d.ok0 === 1}">بله، همین‌جاست ${ic('check')}</button><button class="choice" data-a="w-notthis">نه، جای دیگری است</button></div>`, ok: w => w.d.ok0 === 1 || 'اگر همین‌جاست «بله» را بزنید.' },
    { key: 'kind', show: () => true, art: w => kindIcWiz(w.kind || 'school'), q: w => w.link ? 'اسم این پرونده چه باشد؟' : 'این پرونده برای کجاست؟', help: () => 'برای هر جا یک پرونده می‌سازید و با یک تپ بین‌شان جابه‌جا می‌شوید.',
      body: w => `${w.link ? '' : `<div class="kinds">${Object.entries(KINDS).map(([k, v]) => `<button class="choice" data-a="w-kind" data-v="${k}" aria-pressed="${w.kind === k}">${kindIc(k, true)}${v.n}</button>`).join('')}</div>`}
        <div class="field"><label for="w-label">اسم پرونده (به انتخاب خودتان)</label><input id="w-label" data-w="label" value="${esc(w.label || '')}" placeholder="${esc((KINDS[w.kind] || KINDS.school).lbl || 'مثلاً کلاس زبان بچه‌ها')}"></div>
        ${w.kind === 'other' ? `<span class="lbl">برای چه کسی؟</span><div class="chips"><button class="chip" data-a="w-set" data-k="forKids" data-v="1" aria-pressed="${w.d.forKids === 1}">برای فرزندانم</button><button class="chip" data-a="w-set" data-k="forKids" data-v="0" aria-pressed="${w.d.forKids === 0}">برای خودم</button></div>` : ''}`,
      ok: w => !w.kind ? 'یکی را انتخاب کنید.' : (w.kind === 'other' && w.d.forKids == null) ? 'برای فرزندان است یا خودتان؟' : true },
    { key: 'family', show: () => true, art: () => ART.family, q: () => 'فامیل شریف‌تان؟', help: w => wChild(w) ? 'روی نقشه با نام خانوادگی دیده می‌شوید؛ مثل «خانواده آسمان».' : 'هم‌مسیرها شما را با «خانم/آقای» و نام خانوادگی می‌بینند.',
      body: w => `<div class="field"><label for="w-fam">نام خانوادگی</label><input id="w-fam" data-wd="family" value="${esc(w.d.family || '')}" placeholder="مثلاً آسمان" autocomplete="family-name"></div>
        <span class="lbl">${wChild(w) ? 'شما مادر هستید یا پدر؟' : 'خانم هستید یا آقا؟'}</span><div class="choices two"><button class="choice col" data-a="w-set" data-k="pg" data-v="f" aria-pressed="${w.d.pg === 'f'}">${ic('woman', 'emo')}${wChild(w) ? 'مادر' : 'خانم'}</button><button class="choice col" data-a="w-set" data-k="pg" data-v="m" aria-pressed="${w.d.pg === 'm'}">${ic('man', 'emo')}${wChild(w) ? 'پدر' : 'آقا'}</button></div>`,
      ok: w => (w.d.family || '').trim().length < 2 ? 'نام خانوادگی را بنویسید.' : !w.d.pg ? 'یکی را انتخاب کنید.' : true },
    { key: 'kids', show: w => wChild(w), art: () => ART.kids, q: w => (w.d.kids || []).length > 1 ? 'فرزندان گل‌تان؟' : 'فرزند گل‌تان؟', help: () => 'اسم کوچک کنار فامیل نوشته می‌شود و فقط هم‌تیمی‌ها می‌بینند. سال تولد برای قانون سن و جنسیت و سطح بازی‌هاست.',
      body: w => { const g = placeGender(w); const years = Array.from({ length: 18 }, (_, i) => JY - 2 - i); return `<div class="stepper"><span class="lbl grow">تعداد</span><button class="btn line" data-a="w-count" data-v="-1" aria-label="کمتر">−</button><output>${fa((w.d.kids || []).length)}</output><button class="btn line" data-a="w-count" data-v="1" aria-label="بیشتر">+</button></div>
        ${(w.d.kids || []).map((k, i) => `<div class="kidcard"><div class="field"><label for="w-k${i}">اسم فرزند ${fa(i + 1)}</label><input id="w-k${i}" data-wk="${i}" data-f="first" value="${esc(k.first || '')}" placeholder="نام کوچک"></div>
          ${g === 'f' || g === 'm' ? '' : `<div class="chips"><button class="chip" data-a="w-kid" data-i="${i}" data-f="g" data-v="f" aria-pressed="${k.g === 'f'}">دختر</button><button class="chip" data-a="w-kid" data-i="${i}" data-f="g" data-v="m" aria-pressed="${k.g === 'm'}">پسر</button></div>`}
          <div class="field"><label for="w-by${i}">سال تولد</label><select id="w-by${i}" data-wk="${i}" data-f="by"><option value="">انتخاب کنید</option>${years.map(y => `<option value="${y}" ${+k.by === y ? 'selected' : ''}>${fa(y)} (${fa(JY - y)} ساله)</option>`).join('')}</select></div></div>`).join('')}
        ${g === 'f' || g === 'm' ? `<p class="note">${ic('check')}اینجا ${g === 'f' ? 'دخترانه' : 'پسرانه'} است؛ جنسیت را نمی‌پرسیم.</p>` : ''}`; },
      ok: w => { const ks = w.d.kids || [], g = placeGender(w); if (!ks.length) return 'دست‌کم یک فرزند.'; if (ks.some(k => !(k.first || '').trim())) return 'اسم همه را بنویسید.'; if (!(g === 'f' || g === 'm') && ks.some(k => !k.g)) return 'دختر یا پسر بودن را انتخاب کنید.'; if (ks.some(k => !k.by)) return 'سال تولد را انتخاب کنید.'; return true; } },
    { key: 'home', show: () => true, art: () => ART.home, q: () => 'کجا زندگی می‌کنید؟', help: () => 'نقشه را جابه‌جا کنید تا پین روی در خانه بنشیند. روی نقشه‌ی دیگران موقعیت شما تقریبی (حدود ۱۵۰ متر) دیده می‌شود.',
      body: w => `<div class="mapbox" id="pick-home"><div class="mapc-holder" style="position:absolute;inset:0"></div><div class="picker-pin"><div class="head"></div><div class="dot"></div></div><button class="fab" data-a="w-locate" aria-label="موقعیت فعلی من">${ic('locate')}</button></div>
        <p class="addr">${ic('pin')}<span id="w-addr">${w.d.lat ? (w.addr ? esc(w.addr) : 'موقعیت انتخاب شد') : 'نقشه را جابه‌جا کنید یا «موقعیت من» را بزنید'}</span></p>
        <div class="field"><label for="w-hood">نام محله</label><input id="w-hood" data-wd="hood" value="${esc(w.d.hood || '')}" placeholder="مثلاً نارون"></div>
        <details><summary class="small" style="cursor:pointer;font-weight:700">راه دیگر: چسباندن لینک موقعیت از نشان، بلد یا گوگل</summary><div class="row" style="margin-top:8px"><div class="field grow"><input id="w-paste" dir="ltr" placeholder="لینک یا مختصات"></div><button class="btn sm" data-a="w-paste">ثبت</button></div></details>`,
      mount: w => mountPicker('#pick-home', w.d.lat ? [w.d.lat, w.d.lng] : (w.link ? [w.link.lat, w.link.lng] : [35.7, 51.39]), (la, ln) => { w.d.lat = la; w.d.lng = ln; reverseFill(w); }),
      ok: w => !w.d.lat ? 'موقعیت خانه را روی نقشه مشخص کنید.' : !(w.d.hood || '').trim() ? 'نام محله را بنویسید.' : true },
    { key: 'needs', show: () => true, art: () => ART.clock, q: () => 'کدام مسیرها را لازم دارید؟', help: w => w.link || w.place ? `ساعت‌ها: شروع ${clock((w.link || w.place).in)} و پایان ${clock((w.link || w.place).out)}.` : 'ساعت‌ها را بعداً از مکان می‌خوانیم.',
      body: w => `<div class="choices">${[['both', 'هر دو؛ رفت و برگشت'], ['out', 'فقط رفت'], ['back', 'فقط برگشت']].map(([k, v]) => `<button class="choice" data-a="w-needs" data-v="${k}" aria-pressed="${needKey(w.d) === k}">${v}</button>`).join('')}</div>`, ok: () => true },
    { key: 'role', show: () => true, art: () => ART.wheel, q: () => 'سهم شما در سرویس؟', help: () => 'تیمی که راننده نداشته باشد راه نمی‌افتد؛ حتی یک روز در هفته رانندگی کمک بزرگی است.',
      body: w => `<div class="choices">${[['drive', 'wheel', 'رانندگی می‌کنم', 'روزهایی که بتوانم می‌برم'], ['pay', 'coin', 'فقط هزینه می‌دهم', 'سهم منصفانه‌ی هر سفر را می‌دهم'], ['both', 'wheel', 'هر دو', 'گاهی می‌برم، گاهی هزینه می‌دهم']].map(([k, i, t, s]) => `<button class="choice" data-a="w-set" data-k="role" data-v="${k}" aria-pressed="${w.d.role === k}">${ic(i, 'emo')}<span>${t}<small>${s}</small></span>${k === 'both' ? ic('coin', 'emo') : ''}</button>`).join('')}</div>
        ${w.d.role && w.d.role !== 'pay' ? `<span class="lbl">کدام روزها می‌توانید ببرید؟</span><div class="chips">${[0, 1, 2, 3, 4, 5].map(d => `<button class="chip" data-a="w-day" data-v="${d}" aria-pressed="${(w.d.days || []).includes(d)}">${DAYS[d]}</button>`).join('')}</div>
        <div class="stepper"><span class="lbl grow">صندلی خالی برای ${wChild(w) ? 'بچه‌ها' : 'هم‌مسیرها'}</span><button class="btn line" data-a="w-seats" data-v="-1" aria-label="کمتر">−</button><output>${fa(w.d.seats || 3)}</output><button class="btn line" data-a="w-seats" data-v="1" aria-label="بیشتر">+</button></div>` : ''}`,
      ok: w => !w.d.role ? 'یکی را انتخاب کنید.' : (w.d.role !== 'pay' && !(w.d.days || []).length) ? 'دست‌کم یک روز را انتخاب کنید.' : true },
    { key: 'values', show: () => true, art: () => ART.heart, q: () => 'چه چیزهایی برایتان مهم است؟', help: () => 'محترم‌اند و دلیل نمی‌خواهند. در پیشنهاد هم‌مسیر و یادآوری به راننده رعایت می‌شوند. اختیاری است.',
      body: w => `<div class="chips">${Object.entries(VALUES).filter(([k]) => wChild(w) || (k !== 'samegender' && k !== 'parent')).map(([k, v]) => `<button class="chip" data-a="w-val" data-v="${k}" aria-pressed="${(w.d.values || []).includes(k)}">${v}</button>`).join('')}</div>`, ok: () => true },
    { key: 'place', show: w => !w.link, art: w => kindIcWiz(w.kind), q: w => `کدام ${(KINDS[w.kind] || KINDS.other).n}؟`, help: () => 'از نزدیک‌ترین‌ها به خانه‌ی شما. اگر نیست، ثبتش کنید تا لینک و پوسترش ساخته شود.',
      body: w => placeStep(w), mount: w => { if (!w.near) loadNear(w); if (w.newPlace) mountPicker('#pick-place', w.newPlace.lat ? [w.newPlace.lat, w.newPlace.lng] : [w.d.lat, w.d.lng], (la, ln) => { w.newPlace.lat = la; w.newPlace.lng = ln; checkDup(w); }); },
      ok: w => { if (w.place) return true; const n = w.newPlace; if (!n) return 'یک مورد را انتخاب کنید یا مکان تازه ثبت کنید.'; if ((n.name || '').trim().length < 3) return 'نام را بنویسید.'; if (wChild(w) && !n.gender) return 'دخترانه، پسرانه یا دختر و پسر؟'; if (!n.lat) return 'موقعیت را روی نقشه مشخص کنید.'; if (n.dups && n.dups.length && !n.dupOk) return 'بگویید همین است یا جای دیگری.'; return true; } },
    { key: 'snapp', show: () => true, art: () => ART.coin, q: () => 'یک مسیر با اسنپ حدوداً چقدر می‌شود؟', help: () => 'سهم منصفانه‌ی هر سفر، ۶۰٪ میانگین برآورد اعضای تیم پیشنهاد می‌شود. عددی که بنویسید مبنا می‌شود.',
      body: w => { const tgt = w.link || w.place || w.newPlace; const r = w.route; return `${r ? `<p class="hint">${ic('car')}<span>از خانه تا ${esc(tgt ? tgt.name : 'مقصد')}: حدود <b>${km1(r.m / 1000)} کیلومتر</b> مسیر و ${mins(r.s)} دقیقه${r.src === 'road' ? '' : ' (تقریبی)'}.</span></p>` : ''}
        <span class="lbl">برای دیدن قیمت در اسنپ: الان کجایید؟</span><div class="chips"><button class="chip" data-a="w-snapp" data-v="home">کنار خانه</button><button class="chip" data-a="w-snapp" data-v="dest">کنار ${esc(destWord({ kind: w.kind }))}</button></div>
        <p class="note">${ic('copy')}نشانی طرف مقابل کپی می‌شود و اسنپ باز می‌شود؛ مقصد را بچسبانید، قیمت را ببینید و برگردید.</p>
        <div class="field"><label for="w-snapp">مبلغ یک مسیر (تومان)</label><input id="w-snapp" data-wd="snapp" inputmode="numeric" value="${w.d.snapp ? fa(w.d.snapp) : ''}" placeholder="${r ? fa(estSnapp(r.m)) : 'مثلاً ۹۰٬۰۰۰'}"></div>
        ${r && !w.d.snapp ? `<button class="link" data-a="w-est">از برآورد ما استفاده کن: ${money(estSnapp(r.m))}</button>` : ''}`; },
      mount: w => routeFor(w), ok: w => +en(w.d.snapp) >= 10000 || 'یک عدد تقریبی بنویسید؛ مثلاً ۹۰٬۰۰۰.' },
    { key: 'rules', show: () => true, art: () => ART.shield, q: () => 'قول و قرار ما', help: () => 'کوتاه است؛ برای خیال راحت همه.',
      body: w => `${rulesHtml()}<label class="check" style="background:transparent"><input type="checkbox" data-a="w-rules" ${w.d.rules_at ? 'checked' : ''}>قوانین را خواندم و می‌پذیرم</label>
        <label class="check" style="background:transparent"><input type="checkbox" data-a="w-show" ${w.d.phone_show ? 'checked' : ''}>شماره‌ام قبل از هم‌تیمی شدن هم به هم‌مسیرهای همین مکان نشان داده شود</label>`,
      ok: w => w.d.rules_at ? true : 'برای ادامه، قوانین را بپذیرید.' },
    { key: 'phone', show: () => !S.token, art: () => ART.phone, q: () => 'شماره همراه‌تان؟', help: () => 'کد تأیید پیامک می‌شود. با همین شماره همه‌ی پرونده‌هایتان در یک حساب می‌ماند.',
      body: w => `<div class="field"><label for="w-ph">شماره همراه</label><input id="w-ph" data-w="phone" type="tel" inputmode="tel" dir="ltr" value="${esc(w.phone || '')}" placeholder="09121234567" autocomplete="tel"></div>
        ${w.otpSent ? `<div class="field"><label for="w-otp">کد تأیید</label><input id="w-otp" class="otp" data-w="otp" inputmode="numeric" maxlength="6" autocomplete="one-time-code" value="${esc(w.otp || '')}"></div>${w.devCode ? `<p class="note">${ic('flask')}سرویس پیامک هنوز فعال نیست؛ کد آزمایشی: <b dir="ltr">${fa(w.devCode)}</b></p>` : '<p class="note">کد را پیامک کردیم.</p>'}<button class="link" data-a="w-resend">ارسال دوباره</button>` : ''}`,
      ok: w => !w.otpSent ? 'otp-send' : (en(w.otp || '').length < 4 ? 'کد را وارد کنید.' : 'otp-verify') }
  ];
  return all.filter(s => s.show(w));
}
const kindIcWiz = k => `<div style="margin-top:8px">${kindIc(k, true)}</div>`;
const needKey = d => { const n = d.needs || { out: true, back: true }; return n.out && n.back ? 'both' : n.out ? 'out' : 'back'; };
const estSnapp = m => Math.round((45000 + 18 * m) / 5000) * 5000;
function placeStep(w) {
  const near = w.near, n = w.newPlace, K = KINDS[w.kind] || KINDS.other;
  if (n) return `<div class="field"><label for="w-pn">نام ${esc(K.n)}</label><input id="w-pn" data-wp="name" value="${esc(n.name || '')}" placeholder="مثلاً ${w.kind === 'institute' ? 'آموزشگاه زبان ستاره' : 'دبستان مهر'}"></div>
    <div class="field"><label for="w-pc">شهر</label><select id="w-pc" data-wp="city">${CITIES.map(c => `<option ${n.city === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
    ${wChild(w) ? `<span class="lbl">پذیرش</span><div class="chips">${[['f', 'دخترانه'], ['m', 'پسرانه'], ['fm', 'دختر و پسر']].map(([k, v]) => `<button class="chip" data-a="w-np" data-k="gender" data-v="${k}" aria-pressed="${n.gender === k}">${v}</button>`).join('')}</div>
      ${n.gender === 'fm' ? `<div class="chips">${['هم‌زمان', 'در شیفت‌های جدا'].map(v => `<button class="chip" data-a="w-np" data-k="mix" data-v="${v}" aria-pressed="${n.mix === v}">${v}</button>`).join('')}</div>` : ''}` : ''}
    <span class="lbl">شیفت یا واحد</span><div class="chips">${['صبح', 'عصر', 'تمام‌وقت', 'شیفتی'].map(v => `<button class="chip" data-a="w-np" data-k="shift" data-v="${v}" aria-pressed="${n.shift === v}">${v}</button>`).join('')}</div>
    <div class="row"><div class="field grow"><label for="w-pin">شروع</label><input id="w-pin" type="time" data-wp="in" value="${n.in || '07:30'}"></div><div class="field grow"><label for="w-pout">پایان</label><input id="w-pout" type="time" data-wp="out" value="${n.out || '13:30'}"></div></div>
    <span class="lbl">موقعیت در ورودی</span><div class="mapbox" id="pick-place"><div class="mapc-holder" style="position:absolute;inset:0"></div><div class="picker-pin"><div class="head"></div><div class="dot"></div></div></div>
    <p class="addr">${ic('pin')}<span>${n.lat ? 'موقعیت ثبت شد' : 'نقشه را روی در ورودی بیاورید'}</span></p>
    <div class="row wrap"><button class="btn line sm" data-a="w-np-here">${ic('locate')}کنار در ورودی هستم</button></div>
    <details><summary class="small" style="cursor:pointer;font-weight:700">راه دیگر: چسباندن لینک موقعیت</summary><div class="row" style="margin-top:8px"><div class="field grow"><input id="w-np-paste" dir="ltr" placeholder="لینک یا مختصات"></div><button class="btn sm" data-a="w-np-paste">ثبت</button></div></details>
    ${(n.dups || []).map(d => `<div class="hint warn">${ic('warn')}<span>احتمالاً «${esc(d.name)}${d.shift ? ' · ' + esc(d.shift) : ''}» همین‌جا ثبت شده.<br><span class="row wrap" style="margin-top:8px"><button class="btn sm" data-a="w-pick" data-id="${d.id}">همین است</button><button class="btn line sm" data-a="w-dupok">نه، واحد یا شیفت دیگری است</button></span></span></div>`).join('')}
    <button class="link" data-a="w-np-cancel">بازگشت به فهرست</button>`;
  return `<div class="field"><label for="w-q">جستجو</label><input id="w-q" data-w="pq" value="${esc(w.pq || '')}" placeholder="نام ${esc(K.n)}"></div>
    ${!near ? '<p class="muted">در حال پیدا کردن نزدیک‌ترین‌ها…</p>' : near.map(pl => `<button class="place-opt" data-a="w-pick" data-id="${pl.id}" aria-pressed="${w.place && w.place.id === pl.id}">${kindIc(pl.kind, false, false)}<span class="grow">${esc(pl.name)}<small>${esc(pl.city)}${pl.shift ? ' · ' + esc(pl.shift) : ''} · ${km1(pl.d / 1000)} کیلومتر · ${fa(pl.families)} خانواده</small></span></button>`).join('') || '<p class="muted">نزدیک شما چیزی ثبت نشده؛ اولین نفر باشید!</p>'}
    <button class="btn line block" data-a="w-np-new">${ic('plus')}ثبت ${esc(K.n)} تازه</button>`;
}
async function loadNear(w) { try { const r = await api('place_near', { lat: w.d.lat, lng: w.d.lng, kind: w.kind === 'other' ? '' : w.kind, q: w.pq || '' }); w.near = r.places; } catch (e) { w.near = []; } if (ui.wiz === w) wizRender(); }
async function checkDup(w) { try { const r = await api('place_near', { lat: w.newPlace.lat, lng: w.newPlace.lng }); const d = r.places.filter(x => x.d < 250); const had = (w.newPlace.dups || []).length; w.newPlace.dups = d; if (d.length !== had && ui.wiz === w) wizRender(); } catch (e) {} }
async function routeFor(w) { const t = w.link || w.place || w.newPlace; if (!t || !t.lat || !w.d.lat || (w.route && w.route.key === t.lat + ',' + w.d.lat)) return; try { const r = await api('route', { a: [w.d.lat, w.d.lng], b: [t.lat, t.lng] }); w.route = { ...r, key: t.lat + ',' + w.d.lat }; } catch (e) { const m = hav(w.d.lat, w.d.lng, t.lat, t.lng) * 1.3; w.route = { m, s: m / 6.5, src: 'est', key: t.lat + ',' + w.d.lat }; } if (ui.wiz === w) wizRender(); }
let revT; function reverseFill(w) { clearTimeout(revT); revT = setTimeout(async () => { try { const r = await api('reverse', { lat: w.d.lat, lng: w.d.lng }); if (r.address) { w.addr = r.address; const a = $('#w-addr'); if (a) a.textContent = r.address; } if (r.hood && (!w.d.hood || w.autoHood)) { w.d.hood = r.hood; w.autoHood = true; const h = $('#w-hood'); if (h) h.value = r.hood; } else { const a = $('#w-addr'); if (a && !r.address) a.textContent = 'موقعیت انتخاب شد'; } } catch (e) { const a = $('#w-addr'); if (a) a.textContent = 'موقعیت انتخاب شد'; } }, 650); }

function wizOpen(p, opts = {}) {
  closeLayer();
  const base = p ? JSON.parse(JSON.stringify(p)) : null;
  const w = { pid: p ? p.id : null, mode: opts.mode || 'new', kind: base ? base.kind : (opts.kind || (opts.link ? opts.link.kind : null)), label: base ? base.label : '', d: base ? (base.data || {}) : { kids: [], needs: { out: true, back: true }, seats: 3, values: [], phone_show: false },
    place: base ? base.place : null, link: opts.link || null, newPlace: base && base.placeDraft ? base.placeDraft : null, err: '', step: 0, busy: false };
  if (!w.label && w.kind) w.label = (KINDS[w.kind] || KINDS.other).lbl;
  if (w.link && !w.label) w.label = w.link.name;
  if (w.link) w.kind = w.link.kind;
  if (!w.d.kids) w.d.kids = [];
  if (wChild(w) && !w.d.kids.length) w.d.kids = [{ id: uid(), first: '', g: '', by: '' }];
  { const g = placeGender(w); if (g === 'f' || g === 'm') w.d.kids.forEach(k => k.g = g); }
  const steps = wizSteps(w);
  if (opts.at) w.step = Math.max(0, steps.findIndex(s => s.key === opts.at));
  else if (w.mode === 'resume' && p) { const mk = missingStep(p); w.step = Math.max(0, steps.findIndex(s => s.key === mk)); }
  ui.wiz = w; wizRender();
}
function wizRender() {
  const w = ui.wiz; if (!w) { $('#wiz-root').innerHTML = ''; return; }
  if (w.done) { $('#wiz-root').innerHTML = wizDone(w); return; }
  const steps = wizSteps(w); if (w.step >= steps.length) w.step = steps.length - 1;
  const st = steps[w.step], total = steps.length;
  const ae = document.activeElement, root = $('#wiz-root'), same = w._shown === st.key;
  const sel = ae && root.contains(ae) ? (ae.id ? '#' + ae.id : ['a', 'k', 'v', 'i', 'f'].filter(k => ae.dataset[k] != null).map(k => `[data-${k}="${ae.dataset[k]}"]`).join('')) : null;
  const sc = $('.wiz-body') ? $('.wiz-body').scrollTop : 0;
  if (PK.node && PK.node.parentNode) PK.node.parentNode.removeChild(PK.node);
  w._shown = st.key;
  const review = w.mode === 'review' || w.mode === 'fix';
  root.innerHTML = `<div class="wiz ${same ? '' : 'enter'}" role="dialog" aria-modal="true" aria-labelledby="wq">
    <div class="wiz-top"><button class="icon-btn" data-a="w-close" aria-label="بستن">${ic('close')}</button><div class="prog" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${w.step + 1}"><i style="width:${Math.max(6, Math.round((w.step + 1) / total * 100))}%"></i></div><span class="wiz-count">${review ? '<span class="review-tag">مرور</span> ' : ''}گام ${fa(w.step + 1)} از ${fa(total)}</span></div>
    <div class="wiz-body">${typeof st.art === 'function' ? st.art(w) : ''}<h1 class="wiz-q" id="wq">${st.q(w)}</h1><p class="wiz-help">${st.help(w)}</p>${st.body(w)}<p class="err" role="alert">${esc(w.err)}</p></div>
    <div class="wiz-foot"><button class="btn block" data-a="w-next" ${w.busy ? 'disabled' : ''}>${w.busy ? 'لطفاً صبر کنید…' : nextLabel(w, st, steps)}</button>${w.step > 0 ? '<button class="btn line block" data-a="w-prev">قبلی</button>' : ''}</div></div>`;
  if (same) { $('.wiz-body').scrollTop = sc; const n = sel && root.querySelector(sel); if (n) n.focus({ preventScroll: true }); }
  else { const f = root.querySelector('.wiz-body input:not([type=checkbox]), .wiz-body .choice, [data-a="w-next"]'); f && f.focus({ preventScroll: true }); }
  if (st.mount) st.mount(w);
}
function nextLabel(w, st, steps) {
  if (st.key === 'phone') return w.otpSent ? 'تأیید و ساخت پرونده' : 'ارسال کد';
  if (w.step === steps.length - 1) return w.mode === 'review' ? 'پایان مرور' : 'تمام؛ بسازیم!';
  return w.mode === 'review' ? 'بعدی' : 'ادامه';
}
function wizDone(w) {
  const p = active();
  return `<div class="wiz" role="dialog" aria-modal="true" aria-labelledby="wq"><div class="wiz-body" style="text-align:center;justify-items:center;align-content:center;flex:1">${ART.party}
    <h1 class="wiz-q" id="wq">پرونده‌ی «${esc(p ? p.label : '')}» آماده است!</h1>
    <p class="wiz-help">حالا نزدیک‌ترین هم‌مسیرها را می‌بینید. اگر هنوز کسی نیست، لینک و پوستر ${esc(p ? destWord(p) : '')} را بفرستید تا بقیه بیایند؛ هر ثبت‌نام نزدیک را خبر می‌دهیم.</p>
    <button class="btn line" data-a="notify">${ic('bell')}نوتیف را روشن کن</button></div>
    <div class="wiz-foot"><button class="btn block" data-a="w-finish">دیدن هم‌مسیرها</button><button class="btn line block" data-a="w-poster">${ic('share')}لینک و پوستر</button></div></div>`;
}
function draftOf(w) { return { id: w.pid || ('d' + uid()), label: (w.label || '').trim() || (KINDS[w.kind] || KINDS.other).lbl || 'پرونده', kind: w.kind || 'school', color: (KINDS[w.kind] || KINDS.other).c, data: w.d, step: w.step, complete: 0, place: w.link || w.place || null, placeDraft: w.newPlace || null, team: null }; }
async function wizSave(w, complete) {
  { const g = placeGender(w) || (w.newPlace && w.newPlace.gender); if (g === 'f' || g === 'm') (w.d.kids || []).forEach(k => k.g = g); }
  const dp = draftOf(w);
  if (!S.token) { // keep a local draft until the phone step
    const i = S.drafts.findIndex(x => x.id === dp.id); if (i >= 0) S.drafts[i] = dp; else S.drafts = [dp]; w.pid = dp.id; S.active = dp.id; persist(); return;
  }
  let placeId = dp.place ? dp.place.id : null;
  if (!placeId && dp.placeDraft && complete) {
    const n = dp.placeDraft; const r = await api('place_create', { kind: dp.kind, name: n.name.trim(), city: n.city || 'تهران', gender: wChild(w) ? n.gender : 'fm', shift: [n.shift, n.gender === 'fm' ? n.mix : ''].filter(Boolean).join(' · '), lat: n.lat, lng: n.lng, in: n.in || '07:30', out: n.out || '13:30', days: [0, 1, 2, 3, 4], force: true });
    placeId = r.place.id; w.place = r.place; w.newPlace = null;
  }
  const isDraft = !w.pid || String(w.pid).startsWith('d');
  const r = await api('profile_save', { id: isDraft ? '' : w.pid, label: dp.label, kind: dp.kind, color: dp.color, place_id: placeId, data: w.d, step: w.step, complete: complete ? 1 : 0 });
  if (isDraft) S.drafts = S.drafts.filter(x => x.id !== w.pid);
  w.pid = r.profile.id; const i = P.findIndex(x => x.id === r.profile.id); if (i >= 0) P[i] = r.profile; else P.push(r.profile);
  S.active = r.profile.id; persist();
}
async function wizNext() {
  const w = ui.wiz, steps = wizSteps(w), st = steps[w.step];
  if (st.key === 'snapp' && w.d.snapp) w.d.snapp = +en(w.d.snapp) || 0;
  const ok = st.ok(w);
  if (ok === 'otp-send') return otpSend(w);
  if (ok === 'otp-verify') return otpVerify(w);
  if (ok !== true) { w.err = ok; return wizRender(); }
  w.err = '';
  const last = w.step === steps.length - 1;
  if (w.mode === 'review' || w.mode === 'fix') {
    w.busy = true; wizRender();
    try { await wizSave(w, true); } catch (e) { w.busy = false; w.err = e.message; return wizRender(); }
    w.busy = false;
    if (w.mode === 'fix' || last) { ui.wiz = null; wizRender(); applyAccent(); render(); loadPeers(); return toast(w.mode === 'fix' ? 'ممنون؛ پرونده کامل شد.' : 'مرور تمام شد؛ تغییرات ذخیره شد.'); }
    w.step++; return wizRender();
  }
  if (!last) { w.step++; wizRender(); wizSave(w, false).catch(() => {}); return; }
  await finishWizard(w);
}
async function finishWizard(w) {
  w.busy = true; wizRender();
  try { await wizSave(w, true); } catch (e) { w.busy = false; w.err = e.message; return wizRender(); }
  w.busy = false; w.done = true; ui.linkPlace = null; if (location.pathname !== BASE) history.replaceState(null, '', BASE);
  applyAccent(); wizRender(); render(); loadPeers(); loadInbox();
}
async function otpSend(w) {
  w.busy = true; w.err = ''; wizRender();
  try { const r = await api('otp_send', { phone: en(w.phone || '') }); w.otpSent = true; w.devCode = r.dev_code || null; } catch (e) { w.err = e.message; }
  w.busy = false; wizRender();
}
async function otpVerify(w) {
  w.busy = true; w.err = ''; wizRender();
  try { const r = await api('otp_verify', { phone: en(w.phone || ''), code: en(w.otp || '') }); S.token = r.token; S.phone = r.phone; persist(); await refreshMe(); }
  catch (e) { w.busy = false; w.err = e.message; return wizRender(); }
  w.busy = false; await finishWizard(w);
}

/* ═════════ admin ═════════ */
function adminView() {
  if (!S.admin) return `<section class="card stack" style="max-width:420px;margin:30px auto"><h1 style="font-size:1.5rem">ورود مدیر</h1><div class="field"><label for="au">نام کاربری</label><input id="au" dir="ltr" autocomplete="username"></div><div class="field"><label for="ap">رمز</label><input id="ap" type="password" dir="ltr" autocomplete="current-password"></div><button class="btn" data-a="adm-login">ورود</button><button class="link" data-a="adm-exit">بازگشت به اپ</button></section>`;
  const A = ui.adm; if (!A) { loadAdmin(); return '<p class="muted" style="text-align:center;padding:40px">در حال بارگذاری…</p>'; }
  const o = A.ov, cnt = o.counts, F = o.flags, SV = o.services;
  const flagLbl = { sms_invite: 'پیامک دعوت هم‌مسیری', sms_arrive: 'پیامک «فرزندتان رسید» (فقط تیم‌های ویژه)', auto_arrive: 'تشخیص رسیدن با GPS', test_tools: 'گزینه‌های آزمایشی در منو', signup_open: 'ثبت‌نام باز است', otp_dev: 'کد ورود آزمایشی بدون پیامک (فقط تست!)' };
  return `<div class="adm">${o.default_pass ? `<div class="hint warn">${ic('warn')}<span>رمز مدیر پیش‌فرض (mot) است؛ در config.local.php مقدار admin_pass را عوض کنید.</span></div>` : ''}
    <div class="row between"><h1 style="font-size:1.5rem">پیشخوان مدیریت</h1><div class="row"><button class="btn line sm" data-a="adm-refresh">تازه‌سازی</button><button class="btn line sm" data-a="adm-exit">بازگشت</button></div></div>
    <div class="grid">${[['users', 'کاربر واقعی'], ['complete', 'پرونده‌ی کامل'], ['places', 'مکان'], ['teams', 'تیم'], ['invites', 'دعوت منتظر'], ['tickets', 'تیکت باز'], ['sms_day', 'پیامک ۲۴ ساعت'], ['fake', 'کاربر آزمایشی']].map(([k, v]) => `<div class="stat"><b>${fa(cnt[k])}</b><span>${v}</span></div>`).join('')}</div>
    <section class="card"><h2>سرویس‌ها</h2>${[['db', 'پایگاه داده: ' + SV.db, true], ['kavenegar', 'کاوه‌نگار', SV.kavenegar], ['neshan_service', 'کلید سرویس نشان (فاصله و نام محله)', SV.neshan_service], ['neshan_web', 'کلید نقشه‌ی وب نشان', SV.neshan_web], ['curl', 'cURL روی سرور', SV.curl]].map(([k, t, ok]) => `<div class="switch"><span><i class="${ok ? 'ok-dot' : 'no-dot'}"></i>${t}</span><span class="muted small">${ok ? 'فعال' : 'تنظیم نشده'}</span></div>`).join('')}
      <p class="muted small">الگوهای پیامک: <span dir="ltr">${esc(SV.tpl_invite)}</span> و <span dir="ltr">${esc(SV.tpl_arrived)}</span> · PHP ${esc(SV.php)}</p></section>
    <section class="card"><h2>تنظیمات</h2>${Object.keys(flagLbl).map(k => `<label class="switch"><span>${flagLbl[k]}</span><input type="checkbox" data-a="adm-flag" data-k="${k}" ${F[k] ? 'checked' : ''}></label>`).join('')}</section>
    <section class="card"><h2>مکان‌ها</h2><table><tr><th>نام</th><th>کد</th><th>خانواده</th><th>تأیید</th></tr>${A.places.map(p => `<tr><td>${esc(p.name)}<br><span class="muted small">${esc(p.city)} · ${esc((KINDS[p.kind] || KINDS.other).n)}</span></td><td dir="ltr">${esc(p.code)}</td><td>${fa(p.families)}</td><td><input type="checkbox" data-a="adm-verify" data-id="${p.id}" ${p.verified ? 'checked' : ''}></td></tr>`).join('')}</table></section>
    <section class="card"><h2>تیم‌ها (ویژه = پیامک رسیدن و رسید خودکار)</h2><table><tr><th>تیم</th><th>مکان</th><th>اعضا</th><th>ویژه</th></tr>${A.teams.map(t => `<tr><td>تیم ${fa(t.no)} · ${esc(t.hood)}</td><td>${esc(t.place || '')}</td><td>${fa(t.members)}</td><td><input type="checkbox" data-a="adm-premium" data-id="${t.id}" ${t.premium ? 'checked' : ''}></td></tr>`).join('')}</table></section>
    <section class="card"><h2>تیکت‌ها</h2>${A.tickets.map(t => `<div class="srow"><b>#${fa(t.no)} · ${esc(t.cat)} · <span dir="ltr">${esc(t.phone || '')}</span> <span class="tag">${esc(t.status)}</span></b><span>${esc(t.text)}</span><div class="row"><div class="field grow"><input id="rep-${t.id}" value="${esc(t.reply || '')}" placeholder="پاسخ"></div><button class="btn sm" data-a="adm-reply" data-id="${t.id}">ثبت پاسخ</button></div></div>`).join('') || '<p class="muted">تیکتی نیست.</p>'}</section>
    <section class="card"><h2>آخرین پیامک‌ها</h2><table><tr><th>شماره</th><th>الگو</th><th>وضعیت</th></tr>${A.sms.slice(0, 30).map(s => `<tr><td dir="ltr">${esc(s.phone)}</td><td dir="ltr">${esc(s.tpl)}</td><td>${esc(s.status)}</td></tr>`).join('')}</table></section>
    <section class="card"><h2>کاربران اخیر</h2><table><tr><th>شماره</th><th>پرونده</th><th>نوع</th></tr>${A.users.slice(0, 40).map(u => `<tr><td dir="ltr">${esc(u.phone)}</td><td>${fa(u.profiles)}</td><td>${+u.fake ? 'آزمایشی' : 'واقعی'}</td></tr>`).join('')}</table>
      <button class="btn line sm" data-a="adm-purge" style="margin-top:10px">حذف همه‌ی کاربران آزمایشی</button></section></div>`;
}
async function loadAdmin() {
  try { const [ov, pl, tm, tk, sm, us] = await Promise.all(['admin_overview', 'admin_places', 'admin_teams', 'admin_tickets', 'admin_sms', 'admin_users'].map(a => api(a, {}, true)));
    ui.adm = { ov, places: pl.list, teams: tm.list, tickets: tk.list, sms: sm.list, users: us.list }; renderMain(); }
  catch (e) { if (e.code === 'auth' || e.code === 'admin') { S.admin = null; persist(); renderMain(); } fail(e); }
}

/* ═════════ notify / toast ═════════ */
async function notify(title, body) { try { if ('Notification' in window && Notification.permission === 'granted') { const reg = await navigator.serviceWorker?.getRegistration(); if (reg) reg.showNotification(title, { body, icon: 'assets/icon-192.png', lang: 'fa', dir: 'rtl' }); } } catch (e) {} }
let tt; function toast(m) { const el = $('#toast'); el.textContent = m; el.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 4200); }
async function copyText(t) { try { await navigator.clipboard.writeText(t); return true; } catch (e) { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e2) {} a.remove(); return ok; } }

/* ═════════ geofence (auto «رسید») ═════════ */
const GEO = { id: null };
function watchArrival() {
  const p = active(), T = ui.team;
  if (GEO.id != null) { navigator.geolocation.clearWatch(GEO.id); GEO.id = null; }
  if (!p || !T || !T.team || !CFG.flags.auto_arrive || !navigator.geolocation) return;
  const plan = planOf(T), x = focusSlot(T, plan), r = recOf(T, x, plan);
  if (r.status !== 'started' || r.exec !== p.id) return;
  GEO.id = navigator.geolocation.watchPosition(pos => {
    const { latitude: la, longitude: ln } = pos.coords, ks = ridersOf(T, x.dir).filter(k => !r.arr[k.id]);
    if (!ks.length) return;
    if (x.dir === 'out') { if (hav(la, ln, T.place.lat, T.place.lng) < 150) arrivalBanner(`به ${T.place.name} رسیدید؟`, '*'); }
    else for (const k of ks) { const m = mem(T, k.pid); if (m && hav(la, ln, m.lat, m.lng) < 120) { arrivalBanner(`نزدیک خانه‌ی ${fam(m)} هستید؛ ${kidName(k, m)} رسید؟`, k.id); break; } }
  }, () => {}, { enableHighAccuracy: true, maximumAge: 15000 });
}
function arrivalBanner(text, kid) {
  if ($('.banner')) return;
  const T = ui.team; const auto = T && T.team && T.team.premium;
  if (auto) { act('t-arrive', { dataset: { k: kid } }); toast('رسیدن خودکار ثبت شد (اشتراک ویژه).'); return; }
  const b = document.createElement('div'); b.className = 'banner'; b.innerHTML = `${ic('pin')}<span class="grow">${esc(text)}</span><button class="btn sm" data-a="t-arrive" data-k="${kid}">بله، ثبت شود</button><button class="icon-btn" style="background:transparent;border-color:#ffffff40;color:#fff" data-a="banner-x" aria-label="بستن">${ic('close')}</button>`;
  $('#main').prepend(b); notify('رسیدیم', text);
}

/* ═════════ actions ═════════ */
async function act(a, el) {
  const p = active(), T = ui.team, w = ui.wiz;
  const plan = T && T.team ? planOf(T) : null, x = plan ? focusSlot(T, plan) : null;
  const tact = async (body, msg) => { try { await api('team_act', { profile_id: p.id, ...body }); await loadTeam(); renderMain(); watchArrival(); if (msg) toast(msg); } catch (e) { fail(e); } };
  switch (a) {
    case 'close': return closeLayer();
    case 'menu': return drawer();
    case 'switcher': return switcher();
    case 'toggle': ui.open[el.dataset.v] = !ui.open[el.dataset.v]; return drawer();
    case 'use': closeLayer(); return setActive(el.dataset.id);
    case 'new-profile': closeLayer(); ui.linkPlace = null; return wizOpen(null, { mode: 'new', kind: el.dataset.kind });
    case 'resume-draft': return wizOpen(S.drafts[0], { mode: 'resume' });
    case 'wiz-resume': return wizOpen(p, { mode: 'resume' });
    case 'wiz-review': closeLayer(); return p.complete ? wizOpen(p, { mode: 'review' }) : wizOpen(p, { mode: 'resume' });
    case 'wiz-fix': return wizOpen(p, { mode: 'fix', at: missingStep(p) });
    case 'join-place': { const own = P.find(x => x.place && x.place.id === ui.linkPlace.id); if (own) { ui.linkPlace = null; history.replaceState(null, '', BASE); return setActive(own.id); } return wizOpen(null, { mode: 'new', link: ui.linkPlace }); }
    case 'go-code': { const v = ($('#code').value || '').trim().toUpperCase().replace(/^.*\//, '').replace(/[^A-Z0-9]/g, ''); if (v.length < 6) return toast('کد ۸ حرفی را وارد کنید.'); return openCode(v); }
    case 'login': closeLayer(); return loginSheet();
    case 'lg-send': { const ph = en($('#lg-ph').value); try { const r = await api('otp_send', { phone: ph }); ui.lg = { ph, dev: r.dev_code }; loginSheet(); } catch (e) { fail(e); } return; }
    case 'lg-verify': { try { const r = await api('otp_verify', { phone: ui.lg.ph, code: en($('#lg-otp').value) }); S.token = r.token; S.phone = r.phone; persist(); await refreshMe(); closeLayer(); if (P.length) setActive(P[0].id); else { render(true); toast('خوش آمدید! حالا اولین پرونده را بسازید.'); } } catch (e) { fail(e); } return; }
    case 'logout': try { await api('logout'); } catch (e) {} S.token = null; S.phone = null; S.active = null; P = []; persist(); closeLayer(); applyAccent(); render(true); return toast('از حساب خارج شدید.');
    case 'theme': { const d = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = d; S.theme = d; persist(); return; }
    case 'filter': ui.filter = el.dataset.v; PM.key = ''; return renderMain();
    case 'fit': PM.key = ''; return drawPeers();
    case 'cand': { const m = ui.cand && ui.cand.list.find(x => x.id === el.dataset.id); return m && famSheet(m); }
    case 'invite': {
      const m = ui.cand.list.find(x => x.id === el.dataset.id); closeLayer();
      try { const r = await api('invite', { profile_id: p.id, to: m.id }); m.invite = { id: r.id, dir: 'out' }; PM.key = ''; renderMain(); toast(`دعوت برای خانواده ${m.family} رفت${r.sms === 'sent' ? ' و پیامک شد' : ''}. منتظر پاسخ بمانید.`); setTimeout(() => loadInbox(), 4500); setTimeout(() => loadInbox(), 9000); } catch (e) { fail(e); }
      return;
    }
    case 'invite-all': { const sm = smartTeam(p, ui.cand.list); if (!sm) return; let n = 0; for (const m of sm.list) { try { const r = await api('invite', { profile_id: p.id, to: m.id }); m.invite = { id: r.id, dir: 'out' }; n++; } catch (e) {} } PM.key = ''; renderMain(); toast(`${fa(n)} دعوت رفت. هر کس بپذیرد، تیم شکل می‌گیرد.`); setTimeout(() => loadInbox(), 4500); setTimeout(() => loadInbox(), 9000); return; }
    case 'accept': try { const r = await api('invite_respond', { id: el.dataset.id, accept: 1 }); closeLayer(); await refreshMe(); applyAccent(); ui.tab = 'team'; await loadTeam(); loadPeers(); loadInbox(); render(true); toast(`خوش آمدید به ${teamName(r.team)}!`); } catch (e) { fail(e); } return;
    case 'decline': try { await api('invite_respond', { id: el.dataset.id, accept: 0 }); closeLayer(); loadInbox(); toast('با احترام رد شد؛ پیامی برای‌شان نمی‌رود.'); } catch (e) { fail(e); } return;
    case 'inbox': closeLayer(); return inboxSheet();
    case 'leave': closeLayer(); return sheet('جدا شدن از تیم؟', `<p>از ${esc(teamName(p.team))} جدا می‌شوید. سابقه‌ی سفرها و حساب‌ها پاک نمی‌شود.</p><div class="row"><button class="btn grow" data-a="leave-ok">بله، جدا می‌شوم</button><button class="btn line grow" data-a="close">ماندن</button></div>`);
    case 'leave-ok': try { const r = await api('team_leave', { profile_id: p.id }); closeLayer(); await refreshMe(); applyAccent(); ui.team = null; ui.tab = 'peers'; render(true); loadPeers(); toast(r.result === 'closed' ? 'تیم بسته شد؛ دوباره هم‌مسیر پیدا کنید.' : 'از تیم جدا شدید.'); } catch (e) { fail(e); } return;
    case 'poster': closeLayer(); return posterSheet();
    case 'print': return window.print();
    case 'copy-cap': return copyText(ui.caption).then(ok => toast(ok ? 'متن و لینک کپی شد؛ در گروه‌ها بچسبانید.' : 'کپی نشد.'));
    case 'share': { const t = ui.caption; try { const blob = await posterPng(); const file = new File([blob], 'residim.png', { type: 'image/png' }); if (navigator.canShare && navigator.canShare({ files: [file] })) return navigator.share({ files: [file], text: t }).catch(() => {}); if (navigator.share) return navigator.share({ text: t }).catch(() => {}); } catch (e) {} return copyText(t).then(() => toast('متن و لینک کپی شد.')); }
    case 'img': { const b = await posterPng(); const u = URL.createObjectURL(b); const l = document.createElement('a'); l.href = u; l.download = `residim-${active().place.code}.png`; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); return toast('عکس‌نوشت ذخیره شد.'); }
    case 'notify': if (!('Notification' in window)) return toast('این مرورگر نوتیف ندارد؛ خبرها در «دعوت‌ها و پیام‌ها» می‌آید.'); return Notification.requestPermission().then(r => toast(r === 'granted' ? 'نوتیف روشن شد.' : 'نوتیف روشن نشد؛ از تنظیمات مرورگر روشنش کنید.'));
    case 'radio': closeLayer(); return radioSheet();
    case 'rules': closeLayer(); return sheet('قوانین و حریم خصوصی', rulesHtml());
    case 'ticket': closeLayer(); return ticketSheet();
    case 'tk-cat': ui.tk = ui.tk || {}; ui.tk.cat = el.dataset.v; ui.tk.text = ($('#tk') || {}).value || ''; return ticketSheet();
    case 'tk-send': try { const r = await api('ticket', { cat: (ui.tk || {}).cat || 'فنی', text: $('#tk').value, profile_id: p ? p.id : null }); ui.tk = null; toast(`تیکت #${fa(r.no)} ثبت شد؛ پاسخ همین‌جا می‌آید.`); return ticketSheet(); } catch (e) { return fail(e); }
    case 'quiz': closeLayer(); return quizSheet();
    case 'q-ans': try { const v = el.dataset.v != null ? el.dataset.v : en(($('#qa') || {}).value || ''); const r = await api('quiz_answer', { profile_id: p.id, qid: el.dataset.q, answer: v }); toast(r.ok ? 'آفرین! یک امتیاز برای تیم.' : 'این بار نشد؛ فردا معمای تازه!'); await loadTeam(); return quizSheet(); } catch (e) { return fail(e); }
    case 'q-prize': return tact({ act: 'prize', text: $('#prize').value }, 'جایزه‌ی فصل ثبت شد.');
    case 'how': return sheet('حساب چطور است؟', `<ol class="steps3"><li>هر سفر ${money(T.team.price)} است: ۶۰٪ میانگین برآورد اسنپ اعضا.</li><li>کل مبلغ به اعتبار کسی است که واقعاً برده.</li><li>همان مبلغ بین همه‌ی مسافران آن سفر مساوی تقسیم می‌شود.</li><li>تسویه با «پرداخت شد» یا «حلال است»؛ هیچ رقمی پاک نمی‌شود.</li></ol>`);
    /* team daily */
    case 't-pick': ui.slot = el.dataset.s; return renderMain();
    case 't-next': { ui.slot = null; const n = focusSlot(T, plan); ui.slot = n && n.id; return renderMain(); }
    case 't-start': { const r = recOf(T, x, plan); if (!r.exec) return; ui.slot = x.id; return tact({ act: 'start', slot: x.id, exec: r.exec }, 'راه افتادید. هر کس رسید رویش بزنید.'); }
    case 't-arrive': { const b = $('.banner'); b && b.remove(); return tact({ act: 'arrive', slot: x.id, kid: el.dataset.k }, el.dataset.k === '*' ? 'رسیدن همه ثبت شد؛ خانواده‌ها خبردار شدند.' : 'ثبت شد؛ خانواده‌اش خبردار شد.'); }
    case 'banner-x': { const b = $('.banner'); b && b.remove(); return; }
    case 't-empty': return tact({ act: 'empty', slot: x.id, v: el.checked ? 1 : 0 });
    case 't-finish': return tact({ act: 'finish', slot: x.id, label: DAYS[x.d] + ' ' + (x.dir === 'out' ? 'رفت' : 'برگشت') }, 'خدا قوت! سفر ثبت شد.');
    case 't-thanks': return tact({ act: 'thanks', slot: x.id }, 'تشکر شما رسید.');
    case 't-swap': case 't-slot': {
      const s2 = a === 't-slot' ? slotsOf(T.place).find(y => y.id === el.dataset.s) : x, r = recOf(T, s2, plan), c = {}; T.members.forEach(m => c[m.id] = 0); slotsOf(T.place).forEach(y => { const e = recOf(T, y, plan).exec; if (c[e] != null && y.id !== s2.id) c[e]++; });
      const cands = T.members.filter(m => m.id !== r.exec && driverOk(T, m, s2.dir)).sort((a1, b1) => ((b1.days || []).includes(s2.d) - (a1.days || []).includes(s2.d)) || (c[a1.id] - c[b1.id]));
      return sheet(`${DAYS[s2.d]} · ${s2.dir === 'out' ? 'رفت' : 'برگشت'} ${clock(s2.time)}`, `<p>${r.exec ? esc(fam(mem(T, r.exec))) + ' می‌برند.' : 'هنوز راننده ندارد.'}</p>
        ${r.status === 'pending' ? `<span class="lbl">چه کسی می‌تواند ببرد؟</span>${cands.map(m => `<button class="fam" data-a="t-swapto" data-s="${s2.id}" data-id="${m.id}"><span class="av" style="--pc:var(--ac);--pi:var(--ac-ink)">${esc(m.family[0])}</span><span class="grow"><b>${esc(fam(m))}${m.id === p.id ? ' (خودم)' : ''}</b><br><span class="muted small">${(m.days || []).includes(s2.d) ? 'این روز را اعلام کرده‌اند' : 'روز اعلام‌شده‌شان نیست'} · ${fa(c[m.id])} نوبت دیگر</span></span><span class="tag ac">${m.id === p.id ? 'می‌برم' : 'بسپار'}</span></button>`).join('') || '<p class="muted">راننده‌ی سازگار دیگری در تیم نیست.</p>'}` : '<p class="muted">این نوبت شروع یا انجام شده.</p>'}
        <button class="btn line" data-a="t-open" data-s="${s2.id}">نمایش در کارت امروز</button>`, 'برنامه‌ی اولیه حفظ می‌شود؛ اعتبار به کسی می‌رسد که واقعاً می‌برد.');
    }
    case 't-open': closeLayer(); ui.slot = el.dataset.s; return renderMain();
    case 't-swapto': closeLayer(); ui.slot = el.dataset.s; return tact({ act: 'swap', slot: el.dataset.s, exec: el.dataset.id }, 'راننده‌ی این نوبت عوض شد؛ هم‌تیمی‌ها خبردار شدند.');
    case 't-pay': case 't-gift': { const sg = settle(T)[+el.dataset.i]; return tact({ act: 'settle', kind: a === 't-pay' ? 'pay' : 'gift', from: sg.from, to: sg.to, amt: sg.amt }, a === 't-pay' ? 'پرداخت ثبت شد.' : 'بزرگواری‌تان ثبت شد. حساب‌ها روشن، دل‌ها روشن‌تر.'); }
    /* test tools */
    case 't-fake5': case 't-fake1': closeLayer(); try { const r = await api('test_fake', { profile_id: p.id, n: a === 't-fake5' ? 5 : 1, driver: a === 't-fake1' }); toast(`${fa(r.made)} همسایه‌ی آزمایشی اضافه شد.`); loadPeers(); } catch (e) { fail(e); } return;
    case 't-invme': closeLayer(); try { await api('test_invite_me', { profile_id: p.id }); await loadInbox(); toast('یک همسایه‌ی آزمایشی دعوت‌تان کرد؛ زنگوله را ببینید.'); loadPeers(); } catch (e) { fail(e); } return;
    case 't-clear': closeLayer(); try { const r = await api('test_clear', { profile_id: p.id }); await refreshMe(); applyAccent(); ui.team = null; toast(`${fa(r.removed)} همسایه‌ی آزمایشی پاک شد.`); render(); loadPeers(); } catch (e) { fail(e); } return;
    case 't-delprof': closeLayer(); return sheet('پاک کردن کامل این پرونده؟', `<p>«${esc(p.label)}» و همه‌ی داده‌هایش (تیم، دعوت‌ها، پیام‌ها) پاک می‌شود و برنمی‌گردد.</p><div class="row"><button class="btn grow" data-a="t-delprof-ok">پاک شود</button><button class="btn line grow" data-a="close">نه</button></div>`);
    case 't-delprof-ok': closeLayer(); try { if (String(p.id).startsWith('d')) S.drafts = S.drafts.filter(d => d.id !== p.id); else { await api('profile_delete', { id: p.id }); await refreshMe(); } S.active = (allProfiles()[0] || {}).id || null; persist(); ui.team = null; ui.cand = null; PM.map && PM.map.remove(); PM.map = null; PM.state = 'idle'; applyAccent(); render(true); toast('پرونده پاک شد.'); if (S.active) setActive(S.active, { noWizard: true }); } catch (e) { fail(e); } return;
    case 't-reset': closeLayer(); return sheet('بازنشانی کامل؟', '<p>حساب، همه‌ی پرونده‌ها و داده‌های این دستگاه پاک می‌شود و از اول شروع می‌کنید.</p><div class="row"><button class="btn grow" data-a="t-reset-ok">از صفر شروع کن</button><button class="btn line grow" data-a="close">نه</button></div>');
    case 't-reset-ok': { try { if (S.token) await api('account_reset'); } catch (e) {} const th = S.theme; S = { drafts: [], theme: th }; P = []; persist(); location.replace(BASE); return; }
    case 't-splash': closeLayer(); return splash(true);
    case 'admin': closeLayer(); ui.admin = true; history.pushState(null, '', BASE + '#admin'); return render(true);
    case 'adm-login': try { const r = await api('admin_login', { u: $('#au').value, p: $('#ap').value }); S.admin = r.token; persist(); ui.adm = null; renderMain(); } catch (e) { fail(e); } return;
    case 'adm-exit': ui.admin = false; ui.adm = null; history.replaceState(null, '', BASE); return render(true);
    case 'adm-refresh': ui.adm = null; return renderMain();
    case 'adm-flag': try { await api('admin_flag', { k: el.dataset.k, v: el.checked ? 1 : 0 }, true); CFG.flags[el.dataset.k] = el.checked; toast('ذخیره شد.'); } catch (e) { fail(e); } return;
    case 'adm-verify': try { await api('admin_place', { id: el.dataset.id, verified: el.checked ? 1 : 0 }, true); toast('ذخیره شد.'); } catch (e) { fail(e); } return;
    case 'adm-premium': try { await api('admin_team', { id: el.dataset.id, premium: el.checked ? 1 : 0 }, true); toast('ذخیره شد.'); } catch (e) { fail(e); } return;
    case 'adm-reply': try { await api('admin_ticket', { id: el.dataset.id, reply: $('#rep-' + el.dataset.id).value, status: 'answered' }, true); toast('پاسخ ثبت شد.'); ui.adm = null; renderMain(); } catch (e) { fail(e); } return;
    case 'adm-purge': try { const r = await api('admin_purge_fake', {}, true); toast(`${fa(r.removed)} پرونده‌ی آزمایشی حذف شد.`); ui.adm = null; renderMain(); } catch (e) { fail(e); } return;
    /* wizard */
    case 'w-close': { const ww = ui.wiz; ui.wiz = null; wizRender(); if (ww && !ww.done && ww.mode === 'new' && !S.token) toast('ثبت‌نام نیمه‌کاره روی همین گوشی ماند؛ هر وقت خواستید ادامه دهید.'); render(); return; }
    case 'w-notthis': ui.wiz = null; wizRender(); ui.linkPlace = null; history.replaceState(null, '', BASE); render(true); return wizOpen(null, { mode: 'new' });
    case 'w-prev': w.step--; w.err = ''; return wizRender();
    case 'w-next': return wizNext();
    case 'w-set': { const v = el.dataset.v; w.d[el.dataset.k] = ['ok0', 'forKids'].includes(el.dataset.k) ? +v : v; if (el.dataset.k === 'forKids' && w.d.forKids === 1 && !w.d.kids.length) w.d.kids = [{ id: uid(), first: '', g: '', by: '' }]; w.err = ''; return wizRender(); }
    case 'w-kind': { w.kind = el.dataset.v; const K = KINDS[w.kind]; if (!w.label || Object.values(KINDS).some(k => k.lbl === w.label)) w.label = K.lbl; if (K.child === false) w.d.kids = []; else if (K.child && !w.d.kids.length) w.d.kids = [{ id: uid(), first: '', g: '', by: '' }]; w.near = null; w.place = null; w.err = ''; return wizRender(); }
    case 'w-count': { const ks = w.d.kids; if (+el.dataset.v > 0 && ks.length < 5) ks.push({ id: uid(), first: '', g: '', by: '' }); if (+el.dataset.v < 0 && ks.length > 1) ks.pop(); return wizRender(); }
    case 'w-kid': w.d.kids[+el.dataset.i][el.dataset.f] = el.dataset.v; return wizRender();
    case 'w-needs': { const v = el.dataset.v; w.d.needs = { out: v !== 'back', back: v !== 'out' }; return wizRender(); }
    case 'w-day': { const v = +el.dataset.v, ds = w.d.days || []; w.d.days = ds.includes(v) ? ds.filter(z => z !== v) : [...ds, v].sort(); return wizRender(); }
    case 'w-seats': w.d.seats = Math.max(1, Math.min(7, (w.d.seats || 3) + +el.dataset.v)); return wizRender();
    case 'w-val': { const v = el.dataset.v, vs = w.d.values || []; w.d.values = vs.includes(v) ? vs.filter(z => z !== v) : [...vs, v]; return wizRender(); }
    case 'w-rules': w.d.rules_at = el.checked ? Date.now() : null; w.err = ''; return;
    case 'w-show': w.d.phone_show = el.checked; return;
    case 'w-locate': if (!navigator.geolocation) return toast('این مرورگر موقعیت‌یابی ندارد.'); toast('در حال گرفتن موقعیت؛ فقط با اجازه‌ی شما.');
      navigator.geolocation.getCurrentPosition(pos => { const la = +pos.coords.latitude.toFixed(5), ln = +pos.coords.longitude.toFixed(5); w.d.lat = la; w.d.lng = ln; if (PK.map) PK.map.flyTo({ center: [ln, la], zoom: 16.5 }); else wizRender(); reverseFill(w); }, () => toast('موقعیت گرفته نشد؛ اجازه‌ی مرورگر را بررسی کنید یا نقشه را جابه‌جا کنید.'), { enableHighAccuracy: true, timeout: 10000 });
      return;
    case 'w-paste': { const ll = parseLoc($('#w-paste').value); if (!ll) return toast('مختصاتی در این لینک پیدا نشد. لینک‌های کوتاه را اول در مرورگر باز کنید و آدرس کامل را بچسبانید.'); w.d.lat = ll[0]; w.d.lng = ll[1]; if (PK.map) PK.map.jumpTo({ center: [ll[1], ll[0]], zoom: 16.5 }); reverseFill(w); return toast('موقعیت ثبت شد.'); }
    case 'w-np-new': w.newPlace = { name: w.pq || '', city: 'تهران', in: '07:30', out: '13:30', lat: null, lng: null, dups: [] }; w.place = null; return wizRender();
    case 'w-np-here': if (!navigator.geolocation) return toast('این مرورگر موقعیت‌یابی ندارد.'); navigator.geolocation.getCurrentPosition(pos => { w.newPlace.lat = +pos.coords.latitude.toFixed(5); w.newPlace.lng = +pos.coords.longitude.toFixed(5); if (PK.map) { PK.prog = null; PK.map.flyTo({ center: [w.newPlace.lng, w.newPlace.lat], zoom: 17 }); } else wizRender(); checkDup(w); }, () => toast('موقعیت گرفته نشد.'), { enableHighAccuracy: true, timeout: 10000 }); return;
    case 'w-np-paste': { const ll = parseLoc($('#w-np-paste').value); if (!ll) return toast('مختصاتی پیدا نشد.'); w.newPlace.lat = ll[0]; w.newPlace.lng = ll[1]; if (PK.map) PK.map.jumpTo({ center: [ll[1], ll[0]], zoom: 17 }); else wizRender(); checkDup(w); return toast('موقعیت ثبت شد.'); }
    case 'w-np-cancel': w.newPlace = null; return wizRender();
    case 'w-np': w.newPlace[el.dataset.k] = el.dataset.v; w.err = ''; return wizRender();
    case 'w-dupok': w.newPlace.dupOk = true; w.newPlace.dups = []; return wizRender();
    case 'w-pick': { let pl = (w.near || []).find(z => z.id === el.dataset.id) || ((w.newPlace && w.newPlace.dups) || []).find(z => z.id === el.dataset.id); w.place = pl; w.newPlace = null; w.err = ''; if (pl && (pl.gender === 'f' || pl.gender === 'm')) w.d.kids.forEach(k => k.g = pl.gender); return wizRender(); }
    case 'w-est': w.d.snapp = estSnapp(w.route.m); return wizRender();
    case 'w-snapp': { const tgt = w.link || w.place || w.newPlace, here = el.dataset.v; const txt = here === 'home' ? `${tgt.name}${tgt.city ? '، ' + tgt.city : ''}` : (w.addr || ('محله ' + (w.d.hood || ''))); await copyText(txt); toast(`«${txt}» کپی شد؛ در اسنپ به‌عنوان مقصد بچسبانید.`); setTimeout(() => window.open('https://app.snapp.taxi/', '_blank', 'noopener'), 600); return; }
    case 'w-resend': w.otpSent = false; return otpSend(w);
    case 'w-finish': ui.wiz = null; wizRender(); ui.tab = 'peers'; return render(true);
    case 'w-poster': ui.wiz = null; wizRender(); render(); return posterSheet();
  }
}
function parseLoc(s) {
  s = decodeURIComponent(String(s || ''));
  const pats = [/@(-?\d+\.\d+),(-?\d+\.\d+)/, /[?&](?:q|ll|query|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/, /latitude=(-?\d+\.\d+).*longitude=(-?\d+\.\d+)/, /geo:(-?\d+\.\d+),(-?\d+\.\d+)/, /(-?\d{2}\.\d{3,})[,\s]+(-?\d{2}\.\d{3,})/];
  for (const r of pats) { const m = s.match(r); if (m) { const a = +m[1], b = +m[2]; return a > 20 && a < 45 && b > 40 && b < 65 ? [a, b] : (b > 20 && b < 45 ? [b, a] : null); } }
  return null;
}
function loginSheet() {
  const L = ui.lg;
  sheet('ورود', L ? `<p>کد تأیید به <b dir="ltr">${esc(fa(L.ph))}</b> رفت.</p><div class="field"><label for="lg-otp">کد</label><input id="lg-otp" class="otp" inputmode="numeric" autocomplete="one-time-code"></div>${L.dev ? `<p class="note">${ic('flask')}کد آزمایشی: <b dir="ltr">${fa(L.dev)}</b></p>` : ''}<button class="btn" data-a="lg-verify">ورود</button>`
    : `<div class="field"><label for="lg-ph">شماره همراه</label><input id="lg-ph" type="tel" inputmode="tel" dir="ltr" placeholder="09121234567" autocomplete="tel"></div><button class="btn" data-a="lg-send">ارسال کد</button>`, 'همه‌ی پرونده‌های شما با همین شماره');
}
async function ticketSheet() {
  ui.tk = ui.tk || { cat: 'فنی', text: '' }; let list = [];
  try { list = (await api('tickets')).list; } catch (e) {}
  sheet('پشتیبانی و تیکت', `<div class="chips">${['فنی', 'پیشنهاد', 'گزارش رفتار', 'حساب و پرداخت', 'سایر'].map(c => `<button class="chip" data-a="tk-cat" data-v="${c}" aria-pressed="${ui.tk.cat === c}">${c}</button>`).join('')}</div>
    <div class="field"><label for="tk">چه شده؟ با جزئیات بنویسید.</label><textarea id="tk">${esc(ui.tk.text)}</textarea></div><button class="btn ac" data-a="tk-send">ثبت تیکت</button>
    ${list.map(k => `<div class="srow"><b>#${fa(k.no)} · ${esc(k.cat)} <span class="tag">${k.status === 'open' ? 'در صف' : k.status === 'answered' ? 'پاسخ داده شد' : 'بسته'}</span></b><span class="small">${esc(k.text)}</span>${k.reply ? `<span class="hint" style="padding:8px 12px">${esc(k.reply)}</span>` : ''}</div>`).join('')}`);
}
async function radioSheet() {
  sheet('رادیو رسیدیم', '<p class="muted">در حال آماده‌سازی…</p>'); let eps = [];
  try { eps = (await (await fetch('radio.json', { cache: 'no-store' })).json()).episodes || []; } catch (e) {}
  if (!$('.sheet')) return;
  $('.sheet-b').innerHTML = eps.length ? eps.map(e => `<div class="card stack" style="padding:14px"><b>${esc(e.title)}</b>${e.desc ? `<span class="muted small">${esc(e.desc)}</span>` : ''}<audio controls preload="none" src="${esc(e.src)}" style="width:100%"></audio></div>`).join('')
    : `<p><b>به‌زودی روی آنتن!</b> اپیزودهای کوتاه و شاد برای مسیر: قصه، دانستنی، معما و ادب و مهربانی؛ چند دقیقه‌ای، با نسخه‌ی بدون موسیقی.</p>`;
}
async function openCode(code) {
  try { const r = await api('place_code', { code }); ui.linkPlace = r.place; history.replaceState(null, '', BASE === '/' ? '/' + code : BASE + '#/c/' + code); const own = P.find(x => x.place && x.place.id === r.place.id); if (own) { ui.linkPlace = null; history.replaceState(null, '', BASE); return setActive(own.id); } render(true); }
  catch (e) { toast(e.code === 'notfound' ? 'این لینک پیدا نشد؛ کد را دوباره بررسی کنید.' : e.message); history.replaceState(null, '', BASE); render(true); }
}

/* ═════════ splash ═════════ */
function splash(force) {
  let el = $('#splash');
  if (!el && force) { location.reload(); return; }
  if (!el) return;
  const end = () => { if (!el.isConnected) return; el.classList.add('out'); setTimeout(() => el.remove(), 360); };
  el.addEventListener('click', end); el.addEventListener('keydown', e => { if (['Enter', ' ', 'Escape'].includes(e.key)) end(); });
  el.focus();
  setTimeout(end, matchMedia('(prefers-reduced-motion: reduce)').matches ? 1400 : 4400);
}

/* ═════════ events ═════════ */
document.addEventListener('click', e => {
  const tab = e.target.closest('[data-tab]');
  if (tab) { closeLayer(); ui.tab = tab.dataset.tab; render(true); scrollTo(0, 0); if (ui.tab !== 'peers') loadTeam(); return; }
  const el = e.target.closest('[data-a]');
  if (!el || el.disabled || el.dataset.a === '' ) return;
  if (el.tagName === 'INPUT' && el.type === 'checkbox') return;
  act(el.dataset.a, el);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if ($('#layer').innerHTML) closeLayer(); else if (ui.wiz && !ui.wiz.busy) act('w-close'); }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('#title[data-a="switcher"]')) { e.preventDefault(); switcher(); }
  if (e.key === 'Enter' && ui.wiz && e.target.matches('.wiz input:not([type=checkbox])') && !ui.wiz.busy) { e.preventDefault(); wizNext(); }
  if (e.key === 'Enter' && e.target.id === 'code') act('go-code');
});
document.addEventListener('change', e => { const el = e.target;
  if (el.matches('input[type=checkbox][data-a]')) act(el.dataset.a, el);
  if (ui.wiz && el.matches('select[data-wk]')) { ui.wiz.d.kids[+el.dataset.wk][el.dataset.f] = +el.value || ''; }
  if (ui.wiz && el.matches('select[data-wp]')) ui.wiz.newPlace[el.dataset.wp] = el.value;
});
let pqT;
document.addEventListener('input', e => {
  const el = e.target, w = ui.wiz; if (!w) return;
  if (el.dataset.w) { w[el.dataset.w] = el.value; if (el.dataset.w === 'pq') { clearTimeout(pqT); pqT = setTimeout(() => loadNear(w), 400); } }
  if (el.dataset.wd) { w.d[el.dataset.wd] = el.value; if (el.dataset.wd === 'hood') w.autoHood = false; }
  if (el.dataset.wk != null && el.tagName === 'INPUT') w.d.kids[+el.dataset.wk][el.dataset.f] = el.value;
  if (el.dataset.wp && el.tagName === 'INPUT') w.newPlace[el.dataset.wp] = el.value;
});
addEventListener('popstate', () => { ui.admin = location.hash === '#admin'; render(true); });

/* ═════════ boot ═════════ */
const BASE = location.pathname.replace(/[^/]*$/, '').replace(/\/[A-Z2-9]{8}\/?$/, '/');
(async function boot() {
  splash();
  try { const r = await fetch(API + 'cfg', { cache: 'no-store' }); const j = await r.json(); if (j.ok) { CFG = j; if (j.jyear) JY = j.jyear; } } catch (e) {}
  await refreshMe();
  const code = (location.pathname.match(/\/([A-Z2-9]{8})\/?$/) || [])[1] || (location.hash.match(/^#\/c\/([A-Z2-9]{8})/) || [])[1];
  if (location.hash === '#admin') ui.admin = true;
  if (!active()) S.active = (allProfiles()[0] || {}).id || null;
  applyAccent();
  if (code) return openCode(code);
  render(true);
  const p = active();
  if (p && p.complete) { if (p.team) { ui.tab = 'team'; await loadTeam(); render(); } loadPeers(); loadInbox(); }
  setInterval(() => { if (!document.hidden && S.token && active() && active().complete && !ui.wiz) { loadInbox(); if (ui.tab !== 'peers' && active().team) loadTeam().then(watchArrival); } }, 20000);
})();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
window.__rs = { get S() { return S; }, get P() { return P; }, get ui() { return ui; }, api, planOf, balances };
})();
