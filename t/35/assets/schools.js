/* رسیدیم برای مدارس — the /schools/ page (pitch, estimate, pricing, lead form) and the school panel (#panel/TOKEN).
   Prices and offers live in SCHOOL_CFG below: change them here, nowhere else. */
'use strict';
const SCHOOL_CFG = {
  perStudent: 4000,        // تومان برای هر دانش‌آموز در ماه
  minMonth: 1500000,       // حداقل اشتراک ماهانه
  termMonths: 4.5, termOff: .15,   // ترمی: ۴٫۵ ماه با ۱۵٪ تخفیف
  yearMonths: 9, yearOff: .25,     // سالانه (۹ ماه تحصیلی) با ۲۵٪ تخفیف
  familyValue: 75000,      // ارزش ماهانه‌ی امکانات ویژه برای هر خانواده
  pilot: '🌱 مدرسه‌های پیشگام: ماه اول رایگان',   // '' = hide
  // estimate assumptions (shown under the slider)
  carShare: .45, joinShare: .4, teamSize: 3.5, tripMin: 25, tripCost: 50000, kidsPerFamily: 1.6,
};
const API = '/app/api/r6.php?a=';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const fa = v => String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
const sep = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
const money = n => fa(sep(n));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const toast = t => { const el = $('#toast'); if (!el) return; el.textContent = t; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 3200); };
async function api(a, body) { const r = await fetch(API + a, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) }); const j = await r.json().catch(() => ({ ok: false, message: 'سرور پاسخ درستی نداد.' })); if (!j.ok) throw new Error(j.message || 'خطا'); return j; }
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
function countTo(el, to, ms = 1100) { if (RM) { el.textContent = fa(sep(to)); return; } const t0 = performance.now(), from = +(el.dataset.v || 0); el.dataset.v = to;
  const step = t => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = fa(sep(from + (to - from) * e)); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }

