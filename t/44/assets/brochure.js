/* «رسیدیم مدرسه» / «رسیدیم سازمان» brochures, built from each place's live data (name, city, code, link, QR) → two-sided PDF.
   tri:   A4 landscape letter-fold (RTL): outside [cover | gift+steps | QR], inside [staff | managers | families].
   strip: A4 portrait, 4 strips (cut lines), each a tri-fold of ~70×74 mm near-square panels; one place per strip, four colourways. */
(() => {
  const $ = s => document.querySelector(s), esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const fa = s => String(s).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const api = (a, b) => fetch('/app/api/r6.php?a=' + a, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b || {}) }).then(r => r.json()).then(j => { if (!j.ok) throw new Error(j.error || 'خطا'); return j; });
  const qr = link => { try { const q = qrcode(0, 'M'); q.addData(link); q.make(); return q.createSvgTag({ cellSize: 4, margin: 1, scalable: true }); } catch (e) { return ''; } };
  const isEdu = p => ['school', 'kinder'].includes(p.kind);
  const C = p => isEdu(p) ? {
    brand: 'رسیدیم مدرسه', who: 'خانواده‌های', fam: 'والدین', sub: 'هم‌سرویسِ خانواده‌های همین مدرسه',
    p1: ['والدین', 'صبح‌های بی‌دغدغه', '👨‍👩‍👧', 'هر خانواده هفته‌ای یکی‌دو روز می‌رساند؛ بقیه‌ی روزها آسوده', ['هم‌سرویس با همسایه‌های همین مدرسه؛ فقط هم‌جنس با هم‌جنس', 'نوبت رانندگی خودکار و منصفانه؛ جایگزین با یک تپ', 'پیام «رسیدیم» وقتی بچه رسید؛ دنگ و حساب خودکار', 'خانه‌ی کسی به غریبه‌ها نشان داده نمی‌شود']],
    p2: ['مدیر و انجمن اولیا', 'دمِ در مدرسه، خلوت', '🏫', 'پنل آماده از روز اول؛ پیش‌نمایشش را ببینید|residim.ir/schools', ['پنل آمار: چند خانواده، چند ماشین کمتر، چه ساعتی شلوغ', 'اطلاعیه با اعلان گوشی به همه‌ی خانواده‌ها', 'اردو با ماشین خانواده‌ها؛ چیدن خودکار', 'لوگوی مدرسه در اپ همه‌ی خانواده‌ها']],
    p3: ['کادر مدرسه', 'رسیدیم سازمان، برای همکاران', '🧑‍🏫', 'یک مقصد، دو کار: رسیدیمِ مدرسه برای خانواده‌ها، رسیدیمِ سازمان برای همکاران', ['با «دارم می‌روم» همکارِ هم‌مسیر با یک تپ پیدا می‌شود', 'هم‌مسیرِ همکار برای برگشت بعد از جلسه‌ها و کلاس‌های عصر', 'تا ۵ نفر از کادر روی پنل، با شماره‌ی خودشان', 'برای کادرِ مدرسه‌های رسیدیم، رایگان']],
    gift: 'برای مدرسه‌ی شما، یک ماهِ کاملاً رایگان از روز ساخت حساب'
  } : {
    brand: 'رسیدیم سازمان', who: 'همکاران', fam: 'کارکنان', sub: 'ایاب‌وذهاب مشارکتیِ همکاران',
    p1: ['کارکنان', 'ساعت ۵، با هم‌مسیر', '🧑‍💻', 'کمتر پشت فرمان، کمتر دنبال تاکسی؛ با همکارِ همین مجموعه', ['با یک تپ «دارم می‌روم»، همکارِ مکملِ نزدیک خبردار می‌شود', 'ماشین‌دار جای خالی را پر می‌کند؛ بی‌ماشین راحت برمی‌گردد', 'فقط هم‌جنس با هم‌جنس؛ شماره بدون رضایت نشان داده نمی‌شود', 'دنگِ هزینه بی‌سود و شفاف، میان خود همکاران']],
    p2: ['منابع انسانی', 'گزارشی که می‌شود ارائه داد', '📊', 'پیش‌نمایش پنل را ببینید|residim.ir/orgs', ['پنل آمار: سفر مشترک، ماشین کمتر، پارکینگ آزاد', 'اطلاعیه به کارکنان با اعلان گوشی', 'لوگوی سازمان در اپ هر همکار؛ کارکنانِ مهمانِ سازمان', 'چند ساختمان و چند شیفت، همه در یک پنل']],
    p3: ['مدیران', 'بدون سرویس اجاره‌ای', '🏢', 'پایلوت ۳۰ روزه‌ی رایگان؛ بدون تعهد', ['پیوستن کارکنان فقط با یک لینک؛ بدون یکپارچه‌سازی', 'حریم خصوصی: هر کس می‌تواند فقط «محدوده» نشان دهد', 'قرارداد و فاکتور رسمی؛ قیمت بر اساس کارکنانِ فعال', 'داده در ایران؛ بدون تبلیغ و فروش داده']],
    gift: 'برای مجموعه‌ی شما، یک ماهِ کاملاً رایگان از روز ساخت حساب'
  };
  const cover = (p, c) => `<div class="pan cover"><img src="../assets/icon.svg?v=44" alt=""><h2>${c.brand}</h2><div class="pl">${esc(p.name)}</div><div class="sub">${c.sub}</div><div class="tag">نوبت‌ها روشن، خیال‌ها جمع</div></div>`;
  const qrp = (p, c, link) => `<div class="pan soft" style="justify-content:center"><h4 style="text-align:center">اسکن کنید؛ «${esc(p.name)}» از قبل ثبت شده</h4><div class="qrbox">${qr(link)}</div><div class="link">residim.ir/${esc(p.code)}</div><p style="text-align:center">بدون نصب؛ در مرورگر هم باز می‌شود</p></div>`;
  const giftp = (p, c, sm) => `<div class="pan"><div class="gift"><b>یک ماه رایگان</b><span>${c.gift}</span></div>${sm ? `<p>${c.fam} و کادرِ «${esc(p.name)}» با یک لینک می‌پیوندند؛ هم‌مسیرها خودشان پیدا می‌شوند.</p>` : `<h4>شروع در سه قدم</h4><div class="steps"><div>کدِ مربعیِ کنار را با دوربین گوشی اسکن کنید</div><div>یک دقیقه: محله، ماشین داشتن یا نداشتن، ساعت معمول</div><div>هم‌مسیرهای نزدیک پیشنهاد می‌شوند؛ با یک تپ: هم‌مسیر شویم؟</div></div><div class="chips3"><span>${isEdu(p) ? 'والدین' : 'کارکنان'}</span><span>${isEdu(p) ? 'مدیر و انجمن' : 'منابع انسانی'}</span><span>${isEdu(p) ? 'کادر مدرسه' : 'مدیران'}</span></div><p class="foot">بدون تبلیغ و فروش داده؛ پیش‌نمایش پنل در این نشانی</p><div class="ll foot" dir="ltr">residim.ir/${isEdu(p) ? 'schools' : 'orgs'}</div>`}</div>`;
  const inside = ([who, h, em, pr, li], sm) => `<div class="pan ${sm ? '' : 'soft'}"><div class="em">${em}</div><span class="who">${who}</span><h3>${h}</h3><ul>${li.map(x => `<li><span>${x}</span></li>`).join('')}</ul>${sm ? '' : `<div class="promise">${lnk(pr)}</div>`}</div>`;
  const lnk = t => t.split('|').map((x, i) => i ? `<div dir="ltr" class="ll">${x}</div>` : `<div>${x}</div>`).join('');
  const folds = n => [1, 2].map(k => `<i class="fold" style="left:${k * 100 / 3}%"></i>`).join('');
  function tri(p, t) { const c = C(p), link = 'https://residim.ir/' + p.code;
    return `<section class="sheet land t${t}"><div class="strip" style="top:0;bottom:0;direction:ltr">${cover(p, c)}${giftp(p, c)}${qrp(p, c, link)}</div>${folds()}</section>
      <section class="sheet land t${t}"><div class="strip" style="top:0;bottom:0;direction:ltr">${inside(c.p3)}${inside(c.p2)}${inside(c.p1)}</div>${folds()}</section>`; }
  function strips(list) { const H = 297 / 4, row = (i, side) => { const p = list[i % list.length], c = C(p), link = 'https://residim.ir/' + p.code, t = i % 4;
      // long-edge duplex mirrors left↔right, so the inside row is reversed to sit behind the right panels
      const cells = side === 'out' ? cover(p, c) + giftp(p, c, 1) + qrp(p, c, link) : inside(c.p1, 1) + inside(c.p2, 1) + inside(c.p3, 1);
      return `<div class="strip t${t}" style="top:calc(${(i * H).toFixed(2)}*var(--u));height:calc(${H.toFixed(2)}*var(--u));direction:ltr">${cells}</div>`; };
    const sheet = side => `<section class="sheet port sm">${[0, 1, 2, 3].map(i => row(i, side)).join('')}${[1, 2, 3].map(k => `<i class="cut" style="top:calc(${(k * H).toFixed(2)}*var(--u))"></i>`).join('')}${folds()}</section>`;
    return sheet('out') + sheet('in'); }
  async function build() { const codes = $('#codes').value.split(/[,،\s]+/).map(x => x.trim().toUpperCase()).filter(Boolean).slice(0, 8);
    const out = $('#out'); if (!codes.length) { out.innerHTML = '<p>کدِ مکان را بنویسید (همان بخشِ آخرِ لینک residim.ir/…).</p>'; return; }
    out.innerHTML = '<p>در حال ساختن…</p>'; const L = [];
    for (const c of codes) { try { const r = await api('place_code', { code: c }); L.push(r.place); } catch (e) { out.innerHTML = `<p>کد ${esc(c)}: ${esc(e.message)}</p>`; return; } }
    out.innerHTML = $('#mode').value === 'strip' ? strips(L) : L.map((p, i) => tri(p, i % 4)).join('');
    $('#pdf').disabled = false; ui.names = L.map(p => p.code).join('-'); }
  const ui = {};
  async function pdf() { const b = $('#pdf'); b.disabled = true; b.textContent = 'در حال ساختن PDF…'; try { await document.fonts.ready;
      const { jsPDF } = window.jspdf; let doc = null;
      for (const s of document.querySelectorAll('.sheet')) { const land = s.classList.contains('land'), cv = await html2canvas(s, { scale: 2, backgroundColor: '#fff', useCORS: true });
        const img = cv.toDataURL('image/jpeg', .93); if (!doc) doc = new jsPDF({ orientation: land ? 'l' : 'p', unit: 'mm', format: 'a4' }); else doc.addPage('a4', land ? 'l' : 'p');
        doc.addImage(img, 'JPEG', 0, 0, land ? 297 : 210, land ? 210 : 297); }
      doc.save(`residim-brochure-${$('#mode').value}-${ui.names}.pdf`); } catch (e) { alert(e.message); } b.disabled = false; b.textContent = 'دانلود PDF'; }
  $('#go').onclick = build; $('#pdf').onclick = pdf;
  const q = new URLSearchParams(location.search); if (q.get('codes')) { $('#codes').value = q.get('codes'); if (q.get('mode')) $('#mode').value = q.get('mode'); build(); }
})();
