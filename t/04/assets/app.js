(() => {
'use strict';

/* ───────── basics ───────── */
const DAYS = ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'];
const KEY = 'residim-04-v1';
const TODAY = (new Date().getDay() + 1) % 7; // شنبه = ۰
const fa = v => String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
const sep = n => String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
const money = n => fa(sep(n)) + ' تومان';
const clock = t => fa(String(t).replace(/^0/, ''));
const nowClock = () => clock(new Date().toTimeString().slice(0, 5));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $ = s => document.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 9);

const MODES = {
  school: { name: 'فرزندان و مدرسه', dest: 'مدرسه', rider: 'فرزند', title: 'خانواده', done: 'تحویل خانواده شد' },
  work:   { name: 'همکاران',        dest: 'محل کار', rider: 'همکار', title: '', done: 'رسید' },
  uni:    { name: 'هم‌دانشگاهی‌ها',  dest: 'دانشگاه', rider: 'دانشجو', title: '', done: 'رسید' }
};
const VALUES = {
  female:  'راننده خانم باشد',
  nomusic: 'بدون موسیقی',
  quiet:   'گفتگوی کوتاه و محترمانه',
  seat:    'صندلی کودک',
  nophone: 'بدون تلفن حین رانندگی'
};
const CHARTER = [
  'سر وقت و با آرامش؛ دیر رسیدن را زودتر خبر می‌دهیم.',
  'ترجیحات هر خانواده محترم است، بی‌آن‌که دلیلش را بپرسیم.',
  'پیش‌آمد برای همه هست؛ با هم‌دلی جایگزین می‌شویم.',
  'حساب‌ها روشن، دل‌ها روشن‌تر؛ تسویه یا حلالیت، هر دو با احترام.'
];

/* ───────── sample group (fictional names; no real people) ───────── */
function sample() {
  const s = {
    v: 1, seen: false, theme: null,
    group: { mode: 'school', name: 'هم‌سرویس مدرسه · نمونه', dest: { name: 'مدرسه', lat: 35.7651, lng: 51.4185 },
             out: '07:15', back: '13:30', days: [0,1,2,3,4], price: 120000, invite: 'RS-4721' },
    members: [
      { id: 'a', title: 'خانواده', family: 'آسمان', me: true, gender: 'f', drive: true, pay: true, days: [0,2], seats: 4, c: 0,
        values: [], loc: { lat: 35.7612, lng: 51.4098 }, riders: [{ id: 'a1', first: 'ستاره', out: true, back: true }] },
      { id: 'b', title: 'خانواده', family: 'باران', gender: 'f', drive: false, pay: true, days: [], seats: 0, c: 1,
        values: ['female','nomusic'], loc: { lat: 35.7583, lng: 51.4141 }, riders: [{ id: 'b1', first: 'نیلا', out: true, back: false }] },
      { id: 'c', title: 'خانواده', family: 'دریا', gender: 'm', drive: true, pay: false, days: [1,3,4], seats: 4, c: 2,
        values: ['quiet'], loc: { lat: 35.7569, lng: 51.4072 }, riders: [{ id: 'c1', first: 'آرین', out: true, back: true }] },
      { id: 'd', title: 'خانواده', family: 'کوه', gender: 'f', drive: true, pay: true, days: [1,2,4], seats: 4, c: 3,
        values: ['seat','nophone'], loc: null, riders: [{ id: 'd1', first: 'پارسا', out: true, back: true }] }
    ],
    plan: {}, trips: {}, ledger: [], outbox: []
  };
  makePlan(s, true);
  // past days of this week are already done, so the account and week have a real rhythm
  slots(s).filter(x => x.d < TODAY).forEach((x, i) => {
    let exec = s.plan[x.id];
    if (i === 1 && exec) { const alt = candidates(s, x, exec)[0]; if (alt) exec = alt.m.id; } // one past swap
    if (!exec) return;
    const rs = ridersOf(s, x), arr = {};
    rs.forEach(r => arr[r.id] = 2);
    s.trips[x.id] = { status: 'done', exec, st: arr, empty: true, thanks: i % 2 === 0, at: x.time };
    tripEntry(s, x, exec);
  });
  const bal = balances(s);
  if (bal.b < -50000) s.ledger.push({ id: uid(), kind: 'pay', at: Date.now(), text: 'خانواده باران پرداخت کردند', d: { b: 100000, a: -100000 } });
  return s;
}

/* ───────── state ───────── */
let S;
const ui = { tab: 'today', slot: null, introStep: 0, wiz: null, sync: 'local' };

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && raw.v === 1 && Array.isArray(raw.members) && raw.group) return raw;
  } catch (e) {}
  return sample();
}
function save(op) {
  if (op) S.outbox.push({ id: uid(), op, at: Date.now() });
  if (S.outbox.length > 200) S.outbox = S.outbox.slice(-200);
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('حافظه این مرورگر در دسترس نیست؛ تغییرات تا بستن صفحه می‌ماند.'); }
  paintSync();
}

/* ───────── model ───────── */
const mem = (s, id) => s.members.find(m => m.id === id);
const me = s => s.members.find(m => m.me) || s.members[0];
const mName = m => m ? (m.title ? m.title + ' ' + m.family : m.family) : '—';
const rName = (r, m) => r.first ? r.first + ' ' + m.family : mName(m);
const verb = m => m && m.title === 'خانواده' ? 'می‌برند' : 'می‌برد';
const color = m => `var(--m${(m?.c ?? 0) % 6})`;

function slots(s) {
  const out = [];
  s.group.days.slice().sort((a, b) => a - b).forEach(d => ['out','back'].forEach(dir =>
    out.push({ id: d + '-' + dir, d, dir, time: dir === 'out' ? s.group.out : s.group.back })));
  return out;
}
const slotById = (s, id) => slots(s).find(x => x.id === id);
function ridersOf(s, slot) {
  return s.members.flatMap(m => m.riders.filter(r => r[slot.dir]).map(r => ({ ...r, mid: m.id })));
}
function fits(s, m, rs) {
  if (!m.drive || m.seats < rs.length) return false;
  return rs.every(r => { const o = mem(s, r.mid); return !o.values.includes('female') || m.gender === 'f' || o.id === m.id; });
}
function load_(s, exceptSlot) {
  const c = {};
  s.members.forEach(m => c[m.id] = 0);
  slots(s).forEach(x => { if (x.id === exceptSlot) return; const e = rec(s, x).exec; if (e && c[e] != null) c[e]++; });
  return c;
}
function candidates(s, slot, exclude) {
  const rs = ridersOf(s, slot), c = load_(s, slot.id);
  return s.members.filter(m => m.id !== exclude && fits(s, m, rs))
    .map(m => ({ m, onDay: m.days.includes(slot.d), count: c[m.id] }))
    .sort((a, b) => (b.onDay - a.onDay) || (a.count - b.count));
}
function makePlan(s, all) {
  const c = {};
  s.members.forEach(m => c[m.id] = 0);
  const list = slots(s);
  list.forEach(x => { const t = s.trips[x.id]; if (!all && t) c[t.exec] = (c[t.exec] || 0) + 1; });
  list.forEach(x => {
    if (!all && s.trips[x.id]) return;
    const rs = ridersOf(s, x);
    if (!rs.length) { s.plan[x.id] = null; return; }
    const pool = s.members.filter(m => fits(s, m, rs));
    pool.sort((a, b) => (b.days.includes(x.d) - a.days.includes(x.d)) || (c[a.id] - c[b.id]) || (a.pay - b.pay));
    const pick = pool[0];
    s.plan[x.id] = pick ? pick.id : null;
    if (pick) c[pick.id]++;
  });
}
function rec(s, slot) {
  return s.trips[slot.id] || { status: 'pending', exec: s.plan[slot.id] ?? null, st: {}, empty: false };
}
function reasons(s, slot, m) {
  const r = [], rs = ridersOf(s, slot), c = load_(s, slot.id)[m.id];
  r.push(m.days.includes(slot.d) ? [`${DAYS[slot.d]} را برای رانندگی اعلام کرده‌اند`, 1] : [`${DAYS[slot.d]} را اعلام نکرده بودند؛ پیش از قطعی‌شدن هماهنگ کنید`, 0]);
  r.push([`در این هفته ${fa(c)} نوبت دیگر دارند`, 1]);
  r.push([`ظرفیت: ${fa(rs.length)} از ${fa(m.seats)} صندلی`, 1]);
  rs.forEach(x => { const o = mem(s, x.mid); if (o.values.includes('female') && o.id !== m.id) r.push([`با ترجیح «راننده خانم» ${mName(o)} هم‌خوان است`, 1]); });
  return [...new Map(r.map(x => [x[0], x])).values()];
}
function reminders(s, slot, execId) {
  const out = [];
  ridersOf(s, slot).forEach(r => {
    const o = mem(s, r.mid);
    if (o.id === execId) return;
    o.values.filter(v => v !== 'female').forEach(v => out.push(VALUES[v] + ' · ' + o.family));
  });
  return [...new Set(out)];
}
function stops(s, slot, execId) {
  const ids = [...new Set(ridersOf(s, slot).map(r => r.mid))];
  ids.sort((a, b) => (b === execId) - (a === execId));
  const pts = ids.map(id => { const m = mem(s, id); return { label: m.family, sub: 'سوار شدن', m, lat: m.loc?.lat, lng: m.loc?.lng }; });
  const dest = { label: s.group.dest.name, sub: 'مقصد', dest: true, lat: s.group.dest.lat, lng: s.group.dest.lng };
  return slot.dir === 'out' ? [...pts, dest] : [dest, ...pts.map(p => ({ ...p, sub: 'پیاده شدن' }))];
}

