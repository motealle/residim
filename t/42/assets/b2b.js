/* رسیدیم برای سازمان‌ها (/b2b/) — needs schools.js first (helpers + the shared panel at #panel/TOKEN).
   The page reads the live mode from the server: while Residim is free for everyone it never asks people to «pay to get it free»;
   it offers the official programme now and a locked founding price that starts only when Residim becomes paid. */
'use strict';
const B2B_CFG = {
  seatOff: .5, bigSeatOff: .6, bigSeats: 100,   // paid mode: org seat = 50% of the personal price (60% from 100 seats)
  foundingOff: .6,                              // free mode: founding seat price = 40% of the future personal price
  q: { m: [1, 0], q: [3, .10], y: [12, .25] },  // months, discount
  joinShare: .35, teamSize: 3.5, days: 22,
  fallbackPrice: 75000,
};
(async function b2b() {
  if (/^#panel\//.test(location.hash)) return;
  addEventListener('scroll', () => $('#bar').classList.toggle('sc', scrollY > 8), { passive: true });
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
  $$('.rv').forEach(el => io.observe(el));
  let cfg = {}; try { cfg = await api('cfg', {}); } catch (e) {}
  const paid = !!(cfg.flags && cfg.flags.paid_mode), ind = +cfg.sub_price || B2B_CFG.fallbackPrice;
  document.body.classList.add(paid ? 'm-paid' : 'm-free');
  $('#b-ind').textContent = money(ind); $('#b-cta').textContent = paid ? 'خرید اکانت‌ها' : 'رزرو رایگان با قیمت پیشگام';
  let plan = 'y';
  const en = s => String(s || '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/\D/g, '');
  const seatPrice = n => Math.round(ind * (paid ? 1 - (n >= B2B_CFG.bigSeats ? B2B_CFG.bigSeatOff : B2B_CFG.seatOff) : 1 - B2B_CFG.foundingOff) / 1000) * 1000;
  const calc = () => {
    const N = +$('#b-n').value, cost = +en($('#b-c').value) || 120000, share = Math.min(100, +en($('#b-s').value) || 60) / 100, C = B2B_CFG;
    const joined = N * share * C.joinShare, saveTrips = joined * (1 - 1 / C.teamSize) * 2 * C.days, save = saveTrips * cost;
    const seats = +$('#b-seat').value, [mo, off] = C.q[plan], sp = seatPrice(seats), monthly = seats * sp, total = Math.round(monthly * mo * (1 - off) / 1e4) * 1e4;
    countTo($('#b-k1'), Math.round(save / 1e5) * 1e5); countTo($('#b-k2'), Math.round(joined * (1 - 1 / C.teamSize))); countTo($('#b-k3'), Math.round(joined)); countTo($('#b-k4'), Math.max(1, Math.round(save / Math.max(1, monthly))));
    $('#b-total').textContent = money(total);
    $('#b-per').textContent = paid ? `${fa(seats)} اکانت – هر اکانت ماهی ${money(Math.round(total / mo / seats / 100) * 100)} تومان (به‌جای ${money(ind)} تومانِ هر نفر)` : `قیمت پیشگام: هر اکانت ماهی ${money(Math.round(total / mo / seats / 100) * 100)} تومان – پرداخت فقط از روزی که رسیدیم پولی شود؛ تا آن روز رایگان و بی‌تعهد.`;
    $('#b-roi').textContent = `با ${fa(Math.round(joined))} نفر در تیم‌ها، صرفه‌جویی ماهانه‌ی آدم‌هایتان حدود ${money(Math.round(save / 1e5) * 1e5)} تومان است؛ ${fa(Math.max(1, Math.round(save / Math.max(1, monthly))))} برابر هزینه‌ی ماهانه‌ی اشتراک.`;
    $('#b-no').textContent = fa(N); $('#b-seato').textContent = fa(seats); if (!$('#o-seats').value) $('#o-seats').placeholder = fa(seats);
    const g = $('#seats'); if (g && !g.childElementCount) g.innerHTML = '<i></i>'.repeat(50);
  };
  ['#b-n', '#b-c', '#b-s', '#b-seat'].forEach(s => $(s).addEventListener('input', calc));
  $$('[data-bp]').forEach(b => b.addEventListener('click', () => { plan = b.dataset.bp; $$('[data-bp]').forEach(x => x.setAttribute('aria-pressed', x === b)); $('#o-plan').value = plan; calc(); }));
  calc();
  // seats filling up, one by one (the «first come» feeling)
  const grid = $('#seats'); if (grid && !RM) { let k = 0; const tick = () => { const cells = grid.children; if (!cells.length) return; if (k >= 38) { [...cells].forEach(c => c.classList.remove('on')); k = 0; } cells[k++].classList.add('on'); setTimeout(tick, k >= 38 ? 1800 : 140); }; new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { o.disconnect(); tick(); } }).observe(grid); }
  $('#b-form').addEventListener('submit', async e => { e.preventDefault(); const v = id => ($('#' + id) || {}).value || '';
    if (!v('o-name').trim()) { toast('نام مجموعه را بنویسید.'); return $('#o-name').focus(); }
    if (en(v('o-phone')).length < 10) { toast('شماره‌ی تماس را بنویسید تا هماهنگ کنیم.'); return $('#o-phone').focus(); }
    const btn = $('#o-go'); btn.disabled = true;
    try { await api('school_lead', { src: 'org', school: v('o-name'), city: v('o-city'), role: v('o-type'), name: v('o-who'), phone: en(v('o-phone')), students: +en(v('o-n')) || 0, plan: v('o-plan'),
      note: `اکانت: ${en(v('o-seats')) || $('#b-seat').value} – ${paid ? 'خرید' : 'رزرو پیشگام'}${v('o-note') ? '\n' + v('o-note') : ''}` });
      $('#leadbox').classList.add('sent'); } catch (er) { toast(er.message); } btn.disabled = false; });
})();
