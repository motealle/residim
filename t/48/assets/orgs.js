/* /orgs: reveal on scroll, lead form (→ school_lead src=org), share */
(() => {
  const $ = s => document.querySelector(s), en = s => String(s || '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 3200); };
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' }) : null;
  document.querySelectorAll('.rv').forEach(el => io ? io.observe(el) : el.classList.add('in'));
  document.querySelectorAll('[data-src="emp"]').forEach(a => a.addEventListener('click', () => { $('#o-role').value = 'کارمند هستم؛ معرفی می‌کنم'; }));
  $('#org-form').addEventListener('submit', async e => { e.preventDefault(); const v = id => ($('#' + id) || {}).value || '';
    if (!v('o-name').trim()) { toast('نام سازمان را بنویسید.'); return $('#o-name').focus(); }
    const ph = en(v('o-phone')).replace(/\D/g, ''); if (ph.length < 10) { toast('شماره‌ی تماس را بنویسید تا هماهنگ کنیم.'); return $('#o-phone').focus(); }
    const b = $('#o-go'); b.disabled = true;
    try { const r = await fetch('/app/api/r6.php?a=school_lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ src: 'org', school: v('o-name'), city: v('o-city'), role: v('o-role'), name: v('o-person'), phone: ph, students: +en(v('o-n')).replace(/\D/g, '') || 0, note: v('o-note') }) }).then(r => r.json());
      if (!r.ok) throw new Error(r.error || 'ثبت نشد'); e.target.reset(); toast('ثبت شد؛ برای هماهنگی پایلوت تماس می‌گیریم.'); } catch (x) { toast(x.message || 'اتصال برقرار نشد؛ دوباره بزنید.'); } finally { b.disabled = false; } });
  document.querySelectorAll('[data-share]').forEach(b => b.addEventListener('click', async () => { const u = 'https://residim.ir/orgs/', t = 'ایاب‌وذهاب مشارکتی کارکنان، بدون سرویس اجاره‌ای — رسیدیم برای سازمان‌ها';
    if (navigator.share) { try { await navigator.share({ title: 'رسیدیم برای سازمان‌ها', text: t, url: u }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(t + '\n' + u); toast('لینک کپی شد.'); } catch (e) { toast(u); } }));
})();