/* ledger: append-only */
function tripEntry(s, slot, exec) {
  if (s.ledger.some(e => e.kind === 'trip' && e.slot === slot.id)) return false;
  const rs = ridersOf(s, slot), price = s.group.price, share = price / rs.length, d = {};
  d[exec] = (d[exec] || 0) + price;
  rs.forEach(r => d[r.mid] = (d[r.mid] || 0) - share);
  s.ledger.push({ id: uid(), kind: 'trip', slot: slot.id, at: Date.now(), text: `${DAYS[slot.d]} ${slot.dir === 'out' ? 'رفت' : 'برگشت'} · ${mName(mem(s, exec))}`, d });
  return true;
}
function balances(s) {
  const b = {};
  s.members.forEach(m => b[m.id] = 0);
  s.ledger.forEach(e => Object.entries(e.d).forEach(([k, v]) => { if (b[k] != null) b[k] += v; }));
  Object.keys(b).forEach(k => b[k] = Math.round(b[k]));
  return b;
}
function suggestions(s) {
  const b = balances(s);
  const deb = Object.entries(b).filter(([, v]) => v < -999).map(([k, v]) => [k, -v]).sort((x, y) => y[1] - x[1]);
  const cre = Object.entries(b).filter(([, v]) => v > 999).map(([k, v]) => [k, v]).sort((x, y) => y[1] - x[1]);
  const out = [];
  let i = 0, j = 0;
  while (i < deb.length && j < cre.length) {
    const amt = Math.min(deb[i][1], cre[j][1]);
    const rounded = Math.round(amt / 1000) * 1000;
    if (rounded >= 1000) out.push({ from: deb[i][0], to: cre[j][0], amt: rounded });
    deb[i][1] -= amt; cre[j][1] -= amt;
    if (deb[i][1] < 1) i++;
    if (cre[j][1] < 1) j++;
  }
  return out;
}

/* ───────── focus slot ───────── */
function focusSlot() {
  const list = slots(S);
  if (!list.length) return null;
  if (ui.slot) { const f = list.find(x => x.id === ui.slot); if (f) return f; }
  const ordered = [...list.filter(x => x.d >= TODAY), ...list.filter(x => x.d < TODAY)];
  return ordered.find(x => rec(S, x).status !== 'done') || ordered[0];
}
const dayWord = d => d === TODAY ? 'امروز' : d === (TODAY + 1) % 7 ? 'فردا' : DAYS[d];

