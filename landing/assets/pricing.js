/* Residim pricing & checkout. Prices always come from the server (cfg); what is shown here is only a label.
   The server re-reads the plan price, so a changed number in the browser cannot change what is charged. */
(() => {
  const API = '/app/api/r6.php?a=', $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const fa = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]), money = n => fa(Math.round(+n || 0).toLocaleString('en-US').replace(/,/g, '٬'));
  const en = s => String(s || '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const phone = s => { let p = en(s).replace(/\D/g, ''); if (p.startsWith('0098')) p = '0' + p.slice(4); else if (p.startsWith('98') && p.length === 12) p = '0' + p.slice(2); else if (p.startsWith('9') && p.length === 10) p = '0' + p; return /^09\d{9}$/.test(p) ? p : ''; };
  const api = async (a, body) => { const r = await fetch(API + a, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) }); const j = await r.json().catch(() => ({})); if (!r.ok || j.ok === false) throw new Error(j.message || 'ارتباط برقرار نشد؛ دوباره امتحان کنید.'); return j; };
  const GW = { zarinpal: 'زرین‌پال', sep: 'سِپ (بانک سامان)', payping: 'پی‌پینگ' };
  let CFG = { plans: { m: { price: 299000, days: 30 }, q: { price: 807000, days: 90 }, y: { price: 2018000, days: 270 } } }, plan = 'q';
  try { const s = JSON.parse(localStorage.getItem('residim-06') || '{}'); if (s.phone) $('#co-m').value = s.phone; } catch (e) {}
  const paint = () => {
    Object.entries(CFG.plans).forEach(([k, p]) => { $$(`[data-price="${k}"]`).forEach(el => el.textContent = money(p.price)); const per = $(`[data-per="${k}"]`); if (per) per.textContent = `${fa(p.days)} روز – برای هر خانواده‌ی تیم ۴ نفره ماهی حدود ${money(Math.round(p.price / (p.days / 30) / 4 / 1000) * 1000)} تومان`; });
    $$('[data-share]').forEach(el => el.textContent = `در تیم ۴ خانواده‌ای، هر خانواده حدود ${money(Math.round(CFG.plans.m.price / 4 / 1000) * 1000)} تومان`); $$('[data-trial]').forEach(el => el.textContent = fa(CFG.team_trial_days || 30));
    $$('#seg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.plan === plan));
    $('#co-total').textContent = money(CFG.plans[plan].price) + ' تومان';
    const gw = GW[CFG.pay_provider]; $('#co-pay').textContent = gw ? `پرداخت امن با ${gw}` : 'پرداخت امن آنلاین';
    $('#trial').hidden = !(CFG.flags && !CFG.flags.paid_mode);
    const c = CFG.contact || {}, box = $('#contact-box'), add = [];
    if (c.name) add.push(`<div><b>نام کسب‌وکار</b><span>${esc(c.name)}</span></div>`);
    if (c.phone) add.push(`<div><b>تلفن</b><span><bdi dir="ltr">${esc(fa(c.phone))}</bdi></span></div>`);
    if (c.email) add.push(`<div><b>ایمیل</b><span><a dir="ltr" href="mailto:${esc(c.email)}">${esc(c.email)}</a></span></div>`);
    if (c.address) add.push(`<div><b>نشانی</b><span>${esc(c.address)}</span></div>`);
    if (add.length && !box.dataset.done) { box.insertAdjacentHTML('beforeend', add.join('')); box.dataset.done = 1; }
  };
  const err = (id, m) => { const e = $(id); e.textContent = m || ''; e.hidden = !m; };
  fetch(API + 'cfg').then(r => r.json()).then(j => { if (j && j.plans) { CFG = j; paint(); } }).catch(() => {});
  paint();
  $$('[data-buy]').forEach(b => b.addEventListener('click', () => { plan = b.dataset.buy; paint(); $('#checkout').scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => $('#co-m').focus({ preventScroll: true }), 450); }));
  $('#seg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { plan = b.dataset.plan; paint(); } });
  const go = async (btn, body, eid) => { btn.disabled = true; const t = btn.textContent; btn.textContent = 'در حال اتصال به درگاه…';
    try { const r = await api('pay_start', body); if (!/^https:\/\/[a-z0-9.-]+\.(zarinpal\.com|shaparak\.ir|payping\.ir)\//i.test(r.url)) throw new Error('نشانی درگاه نامعتبر است.'); location.href = r.url; }
    catch (e) { err(eid, e.message); btn.disabled = false; btn.textContent = t; } };
  $('#checkout').addEventListener('submit', e => { e.preventDefault(); err('#co-err');
    const m = phone($('#co-m').value); if (!m) return err('#co-err', 'شماره‌ی موبایل را درست وارد کنید؛ مثل ۰۹۱۲۱۲۳۴۵۶۷.');
    if (!$('#co-a').checked) return err('#co-err', 'برای خرید، شرایط خرید و بازگشت وجه را بپذیرید.');
    go($('#co-pay'), { plan, mobile: m, name: $('#co-n').value.trim().slice(0, 80), agree: 1 }, '#co-err'); });
  $('.pr-amts').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('.pr-amts button').forEach(x => x.setAttribute('aria-pressed', x === b)); $('#dn-a').value = b.dataset.amt; });
  $('#donate-f').addEventListener('submit', e => { e.preventDefault(); err('#dn-err');
    const a = +en($('#dn-a').value).replace(/\D/g, ''); if (a < 10000) return err('#dn-err', 'کمترین مبلغ ۱۰ هزار تومان است.');
    const mv = $('#dn-m').value.trim(), m = mv ? phone(mv) : ''; if (mv && !m) return err('#dn-err', 'شماره‌ی موبایل درست نیست؛ یا خالی بگذارید.');
    go($('#donate-f button[type=submit]'), { amount: a, mobile: m }, '#dn-err'); });
  /* back from the gateway: #pay/ok|fail/REF */
  const pm = location.hash.match(/^#pay\/(ok|fail)\/([A-Za-z0-9]{1,24})$/);
  if (pm) { history.replaceState(null, '', location.pathname); const box = $('#result-in'); $('#result').hidden = false;
    const show = h => { box.innerHTML = h; $('#result').scrollIntoView({ block: 'start' }); };
    if (pm[1] === 'fail') show(`<div class="big">⚠️</div><h2 class="h2" style="margin:0">پرداخت انجام نشد</h2><p class="per">پرداخت کامل نشد یا لغو شد. اگر مبلغی از حساب‌تان کم شده، بانک حداکثر تا ۷۲ ساعت خودکار برمی‌گرداند.${pm[2] !== 'x' ? ` کد پیگیری: <b dir="ltr">${esc(pm[2])}</b>` : ''}</p><a class="btn pri" href="#checkout">دوباره امتحان کنید</a>`);
    else { show('<p class="per">در حال بررسی پرداخت…</p>');
      api('pay_status', { ref: pm[2] }).then(({ pay: p }) => {
        if (p.status !== 'paid') return show(`<div class="big">⏳</div><h2 class="h2" style="margin:0">پرداخت هنوز تأیید نشده</h2><p class="per">اگر مبلغ کم شده و تا ۷۲ ساعت برنگشت، با کد <b dir="ltr">${esc(p.ref)}</b> از پشتیبانی پیگیری کنید.</p>`);
        const sub = String(p.purpose).startsWith('sub_'), trial = CFG.flags && !CFG.flags.paid_mode;
        show(`<div class="big">🎉</div><h2 class="h2" style="margin:0">${sub ? `اعتبار ${fa(p.days)} روزه‌ی اشتراک تیم ثبت شد` : 'حمایت شما رسید؛ دمتان گرم!'}</h2>
          <p class="per">مبلغ ${money(p.amount)} تومان – شماره‌ی پیگیری بانکی <b dir="ltr">${esc(p.refid || '')}</b> – کد سفارش <b dir="ltr">${esc(p.ref)}</b></p>
          ${sub ? `<p class="per">${p.applied ? 'روی حساب‌تان نشست' : 'با همان شماره‌ی موبایل وارد رسیدیم شوید تا روی حساب‌تان بنشیند'}؛ هر وقت ماه هدیه یا اشتراک تیم‌تان تمام شود، خودکار به کار می‌افتد.${trial ? ' تا دوره‌ی آزمایشی هست، دست‌نخورده می‌ماند.' : ''}</p>` : ''}
          <a class="btn pri" href="../">ورود به رسیدیم</a>`); }).catch(e => show(`<p class="per">${esc(e.message)}</p>`)); } }
})();
