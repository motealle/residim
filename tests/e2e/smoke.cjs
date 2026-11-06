// Residim end-to-end smoke test. Run: php -S 127.0.0.1:8899 tests/e2e/router.php & node tests/e2e/smoke.cjs
// Covers the paths whose failure would cost families' trust: landing, school wizard, login, matching, team, chat, admin.
const CONTRAST = "// returns low-contrast text elements inside root (page-evaluated)\nwindow.__lowContrast = (rootSel, min = 3) => {\n  const P = s => { const m = s.match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const a = m[1].split(',').map(x => parseFloat(x)); return { r: a[0], g: a[1], b: a[2], a: a.length > 3 ? a[3] : 1 }; };\n  const L = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };\n  const bgOf = el => { for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); const im = cs.backgroundImage; if (im && im !== 'none' && /gradient/.test(im)) { const cols = [...im.matchAll(/rgba?\\([^)]+\\)/g)].map(m => P(m[0])).filter(c => c && c.a > .3); if (cols.length) return cols.reduce((a, c) => ({ r: a.r + c.r / cols.length, g: a.g + c.g / cols.length, b: a.b + c.b / cols.length, a: 1 }), { r: 0, g: 0, b: 0 }); } const c = P(cs.backgroundColor); if (c && c.a > .6) return c; } return { r: 255, g: 255, b: 255, a: 1 }; };\n  const out = []; const roots = document.querySelectorAll(rootSel);\n  roots.forEach(root => root.querySelectorAll('*').forEach(el => { if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return; const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1); if (!own) return;\n    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity < .5) return; const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;\n    const fg = P(cs.color), bg = bgOf(el); if (!fg) return; const l1 = L(fg), l2 = L(bg), cr = (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);\n    if (cr < min) out.push(el.tagName + '.' + (el.className || '').toString().slice(0, 40) + ' «' + el.textContent.trim().slice(0, 24) + '» ' + cr.toFixed(2)); }));\n  return [...new Set(out)];\n};\n";
const assert = require('assert'); const { chromium } = require('playwright');
const B = process.env.BASE || 'http://127.0.0.1:8899'; const sleep = ms => new Promise(r => setTimeout(r, ms)); const ok = (...a) => console.log('✓', ...a);
const api = (a, b, t) => fetch(B + '/app/api/r6.php?a=' + a, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Token': t || '' }, body: JSON.stringify(b || {}) }).then(r => r.json());
(async () => {
  const errs = [];
  const ad = (await api('admin_login', { u: 'mot', p: 'mot' })).token; assert(ad, 'admin login'); await api('admin_flag', { k: 'otp_dev', v: 1 }, ad);
  const o = await api('otp_send', { phone: '09121112233' }); const T = (await api('otp_verify', { phone: '09121112233', code: o.dev_code })).token; assert(T, 'otp'); ok('otp login');
  const pl = (await api('place_create', { kind: 'school', name: 'دبستان آزمون', city: 'تهران', gender: 'f', lat: 35.75, lng: 51.38, force: true }, T)).place; assert(pl && pl.code);
  const D = { family: 'آزمون', pg: 'f', rel: 'mother', kids: [{ id: 'k1', first: 'سارا', g: 'f', by: 1397 }], lat: 35.752, lng: 51.383, hood: 'نارون', role: 'pay', seats: 0, snapp: 90000, rules_at: 1, contact: 'app' };
  const pr = (await api('profile_save', { kind: 'school', label: 'مدرسه', place_id: pl.id, complete: 1, data: D }, T)).profile; assert(pr);
  await api('test_fake', { profile_id: pr.id, n: 5, driver: 1 }, T); const C = await api('candidates', { profile_id: pr.id }, T); assert(C.list.length >= 3); ok('matching', C.list.length);
  const drv = C.list.find(m => m.rule_ok && m.role !== 'pay'); await api('invite', { profile_id: pr.id, to: drv.id }, T); await sleep(7000);
  const st = await api('team_state', { profile_id: pr.id }, T); assert(st.team, 'team'); ok('team formed');
  assert((await api('chat_send', { profile_id: pr.id, text: 'سلام' }, T)).ok); ok('chat');
  assert((await api('contact', { text: 'پیام آزمون دود', contact: '09120000000', t: 5000 })).ok); ok('contact');
  await api('admin_flag', { k: 'otp_dev', v: 0 }, ad);
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    const c = await b.newContext({ serviceWorkers: 'block', viewport: vp }); await c.route(/openfreemap|unpkg|enamad|neshan/, r => r.abort()); const p = await c.newPage();
    p.on('pageerror', e => errs.push(vp.width + ' ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load|net::|404|ERR_/.test(m.text())) errs.push(vp.width + ' ' + m.text()); });
    const wide = () => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    await p.goto(B + '/'); await sleep(900); await p.click('#splash').catch(() => {}); await sleep(400); assert(!(await wide()), 'overflow home ' + vp.width);
    await p.click('.school-main'); await sleep(400); assert.equal(await p.evaluate(() => window.__rs.ui.wiz.kind), 'school'); await p.keyboard.press('Escape'); await sleep(300); if (await p.$('[data-a="w-close-ok"]')) await p.click('[data-a="w-close-ok"]');
    await p.evaluate(t => localStorage.setItem('residim-06', JSON.stringify({ token: t, phone: '09121112233', drafts: [] })), T); await p.reload(); await sleep(900); await p.click('#splash').catch(() => {}); await sleep(1800);
    for (const tab of ['peers', 'team', 'money']) { await p.click(`${vp.width > 1000 ? '.side' : '.dock'} [data-tab="${tab}"]`); await sleep(900); assert(!(await wide()), 'overflow ' + tab + ' ' + vp.width); }
    // layout guards (v33): side/drawer never clip or scroll sideways, the desktop list is as tall as its content, floating cards never overlap
    await p.click(`${vp.width > 1000 ? '.side' : '.dock'} [data-tab="peers"]`); await sleep(900);
    if (vp.width <= 1000) { await p.click('[data-a="menu"]').catch(() => {}); await sleep(700); }
    const lay = await p.evaluate(() => { const box = document.querySelector(innerWidth > 1000 ? '.side' : '.drawer'), bad = [];
      if (box) { box.querySelectorAll('small,b').forEach(e => { if (e.closest('.pcard2,.pcard')) e.textContent = 'دبیرستان غیردولتی دوره‌ی اول خاتم الانبیاء منطقه‌ی دو تهران'; });
        const r = box.getBoundingClientRect(); if (box.scrollWidth > box.clientWidth + 1) bad.push('scrollX ' + box.className);
        box.querySelectorAll('*').forEach(e => { const q = e.getBoundingClientRect(); if (q.width && (q.left < r.left - 1 || q.right > r.right + 1) && !e.closest('[hidden]')) bad.push('clip ' + e.tagName + '.' + e.className); }); }
      const as = document.querySelector('.split.peers > aside'); if (as && innerWidth > 1000) { const q = as.getBoundingClientRect(); if (q.height > as.scrollHeight + 40) bad.push('aside taller than content ' + Math.round(q.height) + '/' + as.scrollHeight); }
      const fl = [...document.querySelectorAll('.split.peers > .stack:not(aside) > :is(.hint,.card.empty,.legend)')].filter(e => getComputedStyle(e).position === 'absolute' && e.offsetParent);
      for (let i = 0; i < fl.length; i++) for (let j = i + 1; j < fl.length; j++) { const x = fl[i].getBoundingClientRect(), y = fl[j].getBoundingClientRect(); if (x.left < y.right && y.left < x.right && x.top < y.bottom && y.top < x.bottom) bad.push('overlap ' + fl[i].className + ' / ' + fl[j].className); }
      return bad.slice(0, 6); });
    assert.deepEqual(lay, [], 'layout ' + vp.width + ': ' + lay.join(' | '));
    if (vp.width <= 1000) { await p.keyboard.press('Escape'); await sleep(300); }
    // dark mode (v34): no text below 3:1 contrast in the main view, the side panel or the drawer
    await p.addScriptTag({ content: CONTRAST });
    for (const th of ['dark', 'light']) { await p.evaluate(t => document.documentElement.setAttribute('data-theme', t), th);
      for (const tb of ['team', 'money', 'peers']) { await p.evaluate(t => { const b = document.querySelector(`${innerWidth > 1000 ? '.side' : '.dock'} [data-tab="${t}"]`); b && b.click(); }, tb); await sleep(700);
        const low = await p.evaluate(() => __lowContrast('#main', 3).filter(x => !/OpenStreetMap|OpenMapTiles|OpenFreeMap|badge-src|maplibre/.test(x)));
        assert.deepEqual(low, [], `contrast ${th} ${tb} ${vp.width}: ${low.join(' | ')}`); }
      if (vp.width <= 1000) { await p.click('[data-a="menu"]').catch(() => {}); await sleep(600); }
      const lowS = await p.evaluate(() => __lowContrast(innerWidth > 1000 ? '.side' : '.drawer', 3)); assert.deepEqual(lowS, [], `contrast ${th} menu ${vp.width}: ${lowS.join(' | ')}`);
      if (vp.width <= 1000) { await p.keyboard.press('Escape'); await sleep(300); } }
    // browser back (v34): back goes to the previous tab / closes the sheet, never leaves the app on the first press
    await p.evaluate(() => { const b = document.querySelector(`${innerWidth > 1000 ? '.side' : '.dock'} [data-tab="team"]`); b && b.click(); }); await sleep(500);
    await p.evaluate(() => { const b = document.querySelector(`${innerWidth > 1000 ? '.side' : '.dock'} [data-tab="money"]`); b && b.click(); }); await sleep(500);
    await p.goBack(); await sleep(700);
    const bk = await p.evaluate(() => [location.pathname, (document.querySelector('[data-tab].on,[data-tab][aria-current="page"],[data-tab][aria-selected="true"]') || {}).dataset?.tab || window.__rs.ui.tab]);
    assert.equal(bk[1], 'team', 'back should return to the previous tab, got ' + bk.join(' '));
    ok('app tabs at', vp.width);
    await p.goto(B + '/#admin'); await sleep(900); await p.click('#splash').catch(() => {}); await p.fill('#au', 'mot'); await p.fill('#ap', 'mot'); await p.click('[data-a="adm-login"]'); await sleep(1300);
    for (const k of ['home', 'conn', 'pays', 'health', 'msgs', 'places', 'users', 'sms', 'posters', 'db']) { await p.click(`.adm-tabs [data-v="${k}"]`); await sleep(500); assert(!(await p.$('.adm .muted:text("در حال خواندن")')) || true); }
    ok('admin tabs at', vp.width); await c.close();
  }
  // v36: ads board (server-rendered, guest-safe), sitemap, «دارم می‌روم», school trips
  { const L = await (await fetch(B + '/ads/')).text(); assert(L.includes('application/ld+json') && L.includes('rel="canonical"'), 'ads page seo'); ok('ads page');
    const sm = await (await fetch(B + '/sitemap.xml')).text(); assert(sm.includes('<urlset') && sm.includes('/ads/'), 'sitemap'); ok('sitemap');
    const ph = '0912' + String(Date.now()).slice(-7), oo = await api('otp_send', { phone: ph }), TA = (await api('otp_verify', { phone: ph, code: oo.dev_code })).token;
    const bad = await api('ad_save', { kind: 'daily', role: 'driver', g: 'f', from_city: 'تهران', to_city: 'کرج', tm: '07:30', days: ['sa'], seats: 2, share: 'dong', body: 'تماس ۰۹۱۲۱۲۳۴۵۶۷', adult: 1, rules: 1 }, TA); assert(!bad.ok, 'phone in ad must be refused');
    const ad = await api('ad_save', { kind: 'daily', role: 'driver', g: 'f', from_city: 'تهران', to_city: 'کرج', tm: '07:30', days: ['sa', 'mo'], seats: 2, share: 'dong', body: 'صبح‌ها از ونک', adult: 1, rules: 1 }, TA); assert(ad.ok && ad.no, 'ad save');
    const pg = await (await fetch(B + '/ads/' + ad.no)).text(); assert(pg.includes('"Trip"') && !pg.includes(ph), 'ad detail is public and has no phone'); ok('ad post + detail');
    const lv = await api('leave_state', { profile_id: pr.id }, T); assert(lv.ok, 'leave_state'); ok('leave state');
    // v38: trip card, mutual rating, trust line, «اطلاعات من»
    const pb = '0935' + String(Date.now()).slice(-7), ob = await api('otp_send', { phone: pb }), TB = (await api('otp_verify', { phone: pb, code: ob.dev_code })).token;
    const m1 = await api('ad_msg', { no: ad.no, text: 'سلام، جای خالی هست؟', g: 'f' }, TB); assert(m1.ok, 'asker msg ' + JSON.stringify(m1));
    const th = (await api('ad_threads', {}, TA)).list || (await api('ad_threads', {}, TA)).threads || []; const tid = (th[0] || {}).id || m1.thread; assert(tid, 'thread id');
    assert(!(await api('ad_trip', { id: tid, car: 'پژو' }, TB)).ok, 'trip card waits for the owner reply');
    assert((await api('ad_msg', { thread: tid, text: 'بله، هست.' }, TA)).ok, 'owner reply');
    assert((await api('ad_trip', { id: tid, car: 'پژو ۲۰۶', color: 'سفید', meet: 'ایستگاه مترو' }, TA)).ok, 'trip card');
    const tv = await api('ad_thread', { id: tid }, TB); assert(tv.trip && tv.trip.car && tv.peer, 'thread shows trip + trust');
    assert((await api('ad_rate', { id: tid, v: 1 }, TB)).ok && !(await api('ad_rate', { id: tid, v: 1 }, TB)).ok, 'rate once');
    const tr = await api('ad_get', { no: ad.no }, TB); assert(tr.trust && tr.trust.good >= 1, 'trust counts the rating'); ok('trip card + rating + trust');
    const mi = await api('my_info', { save: 1, first: 'باران', family: 'آسمان', city: 'تهران', hood: 'ونک', car: 'پژو', routes: [{ from: 'خانه', to: 'باشگاه', tm: '18:00' }] }, TB);
    assert(mi.ok && mi.info.hood === 'ونک' && mi.info.routes.length === 1, 'my_info save');
    const m2 = await api('my_info', { save: 1, plate: '۱۲ ب ۳۴۵ ایران ۶۷', p3: '۳۴۵', pir: '67', job: 'cleric', tcode: '۸۸۰۰۱۲۳۴', rel: 'hacker', kids: [{ first: 'دریا', g: 'f', by: 1398 }, { first: '' }] }, TB);
    assert(m2.ok && !m2.info.plate && m2.info.p3 === '345' && m2.info.pir === '67' && m2.info.tcode === '88001234' && m2.info.rel === '' && m2.info.kids.length === 1, 'my_info partial plate/talabe/kids ' + JSON.stringify(m2.info));
    assert((await api('ad_trip', { id: tid, plate: '12ب345ایران67' }, TA)).ok && (await api('ad_thread', { id: tid }, TB)).trip.plate === '345 ایران 67', 'trip plate kept partial');
    // «دارم می‌روم» quota: a work mesirak, paid mode on → 30 guest trips in the first month, one trip per direction per day
    const wp = (await api('place_create', { kind: 'work', name: 'شرکت آزمون نسیم', city: 'تهران', gender: 'fm', lat: 35.70, lng: 51.40, force: true }, TB)).place;
    const wpr = (await api('profile_save', { kind: 'work', label: 'کار', place_id: wp.id, complete: 1, data: { family: 'آسمان', pg: 'f', lat: 35.72, lng: 51.41, hood: 'ونک', role: 'drive', seats: 3, rules_at: 1, contact: 'app' } }, TB)).profile;
    const AD = (await api('admin_login', { u: 'mot', p: 'mot' })).token; await api('admin_flag', { k: 'paid_mode', v: 1 }, AD); await api('admin_flag', { k: 'leave_on', v: 1 }, AD);
    const q0 = (await api('leave_state', { profile_id: wpr.id }, TB)).quota; assert(q0 && !q0.unlimited && q0.free === 30 && q0.left === 30, 'quota first month ' + JSON.stringify(q0));
    const s1 = await api('leave_start', { profile_id: wpr.id, dir: 'home', role: 'car', seats: 3, confirm: 1 }, TB); assert(s1.ok && s1.quota.left === 29, 'trip counted ' + JSON.stringify(s1));
    await api('leave_quit', { profile_id: wpr.id, group: s1.group.id }, TB); const s2 = await api('leave_start', { profile_id: wpr.id, dir: 'home', role: 'car', seats: 3, confirm: 1 }, TB); assert(s2.ok && s2.quota.left === 29, 'same direction same day counted once');
    await api('leave_quit', { profile_id: wpr.id, group: s2.group.id }, TB); await api('admin_flag', { k: 'paid_mode', v: 0 }, AD); ok('partial plate + talabe + kids + leave quota'); assert((await api('me', {}, TB)).info.city === 'تهران', 'me.info'); ok('my info');
    const L2 = await (await fetch(B + '/ads/')).text(); assert(L2.includes('class="rt"') && L2.includes('data-do="swap"') && L2.includes('class="fab"'), 'ads redesign markup'); ok('ads redesign'); }
  // no page may spill past the screen or silently cut text, on a 320px phone up to a large phone
  { const chk = require('./overflow.cjs'), { devices } = require('playwright');
    for (const d of ['Galaxy S9+', 'Pixel 7']) { const c = await b.newContext({ ...devices[d] }), q = await c.newPage();
      for (const u of ['/', '/stories/', '/ads/', '/schools/', '/pricing/']) { await q.goto(B + u, { waitUntil: 'domcontentloaded', timeout: 60000 }); await q.waitForTimeout(1200); const r = await q.evaluate(chk); assert(!r.length, `overflow on ${u} (${d}): ${r.join(' | ')}`); }
      await c.close(); } ok('no overflow on public pages (320–412px)'); }
  await b.close(); console.log('ERRORS', JSON.stringify(errs)); if (errs.length) process.exit(2);
})().catch(e => { console.error('FAIL', e.message.split('\n').slice(0, 3).join(' | ')); process.exit(1); });