/* ───────── views ───────── */
function viewToday() {
  const x = focusSlot();
  if (!x) return `<div class="card"><h2>هنوز برنامه‌ای نیست</h2><p class="muted">با راهنما گروه بسازید.</p><div class="actions" style="margin-top:12px"><button class="btn primary" data-a="wizard">ساخت گروه</button></div></div>`;
  const r = rec(S, x), ex = mem(S, r.exec), planned = mem(S, S.plan[x.id]);
  const rs = ridersOf(S, x), sameDay = slots(S).filter(y => y.d === x.d);
  const st = r.status, mode = MODES[S.group.mode];
  const head = ex ? `${esc(mName(ex))}<em>${verb(ex)}</em>` : 'این نوبت راننده ندارد';
  const notes = [];
  if (ex && planned && ex.id !== planned.id) notes.push(`<p class="note">به‌جای ${esc(mName(planned))}؛ ممنون از هم‌دلی‌شان.</p>`);
  if (ex && !ex.days.includes(x.d) && st === 'pending') notes.push(`<p class="note warn">این روز را اعلام نکرده بودند؛ یک پیام هماهنگی کافی است.</p>`);
  if (!ex) notes.push(`<p class="note warn">هیچ راننده‌ای با ظرفیت و ترجیحات این نوبت جور نیست. یک داوطلب لازم است.</p>`);

  const stopList = stops(S, x, r.exec);
  ui.stops = stopList;
  const stopHtml = `<div class="stops" aria-label="توقف‌ها">${stopList.map((p, i) => `
    <button class="stop ${p.dest ? 'dest' : ''}" style="--sc:${p.m ? color(p.m) : 'var(--ink)'}" data-a="nav" data-i="${i}" aria-label="${esc(p.label + '، ' + p.sub)}؛ باز کردن در مسیریاب">
      <span class="dot"><svg><use href="#i-pin"/></svg></span><span>${esc(p.label)}<br><small>${p.sub}</small></span></button>`).join('')}</div>`;

  let body = '';
  if (st === 'pending') {
    body = `<div class="riders">${rs.map(z => { const m = mem(S, z.mid); return `<span class="rider" style="--rc:${color(m)}"><i></i>${esc(rName(z, m))}</span>`; }).join('')}</div>`;
  } else if (st === 'started') {
    body = `<div class="rlist">${rs.map(z => {
      const m = mem(S, z.mid), v = r.st[z.id] || 0;
      const label = v === 0 ? 'سوار شد' : v === 1 ? (x.dir === 'out' ? 'رسید' : mode.done) : '✓ ' + (x.dir === 'out' ? 'رسید' : mode.done);
      return `<div class="rrow ${v === 1 ? 'boarded' : v === 2 ? 'arrived' : ''}" style="--rc:${color(m)}"><b><i></i>${esc(rName(z, m))}</b>
        <button class="step-btn" data-a="step" data-r="${z.id}" ${v === 2 ? 'aria-disabled="true"' : ''}>${label}</button></div>`;
    }).join('')}</div>`;
  } else {
    body = `<div class="done-box"><strong>خدا قوت! همه به سلامت رسیدند.</strong>
      <p class="muted">${money(S.group.price)} به اعتبار ${esc(mName(ex))} ثبت شد و سهم هر ${mode.rider} مساوی حساب شد.</p></div>`;
  }

  const rem = ex ? reminders(S, x, ex.id) : [];
  const remHtml = rem.length && st !== 'done' ? `<div class="remind"><b>یادآوری محترمانه:</b>${rem.map(v => `<span>${esc(v)}</span>`).join('')}</div>` : '';

  let actions = '';
  if (st === 'pending') {
    const mine = ex && ex.me;
    actions = `<button class="btn primary wide" data-a="start" ${ex ? '' : 'disabled'}>راه افتادیم</button>
      <button class="btn ghost" data-a="swap">${mine ? 'برایم مشکلی پیش آمد' : ex ? 'جایگزین لازم است؟' : 'من می‌برم'}</button>`;
  } else if (st === 'started') {
    const all = rs.every(z => (r.st[z.id] || 0) === 2);
    actions = `<label class="check" style="flex:1 1 100%"><input type="checkbox" data-a="empty" ${r.empty ? 'checked' : ''} ${all ? '' : 'disabled'}>خودرو خالی است و چیزی جا نمانده</label>
      <button class="btn primary wide" data-a="finish" ${all && r.empty ? '' : 'disabled'}>ثبت پایان سفر</button>`;
  } else {
    actions = `<button class="btn ghost" data-a="thanks" ${r.thanks ? 'disabled' : ''}><svg><use href="#i-heart"/></svg>${r.thanks ? 'تشکر شما رسید' : 'دست‌شان درد نکند'}</button>
      <button class="btn primary wide" data-a="next">نوبت بعدی</button>`;
  }

  const stateTxt = { pending: 'هنوز راه نیفتاده', started: 'در مسیر', done: 'رسیدیم' }[st];
  const hero = `<article class="hero ${st}" style="--c:${ex ? color(ex) : 'var(--dawn-2)'}" aria-live="polite">
    <div class="hero-top">
      <div class="seg" role="group" aria-label="نوبت‌های ${DAYS[x.d]}">${sameDay.map(y => `<button data-a="pick" data-s="${y.id}" aria-pressed="${y.id === x.id}">${y.dir === 'out' ? 'رفت' : 'برگشت'} · ${clock(y.time)}</button>`).join('')}</div>
      <span class="state ${st}">${stateTxt}</span>
    </div>
    <p class="kicker"><b>${dayWord(x.d)}${x.d === TODAY || x.d === (TODAY + 1) % 7 ? '، ' + DAYS[x.d] : ''}</b><span>${x.dir === 'out' ? 'رفت به ' + esc(S.group.dest.name) : 'برگشت از ' + esc(S.group.dest.name)}</span><span>ساعت ${clock(x.time)}</span><span>${fa(rs.length)} ${mode.rider}</span></p>
    <h1 class="headline">${head}</h1>
    ${notes.join('')}
    ${stopHtml}
    ${body}
    ${remHtml}
    <div class="spacer"></div>
    <div class="actions">${actions}</div>
  </article>`;

  const b = balances(S)[me(S).id];
  const side = `<aside class="stack only-wide">
    <div class="card"><div class="card-h"><h2>نگاه هفته</h2><button class="link" data-tab="week">همه</button></div>${miniWeek()}</div>
    <div class="card"><div class="card-h"><h2>حساب شما</h2><button class="link" data-tab="money">جزئیات</button></div>
      <p class="big ${b > 0 ? 'plus' : b < 0 ? 'minus' : ''}" style="font-size:2rem">${b > 0 ? '+' : b < 0 ? '−' : ''}${money(b)}</p>
      <p class="muted small">${b > 0 ? 'بیشتر از سهم‌تان زحمت کشیده‌اید.' : b < 0 ? 'سهم شما برای تسویه.' : 'حساب شما صاف است.'}</p></div>
    <div class="card"><h2 style="margin-bottom:10px">منشور هم‌سفری</h2><ul class="charter">${CHARTER.slice(0, 3).map(c => `<li>${c}</li>`).join('')}</ul></div>
  </aside>`;
  return `<div class="grid-2">${hero}${side}</div>`;
}

function miniWeek() {
  const byDay = {};
  slots(S).forEach(x => (byDay[x.d] = byDay[x.d] || []).push(x));
  return `<div class="mini-list">${Object.keys(byDay).map(d => `<div><b>${DAYS[d]}</b><span class="fair">${byDay[d].map(x => {
    const r = rec(S, x), m = mem(S, r.exec);
    return `<span style="padding:3px 9px"><i style="--fc:${m ? color(m) : 'var(--soft)'}"></i>${m ? esc(m.family) : '؟'}${r.status === 'done' ? ' ✓' : ''}</span>`;
  }).join('')}</span></div>`).join('')}</div>`;
}

function viewWeek() {
  const byDay = {};
  slots(S).forEach(x => (byDay[x.d] = byDay[x.d] || []).push(x));
  const counts = load_(S, null);
  const drivers = S.members.filter(m => m.drive);
  const payers = S.members.filter(m => !m.drive);
  const rows = Object.keys(byDay).map(Number).map(d => `<div class="wrow ${d === TODAY ? 'is-today' : ''}"><div class="wday">${DAYS[d]}${d === TODAY ? '<small>امروز</small>' : ''}</div>
    ${['out','back'].map(dir => {
      const x = byDay[d].find(y => y.dir === dir);
      if (!x) return '<span></span>';
      const r = rec(S, x), m = mem(S, r.exec), p = S.plan[x.id];
      let flag = '';
      if (r.status === 'done') flag = '<span class="flag done">رسیدیم</span>';
      else if (!m) flag = '<span class="flag none">داوطلب لازم</span>';
      else if (p && r.exec !== p) flag = '<span class="flag swap">جایگزین</span>';
      else if (!m.days.includes(d)) flag = '<span class="flag ask">هماهنگی</span>';
      return `<button class="cell" style="--cc:${m ? color(m) : 'var(--m1)'}" data-a="cell" data-s="${x.id}">
        <small>${dir === 'out' ? 'رفت' : 'برگشت'} · ${clock(x.time)}</small><b>${m ? esc(mName(m)) : 'بدون راننده'}</b>${flag}</button>`;
    }).join('')}</div>`).join('');
  return `<div class="grid-2"><section class="card"><div class="card-h"><div><h2>برنامه این هفته</h2><p class="muted small">روی هر نوبت بزنید تا دلیل انتخاب و جایگزین‌ها را ببینید.</p></div>
      <button class="btn soft" data-a="replan">چیدن دوباره</button></div>
      <div class="week">${rows}</div></section>
    <aside class="stack"><div class="card"><h2 style="margin-bottom:10px">سهم رانندگی این هفته</h2>
      <div class="fair">${drivers.map(m => `<span><i style="--fc:${color(m)}"></i>${esc(m.family)} · ${fa(counts[m.id])} نوبت</span>`).join('')}
      ${payers.map(m => `<span><i style="--fc:${color(m)}"></i>${esc(m.family)} · مشارکت با پرداخت</span>`).join('')}</div>
      <p class="muted small" style="margin-top:12px">چینش منصفانه: اول روزهایی که هر خانواده اعلام کرده، بعد کمترین نوبت، و همیشه با رعایت ظرفیت و ترجیحات.</p></div></aside></div>`;
}