/* ───────── pitch page ───────── */
function pitch() {
  addEventListener('scroll', () => $('#bar').classList.toggle('sc', scrollY > 8), { passive: true });
  const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; e.target.classList.add('in'); e.target.querySelectorAll('[data-count]').forEach(c => countTo(c, +c.dataset.count)); io.unobserve(e.target); }), { threshold: .15 });
  $$('.rv').forEach(el => io.observe(el));
  let plan = 'y', st = 600;
  const calc = () => {
    const C = SCHOOL_CFG, fam = st / C.kidsPerFamily, carsNow = fam * C.carShare, joined = carsNow * C.joinShare, saved = joined * (1 - 1 / C.teamSize);
    const tripsSavedMonth = joined * (1 - 1 / C.teamSize) * 10 * 4;
    countTo($('#k-cars'), Math.round(saved)); countTo($('#k-hours'), Math.round(tripsSavedMonth * C.tripMin / 60)); countTo($('#k-money'), Math.round(tripsSavedMonth * C.tripCost / 1e5) * 1e5); countTo($('#k-fam'), Math.round(joined));
    $('#h-now').textContent = fa(Math.round(carsNow)); $('#h-after').textContent = fa(Math.round(carsNow - saved));
    const month = Math.max(C.minMonth, Math.round(st * C.perStudent / 1e5) * 1e5);
    const P = { m: [month, 1, 'در ماه'], t: [month * C.termMonths * (1 - C.termOff), C.termMonths, 'برای یک ترم'], y: [month * C.yearMonths * (1 - C.yearOff), C.yearMonths, 'برای یک سال تحصیلی'] }[plan];
    const total = Math.round(P[0] / 1e5) * 1e5, perMonth = total / P[1];
    $('#p-total').textContent = money(total);
    $('#p-per').textContent = `${P[2]} – یعنی ماهی ${money(perMonth)} تومان؛ برای هر دانش‌آموز ماهی ${money(Math.round(perMonth / st / 100) * 100)} تومان.`;
    $('#p-worth').innerHTML = `ارزش امکانات ویژه‌ای که <b>${fa(Math.round(fam))}</b> خانواده‌ی مدرسه رایگان می‌گیرند: <b>ماهی ${money(Math.round(fam * C.familyValue / 1e5) * 1e5)} تومان</b>؛ یعنی <b>${fa(Math.max(1, Math.round(fam * C.familyValue / perMonth)))} برابر</b> هزینه‌ی مدرسه.`;
    $('#f-st').value = fa(st);
  };
  $$('[data-st]').forEach(r => r.addEventListener('input', () => { st = +r.value; $$('[data-st]').forEach(x => { x.value = st; const o = $('#' + x.id + 'o'); if (o) o.textContent = fa(st); }); calc(); }));
  $$('[data-plan]').forEach(b => b.addEventListener('click', () => { plan = b.dataset.plan; $$('[data-plan]').forEach(x => x.setAttribute('aria-pressed', x === b)); $('#f-plan').value = plan; calc(); }));
  $('#lbl-t').textContent = fa(Math.round(SCHOOL_CFG.termOff * 100)) + '٪ تخفیف'; $('#lbl-y').textContent = fa(Math.round(SCHOOL_CFG.yearOff * 100)) + '٪ تخفیف';
  if (!SCHOOL_CFG.pilot) $('#pilot').remove(); else $('#pilot').textContent = SCHOOL_CFG.pilot;
  calc();
  // lead form: «از طرف مدرسه» / «والد هستم»
  let src = 'school';
  const tab = t => { src = t; $$('[data-tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === t)); $$('.s-only').forEach(e => e.hidden = t !== 'school'); $$('.p-only').forEach(e => e.hidden = t !== 'parent');
    $('#f-go').textContent = t === 'school' ? 'ثبت درخواست' : 'معرفی مدرسه به رسیدیم'; $('#f-phone').placeholder = t === 'school' ? '09…' : 'اختیاری'; };
  $$('[data-tab]').forEach(b => b.addEventListener('click', () => tab(b.dataset.tab)));
  $$('[data-tab-go]').forEach(a => a.addEventListener('click', () => tab(a.dataset.tabGo)));
  if (/parent/.test(location.hash)) tab('parent');
  const en = s => String(s || '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  $('#lead-form').addEventListener('submit', async e => { e.preventDefault(); const v = id => ($('#' + id) || {}).value || '';
    if (!v('f-school').trim()) { toast('نام مدرسه را بنویسید.'); return $('#f-school').focus(); }
    if (src === 'school' && en(v('f-phone')).replace(/\D/g, '').length < 10) { toast('شماره‌ی تماس را بنویسید تا هماهنگ کنیم.'); return $('#f-phone').focus(); }
    const btn = $('#f-go'); btn.disabled = true;
    try { await api('school_lead', { src, school: v('f-school'), city: v('f-city'), role: src === 'school' ? v('f-role') : 'والد', name: v('f-name'), phone: en(v('f-phone')), students: +en(v('f-st')).replace(/\D/g, '') || 0, plan: src === 'school' ? v('f-plan') : '', code: v('f-code'),
      note: (v('f-note') + ($('#f-ins') && $('#f-ins').checked && src === 'school' ? '\n[بیمه‌ی سرنشین برایمان مهم است]' : '')).trim() });
      $('#leadbox').classList.add('sent'); $('#leadbox').scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' }); }
    catch (er) { toast(er.message); } btn.disabled = false; });
  const msg = () => `سلام. «رسیدیم» برنامه‌ی سرویس مشارکتی مدرسه است: خانواده‌های هم‌محله بچه‌ها را نوبتی می‌برند و می‌آورند، رسیدن هر کودک ثبت می‌شود و دم در خلوت‌تر می‌شود. پیشنهاد می‌کنم برای مدرسه‌ی ما فعالش کنیم:\nhttps://residim.ir/schools/`;
  $('[data-share]').addEventListener('click', async () => { if (navigator.share) { try { await navigator.share({ title: 'رسیدیم برای مدارس', text: msg() }); return; } catch (e) { if (e.name === 'AbortError') return; } } copy(); });
  const copy = async () => { try { await navigator.clipboard.writeText(msg()); toast('متن و لینک کپی شد؛ برای مدیر مدرسه بفرستید.'); } catch (e) { toast('کپی نشد؛ لینک: residim.ir/schools'); } };
  $('[data-copy]').addEventListener('click', copy);
}

