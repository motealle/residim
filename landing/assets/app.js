(() => {
'use strict';

/* ═════════ basics ═════════ */
const KEY = 'residim-05-v1';
const DAYS = ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'];
const TODAY = (new Date().getDay() + 1) % 7;
const fa = v => String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
const en = v => String(v).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const sep = n => String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
const money = n => fa(sep(n)) + ' تومان';
const clock = t => fa(String(t || '').replace(/^0/, ''));
const km1 = d => fa((Math.round(d * 10) / 10).toString().replace('.', '٫'));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $ = s => document.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 9);
const ic = (n, cls = 'i') => `<svg class="${cls}"><use href="#i-${n}"/></svg>`;
const BASE = location.pathname.replace(/[^/]*$/, '');

const VALUES = {
  religious: 'خانواده‌ای مذهبی باشند',
  nomusic: 'موسیقی پخش نشود',
  parent: 'راننده حتماً از والدین باشد',
  samegender: 'راننده هم‌جنس فرزندم باشد',
  quiet: 'گفتگوی کم و محترمانه'
};
const COLORS = [
  { c: '#22C55E', i: '#04140B', n: 'سبز' }, { c: '#2563EB', i: '#FFFFFF', n: 'آبی' },
  { c: '#F97316', i: '#1A0D00', n: 'نارنجی' }, { c: '#DB2777', i: '#FFFFFF', n: 'سرخابی' },
  { c: '#7C3AED', i: '#FFFFFF', n: 'بنفش' }, { c: '#FBBF24', i: '#1A1400', n: 'کهربایی' },
  { c: '#14B8A6', i: '#04140B', n: 'فیروزه‌ای' }, { c: '#DC2626', i: '#FFFFFF', n: 'قرمز' }
];
const CITIES = [['tehran','تهران'],['karaj','کرج'],['mashhad','مشهد'],['isfahan','اصفهان'],['shiraz','شیراز'],['tabriz','تبریز'],['qom','قم'],['ahvaz','اهواز'],['rasht','رشت'],['kerman','کرمان'],['yazd','یزد'],['other','سایر']];
const KINDS = { school: ['مدرسه','فرزند','مدرسه'], work: ['محل کار','همکار','محل کار'], uni: ['دانشگاه','دانشجو','دانشگاه'] };

/* ═════════ sample data (fictional; one girls' school, no mixing) ═════════ */
function seed() {
  const s0 = { id: 's1', kind: 'school', cs: 'tehran', city: 'تهران', name: 'دبستان دخترانه مهرِ نمونه', shift: 'شیفت صبح', gender: 'f', lat: 35.7448, lng: 51.3750, in: '07:30', out: '13:15', days: [0,1,2,3,4], demo: true };
  s0.slug = slugify(s0.name);
  const P = (dx, dy) => ({ lat: +(s0.lat + dy / 110.57).toFixed(5), lng: +(s0.lng + dx / (111.32 * Math.cos(s0.lat * Math.PI / 180))).toFixed(5) });
  const F = (id, family, pg, kids, role, days, seats, hood, dx, dy, snapp, values, team) => ({
    id, sid: 's1', family, pg, kids: kids.map((k, i) => ({ id: id + i, first: k, g: 'f' })), role, days, seats, hood, ...P(dx, dy),
    snapp, values, team: team || null, needs: { out: true, back: true }, phone: null, phoneMask: '۰۹۱۲ ••• ' + fa(String(1000 + (id.charCodeAt(1) * 37) % 9000)).replace(/(..)(..)/, '$1 $2'), phoneShow: true, demo: true, at: Date.now()
  });
  const fams = [
    F('f1', 'آسمان', 'f', ['ستاره'], 'both', [0,2], 3, 'نارون', 0.9, 0.6, 90000, ['nomusic']),
    F('f2', 'باران', 'f', ['نیلا'], 'drive', [0,1,2], 3, 'گلستان', -1.2, 1.1, 110000, ['religious','samegender'], 't1'),
    F('f3', 'دریا', 'm', ['آوا','ترانه'], 'pay', [], 0, 'گلستان', -1.5, 0.8, 115000, [], 't1'),
    F('f4', 'کوه', 'f', ['هستی'], 'both', [3,4], 3, 'گلستان', -1.0, 1.4, 105000, ['quiet'], 't1'),
    F('f5', 'نسیم', 'm', ['رها'], 'pay', [], 0, 'نارون', 1.25, 0.95, 95000, ['quiet']),
    F('f6', 'مهتاب', 'f', ['یاس'], 'drive', [1,3,4], 3, 'نارون', 0.65, 1.15, 92000, ['religious','nomusic']),
    F('f7', 'سپیده', 'f', ['مهسا','نازنین'], 'both', [2], 4, 'شهرک بهار', 2.4, -1.6, 150000, []),
    F('f8', 'کاج', 'm', ['پریا'], 'drive', [0,1,2,3,4], 3, 'نارون', 1.6, 0.25, 98000, []),
    F('f9', 'البرز', 'f', ['سارا'], 'pay', [], 0, 'باغستان', -0.4, -2.2, 120000, ['samegender'])
  ];
  const t1 = { id: 't1', sid: 's1', no: 1, hood: 'گلستان', color: 1, at: Date.now() - 864e5 * 9 };
  const db = { v: 1, theme: null, schools: [s0], fams, teams: [t1], props: [], notes: [], tickets: [], tp: {}, me: {}, notify: false, sim: {}, outbox: [] };
  t1.price = fairPrice(db, t1);
  return db;
}
function slugify(s) { return String(s).trim().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}\-‌]/gu, '').slice(0, 60); }

/* ═════════ store ═════════ */
let D;
const ui = { tab: 'map', view: 'map', filter: 'all', slot: null, wiz: null, home: false };
function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.v === 1 && Array.isArray(d.schools)) return d; } catch (e) {}
  return seed();
}
function save(op) {
  if (op) { D.outbox.push({ op, at: Date.now() }); if (D.outbox.length > 300) D.outbox = D.outbox.slice(-300); }
  try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { toast('حافظه مرورگر در دسترس نیست؛ تغییرات تا بستن صفحه می‌ماند.'); }
}