function viewMoney() {
  const b = balances(S), mine = b[me(S).id], sug = suggestions(S);
  const max = Math.max(1, ...Object.values(b).map(Math.abs));
  const myTxt = mine > 0 ? 'بیشتر از سهم‌تان زحمت کشیده‌اید؛ دیگران به شما تسویه می‌کنند.' : mine < 0 ? 'این سهم شما برای تسویه است. می‌توانید پرداخت کنید یا با رانندگی جبران کنید.' : 'حساب شما با گروه صاف است.';
  const sugHtml = sug.length ? sug.map((x, i) => `<div class="srow"><p>${esc(mName(mem(S, x.from)))} ← ${esc(mName(mem(S, x.to)))} · <span class="num">${money(x.amt)}</span></p>
      <div class="actions"><button class="btn soft" data-a="pay" data-i="${i}">پرداخت شد</button><button class="btn soft" data-a="gift" data-i="${i}">حلال است</button></div></div>`).join('')
    : `<p class="muted">فعلاً تسویه‌ای لازم نیست. دل‌تان روشن!</p>`;
  const log = S.ledger.slice().reverse().slice(0, 12).map(e => {
    const v = e.d[me(S).id] || 0;
    return `<div><span>${e.kind === 'trip' ? '' : e.kind === 'pay' ? '💳 ' : '🤍 '}${esc(e.text)}</span><span class="num ${v > 0 ? 'plus' : v < 0 ? 'minus' : 'muted'}">${v ? (v > 0 ? '+' : '−') + fa(sep(v)) : '—'}</span></div>`;
  }).join('') || '<p class="muted small">هنوز سفری ثبت نشده.</p>';
  return `<div class="grid-2"><div class="stack">
      <section class="card balance"><p class="muted small">تراز شما با گروه</p><p class="big ${mine > 0 ? 'plus' : mine < 0 ? 'minus' : ''}">${mine > 0 ? '+' : mine < 0 ? '−' : ''}${money(mine)}</p><p class="muted">${myTxt}</p></section>
      <section class="card"><div class="card-h"><h2>پیشنهاد تسویه</h2><span class="muted small">با کمترین پرداخت</span></div><div class="settle">${sugHtml}</div></section>
    </div>
    <aside class="stack">
      <section class="card"><div class="card-h"><h2>همه هم‌سفرها</h2><button class="link" data-a="how">حساب چطور است؟</button></div>
        ${S.members.map(m => `<div class="mrow" style="--ac:${color(m)}"><span class="avatar">${esc(m.family[0])}</span><div><b>${esc(mName(m))}</b><div class="bar-line"><i style="width:${Math.round(Math.abs(b[m.id]) / max * 100)}%"></i></div></div><span class="num ${b[m.id] > 0 ? 'plus' : b[m.id] < 0 ? 'minus' : 'muted'}">${b[m.id] > 0 ? '+' : b[m.id] < 0 ? '−' : ''}${fa(sep(b[m.id]))}</span></div>`).join('')}
        <p class="muted small" style="margin-top:8px">جمع همه ترازها همیشه صفر است.</p></section>
      <section class="card"><div class="card-h"><h2>دفتر شفاف</h2><span class="muted small">چیزی پاک نمی‌شود</span></div><div class="log">${log}</div></section>
    </aside></div>`;
}

function viewGroup() {
  const mode = MODES[S.group.mode];
  return `<div class="grid-2"><section class="card"><div class="card-h"><div><h2>${esc(S.group.name)}</h2><p class="muted small">${mode.name} · ${esc(S.group.dest.name)} · هر سفر ${money(S.group.price)}</p></div></div>
      <div class="members">${S.members.map(m => `<button class="member" data-a="member" data-m="${m.id}">
        <div class="member-h" style="--ac:${color(m)}"><span class="avatar">${esc(m.family[0])}</span><div><b>${esc(mName(m))}</b><div class="muted small">${m.riders.filter(r => r.first).map(r => esc(r.first)).join('، ') || (m.drive ? 'راننده' : 'هم‌سفر')}</div></div></div>
        <div class="tags">${m.me ? '<span class="tag me">شما</span>' : ''}${m.drive ? `<span class="tag">رانندگی: ${m.days.map(d => DAYS[d]).join('، ') || '—'}</span>` : ''}${m.pay ? '<span class="tag">مشارکت مالی</span>' : ''}${m.values.map(v => `<span class="tag val">${VALUES[v]}</span>`).join('')}</div></button>`).join('')}</div></section>
    <aside class="stack">
      <section class="card"><h2 style="margin-bottom:10px">منشور هم‌سفری</h2><ul class="charter">${CHARTER.map(c => `<li>${c}</li>`).join('')}</ul></section>
      <section class="card"><div class="card-h"><h2>دعوت</h2><span class="tag num">${esc(S.group.invite)}</span></div>
        <p class="muted small">در نسخه حساب‌دار، با این کد خانواده‌ها به گروه می‌پیوندند و ترجیحات خودشان را ثبت می‌کنند.</p>
        <div class="actions" style="margin-top:12px"><button class="btn soft" data-a="notify"><svg><use href="#i-bell"/></svg>خبر رسیدن روی این گوشی</button><button class="btn soft" data-a="wizard">ساخت گروه تازه</button><button class="link" data-a="reset">بازگشت به گروه نمونه</button></div></section>
    </aside></div>`;
}

