/* «آگهی‌های هم‌مسیری» — posting, sign-in, messaging and «my ads» on top of the server-rendered pages. Shares the app's sign-in (localStorage residim-06). */
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const fa = v => String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]), en = v => String(v).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const KEY = 'residim-06', st = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
  const save = o => { try { localStorage.setItem(KEY, JSON.stringify(Object.assign(st(), o))); } catch (e) {} };
  const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 3800); };
  async function api(a, body) { let r, j; try { r = await fetch('/app/api/r6.php?a=' + a, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Token': st().token || '' }, body: JSON.stringify(body || {}) }); j = await r.json(); } catch (e) { throw Object.assign(new Error('اتصال برقرار نشد؛ اینترنت را بررسی کنید.'), { code: 'net' }); }
    if (!j.ok) { if (j.error === 'auth') save({ token: null }); throw Object.assign(new Error(j.message || 'خطا'), { code: j.error }); } return j; }
  const D = $('#dlg');
  const open = (title, html, wide) => { D.innerHTML = `<div class="scrim" data-x></div><div class="box ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="dl-t"><div class="bh"><h2 id="dl-t">${title}</h2><button class="x" data-x aria-label="بستن">✕</button></div><div class="bb" id="bb">${html}</div></div>`; D.hidden = false; document.body.classList.add('lock'); setTimeout(() => { const f = D.querySelector('input,textarea,select,button:not([data-x])'); f && f.focus(); }, 50); };
  const close = () => { D.hidden = true; D.innerHTML = ''; document.body.classList.remove('lock'); };
  D.addEventListener('click', e => { if (e.target.closest('[data-x]')) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !D.hidden) close(); });
  const signed = () => !!(st().token && st().phone);

  /* sign-in with the app's OTP; afterwards the app on this site is signed in too */
  function login(then) {
    open('ورود به رسیدیم', `<p class="mut">با شماره‌ی موبایل؛ بدون رمز. همین حساب در اپ رسیدیم هم باز می‌شود.</p><form id="lg" class="frm"><label>شماره‌ی موبایل<input id="lg-ph" inputmode="tel" autocomplete="tel" placeholder="۰۹۱۲…" dir="ltr" required></label><button class="btn pri">فرستادن کد</button></form>`);
    $('#lg').onsubmit = async e => { e.preventDefault(); const ph = en($('#lg-ph').value).replace(/\D/g, ''); const b = e.target.querySelector('button'); b.disabled = true;
      try { const r = await api('otp_send', { phone: ph }); $('#bb').innerHTML = `<form id="lg2" class="frm"><label>کدی که پیامک شد<input id="lg-c" inputmode="numeric" autocomplete="one-time-code" dir="ltr" required ${r.dev_code ? `value="${esc(r.dev_code)}"` : ''}></label><button class="btn pri">ورود</button></form>`;
        $('#lg2').onsubmit = async ev => { ev.preventDefault(); try { const v = await api('otp_verify', { phone: ph, code: en($('#lg-c').value) }); save({ token: v.token, phone: v.phone }); close(); toast('وارد شدید.'); then && then(); } catch (er) { toast(er.message); } }; }
      catch (er) { toast(er.message); b.disabled = false; } };
  }
  const need = fn => signed() ? fn() : login(fn);

  /* ── new / edit ad ── */
  const KINDS = { intercity: 'بین‌شهری', daily: 'رفت‌وآمد روزانه', school: 'مدرسه', uni: 'دانشگاه', work: 'محل کار', event: 'مراسم و سفر کوتاه' };
  const DAYS = { sa: 'ش', su: 'ی', mo: 'د', tu: 'س', we: 'چ', th: 'پ', fr: 'ج' };
  async function newAd(edit) {
    let me = { g: '', limit: 3, premium: false, list: [] }; try { me = await api('ad_mine', {}); } catch (e) {}
    const a = edit || { kind: 'intercity', role: 'driver', seats: 3, share: 'dong', audience: 'public' }, once = edit ? !!edit.at : a.kind === 'intercity' || a.kind === 'event';
    const ch = (n, v, t, on) => `<label class="ch"><input type="radio" name="${n}" value="${v}" ${on ? 'checked' : ''}><span>${t}</span></label>`;
    const dt = edit && edit.at ? new Date(edit.at * 1000 - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : '';
    open(edit ? 'ویرایش آگهی' : 'ثبت آگهی رایگان', `<form id="af" class="frm">
      <fieldset><legend>نوع</legend><div class="chs">${Object.entries(KINDS).map(([k, t]) => ch('kind', k, t, a.kind === k)).join('')}</div></fieldset>
      <fieldset><legend>شما</legend><div class="chs">${ch('role', 'driver', '🚗 ماشین دارم، جای خالی دارم', a.role === 'driver')}${ch('role', 'rider', '🙋 دنبال جا هستم', a.role === 'rider')}</div></fieldset>
      ${me.g ? `<p class="mut">این آگهی فقط به ${me.g === 'm' ? 'آقایان' : 'بانوان'} نشان داده می‌شود.</p><input type="hidden" name="g" value="${me.g}">` : `<fieldset><legend>آقا هستید یا خانم؟ <small>(یک بار ثبت می‌شود؛ هم‌مسیری فقط میان هم‌جنس‌هاست)</small></legend><div class="chs">${ch('g', 'f', 'خانم هستم', false)}${ch('g', 'm', 'آقا هستم', false)}</div></fieldset>`}
      <div class="two"><label>از شهر<input name="from_city" required maxlength="40" list="cities" value="${esc(a.from_city || '')}" placeholder="مثلاً تهران"></label><label>محله یا نقطه‌ی شناخته‌شده<input name="from_area" maxlength="60" value="${esc(a.from_area || '')}" placeholder="مثلاً میدان ونک"></label></div>
      <div class="two"><label>به شهر<input name="to_city" required maxlength="40" list="cities" value="${esc(a.to_city || '')}" placeholder="مثلاً اصفهان"></label><label>محله یا نقطه‌ی شناخته‌شده<input name="to_area" maxlength="60" value="${esc(a.to_area || '')}" placeholder="مثلاً ترمینال کاوه"></label></div>
      <fieldset><legend>زمان</legend><div class="chs">${ch('when', 'one', 'یک بار', once)}${ch('when', 'rep', 'تکراری (روزهای هفته)', !once)}</div>
        <div id="w-one" ${once ? '' : 'hidden'}><label>تاریخ و ساعت<input type="datetime-local" name="at" value="${dt}"></label></div>
        <div id="w-rep" ${once ? 'hidden' : ''}><div class="chs days">${Object.entries(DAYS).map(([k, t]) => `<label class="ch"><input type="checkbox" name="days" value="${k}" ${(a.days || '').split(',').includes(k) ? 'checked' : ''}><span>${t}</span></label>`).join('')}</div><label>ساعت<input type="time" name="tm" value="${esc(a.tm || '')}"></label></div></fieldset>
      <div class="two"><label><span id="seat-l">${a.role === 'rider' ? 'چند نفرید؟' : 'چند جای خالی؟'}</span><select name="seats">${[1, 2, 3, 4, 5, 6].map(n => `<option ${+a.seats === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label>هزینه<select name="share"><option value="dong" ${a.share === 'dong' ? 'selected' : ''}>دنگی (تقسیم هزینه، بی‌سود)</option><option value="free" ${a.share === 'free' ? 'selected' : ''}>رایگان</option><option value="charity" ${a.share === 'charity' ? 'selected' : ''}>احسانی</option></select></label></div>
      <label>توضیح کوتاه <small class="mut">(بی‌شماره، بی‌پیوند، بی‌نشانی دقیق)</small><textarea name="body" maxlength="600" placeholder="مثلاً: صبح زود راه می‌افتم، یک توقف کوتاه، بار کم.">${esc(a.body || '')}</textarea></label>
      <fieldset><legend>چه کسانی ببینند؟</legend><div class="chs">${ch('audience', 'public', '🌍 همه (در گوگل هم)', a.audience !== 'contacts')}${ch('audience', 'contacts', '👥 فقط آشنایانی که انتخاب می‌کنم', a.audience === 'contacts')}</div>
        <div id="ct" ${a.audience === 'contacts' ? '' : 'hidden'}><p class="mut">شماره‌ها با رمز یک‌طرفه نگه داشته می‌شوند و آگهی فقط برای همان افراد (هم‌جنس) پس از ورود دیده می‌شود. خبرشان هم می‌کنیم.</p>${'contacts' in navigator && 'select' in navigator.contacts ? '<button type="button" class="btn ghost sm" id="pick">انتخاب از مخاطبان گوشی</button>' : ''}<textarea name="contacts" placeholder="هر شماره در یک خط" dir="ltr"></textarea></div></fieldset>
      <label class="ok"><input type="checkbox" name="adult" required> ۱۸ سال یا بیشتر دارم.</label>
      <label class="ok"><input type="checkbox" name="rules" required> قوانین را می‌پذیرم: این آگهی فقط برای هم‌مسیری است و سودی در کار نیست. شماره، پیوند و نشانیِ دقیق نمی‌نویسم. با هم‌جنس‌ها هم‌مسیر می‌شوم و رفت‌وآمد با مسئولیت خودم است.</label>
      <button class="btn pri block">${edit ? 'ذخیره' : 'انتشار آگهی'}</button><p class="mut">آگهی فعال: ${fa(me.list.filter(x => x.status === 'live').length)} از ${fa(me.limit)}${me.premium ? ' (اشتراک)' : ' · با اشتراک تا ۱۰ آگهی'}</p></form>`, true);
    const F = $('#af'), tog = () => { const one = F.when.value === 'one'; $('#w-one').hidden = !one; $('#w-rep').hidden = one; $('#ct').hidden = F.audience.value !== 'contacts'; $('#seat-l').textContent = F.role.value === 'rider' ? 'چند نفرید؟' : 'چند جای خالی؟'; };
    F.addEventListener('change', tog);
    const pk = $('#pick'); if (pk) pk.onclick = async () => { try { const L = await navigator.contacts.select(['tel'], { multiple: true }); const T = L.flatMap(c => c.tel || []); F.contacts.value = [...new Set([...F.contacts.value.split('\n'), ...T].map(x => x.trim()).filter(Boolean))].join('\n'); } catch (e) {} };
    F.onsubmit = async e => { e.preventDefault(); const fd = new FormData(F), one = fd.get('when') === 'one', b = F.querySelector('button.pri'); b.disabled = true;
      const at = one && fd.get('at') ? Math.floor(new Date(fd.get('at')).getTime() / 1000) : 0;
      const body = { no: edit ? edit.no : 0, kind: fd.get('kind'), role: fd.get('role'), g: fd.get('g') || '', from_city: fd.get('from_city'), from_area: fd.get('from_area'), to_city: fd.get('to_city'), to_area: fd.get('to_area'), at, days: one ? [] : fd.getAll('days'), tm: one ? '' : fd.get('tm'), seats: +fd.get('seats'), share: fd.get('share'), body: fd.get('body'), audience: fd.get('audience'), contacts: String(fd.get('contacts') || '').split(/[\n,]+/).map(x => en(x).replace(/\D/g, '')).filter(Boolean), adult: fd.get('adult') ? 1 : 0, rules: fd.get('rules') ? 1 : 0 };
      if (one && !at) { b.disabled = false; return toast('تاریخ و ساعت سفر را بگذارید.'); }
      try { const r = await api('ad_save', body); toast(r.status === 'pending' ? 'ثبت شد؛ پس از بررسی نمایش داده می‌شود.' : 'آگهی منتشر شد!'); setTimeout(() => location.href = '/ads/' + r.no, 600); } catch (er) { toast(er.message); b.disabled = false; } };
  }

  /* ── messaging on an ad page ── */
  const AD = $('.ad-d[data-no]'), NO = AD ? +AD.dataset.no : 0;
  async function msgStart() {
    let r; try { r = await api('ad_get', { no: NO }); } catch (e) { return toast(e.message); }
    const v = r.viewer; if (v.mine) return thread(null, true);
    if (!v.g) return open('آقا هستید یا خانم؟', `<p>هم‌مسیری و پیام فقط میان هم‌جنس‌هاست. این را یک بار ثبت می‌کنیم و بعد تغییر نمی‌کند.</p><div class="row"><button class="btn pri" data-g="f">خانم هستم</button><button class="btn pri" data-g="m">آقا هستم</button></div>`) || $$('[data-g]').forEach(b => b.onclick = () => { close(); compose(b.dataset.g); });
    if (!v.can_msg) return toast('این آگهی فقط برای ' + (r.ad.g === 'm' ? 'آقایان' : 'بانوان') + ' است.');
    if (v.thread) return thread(v.thread); compose('');
  }
  function compose(g) { $('#ad-thread').innerHTML = `<form class="tbox" id="tb"><textarea id="tm" maxlength="500" placeholder="سلام؛ من هم همین مسیر را می‌روم…" required></textarea><button class="btn pri">فرستادن</button><p class="mut">تا آگهی‌دهنده پاسخ ندهد، شماره و پیوند نمی‌شود فرستاد.</p></form>`; $('#tm').focus();
    $('#tb').onsubmit = async e => { e.preventDefault(); try { const r = await api('ad_msg', { no: NO, text: $('#tm').value, g }); toast('فرستاده شد. پاسخ که بیاید، با اعلان خبرتان می‌کنیم.'); thread(r.thread); } catch (er) { toast(er.message); } }; }
  async function thread(id, ownerHint, host) {
    host = host || $('#ad-thread'); if (!id) { host.innerHTML = `<p class="mut">آگهیِ خودتان است. پیام‌ها در «آگهی‌ها و پیام‌های من» است.</p><button class="btn ghost sm" data-do="me">باز کردن</button>`; return; }
    let r; try { r = await api('ad_thread', { id }); } catch (e) { return toast(e.message); }
    host.innerHTML = `<div class="th"><div class="th-l">${r.list.map(m => `<div class="m ${m.mine ? 'me' : ''}"><span>${esc(m.text)}</span><small>${fa(new Date(m.at * 1000).toLocaleString('fa-IR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }))}</small></div>`).join('')}</div>
      ${r.blocked ? '<p class="mut">این گفتگو بسته شده است.</p>' : `<form class="tbox" data-th="${id}"><textarea maxlength="500" placeholder="${r.phone_ok ? 'پیام… (حالا می‌توانید شماره هم بدهید)' : 'پیام…'}" required></textarea><button class="btn pri">فرستادن</button></form>`}
      <div class="row"><button class="link" data-block="${id}" data-v="${r.blocked ? 0 : 1}">${r.blocked ? 'باز کردن گفتگو' : 'بستن این گفتگو'}</button></div></div>`;
    const L = host.querySelector('.th-l'); L.scrollTop = L.scrollHeight;
    const f = host.querySelector('form'); if (f) f.onsubmit = async e => { e.preventDefault(); const t = f.querySelector('textarea'); try { await api('ad_msg', { thread: id, text: t.value }); thread(id, 0, host); } catch (er) { toast(er.message); } };
    host.querySelector('[data-block]').onclick = async e => { try { await api('ad_block', { id, v: +e.target.dataset.v }); thread(id, 0, host); } catch (er) { toast(er.message); } };
  }

  /* ── my ads and messages ── */
  async function mine(tab = 'th') {
    open('آگهی‌ها و پیام‌های من', '<p class="mut">در حال بارگذاری…</p>', true); let T, M, A;
    try { [T, M, A] = await Promise.all([api('ad_threads', {}), api('ad_mine', {}), api('ad_alerts', {})]); } catch (e) { return toast(e.message); }
    const tabs = `<nav class="tabs">${[['th', 'پیام‌ها' + (T.list.some(x => x.unread) ? ' •' : '')], ['ad', 'آگهی‌های من'], ['al', 'هشدار آگهی تازه']].map(([k, t]) => `<button data-tab="${k}" aria-pressed="${tab === k}">${t}</button>`).join('')}</nav>`;
    const body = tab === 'th' ? (T.list.map(t => `<button class="row-i ${t.unread ? 'un' : ''}" data-open="${t.id}"><b>${esc(t.title)}</b><span>${t.own ? 'به آگهی شما · ' : ''}${esc(t.text)}</span></button>`).join('') || '<p class="mut">هنوز پیامی نیست.</p>') + '<div id="th-host"></div>'
      : tab === 'ad' ? (M.list.map(a => `<div class="row-i ad-m"><a href="/ads/${a.no}"><b>${esc(a.title)}</b></a><span>${esc(a.when)} · ${{ live: 'فعال', closed: 'بسته', pending: 'در انتظار بررسی', review: 'در حال بررسی', hidden: 'پنهان', removed: 'حذف‌شده' }[a.status] || a.status}${a.audience === 'contacts' ? ' · فقط آشنایان' : ''}</span>
          <span class="stat">👁 ${fa(a.views)} بازدید · 💬 ${fa(a.threads)} گفتگو · ${fa(a.msgs)} پیام</span><span class="row">${a.status === 'live' || a.status === 'closed' ? `<button class="btn sm ghost" data-renew="${a.no}">بالا بردن</button>` : ''}${a.status === 'live' ? `<button class="btn sm ghost" data-close="${a.no}">بستن</button>` : ''}</span></div>`).join('') || '<p class="mut">هنوز آگهی نگذاشته‌اید.</p>') + `<button class="btn pri" data-do="new">+ آگهی تازه</button>`
      : (A.premium ? `${A.list.map(x => `<div class="row-i"><b>${esc(x.from_city || 'هر جا')} ← ${esc(x.to_city || 'هر جا')}</b><span>${esc(KINDS[x.kind] || 'همه‌ی نوع‌ها')}</span><button class="link" data-adel="${x.id}">حذف</button></div>`).join('')}
          <form id="alf" class="frm two3"><input name="from" placeholder="از شهر" list="cities"><input name="to" placeholder="به شهر" list="cities"><select name="kind"><option value="">همه</option>${Object.entries(KINDS).map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select><button class="btn pri sm">افزودن هشدار</button></form><p class="mut">آگهیِ تازه‌ی هم‌جنس در این مسیرها که بیاید، فوراً با اعلان خبرتان می‌کنیم.</p>`
        : '<p>با «هشدار آگهی تازه»، تا کسی در مسیر شما آگهی بگذارد، فوراً با اعلان باخبر می‌شوید. اشتراک این‌ها را هم دارد: تا ۱۰ آگهی، بالا بردنِ روزانه، پیامکِ پیامِ تازه و آمار بازدید.</p><a class="btn gold" href="/pricing/">دیدن اشتراک</a>');
    $('#bb').innerHTML = tabs + `<div class="pane">${body}</div>`;
    $$('#bb [data-tab]').forEach(b => b.onclick = () => mine(b.dataset.tab));
    $$('#bb [data-open]').forEach(b => b.onclick = () => { b.classList.remove('un'); thread(b.dataset.open, 0, $('#th-host')); });
    $$('#bb [data-renew]').forEach(b => b.onclick = async () => { try { await api('ad_renew', { no: +b.dataset.renew }); toast('آگهی بالای فهرست رفت.'); mine('ad'); } catch (e) { toast(e.message); } });
    $$('#bb [data-close]').forEach(b => b.onclick = async () => { try { await api('ad_close', { no: +b.dataset.close }); mine('ad'); } catch (e) { toast(e.message); } });
    $$('#bb [data-adel]').forEach(b => b.onclick = async () => { await api('ad_alerts', { del: b.dataset.adel }).catch(e => toast(e.message)); mine('al'); });
    const af = $('#alf'); if (af) af.onsubmit = async e => { e.preventDefault(); try { await api('ad_alerts', { add: 1, from: af.from.value, to: af.to.value, kind: af.kind.value }); mine('al'); } catch (er) { toast(er.message); } };
  }
  function report() { open('گزارش آگهی', `<form id="rf" class="frm"><div class="chs col">${[['fake', 'آگهی جعلی یا تکراری'], ['money', 'گرفتن پول یا بیعانه، یا کار تجاری'], ['bad', 'نامناسب یا مزاحمت'], ['minor', 'مربوط به کودکِ تنها'], ['other', 'چیز دیگر']].map(([k, t], i) => `<label class="ch"><input type="radio" name="r" value="${k}" ${i ? '' : 'checked'}><span>${t}</span></label>`).join('')}</div><textarea name="t" maxlength="300" placeholder="توضیح کوتاه (اختیاری)"></textarea><button class="btn pri">فرستادن گزارش</button></form>`);
    $('#rf').onsubmit = async e => { e.preventDefault(); try { await api('ad_report', { no: NO, reason: e.target.r.value, text: e.target.t.value }); close(); toast('ممنون؛ بررسی می‌کنیم.'); } catch (er) { toast(er.message); } }; }

  document.addEventListener('click', e => { const b = e.target.closest('[data-do]'); if (!b) return; const k = b.dataset.do;
    if (k === 'new') need(() => newAd()); if (k === 'me') need(() => mine()); if (k === 'msg') need(msgStart); if (k === 'report') need(report);
    if (k === 'login') login(() => location.reload());
    if (k === 'share') { const u = location.href.split('#')[0], t = document.title; if (navigator.share) navigator.share({ title: t, url: u }).catch(() => {}); else navigator.clipboard.writeText(u).then(() => toast('پیوند کپی شد.'), () => toast(u)); } });

  /* a «contacts» ad is rendered here for the chosen members only */
  const P = $('#ad-private');
  if (P && signed()) api('ad_get', { no: +P.dataset.no }).then(r => { const a = r.ad; P.innerHTML = `<div class="ad-tags"><span class="t">${esc(a.kind_t)}</span><span class="t g">${esc(a.g_t)}</span><span class="t">👥 فقط آشنایان</span></div><h1>${esc(a.title)}</h1><p class="when">🕒 ${esc(a.when)}</p>${a.body ? `<p class="body">${esc(a.body)}</p>` : ''}<div class="ad-act"><button class="btn pri" data-do="msg">پیام</button></div><div id="ad-thread"></div>`; P.classList.add('ad-d'); P.dataset.g = a.g; }).catch(e => { P.querySelector('.lead').textContent = e.message; });
  if (location.hash === '#new') need(() => newAd()); else if (location.hash === '#me') need(() => mine());
})();