/* ═════════ lookups ═════════ */
const school = id => D.schools.find(s => s.id === id);
const fam = id => D.fams.find(f => f.id === id);
const team = id => D.teams.find(t => t.id === id);
const famsOf = sid => D.fams.filter(f => f.sid === sid);
const teamFams = t => D.fams.filter(f => f.team === t.id);
const myId = sid => D.me[sid];
const mine = sid => fam(myId(sid));
const canDrive = f => f.role === 'drive' || f.role === 'both';
const canPay = f => f.role === 'pay' || f.role === 'both';
const fName = f => 'خانواده ' + f.family;
const kidName = (k, f) => k.first + ' ' + f.family;
const tName = t => `تیم ${fa(t.no)} · محله ${t.hood}`;
const tColor = t => COLORS[t.color % COLORS.length];
const kidsWord = f => { const n = f.kids.length, g = f.kids.every(k => k.g === 'f') ? 'دختر' : f.kids.every(k => k.g === 'm') ? 'پسر' : 'فرزند'; return fa(n) + ' ' + g; };
function km(a, b) {
  const R = 6371, t = Math.PI / 180, dl = (b.lat - a.lat) * t, dn = (b.lng - a.lng) * t;
  const x = Math.sin(dl / 2) ** 2 + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dn / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
function fairPrice(db, t) {
  const fs = db.fams.filter(f => f.team === t.id && f.snapp > 0);
  if (!fs.length) return 60000;
  return Math.max(20000, Math.round(fs.reduce((a, f) => a + f.snapp, 0) / fs.length * 0.6 / 1000) * 1000);
}

/* ═════════ matching ═════════ */
function compat(a, b) {
  const r = []; let s = 0;
  const d = km(a, b);
  s += Math.max(0, 40 * (1 - d / 3));
  r.push([`${km1(d)} کیلومتر فاصله‌ی خانه‌ها`, d <= 1.5]);
  if (canDrive(b) && canDrive(a)) { s += 28; r.push(['هر دو رانندگی می‌کنید؛ نوبت‌ها سبک می‌شود', 1]); }
  else if (canDrive(b) || canDrive(a)) { s += 25; r.push([canDrive(b) ? 'رانندگی می‌کنند' : 'شما رانندگی می‌کنید', 1]); }
  else r.push(['هر دو فقط هزینه می‌دهید؛ یک راننده لازم است', 0]);
  const gA = a.kids[0]?.g, gB = b.kids[0]?.g;
  if (a.values.includes('samegender') && canDrive(b) && b.pg !== gA) { s -= 18; r.push(['ترجیح «راننده هم‌جنس» شما با رانندگی ایشان جور نیست', 0]); }
  if (b.values.includes('samegender') && canDrive(a) && a.pg !== gB) { s -= 18; r.push(['ترجیح «راننده هم‌جنس» ایشان با رانندگی شما جور نیست', 0]); }
  const shared = a.values.filter(v => v !== 'samegender' && b.values.includes(v));
  shared.forEach(v => { s += 6; r.push(['ارزش مشترک: ' + VALUES[v], 1]); });
  if (a.needs.out === b.needs.out || a.needs.back === b.needs.back) { s += 15; r.push(['هم‌شیفت و هم‌ساعت', 1]); }
  return { score: Math.max(0, Math.min(100, Math.round(s))), reasons: r };
}
function teamIssues(fs) {
  const out = [], drivers = fs.filter(canDrive), kids = fs.reduce((a, f) => a + f.kids.length, 0);
  if (!drivers.length) out.push('این تیم راننده ندارد. یک خانواده‌ی راننده دعوت کنید یا با تیم دیگری هماهنگ شوید.');
  else if (kids > Math.max(...drivers.map(f => f.seats || 0))) out.push(`${fa(kids)} مسافر داریم اما بزرگ‌ترین خودرو ${fa(Math.max(...drivers.map(f => f.seats)))} صندلی دارد؛ بعضی روزها دو خودرو لازم است.`);
  fs.filter(f => f.values.includes('samegender')).forEach(f => {
    const ok = drivers.some(dv => dv.id === f.id || dv.pg === f.kids[0]?.g);
    if (!ok) out.push(`برای ترجیح «راننده هم‌جنس» ${fName(f)}، راننده‌ی مناسبی در تیم نیست.`);
  });
  return out;
}
function smartTeam(me) {
  const pool = famsOf(me.sid).filter(f => f.id !== me.id && !f.team).map(f => ({ f, c: compat(me, f).score })).filter(x => x.c >= 35).sort((a, b) => b.c - a.c);
  const pick = [];
  if (!canDrive(me)) { const dv = pool.find(x => canDrive(x.f)); if (dv) pick.push(dv); }
  const seats = () => Math.max(canDrive(me) ? me.seats : 0, ...pick.filter(x => canDrive(x.f)).map(x => x.f.seats), 0);
  const kids = () => me.kids.length + pick.reduce((a, x) => a + x.f.kids.length, 0);
  for (const x of pool) {
    if (pick.includes(x) || pick.length >= 3) continue;
    if (kids() + x.f.kids.length > Math.max(seats(), canDrive(x.f) ? x.f.seats : 0)) continue;
    pick.push(x);
  }
  if (!pick.length) return null;
  const fs = [me, ...pick.map(x => x.f)];
  return { fams: pick.map(x => x.f), score: Math.round(pick.reduce((a, x) => a + x.c, 0) / pick.length), issues: teamIssues(fs) };
}

/* ═════════ teams + proposals ═════════ */
function makeTeam(sid, members) {
  const ts = D.teams.filter(t => t.sid === sid);
  const no = ts.reduce((a, t) => Math.max(a, t.no), 0) + 1;
  const hoods = members.map(f => f.hood).filter(Boolean);
  const hood = hoods.sort((a, b) => hoods.filter(x => x === b).length - hoods.filter(x => x === a).length)[0] || 'ما';
  const used = new Set(ts.map(t => t.color));
  let color = (no + 1) % COLORS.length; for (let k = 0; k < COLORS.length && used.has(color); k++) color = (color + 1) % COLORS.length;
  const t = { id: 't' + uid(), sid, no, hood, color, at: Date.now() };
  D.teams.push(t);
  members.forEach(f => f.team = t.id);
  t.price = fairPrice(D, t);
  replan(t, true);
  return t;
}
function joinTeam(t, f) { f.team = t.id; t.price = fairPrice(D, t); replan(t, false); }
function leaveTeam(f) {
  const t = team(f.team); if (!t) return;
  f.team = null;
  const rest = teamFams(t);
  if (rest.length < 2) { rest.forEach(x => x.team = null); D.teams = D.teams.filter(x => x.id !== t.id); return 'closed'; }
  t.price = fairPrice(D, t); replan(t, false); return 'left';
}
function propose(from, to) {
  if (D.props.some(p => p.status === 'pending' && ((p.from === from.id && p.to === to.id) || (p.from === to.id && p.to === from.id)))) return null;
  const p = { id: uid(), from: from.id, to: to.id, status: 'pending', at: Date.now() };
  D.props.push(p); return p;
}
function accept(p) {
  const a = fam(p.from), b = fam(p.to); if (!a || !b) return null;
  p.status = 'accepted';
  let t;
  if (a.team && !b.team) { t = team(a.team); joinTeam(t, b); }
  else if (!a.team && b.team) { t = team(b.team); joinTeam(t, a); }
  else if (!a.team && !b.team) t = makeTeam(a.sid, [a, b]);
  else return null;
  return t;
}
function note(text, push) {
  D.notes.unshift({ id: uid(), text, at: Date.now(), read: false });
  D.notes = D.notes.slice(0, 40);
  if (push) notify('رسیدیم', text);
}

/* ═════════ daily (phase one) ═════════ */
function tp(t) { return D.tp[t.id] || (D.tp[t.id] = { plan: {}, trips: {}, ledger: [] }); }
function slots(t) {
  const s = school(t.sid), out = [];
  s.days.forEach(d => ['out','back'].forEach(dir => out.push({ id: d + '-' + dir, d, dir, time: dir === 'out' ? s.in : s.out })));
  return out;
}
const slotOf = (t, id) => slots(t).find(x => x.id === id);
const riders = (t, x) => teamFams(t).filter(f => f.needs[x.dir]).flatMap(f => f.kids.map(k => ({ ...k, fid: f.id })));
function fits(t, dv, x) {
  if (!canDrive(dv)) return false;
  return riders(t, x).every(k => { const o = fam(k.fid); return !o.values.includes('samegender') || o.id === dv.id || dv.pg === k.g; });
}
function rec(t, x) { const P = tp(t); return P.trips[x.id] || { status: 'pending', exec: P.plan[x.id] ?? null, arr: {}, empty: false }; }
function counts(t, except) { const c = {}; teamFams(t).forEach(f => c[f.id] = 0); slots(t).forEach(x => { if (x.id === except) return; const e = rec(t, x).exec; if (c[e] != null) c[e]++; }); return c; }
function replan(t, all) {
  const P = tp(t), c = {};
  teamFams(t).forEach(f => c[f.id] = 0);
  slots(t).forEach(x => { if (P.trips[x.id] && !all) c[P.trips[x.id].exec] = (c[P.trips[x.id].exec] || 0) + 1; });
  slots(t).forEach(x => {
    if (!all && P.trips[x.id]) return;
    if (all) delete P.trips[x.id];
    if (!riders(t, x).length) { P.plan[x.id] = null; return; }
    const pool = teamFams(t).filter(f => fits(t, f, x)).sort((a, b) => (b.days.includes(x.d) - a.days.includes(x.d)) || (c[a.id] - c[b.id]) || (b.seats - a.seats));
    const pick = pool[0]; P.plan[x.id] = pick ? pick.id : null; if (pick) c[pick.id]++;
  });
}
function cands(t, x, exclude) {
  const c = counts(t, x.id);
  return teamFams(t).filter(f => f.id !== exclude && fits(t, f, x)).map(f => ({ f, on: f.days.includes(x.d), n: c[f.id] })).sort((a, b) => (b.on - a.on) || (a.n - b.n));
}
function tripEntry(t, x, exec) {
  const P = tp(t); if (P.ledger.some(e => e.kind === 'trip' && e.slot === x.id)) return;
  const rs = riders(t, x), d = {}, share = Math.round(t.price / rs.length / 1000) * 1000;
  d[exec] = (d[exec] || 0) + share * rs.length;
  rs.forEach(k => d[k.fid] = (d[k.fid] || 0) - share);
  P.ledger.push({ id: uid(), kind: 'trip', slot: x.id, at: Date.now(), text: `${DAYS[x.d]} ${x.dir === 'out' ? 'رفت' : 'برگشت'} · ${fName(fam(exec))}`, d });
}
function balances(t) {
  const b = {}; teamFams(t).forEach(f => b[f.id] = 0);
  tp(t).ledger.forEach(e => Object.entries(e.d).forEach(([k, v]) => { if (b[k] != null) b[k] += v; }));
  Object.keys(b).forEach(k => b[k] = Math.round(b[k])); return b;
}
function settle(t) {
  const b = balances(t);
  const deb = Object.entries(b).filter(([, v]) => v < -999).map(([k, v]) => [k, -v]).sort((x, y) => y[1] - x[1]);
  const cre = Object.entries(b).filter(([, v]) => v > 999).sort((x, y) => y[1] - x[1]);
  const out = []; let i = 0, j = 0;
  while (i < deb.length && j < cre.length) {
    const a = Math.min(deb[i][1], cre[j][1]), r = Math.round(a / 1000) * 1000;
    if (r >= 1000) out.push({ from: deb[i][0], to: cre[j][0], amt: r });
    deb[i][1] -= a; cre[j][1] -= a; if (deb[i][1] < 1) i++; if (cre[j][1] < 1) j++;
  }
  return out;
}
function focusSlot(t) {
  const L = slots(t); if (!L.length) return null;
  if (ui.slot) { const f = L.find(x => x.id === ui.slot); if (f) return f; }
  const ord = [...L.filter(x => x.d >= TODAY), ...L.filter(x => x.d < TODAY)];
  return ord.find(x => rec(t, x).status !== 'done') || ord[0];
}
const dayWord = d => d === TODAY ? 'امروز' : d === (TODAY + 1) % 7 ? 'فردا' : DAYS[d];

/* ═════════ routing ═════════ */
function route() {
  const h = decodeURIComponent(location.hash.replace(/^#\/?/, '')).split('/').filter(Boolean);
  if (h.length >= 2) return { cs: h[0], slug: h[1] };
  const p = decodeURIComponent(location.pathname.slice(BASE.length)).split('/').filter(Boolean);
  if (p.length >= 2 && !/\./.test(p[1])) return { cs: p[0], slug: p[1] };
  return null;
}
const schoolByRoute = r => r && D.schools.find(s => s.cs === r.cs && s.slug === r.slug);
const linkOf = s => `${location.origin}${BASE}#/${s.cs}/${s.slug}`;
const prettyLink = s => `${location.host}${BASE}#/${s.cs}/${s.slug}`;
function go(s) { location.hash = '/' + s.cs + '/' + s.slug; }
function ctx() {
  const s = schoolByRoute(route());
  if (s) return { s, me: mine(s.id) };
  const any = Object.keys(D.me).map(school).filter(Boolean)[0];
  if (any && !location.hash && !ui.home) return { s: any, me: mine(any.id), implicit: true };
  return { s: null, me: null };
}

/* ═════════ map ═════════ */
function mapSvg(s, me, opt) {
  const fs = famsOf(s.id).filter(f => {
    if (!opt.interactive) return true;
    if (ui.filter === 'free') return !f.team || f.id === me?.id;
    if (ui.filter === 'drivers') return canDrive(f);
    if (ui.filter === 'near') return me ? (f.id === me.id || km(me, f) <= 1.5) : true;
    return true;
  });
  const XY = f => {
    const exact = me && (f.id === me.id || (me.team && f.team === me.team));
    const lat = exact ? f.lat : Math.round(f.lat / .0014) * .0014, lng = exact ? f.lng : Math.round(f.lng / .0017) * .0017;
    let dx = (lng - s.lng) * 111.32 * Math.cos(s.lat * Math.PI / 180), dy = (lat - s.lat) * 110.57;
    const r = Math.hypot(dx, dy); if (r > 3.05) { dx *= 3.05 / r; dy *= 3.05 / r; }
    return [dx * 31, -dy * 31];
  };
  const pos = fs.map(XY);
  for (let it = 0; it < 6; it++) for (let i = 0; i < pos.length; i++) for (let k = 0; k < i; k++) {
    const dx = pos[i][0] - pos[k][0], dy = pos[i][1] - pos[k][1], d = Math.hypot(dx, dy) || 0.01;
    if (d < 19) { const m = (19 - d) / 2, ux = d > 0.02 ? dx / d : Math.cos(i), uy = d > 0.02 ? dy / d : Math.sin(i); pos[i][0] += ux * m; pos[i][1] += uy * m; pos[k][0] -= ux * m; pos[k][1] -= uy * m; }
  }
  const pins = fs.map((f, n) => {
    const [x, y] = pos[n], t = team(f.team), col = t ? tColor(t) : null, both = f.role === 'both', w = both ? 21 : 13;
    const gl = both ? `<use href="#i-wheel" x="${-9}" y="${-5.2}" width="8.4" height="8.4" class="gl"/><use href="#i-coin" x="${0.6}" y="${-5.2}" width="8.4" height="8.4" class="gl"/>`
      : `<use href="#i-${canDrive(f) ? 'wheel' : 'coin'}" x="-4.4" y="-5.2" width="8.8" height="8.8" class="gl"/>`;
    const lab = opt.names ? `<text x="0" y="13.5" text-anchor="middle">${esc(f.family)}${f.id === me?.id ? ' (شما)' : ''}</text>` : '';
    return `<g class="pin ${t ? '' : 'free'} ${f.id === me?.id ? 'me' : ''}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(1.35)" style="--pc:${col ? col.c : 'var(--surface)'};--pi:${col ? col.i : 'var(--ink)'};color:${col ? col.i : 'var(--ink)'}"
      ${opt.interactive ? `data-a="fam" data-f="${f.id}" tabindex="0" role="button" aria-label="${esc(fName(f) + '، ' + (f.role === 'pay' ? 'هزینه می‌دهند' : f.role === 'drive' ? 'رانندگی می‌کنند' : 'رانندگی و هزینه') + (t ? '، ' + tName(t) : '، بدون تیم'))}"` : ''}>
      <circle class="halo" r="10"/><rect class="body" x="${-w / 2}" y="-7" width="${w}" height="11" rx="5.5"/><path class="body" d="M-2.2 3.6 0 6.8 2.2 3.6Z"/>
      <g stroke="currentColor" fill="none" stroke-width="2.3">${gl}</g>
      <g transform="translate(${w / 2 - 0.5} -7.5)"><circle class="sex" r="3.4"/><use href="#i-${f.pg === 'f' ? 'woman' : 'man'}" x="-2.6" y="-2.6" width="5.2" height="5.2" stroke="var(--ink)" fill="none" stroke-width="2.4"/></g>${lab}</g>`;
  }).join('');
  return `<svg class="map" viewBox="-104 -104 208 208" role="img" aria-label="نقشه‌ی محله‌های ${esc(s.name)}؛ مدرسه در مرکز">
    ${[1,2,3].map(k => `<circle class="ring" r="${k * 31}"/><text class="ring-t" x="2" y="${-k * 31 + 5}">${fa(k)} کیلومتر</text>`).join('')}
    <text class="compass" x="0" y="-98" text-anchor="middle">شمال</text><text class="compass" x="0" y="102" text-anchor="middle">جنوب</text>
    <text class="compass" x="99" y="2" text-anchor="end">شرق</text><text class="compass" x="-99" y="2">غرب</text>
    <g class="school" ${opt.interactive ? 'data-a="navschool" role="button" tabindex="0" aria-label="مسیر تا مدرسه"' : ''}><circle r="8"/><path d="M-4.5 -0.5 0 -3.5 4.5 -0.5 0 2.5Z M-2.6 0.8v2.4c1.4 1 3.8 1 5.2 0V0.8"/><text y="15" text-anchor="middle">${esc(KINDS[s.kind][0])}</text></g>
    ${pins}</svg>`;
}

/* ═════════ screens ═════════ */
function home() {
  const q = (ui.q || '').trim();
  const list = D.schools.filter(s => !q || (s.name + s.city).includes(q));
  return `<section class="hero-g"><span class="small" style="font-weight:800">سرویس مشارکتی!</span><h1>مامان، بابا،<br>رسیدیم!</h1>
    <p>اپ رفت‌وآمد مشارکتی والدین برای فرزندان دلبندشان. هم‌مدرسه‌ای‌های نزدیک را پیدا کنید، تیم شوید، نوبتی ببرید و منصفانه حساب کنید. برای همکاران و هم‌دانشگاهی‌ها هم هست.</p>
    <div class="row wrap"><button class="btn" data-a="findschool">مدرسه‌ام را پیدا کنم</button><button class="btn line" data-a="newschool">ثبت مدرسه یا محل کار</button></div>${artCar('deco')}</section>
  <section class="card stack" style="margin-top:14px" id="find"><div class="field"><label for="q">جستجوی مدرسه، محل کار یا دانشگاه</label><input id="q" data-in="q" value="${esc(ui.q || '')}" placeholder="نام یا شهر" autocomplete="off"></div>
    ${list.map(s => `<button class="fam" data-a="open" data-s="${s.id}"><span class="av free">${ic('school')}</span><span class="grow"><b>${esc(s.name)}</b><br><span class="muted small">${esc(s.city)} · ${esc(s.shift)} · ${fa(famsOf(s.id).length)} خانواده</span></span>${ic('back')}</button>`).join('') || '<p class="muted">پیدا نشد. اولین نفر باشید و ثبتش کنید!</p>'}
  </section>
  <section class="card" style="margin-top:14px"><h2 style="margin-bottom:10px">چطور کار می‌کند؟</h2><ol class="steps3"><li>یک نفر مدرسه را ثبت می‌کند و «لینک رسیدیمِ مدرسه» ساخته می‌شود.</li><li>خانواده‌ها با لینک یا QR پوستر، در دو دقیقه به چند سؤال ساده جواب می‌دهند.</li><li>روی نقشه هم را پیدا می‌کنند، تیم می‌شوند و از فردا نوبتی می‌برند.</li></ol></section>`;
}
function schoolPage(s, note) {
  const fs = famsOf(s.id), my = Object.keys(D.me).map(school).filter(Boolean).filter(x => x.id !== s.id);
  return `<section class="hero-g"><span class="small" style="font-weight:800">لینک رسیدیمِ ${esc(KINDS[s.kind][0])}</span><h1>${esc(s.name)}</h1>
    <p>${esc(s.city)} · ${esc(s.shift)} · ورود ${clock(s.in)} · تعطیلی ${clock(s.out)}</p>
    <p>${fs.length ? `${fa(fs.length)} خانواده از همین‌جا آمده‌اند. شما هم بیایید تا همسایه‌های هم‌مدرسه‌ای را پیدا کنید.` : 'اولین خانواده باشید! لینک را در گروه مدرسه بفرستید.'}</p>
    <div class="row wrap"><button class="btn" data-a="join">پیوستن در ۲ دقیقه</button>${s.demo ? '<button class="btn line" data-a="demo">ورود با خانواده نمونه</button>' : ''}</div>${artCar('deco')}</section>
    ${note ? `<div class="hint warn" style="margin-top:12px">${ic('warn')}<span>${note}</span></div>` : ''}
    ${my.length ? `<div class="hint" style="margin-top:12px">${ic('school')}<span>شما در «${esc(my[0].name)}» هم عضو هستید. <button class="link" data-a="open" data-s="${my[0].id}">رفتن به آنجا</button></span></div>` : ''}
    <div class="split" style="margin-top:14px"><div class="map-wrap">${mapSvg(s, null, { interactive: false, names: false })}<div class="legend">${legend()}<span>نام‌ها پس از پیوستن دیده می‌شوند</span></div></div>
    <div class="stack"><div class="stats"><div class="stat"><b>${fa(fs.length)}</b><span>خانواده</span></div><div class="stat"><b>${fa(fs.filter(canDrive).length)}</b><span>راننده</span></div><div class="stat"><b>${fa(D.teams.filter(t => t.sid === s.id).length)}</b><span>تیم</span></div></div>
      <div class="card"><ol class="steps3"><li>چند سؤال ساده؛ گام‌به‌گام.</li><li>هم‌مدرسه‌ای‌های نزدیک را روی نقشه ببینید.</li><li>با یک تپ پیشنهاد هم‌تیمی بدهید.</li></ol></div>
      <div class="row wrap"><button class="btn line sm" data-a="poster">${ic('print')}پوستر و QR</button><button class="btn line sm" data-a="share">${ic('share')}فرستادن لینک</button></div></div></div>`;
}
const legend = () => `<span>${ic('wheel')} رانندگی</span><span>${ic('coin')} هزینه</span><span>${ic('woman')} مادر</span><span>${ic('man')} پدر</span><span><i class="team-dot" style="background:var(--surface);box-shadow:0 0 0 1.5px var(--ink)"></i>بی‌تیم</span>`;

function mapTab(s, me) {
  const t = team(me.team), fs = famsOf(s.id);
  const free = fs.filter(f => !f.team && f.id !== me.id), near = free.filter(f => km(me, f) <= 1.5);
  let hint;
  if (!t) hint = near.length ? `${fa(near.length)} خانواده‌ی بی‌تیم نزدیک شما هستند. روی نشانگرها بزنید و پیشنهاد هم‌تیمی بدهید.` : 'هنوز خانواده‌ی نزدیکی بی‌تیم نیست. لینک را در گروه مدرسه بفرستید؛ ثبت‌نام تازه را خبر می‌دهیم.';
  else { const iss = teamIssues(teamFams(t)); hint = iss.length ? iss[0] : `شما در ${tName(t)} هستید. برنامه‌ی امروز در تب «تیم ما» است.`; }
  const sm = !t ? smartTeam(me) : null;
  const list = ui.view === 'list' ? `<div class="stack" style="padding:12px">${fs.filter(f => f.id !== me.id).map(f => ({ f, c: compat(me, f) })).sort((a, b) => b.c.score - a.c.score).map(({ f, c }) => famRow(f, c)).join('')}</div>` : '';
  return `<div class="split"><section class="map-wrap">
      <div class="map-tools"><div class="seg" role="group" aria-label="نمایش"><button data-a="view" data-v="map" aria-pressed="${ui.view === 'map'}">${ic('map')}</button><button data-a="view" data-v="list" aria-pressed="${ui.view === 'list'}">${ic('list')}</button></div>
        <div class="seg" role="group" aria-label="فیلتر">${[['all','همه'],['free','بی‌تیم'],['drivers','راننده'],['near','نزدیک']].map(([k, v]) => `<button data-a="filter" data-v="${k}" aria-pressed="${ui.filter === k}">${v}</button>`).join('')}</div></div>
      ${ui.view === 'map' ? `<div style="padding-top:54px">${mapSvg(s, me, { interactive: true, names: true })}</div>` : `<div style="padding-top:54px">${list}</div>`}
      <div class="legend">${legend()}</div></section>
    <aside class="stack">
      <div class="hint ${t && teamIssues(teamFams(t)).length ? 'warn' : ''}">${ic(t ? 'team' : 'spark')}<span>${hint}</span></div>
      ${sm ? `<div class="card stack"><div class="row between"><h2>${ic('spark')} پیشنهاد هوشمند تیم</h2><span class="score">${fa(sm.score)}٪<small>هم‌خوانی</small></span></div>
        <p class="muted small">شما + ${sm.fams.map(f => esc(fName(f))).join(' + ')} · ${fa(sm.fams.filter(canDrive).length + (canDrive(me) ? 1 : 0))} راننده</p>
        ${sm.issues.length ? `<p class="note" style="color:var(--warn)">${ic('warn')}${esc(sm.issues[0])}</p>` : ''}
        <button class="btn ac block" data-a="smart">پیشنهاد به همه‌شان</button></div>` : ''}
      ${t ? teamMini(t) : ''}
      <div class="card stack"><div class="row between"><h2>فاز صفر: آشنایی</h2><span class="tag">${fa(fs.length)} خانواده</span></div>
        <div class="stats"><div class="stat"><b>${fa(free.length)}</b><span>بی‌تیم</span></div><div class="stat"><b>${fa(fs.filter(canDrive).length)}</b><span>راننده</span></div><div class="stat"><b>${fa(D.teams.filter(x => x.sid === s.id).length)}</b><span>تیم</span></div></div>
        <div class="row wrap"><button class="btn line sm" data-a="poster">${ic('print')}پوستر مدرسه</button><button class="btn line sm" data-a="share">${ic('share')}فرستادن لینک</button></div></div>
    </aside></div>`;
}
function famRow(f, c) {
  const t = team(f.team), col = t ? tColor(t) : null;
  return `<button class="fam" data-a="fam" data-f="${f.id}"><span class="av ${t ? '' : 'free'}" style="${col ? `--pc:${col.c};--pi:${col.i}` : ''}">${esc(f.family[0])}</span>
    <span class="grow"><b>${esc(fName(f))}</b> <span class="roles">${canDrive(f) ? ic('wheel') : ''}${canPay(f) ? ic('coin') : ''}${ic(f.pg === 'f' ? 'woman' : 'man')}</span><br>
    <span class="muted small">${esc(f.hood)} · ${kidsWord(f)} · ${t ? esc(tName(t)) : 'بی‌تیم'}</span></span>${c ? `<span class="score">${fa(c.score)}٪<small>هم‌خوانی</small></span>` : ''}</button>`;
}
function teamMini(t) {
  const fs = teamFams(t), col = tColor(t);
  return `<div class="card stack"><div class="row between"><h2><i class="team-dot" style="background:${col.c}"></i>${esc(tName(t))}</h2><span class="tag">${fa(fs.length)} خانواده</span></div>
    <div class="row wrap">${fs.map(f => `<span class="tag">${esc(f.family)} ${canDrive(f) ? '🚗' : ''}${canPay(f) ? '🪙' : ''}</span>`).join('')}</div>
    <button class="btn ac" data-tab="team">رفتن به تیم</button></div>`;
}

function teamTab(s, me) {
  const t = team(me.team);
  if (!t) {
    const sm = smartTeam(me);
    return `<section class="card stack" style="text-align:center;justify-items:center;padding:28px 18px">${artTeam()}
      <h1 style="font-size:1.6rem">هنوز تیم ندارید</h1><p class="muted" style="max-width:40ch">روی نقشه‌ی مدرسه، خانواده‌های نزدیک را ببینید و با یک تپ پیشنهاد هم‌تیمی بدهید. هر تیم دست‌کم یک راننده لازم دارد.</p>
      <div class="row wrap" style="justify-content:center"><button class="btn ac" data-tab="map">رفتن به نقشه</button>${sm ? '<button class="btn line" data-a="smart">پیشنهاد هوشمند</button>' : ''}</div></section>`;
  }
  const fs = teamFams(t), iss = teamIssues(fs), x = focusSlot(t);
  return `<div class="split"><div class="stack">${x ? todayCard(t, x, me) : ''}${iss.length ? `<div class="hint warn">${ic('warn')}<span>${esc(iss[0])}</span></div>` : ''}</div>
    <aside class="stack"><div class="card stack"><div class="row between"><h2>این هفته</h2><button class="link" data-a="replan">چیدن دوباره</button></div>${weekGrid(t)}</div>
      <div class="card"><div class="row between" style="margin-bottom:6px"><h2><i class="team-dot"></i>${esc(tName(t))}</h2><span class="tag ac">هر سفر ${money(t.price)}</span></div>
        ${fs.map(f => `<div class="member"><span class="av" style="--pc:${tColor(t).c};--pi:${tColor(t).i}">${esc(f.family[0])}</span><span class="grow"><b>${esc(fName(f))}</b>${f.id === me.id ? ' <span class="tag ac">شما</span>' : ''}<br><span class="muted small">${f.kids.map(k => esc(kidName(k, f))).join('، ')}</span></span>
          <span class="roles">${canDrive(f) ? ic('wheel') : ''}${canPay(f) ? ic('coin') : ''}</span>${f.id !== me.id ? callBtn(f) : ''}</div>`).join('')}
        <p class="muted small" style="margin-top:8px">مبلغ هر سفر: ۶۰٪ میانگین برآورد اسنپ اعضا؛ هم جبران زحمت راننده، هم ارزان‌تر از اسنپ.</p>
        <div class="row wrap" style="margin-top:10px"><button class="btn line sm" data-tab="map">${ic('plus')}دعوت از خانواده‌ی دیگر</button></div></div></aside></div>`;
}
const callBtn = f => f.phone ? `<a class="icon-btn" href="tel:${esc(f.phone)}" aria-label="تماس با ${esc(fName(f))}">${ic('phone')}</a>` : `<button class="icon-btn" data-a="demophone" aria-label="تماس با ${esc(fName(f))}">${ic('phone')}</button>`;

function todayCard(t, x, me) {
  const r = rec(t, x), ex = fam(r.exec), planned = fam(tp(t).plan[x.id]), ks = riders(t, x), sch = school(t.sid);
  const same = slots(t).filter(y => y.d === x.d);
  const rem = ex ? [...new Set(teamFams(t).filter(f => f.id !== ex.id && ks.some(k => k.fid === f.id)).flatMap(f => f.values.filter(v => v !== 'samegender' && v !== 'parent').map(v => VALUES[v])))] : [];
  let body = '', act = '';
  if (r.status === 'pending') {
    body = `<div class="kids">${ks.map(k => `<span class="kid" style="--kc:var(--ac)"><i></i>${esc(kidName(k, fam(k.fid)))}</span>`).join('')}</div>`;
    act = `<button class="btn ac block" data-a="start" ${ex ? '' : 'disabled'}>راه افتادیم</button><button class="btn line block" data-a="swap">${ex && ex.id === me.id ? 'برایم مشکلی پیش آمد' : ex ? 'جایگزین لازم است؟' : 'من می‌برم'}</button>`;
  } else if (r.status === 'started') {
    const all = ks.every(k => r.arr[k.id]);
    body = `<p class="muted small">هر کس رسید، رویش بزنید؛ خانواده‌اش خبردار می‌شود.</p><div class="kids">${ks.map(k => `<button class="kid ${r.arr[k.id] ? 'ok' : ''}" style="--kc:var(--ac)" data-a="arrive" data-k="${k.id}" ${r.arr[k.id] ? 'aria-pressed="true"' : ''}>${r.arr[k.id] ? ic('check') : '<i></i>'}${esc(kidName(k, fam(k.fid)))}${r.arr[k.id] ? ' رسید' : ''}</button>`).join('')}</div>`;
    act = `<label class="check"><input type="checkbox" data-a="empty" ${r.empty ? 'checked' : ''} ${all ? '' : 'disabled'}>خودرو خالی است و چیزی جا نمانده</label><button class="btn ac block" data-a="finish" ${all && r.empty ? '' : 'disabled'}>ثبت پایان سفر</button>`;
  } else {
    body = `<div class="done"><b>خدا قوت! همه به سلامت رسیدند.</b><span class="muted">${money(t.price)} به اعتبار ${esc(fName(ex))} ثبت شد.</span></div>`;
    act = `<button class="btn line block" data-a="thanks" ${r.thanks ? 'disabled' : ''}>${ic('heart')}${r.thanks ? 'تشکر شما رسید' : 'دست‌شان درد نکند'}</button><button class="btn ac block" data-a="next">نوبت بعدی</button>`;
  }
  const notes = [];
  if (ex && planned && ex.id !== planned.id) notes.push(`به‌جای ${esc(fName(planned))}؛ ممنون از هم‌دلی‌شان.`);
  if (ex && !ex.days.includes(x.d) && r.status === 'pending') notes.push('این روز را اعلام نکرده بودند؛ یک پیام هماهنگی کافی است.');
  if (!ex) notes.push('راننده‌ی سازگاری برای این نوبت نیست؛ یک داوطلب لازم است.');
  return `<article class="today" aria-live="polite">
    <div class="row between wrap"><div class="seg" role="group">${same.map(y => `<button data-a="pick" data-s="${y.id}" aria-pressed="${y.id === x.id}">${y.dir === 'out' ? 'رفت' : 'برگشت'} ${clock(y.time)}</button>`).join('')}</div>
      <span class="tag ${r.status === 'done' ? 'ok' : r.status === 'started' ? 'ac' : ''}">${{ pending: 'هنوز راه نیفتاده', started: 'در مسیر', done: 'رسیدیم' }[r.status]}</span></div>
    <div class="when"><b>${dayWord(x.d)}${x.d === TODAY ? '، ' + DAYS[x.d] : ''}</b><span>${x.dir === 'out' ? 'به ' + esc(sch.name) : 'از مدرسه به خانه'}</span></div>
    <div class="who">${ex ? `${esc(fName(ex))}<em>می‌برند</em>` : 'بدون راننده'}</div>
    ${notes.map(n => `<p class="note">${ic('warn')}${n}</p>`).join('')}
    ${body}
    ${rem.length && r.status !== 'done' ? `<p class="note">${ic('heart')}یادآوری محترمانه: ${rem.map(esc).join(' · ')}</p>` : ''}
    <div class="stack" style="gap:10px">${act}</div></article>`;
}
function weekGrid(t) {
  const L = slots(t), days = [...new Set(L.map(x => x.d))];
  return `<div class="week">${days.map(d => `<div class="wrow ${d === TODAY ? 'now' : ''}"><span class="d">${DAYS[d]}</span>${['out','back'].map(dir => {
    const x = L.find(y => y.d === d && y.dir === dir), r = rec(t, x), f = fam(r.exec), p = tp(t).plan[x.id];
    const st = r.status === 'done' ? ['ok', 'رسیدیم ✓'] : !f ? ['none', 'داوطلب لازم'] : (p && p !== r.exec) ? ['', 'جایگزین'] : !f.days.includes(d) ? ['ask', 'هماهنگی'] : ['', dir === 'out' ? 'رفت ' + clock(x.time) : 'برگشت ' + clock(x.time)];
    return `<button class="slot ${st[0]}" style="--sc:${f ? 'var(--ac)' : 'var(--warn)'}" data-a="slot" data-s="${x.id}"><b>${f ? esc(f.family) : '—'}</b><small>${st[1]}</small></button>`;
  }).join('')}</div>`).join('')}</div>`;
}

function moneyTab(s, me) {
  const t = team(me.team);
  if (!t) return `<section class="card stack" style="text-align:center;justify-items:center;padding:28px 18px">${ic('money')}<h1 style="font-size:1.5rem">حساب، بعد از تیم شدن</h1><p class="muted">وقتی تیم شدید، هر سفر خودکار و شفاف حساب می‌شود؛ بدون دلخوری.</p><button class="btn ac" data-tab="map">پیدا کردن هم‌تیمی</button></section>`;
  const b = balances(t), mineB = b[me.id] || 0, sg = settle(t), max = Math.max(1, ...Object.values(b).map(Math.abs));
  const log = tp(t).ledger.slice().reverse().slice(0, 12).map(e => { const v = e.d[me.id] || 0; return `<div><span>${e.kind === 'pay' ? '💳 ' : e.kind === 'gift' ? '🤍 ' : ''}${esc(e.text)}</span><span class="num ${v > 0 ? 'plus' : v < 0 ? 'minus' : 'muted'}">${v ? (v > 0 ? '+' : '−') + fa(sep(v)) : '—'}</span></div>`; }).join('');
  return `<div class="split"><div class="stack"><section class="bal"><span class="muted small">تراز شما در ${esc(tName(t))}</span><span class="big ${mineB > 0 ? 'plus' : mineB < 0 ? 'minus' : ''}">${mineB > 0 ? '+' : mineB < 0 ? '−' : ''}${money(mineB)}</span>
      <span class="muted">${mineB > 0 ? 'بیشتر از سهم‌تان زحمت کشیده‌اید.' : mineB < 0 ? 'سهم شما برای تسویه؛ با پرداخت یا با رانندگی جبران می‌شود.' : 'حساب شما صاف است. دل‌تان روشن!'}</span></section>
    <section class="card stack"><div class="row between"><h2>پیشنهاد تسویه</h2><button class="link" data-a="how">حساب چطور است؟</button></div>
      ${sg.length ? sg.map((x, i) => `<div class="srow"><b>${esc(fName(fam(x.from)))} ← ${esc(fName(fam(x.to)))} · <span class="num">${money(x.amt)}</span></b><div class="row"><button class="btn line sm grow" data-a="pay" data-i="${i}">پرداخت شد</button><button class="btn line sm grow" data-a="gift" data-i="${i}">حلال است</button></div></div>`).join('') : '<p class="muted">فعلاً تسویه‌ای لازم نیست.</p>'}</section></div>
    <aside class="stack"><section class="card"><h2 style="margin-bottom:8px">اعضا</h2>${teamFams(t).map(f => `<div class="member"><span class="av" style="--pc:${tColor(t).c};--pi:${tColor(t).i}">${esc(f.family[0])}</span><span class="grow"><b>${esc(fName(f))}</b><div style="height:6px;border-radius:9px;background:var(--surface-2);margin-top:4px;overflow:hidden"><i style="display:block;height:100%;width:${Math.round(Math.abs(b[f.id]) / max * 100)}%;background:var(--ac)"></i></div></span><span class="num ${b[f.id] > 0 ? 'plus' : b[f.id] < 0 ? 'minus' : 'muted'}">${b[f.id] > 0 ? '+' : b[f.id] < 0 ? '−' : ''}${fa(sep(b[f.id]))}</span></div>`).join('')}<p class="muted small" style="margin-top:6px">جمع ترازها همیشه صفر است.</p></section>
      <section class="card"><div class="row between" style="margin-bottom:6px"><h2>دفتر شفاف</h2><span class="muted small">چیزی پاک نمی‌شود</span></div><div class="log">${log || '<p class="muted small">هنوز سفری ثبت نشده.</p>'}</div></section></aside></div>`;
}

/* ═════════ render ═════════ */
function render(anim) {
  const c = ctx(), main = $('#main'), dock = $('#dock');
  let html, title;
  const t = c.me && team(c.me.team), col = t ? tColor(t) : null;
  document.documentElement.style.setProperty('--ac', col ? col.c : '#1DBF73');
  document.documentElement.style.setProperty('--ac-ink', col ? col.i : '#04140B');
  if (!c.s) {
    const r = route();
    html = r ? `<div class="hint warn">${ic('warn')}<span>این لینک پیدا نشد. شاید هنوز ثبت نشده؛ می‌توانید ثبتش کنید.</span></div><div style="height:12px"></div>` + home() : home();
    title = `<img src="assets/icon.svg" alt=""><span><b>رسیدیم</b><small>سرویس مشارکتی والدین</small></span>`;
  } else if (!c.me) {
    html = schoolPage(c.s);
    title = `<img src="assets/icon.svg" alt=""><span><b>رسیدیم</b><small>${esc(c.s.name)}</small></span>`;
  } else {
    if (c.implicit && !location.hash) history.replaceState(null, '', '#/' + c.s.cs + '/' + c.s.slug);
    html = { map: mapTab, team: teamTab, money: moneyTab }[ui.tab](c.s, c.me);
    title = `<img src="assets/icon.svg" alt=""><span><b>${t ? `<i class="team-dot"></i>${esc(tName(t))}` : esc(fName(c.me))}</b><small>${esc(c.s.name)}</small></span>`;
  }
  main.innerHTML = html;
  $('#title').innerHTML = title;
  dock.classList.toggle('hide', !c.me);
  dock.querySelectorAll('[data-tab]').forEach(b => b.dataset.tab === ui.tab ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  const n = c.me ? D.props.filter(p => p.to === c.me.id && p.status === 'pending').length + D.notes.filter(x => !x.read).length : 0;
  $('#bell').innerHTML = ic('bell') + (n ? `<span class="badge">${fa(n)}</span>` : '');
  $('#bell').classList.toggle('hide', !c.me);
  if (anim) { main.classList.remove('enter'); void main.offsetWidth; main.classList.add('enter'); }
}

/* ═════════ sheets & drawer ═════════ */
let lastFocus;
function sheet(title, body, sub) {
  lastFocus = document.activeElement;
  $('#layer').innerHTML = `<div class="scrim" data-a="close"></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-t" tabindex="-1"><div class="sheet-h"><div><h2 id="sh-t">${title}</h2>${sub ? `<p class="muted small">${sub}</p>` : ''}</div><button class="icon-btn" data-a="close" aria-label="بستن">${ic('close')}</button></div><div class="sheet-b">${body}</div></div>`;
  $('.sheet').focus();
}
function closeLayer() { $('#layer').innerHTML = ''; if (lastFocus && document.contains(lastFocus)) lastFocus.focus(); }

function famSheet(f) {
  const c = ctx(), me = c.me, t = team(f.team), mt = me && team(me.team), col = t ? tColor(t) : null;
  const sameTeam = me && t && me.team === f.team, isMe = me && f.id === me.id;
  const cp = me && !isMe ? compat(me, f) : null;
  const pend = me && D.props.find(p => p.status === 'pending' && ((p.from === me.id && p.to === f.id) || (p.to === me.id && p.from === f.id)));
  let act = '';
  if (isMe) act = `<button class="btn line block" data-a="profile">ویرایش پروفایل</button>`;
  else if (sameTeam) act = `<button class="btn ac block" data-a="navfam" data-f="${f.id}">${ic('pin')}مسیر تا خانه‌شان</button>`;
  else if (pend) act = pend.to === me.id ? `<button class="btn ac block" data-a="accept" data-p="${pend.id}">پذیرفتن پیشنهادشان</button>` : `<button class="btn line block" disabled>پیشنهاد فرستاده شد؛ منتظر پاسخ</button>`;
  else if (t && mt) act = `<p class="muted small">هر دو در تیم هستید. برای جابه‌جایی، اول از تیم خودتان جدا شوید.</p>`;
  else if (t) act = `<button class="btn ac block" data-a="propose" data-f="${f.id}">درخواست پیوستن به ${esc(tName(t))}</button>`;
  else if (mt) act = `<button class="btn ac block" data-a="propose" data-f="${f.id}">دعوت به ${esc(tName(mt))}</button>`;
  else act = `<button class="btn ac block" data-a="propose" data-f="${f.id}">پیشنهاد هم‌تیمی</button>`;
  const phone = f.phoneShow ? `<div class="row between card" style="padding:12px 14px"><span><span class="muted small">شماره</span><br><b class="num" dir="ltr">${f.phone ? esc(fa(f.phone)) : f.phoneMask}</b></span>${callBtn(f)}</div>` : '<p class="muted small">شماره‌شان را فقط هم‌تیمی‌ها می‌بینند.</p>';
  sheet(esc(fName(f)) + (isMe ? ' (شما)' : ''), `
    <div class="row wrap"><span class="tag">${ic(f.pg === 'f' ? 'woman' : 'man')}${f.pg === 'f' ? 'مادر' : 'پدر'}</span>
      ${canDrive(f) ? `<span class="tag">${ic('wheel')}رانندگی${f.days.length ? ': ' + f.days.map(d => DAYS[d]).join('، ') : ''} · ${fa(f.seats)} صندلی</span>` : ''}${canPay(f) ? `<span class="tag">${ic('coin')}مشارکت مالی</span>` : ''}
      <span class="tag">${kidsWord(f)}${sameTeam || isMe ? ': ' + f.kids.map(k => esc(k.first)).join('، ') : ''}</span>${t ? `<span class="tag" style="background:${col.c};color:${col.i};border-color:${col.c}">${esc(tName(t))}</span>` : '<span class="tag">بی‌تیم</span>'}</div>
    ${f.values.length ? `<div><span class="lbl">برای‌شان مهم است</span><div class="row wrap" style="margin-top:6px">${f.values.map(v => `<span class="tag">${VALUES[v]}</span>`).join('')}</div></div>` : ''}
    ${cp ? `<div class="card stack" style="padding:14px"><div class="row between"><b>هم‌خوانی با شما</b><span class="score">${fa(cp.score)}٪</span></div><ul class="reason">${cp.reasons.map(([x, ok]) => `<li class="${ok ? '' : 'x'}">${esc(x)}</li>`).join('')}</ul></div>` : ''}
    ${isMe ? '' : phone}${act}`, `${esc(f.hood)}${me && !isMe ? ' · ' + km1(km(me, f)) + ' کیلومتر از شما' : ''} · ${km1(km(school(f.sid), f))} کیلومتر تا ${KINDS[school(f.sid).kind][0]}`);
}
function inbox() {
  const me = ctx().me; if (!me) return;
  const inc = D.props.filter(p => p.to === me.id && p.status === 'pending');
  D.notes.forEach(n => n.read = true); save();
  sheet('پیام‌ها و پیشنهادها', `${inc.map(p => { const f = fam(p.from); return `<div class="card stack" style="padding:14px"><b>${esc(fName(f))} پیشنهاد هم‌تیمی داده‌اند</b><span class="muted small">${esc(f.hood)} · ${km1(km(me, f))} کیلومتر · هم‌خوانی ${fa(compat(me, f).score)}٪</span><div class="row"><button class="btn ac sm grow" data-a="accept" data-p="${p.id}">پذیرفتن</button><button class="btn line sm grow" data-a="decline" data-p="${p.id}">فعلاً نه</button><button class="btn line sm" data-a="fam" data-f="${f.id}">جزئیات</button></div></div>`; }).join('')}
    ${D.notes.slice(0, 12).map(n => `<div class="row" style="padding:6px 0;border-bottom:1px dashed var(--line)">${ic('bell')}<span class="grow small">${esc(n.text)}</span></div>`).join('') || (inc.length ? '' : '<p class="muted">فعلاً پیامی نیست. وقتی خانواده‌ی تازه‌ای ثبت‌نام کند یا پیشنهادی برسد، اینجا می‌بینید.</p>')}
    <button class="btn line sm" data-a="notifyon">${ic('bell')}${D.notify ? 'نوتیف روشن است' : 'روشن کردن نوتیف'}</button>`);
  render();
}
function drawer() {
  const c = ctx(), me = c.me, t = me && team(me.team);
  lastFocus = document.activeElement;
  const mi = (a, i, txt, extra = '') => `<button class="mi" data-a="${a}" ${extra}>${ic(i)}<span class="grow">${txt}</span></button>`;
  $('#layer').innerHTML = `<div class="scrim" data-a="close"></div><nav class="drawer" aria-label="منوی کناری" tabindex="-1">
    <div class="row" style="padding:6px 8px 12px"><img src="assets/icon.svg" width="40" height="40" style="border-radius:12px" alt=""><span class="grow"><b>${me ? esc(fName(me)) : 'رسیدیم'}</b><br><span class="muted small">${c.s ? esc(c.s.name) : 'سرویس مشارکتی والدین'}</span></span><button class="icon-btn" data-a="close" aria-label="بستن">${ic('close')}</button></div>
    ${me ? mi('profile', 'user', 'پروفایل خانواده') + mi('inbox', 'bell', 'پیام‌ها و پیشنهادها') + (t ? mi('tabteam', 'team', esc(tName(t))) + mi('leave', 'leave', 'جدا شدن از تیم') : '') : ''}
    ${c.s ? mi('poster', 'print', 'لینک و پوستر ' + KINDS[c.s.kind][0]) : ''}
    ${mi('notifyon', 'bell', D.notify ? 'نوتیف: روشن' : 'نوتیف: خاموش — روشنش کنید')}
    ${mi('radio', 'radio', 'رادیو رسیدیم')}
    ${mi('ticket', 'ticket', 'پشتیبانی و تیکت')}
    <div class="sep"></div>
    ${mi('newschool', 'school', 'ثبت مدرسه یا محل کار تازه')}
    ${mi('home', 'map', 'همه‌ی مدرسه‌ها')}
    ${mi('theme', 'moon', 'حالت شب و روز')}
    ${mi('about', 'heart', 'درباره و حریم خصوصی')}
    <div class="sep"></div>
    <button class="link" data-a="reset" style="align-self:flex-start">بازنشانی داده‌های نمونه</button>
    <p class="muted small" style="padding:4px 8px">نسخه ۰۵ · داده‌ها روی همین دستگاه؛ ${fa(D.outbox.length)} تغییر در صف همگام‌سازی.</p></nav>`;
  $('.drawer').focus();
}
function profileSheet() {
  const me = ctx().me, s = school(me.sid);
  const row = (k, label, val) => `<button class="fam" data-a="edit" data-k="${k}"><span class="grow"><span class="muted small">${label}</span><br><b>${val}</b></span><span class="tag">ویرایش</span></button>`;
  sheet('پروفایل خانواده', `
    ${row('family', 'نام خانوادگی و والد', esc(fName(me)) + ' · ' + (me.pg === 'f' ? 'مادر' : 'پدر'))}
    ${row('kids', s.kind === 'school' ? 'فرزندان' : 'هم‌سفر', me.kids.map(k => esc(kidName(k, me))).join('، '))}
    ${row('home', 'محل سکونت', esc(me.hood) + ' · ' + km1(km(s, me)) + ' کیلومتر')}
    ${row('needs', 'مسیرها', [me.needs.out && 'رفت', me.needs.back && 'برگشت'].filter(Boolean).join(' و '))}
    ${row('role', 'سهم شما', { drive: 'رانندگی', pay: 'فقط هزینه', both: 'رانندگی و هزینه' }[me.role] + (canDrive(me) ? ' · ' + me.days.map(d => DAYS[d]).join('، ') : ''))}
    ${row('snapp', 'برآورد اسنپ هر مسیر', money(me.snapp))}
    ${row('values', 'ارزش‌ها', me.values.map(v => VALUES[v]).join('، ') || 'ثبت نشده')}
    ${row('phone', 'شماره همراه', me.phone ? fa(me.phone) + (me.phoneShow ? ' · قابل مشاهده' : ' · پنهان') : 'نمونه')}
    <p class="muted small">حذف حساب در نسخه حساب‌دار از پشتیبانی انجام می‌شود؛ اینجا فقط پیوستن به تیم و جدا شدن معنا دارد.</p>`, esc(s.name));
}
function posterSheet() {
  const s = ctx().s; if (!s) return;
  let qr = '';
  try { const q = qrcode(0, 'M'); q.addData(encodeURI(linkOf(s))); q.make(); qr = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); } catch (e) { qr = '<p>QR در دسترس نیست</p>'; }
  sheet('پوستر رسمی و لینک', `<div class="poster" id="poster"><div class="ph"><b>سرویس مشارکتی!</b><h2>مامان، بابا، رسیدیم!</h2><span>اپ رفت‌وآمد مشارکتی والدین برای فرزندان دلبندشان</span></div>
      <h3 style="font-size:1.25rem">${esc(s.name)} · ${esc(s.shift)}</h3><div class="qr">${qr}</div>
      <p>برای پیوستن، QR را اسکن کنید یا وارد این لینک شوید:</p><p class="url">${esc(prettyLink(s))}</p>
      <ol class="steps3" style="text-align:right"><li>چند سؤال ساده در دو دقیقه</li><li>هم‌مدرسه‌ای‌های نزدیک را روی نقشه ببینید</li><li>تیم شوید؛ نوبتی ببرید، منصفانه حساب کنید</li></ol>
      <b>با رسیدیم همیشه ما زود می‌رسیم!</b></div>
    <div class="row wrap no-print"><button class="btn sm" data-a="print">${ic('print')}چاپ پوستر</button><button class="btn line sm" data-a="share">${ic('share')}فرستادن لینک</button><button class="btn line sm" data-a="copy">کپی لینک</button></div>`, 'برای دیوار مدرسه، گروه کلاس و کانال مدرسه');
}
function slotSheet(t, x) {
  const r = rec(t, x), ex = fam(r.exec), list = cands(t, x, r.exec), me = ctx().me;
  sheet(`${DAYS[x.d]} · ${x.dir === 'out' ? 'رفت' : 'برگشت'} ${clock(x.time)}`, `
    <p>${ex ? `${esc(fName(ex))} می‌برند.` : 'هنوز راننده ندارد.'}${ex && !ex.days.includes(x.d) ? ' (این روز را اعلام نکرده بودند)' : ''}</p>
    ${r.status === 'pending' ? `<span class="lbl">چه کسی می‌تواند ببرد؟ (با رعایت ترجیحات و ظرفیت)</span>${list.map(c => `<button class="fam" data-a="swapto" data-s="${x.id}" data-f="${c.f.id}"><span class="av" style="--pc:var(--ac);--pi:var(--ac-ink)">${esc(c.f.family[0])}</span><span class="grow"><b>${esc(fName(c.f))}${c.f.id === me.id ? ' (خودم)' : ''}</b><br><span class="muted small">${c.on ? 'این روز را اعلام کرده‌اند' : 'روز اعلام‌شده‌شان نیست'} · ${fa(c.n)} نوبت دیگر در هفته</span></span><span class="tag ac">${c.f.id === me.id ? 'می‌برم' : 'درخواست'}</span></button>`).join('') || '<p class="muted">راننده‌ی سازگار دیگری در تیم نیست. یک خانواده‌ی راننده دعوت کنید.</p>'}` : '<p class="muted">این نوبت شروع یا انجام شده و تغییر نمی‌کند.</p>'}
    <button class="btn line" data-a="openslot" data-s="${x.id}">نمایش در کارت امروز</button>`, r.status === 'pending' ? 'برنامه‌ی اولیه حفظ می‌شود و اعتبار به کسی می‌رسد که واقعاً می‌برد.' : '');
}
function navSheet(label, lat, lng) {
  const q = `${lat},${lng}`;
  sheet('مسیر تا ' + esc(label), `<div class="navs"><a href="geo:${q}?q=${q}(${encodeURIComponent(label)})">مسیریاب گوشی</a><a href="https://neshan.org/maps/@${q},16z,0p" target="_blank" rel="noopener">نشان</a><a href="https://balad.ir/location?latitude=${lat}&longitude=${lng}" target="_blank" rel="noopener">بلد</a><a href="https://www.google.com/maps/dir/?api=1&destination=${q}" target="_blank" rel="noopener">Google Maps</a><a href="https://waze.com/ul?ll=${q}&navigate=yes" target="_blank" rel="noopener">Waze</a></div><p class="muted small">نقطه‌ی دقیق خانه‌ها فقط برای هم‌تیمی‌ها باز می‌شود.</p>`);
}
function ticketSheet() {
  ui.tk = ui.tk || { cat: 'فنی', text: '' };
  sheet('پشتیبانی و تیکت', `<div class="chips">${['فنی','پیشنهاد','گزارش رفتار','حساب و پرداخت','سایر'].map(c => `<button class="chip" data-a="tkcat" data-v="${c}" aria-pressed="${ui.tk.cat === c}">${c}</button>`).join('')}</div>
    <div class="field"><label for="tk">چه شده؟ با جزئیات بنویسید تا زودتر کمک کنیم.</label><textarea id="tk" data-in="tk">${esc(ui.tk.text)}</textarea></div>
    <button class="btn ac" data-a="tksend">ثبت تیکت</button>
    ${D.tickets.length ? `<span class="lbl">تیکت‌های شما</span>${D.tickets.slice().reverse().map(k => `<div class="row between card" style="padding:10px 14px"><span><b>#${fa(k.no)} · ${esc(k.cat)}</b><br><span class="muted small">${esc(k.text.slice(0, 60))}</span></span><span class="tag">${k.status}</span></div>`).join('')}` : ''}
    <p class="muted small">در نسخه آزمایشی، تیکت روی همین دستگاه ثبت می‌شود و پاسخ در همین‌جا نمایش داده خواهد شد.</p>`);
}
async function radioSheet() {
  sheet('رادیو رسیدیم', '<p class="muted">در حال آماده‌سازی…</p>');
  let eps = [];
  try { const r = await fetch('radio.json', { cache: 'no-store' }); eps = (await r.json()).episodes || []; } catch (e) {}
  if (!$('.sheet')) return;
  $('.sheet-b').innerHTML = eps.length ? eps.map(e => `<div class="card stack" style="padding:14px"><b>${esc(e.title)}</b>${e.desc ? `<span class="muted small">${esc(e.desc)}</span>` : ''}<audio controls preload="none" src="${esc(e.src)}" style="width:100%"></audio></div>`).join('')
    : `${artRadio()}<p><b>به‌زودی روی آنتن!</b> اپیزودهای کوتاه و شاد برای مسیر مدرسه: قصه، دانستنی و ادب و مهربانی، چند دقیقه‌ای و بدون موسیقی برای خانواده‌هایی که موسیقی نمی‌خواهند.</p><p class="muted small">اپیزودها از فایل radio.json کنار برنامه خوانده می‌شوند.</p>`;
}
function aboutSheet() {
  sheet('درباره و حریم خصوصی', `<ul class="reason"><li>روی نقشه‌ی مدرسه، موقعیت خانه‌ها تقریبی (حدود ۱۵۰ متر) است؛ نقطه‌ی دقیق فقط برای هم‌تیمی‌ها.</li><li>شماره‌ی شما فقط با اجازه‌ی خودتان و فقط برای خانواده‌های همان مدرسه دیده می‌شود.</li><li>نام فرزندان فقط برای هم‌تیمی‌ها نمایش داده می‌شود؛ بقیه فقط تعداد را می‌بینند.</li><li>تیم‌سازی همیشه رایگان است. هیچ داده‌ی فردی به تبلیغ‌دهنده داده نمی‌شود.</li><li>رسیدیم پول نگه نمی‌دارد؛ تسویه مستقیم بین خانواده‌هاست و فقط ثبت می‌شود.</li></ul>
    <p class="muted small">این نسخه‌ی آزمایشی است: ثبت‌نام‌ها، پاسخ پیشنهادها و نوتیف‌ها شبیه‌سازی می‌شوند و پیامکی ارسال نمی‌شود.</p>`);
}

/* ═════════ wizards ═════════ */
const ART = {
  school: `<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 44 48 22l34 22"/><rect x="22" y="44" width="52" height="34" rx="4"/><rect x="42" y="58" width="12" height="20"/><circle cx="48" cy="34" r="4" fill="#1DBF73"/><path class="bob" d="M76 16v14l10-7Z" fill="#1DBF73"/></svg>`,
  family: `<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="34" cy="28" r="9"/><circle cx="62" cy="28" r="9"/><path d="M18 74c0-12 7-22 16-22s16 10 16 22M46 74c0-12 7-22 16-22s16 10 16 22"/><path class="bob" d="M48 12c2-5 10-5 10 1 0 5-10 10-10 10S38 18 38 13c0-6 8-6 10-1Z" fill="#FF6B8B" stroke-width="2"/></svg>`,
  kids: `<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="34" cy="36" r="9"/><path d="M34 46 24 70h20Z" fill="#FFD84D"/><circle cx="64" cy="40" r="8"/><path d="M64 49l-8 20h16Z" fill="#7FD8FF"/><path class="bob" d="M74 18l3 6 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1Z" fill="#1DBF73" stroke-width="2"/></svg>`,
  home: `<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M16 48 44 24l28 24"/><path d="M24 44v30h40V44"/><rect x="38" y="56" width="12" height="18"/><path class="bob" d="M76 20c-6 0-10 4-10 10 0 8 10 16 10 16s10-8 10-16c0-6-4-10-10-10Z" fill="#1DBF73"/><circle cx="76" cy="30" r="3" fill="#fff"/></svg>`,
  clock: `<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="48" cy="50" r="30"/><path d="M48 32v18l12 8"/><path class="bob" d="M20 20l10 8M76 20l-10 8" stroke="#1DBF73" stroke-width="4"/></svg>`,
  wheel: `<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="40" cy="50" r="26"/><circle cx="40" cy="50" r="6"/><path d="M16 44c8 2 16 2 24 2s16 0 24-2M40 56v20"/><g class="bob"><circle cx="76" cy="26" r="13" fill="#FFD84D"/><path d="M76 19v14M80 22c-1-2-7-2-7 1s7 2 7 5-6 3-7 1" stroke-width="2"/></g></svg>`,
  coin: `<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><rect x="14" y="30" width="58" height="40" rx="8"/><path d="M14 42h58"/><g class="bob"><circle cx="72" cy="66" r="14" fill="#1DBF73"/><path d="M72 58v16" stroke="#fff"/></g></svg>`,
  heart: `<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path class="bob" d="M48 78S18 60 18 38a14 14 0 0 1 30-6 14 14 0 0 1 30 6c0 22-30 40-30 40Z" fill="#FFB3C4"/><path d="M36 44l8 8 16-16"/></svg>`,
  phone: `<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><rect x="30" y="14" width="34" height="66" rx="8"/><path d="M42 70h10"/><g class="bob"><rect x="56" y="18" width="30" height="20" rx="8" fill="#1DBF73"/><path d="M63 28h2M70 28h2M77 28h2" stroke="#fff"/></g></svg>`,
  party: `<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:130px;height:130px"><path d="M18 80 34 30l32 32Z" fill="#FFD84D"/><path d="M26 56l14 14M30 44l22 22"/><g class="bob"><path d="M62 18l2 6M78 26l-5 4M82 44h-6M56 34c4-6 10-6 12-2" stroke="#1DBF73" stroke-width="4"/><circle cx="70" cy="14" r="3" fill="#FF6B8B" stroke="none"/><circle cx="86" cy="34" r="3" fill="#4F8CFF" stroke="none"/></g></svg>`
};
function artCar(cls) { return `<svg class="${cls}" viewBox="0 0 200 110" fill="none" stroke="#04140B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 80V62c0-5 3-8 8-9l14-3 12-18c2-3 5-5 9-5h44c4 0 8 2 10 6l11 17 10 2c5 1 8 5 8 10v18Z" fill="#fff"/><path d="M52 50l10-15c1-2 3-2 4-2h16v17ZM90 33h12c2 0 4 1 5 3l9 14H90Z" fill="#BFF3D8"/><circle cx="52" cy="84" r="11" fill="#04140B"/><circle cx="128" cy="84" r="11" fill="#04140B"/><path d="M10 96h180"/></svg>`; }
function artTeam() { return `<svg width="120" height="90" viewBox="0 0 120 90" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" class="draw"><circle cx="30" cy="30" r="10"/><circle cx="60" cy="24" r="10"/><circle cx="90" cy="30" r="10"/><path d="M14 74c0-12 7-22 16-22s16 10 16 22M44 70c0-12 7-24 16-24s16 12 16 24M74 74c0-12 7-22 16-22s16 10 16 22"/><path class="bob" d="M50 6l3 5 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1Z" fill="var(--ac)" stroke-width="2"/></svg>`; }
function artRadio() { return `<svg width="110" height="90" viewBox="0 0 110 90" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" class="draw"><rect x="14" y="30" width="82" height="50" rx="10"/><path d="M30 30 76 8"/><circle cx="72" cy="55" r="12" fill="var(--ac)"/><path d="M28 48h18M28 58h18M28 68h12"/><path class="bob" d="M90 14c4 3 4 9 0 12M96 10c7 5 7 15 0 20" stroke="var(--ac)"/></svg>`; }

const JOIN = [
  { key: 'confirm', art: 'school', q: w => `فرزندتان در «${esc(w.s.name)}» درس می‌خواند؟`, help: w => `${esc(w.s.city)} · ${esc(w.s.shift)} · ورود ${clock(w.s.in)} · تعطیلی ${clock(w.s.out)}`,
    body: w => `<div class="choices"><button class="choice" data-a="wset" data-k="ok" data-v="1" aria-pressed="${w.d.ok === 1}">بله، همین‌جاست ${ic('check')}</button><button class="choice" data-a="wnot">نه، مدرسه‌ی دیگری است</button></div>`, ok: w => w.d.ok === 1 || 'اگر همین مدرسه است، «بله» را بزنید.' },
  { key: 'family', art: 'family', q: () => 'فامیل شریف‌تان؟', help: () => 'روی نقشه با نام خانوادگی دیده می‌شوید؛ مثل «خانواده آسمان». نام کوچک والدین لازم نیست.',
    body: w => `<div class="field"><label for="w-fam">نام خانوادگی</label><input id="w-fam" data-w="family" value="${esc(w.d.family || '')}" placeholder="مثلاً آسمان" autocomplete="family-name"></div><span class="lbl">شما مادر هستید یا پدر؟</span><div class="choices two"><button class="choice col" data-a="wset" data-k="pg" data-v="f" aria-pressed="${w.d.pg === 'f'}">${ic('woman', 'emo')}مادر</button><button class="choice col" data-a="wset" data-k="pg" data-v="m" aria-pressed="${w.d.pg === 'm'}">${ic('man', 'emo')}پدر</button></div>`,
    ok: w => (w.d.family || '').trim().length > 1 ? (w.d.pg ? true : 'مادر یا پدر را انتخاب کنید.') : 'نام خانوادگی را بنویسید.' },
  { key: 'count', art: 'kids', q: w => `چند فرزندتان در این ${KINDS[w.s.kind][0]} درس می‌خوانند؟`, help: () => 'خواهر و برادرهایی که با هم می‌روند را حساب کنید.',
    body: w => `<div class="stepper"><button class="btn line" data-a="wstep" data-v="-1" aria-label="کمتر">−</button><output>${fa(w.d.count || 1)}</output><button class="btn line" data-a="wstep" data-v="1" aria-label="بیشتر">+</button></div>`, ok: () => true },
  { key: 'kids', art: 'kids', q: w => (w.d.count || 1) > 1 ? 'اسم فرزندان گل‌تان؟' : 'اسم فرزند گل‌تان؟', help: w => `کنار فامیل نوشته می‌شود؛ مثل «ستاره ${esc(w.d.family || 'آسمان')}». فقط هم‌تیمی‌ها نام را می‌بینند.`,
    body: w => Array.from({ length: w.d.count || 1 }, (_, i) => `<div class="field"><label for="w-k${i}">فرزند ${fa(i + 1)}</label><input id="w-k${i}" data-wk="${i}" value="${esc((w.d.kids || [])[i] || '')}" placeholder="نام کوچک"></div>
      ${w.s.gender === 'x' ? `<div class="chips"><button class="chip" data-a="wkg" data-i="${i}" data-v="f" aria-pressed="${(w.d.kg || [])[i] === 'f'}">دختر</button><button class="chip" data-a="wkg" data-i="${i}" data-v="m" aria-pressed="${(w.d.kg || [])[i] === 'm'}">پسر</button></div>` : ''}`).join('') + (w.s.gender !== 'x' ? `<p class="note">${ic('check')}این مدرسه ${w.s.gender === 'f' ? 'دخترانه' : 'پسرانه'} است؛ جنسیت را نمی‌پرسیم.</p>` : ''),
    ok: w => { const n = w.d.count || 1, k = w.d.kids || []; if (Array.from({ length: n }, (_, i) => (k[i] || '').trim()).some(x => !x)) return 'اسم همه را بنویسید.'; if (w.s.gender === 'x' && Array.from({ length: n }, (_, i) => (w.d.kg || [])[i]).some(x => !x)) return 'دختر یا پسر بودن را انتخاب کنید.'; return true; } },
  { key: 'home', art: 'home', q: () => 'کجا زندگی می‌کنید؟', help: () => 'روی نقشه‌ی مدرسه موقعیت شما تقریبی (حدود ۱۵۰ متر) دیده می‌شود. نقطه‌ی دقیق فقط برای هم‌تیمی‌ها.',
    body: w => `<div class="field"><label for="w-hood">نام محله</label><input id="w-hood" data-w="hood" value="${esc(w.d.hood || '')}" placeholder="مثلاً نارون"></div>
      <div class="choices"><button class="choice" data-a="wloc">${ic('pin', 'emo')}<span>ثبت موقعیت فعلی من<small>اگر الان خانه هستید؛ فقط با اجازه‌ی شما</small></span></button>
      ${w.s.demo ? '<button class="choice" data-a="wlocdemo"><span>یک نقطه‌ی نمونه نزدیک مدرسه<small>برای آزمایش این نسخه</small></span></button>' : ''}</div>
      ${w.d.lat ? `<p class="hint">${ic('check')}<span>ثبت شد؛ حدود ${km1(km(w.s, w.d))} کیلومتر تا مدرسه.</span></p>` : ''}`,
    ok: w => !(w.d.hood || '').trim() ? 'نام محله را بنویسید.' : w.d.lat ? true : 'موقعیت را ثبت کنید.' },
  { key: 'needs', art: 'clock', q: () => 'کدام مسیرها را لازم دارید؟', help: w => `ساعت‌ها از مدرسه آمده: ورود ${clock(w.s.in)} و تعطیلی ${clock(w.s.out)}.`,
    body: w => `<div class="choices">${[['both', 'هر دو؛ رفت و برگشت'], ['out', `فقط رفت (${clock(w.s.in)})`], ['back', `فقط برگشت (${clock(w.s.out)})`]].map(([k, v]) => `<button class="choice" data-a="wset" data-k="needs" data-v="${k}" aria-pressed="${(w.d.needs || 'both') === k}">${v}</button>`).join('')}</div>`, ok: () => true },
  { key: 'role', art: 'wheel', q: () => 'سهم شما در سرویس؟', help: () => 'تیمی که راننده نداشته باشد راه نمی‌افتد؛ حتی یک روز در هفته رانندگی، کمک بزرگی است.',
    body: w => `<div class="choices">${[['drive', 'wheel', 'رانندگی می‌کنم', 'روزهایی که بتوانم، بچه‌ها را می‌برم'], ['pay', 'coin', 'فقط هزینه می‌دهم', 'سهم منصفانه‌ی هر سفر را پرداخت می‌کنم'], ['both', 'wheel', 'هر دو', 'گاهی می‌برم، گاهی هزینه می‌دهم']].map(([k, i, t, s]) => `<button class="choice" data-a="wset" data-k="role" data-v="${k}" aria-pressed="${w.d.role === k}">${ic(i, 'emo')}<span>${t}<small>${s}</small></span>${k === 'both' ? ic('coin', 'emo') : ''}</button>`).join('')}</div>
      ${w.d.role && w.d.role !== 'pay' ? `<span class="lbl">کدام روزها می‌توانید ببرید؟</span><div class="chips">${w.s.days.map(d => `<button class="chip" data-a="wday" data-v="${d}" aria-pressed="${(w.d.days || []).includes(d)}">${DAYS[d]}</button>`).join('')}</div>
      <span class="lbl">چند صندلی برای بچه‌ها دارید؟</span><div class="stepper"><button class="btn line" data-a="wseats" data-v="-1" aria-label="کمتر">−</button><output>${fa(w.d.seats || 3)}</output><button class="btn line" data-a="wseats" data-v="1" aria-label="بیشتر">+</button></div>` : ''}`,
    ok: w => !w.d.role ? 'یکی را انتخاب کنید.' : (w.d.role !== 'pay' && !(w.d.days || []).length) ? 'دست‌کم یک روز رانندگی را انتخاب کنید.' : true },
  { key: 'snapp', art: 'coin', q: () => 'یک مسیر با اسنپ حدوداً چقدر می‌شود؟', help: () => 'سهم منصفانه‌ی هر سفر، حدود ۶۰٪ میانگین برآورد اعضای تیم پیشنهاد می‌شود: جبران زحمت راننده، و ارزان‌تر از اسنپ برای بقیه.',
    body: w => { const est = w.d.lat ? Math.round((45000 + 18000 * km(w.s, w.d)) / 5000) * 5000 : 90000; if (!w.d.snapp) w.d.snapp = est; return `<div class="field"><label for="w-snapp">مبلغ به تومان</label><input id="w-snapp" data-w="snapp" inputmode="numeric" value="${fa(w.d.snapp)}"></div><p class="note">${ic('spark')}برآورد ما از روی فاصله: حدود ${money(est)}</p>`; },
    ok: w => +en(w.d.snapp) >= 10000 || 'یک عدد تقریبی بنویسید؛ مثلاً ۹۰٬۰۰۰.' },
  { key: 'values', art: 'heart', q: () => 'چه چیزهایی برایتان مهم است؟', help: () => 'این‌ها محترم‌اند و دلیل نمی‌خواهند. در پیشنهاد هم‌تیمی و یادآوری به راننده رعایت می‌شوند. اختیاری است.',
    body: w => `<div class="chips">${Object.entries(VALUES).map(([k, v]) => `<button class="chip" data-a="wval" data-v="${k}" aria-pressed="${(w.d.values || []).includes(k)}">${v}</button>`).join('')}</div>`, ok: () => true },
  { key: 'phone', art: 'phone', q: () => 'شماره همراه‌تان؟', help: () => 'برای ورود، کد تأیید پیامک می‌شود. در نسخه آزمایشی پیامکی ارسال نمی‌شود.',
    body: w => `<div class="field"><label for="w-ph">شماره همراه</label><input id="w-ph" data-w="phone" type="tel" inputmode="tel" dir="ltr" value="${esc(w.d.phone || '')}" placeholder="۰۹۱۲ ۰۰۰ ۰۰ ۰۰" autocomplete="tel"></div>
      <label class="check" style="background:transparent"><input type="checkbox" data-a="wshow" ${w.d.show !== false ? 'checked' : ''}>شماره‌ام به خانواده‌های همین مدرسه نشان داده شود</label>`,
    ok: w => /^09\d{9}$/.test(en(w.d.phone || '').replace(/\D/g, '')) || 'شماره را به شکل ۰۹۱۲۳۴۵۶۷۸۹ بنویسید.' }
];
const SCHOOL = [
  { key: 'kind', art: 'school', q: () => 'چه جایی را ثبت می‌کنید؟', help: () => 'بعد از ثبت، «لینک رسیدیم» و پوستر رسمی آماده می‌شود تا بقیه بیایند.',
    body: w => `<div class="choices">${[['school', 'مدرسه', 'والدین برای فرزندان'], ['work', 'محل کار', 'همکارانی که با هم می‌روند'], ['uni', 'دانشگاه', 'هم‌دانشگاهی‌ها']].map(([k, t, s]) => `<button class="choice" data-a="wset" data-k="kind" data-v="${k}" aria-pressed="${w.d.kind === k}"><span>${t}<small>${s}</small></span></button>`).join('')}</div>`, ok: w => !!w.d.kind || 'یکی را انتخاب کنید.' },
  { key: 'name', art: 'school', q: w => `نام ${KINDS[w.d.kind || 'school'][0]} و شهر؟`, help: () => 'نام را همان‌طور بنویسید که خانواده‌ها می‌شناسند.',
    body: w => `<div class="field"><label for="w-city">شهر</label><select id="w-city" data-w="cs">${CITIES.map(([k, v]) => `<option value="${k}" ${w.d.cs === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="field"><label for="w-sn">نام</label><input id="w-sn" data-w="name" value="${esc(w.d.name || '')}" placeholder="مثلاً دبستان دخترانه مهر"></div>
      ${(w.d.kind || 'school') === 'school' ? `<span class="lbl">مدرسه</span><div class="chips">${[['f', 'دخترانه'], ['m', 'پسرانه'], ['x', 'مختلط']].map(([k, v]) => `<button class="chip" data-a="wset" data-k="gender" data-v="${k}" aria-pressed="${w.d.gender === k}">${v}</button>`).join('')}</div>` : ''}
      <span class="lbl">شیفت یا واحد</span><div class="chips">${['شیفت صبح', 'شیفت عصر', 'تمام‌وقت'].map(v => `<button class="chip" data-a="wset" data-k="shift" data-v="${v}" aria-pressed="${w.d.shift === v}">${v}</button>`).join('')}</div>`,
    ok: w => !(w.d.name || '').trim() ? 'نام را بنویسید.' : ((w.d.kind || 'school') === 'school' && !w.d.gender) ? 'دخترانه، پسرانه یا مختلط؟' : !w.d.shift ? 'شیفت را انتخاب کنید.' : true },
  { key: 'loc', art: 'home', q: () => 'کجاست؟', help: () => 'کنار در ورودی موقعیت را ثبت کنید. اگر همین نزدیکی قبلاً ثبت شده باشد، به شما می‌گوییم.',
    body: w => { const dup = w.d.lat ? D.schools.filter(s => km(s, w.d) < 0.25) : []; return `<div class="choices"><button class="choice" data-a="wloc">${ic('pin', 'emo')}<span>ثبت موقعیت فعلی<small>فقط با اجازه‌ی شما</small></span></button><button class="choice" data-a="wlocdup"><span>نقطه‌ی نمونه کنار مدرسه‌ی نمونه<small>برای دیدن تشخیص تکراری</small></span></button></div>
      ${w.d.lat && !dup.length ? `<p class="hint">${ic('check')}<span>موقعیت ثبت شد.</span></p>` : ''}
      ${dup.map(s => `<div class="hint warn">${ic('warn')}<span>احتمالاً «${esc(s.name)} · ${esc(s.shift)}» همین‌جا قبلاً ثبت شده.<br><span class="row wrap" style="margin-top:8px"><button class="btn sm" data-a="wgo" data-s="${s.id}">همین است؛ بروم آنجا</button><button class="btn line sm" data-a="wset" data-k="dupOk" data-v="1">نه، واحد یا شیفت دیگری است</button></span></span></div>`).join('')}`; },
    ok: w => { if (!w.d.lat) return 'موقعیت را ثبت کنید.'; const dup = D.schools.filter(s => km(s, w.d) < 0.25); if (dup.length && !w.d.dupOk) return 'بگویید همین است یا واحد دیگری.'; if (dup.some(s => s.shift === w.d.shift && s.name === (w.d.name || '').trim())) return 'همین نام و شیفت ثبت شده؛ شیفت دیگری انتخاب کنید.'; return true; } },
  { key: 'time', art: 'clock', q: () => 'ساعت‌ها و روزها؟', help: () => 'خانواده‌ها این ساعت‌ها را پیش‌فرض می‌بینند.',
    body: w => `<div class="row"><div class="field grow"><label for="w-in">ورود</label><input id="w-in" type="time" data-w="in" value="${w.d.in || '07:30'}"></div><div class="field grow"><label for="w-out">تعطیلی</label><input id="w-out" type="time" data-w="out" value="${w.d.out || '13:15'}"></div></div>
      <div class="chips">${DAYS.map((d, i) => `<button class="chip" data-a="wsday" data-v="${i}" aria-pressed="${(w.d.days || [0,1,2,3,4]).includes(i)}">${d}</button>`).join('')}</div>`, ok: w => (w.d.days || [0,1,2,3,4]).length ? true : 'دست‌کم یک روز.' }
];
function wizOpen(type, s, startKey, edit) {
  const me = s && mine(s.id);
  const d = edit && me ? { ok: 1, family: me.family, pg: me.pg, count: me.kids.length, kids: me.kids.map(k => k.first), kg: me.kids.map(k => k.g), hood: me.hood, lat: me.lat, lng: me.lng, needs: me.needs.out && me.needs.back ? 'both' : me.needs.out ? 'out' : 'back', role: me.role, days: me.days.slice(), seats: me.seats || 3, snapp: me.snapp, values: me.values.slice(), phone: me.phone || '', show: me.phoneShow } : { cs: 'tehran', days: undefined };
  const steps = type === 'join' ? JOIN : SCHOOL;
  ui.wiz = { type, s, d, step: Math.max(0, steps.findIndex(x => x.key === startKey)), edit: !!edit, err: '', done: false };
  closeLayer(); wizRender();
}
function dsSel(el) {
  if (el.id) return '#' + el.id;
  return ['a','k','v','i'].filter(k => el.dataset[k] != null).map(k => `[data-${k}="${el.dataset[k]}"]`).join('') || null;
}
function wizRender() {
  const w = ui.wiz; if (!w) { $('#wiz-root').innerHTML = ''; return; }
  const steps = w.type === 'join' ? JOIN : SCHOOL, st = steps[w.step], total = steps.length;
  const ae = document.activeElement, root = $('#wiz-root');
  const prevSel = ae && root.contains(ae) ? dsSel(ae) : null, prevScroll = $('.wiz-body')?.scrollTop || 0, same = w._shown === w.step && !w.done;
  w._shown = w.step;
  if (w.done) { $('#wiz-root').innerHTML = wizDone(w); return; }
  const pct = Math.round(((w.step) / total) * 100);
  $('#wiz-root').innerHTML = `<div class="wiz ${same ? '' : 'enter'}" role="dialog" aria-modal="true" aria-labelledby="wq">
    <div class="wiz-top"><button class="icon-btn" data-a="wclose" aria-label="بستن">${ic('close')}</button><div class="prog" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${w.step + 1}" aria-label="پیشرفت"><i style="width:${Math.max(6, pct)}%"></i></div><span class="wiz-count">${w.edit ? 'ویرایش' : `گام ${fa(w.step + 1)} از ${fa(total)}`}</span></div>
    <div class="wiz-body">${ART[st.art]}<h1 class="wiz-q" id="wq">${st.q(w)}</h1><p class="wiz-help">${st.help(w)}</p>${st.body(w)}<p class="err" role="alert">${esc(w.err)}</p></div>
    <div class="wiz-foot"><button class="btn block" data-a="wnext">${w.edit ? 'ذخیره' : w.step === total - 1 ? (w.type === 'join' ? 'تمام؛ بپیوندم' : 'ثبت و ساخت لینک') : 'ادامه'}</button>${w.step > 0 && !w.edit ? `<button class="btn line block" data-a="wprev">قبلی</button>` : ''}</div></div>`;
  if (same) { $('.wiz-body').scrollTop = prevScroll; const n = prevSel && root.querySelector(prevSel); if (n) { n.focus({ preventScroll: true }); return; } }
  if (!same) ($('#wiz-root input') || $('#wiz-root .wiz-body .choice') || $('#wiz-root [data-a="wnext"]')).focus({ preventScroll: true });
}
function wizDone(w) {
  if (w.type === 'join') return `<div class="wiz" role="dialog" aria-modal="true" aria-labelledby="wq"><div class="wiz-body" style="text-align:center;justify-items:center;align-content:center;flex:1">${ART.party}
    <h1 class="wiz-q" id="wq">تمام! خوش آمدید، خانواده ${esc(w.d.family)}</h1>
    <p class="wiz-help">صبر کنیم بقیه هم فرم‌شان را پر کنند تا به هم وصل‌تان کنیم. نقشه‌ی مدرسه را گاهی سر بزنید؛ خانواده‌ها آنجا دیده می‌شوند. روی هرکدام بزنید و پیشنهاد هم‌تیمی بدهید.</p>
    <button class="btn line" data-a="notifyon">${ic('bell')}${D.notify ? 'نوتیف روشن است ✓' : 'نوتیف را روشن کن تا خبرت کنیم'}</button></div>
    <div class="wiz-foot"><button class="btn block" data-a="wfinish">برو به نقشه‌ی مدرسه</button></div></div>`;
  const s = w.created;
  return `<div class="wiz" role="dialog" aria-modal="true" aria-labelledby="wq"><div class="wiz-body" style="text-align:center;justify-items:center;align-content:center;flex:1">${ART.party}
    <h1 class="wiz-q" id="wq">«${esc(s.name)}» ثبت شد!</h1><p class="wiz-help">لینک رسیدیمِ ${KINDS[s.kind][0]} آماده است. در گروه‌ها بفرستید یا پوستر را چاپ کنید و روی دیوار بزنید.</p>
    <p class="url" dir="ltr" style="font-weight:900;word-break:break-all">${esc(prettyLink(s))}</p></div>
    <div class="wiz-foot"><button class="btn block" data-a="wjoinnew">خودم هم ثبت‌نام کنم</button><button class="btn line block" data-a="wposter">پوستر و لینک</button></div></div>`;
}
function wizNext() {
  const w = ui.wiz, steps = w.type === 'join' ? JOIN : SCHOOL, st = steps[w.step];
  const ok = st.ok(w); if (ok !== true) { w.err = ok; return wizRender(); }
  w.err = '';
  if (w.edit) { applyJoin(w, true); ui.wiz = null; wizRender(); render(); toast('ذخیره شد.'); return profileSheet(); }
  if (w.step < steps.length - 1) { w.step++; return wizRender(); }
  if (w.type === 'join') { applyJoin(w, false); w.done = true; return wizRender(); }
  const d = w.d, cityName = CITIES.find(c => c[0] === (d.cs || 'tehran'))[1];
  const s = { id: 's' + uid(), kind: d.kind || 'school', cs: d.cs || 'tehran', city: cityName, name: d.name.trim(), shift: d.shift, gender: d.gender || 'x', lat: d.lat, lng: d.lng, in: d.in || '07:30', out: d.out || '13:15', days: (d.days || [0,1,2,3,4]).slice().sort() };
  s.slug = slugify(s.name + (D.schools.some(x => x.cs === s.cs && x.slug === slugify(s.name)) ? '-' + s.shift : ''));
  D.schools.push(s); save('school.create'); w.created = s; w.done = true; wizRender();
}
function applyJoin(w, edit) {
  const d = w.d, s = w.s, n = d.count || 1;
  const kids = Array.from({ length: n }, (_, i) => ({ id: 'k' + uid(), first: d.kids[i].trim(), g: s.gender === 'x' ? d.kg[i] : s.gender === 'm' ? 'm' : 'f' }));
  const data = { family: d.family.trim(), pg: d.pg, kids, hood: d.hood.trim(), lat: d.lat, lng: d.lng, role: d.role, days: d.role === 'pay' ? [] : (d.days || []).slice().sort(), seats: d.role === 'pay' ? 0 : (d.seats || 3),
    needs: { out: (d.needs || 'both') !== 'back', back: (d.needs || 'both') !== 'out' }, snapp: +en(d.snapp) || 90000, values: d.values || [], phone: en(d.phone || '').replace(/\D/g, '') || null, phoneShow: d.show !== false };
  if (edit) {
    const me = mine(s.id), old = me.kids;
    data.kids = kids.map((k, i) => old[i] ? { ...k, id: old[i].id } : k);
    Object.assign(me, data);
    const t = team(me.team); if (t) { t.price = fairPrice(D, t); replan(t, false); }
    save('profile.update'); return;
  }
  const f = { id: 'f' + uid(), sid: s.id, ...data, team: null, at: Date.now() };
  D.fams.push(f); D.me[s.id] = f.id; save('family.join');
  note(`به «${s.name}» خوش آمدید! ${fa(famsOf(s.id).length - 1)} خانواده‌ی دیگر اینجا هستند.`);
  D.sim[f.id] = { t0: Date.now() }; save();
}

/* ═════════ demo simulation (honest: labeled as simulated) ═════════ */
function simTick() {
  const c = ctx(); if (!c.me || !c.s.demo) return;
  const st = D.sim[c.me.id] || (D.sim[c.me.id] = { t0: Date.now() });
  const age = Date.now() - st.t0;
  if (!st.newFam && age > 15000) {
    st.newFam = true;
    const s = c.s, f = { id: 'f' + uid(), sid: s.id, family: 'شبنم', pg: 'f', kids: [{ id: 'k' + uid(), first: 'آیدا', g: s.gender === 'm' ? 'm' : 'f' }], role: 'both', days: [0, 4], seats: 3, hood: c.me.hood || 'نارون',
      lat: +(c.me.lat + 0.004).toFixed(5), lng: +(c.me.lng - 0.005).toFixed(5), snapp: 95000, values: [], team: null, needs: { out: true, back: true }, phone: null, phoneMask: '۰۹۱۹ ••• ۷۷ ۱۰', phoneShow: true, demo: true, at: Date.now() };
    D.fams.push(f);
    note(`خانواده‌ی تازه‌ای در ${km1(km(c.me, f))} کیلومتری شما ثبت‌نام کرد: ${fName(f)} (شبیه‌سازی)`, true);
    save(); if (!ui.wiz) render();
  }
  if (!st.inProp && age > 32000 && !c.me.team) {
    st.inProp = true;
    const f = famsOf(c.s.id).filter(x => x.id !== c.me.id && !x.team && canDrive(x)).sort((a, b) => km(c.me, a) - km(c.me, b))[0];
    if (f && propose(f, c.me)) { note(`${fName(f)} به شما پیشنهاد هم‌تیمی داده‌اند (شبیه‌سازی)`, true); save(); if (!ui.wiz) render(); }
  }
}

/* ═════════ notifications / toast ═════════ */
async function notify(title, body) {
  try {
    if (D.notify && 'Notification' in window && Notification.permission === 'granted') {
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) reg.showNotification(title, { body, icon: 'assets/icon-192.png', lang: 'fa', dir: 'rtl' });
    }
  } catch (e) {}
}
let tt;
function toast(m) { const el = $('#toast'); el.textContent = m; el.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 3800); }

/* ═════════ actions ═════════ */
function act(a, el) {
  const c = ctx(), me = c.me, t = me && team(me.team), x = t && focusSlot(t);
  const w = ui.wiz;
  switch (a) {
    case 'close': return closeLayer();
    case 'menu': return drawer();
    case 'inbox': closeLayer(); return inbox();
    case 'home': closeLayer(); ui.home = true; history.pushState(null, '', BASE); ui.tab = 'map'; return render(true);
    case 'findschool': { const q = $('#q'); q && q.focus(); return q && q.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    case 'open': closeLayer(); go(school(el.dataset.s)); return;
    case 'newschool': closeLayer(); return wizOpen('school', null);
    case 'join': return wizOpen('join', c.s);
    case 'demo': { const f = famsOf(c.s.id).find(x => x.id === 'f1') || famsOf(c.s.id)[0]; D.me[c.s.id] = f.id; D.sim[f.id] = { t0: Date.now() - 10000 }; save(); ui.tab = 'map'; render(true); return toast(`شما الان ${fName(f)} هستید (نمونه).`); }
    case 'view': ui.view = el.dataset.v; return render();
    case 'filter': ui.filter = el.dataset.v; return render();
    case 'fam': return famSheet(fam(el.dataset.f));
    case 'navschool': return navSheet(c.s.name, c.s.lat, c.s.lng);
    case 'navfam': { const f = fam(el.dataset.f); return navSheet(fName(f), f.lat, f.lng); }
    case 'propose': {
      const f = fam(el.dataset.f), p = propose(me, f); closeLayer();
      if (!p) return toast('قبلاً پیشنهاد داده‌اید.');
      save('proposal.send'); render(); toast(`پیشنهاد برای ${fName(f)} فرستاده شد…`);
      setTimeout(() => { const tm = accept(p); save('proposal.accepted'); if (tm) { note(`${fName(f)} پذیرفتند! ${tName(tm)} (شبیه‌سازی)`, true); toast(`${fName(f)} پذیرفتند! ${tName(tm)}`); } render(); }, 1500);
      return;
    }
    case 'smart': {
      const sm = smartTeam(me); if (!sm) return toast('فعلاً پیشنهادی نداریم.');
      sm.fams.forEach(f => propose(me, f)); save('proposal.smart'); render(); toast(`پیشنهاد برای ${fa(sm.fams.length)} خانواده فرستاده شد…`);
      setTimeout(() => { D.props.filter(p => p.from === me.id && p.status === 'pending').forEach(p => accept(p)); const tm = team(me.team); save('proposal.accepted'); if (tm) { note(`${tName(tm)} تشکیل شد! (شبیه‌سازی)`, true); toast(`${tName(tm)} تشکیل شد! رنگ تیم شما: ${tColor(tm).n}`); } ui.tab = 'team'; render(true); }, 1600);
      return;
    }
    case 'accept': { const p = D.props.find(z => z.id === el.dataset.p); const tm = p && accept(p); save('proposal.accept'); closeLayer(); render(); return toast(tm ? `خوش آمدید به ${tName(tm)}!` : 'این پیشنهاد دیگر معتبر نیست.'); }
    case 'decline': { const p = D.props.find(z => z.id === el.dataset.p); if (p) p.status = 'declined'; save('proposal.decline'); closeLayer(); render(); return toast('با احترام رد شد؛ پیامی تند فرستاده نمی‌شود.'); }
    case 'leave': {
      closeLayer();
      return sheet('جدا شدن از تیم؟', `<p>از ${esc(tName(t))} جدا می‌شوید. سابقه‌ی سفرها و حساب‌ها پاک نمی‌شود و تسویه‌ها سر جایشان می‌مانند.</p><div class="row"><button class="btn grow" data-a="leaveok">بله، جدا می‌شوم</button><button class="btn line grow" data-a="close">ماندن</button></div>`);
    }
    case 'leaveok': { const r = leaveTeam(me); save('team.leave'); closeLayer(); ui.tab = 'map'; render(true); return toast(r === 'closed' ? 'تیم بسته شد. روی نقشه دوباره هم‌تیمی پیدا کنید.' : 'از تیم جدا شدید.'); }
    case 'tabteam': closeLayer(); ui.tab = 'team'; return render(true);
    case 'profile': closeLayer(); return profileSheet();
    case 'edit': closeLayer(); return wizOpen('join', c.s, el.dataset.k, true);
    case 'poster': closeLayer(); return posterSheet();
    case 'print': return window.print();
    case 'share': case 'copy': {
      const url = encodeURI(linkOf(c.s)), text = `لینک رسیدیمِ ${c.s.name}: سرویس مشارکتی والدین. ثبت‌نام در دو دقیقه 👇`;
      if (a === 'share' && navigator.share) return navigator.share({ title: 'رسیدیم', text, url }).catch(() => {});
      navigator.clipboard?.writeText(text + '\n' + url).then(() => toast('لینک کپی شد؛ در گروه مدرسه بفرستید.'), () => toast(url));
      return;
    }
    case 'notifyon': {
      if (!('Notification' in window)) { D.notify = true; save(); return toast('این مرورگر نوتیف ندارد؛ خبرها در صندوق پیام‌ها می‌آید.'); }
      Notification.requestPermission().then(p => { D.notify = p === 'granted'; save(); toast(D.notify ? 'نوتیف روشن شد؛ ثبت‌نام تازه و پیشنهادها را خبر می‌دهیم.' : 'نوتیف روشن نشد؛ خبرها در صندوق پیام‌ها می‌آید.'); if (ui.wiz) wizRender(); else { closeLayer(); render(); } });
      return;
    }
    case 'radio': closeLayer(); return radioSheet();
    case 'ticket': closeLayer(); return ticketSheet();
    case 'tkcat': ui.tk.cat = el.dataset.v; return ticketSheet();
    case 'tksend': {
      if ((ui.tk.text || '').trim().length < 5) return toast('چند کلمه بیشتر بنویسید.');
      const no = 1024 + D.tickets.length; D.tickets.push({ no, cat: ui.tk.cat, text: ui.tk.text.trim(), at: Date.now(), status: 'ثبت شد' }); ui.tk = null; save('ticket.create');
      ticketSheet(); return toast(`تیکت #${fa(no)} ثبت شد. ممنون که گفتید.`);
    }
    case 'theme': { const d = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = d; D.theme = d; save(); return; }
    case 'about': closeLayer(); return aboutSheet();
    case 'reset': D = seed(); save(); closeLayer(); history.replaceState(null, '', BASE); ui.tab = 'map'; render(true); return toast('داده‌های نمونه بازنشانی شد.');
    case 'demophone': return toast('شماره‌ی نمونه است؛ در نسخه واقعی تماس برقرار می‌شود.');
    /* daily */
    case 'pick': ui.slot = el.dataset.s; return render();
    case 'start': { const r = rec(t, x); if (r.status !== 'pending' || !r.exec) return; tp(t).trips[x.id] = { ...r, status: 'started', arr: {}, empty: false }; ui.slot = x.id; save('trip.start'); render(); return toast('راه افتادید. هر کس رسید، رویش بزنید.'); }
    case 'arrive': {
      const tr = tp(t).trips[x.id]; if (!tr || tr.status !== 'started' || tr.arr[el.dataset.k]) return;
      tr.arr[el.dataset.k] = Date.now(); save('kid.arrive');
      const k = riders(t, x).find(z => z.id === el.dataset.k), f = fam(k.fid);
      notify('رسیدیم!', `${kidName(k, f)} ${x.dir === 'out' ? 'به مدرسه رسید' : 'به خانه رسید'} · با ${fName(fam(tr.exec))}`);
      toast(`${kidName(k, f)} رسید؛ ${fName(f)} خبردار شدند.`); return render();
    }
    case 'empty': { const tr = tp(t).trips[x.id]; if (tr) { tr.empty = el.checked; save(); render(); } return; }
    case 'finish': { const tr = tp(t).trips[x.id], ks = riders(t, x); if (!tr || !tr.empty || !ks.every(k => tr.arr[k.id])) return; tr.status = 'done'; tripEntry(t, x, tr.exec); ui.slot = x.id; save('trip.finish'); return render(); }
    case 'thanks': { const tr = tp(t).trips[x.id]; if (tr && !tr.thanks) { tr.thanks = true; save('trip.thanks'); render(); toast(`تشکر شما به ${fName(fam(tr.exec))} رسید.`); } return; }
    case 'next': ui.slot = null; { const n = focusSlot(t); ui.slot = n && n.id; } return render();
    case 'swap': return slotSheet(t, x);
    case 'slot': return slotSheet(t, slotOf(t, el.dataset.s));
    case 'openslot': closeLayer(); ui.slot = el.dataset.s; return render();
    case 'swapto': {
      const s2 = slotOf(t, el.dataset.s), f = fam(el.dataset.f), r = rec(t, s2); if (r.status !== 'pending') return;
      closeLayer(); tp(t).trips[s2.id] = { ...r, exec: f.id, status: 'pending' }; ui.slot = s2.id; save('trip.swap'); render();
      return toast(f.id === me.id ? 'این نوبت را خودتان می‌برید. ممنون از هم‌دلی‌تان.' : `${fName(f)} پذیرفتند (شبیه‌سازی). هم‌دلی‌شان ثبت شد.`);
    }
    case 'replan': replan(t, false); save('plan.update'); render(); return toast('نوبت‌های آینده منصفانه چیده شد؛ سفرهای انجام‌شده دست نخورد.');
    case 'pay': case 'gift': {
      const sg = settle(t)[+el.dataset.i]; if (!sg) return;
      tp(t).ledger.push({ id: uid(), kind: a, at: Date.now(), text: a === 'pay' ? `${fName(fam(sg.from))} به ${fName(fam(sg.to))} پرداخت کردند` : `${fName(fam(sg.to))} سهم ${fName(fam(sg.from))} را حلال کردند`, d: { [sg.from]: sg.amt, [sg.to]: -sg.amt } });
      save('ledger.' + a); render(); return toast(a === 'pay' ? 'پرداخت ثبت شد. در نسخه واقعی گیرنده دریافت را تأیید می‌کند.' : 'بزرگواری‌تان ثبت شد. حساب‌ها روشن، دل‌ها روشن‌تر.');
    }
    case 'how': return sheet('حساب چطور است؟', `<ol class="steps3"><li>هر سفر ${money(t.price)} است: ۶۰٪ میانگین برآورد اسنپ اعضا.</li><li>کل مبلغ به اعتبار کسی ثبت می‌شود که واقعاً برده است.</li><li>همان مبلغ بین همه‌ی مسافران آن سفر مساوی تقسیم می‌شود؛ فرزند راننده هم سهم دارد.</li><li>تسویه با «پرداخت شد» یا «حلال است»؛ هیچ رقمی پاک نمی‌شود.</li></ol>`);
    /* wizard */
    case 'wclose': ui.wiz = null; return wizRender();
    case 'wnot': ui.wiz = null; wizRender(); ui.home = true; history.pushState(null, '', BASE); render(true); return toast('مدرسه‌ی خودتان را جستجو کنید یا ثبتش کنید.');
    case 'wprev': w.step--; w.err = ''; return wizRender();
    case 'wnext': return wizNext();
    case 'wset': w.d[el.dataset.k] = isNaN(+el.dataset.v) || el.dataset.k === 'shift' ? el.dataset.v : +el.dataset.v; if (el.dataset.k === 'kind' && el.dataset.v !== 'school') w.d.gender = 'x'; w.err = ''; return wizRender();
    case 'wstep': w.d.count = Math.max(1, Math.min(4, (w.d.count || 1) + +el.dataset.v)); return wizRender();
    case 'wseats': w.d.seats = Math.max(1, Math.min(6, (w.d.seats || 3) + +el.dataset.v)); return wizRender();
    case 'wkg': (w.d.kg = w.d.kg || [])[+el.dataset.i] = el.dataset.v; return wizRender();
    case 'wday': { const v = +el.dataset.v, a2 = w.d.days || []; w.d.days = a2.includes(v) ? a2.filter(z => z !== v) : [...a2, v]; return wizRender(); }
    case 'wsday': { const v = +el.dataset.v, a2 = w.d.days || [0,1,2,3,4]; w.d.days = a2.includes(v) ? a2.filter(z => z !== v) : [...a2, v]; return wizRender(); }
    case 'wval': { const v = el.dataset.v, a2 = w.d.values || []; w.d.values = a2.includes(v) ? a2.filter(z => z !== v) : [...a2, v]; return wizRender(); }
    case 'wshow': w.d.show = el.checked; return;
    case 'wloc':
      if (!navigator.geolocation) { w.err = 'این مرورگر موقعیت‌یابی ندارد.'; return wizRender(); }
      navigator.geolocation.getCurrentPosition(p => { w.d.lat = +p.coords.latitude.toFixed(5); w.d.lng = +p.coords.longitude.toFixed(5); w.err = ''; wizRender(); }, () => { w.err = 'موقعیت گرفته نشد؛ اجازه‌ی مرورگر را بررسی کنید.'; wizRender(); }, { enableHighAccuracy: true, timeout: 10000 });
      return;
    case 'wlocdemo': w.d.lat = +(w.s.lat + 0.0062).toFixed(5); w.d.lng = +(w.s.lng + 0.0105).toFixed(5); w.err = ''; return wizRender();
    case 'wlocdup': { const s0 = D.schools[0]; w.d.lat = +(s0.lat + 0.0004).toFixed(5); w.d.lng = +(s0.lng + 0.0003).toFixed(5); w.d.dupOk = 0; w.err = ''; return wizRender(); }
    case 'wgo': ui.wiz = null; wizRender(); go(school(el.dataset.s)); return;
    case 'wfinish': ui.wiz = null; wizRender(); ui.tab = 'map'; render(true); return;
    case 'wjoinnew': { const s = w.created; ui.wiz = null; go(s); return setTimeout(() => wizOpen('join', s), 60); }
    case 'wposter': { const s = w.created; ui.wiz = null; wizRender(); go(s); return setTimeout(posterSheet, 80); }
  }
}

/* ═════════ splash ═════════ */
function splash() {
  const el = $('#splash');
  let seen = false; try { seen = sessionStorage.getItem('rs-splash') === '1'; } catch (e) {}
  if (seen) { el.remove(); return; }
  const end = () => { if (!el.isConnected) return; el.classList.add('out'); try { sessionStorage.setItem('rs-splash', '1'); } catch (e) {} setTimeout(() => el.remove(), 380); };
  el.addEventListener('click', end); el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') end(); });
  el.focus();
  setTimeout(end, matchMedia('(prefers-reduced-motion: reduce)').matches ? 1600 : 4600);
}

/* ═════════ events ═════════ */
document.addEventListener('click', e => {
  const tab = e.target.closest('[data-tab]');
  if (tab) { closeLayer(); ui.tab = tab.dataset.tab; render(true); scrollTo(0, 0); return; }
  const el = e.target.closest('[data-a]');
  if (!el || el.tagName === 'INPUT' || el.disabled) return;
  act(el.dataset.a, el);
});
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('g[data-a]')) { e.preventDefault(); act(e.target.dataset.a, e.target); }
  if (e.key === 'Escape') { if ($('#layer').innerHTML) closeLayer(); else if (ui.wiz) { ui.wiz = null; wizRender(); } }
  if (e.key === 'Enter' && ui.wiz && e.target.matches('.wiz input')) { e.preventDefault(); wizNext(); }
});
document.addEventListener('change', e => { const el = e.target; if (el.matches('input[type=checkbox][data-a]')) act(el.dataset.a, el); if (el.matches('select[data-w]') && ui.wiz) ui.wiz.d[el.dataset.w] = el.value; });
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.in === 'q') { ui.q = el.value; const pos = el.selectionStart; render(); const n = $('#q'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } return; }
  if (el.dataset.in === 'tk') { ui.tk.text = el.value; return; }
  if (!ui.wiz) return;
  if (el.dataset.w) ui.wiz.d[el.dataset.w] = el.value;
  if (el.dataset.wk != null) (ui.wiz.d.kids = ui.wiz.d.kids || [])[+el.dataset.wk] = el.value;
});
addEventListener('hashchange', () => { ui.slot = null; ui.home = false; render(true); });
addEventListener('popstate', () => render(true));

/* ═════════ boot ═════════ */
D = load();
if (D.theme) document.documentElement.dataset.theme = D.theme;
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
render(true);
splash();
setInterval(simTick, 3000);
window.__rs = { get db() { return D; }, compat, smartTeam, balances: t => balances(t), teamIssues };
})();