/* ───────── render ───────── */
function render(anim) {
  const v = { today: viewToday, week: viewWeek, money: viewMoney, group: viewGroup }[ui.tab]();
  const main = $('#main');
  main.innerHTML = v;
  if (anim) { main.classList.remove('enter'); void main.offsetWidth; main.classList.add('enter'); }
  document.querySelectorAll('.dock [data-tab]').forEach(b => b.dataset.tab === ui.tab ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  $('#group-name').textContent = S.group.name;
  paintSync();
}
function rerenderKeepFocus() {
  const a = document.activeElement, sel = a && a.dataset ? Object.entries(a.dataset).map(([k, v]) => `[data-${k.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}="${v}"]`).join('') : '';
  render();
  if (sel) { const n = document.querySelector('#main ' + sel); if (n) n.focus(); }
}

/* ───────── sheets ───────── */
let lastFocus = null;
function sheet(title, body, sub) {
  lastFocus = document.activeElement;
  $('#sheet-root').innerHTML = `<div class="scrim" data-a="close"></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-t" tabindex="-1">
    <div class="sheet-h"><div><h2 id="sh-t">${title}</h2>${sub ? `<p class="muted small">${sub}</p>` : ''}</div><button class="icon-btn" data-a="close" aria-label="بستن"><svg><use href="#i-close"/></svg></button></div>
    <div class="sheet-b">${body}</div></div>`;
  $('.sheet').focus();
}
function closeSheet() { $('#sheet-root').innerHTML = ''; ui.wiz = null; if (lastFocus && document.contains(lastFocus)) lastFocus.focus(); }

function swapSheet(x) {
  const r = rec(S, x), ex = mem(S, r.exec), list = candidates(S, x, r.exec), my = me(S);
  const title = ex && ex.me ? 'پیش می‌آید؛ با هم حلش می‌کنیم.' : 'چه کسی این نوبت را می‌برد؟';
  const sub = `${DAYS[x.d]} · ${x.dir === 'out' ? 'رفت' : 'برگشت'} · ساعت ${clock(x.time)} — برنامه اولیه حفظ می‌شود و اعتبار به کسی می‌رسد که واقعاً می‌برد.`;
  const opts = list.map(c => `<button class="opt" data-a="ask" data-m="${c.m.id}" data-s="${x.id}"><span class="avatar" style="--ac:${color(c.m)}">${esc(c.m.family[0])}</span>
    <span class="grow">${esc(mName(c.m))}${c.m.me ? ' (خودم می‌برم)' : ''}<ul class="reason">${reasons(S, x, c.m).map(([t, ok]) => `<li class="${ok ? '' : 'x'}">${esc(t)}</li>`).join('')}</ul></span>
    <span class="tag">${c.m.me ? 'ثبت' : 'درخواست'}</span></button>`).join('');
  sheet(title, (opts || '<p class="muted">هیچ عضوی با ظرفیت و ترجیحات این نوبت جور نیست. ترجیحات یا ظرفیت را در «هم‌سفرها» بازبینی کنید.</p>') +
    `<p class="muted small">ترتیب: اول کسانی که این روز را اعلام کرده‌اند، بعد کسی که کمتر رانندگی کرده. ${my.drive ? '' : ''}</p>`, sub);
}

function cellSheet(x) {
  const r = rec(S, x), ex = mem(S, r.exec), pl = mem(S, S.plan[x.id]), rs = ridersOf(S, x);
  const why = ex ? `<ul class="reason">${reasons(S, x, ex).map(([t, ok]) => `<li class="${ok ? '' : 'x'}">${esc(t)}</li>`).join('')}</ul>` : '<p class="muted">راننده سازگار پیدا نشد.</p>';
  sheet(`${DAYS[x.d]} · ${x.dir === 'out' ? 'رفت' : 'برگشت'} ${clock(x.time)}`,
    `<div class="card" style="padding:16px"><p class="muted small">راننده</p><h3 style="font-size:1.3rem">${ex ? esc(mName(ex)) : 'بدون راننده'}</h3>
      ${pl && ex && pl.id !== ex.id ? `<p class="note">برنامه اولیه: ${esc(mName(pl))}</p>` : ''}<div style="margin-top:8px">${why}</div></div>
     <div class="riders">${rs.map(z => { const m = mem(S, z.mid); return `<span class="rider" style="--rc:${color(m)}"><i></i>${esc(rName(z, m))}</span>`; }).join('')}</div>
     <div class="actions"><button class="btn primary wide" data-a="open" data-s="${x.id}">باز کردن این نوبت</button>${r.status === 'pending' ? `<button class="btn ghost" data-a="swap" data-s="${x.id}">تغییر راننده</button>` : ''}</div>`);
}

function navSheet(p) {
  if (p.lat == null) {
    const mine = p.m && p.m.me;
    sheet(esc(p.label), `<p class="muted">${mine ? 'موقعیت سوار شدن شما هنوز ثبت نشده. فقط اعضای همین گروه آن را می‌بینند و نمایش عمومی ندارد.' : esc(mName(p.m)) + ' هنوز موقعیت سوار شدن را ثبت نکرده‌اند. در نسخه حساب‌دار، یادآوری محترمانه برای‌شان می‌رود.'}</p>
      ${mine ? '<button class="btn primary" data-a="locate">ثبت موقعیت فعلی من</button>' : ''}`);
    return;
  }
  const q = `${p.lat},${p.lng}`, label = encodeURIComponent(p.label);
  sheet(`مسیر تا ${esc(p.label)}`, `<div class="nav-links">
      <a href="geo:${q}?q=${q}(${label})">مسیریاب گوشی</a>
      <a href="https://neshan.org/maps/@${q},16z,0p" target="_blank" rel="noopener">نشان</a>
      <a href="https://balad.ir/location?latitude=${p.lat}&longitude=${p.lng}" target="_blank" rel="noopener">بلد</a>
      <a href="https://www.google.com/maps/dir/?api=1&destination=${q}" target="_blank" rel="noopener">Google Maps</a>
      <a href="https://waze.com/ul?ll=${q}&navigate=yes" target="_blank" rel="noopener">Waze</a></div>
    <p class="muted small">مختصات نمونه است. موقعیت واقعی خانه‌ها فقط برای اعضای همان گروه و راننده همان نوبت نمایش داده می‌شود.</p>
    ${p.m && p.m.me ? '<button class="btn soft" data-a="locate">به‌روزرسانی موقعیت من</button>' : ''}`);
}

function memberSheet(m) {
  const vals = Object.entries(VALUES).map(([k, t]) => `<button class="chip" data-a="val" data-m="${m.id}" data-v="${k}" aria-pressed="${m.values.includes(k)}">${t}</button>`).join('');
  sheet(esc(mName(m)), `
    <div class="mini-list">${m.riders.map(r => `<div><span>${esc(rName(r, m))}</span><span class="muted small">${[r.out && 'رفت', r.back && 'برگشت'].filter(Boolean).join(' و ')}</span></div>`).join('')}</div>
    <div class="field"><span class="lbl">مشارکت</span><div class="chips">
      <button class="chip" data-a="mdrive" data-m="${m.id}" aria-pressed="${m.drive}">رانندگی</button>
      <button class="chip" data-a="mpay" data-m="${m.id}" aria-pressed="${m.pay}">پرداخت</button></div></div>
    ${m.drive ? `<div class="field"><span class="lbl">روزهای رانندگی</span><div class="chips">${S.group.days.map(d => `<button class="chip" data-a="mday" data-m="${m.id}" data-d="${d}" aria-pressed="${m.days.includes(d)}">${DAYS[d]}</button>`).join('')}</div></div>` : ''}
    <div class="field"><span class="lbl">ترجیحات و ارزش‌ها (به راننده با احترام یادآوری می‌شود)</span><div class="chips">${vals}</div></div>
    <p class="muted small">تغییر روی نوبت‌های آینده‌ای که هنوز شروع نشده‌اند اعمال می‌شود؛ سابقه دست نمی‌خورد.</p>
    <div class="actions"><button class="btn primary wide" data-a="replan">ذخیره و چیدن دوباره</button>${m.me ? '<button class="btn ghost" data-a="locate">ثبت موقعیت من</button>' : ''}</div>`,
    m.me ? 'این‌ها ترجیحات شماست.' : 'در نسخه حساب‌دار، هر خانواده فقط ترجیحات خودش را تغییر می‌دهد.');
}

function howSheet() {
  sheet('حساب چطور است؟', `<ul class="charter">
    <li>برای هر سفر، کل مبلغ (${money(S.group.price)}) به اعتبار راننده‌ای ثبت می‌شود که واقعاً برده است.</li>
    <li>همان مبلغ بین همه مسافران آن سفر مساوی تقسیم می‌شود؛ فرزند راننده هم سهم خودش را دارد.</li>
    <li>کسی که رانندگی نمی‌کند با پرداخت مشارکت می‌کند؛ کسی که بیشتر می‌برد، طلب‌کار نمی‌شود، «اعتبار» می‌گیرد.</li>
    <li>تسویه با «پرداخت شد» یا «حلال است» ثبت می‌شود. هیچ رقمی پاک نمی‌شود؛ اصلاح با سند تازه است.</li></ul>`);
}

function syncSheet() {
  const n = S.outbox.length;
  const state = { off: 'آفلاین هستید. همه تغییرات امن روی همین گوشی ذخیره شده‌اند.', server: 'سرور رسیدیم در دسترس است. همگام‌سازی خودکار پس از ورود با پیامک فعال می‌شود.', local: 'همه تغییرات روی همین گوشی ذخیره شده‌اند.' }[ui.sync];
  sheet('ذخیره و همگام‌سازی', `<p>${state}</p>
    <div class="mini-list"><div><span>تغییرات منتظر ارسال</span><b class="num">${fa(n)}</b></div><div><span>ذخیره روی گوشی</span><b>فعال</b></div><div><span>ارسال به خانواده‌ها</span><b class="muted">پس از ورود</b></div></div>
    <p class="muted small">در این نسخه آزمایشی، پیامک، پرداخت و ارسال به سرور انجام نمی‌شود و رسیدیم ادعای «ارسال شد» نمی‌کند.</p>
    <button class="btn soft" data-a="recheck">بررسی دوباره اتصال</button>`);
}

/* ───────── wizard ───────── */
function wizStart() {
  ui.wiz = { step: 0, mode: 'school', name: '', dest: 'مدرسه', out: '07:15', back: '13:30', days: [0,1,2,3,4], price: 120000, members: [], draft: blankDraft('school', true), charter: false, err: '' };
  wizRender();
}
function blankDraft(mode, mine) {
  return { title: mode === 'school' ? 'خانواده' : 'خانم', family: '', kids: '', gender: 'f', drive: true, pay: false, days: [], seats: 4, values: [], me: !!mine, out: true, back: true };
}
function wizRender() {
  const w = ui.wiz, steps = 4;
  const bar = `<div class="steps">${Array.from({ length: steps }, (_, i) => `<i class="${i <= w.step ? 'on' : ''}"></i>`).join('')}</div>`;
  let title = '', body = '';
  if (w.step === 0) {
    title = 'با چه کسانی هم‌سفر می‌شوید؟';
    body = Object.entries(MODES).map(([k, v]) => `<button class="opt" data-a="wmode" data-v="${k}" aria-pressed="${w.mode === k}"><span class="grow">${v.name}<small>${k === 'school' ? 'والدین با نام خانوادگی، فرزندان با نام و نام خانوادگی' : 'هر نفر با «خانم/آقای» و نام خانوادگی'}</small></span></button>`).join('');
  } else if (w.step === 1) {
    title = 'مقصد و ساعت‌ها';
    body = `<div class="field"><label for="w-name">نام گروه</label><input id="w-name" data-w="name" value="${esc(w.name)}" placeholder="مثلاً هم‌سرویس کلاس سوم"></div>
      <div class="row-2 keep"><div class="field"><label for="w-dest">مقصد</label><input id="w-dest" data-w="dest" value="${esc(w.dest)}"></div>
      <div class="field"><label for="w-price">مبلغ منصفانه هر سفر (تومان)</label><input id="w-price" data-w="price" inputmode="numeric" value="${w.price}"></div></div>
      <div class="row-2 keep"><div class="field"><label for="w-out">ساعت رفت</label><input id="w-out" type="time" data-w="out" value="${w.out}"></div>
      <div class="field"><label for="w-back">ساعت برگشت</label><input id="w-back" type="time" data-w="back" value="${w.back}"></div></div>
      <div class="field"><span class="lbl">روزهای رفت‌وآمد</span><div class="chips">${DAYS.map((d, i) => `<button class="chip" data-a="wday" data-d="${i}" aria-pressed="${w.days.includes(i)}">${d}</button>`).join('')}</div></div>`;
  } else if (w.step === 2) {
    const d = w.draft, sch = w.mode === 'school';
    title = w.members.length ? 'هم‌سفر بعدی' : 'اول، خودتان';
    body = `${w.members.length ? `<div class="mini-list">${w.members.map((m, i) => `<div><span>${esc(mName(m))}${m.riders.some(r => r.first) ? ' · ' + m.riders.map(r => esc(r.first)).join('، ') : ''}</span><button class="link" data-a="wdel" data-i="${i}">حذف</button></div>`).join('')}</div>` : ''}
      <div class="row-2 keep">${sch ? '' : `<div class="field"><label for="w-title">عنوان</label><select id="w-title" data-wd="title"><option ${d.title === 'خانم' ? 'selected' : ''}>خانم</option><option ${d.title === 'آقای' ? 'selected' : ''}>آقای</option></select></div>`}
        <div class="field" ${sch ? 'style="grid-column:1/-1"' : ''}><label for="w-fam">نام خانوادگی</label><input id="w-fam" data-wd="family" value="${esc(d.family)}" placeholder="مثلاً آسمان"></div></div>
      ${sch ? `<div class="field"><label for="w-kids">نام کوچک فرزند(ان)؛ با ویرگول جدا کنید</label><input id="w-kids" data-wd="kids" value="${esc(d.kids)}" placeholder="مثلاً ستاره، آرین"></div>` : ''}
      <div class="field"><span class="lbl">مشارکت</span><div class="chips"><button class="chip" data-a="wd-drive" aria-pressed="${d.drive}">رانندگی می‌کنم</button><button class="chip" data-a="wd-pay" aria-pressed="${d.pay}">پرداخت می‌کنم</button>
        ${sch ? `<button class="chip" data-a="wd-g" aria-pressed="${d.gender === 'f'}">راننده خانم است</button>` : ''}</div></div>
      ${d.drive ? `<div class="field"><span class="lbl">روزهایی که می‌توانم ببرم</span><div class="chips">${w.days.map(i => `<button class="chip" data-a="wd-day" data-d="${i}" aria-pressed="${d.days.includes(i)}">${DAYS[i]}</button>`).join('')}</div></div>` : ''}
      <div class="field"><span class="lbl">ترجیحات (اختیاری)</span><div class="chips">${Object.entries(VALUES).filter(([k]) => sch || k !== 'seat').map(([k, t]) => `<button class="chip" data-a="wd-val" data-v="${k}" aria-pressed="${d.values.includes(k)}">${t}</button>`).join('')}</div></div>
      <button class="btn soft" data-a="wadd">+ افزودن ${w.members.length ? 'این هم‌سفر' : 'خودم'}</button>`;
  } else {
    title = 'مرور و چیدن برنامه';
    body = `<div class="mini-list"><div><span>نوع</span><b>${MODES[w.mode].name}</b></div><div><span>مقصد</span><b>${esc(w.dest)}</b></div><div><span>روزها</span><b>${w.days.map(d => DAYS[d]).join('، ')}</b></div><div><span>هم‌سفرها</span><b>${fa(w.members.length)}</b></div><div><span>هر سفر</span><b>${money(w.price)}</b></div></div>
      <div class="card" style="padding:16px"><h3 style="margin-bottom:8px">منشور هم‌سفری</h3><ul class="charter">${CHARTER.map(c => `<li>${c}</li>`).join('')}</ul></div>
      <label class="check"><input type="checkbox" data-a="wcharter" ${w.charter ? 'checked' : ''}>با این منشور هم‌سفر می‌شویم</label>`;
  }
  const nav = `<p class="err" role="alert">${esc(w.err)}</p><div class="actions">${w.step > 0 ? '<button class="btn ghost" data-a="wback">قبلی</button>' : ''}<button class="btn primary wide" data-a="wnext">${w.step === 3 ? 'چیدن برنامه منصفانه' : 'ادامه'}</button></div>`;
  const keep = document.activeElement && document.activeElement.id;
  sheet(title, bar + body + nav, `گام ${fa(w.step + 1)} از ${fa(steps)}`);
  if (keep) { const n = document.getElementById(keep); if (n) n.focus(); }
}
function wizAdd() {
  const w = ui.wiz, d = w.draft, sch = w.mode === 'school';
  if (!d.family.trim()) { w.err = 'نام خانوادگی را بنویسید.'; return wizRender(); }
  const kids = sch ? d.kids.split(/[،,]/).map(x => x.trim()).filter(Boolean) : [];
  if (sch && !kids.length && !d.drive) { w.err = 'حداقل یک فرزند یا مشارکت در رانندگی لازم است.'; return wizRender(); }
  if (!d.drive && !d.pay) { w.err = 'یکی از «رانندگی» یا «پرداخت» را انتخاب کنید.'; return wizRender(); }
  const id = uid(), c = w.members.length;
  w.members.push({ id, title: sch ? 'خانواده' : d.title, family: d.family.trim(), me: d.me, gender: sch ? d.gender : (d.title === 'خانم' ? 'f' : 'm'),
    drive: d.drive, pay: d.pay, days: d.drive ? d.days.slice() : [], seats: 4, c, values: d.values.slice(), loc: null,
    riders: sch ? kids.map(k => ({ id: uid(), first: k, out: true, back: true })) : [{ id: uid(), first: '', out: true, back: true }] });
  w.draft = blankDraft(w.mode, false); w.err = '';
  toast(`${mName(w.members[w.members.length - 1])} اضافه شد.`);
  wizRender();
}
function wizNext() {
  const w = ui.wiz; w.err = '';
  if (w.step === 1) {
    if (!w.days.length) w.err = 'حداقل یک روز را انتخاب کنید.';
    else if (!(+w.price >= 0)) w.err = 'مبلغ را با عدد بنویسید.';
  }
  if (w.step === 2) {
    if (w.draft.family.trim()) { wizAdd(); if (w.err) return; }
    if (w.members.length < 2) w.err = 'برای هم‌سفری دست‌کم دو نفر لازم است.';
    else if (!w.members.some(m => m.drive)) w.err = 'دست‌کم یک نفر باید رانندگی کند.';
  }
  if (w.step === 3) {
    if (!w.charter) { w.err = 'برای شروع، منشور را بپذیرید.'; return wizRender(); }
    const s = { v: 1, seen: true, theme: S.theme, group: { mode: w.mode, name: w.name.trim() || 'هم‌سفری ما', dest: { name: w.dest.trim() || MODES[w.mode].dest, lat: null, lng: null }, out: w.out, back: w.back, days: w.days.slice().sort(), price: Math.round(+w.price), invite: 'RS-' + Math.floor(1000 + Math.random() * 9000) },
      members: w.members, plan: {}, trips: {}, ledger: [], outbox: [] };
    makePlan(s, true);
    S = s; save('group.create'); closeSheet(); ui.tab = 'week'; ui.slot = null; render();
    const empty = slots(S).filter(x => !S.plan[x.id] && ridersOf(S, x).length).length;
    toast(empty ? `برنامه چیده شد؛ ${fa(empty)} نوبت داوطلب لازم دارد.` : 'برنامه منصفانه چیده شد. خوش آمدید!');
    return;
  }
  if (w.err) return wizRender();
  w.step++; wizRender();
}

/* ───────── intro ───────── */
const SLIDES = [
  ['رسیدیم', 'نوبت‌ها روشن،<br>خیال‌ها جمع.', 'رفت‌وآمد مشترک را یک بار با هم بچینید؛ رسیدیم یادش می‌ماند، منصفانه تقسیمش می‌کند و وقتی رسیدند خبرتان می‌کند.'],
  ['هر خانواده، به سبک خودش', 'یکی می‌برد،<br>یکی سهمش را می‌دهد.', 'رانندگی، پرداخت یا هر دو. ترجیحات هر خانواده — از راننده خانم تا سکوت در مسیر — بی‌پرسش محترم است.'],
  ['وقتی پیش می‌آید', 'جایگزین، بی‌شرمندگی.<br>حساب، بی‌دلخوری.', 'با یک لمس جایگزین سازگار پیدا می‌شود. حساب شفاف است؛ تسویه کنید یا حلال کنید. برای مدرسه، کار و دانشگاه.']
];
function intro() {
  const i = ui.introStep, [eb, h, p] = SLIDES[i];
  $('#intro-root').innerHTML = `<div class="intro" role="dialog" aria-modal="true" aria-label="معرفی رسیدیم"><div class="intro-in slide">
    <span class="eyebrow">${eb}</span><h1>${h}</h1><p class="lead">${p}</p>
    <div class="dots">${SLIDES.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
    <div class="actions">${i < SLIDES.length - 1
      ? `<button class="btn primary wide" data-a="inext">ادامه</button><button class="btn ghost" data-a="iskip">دیدن نمونه</button>`
      : `<button class="btn primary wide" data-a="iwiz">ساخت گروه ما با راهنما</button><button class="btn ghost" data-a="iskip">اول نمونه را ببینم</button>`}</div>
    <p class="muted small">نسخه آزمایشی ۰۴ · داده‌ها نمونه و روی همین دستگاه‌اند.</p></div></div>`;
  $('#intro-root .btn').focus();
}
function endIntro(wiz) { S.seen = true; save(); $('#intro-root').innerHTML = ''; render(); if (wiz) wizStart(); }

/* ───────── sync ───────── */
function paintSync() {
  const el = $('#sync'); if (!el) return;
  const n = S.outbox.length;
  el.className = 'sync ' + (ui.sync === 'off' ? 'off' : n && ui.sync !== 'local' ? 'queue' : '');
  el.querySelector('span').textContent = ui.sync === 'off' ? 'آفلاین · امن روی گوشی' : n ? `روی گوشی ذخیره شد · ${fa(n)} در صف` : 'روی گوشی ذخیره شد';
}
async function checkSync() {
  if (!navigator.onLine) { ui.sync = 'off'; return paintSync(); }
  try {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 4000);
    const res = await fetch('../../app/api/index.php?action=health', { cache: 'no-store', signal: ctl.signal });
    clearTimeout(t);
    ui.sync = res.ok ? 'server' : 'local';
  } catch (e) { ui.sync = 'local'; }
  paintSync();
}