/* ───────── school panel (#panel/TOKEN) — aggregated data only ───────── */
/** Printable «sponsored» poster: «اشتراک رسیدیم برای … رایگان شد» */
function sponsorPoster(D, W) {
  const pl = D.place; let q = ''; try { const c = qrcode(0, 'M'); c.addData('https://residim.ir/' + pl.code); c.make(); q = c.createSvgTag({ cellSize: 6, margin: 1, scalable: true }); } catch (e) {}
  const el = document.createElement('div'); el.id = 'spons';
  el.innerHTML = `<div class="sp-top"><img src="../assets/icon.svg?v=35" alt=""><b>رسیدیم</b></div><h1>اشتراک ویژه‌ی «رسیدیم» برای ${W.who} <span>${esc(pl.name)}</span> رایگان شد!</h1>
    <p class="sp-sub">${W.edu ? 'بچه‌ها را با خانواده‌های هم‌محله نوبتی ببرید و بیاورید؛' : 'با هم‌مسیرهای همین مجموعه با هم بروید، با هم برگردید؛'} منظم، با برنامه‌ی روزانه و هفتگی و سهم منصفانه‌ی هزینه.</p>
    <div class="sp-qr">${q}</div><p class="sp-url">residim.ir/${esc(pl.code)}</p>
    ${D.seats ? `<p class="sp-seats">ظرفیت: ${fa(D.seats)} اکانت – تا پر نشده ثبت‌نام کنید</p>` : ''}<p class="sp-by">با حمایت ${esc(pl.name)}</p>`;
  document.body.appendChild(el); document.body.classList.add('print-spons'); const done = () => { el.remove(); document.body.classList.remove('print-spons'); removeEventListener('afterprint', done); }; addEventListener('afterprint', done); setTimeout(() => print(), 120);
}
async function panel(token) {
  document.title = 'پنل – رسیدیم'; $('#bar nav').remove(); $('#bar .btn').textContent = 'رسیدیم برای مدارس'; $('#bar .btn').href = './';
  const main = $('#page'); main.innerHTML = '<section class="pn"><div class="wrap"><p class="lead">در حال بارگذاری پنل…</p></div></section>';
  let D; try { D = await api('school_dash', { token }); } catch (e) { main.innerHTML = `<section class="pn"><div class="wrap"><h1 class="h2">پنل باز نشد</h1><p class="lead">${esc(e.message)}</p></div></section>`; return; }
  const draw = () => {
    const edu = ['school', 'kinder'].includes(D.place.kind), W = { edu, org: edu ? 'مدرسه' : 'مجموعه', fam: edu ? 'خانواده' : 'عضو', who: edu ? 'خانواده‌های' : D.place.kind === 'work' ? 'همکاران' : 'اعضای' };
    const pl = D.place, on = pl.plan_until * 1000 > Date.now(), until = on ? new Date(pl.plan_until * 1000).toLocaleDateString('fa-IR') : '';
    const kp = (n, t) => `<div class="card kp c3"><b data-n="${n}">۰</b><span>${t}</span></div>`;
    const maxW = Math.max(1, ...D.week), dirN = ['شمال', 'شمال‌شرق', 'شرق', 'جنوب‌شرق', 'جنوب', 'جنوب‌غرب', 'غرب', 'شمال‌غرب'], mx = Math.max(1, ...D.dir.map(v => Math.max(0, v)));
    const comp = D.dir.map((v, i) => { const a = (i * 45 - 90) * Math.PI / 180, r = 20 + 90 * Math.max(0, v) / mx, x = 120 + Math.cos(a) * r, y = 120 + Math.sin(a) * r; return [x, y, v, i]; });
    const poly = comp.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    main.innerHTML = `<section class="pn"><div class="wrap">
      <div class="pn-h"><div><span class="kicker">پنل ${W.org}</span><h1>${esc(pl.name)}${pl.city ? `<small style="font-size:.9rem;color:var(--mut)"> – ${esc(pl.city)}</small>` : ''}</h1></div>
        <div class="no-print" style="display:flex;gap:8px;flex-wrap:wrap"><span class="badge ${on ? 'on' : 'off'}">${on ? `✓ اشتراک فعال تا ${until}` : 'اشتراک فعال نیست'}</span><button class="btn sm ghost" data-print>چاپ گزارش</button></div></div>
      <div class="pn-grid">
        ${kp(D.families, edu ? 'خانواده‌ی ثبت‌نام‌شده' : 'عضو ثبت‌نام‌کرده')}${edu ? kp(D.kids, 'دانش‌آموز در رسیدیم') : kp(D.seats ? Math.max(0, D.seats - D.seats_used) : D.teams, D.seats ? 'اکانت اهدایی باقی‌مانده' : 'تیم')}${kp(D.active_teams, 'تیم فعال (۱۴ روز اخیر)')}${kp(D.cars_saved_day, 'خودروی کمتر دم در، هر روز')}
        ${kp(D.trips_month, 'سفر تمام‌شده در ۳۰ روز')}${kp(D.rides, edu ? 'بار رساندن دانش‌آموز' : 'بار رسیدن به مقصد')}${kp(D.in_team, (edu ? 'خانواده' : 'عضو') + ' در تیم')}${kp(D.urgent_month, 'پیام فوری در ۳۰ روز')}
        <div class="card c8"><h2>سفرهای هفتگی (۸ هفته‌ی اخیر)</h2><div class="bars" style="height:160px">${D.week.map(w => `<i style="--h:${Math.max(4, Math.round(100 * w / maxW))}%" title="${fa(w)}"></i>`).join('')}</div></div>
        <div class="card c4"><h2>از کجای شهر می‌آیند</h2><svg class="compass" viewBox="0 0 240 240" font-family="Vazirmatn"><circle cx="120" cy="120" r="110" fill="#F7F9F6" stroke="#E2E9E4"/><circle cx="120" cy="120" r="65" fill="none" stroke="#E2E9E4"/>
          <polygon points="${poly}" fill="#1DBF7340" stroke="#1DBF73" stroke-width="3"/>${comp.map(([x, y, v, i]) => `<text x="${(120 + Math.cos((i * 45 - 90) * Math.PI / 180) * 104).toFixed(0)}" y="${(124 + Math.sin((i * 45 - 90) * Math.PI / 180) * 104).toFixed(0)}" text-anchor="middle" font-size="9" fill="#5B6B62">${dirN[i]}</text>`).join('')}<circle cx="120" cy="120" r="10" fill="#04140B"/></svg>
          <p class="note">فاصله تا مدرسه: ${['زیر ۱ کیلومتر', '۱ تا ۳', '۳ تا ۶', 'بیش از ۶ کیلومتر'].map((t, i) => `${t}: <b>${D.dist[i] < 0 ? 'کمتر از ۳' : fa(D.dist[i])}</b>`).join(' – ')}</p></div>
        <div class="card c6"><h2>محله‌های پرتکرار</h2>${D.hoods.length ? `<div class="hb">${D.hoods.map(([h, n]) => `<div><span>${esc(h)}</span><i style="width:${Math.round(100 * n / D.hoods[0][1])}%"></i><b>${fa(n)}</b></div>`).join('')}</div>` : '<p class="note">هنوز محله‌ای با دست‌کم سه خانواده نیست.</p>'}
          <p class="note">نقش‌ها: ${fa(D.roles.drive || 0)} راننده – ${fa(D.roles.both || 0)} راننده و هزینه – ${fa(D.roles.pay || 0)} فقط هزینه</p></div>
        <div class="card c6 no-print"><h2>📣 پیام به همه‌ی ${edu ? 'خانواده‌ها' : 'اعضا'}</h2><textarea id="bc" maxlength="220" placeholder="مثلاً: فردا به‌دلیل جلسه‌ی شورای مدرسه، تعطیلی ساعت ۱۲ است."></textarea><button class="btn pri sm" data-bc ${on ? '' : 'disabled'} style="margin-top:8px">فرستادن</button><p class="note">هر دو روز یک پیام؛ در «دعوت‌ها و پیام‌ها»ی اپ هر خانواده.${pl.bc_at ? ' آخرین پیام: ' + new Date(pl.bc_at * 1000).toLocaleDateString('fa-IR') : ''}</p></div>
        <div class="card c6 no-print"><h2>🏆 لیگ و 📻 رادیوی «راه مدرسه»</h2><label class="sw"><span><b>لیگ راه مدرسه</b><br><small class="note">معمای روزانه و ستاره‌ی تیم‌ها</small></span><input type="checkbox" data-league ${pl.league ? 'checked' : ''} ${on ? '' : 'disabled'}></label>
          <div class="rlist">${pl.radio.map((e, i) => `<div><span>🎧 ${esc(e.title)}</span><button class="btn sm ghost" data-rdel="${i}" ${on ? '' : 'disabled'}>حذف</button></div>`).join('') || '<p class="note">هنوز اپیزودی نگذاشته‌اید.</p>'}</div>
          <div class="form" style="gap:8px"><input id="r-t" placeholder="عنوان اپیزود (مثلاً قصه‌ی صبح شنبه)" maxlength="80" style="font:inherit;padding:10px;border-radius:12px;border:1.5px solid var(--line)"><input id="r-u" dir="ltr" placeholder="https://… لینک فایل صوتی (mp3)" style="font:inherit;padding:10px;border-radius:12px;border:1.5px solid var(--line)"><button class="btn sm dark" data-radd ${on ? '' : 'disabled'}>افزودن به رادیو</button></div></div>
        <div class="card c6"><h2>🖨️ پوستر و لینک ${W.org}</h2>${D.seats ? `<p>اکانت‌های اهدایی: <b>${fa(D.seats_used)} از ${fa(D.seats)}</b> استفاده شده؛ به ترتیب ثبت‌نام.</p><div style="height:10px;border-radius:6px;background:var(--bg);overflow:hidden;margin:6px 0 10px"><i style="display:block;height:100%;width:${Math.min(100, Math.round(100 * D.seats_used / D.seats))}%;background:var(--g)"></i></div>` : ''}<p>لینک ثبت‌نام ${edu ? 'خانواده‌ها' : 'اعضا'}: <b dir="ltr">residim.ir/${esc(pl.code)}</b></p><div id="qr" style="width:150px;margin:10px 0"></div><div class="no-print" style="display:flex;gap:8px;flex-wrap:wrap">${on ? `<button class="btn sm dark" data-spons>پوستر «رایگان شد» برای ${W.who.replace('‌های', 'ها').replace('اعضای', 'اعضا')}</button>` : ''}<a class="btn sm pri" href="../${esc(pl.code)}" target="_blank" rel="noopener">باز کردن صفحه‌ی ${W.org}</a></div></div>
        <div class="card c6"><h2>🔒 حریم خصوصی</h2><p class="note" style="font-size:.92rem">این پنل فقط عددهای تجمیعی دارد. گروه‌های کمتر از سه خانواده نشان داده نمی‌شوند. این لینک را فقط در اختیار مدیریت مدرسه بگذارید.</p></div>
      </div></div></section>`;
    $$('[data-n]').forEach(el => countTo(el, +el.dataset.n)); requestAnimationFrame(() => $$('.bars').forEach(b => b.parentElement.classList.add('in')));
    try { const q = qrcode(0, 'M'); q.addData('https://residim.ir/' + pl.code); q.make(); $('#qr').innerHTML = q.createSvgTag({ cellSize: 4, margin: 1, scalable: true }); } catch (e) {}
    const set = async body => { try { D = await api('school_set', { token, ...body }); draw(); toast('ذخیره شد.'); } catch (e) { toast(e.message); } };
    $('[data-print]').onclick = () => print(); const sp = $('[data-spons]'); if (sp) sp.onclick = () => sponsorPoster(D, W);
    const lg = $('[data-league]'); if (lg) lg.onchange = () => set({ league: lg.checked ? 1 : 0 });
    $$('[data-rdel]').forEach(b => b.onclick = () => set({ radio: pl.radio.filter((_, i) => i !== +b.dataset.rdel) }));
    const ra = $('[data-radd]'); if (ra) ra.onclick = () => { const t = $('#r-t').value.trim(), u = $('#r-u').value.trim(); if (!t || !/^https:\/\//.test(u)) return toast('عنوان و لینک https فایل صوتی را بنویسید.'); set({ radio: [...pl.radio, { title: t, src: u }] }); };
    const bc = $('[data-bc]'); if (bc) bc.onclick = async () => { const t = $('#bc').value.trim(); if (t.length < 8) return toast('پیام کوتاه است.'); bc.disabled = true; try { const r = await api('school_broadcast', { token, text: t }); toast(`پیام به ${fa(r.n)} خانواده رسید.`); D = await api('school_dash', { token }); draw(); } catch (e) { toast(e.message); bc.disabled = false; } };
  };
  draw();
}

const pm = location.hash.match(/^#panel\/([A-Za-z0-9]{16,40})/);
if (pm) panel(pm[1]); else if (document.body.dataset.page !== 'b2b') pitch();
