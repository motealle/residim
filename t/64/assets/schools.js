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
  el.innerHTML = `<div class="sp-top"><img src="../assets/icon.svg?v=64" alt=""><b>رسیدیم</b></div><h1>اشتراک ویژه‌ی «رسیدیم» برای ${W.who} <span>${esc(pl.name)}</span> رایگان شد!</h1>
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
        <div class="card c6 no-print"><h2>📣 پیام به همه‌ی ${edu ? 'خانواده‌ها' : 'اعضا'}</h2><textarea id="bc" maxlength="220" placeholder="مثلاً: فردا به‌دلیل جلسه‌ی شورای مدرسه، تعطیلی ساعت ۱۲ است."></textarea><button class="btn pri sm" data-bc ${on ? '' : 'disabled'} style="margin-top:8px">فرستادن</button><p class="note">هر دو روز یک پیام؛ با اعلان گوشی و در «دعوت‌ها و پیام‌ها»ی اپ هر خانواده. برای اطلاعیه، دعوت به جلسه یا معرفی برنامه‌های مدرسه.${pl.bc_at ? ' آخرین پیام: ' + new Date(pl.bc_at * 1000).toLocaleDateString('fa-IR') : ''}</p></div>
        <div class="card c6 no-print"><h2>🏆 لیگ و 📻 رادیوی «راه مدرسه»</h2><label class="sw"><span><b>لیگ راه مدرسه</b><br><small class="note">معمای روزانه و ستاره‌ی تیم‌ها</small></span><input type="checkbox" data-league ${pl.league ? 'checked' : ''} ${on ? '' : 'disabled'}></label>
          <div class="rlist">${pl.radio.map((e, i) => `<div><span>🎧 ${esc(e.title)}</span><button class="btn sm ghost" data-rdel="${i}" ${on ? '' : 'disabled'}>حذف</button></div>`).join('') || '<p class="note">هنوز اپیزودی نگذاشته‌اید.</p>'}</div>
          <div class="form" style="gap:8px"><input id="r-t" placeholder="عنوان اپیزود (مثلاً قصه‌ی صبح شنبه)" maxlength="80" style="font:inherit;padding:10px;border-radius:12px;border:1.5px solid var(--line)"><input id="r-u" dir="ltr" placeholder="https://… لینک فایل صوتی (mp3)" style="font:inherit;padding:10px;border-radius:12px;border:1.5px solid var(--line)"><button class="btn sm dark" data-radd ${on ? '' : 'disabled'}>افزودن به رادیو</button></div></div>
        <div class="card c6"><h2>🖨️ پوستر و لینک ${W.org}</h2>${D.seats ? `<p>اکانت‌های اهدایی: <b>${fa(D.seats_used)} از ${fa(D.seats)}</b> استفاده شده؛ به ترتیب ثبت‌نام.</p><div style="height:10px;border-radius:6px;background:var(--bg);overflow:hidden;margin:6px 0 10px"><i style="display:block;height:100%;width:${Math.min(100, Math.round(100 * D.seats_used / D.seats))}%;background:var(--g)"></i></div>` : ''}<p>لینک ثبت‌نام ${edu ? 'خانواده‌ها' : 'اعضا'}: <b dir="ltr">residim.ir/${esc(pl.code)}</b></p><div id="qr" style="width:150px;margin:10px 0"></div><div class="no-print" style="display:flex;gap:8px;flex-wrap:wrap">${on ? `<button class="btn sm dark" data-spons>پوستر «رایگان شد» برای ${W.who.replace('‌های', 'ها').replace('اعضای', 'اعضا')}</button>` : ''}<a class="btn sm pri" href="../${esc(pl.code)}" target="_blank" rel="noopener">باز کردن صفحه‌ی ${W.org}</a></div></div>
        <div class="card c12 no-print perks"><h2>✨ ${on ? 'آنچه اشتراک شما باز کرده' : 'با اشتراک ' + W.org + ' باز می‌شود'}</h2><div class="pk">${[['🎁', 'همه مهمانِ شما', 'هر خانواده همه‌ی امکاناتِ ویژه‌ی رسیدیم را رایگان دارد و در اپ می‌بیند «مهمانِ ' + esc(pl.name) + '».'], ['🎒', 'اردو با ماشین خانواده‌ها', 'اعلام، پاسخ و چیدن خودکار ماشین‌ها با قانون محرم و نامحرم.'], ['📣', 'پیام به همه با اعلان', 'اطلاعیه، دعوت به جلسه، تعطیلی و برنامه‌ها.'], ['👥', 'کادر با دسترسی کامل', 'تا ۵ شماره: مدیر پنل، یا کادری که امکانات کامل دارد.'], ['🏷️', 'لوگوی مدرسه در اپ خانواده‌ها', 'کنار «مهمانِ ' + esc(pl.name) + ' هستید» و پیام‌های مدرسه.'], ['🖨️', 'پوستر و لینک اختصاصی', 'برای گروه‌های کلاس و تابلوی اعلانات.'], ['📊', 'گزارش ترافیک دمِ در', 'سفرها، محله‌ها و ماشین‌های کمتر.']].map(([i, t, d]) => `<div><b>${i} ${t}</b><span>${d}</span></div>`).join('')}</div></div>
        <div class="card c6 no-print" id="staff-slot"><h2>👥 کادر مدرسه</h2><p class="note">در حال بارگذاری…</p></div>
        <div class="card c6 no-print"><h2>🏷️ لوگوی ${W.org}</h2><p class="note">خانواده‌ها لوگو را کنار «مهمانِ ${esc(pl.name)} هستید» و پیام‌های مدرسه در اپ می‌بینند. تصویر مربع، PNG یا JPG.</p><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><img id="lg-prev" alt="" width="72" height="72" style="border-radius:18px;background:var(--bg);object-fit:contain" ${pl.logo ? `src="${esc(pl.logo)}"` : 'hidden'}><label class="btn ghost sm" style="cursor:pointer">انتخاب تصویر<input type="file" id="lg-in" accept="image/png,image/jpeg,image/webp" hidden ${on ? '' : 'disabled'}></label>${pl.logo ? '<button class="btn ghost sm" id="lg-del">برداشتن</button>' : ''}</div>${on ? '' : '<p class="note">ویژه‌ی اشتراک.</p>'}</div>
        ${D.fleet ? `<div class="card c12 no-print"><h2>🗺️ همکاران روی نقشه</h2><p class="note">${fa(D.fleet.length)} نفر · نقطه‌ی سبز: ماشین‌دار، آبی: بی‌ماشین؛ دایره‌های هاله‌ای یعنی آن همکار خواسته فقط محدوده‌اش دیده شود.</p><div id="fleet-map" class="fleet-map"></div></div>` : ''}
        ${edu ? `<div class="card c12 no-print" id="ordu-slot"><h2>🎒 اردوی دانش‌آموزی و خانوادگی</h2><p class="note">در حال بارگذاری…</p></div>` : ''}
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
    if (edu) orduPanel(token, on);
    staffPanel(token, on);
    if (D.fleet && D.fleet.length) fleetMap(D);
    // preview before buying: every control is shown, none acts
    if (D.demo) { main.querySelectorAll('.card input, .card textarea, .card select, .card button').forEach(e => { e.disabled = true; }); const isOrg = pl.kind === 'work' || pl.kind === 'uni';
      main.insertAdjacentHTML('afterbegin', `<div class="demo-bar no-print"><b>🔍 پیش‌نمایش پنل «رسیدیم ${isOrg ? 'سازمان' : 'مدرسه'}»</b><span>همه‌ی بخش‌ها همان پنل واقعی است؛ داده‌ها نمونه‌اند و دکمه‌ها در پیش‌نمایش کار نمی‌کنند.</span><a class="btn pri sm" href="${isOrg ? '/orgs/' : '/schools/'}#lead">پنل رایگانِ خودمان</a></div>`); }
    // trial → two free 30-day extensions (announcements stay off during an extension; buying turns them back on)
    { const tier = pl.plan_tier || '', left = pl.plan_until * 1000 - Date.now(), box = main.querySelector('.pn-h .no-print');
      if (box && /^(trial|ext1|ext2)$/.test(tier)) box.insertAdjacentHTML('afterbegin', `<span class="badge on">${tier === 'trial' ? '🎁 ماه رایگان' : '⏳ تمدید رایگان'}</span>${tier !== 'ext2' && left < 7 * 864e5 ? '<button class="btn sm dark" data-ext>تمدید رایگانِ ۳۰ روز</button>' : ''}`);
      const ex = main.querySelector('[data-ext]'); if (ex && !D.demo) ex.onclick = async () => { ex.disabled = true; try { const r = await api('school_extend', { token }); toast('۳۰ روز تمدید شد؛ در این مدت اطلاعیه غیرفعال است.'); setTimeout(() => location.reload(), 900); } catch (e) { toast(e.message); ex.disabled = false; } };
      if (/^ext/.test(tier)) { const bc = main.querySelector('[data-bc]'); if (bc) { bc.disabled = true; bc.insertAdjacentHTML('afterend', '<p class="note">در دوره‌ی تمدید رایگان، اطلاعیه و پیام غیرفعال است؛ با خرید اشتراک دوباره باز می‌شود.</p>'); } } }
    const li = $('#lg-in'); if (li) li.onchange = () => { const f = li.files[0]; if (!f) return; const img = new Image(); img.onload = async () => { const c = document.createElement('canvas'), z = 256, k = Math.min(1, z / Math.max(img.width, img.height)); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const d = c.toDataURL('image/png'); try { const r = await api('school_logo', { token, data: d.length > 150000 ? c.toDataURL('image/jpeg', .85) : d }); $('#lg-prev').src = r.logo; $('#lg-prev').hidden = false; toast('لوگو ذخیره شد.'); } catch (e) { toast(e.message); } }; img.src = URL.createObjectURL(f); };
    const ld = $('#lg-del'); if (ld) ld.onclick = async () => { try { await api('school_logo', { token, data: '' }); $('#lg-prev').hidden = true; ld.remove(); } catch (e) { toast(e.message); } };
  };
  draw();
}
/* staff numbers: «admin» opens this panel from their own Residim menu; everyone listed gets full access while the plan runs */
async function staffPanel(token, on) {
  const el = $('#staff-slot'); if (!el) return; let L;
  try { L = (await api('school_staff', { token })).list; } catch (e) { el.innerHTML = `<h2>👥 کادر مدرسه</h2><p class="note">${esc(e.message)}</p>`; return; }
  el.innerHTML = `<h2>👥 کادر مدرسه</h2><p class="note">شماره‌ی مدیر، معاون یا مربیان را بگذارید. «مدیر پنل» این پنل را از منوی رسیدیمِ خودش باز می‌کند و دیگر به این پیوند نیاز ندارد. همه‌ی این شماره‌ها، تا وقتی اشتراک فعال است، امکانات کامل فردی و تیمی دارند.</p>
    <div class="od-k">${L.map(x => `<span dir="ltr">${esc(x.phone)} · ${x.role === 'admin' ? 'مدیر پنل' : 'کادر'} <button class="link" data-sdel="${esc(x.raw)}" aria-label="حذف">✕</button></span>`).join('') || '<span>هنوز شماره‌ای نیست.</span>'}</div>
    <div class="form" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><input id="st-ph" inputmode="tel" dir="ltr" placeholder="۰۹۱۲…" style="font:inherit;padding:10px;border-radius:12px;border:1.5px solid var(--line)"><select id="st-r" style="font:inherit;padding:10px;border-radius:12px;border:1.5px solid var(--line)"><option value="admin">مدیر پنل</option><option value="staff">کادر (امکانات کامل)</option></select><button class="btn pri sm" id="st-add" ${on ? '' : 'disabled'}>افزودن</button></div>${on ? '' : '<p class="note">ویژه‌ی اشتراک.</p>'}`;
  const call = async b => { try { await api('school_staff', { token, ...b }); staffPanel(token, on); } catch (e) { toast(e.message); } };
  const ad = $('#st-add'); if (ad) ad.onclick = () => call({ op: 'add', phone: $('#st-ph').value, role: $('#st-r').value });
  $$('[data-sdel]').forEach(b => b.onclick = () => call({ op: 'del', phone: b.dataset.sdel }));
}
/* اردو: the school announces, families answer in the app, one click arranges cars by home proximity and the mahram rules */
async function orduPanel(token, on) {
  const el = $('#ordu-slot'); if (!el) return; let L;
  try { L = (await api('school_ordu', { token, op: 'list' })).list; } catch (e) { el.innerHTML = `<h2>🎒 اردو</h2><p class="note">${esc(e.message)}</p>`; return; }
  const row = o => { const s = o.stats, pl = o.plan; return `<div class="od-row"><div class="od-h"><b>${esc(o.title)}</b><span class="note">${esc(o.date_t)}، ساعت ${esc(o.time_t)} · ${esc(o.dest)} · ${o.who === 'family' ? 'خانوادگی' : 'دانش‌آموزی'}${o.status !== 'open' ? ' · بسته' : ''}</span></div>
    <div class="od-k"><span><b>${fa(s.answered)}</b> از ${fa(s.families)} پاسخ</span><span><b>${fa(s.going)}</b> خانواده می‌آیند</span><span><b>${fa(s.kids)}</b> دانش‌آموز</span>${o.who === 'family' ? `<span><b>${fa(s.adults)}</b> بزرگسال</span>` : ''}<span><b>${fa(s.drivers)}</b> ماشین · ${fa(s.seats)} جای خالی</span><span><b>${fa(s.need)}</b> نفر جا لازم دارند</span><span><b>${fa(s.self)}</b> خودشان می‌روند</span></div>
    ${pl ? `<p class="note">چیدمان (${new Date(pl.at * 1000).toLocaleString('fa-IR')}): <b>${fa(pl.cars.length)} ماشین</b>، ${fa(pl.cars.reduce((a, c) => a + c.families, 0))} خانواده در ماشین‌ها${pl.bus_people ? ` · <b>${fa(pl.bus_people)} نفر</b> (${fa(pl.bus_families)} خانواده) بی‌جا ماندند: برای‌شان سرویس یا اتوبوس بگیرید.` : ' · همه جا دارند.'} هر ماشین یک گفتگوی خودش را دارد.</p>` : ''}
    ${o.status === 'open' ? `<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm pri" data-oplan="${o.id}" ${on ? '' : 'disabled'}>${pl ? 'چیدن دوباره‌ی ماشین‌ها' : 'چیدن ماشین‌ها'}</button><button class="btn sm ghost" data-oclose="${o.id}">بستن</button></div>` : ''}</div>`; };
  const inp = (id, ph, t = 'text', x = '') => `<input id="${id}" type="${t}" placeholder="${ph}" ${x} style="font:inherit;padding:10px;border-radius:12px;border:1.5px solid var(--line)">`;
  el.innerHTML = `<h2>🎒 اردوی دانش‌آموزی و خانوادگی</h2><p class="note">اردو را اعلام کنید. خانواده‌ها در اپ پاسخ می‌دهند: می‌آیند یا نه، چند نفر، ماشین دارند یا جا می‌خواهند. با یک کلیک، ماشین‌ها با نزدیکیِ خانه‌ها چیده می‌شوند. بزرگسالِ نامحرم و دختر و پسرِ بزرگ‌تر در یک ماشین نمی‌نشینند. باقی‌مانده یعنی تعداد صندلیِ اتوبوسی که لازم دارید. مدرسه فقط عددها را می‌بیند.</p>
    ${L.map(row).join('') || '<p class="note">هنوز اردویی اعلام نشده است.</p>'}
    <details ${L.length ? '' : 'open'} style="margin-top:12px"><summary><b>+ اعلام اردوی تازه</b></summary><div class="form" style="gap:8px;margin-top:10px">${inp('o-t', 'نام اردو (مثلاً اردوی باغ کتاب)')}${inp('o-d', 'مقصد')}${inp('o-at', '', 'datetime-local')}${inp('o-b', 'ساعت برگشت (مثلاً 14:00)', 'text', 'dir="ltr"')}${inp('o-m', 'جای جمع شدن (مثلاً درِ اصلی مدرسه)')}${inp('o-c', 'هزینه‌ی هر نفر به تومان (اختیاری)', 'number')}
      <select id="o-w" style="font:inherit;padding:10px;border-radius:12px;border:1.5px solid var(--line)"><option value="kids">دانش‌آموزی (بچه‌ها با رانندگانِ داوطلب)</option><option value="family">خانوادگی (خانواده‌ها با هم)</option></select>
      <textarea id="o-n" maxlength="400" placeholder="توضیح کوتاه برای خانواده‌ها"></textarea><button class="btn pri sm" data-osave ${on ? '' : 'disabled'}>اعلام به همه‌ی خانواده‌ها</button>${on ? '' : '<p class="note">اردو ویژه‌ی اشتراک مدرسه است.</p>'}</div></details>`;
  const call = async body => { try { await api('school_ordu', { token, ...body }); toast('انجام شد.'); orduPanel(token, on); } catch (e) { toast(e.message); } };
  $$('[data-oplan]').forEach(b => b.onclick = () => { b.disabled = true; call({ op: 'plan', id: b.dataset.oplan }); });
  $$('[data-oclose]').forEach(b => b.onclick = () => call({ op: 'close', id: b.dataset.oclose }));
  const sv = $('[data-osave]'); if (sv) sv.onclick = () => { const at = Math.floor(new Date($('#o-at').value).getTime() / 1000); if (!at) return toast('تاریخ و ساعت اردو را بگذارید.');
    call({ op: 'save', title: $('#o-t').value, dest: $('#o-d').value, at, back: $('#o-b').value, meet: $('#o-m').value, cost: +$('#o-c').value || 0, who: $('#o-w').value, note: $('#o-n').value }); };
}

const pm = location.hash.match(/^#panel\/([A-Za-z0-9]{16,40}|demo-(?:school|org))/);
addEventListener('hashchange', () => { if (/^#panel\//.test(location.hash)) location.reload(); });
if (pm) panel(pm[1]); else if (document.body.dataset.page !== 'b2b') pitch();
/* «رسیدیم سازمان»: members map (flag org_fleet). Exact points for the organisation; «فقط محدوده» members show as a soft ~600 m halo */
function fleetMap(D) {
  const box = document.getElementById('fleet-map'); if (!box) return;
  const load = (tag, at) => new Promise((ok, no) => { const e = document.createElement(tag); Object.assign(e, at); e.onload = ok; e.onerror = no; document.head.appendChild(e); });
  (window.maplibregl ? Promise.resolve() : Promise.all([load('link', { rel: 'stylesheet', href: '/assets/maplibre-gl.css' }), load('script', { src: '/assets/maplibre-gl.js' })])).then(() => {
    const m = new maplibregl.Map({ container: box, style: '/assets/map-style.json', center: [D.place.lng, D.place.lat], zoom: 11, attributionControl: { compact: true } });
    m.on('load', () => { const F = D.fleet, circ = (lat, lng, r) => { const c = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * 2 * Math.PI; c.push([lng + r / (111320 * Math.cos(lat * Math.PI / 180)) * Math.cos(a), lat + r / 110540 * Math.sin(a)]); } return c; };
      m.addSource('halo', { type: 'geojson', data: { type: 'FeatureCollection', features: F.filter(x => x.halo).map(x => ({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [circ(x.lat, x.lng, 600)] }, properties: { car: x.car } })) } });
      m.addLayer({ id: 'halo', type: 'fill', source: 'halo', paint: { 'fill-color': ['case', ['get', 'car'], '#1DBF73', '#4F8CFF'], 'fill-opacity': .18 } });
      m.addSource('pts', { type: 'geojson', data: { type: 'FeatureCollection', features: F.filter(x => !x.halo).map(x => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [x.lng, x.lat] }, properties: { car: x.car, n: x.name } })) } });
      m.addLayer({ id: 'pts', type: 'circle', source: 'pts', paint: { 'circle-radius': 6, 'circle-color': ['case', ['get', 'car'], '#1DBF73', '#4F8CFF'], 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } });
      const el = document.createElement('div'); el.textContent = '🏢'; el.style.cssText = 'font-size:26px;filter:drop-shadow(0 4px 6px #0006)'; new maplibregl.Marker({ element: el }).setLngLat([D.place.lng, D.place.lat]).addTo(m);
      const b = new maplibregl.LngLatBounds(); F.forEach(x => b.extend([x.lng, x.lat])); b.extend([D.place.lng, D.place.lat]); m.fitBounds(b, { padding: 40, maxZoom: 14, duration: 0 }); });
  }).catch(() => { box.innerHTML = '<p class="note">نقشه بارگذاری نشد.</p>'; });
}