/* ───────── notifications ───────── */
async function notify(title, body) {
  toast(title + ' · ' + body);
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) reg.showNotification(title, { body, icon: 'assets/icon-192.png', lang: 'fa', dir: 'rtl', tag: 'arrive-' + Date.now() });
    }
  } catch (e) {}
}

/* ───────── toast ───────── */
let tt;
function toast(msg) { const el = $('#toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 3800); }

/* ───────── actions ───────── */
function act(a, el) {
  const x = focusSlot();
  switch (a) {
    case 'close': return closeSheet();
    case 'theme': {
      const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      S.theme = dark ? 'light' : 'dark'; document.documentElement.dataset.theme = S.theme; save(); return;
    }
    case 'pick': ui.slot = el.dataset.s; return render();
    case 'start': {
      const r = rec(S, x); if (r.status !== 'pending' || !r.exec) return;
      S.trips[x.id] = { ...r, status: 'started', st: {}, empty: false, startedAt: Date.now() }; ui.slot = x.id; save('trip.start');
      toast('راه افتادید. سوار شدن و رسیدن هر نفر را جدا ثبت کنید.'); return render();
    }
    case 'step': {
      const t = S.trips[x.id]; if (!t || t.status !== 'started') return;
      const id = el.dataset.r, v = t.st[id] || 0; if (v >= 2) return;
      t.st[id] = v + 1; save(v ? 'rider.arrive' : 'rider.board');
      if (v === 1) {
        const rr = ridersOf(S, x).find(z => z.id === id), m = mem(S, rr.mid);
        notify(`${rName(rr, m)} ${x.dir === 'out' ? 'به ' + S.group.dest.name + ' رسید' : 'به خانه رسید'}`, `ساعت ${nowClock()} · ${mName(mem(S, t.exec))}`);
      }
      return rerenderKeepFocus();
    }
    case 'empty': { const t = S.trips[x.id]; if (t) { t.empty = el.checked; save(); rerenderKeepFocus(); } return; }
    case 'finish': {
      const t = S.trips[x.id], rs = ridersOf(S, x);
      if (!t || t.status !== 'started' || !t.empty || !rs.every(z => t.st[z.id] === 2)) return toast('همه باید «رسید» شوند و خودرو بررسی شود.');
      t.status = 'done'; tripEntry(S, x, t.exec); ui.slot = x.id; save('trip.finish'); return render();
    }
    case 'thanks': { const t = S.trips[x.id]; if (t && !t.thanks) { t.thanks = true; save('trip.thanks'); toast(`تشکر شما به ${mName(mem(S, t.exec))} رسید.`); render(); } return; }
    case 'next': { ui.slot = null; const n = focusSlot(); ui.slot = n ? n.id : null; return render(); }
    case 'swap': return swapSheet(el.dataset.s ? slotById(S, el.dataset.s) : x);
    case 'ask': {
      const s = slotById(S, el.dataset.s), m = mem(S, el.dataset.m), r = rec(S, s);
      if (r.status !== 'pending') return;
      closeSheet();
      if (m.me) { S.trips[s.id] = { ...r, exec: m.id }; save('trip.swap'); ui.slot = s.id; toast('این نوبت را خودتان می‌برید. ممنون از هم‌دلی‌تان.'); return render(); }
      toast(`درخواست برای ${mName(m)} فرستاده شد…`);
      setTimeout(() => { S.trips[s.id] = { ...rec(S, s), exec: m.id }; save('trip.swap'); ui.slot = s.id; render(); toast(`${mName(m)} پذیرفتند. هم‌دلی‌شان ثبت شد.`); }, 1100);
      return;
    }
    case 'cell': return cellSheet(slotById(S, el.dataset.s));
    case 'open': ui.slot = el.dataset.s; ui.tab = 'today'; closeSheet(); return render();
    case 'replan': makePlan(S, false); save('plan.update'); closeSheet(); render(); return toast('نوبت‌های آینده منصفانه چیده شدند؛ سفرهای انجام‌شده دست نخورد.');
    case 'nav': return navSheet(ui.stops[+el.dataset.i]);
    case 'locate': {
      if (!navigator.geolocation) return toast('این مرورگر موقعیت‌یابی ندارد.');
      toast('در حال گرفتن موقعیت؛ فقط با اجازه شما.');
      navigator.geolocation.getCurrentPosition(p => {
        me(S).loc = { lat: +p.coords.latitude.toFixed(5), lng: +p.coords.longitude.toFixed(5) }; save('member.location'); closeSheet(); render();
        toast(`موقعیت سوار شدن شما ثبت شد (دقت حدود ${fa(Math.round(p.coords.accuracy))} متر).`);
      }, () => toast('موقعیت گرفته نشد؛ اجازه مرورگر را بررسی کنید.'), { enableHighAccuracy: true, timeout: 10000 });
      return;
    }
    case 'pay': case 'gift': {
      const sg = suggestions(S)[+el.dataset.i]; if (!sg) return;
      const from = mem(S, sg.from), to = mem(S, sg.to);
      S.ledger.push({ id: uid(), kind: a, at: Date.now(), text: a === 'pay' ? `${mName(from)} به ${mName(to)} پرداخت کردند` : `${mName(to)} سهم ${mName(from)} را حلال کردند`, d: { [sg.from]: sg.amt, [sg.to]: -sg.amt } });
      save('ledger.' + a); render();
      return toast(a === 'pay' ? 'پرداخت ثبت شد. در نسخه حساب‌دار، گیرنده دریافت را تأیید می‌کند.' : 'بزرگواری‌تان ثبت شد. حساب‌ها روشن، دل‌ها روشن‌تر.');
    }
    case 'how': return howSheet();
    case 'member': return memberSheet(mem(S, el.dataset.m));
    case 'val': case 'mdrive': case 'mpay': case 'mday': {
      const m = mem(S, el.dataset.m);
      if (a === 'val') { const v = el.dataset.v; m.values = m.values.includes(v) ? m.values.filter(z => z !== v) : [...m.values, v]; }
      if (a === 'mdrive') { m.drive = !m.drive; if (m.drive && !m.seats) m.seats = 4; if (!m.drive && !m.pay) m.pay = true; }
      if (a === 'mpay') { m.pay = !m.pay; if (!m.drive && !m.pay) m.drive = true; }
      if (a === 'mday') { const d = +el.dataset.d; m.days = m.days.includes(d) ? m.days.filter(z => z !== d) : [...m.days, d]; }
      save('member.update'); return memberSheet(m);
    }
    case 'notify': {
      if (!('Notification' in window)) return toast('این مرورگر اعلان ندارد.');
      Notification.requestPermission().then(p => toast(p === 'granted' ? 'خبر رسیدن روی این گوشی فعال شد. در نسخه حساب‌دار برای هر خانواده جدا ارسال می‌شود.' : 'اعلان فعال نشد؛ هر وقت خواستید از تنظیمات مرورگر روشنش کنید.'));
      return;
    }
    case 'reset': S = sample(); S.seen = true; save(); ui.slot = null; ui.tab = 'today'; render(); return toast('گروه نمونه بازگشت.');
    case 'sync': return syncSheet();
    case 'recheck': closeSheet(); checkSync(); return toast('اتصال دوباره بررسی شد.');
    case 'wizard': return wizStart();
    case 'wmode': ui.wiz.mode = el.dataset.v; ui.wiz.dest = MODES[el.dataset.v].dest; ui.wiz.draft = blankDraft(el.dataset.v, !ui.wiz.members.length); return wizRender();
    case 'wday': { const w = ui.wiz, d = +el.dataset.d; w.days = w.days.includes(d) ? w.days.filter(z => z !== d) : [...w.days, d]; return wizRender(); }
    case 'wd-drive': ui.wiz.draft.drive = !ui.wiz.draft.drive; return wizRender();
    case 'wd-pay': ui.wiz.draft.pay = !ui.wiz.draft.pay; return wizRender();
    case 'wd-g': ui.wiz.draft.gender = ui.wiz.draft.gender === 'f' ? 'm' : 'f'; return wizRender();
    case 'wd-day': { const d = ui.wiz.draft, n = +el.dataset.d; d.days = d.days.includes(n) ? d.days.filter(z => z !== n) : [...d.days, n]; return wizRender(); }
    case 'wd-val': { const d = ui.wiz.draft, v = el.dataset.v; d.values = d.values.includes(v) ? d.values.filter(z => z !== v) : [...d.values, v]; return wizRender(); }
    case 'wadd': return wizAdd();
    case 'wdel': ui.wiz.members.splice(+el.dataset.i, 1); return wizRender();
    case 'wcharter': ui.wiz.charter = el.checked; return;
    case 'wback': ui.wiz.step--; ui.wiz.err = ''; return wizRender();
    case 'wnext': return wizNext();
    case 'inext': ui.introStep++; return intro();
    case 'iskip': return endIntro(false);
    case 'iwiz': return endIntro(true);
  }
}

document.addEventListener('click', e => {
  const tab = e.target.closest('[data-tab]');
  if (tab) { ui.tab = tab.dataset.tab; closeSheet(); render(true); window.scrollTo(0, 0); return; }
  const el = e.target.closest('[data-a]');
  if (!el || el.tagName === 'INPUT') return;
  if (el.disabled || el.getAttribute('aria-disabled') === 'true') return;
  act(el.dataset.a, el);
});
document.addEventListener('change', e => { const el = e.target; if (el.matches('input[data-a]')) act(el.dataset.a, el); if (el.matches('[data-wd="title"]')) ui.wiz.draft.title = el.value; });
document.addEventListener('input', e => {
  const el = e.target;
  if (!ui.wiz) return;
  if (el.dataset.w) ui.wiz[el.dataset.w] = el.dataset.w === 'price' ? el.value.replace(/[^\d۰-۹]/g, '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)) : el.value;
  if (el.dataset.wd) ui.wiz.draft[el.dataset.wd] = el.value;
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('#sheet-root').innerHTML) closeSheet();
  if (e.key === 'Tab' && $('.sheet')) {
    const f = [...$('.sheet').querySelectorAll('button,input,select,a[href]')].filter(n => !n.disabled);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
});
addEventListener('online', checkSync);
addEventListener('offline', checkSync);
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkSync(); });

S = load();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
render();
checkSync();
if (!S.seen) intro();

window.__residim = { get state() { return S; }, balances: () => balances(S), suggestions: () => suggestions(S) };
})();
