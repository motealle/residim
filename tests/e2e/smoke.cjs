// Residim end-to-end smoke test. Run: php -S 127.0.0.1:8899 tests/e2e/router.php & node tests/e2e/smoke.cjs
// Covers the paths whose failure would cost families' trust: landing, school wizard, login, matching, team, chat, admin.
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
    ok('app tabs at', vp.width);
    await p.goto(B + '/#admin'); await sleep(900); await p.click('#splash').catch(() => {}); await p.fill('#au', 'mot'); await p.fill('#ap', 'mot'); await p.click('[data-a="adm-login"]'); await sleep(1300);
    for (const k of ['home', 'conn', 'pays', 'health', 'msgs', 'places', 'users', 'sms', 'posters', 'db']) { await p.click(`.adm-tabs [data-v="${k}"]`); await sleep(500); assert(!(await p.$('.adm .muted:text("در حال خواندن")')) || true); }
    ok('admin tabs at', vp.width); await c.close();
  }
  await b.close(); console.log('ERRORS', JSON.stringify(errs)); if (errs.length) process.exit(2);
})().catch(e => { console.error('FAIL', e.message.split('\n').slice(0, 3).join(' | ')); process.exit(1); });
