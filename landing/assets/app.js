(() => {
'use strict';

/* ═════════ basics ═════════ */
const API = '/app/api/r6.php?a=';
const KEY = 'residim-06';
const DAYS = ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'];
const TODAY = (new Date().getDay() + 1) % 7;
const fa = v => String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
const en = v => String(v ?? '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const sep = n => String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
const money = n => fa(sep(n)) + ' تومان';
const clock = t => fa(String(t || '').replace(/^0/, ''));
const km1 = d => fa((Math.round(d * 10) / 10).toString().replace('.', '٫'));
const mins = s => fa(Math.max(1, Math.round(s / 60)));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $ = s => document.querySelector(s);
const ic = (n, cls = 'i') => `<svg class="${cls}"><use href="#i-${n}"/></svg>`;
const uid = () => Math.random().toString(36).slice(2, 10);
const SITE = 'https://residim.ir', SITE_HOST = 'residim.ir';
const CAP = window.Capacitor, NATIVE = !!(CAP && CAP.isNativePlatform && CAP.isNativePlatform()), NP = NATIVE ? (CAP.Plugins || {}) : {};
const APPVER = (navigator.userAgent.match(/ResidimApp\/([\d.]+)/) || [])[1] || '';
const CLIENT = NATIVE ? 'android/' + (APPVER || '1') : 'web'; // never the hosting account's technical domain
const sleep = ms => new Promise(r => setTimeout(r, ms));
const hav = (a, b, c, d) => { const R = 6371000, t = Math.PI / 180, x = Math.sin((c - a) * t / 2) ** 2 + Math.cos(a * t) * Math.cos(c * t) * Math.sin((d - b) * t / 2) ** 2; return 2 * R * Math.asin(Math.min(1, Math.sqrt(x))); };
let JY = (() => { try { return parseInt(new Intl.DateTimeFormat('en-u-ca-persian', { year: 'numeric' }).format(new Date()), 10) || 1405; } catch (e) { return 1405; } })();

const KINDS = {
  school:    { n: 'مدرسه', ic: 'school', child: true,  c: 0, lbl: 'مدرسه‌ی بچه‌ها', dest: 'مدرسه' },
  kinder:    { n: 'مهدکودک', ic: 'kinder', child: true,  c: 5, lbl: 'مهدکودک', dest: 'مهد' },
  institute: { n: 'آموزشگاه', ic: 'book', child: true,  c: 4, lbl: 'کلاس زبان بچه‌ها', dest: 'آموزشگاه' },
  club:      { n: 'باشگاه و ورزشگاه', ic: 'ball', child: true,  c: 2, lbl: 'باشگاه بچه‌ها', dest: 'باشگاه' },
  work:      { n: 'محل کار', ic: 'brief', child: false, c: 1, lbl: 'محل کار', dest: 'محل کار' },
  uni:       { n: 'دانشگاه', ic: 'cap', child: false, c: 6, lbl: 'دانشگاه', dest: 'دانشگاه' },
  other:     { n: 'سایر', ic: 'dots', child: null,  c: 3, lbl: '', dest: 'مقصد' },
  station:   { n: 'سفر: ایستگاه، فرودگاه، ترمینال', pn: 'ایستگاه، فرودگاه یا ترمینال', ic: 'train', child: false, c: 6, lbl: 'برگشت از سفر', dest: 'ایستگاه', temp: true }
};
const COLORS = [
  { c: '#22C55E', i: '#04140B' }, { c: '#2563EB', i: '#FFFFFF' }, { c: '#F97316', i: '#1A0D00' }, { c: '#DB2777', i: '#FFFFFF' },
  { c: '#7C3AED', i: '#FFFFFF' }, { c: '#F59E0B', i: '#1A1400' }, { c: '#0D9488', i: '#FFFFFF' }, { c: '#DC2626', i: '#FFFFFF' }
];
const JOBS = [['teacher', 'فرهنگی و معلم'], ['cleric', 'طلبه و روحانی'], ['academic', 'دانشگاهی'], ['student', 'دانشجو'], ['medic', 'کادر درمان']];
const JOB_L = Object.fromEntries(JOBS);
const VALUES = { religious: 'خانواده‌ای مذهبی باشند', nomusic: 'موسیقی پخش نشود', parent: 'راننده حتماً از والدین باشد', samegender: 'راننده هم‌جنس فرزندم باشد', quiet: 'تعامل و گفتگوی محترمانه' };
const PICKUP = { door: 'دمِ در خانه سوار شویم', flex: 'تا سر کوچه (حدود ۱۰۰ متر) هم می‌آییم' };
const CITIES = ['تهران','کرج','مشهد','اصفهان','شیراز','تبریز','قم','اهواز','رشت','کرمان','یزد','ارومیه','همدان','سایر'];
const HOOK = {
  child: 'اگر هم‌محله و هم‌مسیریم، چرا هر کدام جدا؟ بچه‌ها را نوبتی ببریم و بیاوریم؛ وقت آزاد، خرج نصف، خیال راحت.',
  adult: 'اگر هم‌مسیریم، چرا هر روز جدا جدا؟ نوبتی برانیم؛ ترافیک کمتر، خرج نصف، صبح‌های شادتر.'
};
const REL = { mother: ['مادر', 'f'], father: ['پدر', 'm'], grandpa: ['پدربزرگ', 'm'], grandma: ['مادربزرگ', 'f'], forDad: ['مادرم؛ از طرف همسرم (پدر بچه‌ها) پر می‌کنم', 'm'], forMom: ['پدرم؛ از طرف همسرم (مادر بچه‌ها) پر می‌کنم', 'f'], brother: ['برادر بزرگ‌تر بچه‌ها هستم', 'm'], sister: ['خواهر بزرگ‌تر بچه‌ها هستم', 'f'] };
const relLabel = m => m.rel === 'brother' ? 'برادر بزرگ‌تر' : m.rel === 'sister' ? 'خواهر بزرگ‌تر' : m.rel === 'grandpa' ? 'پدربزرگ' : m.rel === 'grandma' ? 'مادربزرگ' : (m.pg === 'f' ? 'مادر' : 'پدر');
const isTrip = x => !!(x && (KINDS[x.kind] || {}).temp);
const isChild = p => { const k = KINDS[p.kind] || KINDS.other, f = p.data && p.data.forKids; if (f === 0) return false; return k.child ?? !!f; };
const col = i => COLORS[((i % 8) + 8) % 8];

/* ═════════ store ═════════ */
let S = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })();
S.drafts = S.drafts || [];
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
let P = [];
let CFG = { flags: {}, web_key: '', service: false };
const ui = { tab: 'peers', view: 'map', filter: 'all', cand: null, inbox: null, team: null, wiz: null, slot: null, linkPlace: null, admin: false, adm: null, open: { profiles: false, test: false } };

async function api(a, body, admin) {
  let r;
  try { r = await fetch(API + a, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Client': CLIENT, 'X-Token': (admin ? S.admin : S.token) || '' }, body: JSON.stringify(body || {}) }); }
  catch (e) { const er = new Error('اتصال به سرور برقرار نشد؛ اینترنت را بررسی کنید.'); er.code = 'net'; throw er; }
  let j; try { j = await r.json(); } catch (e) { const er = new Error('سرور پاسخ درستی نداد.'); er.code = 'net'; throw er; }
  if (!j.ok) {
    if (j.error === 'auth' && !admin && S.token) { S.token = null; P = []; persist(); }
    const er = new Error(j.message || 'خطا'); er.code = j.error; er.pcode = j.pcode; er.reason = j.reason; throw er;
  }
  return j;
}
const QUIPS = {
  invite: ['حالا نوبت صبر است؛ که گفته‌اند گنج است!', 'ان‌شاءالله جواب‌شان مثل زنگ مدرسه سر وقت برسد.', 'دعوت مؤدبانه، نصف راه است؛ نصف دیگرش «بله» است.'],
  team: ['از امروز ترافیک صبح یک نفر را کم دارد: شما را!', 'مبارک است! صبح‌های شلوغ رسماً نیمه‌وقت شد.', 'تیم که شدید، چای صبح هم داغ‌تر می‌ماند.'],
  done: ['قهرمان امروز بی‌ادعا پشت فرمان نشسته بود.', 'جای مدال، یک چای داغ پیشنهاد می‌شود.', 'بچه‌ها رسیدند؛ آرامش هم رسید.'],
  welcome: ['از امروز «دیر شد!» را کمتر می‌شنوید.', 'به جمع آدم‌های وقت‌شناس خوش آمدید!', 'صبح‌های شما رسماً بهتر شد؛ امضا: رسیدیم.']
};
function quip(k, prob = .45) { const L = QUIPS[k]; if (!L || Math.random() > prob) return ''; S.q = S.q || {}; let i = Math.floor(Math.random() * L.length); if (i === S.q[k]) i = (i + 1) % L.length; S.q[k] = i; persist(); return ' ' + L[i]; }
const fail = e => { if (e && e.code === 'watch') return sheet('حالت «فقط دیدن»', `<p style="line-height:2">${esc(e.message)}</p><button class="btn ac block" data-a="fam-act">من ادامه می‌دهم</button><p class="muted small">هر وقت خواستید دوباره به «فقط دیدن» برگردید.</p>`); toast(e && e.message ? e.message : 'خطایی پیش آمد.'); };

/* ═════════ profiles ═════════ */
const allProfiles = () => [...P, ...S.drafts];
const active = () => allProfiles().find(p => p.id === S.active) || null;
const profColor = p => p.team ? col(p.team.color) : col(p.color ?? (KINDS[p.kind] || KINDS.other).c);
const placeName = p => p.place ? p.place.name : (p.placeDraft ? p.placeDraft.name : '');
const destWord = p => (KINDS[p.kind] || KINDS.other).dest;
function missingStep(p) {
  const d = p.data || {};
  if (!p.kind) return 'kind';
  if (!d.family || !d.pg) return 'family';
  if (isChild(p) && (!d.kids || !d.kids.length || d.kids.some(k => !k.first || !k.g || !k.by))) return 'kids';
  if (!d.lat || !d.hood) return 'home';
  if (!d.role || (!isTrip(p) && d.role !== 'pay' && !(d.days || []).length)) return 'role';
  if (isTrip(p) && !d.arrive) return 'trip';
  if (!p.place && !p.placeDraft) return 'place';
  if (!d.snapp && !(isTrip(p) && d.free_ride && d.role !== 'pay')) return 'snapp';
  if (!d.rules_at) return 'rules';
  return null;
}
let ME = { premium_until: 0 };
const $$ = q => Array.from(document.querySelectorAll(q));
/* ═════════ sound: tiny Web Audio tones, made on the fly (no files, only after a tap) ═════════ */
const SND = { ctx: null };
function snd(kind) {
  if (['done', 'arrive', 'ok'].includes(kind)) haptic(kind === 'arrive' ? 'heavy' : 'light');
  if (S.sound === false) return;
  try {
    if (!SND.ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; SND.ctx = new AC(); }
    const c = SND.ctx; if (c.state === 'suspended') c.resume();
    const N = { tap: [[880, 0, .05, .025]], step: [[660, 0, .09, .04], [880, .07, .12, .035]], ok: [[587, 0, .12, .05], [880, .1, .2, .045]],
      done: [[523, 0, .14, .05], [659, .11, .14, .05], [784, .22, .16, .05], [1047, .34, .34, .045], [1568, .42, .3, .015]],
      arrive: [[784, 0, .16, .05], [988, .16, .16, .05], [1175, .32, .18, .05], [988, .5, .14, .04], [1319, .66, .4, .05]],
      honk: [[392, 0, .1, .035, 'square'], [392, .16, .14, .035, 'square']], whoosh: [[900, 0, .5, .02, 'sawtooth', 160]] }[kind] || [];
    const t0 = c.currentTime + .01;
    N.forEach(([f, at, dur, vol, type, to]) => { const o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.value = f; if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + at + dur);
      g.gain.setValueAtTime(0, t0 + at); g.gain.linearRampToValueAtTime(vol, t0 + at + .012); g.gain.exponentialRampToValueAtTime(.0001, t0 + at + dur);
      o.connect(g).connect(c.destination); o.start(t0 + at); o.stop(t0 + at + dur + .05); });
  } catch (e) {}
}
/* ═════════ install (PWA) ═════════ */
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); ui.bip = e; });
window.addEventListener('appinstalled', () => { ui.bip = null; snd('done'); toast('رسیدیم روی گوشی نصب شد.'); });
async function installApp() {
  if (ui.bip) { ui.bip.prompt(); try { await ui.bip.userChoice; } catch (e) {} ui.bip = null; return; }
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (!ios && /android/i.test(navigator.userAgent) && ui.apk && ui.apk.url) return sheet('اپ اندروید رسیدیم', `<div class="sup-how">${ic('install')}<span><b>چرا اپ؟</b> یادآوری شب قبل از نوبت (حتی وقتی اپ بسته است)، اعلان روی صفحه‌ی قفل با صدا و لرزش، و ثبت خودکار سوار شدن و رسیدن با صفحه‌ی خاموش.</span></div>
    <a class="btn ac block" href="${esc(ui.apk.url)}" download>${ic('download')}دانلود اپ${ui.apk.ver ? ' · نسخه ' + fa(ui.apk.ver) : ''}${ui.apk.size ? ' · ' + fa((ui.apk.size / 1048576).toFixed(1)) + ' مگابایت' : ''}</a>
    <ol class="steps"><li>فایل را باز کنید؛ اگر گوشی پرسید، «اجازه‌ی نصب از این منبع» را بدهید.</li><li>«نصب» را بزنید و وارد شوید؛ حساب‌تان همان حساب سایت است.</li><li>اجازه‌ی اعلان و موقعیت را بدهید تا یادآوری‌ها و ثبت خودکار کار کنند.</li></ol>
    <button class="link" data-a="install-pwa">نمی‌خواهم فایل نصب کنم؛ فقط میانبر روی صفحه</button>`);
  sheet('نصب رسیدیم روی گوشی', ios ? `<ol class="steps"><li>در Safari دکمه‌ی <b>اشتراک‌گذاری</b> (مربع با فلش رو به بالا) را بزنید.</li><li><b>Add to Home Screen</b> را انتخاب کنید.</li><li><b>Add</b> را بزنید؛ آیکون رسیدیم کنار بقیه‌ی برنامه‌ها می‌نشیند.</li></ol>`
    : `<ol class="steps"><li>منوی مرورگر (سه نقطه‌ی بالای صفحه) را باز کنید.</li><li><b>نصب برنامه</b> یا <b>Add to Home screen</b> را بزنید.</li><li>از این به بعد رسیدیم مثل یک اپ، تمام‌صفحه و سریع باز می‌شود.</li></ol>`, 'بدون دانلود از فروشگاه؛ حجمش کم است و خودکار به‌روز می‌شود.');
}
/* ═════════ subscription ═════════ */
function paywallSheet(reason, w) {
  const pr = +CFG.sub_price || 297000, day = Math.round(pr / 30 / 100) * 100, on = !!CFG.flags.paid_mode, act = ME.premium_until * 1000 > Date.now();
  const top = reason === 'temp' ? `<p class="hint warn">${ic('train')}<span>${fa(CFG.free_temp_month || 2)} مسیرک سفرِ رایگانِ این ماه را استفاده کرده‌اید. اگر خودتان رانندگی می‌کنید و رایگان می‌برید، این سفر هم رایگان است.</span></p>`
    : reason === 'perm' ? `<p class="hint warn">${ic('spark')}<span>مسیرک اول مهمان ما بودید. برای مسیرک‌های بیشتر، اشتراک «همراه» لازم است.</span></p>`
    : !on ? `<p class="hint">${ic('heart')}<span><b>در دوره‌ی آزمایشی همه‌چیز رایگان است.</b> این صفحه فقط می‌گوید بعداً چه چیزی در اشتراک هست.</span></p>` : act ? `<p class="hint">${ic('check')}<span>اشتراک شما فعال است. ممنون که همراه ما هستید!</span></p>` : '';
  sheet('رسیدیم همراه', `${top}
    <div class="sub-hero"><b>ماهی ${money(pr)}</b><span>روزی حدود ${money(day)}؛ کمتر از یک کرایه‌ی اسنپ در کل ماه</span></div>
    <ul class="ticks">
      <li>${ic('check')}<span>مسیرک و تیم <b>بی‌سقف</b>: مدرسه، کلاس زبان، باشگاه، محل کار</span></li>
      <li>${ic('check')}<span>مسیرک سفر بی‌سقف (ایستگاه، فرودگاه، ترمینال)</span></li>
      <li>${ic('check')}<span>پیامک «فرزندتان رسید» و ثبت رسیدن خودکار</span></li>
      <li>${ic('check')}<span>جایگزینی هوشمند وقتی راننده‌ی امروز نیست</span></li>
      <li>${ic('check')}<span>گزارش ماهانه‌ی حساب و سفرها، یادآوری مهربان تسویه</span></li>
      <li>${ic('check')}<span>پشتیبانی سریع</span></li></ul>
    <p class="muted small">یک خانواده که هفته‌ای ۵ روز رفت و برگشت را با تیم تقسیم کند، معمولاً ماهانه چند میلیون تومان کمتر خرج می‌کند و ده‌ها ساعت وقت آزاد می‌گیرد. اشتراک، کسری از همین صرفه‌جویی است.</p>
    ${reason === 'temp' && w ? `<button class="btn line block" data-a="pw-free">${ic('wheel')}خودم می‌برم و رایگان است</button>` : ''}
    ${act ? '' : `<button class="btn ac block" data-a="sub-want" data-v="${esc(reason || '')}">${on ? 'می‌خواهم؛ وقتی پرداخت باز شد خبرم کنید' : 'وقتی اشتراک آمد خبرم کنید'}</button>`}`, on ? 'مسیرک اول مهمان ما هستید؛ ' + fa(CFG.free_temp_month || 2) + ' مسیرک سفر هم هر ماه رایگان است.' : '');
}
/* ═════════ guide ═════════ */
function guideSheet() {
  const G = [
    ['شروع در دو دقیقه', 'یک «مسیرک» بسازید: بگویید کجا می‌روید (مدرسه، مهد، کلاس، محل کار، دانشگاه)، خانه کجاست و سهم‌تان رانندگی است یا هزینه. بعد نزدیک‌ترین هم‌مسیرها را روی نقشه می‌بینید.'],
    ['مسیرک چیست؟', 'هر جایی که مرتب می‌روید یک مسیرک است. چند مسیرک دارید؟ از بالای صفحه یا منو با یک تپ عوض‌شان کنید. رنگ هر مسیرک فرق دارد تا گم نشوید.'],
    ['هم‌مسیرها و نقشه', 'در «هم‌مسیرها» خانواده‌های نزدیک با فاصله‌ی واقعی خیابانی دیده می‌شوند. دکمه‌ی «تا مقصد» محله‌ی شما و مقصد را با یک فلش نشان می‌دهد. موقعیت شما برای دیگران تقریبی (حدود ۱۵۰ متر) است.'],
    ['دعوت و تیم', 'روی یک خانواده بزنید و «هم‌مسیر شویم؟» را بفرستید. وقتی بپذیرند تیم ساخته می‌شود. هر تیم دست‌کم یک راننده لازم دارد. «چینش پیشنهادی» بهترین ترکیب نزدیک را یک‌جا دعوت می‌کند.'],
    ['برنامه‌ی هفته و جایگزین', 'در «تیم»، برنامه‌ی هر روز و راننده‌ی نوبت را می‌بینید. اگر کسی نتواند، با یک تپ جایگزین پیدا می‌شود و همه خبردار می‌شوند. با «رسیدیم» رسیدن بچه‌ها را اعلام کنید.'],
    ['حساب و تسویه', 'هر سفر خودکار حساب می‌شود: سهم منصفانه ۶۰٪ میانگین برآورد اسنپ اعضاست. در «حساب» می‌بینید چه کسی به چه کسی بدهکار است. پرداخت مستقیم بین خانواده‌هاست؛ رسیدیم پولی نگه نمی‌دارد.'],
    ['ایمنی و قانون سن و جنسیت', 'دختران بالای ۸ سال و پسران بالای ۱۲ سال با جنس مخالف هم‌سرویس نمی‌شوند. در مسیرک سفر فقط خانم‌ها با خانم‌ها و آقایان با آقایان. شماره‌ی دیگران فقط برای کاربرهای تأییدشده و هم‌تیمی‌ها دیده می‌شود.'],
    ['مسیرک سفر', 'برگشت از راه‌آهن، فرودگاه یا ترمینال تا خانه: روز و ساعت رسیدن و مقصد را بگویید؛ هم‌سفرهای هم‌جنس که حداکثر یک ساعت اختلاف دارند و مقصدشان نزدیک است پیشنهاد می‌شوند. راننده می‌تواند رایگان ببرد یا شماره کارت بگذارد.'],
    ['گفتگوی تیم', 'برای هماهنگی، خبر تأخیر و تشکر. کوتاه و محترمانه؛ اگر «فقط از راه اپ» را انتخاب کرده باشید، شماره‌تان دیده نمی‌شود.'],
    ['کد ورود و پیامک', 'اگر کد نرسید: «ارسال دوباره»، «تماس صوتی» یا «فعلاً بدون شماره» را بزنید. بعداً از منو شماره را تأیید کنید تا همه‌ی مسیرک‌ها در حساب‌تان بمانند.'],
    ['نصب روی گوشی', 'رسیدیم یک اپ وب است: از منو «نصب روی گوشی» را بزنید؛ بدون فروشگاه، با آیکون و تمام‌صفحه.'],
    ['حریم خصوصی', 'اطلاعات بچه‌ها (اسم کوچک و سال تولد) فقط برای هم‌تیمی‌ها دیده می‌شود. هیچ داده‌ی فردی به تبلیغ‌دهنده داده نمی‌شود.']];
  sheet('راهنمای رسیدیم', `<div class="guide">${G.map(([h, t], i) => `<details ${i === 0 ? 'open' : ''}><summary>${h}${ic('down', 'i')}</summary><p>${t}</p></details>`).join('')}</div>`, 'هر بخش را بزنید تا باز شود.');
}
async function refreshMe() {
  if (!S.token) { P = []; return; }
  try { const r = await api('me'); P = r.profiles; S.phone = r.phone; ME.premium_until = +r.premium_until || 0; persist(); } catch (e) { if (e.code !== 'net') P = []; }
}
function setActive(id, opts = {}) {
  S.active = id; persist();
  ui.cand = null; ui.team = null; ui.hist = null; ui.inbox = null; ui.slot = null; ui.calOff = 0; ui.calM = 0;
  const p = active();
  ui.tab = p && p.team ? 'team' : 'peers';
  applyAccent(); render(true);
  if (p && !p.complete && !opts.noWizard) wizOpen(p, { mode: 'resume' });
  if (p && p.complete) { loadPeers(); loadInbox(); if (p.team) loadTeam(); }
}
function applyAccent() {
  const p = active(), c = p ? profColor(p) : COLORS[0];
  document.documentElement.style.setProperty('--ac', c.c);
  document.documentElement.style.setProperty('--ac-ink', c.i);
}

/* ═════════ map kit (Neshan → MapLibre/OpenFreeMap → radial) ═════════ */
const MapKit = { lib: null, loading: null, failed: false };
function loadCss(href) { return new Promise(res => { if (document.querySelector(`link[href="${href}"]`)) return res(); const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.onload = res; l.onerror = res; document.head.appendChild(l); }); }
function loadJs(src, test, ms = 9000) {
  return new Promise((res, rej) => {
    if (test()) return res();
    const s = document.createElement('script'); s.src = src; s.async = true;
    const t = setTimeout(() => rej(new Error('timeout')), ms);
    s.onload = () => { clearTimeout(t); test() ? res() : rej(new Error('missing')); };
    s.onerror = () => { clearTimeout(t); rej(new Error('load')); };
    document.head.appendChild(s);
  });
}
const isDark = () => document.documentElement.dataset.theme === 'dark';
const wantNeshan = () => { const p = active(); return !!CFG.web_key && !MapKit.nDead && !(p && p.team); };
function neshanDown(why) { if (MapKit.nDead) return; MapKit.nDead = why || 'error'; try { sessionStorage.setItem('rs-ndead', MapKit.nDead); } catch (e) {} if (MapKit.lib && MapKit.lib.name === 'neshan') { MapKit.lib = null; MapKit.loading = null; } }
try { if (sessionStorage.getItem('rs-ndead')) MapKit.nDead = 'cached'; } catch (e) {}
async function mapLib() {
  if (MapKit.lib && (MapKit.lib.name === 'neshan') !== wantNeshan()) { MapKit.lib = null; MapKit.loading = null; }
  if (MapKit.lib) return MapKit.lib;
  if (MapKit.loading) return MapKit.loading;
  MapKit.loading = (async () => {
    if (wantNeshan()) {
      try {
        await loadCss('https://static.neshan.org/sdk/mapboxgl/v1.13.2/neshan-sdk/v1.1.3/index.css');
        await loadJs('https://static.neshan.org/sdk/mapboxgl/v1.13.2/neshan-sdk/v1.1.3/index.js', () => !!window.nmp_mapboxgl, 8000);
        return (MapKit.lib = { name: 'neshan', G: window.nmp_mapboxgl });
      } catch (e) { /* fall through to open map */ }
    }
    await loadCss('assets/maplibre-gl.css');
    await loadJs('assets/maplibre-gl.js', () => !!window.maplibregl, 12000);
    try { const pr = window.maplibregl.setRTLTextPlugin(new URL('assets/rtl-text.js?v=22', location.href).href, true); if (pr && pr.catch) pr.catch(() => { MapKit.noRtl = true; }); } catch (e) { MapKit.noRtl = true; }
    return (MapKit.lib = { name: 'libre', G: window.maplibregl });
  })();
  try { return await MapKit.loading; } catch (e) { MapKit.failed = true; MapKit.loading = null; throw e; }
}
async function makeMap(el, center, zoom) {
  const L = await mapLib();
  let map;
  if (L.name === 'neshan') map = new L.G.Map({ mapType: (isDark() && L.G.Map.mapTypes.neshanVectorNight) || L.G.Map.mapTypes.neshanVector, container: el, zoom, pitch: 0, center: [center[1], center[0]], minZoom: 4, maxZoom: 19, trackResize: true, mapKey: CFG.web_key, poi: false, traffic: false, mapTypeControllerOptions: { show: false } });
  else map = new L.G.Map({ container: el, style: isDark() ? 'assets/map-style-dark.json?v=22' : 'assets/map-style.json?v=22', center: [center[1], center[0]], zoom, attributionControl: { compact: true }, dragRotate: false, pitchWithRotate: false });
  await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('map-timeout')), 10000);
    map.on('load', () => { clearTimeout(t); res(); });
    // only a broken style is fatal; a failed tile, font or RTL-plugin fetch must not kill the map
    map.on('error', ev => { const er = ev && ev.error; if (L.name === 'neshan' && er && /40[1-3]|429|credit|quota|key/i.test(String(er.status || '') + ' ' + String(er.message || ''))) { neshanDown(String(er.status || 'key')); clearTimeout(t); return rej(new Error('neshan')); }
      if (!er || map.isStyleLoaded()) return; const u = String(er.url || ''), m = String(er.message || er); if (/\/styles?\//.test(u) || /style/i.test(m)) { clearTimeout(t); rej(new Error('style')); } });
  });
  if (L.name === 'libre') softenStyle(map);
  else map.on('error', ev => { const er = ev && ev.error; if (er && /40[1-3]|429/.test(String(er.status || ''))) { neshanDown(String(er.status)); if (PM.map === map) { PM.rebuild = true; setTimeout(() => { if (PM.rebuild) mountPeerMap(); }, 50); } } });
  try { map.touchZoomRotate && map.touchZoomRotate.disableRotation(); } catch (e) {}
  return { map, L };
}
function softenStyle(map) { // Persian names first; no broken Arabic shaping if the RTL plugin can't load
  try {
    for (const l of map.getStyle().layers) {
      if (l.type !== 'symbol' || !map.getLayoutProperty(l.id, 'text-field')) continue;
      if (MapKit.noRtl) map.setLayoutProperty(l.id, 'visibility', 'none');
      else map.setLayoutProperty(l.id, 'text-field', ['coalesce', ['get', 'name:fa'], ['get', 'name']]);
    }
    if (!isDark()) for (const l of map.getStyle().layers) if (l.type === 'background') map.setPaintProperty(l.id, 'background-color', '#F4F6F2');
  } catch (e) {}
}
let FONT_OK = !document.fonts || document.fonts.status === 'loaded';
try { document.fonts && document.fonts.ready.then(() => { if (!FONT_OK) { FONT_OK = true; PM.key = ''; drawPeers(); } }); } catch (e) {}
function badgeImg(kind, big) { const K = KINDS[kind] || KINDS.other, c = COLORS[K.c % COLORS.length], R = Math.min(3, devicePixelRatio || 1), z = big ? 40 : 28, cv = document.createElement('canvas'), x = cv.getContext('2d');
  cv.width = cv.height = z * R; x.scale(R, R); x.shadowColor = 'rgba(12,20,16,.3)'; x.shadowBlur = 4; x.shadowOffsetY = 1.5; x.fillStyle = c.c; x.beginPath(); x.roundRect(2, 2, z - 4, z - 4, big ? 12 : 9); x.fill(); x.shadowColor = 'transparent';
  x.lineWidth = big ? 3 : 2; x.strokeStyle = '#fff'; x.stroke(); const sy = document.getElementById('i-' + K.ic);
  if (sy) { x.save(); const k = (z - (big ? 16 : 12)) / 24; x.translate((big ? 8 : 6), (big ? 8 : 6)); x.scale(k, k); x.strokeStyle = c.i; x.lineWidth = 2.2; x.lineCap = 'round'; x.lineJoin = 'round';
    sy.querySelectorAll('path,circle,rect').forEach(el => { try { const P = el.tagName === 'rect' ? (() => { const q = new Path2D(); q.roundRect(+el.getAttribute('x'), +el.getAttribute('y'), +el.getAttribute('width'), +el.getAttribute('height'), +(el.getAttribute('rx') || 0)); return q; })() : el.tagName === 'circle' ? (() => { const q = new Path2D(); q.arc(+el.getAttribute('cx'), +el.getAttribute('cy'), +el.getAttribute('r'), 0, 7); return q; })() : new Path2D(el.getAttribute('d')); x.stroke(P); } catch (e) {} }); x.restore(); }
  return { img: x.getImageData(0, 0, cv.width, cv.height), R }; }
function placesLayer(M, L, id, places, sel, onPick) { // id: layer/source prefix
  for (const k of Object.keys(KINDS)) for (const big of [0, 1]) { const n = 'pb-' + k + big; if (!M.hasImage(n)) { const { img, R } = badgeImg(k, big); M.addImage(n, img, { pixelRatio: R }); } }
  const fc = { type: 'FeatureCollection', features: places.map(q => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [q.lng, q.lat] }, properties: { id: q.id, name: q.name, img: 'pb-' + (KINDS[q.kind] ? q.kind : 'other') + (q.id === sel ? 1 : 0), z: q.id === sel ? 1 : 0 } })) };
  if (M.getSource(id)) { M.getSource(id).setData(fc); return; }
  M.addSource(id, { type: 'geojson', data: fc });
  M.addLayer({ id, type: 'symbol', source: id, layout: { 'icon-image': ['get', 'img'], 'icon-allow-overlap': true, 'symbol-sort-key': ['get', 'z'] } });
  if (L.name !== 'neshan') M.addLayer({ id: id + '-t', type: 'symbol', source: id, minzoom: 14.5, layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'], 'text-size': 11, 'text-offset': [0, 1.5], 'text-anchor': 'top', 'text-optional': true, 'text-max-width': 9 }, paint: { 'text-color': isDark() ? '#E2E8F0' : '#334155', 'text-halo-color': isDark() ? '#0F172A' : '#FFFFFF', 'text-halo-width': 1.4 } });
  M.on('click', id, e => { const f = e.features && e.features[0]; if (f) onPick(f.properties.id); });
  M.on('mouseenter', id, () => { M.getCanvas().style.cursor = 'pointer'; }); M.on('mouseleave', id, () => { M.getCanvas().style.cursor = ''; });
}
async function peerPlaces() { const p = active(); if (!PM.map || !p || !p.data || !p.data.lat) return; if (!ui.showPl) { if (PM.map.getSource('rs-pl')) PM.map.getSource('rs-pl').setData({ type: 'FeatureCollection', features: [] }); return; }
  try { const r = await api('places_map', { lat: p.data.lat, lng: p.data.lng, r: 9000 }); ui.plList = r.places; placesLayer(PM.map, PM.L, 'rs-pl', r.places, p.place && p.place.id, id => placeCard(ui.plList.find(q => q.id === id), 'browse')); } catch (e) {} }
function pillImg(m, mine) { // draws the same pill as the old DOM marker into a canvas
  const t = m.team, c = t ? col(t.color) : null, bg = mine ? '#0C1410' : c ? c.c : '#8E9892', fg = mine ? '#fff' : c ? c.i : '#fff';
  const label = mine ? 'شما' : m.family || '', icons = [...(m.role === 'drive' || m.role === 'both' ? ['wheel'] : []), ...(m.role === 'pay' || m.role === 'both' ? ['coin'] : []), ...(mine ? [] : [m.pg === 'f' ? 'woman' : 'man'])];
  const R = Math.min(3, devicePixelRatio || 1), cv = document.createElement('canvas'), x = cv.getContext('2d'); x.font = '800 13px Vazirmatn, sans-serif';
  const tw = Math.ceil(x.measureText(label).width), w = tw + 20 + icons.length * 17, h = 38; cv.width = w * R; cv.height = h * R; x.scale(R, R);
  const sent = m.invite && m.invite.dir === 'out';
  x.shadowColor = 'rgba(12,20,16,.22)'; x.shadowBlur = 6; x.shadowOffsetY = 2; x.fillStyle = bg; x.beginPath(); x.roundRect(2, 2, w - 4, 26, 13); x.fill();
  x.shadowColor = 'transparent'; x.beginPath(); x.moveTo(w / 2 - 6, 27); x.lineTo(w / 2, 34); x.lineTo(w / 2 + 6, 27); x.fill();
  x.lineWidth = 2; x.strokeStyle = sent ? '#E2B84B' : '#fff'; x.beginPath(); x.roundRect(2, 2, w - 4, 26, 13); x.stroke();
  x.fillStyle = fg; x.direction = 'rtl'; x.textBaseline = 'middle'; x.textAlign = 'right'; x.fillText(label, w - 10, 16);
  icons.forEach((n, i) => { const sy = document.getElementById('i-' + n); if (!sy) return; x.save(); x.translate(8 + i * 17, 7.5); x.scale(15 / 24, 15 / 24); x.strokeStyle = fg; x.lineWidth = 2.2; x.lineCap = 'round'; x.lineJoin = 'round';
    sy.querySelectorAll('path,circle,rect').forEach(el => { try { const P = el.tagName === 'rect' ? (() => { const q = new Path2D(); q.roundRect(+el.getAttribute('x'), +el.getAttribute('y'), +el.getAttribute('width'), +el.getAttribute('height'), +(el.getAttribute('rx') || 0)); return q; })() : el.tagName === 'circle' ? (() => { const q = new Path2D(); q.arc(+el.getAttribute('cx'), +el.getAttribute('cy'), +el.getAttribute('r'), 0, 7); return q; })() : new Path2D(el.getAttribute('d')); x.stroke(P); } catch (e) {} }); x.restore(); });
  return { img: x.getImageData(0, 0, cv.width, cv.height), R };
}
function pointsLayer(feats) { // one GeoJSON source + one symbol layer; images cached by look
  const M = PM.map; PM.imgs = PM.imgs || {};
  for (const f of feats) { const k = f.properties.img; if (!PM.imgs[k] || !M.hasImage(k)) { const { img, R } = pillImg(f.properties._m, f.properties.mine); M.addImage(k, img, { pixelRatio: R }); PM.imgs[k] = 1; } delete f.properties._m; }
  const fc = { type: 'FeatureCollection', features: feats };
  if (!M.getSource('rs-pts')) {
    M.addSource('rs-pts', { type: 'geojson', data: fc });
    M.addLayer({ id: 'rs-pts', type: 'symbol', source: 'rs-pts', layout: { 'icon-image': ['get', 'img'], 'icon-anchor': 'bottom', 'icon-allow-overlap': true, 'icon-ignore-placement': true, 'symbol-sort-key': ['get', 'z'] } });
    M.on('click', 'rs-pts', e => { const f = e.features && e.features[0]; if (!f || f.properties.mine) return; const m = ((ui.cand || {}).list || []).find(x => x.id === f.properties.id); if (m) famSheet(m); });
    M.on('mouseenter', 'rs-pts', () => { M.getCanvas().style.cursor = 'pointer'; }); M.on('mouseleave', 'rs-pts', () => { M.getCanvas().style.cursor = ''; });
  } else M.getSource('rs-pts').setData(fc);
}
function markerEl(m, mine) {
  const el = document.createElement('div');
  const t = m.team, c = t ? col(t.color) : null;
  el.className = 'mk' + (mine ? ' me' : '') + (m.invite && m.invite.dir === 'out' ? ' sent' : '');
  el.style.setProperty('--mc', c ? c.c : '#8E9892'); el.style.setProperty('--mi', c ? c.i : '#fff');
  const roles = (m.role === 'drive' || m.role === 'both' ? ic('wheel', '') : '') + (m.role === 'pay' || m.role === 'both' ? ic('coin', '') : '');
  el.innerHTML = `<div class="pill">${mine ? 'شما' : esc(m.family)} ${roles}${mine ? '' : ic(m.pg === 'f' ? 'woman' : 'man', '')}</div><div class="tip"></div>`;
  el.setAttribute('role', 'button'); el.tabIndex = 0;
  el.setAttribute('aria-label', mine ? 'موقعیت شما' : `خانواده ${m.family}، ${m.role === 'pay' ? 'هزینه می‌دهند' : 'رانندگی می‌کنند'}${t ? '، تیم ' + fa(t.no) : '، بدون تیم'}`);
  return el;
}

/* peer map: one persistent node moved between renders (no tile reloads) */
const PM = { node: null, map: null, L: null, markers: [], key: '', state: 'idle' };
if (/[?&]qa=1/.test(location.search)) { window.PM = PM; window.QA = { ui, wizRender, wizSteps }; }
async function mountPeerMap() {
  const slot = $('#peermap-slot'); if (!slot) return;
  const p = active(); if (!p || !p.data || !p.data.lat) return;
  if (!PM.node) { PM.node = document.createElement('div'); PM.node.className = 'mapc'; }
  slot.appendChild(PM.node);
  if (PM.state === 'failed') { $$('.seg').forEach(x => x.remove()); return radialInto(slot, p); }
  if (PM.map && PM.state === 'ok' && (PM.rebuild || (PM.L.name === 'neshan') !== wantNeshan() || PM.dark !== isDark())) { PM.rebuild = false; try { PM.markers.forEach(m => m.remove()); if (PM.car) PM.car.remove(); PM.map.remove(); } catch (e) {} PM.map = null; PM.car = null; PM.markers = []; PM.key = ''; PM.imgs = {}; PM.node.innerHTML = ''; PM.state = 'idle'; }
  if (!PM.map && PM.state !== 'loading') {
    PM.state = 'loading';
    try { PM.dark = isDark(); const r = await makeMap(PM.node, [p.data.lat, p.data.lng], 14); PM.map = r.map; PM.L = r.L; PM.state = 'ok'; PM.imgs = {}; }
    catch (e) { if (String(e && e.message) === 'neshan') { PM.state = 'idle'; PM.node.innerHTML = ''; return mountPeerMap(); }
      PM.state = 'failed'; PM.err = String(e && e.message || e); const s2 = $('#peermap-slot'); if (s2) radialInto(s2, p); $$('.seg').forEach(x => x.remove()); return; }
  }
  if (PM.map) { PM.map.resize(); drawPeers(); if (ui.showPl) peerPlaces(); }
  const src = $('#map-src'); if (src) src.textContent = PM.L ? (PM.L.name === 'neshan' ? 'نقشه‌ی نشان' : 'نقشه‌ی باز (OSM)') : '';
}
const isDesk = () => matchMedia('(min-width:1100px)').matches;
const fitPad = t => isDesk() && !document.body.classList.contains('map-full') ? { top: t + 30, bottom: 60, left: 60, right: 470 } : { top: t, bottom: 50, left: 45, right: 45 };
function drawPeers() {
  if (!PM.map || !ui.cand) return;
  const p = active(); const list = filtered(ui.cand.list);
  const key = p.id + '|' + (ui.mview || '') + '|' + list.map(m => m.id + (m.team ? m.team.id : '') + (m.invite ? m.invite.dir : '')).join(',');
  if (key === PM.key) return; PM.key = key;
  PM.markers.forEach(m => m.remove()); PM.markers = [];
  const G = PM.L.G, B = new G.LngLatBounds(), feats = [];
  const look = (m, mine) => [mine ? 'me' : m.family, m.role, m.pg, m.team ? m.team.color : '', m.invite && m.invite.dir === 'out' ? 's' : ''].join('|');
  const add = PM.noLayer ? null : (m, mine) => feats.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [m.lng, m.lat] }, properties: { id: m.id || 'me', mine: !!mine, img: 'pl' + (FONT_OK ? 1 : 0) + ':' + look(m, mine), z: mine ? 0 : 1, _m: m } });
  const addDom = (m, mine) => { const el = markerEl(m, mine); if (!mine) el.addEventListener('click', () => famSheet(m)); el.addEventListener('keydown', e => { if (e.key === 'Enter' && !mine) famSheet(m); }); PM.markers.push(new G.Marker({ element: el, anchor: 'bottom' }).setLngLat([m.lng, m.lat]).addTo(PM.map)); };
  const put = add || addDom;
  const flush = () => { if (!add) return; try { pointsLayer(feats); } catch (e) { PM.noLayer = true; PM.key = ''; return drawPeers(); } };
  put({ lat: p.data.lat, lng: p.data.lng, family: 'شما', role: p.data.role, pg: p.data.pg, team: p.team }, true);
  B.extend([p.data.lng, p.data.lat]);
  const near = list.filter(m => !m.dist || m.dist.m < 4500).slice(0, 14);
  list.forEach(m => put(m, false)); flush();
  near.forEach(m => B.extend([m.lng, m.lat]));
  const dst = p.place && p.place.lat ? p.place : null, trip = isTrip(p);
  // trips: the hub is the origin and home is the destination
  const A = trip && dst ? [dst.lng, dst.lat] : null;
  if (ui.mview === 'dest' && dst) {
    const pts = [[p.data.lng, p.data.lat], ...near.slice(0, 6).map(m => [m.lng, m.lat])];
    const home = [pts.reduce((a, x) => a + x[0], 0) / pts.length, pts.reduce((a, x) => a + x[1], 0) / pts.length];
    const from = trip ? A : home, to = trip ? [p.data.lng, p.data.lat] : [dst.lng, dst.lat];
    const de = document.createElement('div'); de.className = 'mk dest'; de.innerHTML = `<div class="pill">${ic(trip ? 'train' : 'flag', '')}${esc(trip ? placeName(p) : dst.name)}</div><div class="tip"></div>`;
    PM.markers.push(new G.Marker({ element: de, anchor: 'bottom' }).setLngLat([dst.lng, dst.lat]).addTo(PM.map));
    if (!trip) { const he = document.createElement('div'); he.className = 'hood-ring'; he.innerHTML = `<span>محله‌ی شما${near.length ? ' و ' + fa(Math.min(6, near.length)) + ' هم‌مسیر' : ''}</span>`; PM.markers.push(new G.Marker({ element: he, anchor: 'center' }).setLngLat(home).addTo(PM.map)); }
    arcLayer(from, to, profColor(p).c);
    B.extend(from); B.extend(to);
    return PM.map.fitBounds(B, { padding: fitPad(80), maxZoom: 15, duration: 650 });
  }
  arcLayer(null);
  liveMarker();
  if (near.length) PM.map.fitBounds(B, { padding: fitPad(70), maxZoom: 15.5, duration: 600 });
  else PM.map.flyTo({ center: [p.data.lng, p.data.lat], zoom: 14.5, duration: 400 });
}
function arcPts(a, b) { // quadratic bezier bulging to the side: reads as "from here to there"
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1];
  const c = [mx - dy * 0.28, my + dx * 0.28], out = [];
  for (let i = 0; i <= 48; i++) { const t = i / 48, u = 1 - t; out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); }
  return out;
}
function arcLayer(a, b, color) {
  const M = PM.map; if (!M) return;
  const empty = { type: 'FeatureCollection', features: [] };
  try {
    if (!M.getSource('rs-arc')) {
      M.addSource('rs-arc', { type: 'geojson', data: empty }); M.addSource('rs-head', { type: 'geojson', data: empty });
      M.addLayer({ id: 'rs-arc-halo', type: 'line', source: 'rs-arc', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': 8, 'line-opacity': .9 } });
      M.addLayer({ id: 'rs-arc', type: 'line', source: 'rs-arc', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': color || '#16A34A', 'line-width': 4, 'line-dasharray': [1.6, 1.4] } });
      M.addLayer({ id: 'rs-head', type: 'fill', source: 'rs-head', paint: { 'fill-color': color || '#16A34A' } });
    }
    if (!a) { M.getSource('rs-arc').setData(empty); M.getSource('rs-head').setData(empty); return; }
    const L = arcPts(a, b), e = L[L.length - 1], q = L[L.length - 5];
    const k = Math.cos(e[1] * Math.PI / 180), vx = (e[0] - q[0]) * k, vy = e[1] - q[1], n = Math.hypot(vx, vy) || 1, s = Math.max(hav(a[1], a[0], b[1], b[0]) / 111320 * .07, .0012);
    const ux = vx / n, uy = vy / n, bx = e[0] - ux * s / k, by = e[1] - uy * s;
    const head = [[e[0], e[1]], [bx - uy * s * .6 / k, by + ux * s * .6], [bx + uy * s * .6 / k, by - ux * s * .6], [e[0], e[1]]];
    M.setPaintProperty('rs-arc', 'line-color', color); M.setPaintProperty('rs-head', 'fill-color', color);
    M.getSource('rs-arc').setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: L.slice(0, -3) } });
    M.getSource('rs-head').setData({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [head] } });
  } catch (e) {}
}
function radialInto(slot, p) {
  const list = ui.cand ? filtered(ui.cand.list) : [], c0 = { lat: p.data.lat, lng: p.data.lng };
  const pts = list.map(m => { let dx = (m.lng - c0.lng) * 111.32 * Math.cos(c0.lat * Math.PI / 180), dy = (m.lat - c0.lat) * 110.57; const r = Math.hypot(dx, dy); if (r > 3) { dx *= 3 / r; dy *= 3 / r; } return [dx * 31, -dy * 31, m]; });
  for (let it = 0; it < 6; it++) for (let i = 0; i < pts.length; i++) for (let k = 0; k < i; k++) { const dx = pts[i][0] - pts[k][0], dy = pts[i][1] - pts[k][1], d = Math.hypot(dx, dy) || .01; if (d < 22) { const m = (22 - d) / 2; pts[i][0] += dx / d * m; pts[i][1] += dy / d * m; pts[k][0] -= dx / d * m; pts[k][1] -= dy / d * m; } }
  slot.innerHTML = `<svg viewBox="-104 -104 208 208" class="radial" style="width:100%;height:100%;display:block" role="img" aria-label="نقشه‌ی ساده‌ی همسایه‌ها"><defs><radialGradient id="rg-soft"><stop offset="0" stop-color="#FFF8E6"/><stop offset=".55" stop-color="#EEF7EE"/><stop offset="1" stop-color="#E4F1EC"/></radialGradient></defs><rect x="-104" y="-104" width="208" height="208" fill="url(#rg-soft)"/>
    ${[3, 2, 1].map(k => `<circle r="${k * 31}" fill="${['#DDEFE3', '#E7F4E9', '#F1F9F1'][k - 1]}" fill-opacity=".7" stroke="#CFE6D6" stroke-width=".5"/><text x="0" y="${-k * 31 + 5.5}" text-anchor="middle" font-size="4" fill="#6B8A78">${fa(k)} کیلومتر</text>`).join('')}
    <g><circle r="10" fill="#16A34A" fill-opacity=".15"/><circle r="6.5" fill="#16A34A" stroke="#fff" stroke-width="1.5"/><text y="15" text-anchor="middle" font-size="5" font-weight="900" fill="var(--ink)">شما</text></g>
    ${pts.map(([x, y, m]) => { const c = m.team ? col(m.team.color) : { c: '#8E9892', i: '#fff' }; return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" data-a="cand" data-id="${m.id}" style="cursor:pointer"><rect x="-13" y="-6" width="26" height="11" rx="5.5" fill="${c.c}" stroke="#fff" stroke-width="1.2" style="filter:drop-shadow(0 1px 1.5px rgba(12,20,16,.18))"/><text y="2" text-anchor="middle" font-size="4.6" font-weight="800" fill="${c.i}">${esc(m.family)}</text></g>`; }).join('')}</svg>`;
  const src = $('#map-src'); if (src) src.textContent = 'نقشه‌ی ساده (نقشه‌ی خیابانی در دسترس نیست)';
}

/* picker map (wizard): fixed centre pin, Snapp-style */
const PK = { map: null, L: null, node: null, cb: null, loading: false };
async function mountPicker(slotSel, center, cb) {
  const slot = $(slotSel); if (!slot) return;
  PK.cb = cb;
  if (!PK.node) { PK.node = document.createElement('div'); PK.node.className = 'mapc'; }
  slot.querySelector('.mapc-holder').appendChild(PK.node);
  if (PK.loading) return;
  if (!PK.map) {
    PK.loading = true;
    try {
      const r = await makeMap(PK.node, center, 15.5); PK.map = r.map; PK.L = r.L; PK.loading = false;
      PK.map.on('movestart', () => { const b = PK.node.closest('.mapbox'); b && b.classList.add('moving'); });
      PK.map.on('moveend', () => { const b = PK.node.closest('.mapbox'); b && b.classList.remove('moving'); const c = PK.map.getCenter(); if (PK.prog && Math.abs(c.lat - PK.prog[0]) < 1e-6 && Math.abs(c.lng - PK.prog[1]) < 1e-6) { PK.prog = null; return; } PK.prog = null; PK.cb && PK.cb(+c.lat.toFixed(5), +c.lng.toFixed(5)); });
    } catch (e) { PK.loading = false; const h = document.querySelector(slotSel + ' .mapc-holder'); if (!h) return; h.innerHTML = `<div class="empty" style="height:100%;align-content:center">${ic('pin')}<b>نقشه در دسترس نیست</b><span class="small">با «موقعیت فعلی من» یا چسباندن لینک موقعیت ادامه دهید.</span></div>`; return; }
  } else { PK.map.resize(); PK.prog = [center[0], center[1]]; PK.map.jumpTo({ center: [center[1], center[0]] }); }
}

/* ═════════ matching (client ranking; server validates) ═════════ */
function score(p, m) {
  const d = p.data, r = []; let s = 0;
  if (m.dist) { s += Math.max(0, 45 * (1 - m.dist.m / 5000)); r.push([`${km1(m.dist.m / 1000)} کیلومتر مسیر · ${mins(m.dist.s)} دقیقه${m.dist.src === 'road' ? '' : ' (تقریبی)'}`, m.dist.m <= 2000]); }
  const dA = d.role === 'drive' || d.role === 'both', dB = m.role === 'drive' || m.role === 'both';
  if (dA && dB) { s += 28; r.push(['هر دو رانندگی می‌کنید', 1]); } else if (dA || dB) { s += 25; r.push([dB ? 'رانندگی می‌کنند' : 'شما رانندگی می‌کنید', 1]); } else r.push(['هر دو هزینه می‌دهید؛ راننده لازم است', 0]);
  const myG = (d.kids && d.kids[0] && d.kids[0].g) || d.pg;
  if ((d.values || []).includes('samegender') && dB && m.pg !== myG) { s -= 18; r.push(['با ترجیح «راننده هم‌جنس» شما جور نیست', 0]); }
  if ((m.values || []).includes('samegender') && dA && d.pg !== (m.kids[0] || {}).g) { s -= 18; r.push(['با ترجیح «راننده هم‌جنس» ایشان جور نیست', 0]); }
  if ((d.values || []).includes('parent') && dB && ['brother', 'sister'].includes(m.rel)) { s -= 12; r.push(['ترجیح «راننده حتماً از والدین» شما: راننده‌شان ' + relLabel(m) + ' است', 0]); }
  (d.values || []).filter(v => v !== 'samegender' && v !== 'religious' && (m.values || []).includes(v)).forEach(v => { s += 6; r.push(['ارزش مشترک: ' + VALUES[v], 1]); });
  if (d.job && m.job === d.job) { s += 8; r.push([`هر دو ${JOB_L[d.job]}`, 1]); }
  if ((d.values || []).includes('religious')) { if (m.relig) { s += 8; r.push(['خانواده‌ای مذهبی‌اند', 1]); } else if ((m.values || []).includes('religious')) { s += 4; r.push(['آن‌ها هم مذهبی بودن را ترجیح می‌دهند', 1]); } }
  if ((m.values || []).includes('religious') && d.relig) { s += 4; r.push(['ترجیح ایشان «خانواده‌ی مذهبی» با شما جور است', 1]); }
  if ((d.needs || {}).out === (m.needs || {}).out || (d.needs || {}).back === (m.needs || {}).back) s += 12;
  return { score: Math.max(0, Math.min(100, Math.round(s))), reasons: r };
}
function filtered(list) {
  return list.filter(m => ui.filter === 'free' ? !m.team : ui.filter === 'drivers' ? (m.role !== 'pay') : ui.filter === 'teams' ? !!m.team : true);
}
function smartTeam(p, list) {
  const free = list.filter(m => !m.team && m.rule_ok && !m.mate).sort((a, b) => (a.dist ? a.dist.m : 9e9) - (b.dist ? b.dist.m : 9e9));
  const d = p.data, drives = d.role !== 'pay', pick = [];
  if (!drives) { const dv = free.find(m => m.role !== 'pay'); if (dv) pick.push(dv); }
  const mine = d.kids && d.kids.length ? d.kids.map(k => ({ g: k.g, age: k.by ? JY - k.by : null })) : [{ g: d.pg, age: 30 }];
  const allKids = () => [...(d.kids || []).map(k => ({ age: k.by ? JY - +k.by : null })), ...pick.flatMap(m => m.kids || [])];
  const seats = () => seatCap(Math.max(drives ? d.seats || 0 : 0, ...pick.filter(m => m.role !== 'pay').map(m => m.seats || 0), 0), allKids());
  const kids = () => mine.length + pick.reduce((a, m) => a + m.kids.length, 0);
  const genders = () => [...mine, ...pick.flatMap(m => m.kids)];
  const ruleOk = arr => { const g = arr.filter(k => k.g === 'f'), b = arr.filter(k => k.g === 'm'); if (!g.length || !b.length) return true; return g.every(k => k.age != null && k.age <= 8) && b.every(k => k.age != null && k.age <= 12); };
  for (const m of free) { if (pick.includes(m) || pick.length >= 3) continue; if (m.dist && m.dist.m > 4000) break; if (kids() + m.kids.length > Math.max(seats(), m.role !== 'pay' ? m.seats : 0)) continue; if (!ruleOk([...genders(), ...m.kids])) continue; pick.push(m); }
  if (!pick.length) return null;
  return { list: pick, drivers: pick.filter(m => m.role !== 'pay').length + (drives ? 1 : 0), seats: seats(), kids: kids() };
}
async function loadPeers() {
  const p = active(); if (!p || !p.complete || !S.token) return;
  try { ui.cand = await api('candidates', { profile_id: p.id }); PM.key = ''; if (ui.tab === 'peers' && !ui.wiz) { renderMain(); } } catch (e) { if (e.code !== 'net') fail(e); }
}
async function loadInbox(mark) {
  const p = active(); if (!p || !p.complete || !S.token) return;
  try {
    const prevTeam = p.team && p.team.id, prevInv = ui.inbox ? ui.inbox.invites.length : 0;
    ui.inbox = await api('inbox', { profile_id: p.id, mark: !!mark });
    const np = ui.inbox.profile; const idx = P.findIndex(x => x.id === np.id); if (idx >= 0) P[idx] = np;
    if ((np.team && np.team.id) !== prevTeam) { applyAccent(); if (np.team) { snd('done'); snack(`${teamName(np.team)} شکل گرفت! 🎉`, 'دیدن تیم', () => { ui.tab = 'team'; render(true); }); notify('رسیدیم', `${teamName(np.team)} شکل گرفت!`); loadTeam(); } loadPeers(); }
    if (ui.inbox.invites.length > prevInv && prevInv >= 0 && ui.inbox.invites.length) notify('رسیدیم', 'یک دعوت هم‌مسیری تازه دارید.');
    { const nn = (ui.inbox.notes || []).filter(n => (n.kind === 'near' || n.kind === 'urgent') && n.created > (S.nearSeen || 0)); if (nn.length) { S.nearSeen = Math.max(...nn.map(n => n.created)); persist(); if (Date.now() / 1000 - nn[0].created < 600) doorAlert(nn[0].text); } }
    paintBell(); if (!ui.wiz) renderTop(); dupCheck();
  } catch (e) {}
}
function doorAlert(text) { snd('arrive'); setTimeout(() => snd('honk'), 900); setTimeout(() => snd('arrive'), 1800); haptic('heavy'); notify('رسیدیم 🚗', text);
  sheet(/^فوری/.test(text) ? 'پیام فوری ⚡' : 'سرویس می‌رسد', `<div class="door-al"><span class="door-car">${CARTOON_CAR}</span><b>${esc(text)}</b></div><button class="btn ac block big" data-a="close">باشه، آماده‌ایم</button>`); }
async function dupCheck() { const p = active(); if (!p || !p.complete || p.shared || (S.dupSeen || {})[p.id]) return; try { const r = await api('dup_find', { profile_id: p.id }); S.dupSeen = { ...(S.dupSeen || {}), [p.id]: 1 }; persist(); if (!r.list.length) return; ui.dups = r.list;
    sheet('این خانواده تکراری است؟', `<p style="line-height:2">به نظر می‌رسد «خانواده ${esc(p.data.family)}» بیش از یک بار برای ${esc(placeName(p))} ثبت شده. اگر همان شما هستید، یکی‌شان کنیم تا هم‌مسیرها گیج نشوند.</p>
      ${r.list.map(o => `<div class="dup-row"><span class="grow"><b>${esc(o.label)}</b><small>${esc(o.hood)} · ${fa(o.kids)} فرزند · ${o.complete ? 'کامل' : 'نیمه‌کاره'}${o.team ? ' · در تیم' : ''}${o.mine ? ' · در همین حساب' : o.phone ? ' · شماره‌ی ' + `<span dir="ltr">${esc(o.phone)}</span>` : ' · مهمان'}</small></span><button class="btn sm" data-a="dup-pick" data-id="${o.id}">این هم من هستم</button></div>`).join('')}
      <button class="btn line block" data-a="close">نه، خانواده‌ی دیگری است</button>`); } catch (e) {} }
async function loadTeam() {
  const p = active(); if (!p || !p.team) { ui.team = null; return; }
  try { const [t, h] = await Promise.all([api('team_state', { profile_id: p.id }), api('team_history', { profile_id: p.id }).catch(() => null)]); ui.team = t; if (h) ui.hist = h; if (!ui.wiz && ui.tab !== 'peers') renderMain(); remindTurns(); } catch (e) { if (e.code !== 'net') fail(e); }
}
const teamName = t => `تیم ${fa(t.no)} · محله ${t.hood}`;

/* ═════════ daily plan (deterministic on every device) ═════════ */
/* ═════════ dates: Saturday weeks, Jalali labels (Intl persian calendar, no library) ═════════ */
const pad2 = n => String(n).padStart(2, '0');
const ymd = t => t.getFullYear() + '-' + pad2(t.getMonth() + 1) + '-' + pad2(t.getDate());
const ymdD = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d, 12); };
const addD = (t, n) => { const x = new Date(t); x.setDate(x.getDate() + n); return x; };
function satOf(off = 0) { const t = new Date(); t.setHours(12, 0, 0, 0); return addD(t, -((t.getDay() + 1) % 7) + off * 7); }
const weekIdx = sat => Math.floor(Date.UTC(sat.getFullYear(), sat.getMonth(), sat.getDate()) / 864e5 / 7);
const JF = (() => { try { return new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', { year: 'numeric', month: 'numeric', day: 'numeric' }); } catch (e) { return null; } })();
const JM = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
function jp(t) { if (!JF) return { y: t.getFullYear(), m: t.getMonth() + 1, d: t.getDate() }; const o = {}; JF.formatToParts(t).forEach(x => { if (x.type !== 'literal') o[x.type] = parseInt(x.value, 10); }); return { y: o.year, m: o.month, d: o.day }; }
const jLabel = t => { const j = jp(t); return fa(j.d) + ' ' + JM[j.m - 1]; };
const isRot = pl => !!(pl && (pl.rot || pl.shift === 'چرخشی' || /چرخشی/.test(pl.shift || '')));
const rotNow = (d, off = 0) => d && d.rot_par != null ? ((weekIdx(satOf(off)) % 2) === d.rot_par ? 'am' : 'pm') : 'am';
function slotsOf(place, off = 0) {
  const days = (place && place.days && place.days.length) ? place.days : [0, 1, 2, 3, 4], out = [], a = active(), pm = isRot(place) && place.in2 && a && rotNow(a.data, off) === 'pm';
  const tin = pm ? place.in2 : (place && place.in) || '07:30', tout = pm ? place.out2 : (place && place.out) || '13:30';
  days.forEach(d => ['out', 'back'].forEach(dir => out.push({ id: d + '-' + dir, d, dir, time: dir === 'out' ? tin : tout }))); return out;
}
/* real capacity: 4, or 5 when every child riding is under 10 (car models change, so we never trust the car) */
const seatCap = (seats, kids) => Math.min(seats || 0, (seats || 0) >= 5 && kids.length && kids.every(k => k.age != null && k.age < 9) ? 5 : 4);
const teamCap = kids => kids.length && kids.every(k => k.age != null && k.age >= 18) ? 5 : kids.length && kids.every(k => k.age != null && k.age < 9) ? 5 : 4;
const ridersOf = (T, dir) => T.members.filter(m => (m.needs || {})[dir] !== false).flatMap(m => m.kids.map(k => ({ ...k, pid: m.id })));
const driverOk = (T, m, dir) => (m.role === 'drive' || m.role === 'both') && ridersOf(T, dir).every(k => { const o = T.members.find(x => x.id === k.pid); return !(o.values || []).includes('samegender') || o.id === m.id || m.pg === k.g; });
function planOf(T) {
  const c = {}, plan = {}; T.members.forEach(m => c[m.id] = 0);
  slotsOf(T.place).forEach(x => {
    if (!ridersOf(T, x.dir).length) { plan[x.id] = null; return; }
    const pool = T.members.filter(m => driverOk(T, m, x.dir)).sort((a, b) => ((b.days || []).includes(x.d) - (a.days || []).includes(x.d)) || ((b.daily ? 1 : 0) - (a.daily ? 1 : 0)) || (c[a.id] - c[b.id]) || ((b.seats || 0) - (a.seats || 0)) || (a.id < b.id ? -1 : 1));
    plan[x.id] = pool[0] ? pool[0].id : null; if (pool[0]) c[pool[0].id]++;
  });
  return plan;
}
const recOf = (T, x, plan) => (ui.prac && ui.prac[x.id]) || T.trips[x.id] || { status: 'pending', exec: plan[x.id], arr: {}, empty: 0 };
const mem = (T, id) => T.members.find(m => m.id === id);
const fam = m => m ? 'خانواده ' + m.family : '—';
const kidName = (k, m) => k.first ? k.first + ' ' + m.family : (m.pg === 'f' ? 'خانم ' : 'آقای ') + m.family;
function focusSlot(T, plan) { const L = slotsOf(T.place); if (ui.slot) { const f = L.find(x => x.id === ui.slot); if (f) return f; } const ord = [...L.filter(x => x.d >= TODAY), ...L.filter(x => x.d < TODAY)]; return ord.find(x => recOf(T, x, plan).status !== 'done') || ord[0]; }
const dayWord = d => d === TODAY ? 'امروز' : d === (TODAY + 1) % 7 ? 'فردا' : DAYS[d];
function balances(T) { const b = {}; T.members.forEach(m => b[m.id] = 0); T.ledger.forEach(e => Object.entries(e.d || {}).forEach(([k, v]) => { if (b[k] != null) b[k] += v; })); Object.keys(b).forEach(k => b[k] = Math.round(b[k])); return b; }
function settle(T) {
  const b = balances(T), deb = Object.entries(b).filter(([, v]) => v < -999).map(([k, v]) => [k, -v]).sort((x, y) => y[1] - x[1]), cre = Object.entries(b).filter(([, v]) => v > 999).sort((x, y) => y[1] - x[1]), out = []; let i = 0, j = 0;
  while (i < deb.length && j < cre.length) { const a = Math.min(deb[i][1], cre[j][1]), r = Math.round(a / 1000) * 1000; if (r >= 1000) out.push({ from: deb[i][0], to: cre[j][0], amt: r }); deb[i][1] -= a; cre[j][1] -= a; if (deb[i][1] < 1) i++; if (cre[j][1] < 1) j++; }
  return out;
}

/* ═════════ screens ═════════ */
const SLIDES = [
  { html: () => `<div class="sh-scene" id="sh-scene" data-step="2"><div class="sh-people">${[1, 2, 3, 4].map(i => `<span class="sh-p p${i}">${shapeAv('slide' + i, 54)}</span>`).join('')}</div><div class="sh-frac"><b id="sh-n">½</b><small>زحمت هر نفر</small></div></div><p class="sl-msg big" id="sh-say">یک هم‌مسیر پیدا کن؛<br><b>زحمتت نصف!</b></p>`, b: 'پیدا کردن هم‌مسیر', a: 'new-profile' },
  { html: `<div class="hm-scene" aria-hidden="true"><span class="hm h1">🏠</span><svg class="hm-line" viewBox="0 0 120 20"><path d="M4 14 Q60 -6 116 14"/></svg><span class="hm-heart">💚</span><span class="hm h2">🏠</span></div><p class="sl-msg big"><b>ما راننده نداریم 🙂</b><br>والدینِ هم‌مسیر را به هم می‌رسانیم.</p>`, b: '', a: '' },
  { html: `<div class="ps-scene" aria-hidden="true"><span class="ps-phone">📱</span><span class="ps-fly f1">🖼️</span><span class="ps-fly f2">💬</span><span class="ps-fly f3">🏫</span></div><p class="sl-msg big"><b>پوستر مدرسه را در گروه کلاس بگذار.</b><br>هر خانواده‌ی تازه، نوبت همه را سبک‌تر می‌کند.</p>`, b: 'ساختن پوستر مدرسه', a: 'new-profile' }
];
const SH_SAY = { 2: ['½', 'یک هم‌مسیر پیدا کن؛<br><b>زحمتت نصف!</b>'], 3: ['⅓', 'دو هم‌مسیر پیدا کردی؟<br><b>یک‌سوم!</b>'], 4: ['¼', 'سه هم‌مسیر؟<br><b>فقط یک‌چهارم!</b>'] };
function shareStep() { const sc = $('#sh-scene'); if (!sc) return; const n = +sc.dataset.step === 4 ? 2 : +sc.dataset.step + 1; sc.dataset.step = n; const [f, t] = SH_SAY[n]; const b = $('#sh-n'); b.textContent = f; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); $('#sh-say').innerHTML = t; }
function peekWatch() { const b = $('.peek'); if (!b || b.dataset.w) return; b.dataset.w = 1; const L = $('#peer-list');
  const upd = () => { if (!document.body.contains(b)) return removeEventListener('scroll', upd); const top = L ? L.getBoundingClientRect().top : 0; b.classList.toggle('gone', top < innerHeight * .55); };
  addEventListener('scroll', upd, { passive: true }); setTimeout(upd, 400); }
function slideWatch() { const tr = $('#sl-track'); if (!tr || tr.dataset.w) return; tr.dataset.w = 1; let i = 0, hold = 0;
  const dots = () => $$('.sl-dots button').forEach((b, k) => b.toggleAttribute('aria-current', k === i));
  tr.addEventListener('scroll', () => { clearTimeout(tr._t); tr._t = setTimeout(() => { const w = tr.clientWidth || 1; i = Math.round(Math.abs(tr.scrollLeft) / w); dots(); }, 80); }, { passive: true });
  ['pointerdown', 'touchstart', 'focusin'].forEach(ev => tr.addEventListener(ev, () => { hold = Date.now(); }, { passive: true }));
  clearInterval(ui.shT); ui.shT = setInterval(() => { if (!document.body.contains(tr)) return clearInterval(ui.shT); if (i === 1 && !document.hidden) shareStep(); }, 1900);
  clearInterval(ui.slT); ui.slT = setInterval(() => { if (!document.body.contains(tr)) return clearInterval(ui.slT); if (document.hidden || Date.now() - hold < 12000 || matchMedia('(prefers-reduced-motion:reduce)').matches) return; if (i === 1 && $('#sh-scene') && $('#sh-scene').dataset.step !== '4') return; i = (i + 1) % tr.children.length; tr.children[i].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' }); dots(); }, 6500); }
function home() {
  const dr = S.drafts[0];
  return `<div class="home-grid"><section class="hero-g hero-sl" aria-roledescription="اسلاید"><div class="sl-track" id="sl-track"><div class="sl"><span class="small" style="font-weight:800">سرویس مشارکتی!</span><h1>مامان، بابا،<br>رسیدیم!</h1>
    <p>هم‌مسیرهای نزدیک‌تان را پیدا کنید، تیم شوید و نوبتی ببرید و بیاورید؛ برای مدرسه، مهد، آموزشگاه، باشگاه، محل کار و دانشگاه.</p>
    <div class="row wrap">${dr ? `<button class="btn" data-a="resume-draft">ادامه‌ی ثبت‌نام «${esc(dr.label || 'مسیرک')}»</button>` : `<button class="btn" data-a="new-profile">شروع کنیم؛ ۲ دقیقه</button>`}<button class="btn line" data-a="login">قبلاً ثبت‌نام کرده‌ام</button></div>${artCar('deco')}</div>${SLIDES.map((x, i) => `<div class="sl sl-${i + 1}">${typeof x.html === 'function' ? x.html() : x.html}${x.b ? `<button class="btn" data-a="${x.a}">${x.b}</button>` : ''}</div>`).join('')}</div>
    <div class="sl-dots" role="tablist">${[0, ...SLIDES.keys()].map((_, i) => `<button data-a="sl-go" data-v="${i}" aria-label="اسلاید ${fa(i + 1)}" ${i ? '' : 'aria-current="true"'}></button>`).join('')}</div></section>
  <section class="card stack h-map">${cityAnim('نوبتی می‌بریم، نوبتی می‌آوریم')}<button class="map-entry" data-a="px-open" data-m="browse">${ic('map')}<span class="grow"><b>مدرسه‌ها و مهدها روی نقشه</b><small>مدرسه‌ی بچه‌ها را پیدا کنید و ببینید چه کسانی هم‌مسیرند</small></span>${ic('back')}</button></section>
  <button class="school-main" data-a="new-profile" data-kind="school">
    <span class="sm-top">${kindIc('school', true)}<span class="sm-tag">بیشترین درخواست</span></span>
    <b>سرویس مشارکتی مدرسه</b>
    <span class="sm-txt">با خانواده‌های هم‌محله‌ی همان مدرسه، بچه‌ها را نوبتی ببرید و بیاورید. هر روز یک نفر می‌برد، بقیه وقت آزاد دارند؛ خرج نصف، خیال راحت.</span>
    <span class="sm-pts"><span>${ic('check')}دختر با دختر، پسر با پسر</span><span>${ic('check')}نزدیک‌ترین‌ها روی نقشه</span><span>${ic('check')}حساب شفاف</span></span>
    <span class="btn sm-cta">ثبت‌نام مدرسه؛ ۲ دقیقه ${ic('back')}</span></button>
  <section class="card stack h-code"><h2>کد مدرسه یا مکان دارید؟</h2><p class="muted small">روی پوستر هر مدرسه، آموزشگاه یا شرکت یک کد ۸ حرفی و لینکی مثل <b dir="ltr">residim.ir/ABCD2345</b> هست. کد را بزنید تا مستقیم به ثبت‌نام همان‌جا بروید؛ مکانش از قبل تنظیم شده و فقط بقیه را پر می‌کنید.</p><div class="row"><div class="field grow"><label for="code" class="hide">کد</label><input id="code" dir="ltr" placeholder="ABCD2345 یا لینک کامل" maxlength="60"></div><button class="btn" data-a="go-code">برو</button></div></section>
  <section class="card stack h-chips"><h2 style="font-size:1rem">برای جاهای دیگر هم هم‌مسیر پیدا کنید</h2>
    <div class="chips">${Object.entries(KINDS).filter(([k]) => k !== 'other' && k !== 'school' && (k !== 'station' || CFG.flags.station_on)).map(([k, v]) => `<button class="chip kchip" data-a="new-profile" data-kind="${k}">${ic(v.ic, 'i')}${k === 'station' ? 'برگشت از سفر' : v.n}</button>`).join('')}</div></section>
  <section class="card h-how"><h2 style="margin-bottom:10px">چطور کار می‌کند؟</h2><ol class="steps3"><li>چند سؤال ساده؛ کجا زندگی می‌کنید، کی می‌روید، چه سهمی دارید.</li><li>نزدیک‌ترین هم‌مسیرها را روی نقشه و فهرست می‌بینید؛ با یک تپ «هم‌مسیر شویم؟»</li><li>تیم که شدید، نوبت‌ها، رسیدن بچه‌ها و حساب‌ها روشن است.</li></ol></section></div>`;
}
function placeLanding(pl) {
  const k = KINDS[pl.kind] || KINDS.other;
  return `<section class="hero-g"><span class="small" style="font-weight:800">لینک رسیدیمِ ${esc(k.n)}</span><div class="row">${kindIc(pl.kind, true, true)}<h1 style="font-size:clamp(1.6rem,6vw,2.4rem)">${esc(pl.name)}</h1></div>
    <p>${esc(pl.city)}${pl.shift ? ' · ' + esc(pl.shift) : ''} · ورود ${clock(pl.in)} · پایان ${clock(pl.out)}</p>
    <p>${pl.families ? `${fa(pl.families)} خانواده از همین‌جا آمده‌اند؛ هم‌مسیرهای نزدیک‌تان را پیدا کنید.` : 'اولین نفر باشید و لینک را در گروه‌ها بفرستید!'}</p>
    <div class="row wrap"><button class="btn" data-a="join-place">پیوستن در ۲ دقیقه</button>${S.token ? '' : '<button class="btn line" data-a="login">ورود</button>'}</div>${artCar('deco')}</section>
    <div class="stats" style="margin-top:14px"><div class="stat"><b>${fa(pl.families || 0)}</b><span>خانواده</span></div><div class="stat"><b>${fa(pl.drivers || 0)}</b><span>راننده</span></div><div class="stat"><b>${fa(pl.teams || 0)}</b><span>تیم</span></div></div>
    <section class="card" style="margin-top:14px"><ol class="steps3"><li>چند سؤال ساده، گام‌به‌گام.</li><li>هم‌مسیرهای نزدیک روی نقشه.</li><li>با یک تپ «هم‌مسیر شویم؟»</li></ol></section>`;
}
function resumeCard(p) {
  const steps = wizSteps({ p, d: p.data || {}, kind: p.kind, link: null }), mk = missingStep(p), idx = Math.max(0, steps.findIndex(s => s.key === mk));
  const why = mk ? '' : (!S.token ? ' (شماره هنوز وارد نشده)' : '');
  return `<section class="card empty">${cityAnim('')}${kindIc(p.kind, true, true)}<h1 style="font-size:1.5rem">مسیرکِ «${esc(p.label)}» نیمه‌کاره است${why}</h1>
    <p class="muted">${fa(idx)} گام از ${fa(steps.length)} پاسخ داده‌اید. از همان‌جا ادامه دهید؛ چیزی از دست نرفته.</p>
    <div style="width:100%;max-width:340px" class="prog"><i style="width:${Math.round(idx / steps.length * 100)}%"></i></div>
    <button class="btn ac" data-a="wiz-resume">ادامه‌ی مسیرک</button></section>`;
}
function peersTab(p) {
  const d = p.data, C = ui.cand, list = C ? C.list : null, t = p.team;
  const mk = missingStep(p);
  const fix = mk ? `<div class="hint warn">${ic('warn')}<span class="grow">یک پاسخ مهم در مسیرک مانده است.</span><button class="btn sm" data-a="wiz-fix">پاسخ می‌دهم</button></div>` : '';
  if (!list) return `${fix}<div class="mapbox"><div id="peermap-slot" style="position:absolute;inset:0"></div><span class="badge-src" id="map-src"></span></div><p class="muted" style="text-align:center;margin-top:14px">در حال پیدا کردن هم‌مسیرهای نزدیک…</p>`;
  const avail = list.filter(m => m.rule_ok && !m.mate);
  const sorted = filtered(list).filter(m => !m.mate).sort((a, b) => (b.rule_ok - a.rule_ok) || ((a.dist ? a.dist.m : 9e9) - (b.dist ? b.dist.m : 9e9)));
  const sm = !t ? smartTeam(p, list) : null;
  let hint;
  if (!list.length) hint = `فعلاً اولین نفر هستید! لینک ${esc(placeName(p))} را در گروه‌ها بفرستید؛ هر کس نزدیک شما بیاید خبرتان می‌کنیم.`;
  else if (!t && isTrip(p)) hint = `${fa(avail.length)} هم‌سفر ${p.data.pg === 'f' ? 'خانم' : 'آقا'} حدود همان ساعت می‌رسند و مقصدشان نزدیک شماست.`;
  else if (!t) hint = `${fa(avail.filter(m => !m.team && m.dist && m.dist.m < 3000).length)} خانواده‌ی بی‌تیم در فاصله‌ی ۳ کیلومتری شما هستند. نزدیک‌ترین‌ها بالای فهرست‌اند.`;
  else hint = `شما در ${teamName(t)} هستید. برای اضافه کردن هم‌تیمی، از همین فهرست دعوت کنید.`;
  const peek = sorted.length && !isDesk() ? `<button class="peek" data-a="to-list" aria-label="رفتن به فهرست پیشنهادها">${HAND}<span>${fa(sorted.length)} پیشنهاد هم‌مسیر پایین‌تر است</span></button>` : '';
  return `${fix}${peek}<div class="split peers"><div class="stack">
      <div class="hint">${ic(t ? 'team' : 'spark')}<span>${hint}</span></div>
      <div class="mapbox"><div id="peermap-slot" style="position:absolute;inset:0"></div>
        <div class="seg" role="group" aria-label="نمای نقشه"><span class="seg-l">نما:</span><button data-a="mview" data-v="peers" aria-pressed="${ui.mview !== 'dest'}">${isTrip(p) ? 'هم‌سفرها' : 'هم‌مسیرها'}</button><button data-a="mview" data-v="dest" aria-pressed="${ui.mview === 'dest'}">${ic('flag')}تا ${esc(isTrip(p) ? 'مقصد' : destWord(p))}</button></div>
        <div class="tools"><div class="chiprow">${[['all', 'همه'], ['free', 'بی‌تیم'], ['drivers', 'راننده‌ها'], ['teams', 'تیم‌ها']].map(([k, v]) => `<button class="fchip" data-a="filter" data-v="${k}" aria-pressed="${ui.filter === k}">${v}</button>`).join('')}</div></div>
        <button class="fab" data-a="fit" aria-label="نمایش همه‌ی هم‌مسیرها">${ic('locate')}</button><div class="map-ctl"><button data-a="map-places" aria-pressed="${!!ui.showPl}" aria-label="نمایش مدرسه‌ها و مکان‌ها روی نقشه">${ic('school')}</button><button data-a="map-clean" aria-pressed="${document.body.classList.contains('map-clean')}" aria-label="نمایش یا پنهان کردن برچسب‌ها و فیلترها">${ic('eye')}</button><button data-a="map-full" aria-label="نقشه‌ی تمام‌صفحه">${ic(document.body.classList.contains('map-full') ? 'shrink' : 'expand')}</button></div><span class="badge-src" id="map-src"></span></div>
      <div class="legend" style="border:0;padding:0 4px">${ic('wheel')} رانندگی ${ic('coin')} هزینه ${ic('woman')} مادر ${ic('man')} پدر <span><i class="team-dot" style="background:#8E9892;box-shadow:none"></i>بی‌تیم</span></div>
      ${!list.length ? `<div class="card empty">${cityAnim('هر خانواده‌ای که بیاید، مسیر کوتاه‌تر می‌شود')}<b>اینجا به‌زودی شلوغ می‌شود!</b><p class="muted small">پوستر و لینک ${esc(placeName(p))} را بفرستید؛ هر ثبت‌نام نزدیک شما را خبر می‌دهیم.</p><button class="btn ac" data-a="poster">${ic('share')}لینک و پوستر</button></div>` : ''}
    </div>
    <aside class="stack" id="peer-list">
      ${sm ? `<div class="card stack"><div class="row between"><h2>${ic('spark')} چینش پیشنهادی برای شما</h2></div>
        <p class="small">شما + ${sm.list.map(m => esc('خانواده ' + m.family)).join(' + ')}</p><p class="muted small">${fa(sm.drivers)} راننده · ${fa(sm.kids)} مسافر · ${fa(sm.seats)} صندلی</p>
        ${sm.drivers ? '' : `<p class="note" style="color:var(--warn)">${ic('warn')}راننده ندارد؛ یک خانواده‌ی راننده هم دعوت کنید.</p>`}
        <button class="btn ac block" data-a="invite-all">دعوت از همه: هم‌مسیر شویم؟</button></div>` : ''}
      ${sorted.length ? `<div class="row between"><h2>هم‌مسیرهای بالقوه</h2><span class="muted small">از نزدیک به دور</span></div>${CFG.flags.cand_swipe && !isDesk() ? `<div class="cswipe" role="list">${sorted.slice(0, 30).map(m => `<div class="cs-item" role="listitem">${candCard(p, m)}</div>`).join('')}</div><p class="muted small" style="text-align:center">${fa(sorted.length)} پیشنهاد؛ ورق بزنید ←</p>` : sorted.slice(0, 30).map(m => candCard(p, m)).join('')}` : ''}
      <div class="row wrap"><button class="btn line sm" data-a="poster">${ic('print')}لینک و پوستر ${esc(destWord(p))}</button></div>
    </aside></div>`;
}
const SHAPES = ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z', 'M5 5h14v14H5Z', 'M12 3.5 21 19.5H3Z', 'M12 2.5 21.5 12 12 21.5 2.5 12Z', 'M12 2.8 20 7.4v9.2l-8 4.6-8-4.6V7.4Z', 'M12 2.8l2.6 6 6.4.6-4.9 4.2 1.5 6.3L12 16.6l-5.6 3.3 1.5-6.3L3 9.4l6.4-.6Z', 'M12 2.8 21 9.3l-3.4 10.4H6.4L3 9.3Z', 'M12 3c5 0 9 4 9 9h-9Zm0 18c-5 0-9-4-9-9h9Z'];
const SHAPE_C = ['#22C55E', '#2563EB', '#F97316', '#DB2777', '#7C3AED', '#0D9488', '#F59E0B', '#DC2626'];
function shapeOf(id) { let h = 0; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return { d: SHAPES[h % SHAPES.length], c: SHAPE_C[(h >>> 4) % SHAPE_C.length] }; }
const shapeAv = (id, size = 46) => { const g = shapeOf(id); return `<span class="shp sil" style="--sc:${g.c};width:${size}px;height:${size}px" aria-hidden="true"><svg viewBox="0 0 40 40"><circle cx="20" cy="15.5" r="7.2"/><path d="M5.5 40c.6-8.6 6.6-14.2 14.5-14.2S33.9 31.4 34.5 40Z"/></svg></span>`; };
function candCard(p, m) {
  const sc = score(p, m), t = m.team, c = t ? col(t.color) : null;
  let act;
  if (!m.rule_ok) act = `<button class="btn line sm" disabled>طبق قانون سن و جنسیت ممکن نیست</button>`;
  else if (m.invite && m.invite.dir === 'in') act = `<button class="btn line sm" data-a="thread" data-id="${m.invite.id}">${ic('chat')}گفتگو</button><button class="btn ac sm" data-a="accept" data-id="${m.invite.id}">پذیرفتن</button>`;
  else if (m.invite) act = `<button class="btn line sm" data-a="thread" data-id="${m.invite.id}">${ic('chat')}پیام آشنایی · منتظر پاسخ</button>`;
  else if (t && p.team) act = `<span class="muted small">هر دو در تیم هستید</span>`;
  else act = `<button class="btn ac sm" data-a="invite" data-id="${m.id}">${t ? 'درخواست پیوستن' : 'هم‌مسیر شویم؟'}</button>`;
  const why = sc.reasons.slice(1, 3);
  return `<article class="cand2 ${m.rule_ok ? '' : 'blocked'}" style="${c ? `--tc:${c.c}` : ''}">
    <div class="c-top">${shapeAv(m.id)}<div class="c-name"><b>خانواده ${esc(m.family)}</b><small>${esc(m.hood || '')}${m.dist ? ` · <b>${km1(m.dist.m / 1000)}</b> کیلومتر · ${mins(m.dist.s)} دقیقه` : ''}</small></div>
      <div class="ring" style="--p:${Math.max(0, Math.min(100, sc.score))}" title="هم‌خوانی"><b>${fa(sc.score)}٪</b></div></div>
    <div class="c-tags">${m.role !== 'pay' ? `<span>${ic('wheel')}رانندگی</span>` : ''}${m.role !== 'drive' ? `<span>${ic('coin')}هزینه</span>` : ''}<span>${ic(m.pg === 'f' ? 'woman' : 'man')}${isChild(p) ? relLabel(m) : m.pg === 'f' ? 'خانم' : 'آقا'}</span>${JOB_L[m.job] ? `<span class="tag-b">${JOB_L[m.job]}</span>` : ''}${m.daily ? `<span class="tag-d">هر روز خودش می‌برد · ${fa(m.seats || 0)} جای خالی</span>` : ''}${m.relig ? '<span class="tag-b">مذهبی</span>' : ''}<span class="${t ? 'tm' : ''}">${t ? esc(teamName(t)) : 'بی‌تیم'}</span>${m.verified === false ? '<span class="warn">تأییدنشده</span>' : ''}</div>
    ${why.length ? `<div class="c-why">${why.map(([x, ok]) => `<span class="${ok ? 'ok' : 'no'}">${ok ? '✓' : '!'} ${esc(x)}</span>`).join('')}</div>` : ''}
    <div class="c-act">${m.phone ? `<a class="icon-btn sm" href="tel:${esc(m.phone)}" aria-label="تماس">${ic('phone')}</a>` : ''}<button class="btn line sm" data-a="cand" data-id="${m.id}">جزئیات</button>${act}</div></article>`;
}

function teamTab(p) {
  const t = p.team;
  if (isTrip(p)) return tripTab(p);
  if (!t) return `<section class="card empty">${cityAnim('')}<h1 style="font-size:1.5rem">هنوز تیم ندارید</h1><p class="muted" style="max-width:40ch">در «هم‌مسیرها» نزدیک‌ترین خانواده‌ها را ببینید و با یک تپ دعوت کنید. هر تیم دست‌کم یک راننده لازم دارد.</p><button class="btn ac" data-tab="peers">دیدن هم‌مسیرها</button></section>`;
  const T = ui.team; if (!T || !T.team) return `<p class="muted" style="text-align:center;padding:40px">در حال بارگذاری تیم…</p>`;
  const plan = planOf(T), x = focusSlot(T, plan), me = mem(T, p.id), issues = teamIssues(T);
  if (!isDesk()) { const sub = ui.tsub || 'plan', tabs = [['plan', 'برنامه', 'list'], ['stats', 'کارنامه', 'trophy'], ['fam', 'خانواده‌ها', 'team']];
    const members = `<div class="card"><div class="row between" style="margin-bottom:6px"><h2><i class="team-dot"></i>${esc(teamName(t))}</h2><span class="tag ac">هر سفر ${money(T.team.price)}</span></div>${T.members.map(m => `<div class="member">${shapeAv(m.id, 40)}<span class="grow"><b>${esc(fam(m))}</b>${m.id === p.id ? ' <span class="tag ac">شما</span>' : ''}${T.team.coord === m.id ? ' <span class="tag">هماهنگ‌کننده</span>' : ''}<br><span class="muted small">${m.kids.map(k => esc(kidName(k, m))).join('، ')}</span></span><span class="roles">${m.role !== 'pay' ? ic('wheel') : ''}${m.role !== 'drive' ? ic('coin') : ''}</span>${m.id !== p.id && m.phone ? `<a class="icon-btn" href="tel:${esc(m.phone)}" aria-label="تماس">${ic('phone')}</a>` : ''}</div>`).join('')}<p class="muted small" style="margin-top:8px">مبلغ هر سفر ۶۰٪ میانگین برآورد اسنپ اعضاست. هماهنگ‌کننده خودکار است.</p></div>`;
    return `<div class="stack">${agreeCard(T, p)}${x ? todayCard(T, x, plan, p) : ''}${tomorrowCard(T, plan, p)}${issues.map(i => `<div class="hint ${i.startsWith('✓') ? '' : 'warn'}">${ic(i.startsWith('✓') ? 'check' : 'warn')}<span>${esc(i)}</span></div>`).join('')}
      <nav class="subtabs" role="tablist">${tabs.map(([k, n, i]) => `<button role="tab" data-a="tsub" data-v="${k}" aria-selected="${sub === k}">${ic(i)}${n}</button>`).join('')}</nav>
      ${sub === 'plan' ? calCard(T, plan) : sub === 'stats' ? statsCard(T) + (CFG.flags.league_on ? `<button class="card row" data-a="quiz" style="text-align:right;border-color:var(--ac)">${ic('trophy')}<span class="grow"><b>لیگ راه ${esc(destWord(p))}</b><br><span class="muted small">معمای امروز را با هم حل کنید.</span></span>${ic('back')}</button>` : '') + campaignCard(p) : members + `<div id="trust-slot"></div>` + `<button class="card row" data-a="leave" style="text-align:right">${ic('leave')}<span class="grow"><b>ترک تیم</b><br><span class="muted small">اگر مسیر یا ساعت‌تان عوض شده.</span></span></button>`}</div>`; }
  return `<div class="split"><div class="stack">${agreeCard(T, p)}${x ? todayCard(T, x, plan, p) : ''}${tomorrowCard(T, plan, p)}${issues.map(i => `<div class="hint ${i.startsWith('✓') ? '' : 'warn'}">${ic(i.startsWith('✓') ? 'check' : 'warn')}<span>${esc(i)}</span></div>`).join('')}
      <button class="card row" data-a="chat" style="text-align:right;border-color:var(--ac)">${ic('team')}<span class="grow"><b>گفتگوی تیم</b><br><span class="muted small">هماهنگی، خبر تأخیر، تشکر؛ کوتاه و محترمانه.</span></span>${ic('back')}</button>
      ${CFG.flags.league_on ? `<button class="card row" data-a="quiz" style="text-align:right;border-color:var(--ac)">${ic('trophy')}<span class="grow"><b>لیگ راه ${esc(destWord(p))}</b><br><span class="muted small">معمای امروز را با هم حل کنید؛ پاسخ بعد از رسیدن.</span></span>${ic('back')}</button>` : ''}</div>
    <aside class="stack">${calCard(T, plan)}${statsCard(T)}
      <div class="card"><div class="row between" style="margin-bottom:6px"><h2><i class="team-dot"></i>${esc(teamName(t))}</h2><span class="tag ac">هر سفر ${money(T.team.price)}</span></div>
        ${T.members.map(m => `<div class="member">${shapeAv(m.id, 40)}<span class="grow"><b>${esc(fam(m))}</b>${m.id === p.id ? ' <span class="tag ac">شما</span>' : ''}${T.team.coord === m.id ? ' <span class="tag">هماهنگ‌کننده</span>' : ''}<br><span class="muted small">${m.kids.map(k => esc(kidName(k, m))).join('، ')}</span></span>
          <span class="roles">${m.role !== 'pay' ? ic('wheel') : ''}${m.role !== 'drive' ? ic('coin') : ''}</span>${m.id !== p.id && m.phone ? `<a class="icon-btn" href="tel:${esc(m.phone)}" aria-label="تماس">${ic('phone')}</a>` : ''}</div>`).join('')}
        <p class="muted small" style="margin-top:8px">مبلغ هر سفر ۶۰٪ میانگین برآورد اسنپ اعضاست. هماهنگ‌کننده خودکار است؛ اگر برود، نفر بعدی می‌شود.</p></div></aside></div>`;
}
function tripTab(p) {
  const t = p.team, d = p.data || {};
  const head = `<div class="card trip-card"><div class="row">${ic('train')}<span class="grow"><b>${esc(placeName(p))} ← ${esc(d.hood || 'مقصد')}</b><br><span class="small">${esc(tripWhen(d))}${d.tripno ? ' · ' + esc(d.tripno) : ''}</span></span><button class="btn line sm" data-a="wiz-review">ویرایش</button></div></div>`;
  if (!t) return `${head}<section class="card empty">${cityAnim('')}<h1 style="font-size:1.4rem">هنوز هم‌سفر ندارید</h1><p class="muted" style="max-width:42ch">در «هم‌مسیرها» هم‌سفرهای ${d.pg === 'f' ? 'خانم' : 'آقا'} را می‌بینید که همان حدود می‌رسند و مقصدشان نزدیک شماست.</p><button class="btn ac" data-tab="peers">دیدن هم‌سفرها</button></section>`;
  const T = ui.team; if (!T || !T.team) return `${head}<p class="muted" style="text-align:center;padding:40px">در حال بارگذاری…</p>`;
  const drv = T.members.filter(m => m.role !== 'pay'), free = drv.length && drv.every(m => m.free_ride), pax = T.members.filter(m => m.role === 'pay').length || 1;
  const share = free ? 0 : Math.round((T.team.price || 0) / 1000) * 1000;
  return `${head}<div class="split"><div class="stack">
    <div class="card stack"><h2>${ic('team')} هم‌سفرها</h2>${T.members.map(m => `<div class="member"><span class="av" style="--pc:var(--ac);--pi:var(--ac-ink)">${esc((m.family || '؟')[0])}</span><span class="grow"><b>${m.pg === 'f' ? 'خانم' : 'آقای'} ${esc(m.family)}</b>${m.id === p.id ? ' <span class="tag ac">شما</span>' : ''}<br><span class="muted small">${m.role !== 'pay' ? (m.free_ride ? 'رایگان می‌برد' : 'ماشین دارد') + ' · ' : ''}${esc(tripWhen(m))}${m.dest_name ? ' · تا ' + esc(m.dest_name) : ''}</span></span><span class="roles">${m.role !== 'pay' ? ic('wheel') : ic('coin')}</span>${m.id !== p.id && m.phone ? `<a class="icon-btn" href="tel:${esc(m.phone)}" aria-label="تماس">${ic('phone')}</a>` : ''}</div>`).join('')}</div>
    <button class="card row" data-a="chat" style="text-align:right;border-color:var(--ac)">${ic('team')}<span class="grow"><b>گفتگوی هم‌سفرها</b><br><span class="muted small">محل قرار، تأخیر قطار یا پرواز، رنگ ماشین.</span></span>${ic('back')}</button></div>
    <aside class="stack"><div class="card stack"><h2>${ic('coin')} سهم هزینه</h2>
      ${free ? `<p class="hint">${ic('heart')}<span>این سفر رایگان است؛ راننده مهمان‌تان کرده. یک تشکر گرم یادتان نرود!</span></p>` : `<p>سهم هر مسافر حدود <b>${money(share)}</b> <span class="muted small">(۶۰٪ برآورد اسنپ)</span></p>
      ${drv.filter(m => m.card).map(m => `<div class="cardno"><span class="grow"><span class="muted small">کارت ${m.pg === 'f' ? 'خانم' : 'آقای'} ${esc(m.family)}</span><b dir="ltr">${esc(fa(m.card))}</b></span><button class="btn sm" data-a="copy" data-v="${esc(en(m.card).replace(/\D/g, ''))}">${ic('copy')}کپی</button></div>`).join('') || '<p class="muted small">راننده شماره کارت ثبت نکرده؛ در گفتگو هماهنگ کنید.</p>'}`}
      <p class="muted small">${ic('shield')} پرداخت مستقیم بین شماست؛ رسیدیم پولی نگه نمی‌دارد.</p></div></aside></div>`;
}
function teamIssues(T) {
  const out = [], dr = T.members.filter(m => m.role !== 'pay'), kids = ridersOf(T, 'out').length;
  if (!dr.length) out.push('این تیم راننده ندارد؛ یک خانواده‌ی راننده دعوت کنید.');
  else if (dr.length === 1 && dr[0].daily) out.push(`✓ ${fam(dr[0])} هر روز خودشان می‌برند؛ عالی است. اگر روزی نتوانستند، یک خانواده‌ی دیگر برای جایگزینی کمک بزرگی است.`);
  else if (dr.length === 1) out.push(`این تیم فقط یک راننده دارد (${fam(dr[0])}). همه‌ی رفت‌وآمدها و ریسکِ یک روزِ بیماری یا گرفتاری روی دوش اوست؛ البته ان‌شاءالله پول فراوان! 😄 یک خانواده‌ی راننده‌ی دیگر هم دعوت کنید.`);
  else if (kids > Math.max(...dr.map(m => seatCap(m.seats, T.members.flatMap(x => x.kids || []))))) out.push(`${fa(kids)} مسافر داریم اما بیشترین ظرفیت مجاز ${fa(Math.max(...dr.map(m => seatCap(m.seats, T.members.flatMap(x => x.kids || [])))))} صندلی دارد؛ بعضی روزها دو خودرو لازم است.`);
  return out;
}
function todayCard(T, x, plan, p) {
  const r = recOf(T, x, plan), ex = mem(T, r.exec), planned = mem(T, plan[x.id]), ks = ridersOf(T, x.dir), same = slotsOf(T.place).filter(y => y.d === x.d);
  const rem = ex ? [...new Set(T.members.filter(m => m.id !== ex.id).flatMap(m => [...(m.values || []).filter(v => v !== 'samegender' && v !== 'parent').map(v => VALUES[v]), ...(m.pickup === 'door' ? ['دمِ در خانه‌ی ' + m.family] : [])]))] : [];
  let body = '', act = '';
  const pr = ui.prac && ui.prac[x.id] ? '<p class="prac-tag">🎈 حالت تمرین: الان وقت این سفر نیست؛ چیزی ثبت نمی‌شود.</p>' : '';
  if (r.status === 'pending') {
    body = `<div class="kids">${ks.map(k => `<span class="kid" style="--kc:var(--ac)"><i></i>${esc(kidName(k, mem(T, k.pid)))}</span>`).join('')}</div>`;
    act = `<button class="btn ac block" data-a="t-start" ${ex ? '' : 'disabled'}>راه افتادیم</button><button class="btn line block" data-a="t-swap">${ex && ex.id === p.id ? 'برایم مشکلی پیش آمد' : ex ? 'جایگزین لازم است؟' : 'من می‌برم'}</button>`;
  } else if (r.status === 'started' && !ui.perKid) {
    const ev = r.ev || {}, brd = ev.board || {}, drv = ex && ex.id === p.id, fams = [...new Set(ks.map(k => k.pid))];
    body = `<div class="kids">${fams.map(pid => { const m = mem(T, pid), kk = ks.filter(k => k.pid === pid), on = x.dir === 'back' || kk.every(k => brd[k.id]) || (ev.bp || {})[pid];
      return `<button class="kid ${on ? 'ok' : ''}" style="--kc:var(--ac)" ${drv && x.dir === 'out' && pid !== r.exec ? `data-a="${on ? 't-unboard' : 't-board'}" data-pid="${pid}"` : 'disabled'}>${on ? ic('check') : '<i></i>'}${esc(kk.length === 1 && m ? kidName(kk[0], m) : kk.map(k => k.first).filter(Boolean).join(' و ') + (m ? ' ' + m.family : ''))}<small>${on ? (x.dir === 'back' ? 'در ماشین' : (kk.length > 1 ? 'سوار شدند' : 'سوار شد') + ((ev.bp || {})[pid] ? ' ' + fa(new Date(ev.bp[pid] * 1000).toTimeString().slice(0, 5)) : '')) : 'منتظر'}</small></button>`; }).join('')}</div>
      ${drv ? `<p class="muted small">${S.liveOK || CFG.flags.auto_arrive ? 'سوار شدن‌ها خودکار ثبت می‌شود؛ ' : ''}روی اسم بزنید تا ثبت یا برگردانده شود.</p>` : ''}`;
    if (CFG.flags.trip_scene !== false) body = tripScene(T, x, r, p) + (drv ? body : '');
    act = drv ? `<button class="btn ac block big" data-a="t-allin">${ic('check')}رسیدیم؛ همه را تحویل دادم</button><button class="link" data-a="t-perkid">یکی را جداگانه تحویل دادم</button>` : '';
  } else if (r.status === 'started') {
    const all = ks.every(k => r.arr[k.id]);
    body = `<p class="muted small">هر کس رسید رویش بزنید؛ خانواده‌اش خبردار می‌شود.</p><div class="kids">${ks.map(k => `<button class="kid ${r.arr[k.id] ? 'ok' : ''}" style="--kc:var(--ac)" data-a="t-arrive" data-k="${k.id}" ${r.arr[k.id] ? 'aria-pressed="true"' : ''}>${r.arr[k.id] ? ic('check') : '<i></i>'}${esc(kidName(k, mem(T, k.pid)))}${r.arr[k.id] ? ' رسید' : ''}</button>`).join('')}</div>`;
    act = `<label class="check"><input type="checkbox" data-a="t-empty" ${r.empty ? 'checked' : ''} ${all ? '' : 'disabled'}>خودرو خالی است و چیزی جا نمانده</label><button class="btn ac block" data-a="t-finish" ${all && r.empty ? '' : 'disabled'}>ثبت پایان سفر</button>`;
  } else {
    body = `<div class="done"><b>خدا قوت! همه به سلامت رسیدند.</b>${(ui.qDone = ui.qDone ?? quip('done', .6)) ? `<span>${esc(ui.qDone.trim())}</span>` : ''}<span class="muted">${money(T.team.price)} به اعتبار ${esc(fam(ex))} ثبت شد.</span></div>`;
    act = `<button class="btn line block" data-a="t-thanks" ${r.thanks ? 'disabled' : ''}>${ic('heart')}${r.thanks ? 'تشکر شما رسید' : 'دست‌شان درد نکند'}</button><button class="btn ac block" data-a="t-next">نوبت بعدی</button>`;
  }
  const notes = [];
  if (ex && planned && ex.id !== planned.id) notes.push(`به‌جای ${esc(fam(planned))}؛ ممنون از هم‌دلی‌شان.`);
  if (ex && !(ex.days || []).includes(x.d) && r.status === 'pending') notes.push('این روز را اعلام نکرده بودند؛ یک پیام هماهنگی کافی است.');
  if (!ex) notes.push('راننده‌ی سازگاری برای این نوبت نیست؛ یک داوطلب لازم است.');
  const liveRow = r.status === 'started' && ex && ex.id !== p.id ? liveStrip() : '';
  return `<article class="today" aria-live="polite">
    <div class="row between wrap"><div class="seg" role="group">${same.map(y => `<button data-a="t-pick" data-s="${y.id}" aria-pressed="${y.id === x.id}">${y.dir === 'out' ? 'رفت' : 'برگشت'} ${clock(y.time)}</button>`).join('')}</div>
      <span class="tag ${r.status === 'done' ? 'ok' : r.status === 'started' ? 'ac' : ''}">${{ pending: 'هنوز راه نیفتاده', started: 'در مسیر', done: 'رسیدیم' }[r.status]}</span></div>
    ${liveRow}${learnLine(T, x)}<div class="when"><b>${dayWord(x.d)}${x.d === TODAY ? '، ' + DAYS[x.d] : ''}</b><span>${x.dir === 'out' ? 'به ' + esc(T.place.name) : 'برگشت به خانه'}</span></div>
    <div class="who">${ex ? `${esc(fam(ex))} <em>می‌برند</em>` : 'بدون راننده'}</div>
    ${notes.map(n => `<p class="note">${ic('warn')}${n}</p>`).join('')}${pr}${body}
    ${rem.length && r.status !== 'done' ? `<p class="note">${ic('heart')}یادآوری محترمانه: ${rem.map(esc).join(' · ')}</p>` : ''}
    <div class="stack" style="gap:10px">${act}</div></article>`;
}
function turnsAhead(T, plan, p, days = 7) { // my planned trips for the next days, with real dates
  const out = [], now = new Date();
  for (let i = 1; i <= days; i++) { const dt = addD(now, i), wd = (dt.getDay() + 1) % 7, off = Math.floor((((now.getDay() + 1) % 7) + i) / 7);
    slotsOf(T.place, off).filter(x => x.d === wd && plan[x.id] === p.id && ridersOf(T, x.dir).length).forEach(x => out.push({ ...x, date: dt, i })); }
  return out;
}
function turnText(T, xs) { const L = T.learn || {};
  return xs.map(x => `${x.dir === 'out' ? 'رفت' : 'برگشت'} ساعت ${fa((L[x.dir] && L[x.dir].depart) || x.time)}${x.dir === 'out' ? ' راه بیفتید' : ' دم ' + T.place.name}`).join(' و ') + '؛ ' + fa(ridersOf(T, xs[0].dir).length) + ' بچه: ' + [...new Set(ridersOf(T, xs[0].dir).map(k => k.first).filter(Boolean))].slice(0, 5).join('، '); }
/* ═════════ trip scene: home stations behind, school ahead (left), the car fills up ═════════ */
function stopOrder(T, x, r) { // greedy nearest-next from the driver's home (out) or the school (back)
  const ex = mem(T, r.exec), pids = [...new Set(ridersOf(T, x.dir).map(k => k.pid))].filter(id => !(x.dir === 'out' && id === r.exec));
  let cur = x.dir === 'out' ? (ex && ex.lat ? [ex.lat, ex.lng] : [T.place.lat, T.place.lng]) : [T.place.lat, T.place.lng]; const bp = (r.ev || {}).bp || {}, all = pids.map(id => mem(T, id)).filter(Boolean);
  const out = x.dir === 'out' ? all.filter(m => bp[m.id]).sort((a, b) => bp[a.id] - bp[b.id]) : []; if (out.length) { const l = out[out.length - 1]; cur = [l.lat || cur[0], l.lng || cur[1]]; }
  const left = all.filter(m => !out.includes(m));
  while (left.length) { left.sort((a, b) => hav(cur[0], cur[1], a.lat || 0, a.lng || 0) - hav(cur[0], cur[1], b.lat || 0, b.lng || 0)); const n = left.shift(); out.push(n); cur = [n.lat || cur[0], n.lng || cur[1]]; }
  return out;
}
const SCAR = `<svg class="sc-car-svg" viewBox="0 0 120 64" aria-hidden="true"><g class="sc-body"><path d="M8 44V32c0-3 2-5 5-5.5l12-2 12-13c2-2 4-3 7-3h28c3 0 5 1 7 3l10 13 9 1.5c3 .5 5 2.6 5 5.5V44Z" fill="#22C55E" stroke="#0C1410" stroke-width="2.6" stroke-linejoin="round"/><path d="M31 25l11-12h14v12Zm29 0V13h13l9 12Z" fill="#DFF7E8" stroke="#0C1410" stroke-width="2.2" stroke-linejoin="round"/><circle cx="12" cy="36" r="2.6" fill="#FDE68A" stroke="#0C1410" stroke-width="1.6"/><path d="M104 38h6" stroke="#0C1410" stroke-width="2.4" stroke-linecap="round"/></g><g class="sc-wheel" style="transform-origin:30px 46px"><circle cx="30" cy="46" r="8.5" fill="#1F2937" stroke="#0C1410" stroke-width="2.2"/><path d="M30 39v14M23 46h14" stroke="#9CA3AF" stroke-width="2"/></g><g class="sc-wheel" style="transform-origin:90px 46px"><circle cx="90" cy="46" r="8.5" fill="#1F2937" stroke="#0C1410" stroke-width="2.2"/><path d="M90 39v14M83 46h14" stroke="#9CA3AF" stroke-width="2"/></g></svg>`;
function tripScene(T, x, r, p) {
  const out = x.dir === 'out', ev = r.ev || {}, bp = ev.bp || {}, order = stopOrder(T, x, r), ex = mem(T, r.exec), L = T.learn && T.learn[x.dir];
  const kidsOf = id => ridersOf(T, x.dir).filter(k => k.pid === id), first = id => { const m = mem(T, id), f = kidsOf(id).map(k => k.first).filter(Boolean); return f.length ? f.join(' و ') : (m ? m.family : ''); };
  const done = m => out ? !!bp[m.id] : kidsOf(m.id).every(k => r.arr[k.id]);
  const st = [{ id: out ? r.exec : 'school', name: out ? 'خانه‌ی ' + (ex ? ex.family : '') : T.place.name, kind: out ? 'home' : 'school', done: true, at: out ? ev.depart || ev.start : ev.start },
    ...order.map(m => ({ id: m.id, name: first(m.id), kind: 'home', done: done(m), at: out ? bp[m.id] : null })),
    ...(out ? [{ id: 'school', name: T.place.name, kind: 'school', done: !!ev.arrive, at: ev.arrive }] : [])];
  const N = st.length, pos = i => 6 + i * (88 / Math.max(1, N - 1)); let k = 0; while (k + 1 < N && st[k + 1].done) k++;
  const fin = k === N - 1, nx = fin ? null : st[k + 1], carAt = fin ? pos(k) : pos(k) + (pos(k + 1) - pos(k)) * .42;
  const inCar = out ? ridersOf(T, x.dir).filter(kd => kd.pid === r.exec || bp[kd.pid]).length : ridersOf(T, x.dir).filter(kd => !r.arr[kd.id]).length;
  const live = ui.live, eta = nx && live && nx.kind === 'home' && mem(T, nx.id) ? Math.max(1, Math.round(hav(live.lat, live.lng, mem(T, nx.id).lat, mem(T, nx.id).lng) / 420)) : null;
  const plan = nx && L && L.board && L.board[nx.id], hhmm = t => fa(new Date(t * 1000).toTimeString().slice(0, 5));
  const recent = st.slice(1).filter(z => z.done && z.at && Date.now() / 1000 - z.at < 150 && z.kind === 'home').pop(), bx = v => Math.min(80, Math.max(20, v));
  const key = x.id + '|' + k; const from = ui.sceneFrom && ui.sceneFrom.slot === x.id ? ui.sceneFrom.at : carAt; ui.sceneFrom = { slot: x.id, at: carAt, key };
  return `<div class="scene ${fin ? 'fin' : 'moving'}" role="img" aria-label="${esc(`ماشین ${fa(inCar)} مسافر دارد؛ ${nx ? 'مقصد بعدی ' + nx.name : 'همه رسیدند'}`)}">
    <span class="sc-cloud c1"></span><span class="sc-cloud c2"></span><div class="sc-road"><i></i></div>
    <span class="sc-light" style="right:${(pos(Math.floor((N - 1) / 2)) + pos(Math.ceil((N - 1) / 2))) / 2 + 3}%"><i></i><i></i><i></i></span>
    ${st.map((z, i) => `<div class="sc-st ${z.kind} ${z.done ? 'ok' : ''} ${nx && z.id === nx.id ? 'next' : ''}" style="right:${pos(i)}%">${z.kind === 'school' ? `<span class="sc-ic">🏫</span>` : `<span class="sc-ic">🏠</span>`}<b>${esc(z.name)}</b>${z.at && z.kind === 'home' && i ? `<small>${hhmm(z.at)} ✓</small>` : z.kind === 'school' && out && T.place.in ? `<small>زنگ ${fa(T.place.in)}</small>` : ''}</div>`).join('')}
    ${nx ? `<div class="sc-bub next" style="right:${bx(pos(k + 1))}%">${nx.kind === 'school' ? `داریم به ${esc(destWord(p))} می‌رسیم!` : `${esc(nx.name)}، منتظر باش؛ داریم می‌رسیم!`}${eta ? `<small>~${fa(eta)} دقیقه</small>` : plan ? `<small>معمولاً ${fa(plan)}</small>` : ''}</div>` : `<div class="sc-bub next" style="right:${bx(pos(k))}%">همه به سلامت رسیدند 🎉</div>`}
    ${recent ? `<div class="sc-bub got" style="right:${bx(pos(st.indexOf(recent)))}%">${esc(recent.name)} سوار شد! ✓</div>` : ''}
    <div class="sc-car" data-from="${from}" data-to="${carAt}" style="right:${from}%"><span class="sc-lines"><i></i><i></i><i></i></span>${SCAR}${inCar ? `<span class="sc-count" key="${inCar}">🧒 ${fa(inCar)}</span>` : ''}</div>
  </div>`;
}
function sceneAnimate() { const c = $('.sc-car'); if (!c) return; const a = +c.dataset.from, b = +c.dataset.to; if (Math.abs(a - b) < .1) return;
  c.classList.add('go'); requestAnimationFrame(() => requestAnimationFrame(() => { c.style.right = b + '%'; })); setTimeout(() => { c.classList.remove('go'); c.classList.add('stop'); setTimeout(() => c.classList.remove('stop'), 900); }, 1500); }
async function trustPaint() { const el = $('#trust-slot'), p = active(); if (!el || !p || !CFG.flags.trusted_driver) return; let r; try { r = await api('trust_list', { profile_id: p.id }); } catch (e) { return; } if (!r.on) return;
  el.innerHTML = `<section class="card stack"><h2>${ic('shield')}راننده‌ی معتمد</h2><p class="muted small">معلم، دانشجو، طلبه یا آشنای مطمئنی که خودش فرزند ندارد و یکی از والدین او را می‌شناسد. هر صندلی‌اش ظرفیت تازه است.</p>
    ${r.list.map(t => `<div class="fam-row">${ic('user')}<span class="grow"><b>${esc(t.name)}</b><small>${esc(t.note || '')} · ${fa(t.seats)} صندلی · ${t.joined ? 'به تیم پیوست ✓' : `پذیرش ${fa(t.accepted.length)} از ${fa(t.need)} خانواده`}</small></span>${!t.me_ok && !t.joined ? `<button class="btn ac sm" data-a="trust-ok" data-c="${t.code}">می‌پذیرم</button>` : t.by === p.id && !t.joined ? `<button class="btn line sm" data-a="copy" data-v="${esc(t.link)}">لینک</button>` : ''}</div>`).join('')}
    <button class="btn line block" data-a="trust-new">${ic('plus')}پیشنهاد یک راننده‌ی معتمد</button></section>`; }
function agreeCard(T, p) { const A = T.agree; if (!Array.isArray(A)) return ''; const real = T.members.filter(m => !m.fake); if (real.every(m => A.includes(m.id)) && real.length) return '';
  const mine = A.includes(p.id);
  return `<section class="card agree"><b>🤝 اول آشنایی، بعد قرار</b><span>هم‌تیمی‌ها را در گفتگو بشناسید، شرایط هم را ببینید و «قرار تیم» را بنویسید. وقتی همه «توافق کردیم» را بزنند، این کادر می‌رود.</span>
    <div class="agree-row">${T.members.map(m => `<span class="ag ${A.includes(m.id) ? 'ok' : ''}">${A.includes(m.id) ? '✓' : '…'} ${esc(m.family)}</span>`).join('')}</div>
    <div class="row wrap"><button class="btn line sm" data-a="chat">${ic('chat')}گفتگو</button><button class="btn line sm" data-a="pact">${ic('shield')}قرار تیم</button><button class="btn ${mine ? 'line' : 'ac'} sm" data-a="agree" data-v="${mine ? 0 : 1}">${mine ? 'پس گرفتن توافق' : 'توافق کردیم ✓'}</button></div></section>`; }
function campaignCard(p) { const pl = p && p.place; if (!pl) return '';
  return `<section class="card camp"><span class="camp-ic">📣</span><div class="grow"><b>پویش «پوستر ${esc(destWord(p))} ما»</b><span>پوستر و لینک «${esc(pl.name)}» را در گروه کلاس و کانال ${esc(destWord(p))} بگذارید. هر خانواده‌ای که بیاید، نوبت همه سبک‌تر می‌شود.</span></div><button class="btn sm" data-a="poster">${ic('share')}بفرستم</button></section>`; }
function tomorrowCard(T, plan, p) {
  const xs = turnsAhead(T, plan, p, 1); if (!xs.length) return '';
  const fams = [...new Set(ridersOf(T, xs[0].dir).map(k => k.pid))].filter(id => id !== p.id).map(id => mem(T, id)).filter(Boolean);
  return `<section class="card tmr"><div class="tmr-ic">${CARTOON_CAR}</div><div class="grow"><b>فردا نوبت شماست 🌙</b><span>${esc(DAYS[xs[0].d])} ${esc(jLabel(xs[0].date))} · ${esc(turnText(T, xs))}</span>${fams.length ? `<small class="muted">سوار کردن: ${fams.map(m => esc(m.family)).join('، ')}</small>` : ''}</div>${NATIVE ? '' : `<button class="btn line sm" data-a="t-remind">${ic('bell')}یادم بینداز</button>`}</section>`;
}
async function remindTurns() {
  const p = active(), T = ui.team; if (!p || !T || !T.team) return; const plan = planOf(T), xs = turnsAhead(T, plan, p, 7);
  if (NATIVE && NP.LocalNotifications) { try { const LN = NP.LocalNotifications, pend = await LN.getPending(); const old = (pend.notifications || []).filter(n => n.id >= 7e8 && n.id < 8e8); if (old.length) await LN.cancel({ notifications: old.map(n => ({ id: n.id })) });
      const byDay = {}; xs.forEach(x => (byDay[x.i] = byDay[x.i] || []).push(x));
      const list = Object.values(byDay).map(g => { const at = addD(g[0].date, -1); at.setHours(20, 30, 0, 0); return at > new Date() ? { id: 7e8 + (+ymd(g[0].date).replace(/-/g, '') % 1e8), title: `فردا (${DAYS[g[0].d]}) نوبت شماست 🚗`, body: turnText(T, g), schedule: { at, allowWhileIdle: true }, channelId: 'turns', smallIcon: 'ic_stat_residim', extra: { kind: 'turn' } } : null; }).filter(Boolean);
      if (list.length) await LN.schedule({ notifications: list }); } catch (e) {} return; }
  const t1 = xs.filter(x => x.i === 1), h = new Date().getHours();
  if (t1.length && h >= 18 && S.remD !== ymd(new Date())) { S.remD = ymd(new Date()); persist(); notify(`فردا (${DAYS[t1[0].d]}) نوبت شماست 🚗`, turnText(T, t1)); }
}
function learnLine(T, x) { const L = T.learn && T.learn[x.dir]; if (!L || (!L.depart && !L.arrive)) return '';
  const late = x.dir === 'out' && L.arrive && T.place && T.place.in && L.arrive > T.place.in;
  return `<p class="learn ${late ? 'warn' : ''}">${ic('clock2')}<span>${L.depart ? `معمولاً <b>${fa(L.depart)}</b> راه می‌افتید` : ''}${L.depart && L.arrive ? ' و ' : ''}${L.arrive ? `<b>${fa(L.arrive)}</b> می‌رسید` : ''}${late ? `؛ کمی دیرتر از زنگ (${fa(T.place.in)}). پیشنهاد: چند دقیقه زودتر راه بیفتید.` : ''} <small class="muted">(از ${fa(L.n)} سفر واقعی)</small></span></p>`; }
function histRec(date, dir) { const H = ui.hist; return H ? H.trips.find(x => x.date === date && x.dir === dir) : null; }
function calCard(T, plan) {
  const mode = ui.calMode || 'week', off = ui.calOff || 0, mo = ui.calM || 0;
  let title, body;
  if (mode === 'week') { const s0 = satOf(off), s1 = addD(s0, 6); title = off === 0 ? 'این هفته' : off === -1 ? 'هفته‌ی پیش' : off === 1 ? 'هفته‌ی بعد' : `${jLabel(s0)} تا ${jLabel(s1)}`; body = weekGrid(T, plan, off); }
  else { const m = monthOf(mo); title = JM[m.jm - 1] + ' ' + fa(m.jy); body = monthGrid(T, m); }
  const sub = mode === 'week' ? `${jLabel(satOf(off))} تا ${jLabel(addD(satOf(off), 6))}` : '';
  return `<div class="card stack cal"><div class="cal-top"><div class="seg2" role="group" aria-label="نما"><button data-a="cal-mode" data-v="week" aria-pressed="${mode === 'week'}">هفته</button><button data-a="cal-mode" data-v="month" aria-pressed="${mode === 'month'}">ماه</button></div>
    <div class="cal-nav"><button class="icon-btn" data-a="cal-go" data-v="-1" aria-label="قبلی">${ic('back')}</button><span><b>${esc(title)}</b>${sub && off !== 0 ? '' : sub ? `<small>${sub}</small>` : ''}</span><button class="icon-btn" data-a="cal-go" data-v="1" aria-label="بعدی" ${mode === 'month' && mo >= 0 ? 'disabled' : ''}>${ic('back', 'i flip')}</button></div></div>
    ${body}${(mode === 'week' && off !== 0) || (mode === 'month' && mo !== 0) ? `<button class="link" data-a="cal-now">برگشت به امروز</button>` : mode === 'week' ? '<span class="muted small">روی هر نوبت بزنید تا جزئیات و جایگزین را ببینید.</span>' : ''}</div>`;
}
function monthOf(mo) { // Jalali month `mo` months from now (mo ≤ 0)
  let t = new Date(); t.setHours(12, 0, 0, 0); let j = jp(t); t = addD(t, 1 - j.d);
  for (let i = 0; i < -mo; i++) { t = addD(t, -1); j = jp(t); t = addD(t, 1 - j.d); }
  const first = t, J = jp(first), days = []; for (let x = first; jp(x).m === J.m; x = addD(x, 1)) days.push(x);
  return { jy: J.y, jm: J.m, days };
}
function monthGrid(T, m) {
  const lead = (m.days[0].getDay() + 1) % 7, today = ymd(new Date()); let done = 0;
  const cells = m.days.map(t => { const k = ymd(t), recs = ['out', 'back'].map(dir => histRec(k, dir)).filter(r => r && r.status === 'done'); done += recs.length;
    return `<div class="mday ${k === today ? 'today' : ''} ${k > today ? 'future' : ''}"><span>${fa(jp(t).d)}</span><i>${recs.map(r => { const f = mem(T, r.exec); return `<em title="${esc(f ? fam(f) : '')}">${esc(f ? f.family[0] : '✓')}</em>`; }).join('')}</i></div>`; }).join('');
  return `<div class="month"><div class="mhead">${['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map(x => `<b>${x}</b>`).join('')}</div><div class="mgrid">${'<div></div>'.repeat(lead)}${cells}</div>
    <p class="small" style="margin:8px 0 0">${done ? `این ماه <b>${fa(done)}</b> بار «رسیدیم» ثبت شد.` : 'این ماه هنوز سفری ثبت نشده.'} <span class="muted">حرف هر خانه، راننده‌ی آن نوبت است.</span></p></div>`;
}
function statsCard(T) {
  const H = ui.hist; if (!H) return '';
  const done = H.trips.filter(x => x.status === 'done'), j0 = jp(new Date()), inMonth = x => { const j = jp(ymdD(x.date)); return j.y === j0.y && j.m === j0.m; };
  if (!done.length) return `<div class="card kstats"><h2>${ic('trophy')} کارنامه‌ی مهربانی</h2><p class="muted small">بعد از اولین «رسیدیم»، اینجا می‌بینید هر خانواده چند بار بچه‌ها را رسانده؛ با دمت‌گرم‌های ماه.</p></div>`;
  const by = T.members.map(m => ({ m, all: done.filter(x => x.exec === m.id).length, mon: done.filter(x => x.exec === m.id && inMonth(x)).length })).sort((a, b) => b.all - a.all);
  const max = Math.max(1, ...by.map(x => x.all)), kids = done.reduce((a, x) => a + (x.kids || 0), 0), mon = done.filter(inMonth).length, star = by.slice().sort((a, b) => b.mon - a.mon)[0];
  return `<div class="card kstats"><h2>${ic('trophy')} کارنامه‌ی مهربانی</h2>
    <div class="kpis"><div><b>${fa(done.length)}</b><span>بار رسیدیم</span></div><div><b>${fa(mon)}</b><span>همین ماه</span></div><div><b>${fa(kids)}</b><span>رساندن بچه‌ها</span></div></div>
    ${star && star.mon ? `<p class="star">${ic('spark')}دمِ ${esc(fam(star.m))} گرم؛ این ماه ${fa(star.mon)} بار بچه‌ها را رساندند.</p>` : ''}
    ${by.map(x => `<div class="bar"><span class="bl">${esc(fam(x.m))}</span><span class="bt"><i style="width:${Math.round(x.all / max * 100)}%"></i></span><b>${fa(x.all)}</b></div>`).join('')}
    <p class="muted small">${ic('heart')} هر نوبت، یک صبحِ آرام برای چند خانواده.</p></div>`;
}
function weekGrid(T, plan, off = 0) {
  if (off !== 0) { const L = slotsOf(T.place, off), days = [...new Set(L.map(x => x.d))], today = ymd(new Date());
    return `<div class="week">${days.map(d => { const t = addD(satOf(off), d), k = ymd(t); return `<div class="wrow"><span class="d">${DAYS[d]}<small>${jLabel(t)}</small></span>${['out', 'back'].map(dir => { const x = L.find(y => y.d === d && y.dir === dir), r = histRec(k, dir), f = mem(T, r ? r.exec : plan[x.id]);
      const st = r && r.status === 'done' ? ['ok', 'رسیدیم ✓'] : k < today ? ['past', 'ثبت نشد'] : ['', (dir === 'out' ? 'رفت ' : 'برگشت ') + clock(x.time)];
      return `<div class="slot ${st[0]}" style="--sc:${f ? 'var(--ac)' : 'var(--line)'}"><b>${f ? esc(f.family) : '—'}</b><small>${st[1]}</small></div>`; }).join('')}</div>`; }).join('')}</div>`; }
  const L = slotsOf(T.place), days = [...new Set(L.map(x => x.d))];
  return `<div class="week">${days.map(d => `<div class="wrow ${d === TODAY ? 'now' : ''}"><span class="d">${DAYS[d]}<small>${jLabel(addD(satOf(0), d))}</small></span>${['out', 'back'].map(dir => {
    const x = L.find(y => y.d === d && y.dir === dir), r = recOf(T, x, plan), f = mem(T, r.exec), pl = plan[x.id];
    const lt = T.learn && T.learn[dir] && T.learn[dir].depart, st = r.status === 'done' ? ['ok', 'رسیدیم ✓'] : !f ? ['none', 'داوطلب لازم'] : (pl && pl !== r.exec) ? ['', 'جایگزین'] : !(f.days || []).includes(d) ? ['ask', 'هماهنگی'] : ['', (dir === 'out' ? 'رفت ' : 'برگشت ') + (lt ? '~' + fa(lt) : clock(x.time))];
    return `<button class="slot ${st[0]}" style="--sc:${f ? 'var(--ac)' : 'var(--warn)'}" data-a="t-slot" data-s="${x.id}"><b>${f ? esc(f.family) : '—'}</b><small>${st[1]}</small></button>`;
  }).join('')}</div>`).join('')}</div>`;
}
function moneyTab(p) {
  if (!p.team) return `<section class="card empty">${ic('money')}<h1 style="font-size:1.5rem">حساب، بعد از تیم شدن</h1><p class="muted">وقتی تیم شدید، هر سفر خودکار و شفاف حساب می‌شود.</p><button class="btn ac" data-tab="peers">پیدا کردن هم‌مسیر</button></section>`;
  const T = ui.team; if (!T || !T.team) return `<p class="muted" style="text-align:center;padding:40px">در حال بارگذاری…</p>`;
  const b = balances(T), mine = b[p.id] || 0, sg = settle(T), max = Math.max(1, ...Object.values(b).map(Math.abs));
  const log = T.ledger.slice().reverse().slice(0, 14).map(e => { const v = (e.d || {})[p.id] || 0; return `<div><span>${e.kind === 'pay' ? '💳 ' : e.kind === 'gift' ? '🤍 ' : ''}${esc(e.text)}</span><span class="num ${v > 0 ? 'plus' : v < 0 ? 'minus' : 'muted'}">${v ? (v > 0 ? '+' : '−') + fa(sep(v)) : '—'}</span></div>`; }).join('');
  return `<div class="split"><div class="stack"><section class="bal"><span class="muted small">تراز شما در ${esc(teamName(p.team))}</span><span class="big ${mine > 0 ? 'plus' : mine < 0 ? 'minus' : ''}">${mine > 0 ? '+' : mine < 0 ? '−' : ''}${money(mine)}</span>
      <span class="muted">${mine > 0 ? 'بیشتر از سهم‌تان زحمت کشیده‌اید.' : mine < 0 ? 'سهم شما برای تسویه؛ با پرداخت یا رانندگی جبران می‌شود.' : 'حساب شما صاف است. دل‌تان روشن!'}</span></section>
    <section class="card stack"><div class="row between"><h2>پیشنهاد تسویه</h2><button class="link" data-a="how">حساب چطور است؟</button></div>
      ${sg.length ? sg.map((x, i) => `<div class="srow"><b>${esc(fam(mem(T, x.from)))} ← ${esc(fam(mem(T, x.to)))} · <span class="num">${money(x.amt)}</span></b><div class="row">${x.from === p.id || x.to === p.id ? `<button class="btn line sm grow" data-a="t-pay" data-i="${i}">پرداخت شد</button>` : ''}${x.to === p.id ? `<button class="btn line sm grow" data-a="t-gift" data-i="${i}">حلال است</button>` : ''}${x.from !== p.id && x.to !== p.id ? '<span class="muted small">بین دو خانواده‌ی دیگر</span>' : ''}</div></div>`).join('') : '<p class="muted">فعلاً تسویه‌ای لازم نیست.</p>'}</section></div>
    <aside class="stack"><section class="card"><h2 style="margin-bottom:8px">اعضا</h2>${T.members.map(m => `<div class="member"><span class="av" style="--pc:var(--ac);--pi:var(--ac-ink)">${esc(m.family[0])}</span><span class="grow"><b>${esc(fam(m))}</b><div style="height:6px;border-radius:9px;background:var(--surface-2);margin-top:4px;overflow:hidden"><i style="display:block;height:100%;width:${Math.round(Math.abs(b[m.id] || 0) / max * 100)}%;background:var(--ac)"></i></div></span><span class="num ${b[m.id] > 0 ? 'plus' : b[m.id] < 0 ? 'minus' : 'muted'}">${b[m.id] > 0 ? '+' : b[m.id] < 0 ? '−' : ''}${fa(sep(b[m.id] || 0))}</span></div>`).join('')}<p class="muted small" style="margin-top:6px">جمع ترازها همیشه صفر است.</p></section>
      <button class="card row rep-btn" data-a="report">${ic('download')}<span class="grow"><b>کارنامه‌ی PDF تیم</b><br><span class="muted small">حساب‌ها، جدول همه‌ی سفرها و بیلان هر خانواده؛ برای بایگانی یا فرستادن.</span></span>${ic('back')}</button>
      <section class="card"><div class="row between" style="margin-bottom:6px"><h2>دفتر شفاف</h2><span class="muted small">چیزی پاک نمی‌شود</span></div><div class="log">${log || '<p class="muted small">هنوز سفری ثبت نشده.</p>'}</div></section></aside></div>`;
}

/* ═════════ render ═════════ */
function renderTop() {
  const p = active();
  let t;
  if (ui.admin) t = `<img src="assets/icon.svg?v=22" alt=""><span><b>پیشخوان مدیریت</b><small>رسیدیم</small></span>`;
  else if (p) { const c = profColor(p); t = `<span class="kind-ic" style="--kc:${c.c};--ki:${c.i}">${ic(KINDS[p.kind] ? KINDS[p.kind].ic : 'dots', '')}</span><span class="grow" style="min-width:0"><b>${esc(p.label)} <span class="pchip">${ic('down', '')}</span></b><small>${p.team ? esc(teamName(p.team)) + ' · ' : ''}${esc(placeName(p) || 'مکان انتخاب نشده')}</small></span>`; }
  else t = `<img src="assets/icon.svg?v=22" alt=""><span><b>رسیدیم</b><small>سرویس مشارکتی والدین</small></span>`;
  $('#title').innerHTML = t; $('#title').dataset.a = p && !ui.admin ? 'switcher' : '';
  $('#title').setAttribute('role', p ? 'button' : ''); $('#title').tabIndex = p ? 0 : -1;
  paintBell();
}
function paintBell() { const n = ui.inbox ? ui.inbox.invites.length + ui.inbox.unread : 0; const p = active(); $('#bell').innerHTML = ic('bell') + (n ? `<span class="badge">${fa(n)}</span>` : ''); $('#bell').classList.toggle('hide', !(p && p.complete && S.token) || ui.admin); }
function renderMain(anim) {
  const main = $('#main'), p = active(), dock = $('#dock'), keepY = ui.admin && !anim ? scrollY : null;
  if (keepY != null) requestAnimationFrame(() => { if (Math.abs(scrollY - keepY) > 4) scrollTo(0, keepY); });
  if (PM.node && PM.node.parentNode) PM.node.parentNode.removeChild(PM.node);
  let html;
  if (ui.amb && !ui.admin) { main.innerHTML = '<p class="muted" style="text-align:center;padding:40px">در حال بارگذاری…</p>'; dock.classList.add('hide'); ambView(); return; }
  if (ui.admin) html = adminView();
  else if (ui.linkPlace && !(p && p.place && p.place.id === ui.linkPlace.id)) html = placeLanding(ui.linkPlace);
  else if (!p) html = home();
  else if (!p.complete) html = resumeCard(p);
  else { const V = { peers: peersTab, team: teamTab, money: moneyTab }; if (!V[ui.tab] || (isTrip(p) && ui.tab === 'money')) ui.tab = isTrip(p) && ui.tab === 'money' ? 'team' : 'peers'; html = V[ui.tab](p); }
  main.innerHTML = html;
  { const tr = $('#trust'); if (tr) tr.classList.toggle('hide', !!(ui.admin || (p && !ui.linkPlace))); }
  dock.classList.toggle('hide', !(p && p.complete) || ui.admin || (ui.linkPlace && !(p.place && p.place.id === ui.linkPlace.id)));
  { const mb = dock.querySelector('[data-tab="money"]'); if (mb) mb.classList.toggle('hide', isTrip(p)); }
  dock.querySelectorAll('[data-tab]').forEach(b => b.dataset.tab === ui.tab ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  if (anim) { main.classList.remove('enter'); void main.offsetWidth; main.classList.add('enter'); }
  if ($('#peermap-slot')) mountPeerMap();
  slideWatch(); peekWatch(); sceneAnimate(); trustPaint();
  { const cb = dock.querySelector('[data-a="chat"]'); if (cb) cb.classList.toggle('dim', !(p && p.team)); }
}
function render(anim) { renderTop(); renderMain(anim); renderSide(); paintNotice(); }
function paintNotice() { const n = CFG.notice || '', el = $('#notice'); if (!el) return; const show = n && S.noticeHid !== n && !ui.admin; el.classList.toggle('hide', !show); if (show) el.innerHTML = `${ic('bell')}<span class="grow">${esc(n)}</span><button class="icon-btn" data-a="notice-x" aria-label="بستن">${ic('close')}</button>`; }
function renderSide() {
  const el = $('#side'); if (!el) return; if (!isDesk() || ui.admin) { el.innerHTML = ''; return; }
  const p = active(), st = el.scrollTop, tabs = p && p.complete ? `<nav class="side-tabs" aria-label="صفحه‌ها">${[['peers', 'map', isTrip(p) ? 'هم‌سفرها' : 'هم‌مسیرها'], ['team', 'team', 'تیم ما'], ...(isTrip(p) ? [] : [['money', 'money', 'حساب']])].map(([k, i, t]) => `<button data-tab="${k}" ${ui.tab === k ? 'aria-current="page"' : ''}>${ic(i)}<span>${t}</span></button>`).join('')}</nav>` : '';
  el.innerHTML = tabs + drawer('html'); el.scrollTop = st; putTrust(el.querySelector('.trust-slot'));
}
addEventListener('resize', () => { clearTimeout(ui.rsT); ui.rsT = setTimeout(() => { renderSide(); if (PM.map) PM.map.resize(); }, 200); });

/* ═════════ layers ═════════ */
let lastFocus;
function sheet(title, body, sub) {
  lastFocus = document.activeElement;
  $('#layer').innerHTML = `<div class="scrim" data-a="close"></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-t" tabindex="-1"><div class="sheet-h"><div><h2 id="sh-t">${title}</h2>${sub ? `<p class="muted small">${sub}</p>` : ''}</div><button class="icon-btn" data-a="close" aria-label="بستن">${ic('close')}</button></div><div class="sheet-b">${body}</div></div>`;
  $('.sheet').focus();
}
function closeLayer() { $('#layer').innerHTML = ''; if (ui.backToChat) { ui.backToChat = false; return chatSheet(); } if (lastFocus && document.contains(lastFocus)) lastFocus.focus(); }
const kindIc = (k, big, anim) => { const K = KINDS[k] || KINDS.other, c = col(K.c); return `<span class="kind-ic ${big ? 'lg' : ''} ${anim === false ? '' : 'anim'}" style="--kc:${c.c};--ki:${c.i}">${ic(K.ic, '')}</span>`; };

function switcher() {
  const ps = allProfiles();
  sheet('مسیرک‌های شما', `${ps.map(p => profRow(p)).join('')}<button class="btn line" data-a="new-profile">${ic('plus')}مسیرکِ تازه</button>
    <p class="muted small">برای هر جا یک مسیرک: مدرسه، کلاس زبان بچه‌ها، باشگاه، محل کار… با یک تپ بین‌شان جابه‌جا شوید.</p>`);
}
function profRow(p) {
  const c = profColor(p), mk = p.complete ? missingStep(p) : null;
  if (ui.inDrawer) { const st = !p.complete ? 'نیمه‌کاره' : p.team ? 'تیم ' + fa(p.team.no) : mk ? 'یک سؤال مانده' : 'دنبال هم‌مسیر';
    const cls = !p.complete || mk ? 'warn' : p.team ? 'team' : 'seek';
    return `<button class="pcard2 ${p.id === S.active ? 'active' : ''}" style="--kc:${c.c};--ki:${c.i}" data-a="use" data-id="${p.id}"><span class="pc-ic">${ic((KINDS[p.kind] || KINDS.other).ic, '')}</span><span class="grow" style="min-width:0"><b>${esc(p.label)}</b><small>${esc(placeName(p) || (KINDS[p.kind] || KINDS.other).n)}</small></span><span class="pc-st ${cls}">${cls === 'team' ? '<i class="dot"></i>' : ''}${st}</span></button>`;
    return `<button class="pcard ${p.id === S.active ? 'active' : ''}" style="--kc:${c.c}" data-a="use" data-id="${p.id}"><span class="pc-ic">${ic((KINDS[p.kind] || KINDS.other).ic, '')}</span><span class="grow" style="min-width:0"><b>${esc(p.label)}</b><small>${esc(placeName(p) || (KINDS[p.kind] || KINDS.other).n)}</small></span><span class="pc-st">${st}</span>${p.id === S.active ? ic('check', 'i') : ''}</button>`; }
  const st = !p.complete ? '<span class="st warn">نیمه‌کاره</span>' : p.team ? `<span class="st team">تیم ${fa(p.team.no)}</span>` : mk ? '<span class="st warn">یک سؤال مانده</span>' : '<span class="st">بی‌تیم</span>';
  return `<button class="prof ${p.id === S.active ? 'active' : ''}" style="--kc:${c.c};--ki:${c.i}" data-a="use" data-id="${p.id}">${kindIc(p.kind, false, false)}<span class="grow" style="min-width:0"><b>${esc(p.label)}</b><small>${esc(placeName(p) || (KINDS[p.kind] || KINDS.other).n)}</small></span>${st}</button>`;
}
function profPanel(p) {
  if (ui.pcol) return '';
  const n = ui.inbox ? ui.inbox.invites.length + ui.inbox.unread : 0, c = p.complete, off = (k, why) => k ? '' : ` aria-disabled="true" data-why="${why}"`;
  return `<div class="pc-panel" style="--kc:${profColor(p).c}"><div class="pc-grid">
    <button data-a="wiz-review">${ic('check')}<span>${c ? 'مرور و بازتنظیم' : 'ادامه‌ی ثبت‌نام'}</span></button>
    <button data-a="${c ? 'inbox' : 'dim'}"${off(c, 'بعد از کامل شدن مسیرک')}>${ic('bell')}<span>دعوت‌ها و پیام‌ها</span>${n ? `<i class="badge">${fa(n)}</i>` : ''}</button>
    <button data-a="${c && p.place ? 'poster' : 'dim'}"${off(c && p.place, 'بعد از انتخاب مکان')}>${ic('share')}<span>لینک و پوستر</span></button>
    <button data-a="${p.team ? 'chat' : 'dim'}"${off(p.team, 'بعد از تیم شدن')}>${ic('chat')}<span>گفتگوی تیم</span></button></div>
    ${CFG.flags.family_link !== false && c ? `<button class="pc-fam" data-a="fam">${ic('team')}<span>${p.shared ? (p.shared.role === 'act' ? 'همراه خانواده · در حال انجام کار' : 'همراه خانواده · فقط دیدن') : 'همراه خانواده: همسر، پدربزرگ یا مادربزرگ'}</span></button>` : ''}
    ${p.team ? `<button class="pc-leave" data-a="leave">${ic('leave')}جدا شدن از ${esc(teamName(p.team))}</button>` : ''}</div>`;
}
function drawer(keep) {
  const p = active(), ps = allProfiles(); ui.inDrawer = true;
  if (!keep) lastFocus = document.activeElement;
  const mi = (a, i, txt, extra = '') => `<button class="mi" data-a="${a}" ${extra}>${ic(i)}<span class="grow">${txt}</span></button>`;
  const old = keep && $('.drawer'), st = old ? old.scrollTop : 0;
  const grp = (k, i, t, body) => `<div class="grp"><button class="sec-h" data-a="toggle" data-v="${k}" aria-expanded="${!!ui.open[k]}"><span>${ic(i, 'i')} ${t}</span>${ic('down', 'i chev' + (ui.open[k] ? ' open' : ''))}</button><div class="plist ${ui.open[k] ? '' : 'closed'}" style="max-height:${ui.open[k] ? 700 : 0}px">${body}</div></div>`;
  const html = `
    <div class="dr-head"><img src="assets/icon.svg?v=22" width="40" height="40" alt=""><div class="dr-title"><b>رسیدیم <span class="beta-t">(آزمایشی)</span></b><small dir="auto">${S.phone ? esc(fa(S.phone.replace(/^(\d{4})\d{3}/, '$1•••'))) : S.token ? 'مهمان · شماره تأیید نشده' : 'هنوز وارد نشده‌اید'}</small></div><button class="icon-btn sq" data-a="theme" aria-label="${isDark() ? 'حالت روز' : 'حالت شب'}">${ic(isDark() ? 'sun' : 'moon')}</button><button class="icon-btn sq" data-a="close" aria-label="بستن">${ic('close')}</button></div>
    <div class="sec-h"><span>مسیرک‌های من</span><button class="link small" data-a="new-profile">${ic('plus')}تازه</button></div>
    <div class="pgroup">${ps.length ? ps.map(x => `<div class="pwrap ${x.id === S.active ? 'on' : ''}">${profRow(x)}${!x.complete && !x.shared ? `<button class="pdel" data-a="prof-del" data-id="${x.id}" aria-label="پاک کردن «${esc(x.label)}»">${ic('close')}</button>` : ''}${x.id === S.active ? profPanel(x) : ''}</div>`).join('') : `<button class="p-empty" data-a="new-profile">${ic('plus')}<span><b>اولین مسیرک را بسازید</b><small>مدرسه، مهد، محل کار…؛ ۲ دقیقه</small></span></button>`}</div>
    ${ps.length === 1 && p && p.complete ? `<div class="nudge"><span class="small">یک مسیرک دیگر هم دارید؟</span><div class="chips">${[['institute', 'کلاس زبان'], ['club', 'باشگاه'], ['work', 'محل کار'], ['kinder', 'مهد']].filter(([k]) => k !== p.kind).map(([k, v]) => `<button class="chip" data-a="quick-new" data-kind="${k}">+ ${v}</button>`).join('')}</div></div>` : ''}
    ${S.token && !S.phone ? `<div class="hint warn" style="margin:6px 0">${ic('phone')}<span class="grow small">شماره‌تان هنوز تأیید نشده؛ تا تأیید، شماره‌ی دیگران را نمی‌بینید.</span><button class="btn sm" data-a="verify">تأیید</button></div>` : ''}
    ${p && p.team && CFG.flags.league_on ? `<div class="tiles"><button class="tile" data-a="quiz">${ic('trophy')}<span>لیگ راه ${esc(destWord(p))}</span></button></div>` : ''}
    <div class="sep"></div>
    ${CFG.donate && (CFG.donate.card || CFG.donate.gateway) ? `<button class="mi dong" data-a="donate"><span class="dong-ic">${ic('heart')}</span><span class="grow"><b>دنگ خیر</b><small>کمک کنید رسیدیم رایگان بماند</small></span></button>` : ''}
    ${standalone() || NATIVE ? '' : `<button class="mi app-cta" data-a="install">${ic('install')}<span class="grow"><b>${ui.apk && ui.apk.url ? 'اپ اندروید رسیدیم' : 'نصب روی گوشی'}</b><small>یادآوری نوبت، حتی وقتی بسته است</small></span></button>`}
    ${grp('help', 'guide', 'راهنما و ارتباط', mi('guide', 'guide', 'راهنمای رسیدیم') + mi('support', 'ticket', 'پشتیبانی (مشکلی دارم)') + mi('feedback', 'spark', 'نظر و پیشنهاد ⭐') + mi('about', 'heart', 'درباره‌ی ما'))}
    ${grp('set', 'gear', 'تنظیمات', `<label class="mi"><span style="display:contents">${ic('sound')}</span><span class="grow">صداهای اپ</span><input type="checkbox" class="tgl" data-a="sound" ${S.sound !== false ? 'checked' : ''}></label>` + mi('notify', 'bell', 'اعلان‌ها') + mi('sub', 'spark', CFG.flags.paid_mode ? (ME.premium_until * 1000 > Date.now() ? 'اشتراک همراه: فعال' : 'اشتراک همراه') : 'اشتراک (فعلاً رایگان)') + mi('radio', 'radio', 'رادیو رسیدیم') + mi('rules', 'shield', 'قوانین و حریم خصوصی') + (S.token ? mi('logout', 'logout', 'خروج از حساب') : ''))}
    ${S.token ? '' : mi('login', 'user', 'ورود به حساب')}
    ${CFG.flags.test_tools ? `<div class="sep"></div><div class="test-zone"><button class="sec-h" data-a="toggle" data-v="test" aria-expanded="${ui.open.test}"><span>${ic('flask', 'i')} گزینه‌های آزمایشی</span>${ic('down', 'i chev' + (ui.open.test ? ' open' : ''))}</button>
      <div class="plist ${ui.open.test ? '' : 'closed'}" style="max-height:${ui.open.test ? 600 : 0}px">
      ${p && p.complete ? mi('t-fake5', 'plus', 'افزودن ۵ همسایه‌ی آزمایشی') + mi('t-fake1', 'car', 'افزودن ۱ راننده‌ی آزمایشی') + mi('t-invme', 'bell', 'یک همسایه به من پیشنهاد بدهد') + mi('t-clear', 'close', 'پاک کردن همسایه‌های آزمایشی') : ''}
      ${p ? mi('t-delprof', 'close', 'پاک کردن کامل این مسیرک') : ''}
      ${mi('t-splash', 'spark', 'نمایش دوباره‌ی اسپلش')}
      ${mi('t-reset', 'logout', 'بازنشانی کامل (از صفر)')}
      ${mi('admin', 'gear', 'پیشخوان مدیریت')}</div></div>` : ''}
    <div class="trust-slot"></div>
    <div class="ver-box">${NATIVE ? `${ic('install')}<span>اپ اندروید رسیدیم${APPVER ? ' · نسخه ' + fa(APPVER) : ''}<br><small>نسخه‌ی وب ۲۲</small></span>` : `<span>نسخه‌ی وب ۲۲${ui.apk && ui.apk.ver ? ' · اپ اندروید ' + fa(ui.apk.ver) : ''}</span>${ui.apk && ui.apk.url ? `<a class="btn sm ac" href="${esc(ui.apk.url)}" download>${ic('install')}دانلود اپ اندروید</a>` : ''}`}<small class="muted">${CFG.service ? 'فاصله‌ها از نقشه‌ی نشان' : 'فاصله‌ها تقریبی'}</small></div>`;
  if (keep === 'html') { ui.inDrawer = false; return html; }
  if (old) { old.innerHTML = html; old.scrollTop = st; }
  else { $('#layer').innerHTML = `<div class="scrim" data-a="close"></div><nav class="drawer" aria-label="منوی کناری" tabindex="-1">${html}</nav>`; $('.drawer').focus(); }
  putTrust($('.drawer .trust-slot'));
  ui.inDrawer = false;
}
/* Enamad: the official snippet lives untouched in index.html (#trust); other places get an exact clone */
function putTrust(slot) { const t = document.querySelector('#trust .enamad'); if (slot && t) { slot.innerHTML = ''; slot.appendChild(t.cloneNode(true)); } }
function donateSheet() {
  const D = CFG.donate || {}, card = String(D.card || ''), gw = !!D.gateway; ui.dn = ui.dn || { amt: 150000 };
  const cardBox = card ? `<button class="cardno big" data-a="donate-copy"><span class="grow"><span class="muted small">${gw ? 'یا کارت به کارت' : 'شماره کارت'}${D.name ? ' به نام ' + esc(D.name) : ''} · بزنید تا کپی شود</span><b dir="ltr">${fa(card.replace(/(\d{4})(?=\d)/g, '$1 '))}</b></span>${ic('copy')}</button>` : '';
  sheet('دنگ خیرِ شما', `<div class="dong-hero"><span class="shine"></span>${ic('heart')}<b>رسیدیم برای همه رایگان بماند</b><span>رسیدیم در این دوره برای همه‌ی خانواده‌ها رایگان است و هزینه‌ی سرور، نقشه و پیامکش را خودمان می‌دهیم. اگر به کارتان آمده، دنگ خیرتان را بگذارید.</span></div>
    ${gw ? `<div class="chips dn-amts">${[50000, 150000, 500000, 1000000].map(v => `<button class="chip" data-a="dn-amt" data-v="${v}" aria-pressed="${ui.dn.amt === v}">${fa(v / 1000)} هزار${v === 150000 ? ' ✨' : ''}</button>`).join('')}</div>
      <div class="field"><label for="dn-v">مبلغ دلخواه (تومان)</label><input id="dn-v" inputmode="numeric" dir="ltr" value="${fa(ui.dn.amt)}"></div>
      <div class="field"><label for="dn-n">نام (اختیاری؛ برای تشکر)</label><input id="dn-n" autocomplete="name"></div>
      <button class="btn ac block" data-a="dn-pay">${ic('shield')}پرداخت امن با درگاه پی‌پینگ</button>${D.test ? '<p class="note">درگاه فعلاً در حالت آزمایشی است.</p>' : ''}` : ''}
    ${cardBox}
    <p style="line-height:2">پرداخت هر مبلغی، کم یا زیاد، دلگرمی است. حمایت شما خرج رایگان ماندن رسیدیم و ساختن اپ‌های کاربردی دیگری مثل آن می‌شود.</p>
    <p class="muted small">${ic('shield')} این کمک داوطلبانه است و هیچ امکانی را برای کسی باز یا بسته نمی‌کند.</p>`);
}
function payResult(st, ref) {
  history.replaceState(null, '', BASE);
  if (st === 'ok') { snd('done'); sheet('دمتان گرم! 🌸', `<div class="dong-hero"><span class="shine"></span>${ic('heart')}<b>حمایت شما رسید</b><span>با این دنگ خیر، رسیدیم برای خانواده‌های بیشتری رایگان می‌ماند.${quip('done', 1)}</span></div><p class="muted small" style="text-align:center">کد پیگیری: <b dir="ltr">${esc(ref)}</b></p><button class="btn block" data-a="close">خواهش می‌کنم</button>`); }
  else sheet('پرداخت انجام نشد', `<p style="line-height:2">پرداخت کامل نشد یا لغو شد. اگر پولی از حساب‌تان کم شده، بانک معمولاً تا ۷۲ ساعت خودکار برمی‌گرداند؛ با کد <b dir="ltr">${esc(ref)}</b> هم می‌توانید از «تماس با ما» پیگیری کنید.</p><div class="row"><button class="btn ac grow" data-a="donate">دوباره امتحان می‌کنم</button><button class="btn line grow" data-a="close">بعداً</button></div>`);
}
function contactSheet() {
  ui.ct = ui.ct || { cat: 'پیشنهاد' }; ui.ct.t0 = Date.now();
  sheet('تماس با ما', `<div class="chips">${['پیشنهاد', 'مشکل فنی', 'مدرسه‌ها و همکاری', 'حساب و پرداخت', 'سایر'].map(c => `<button class="chip" data-a="ct-cat" data-v="${c}" aria-pressed="${ui.ct.cat === c}">${c}</button>`).join('')}</div>
    <div class="adm-form"><div class="field"><label for="ct-name">نام (اختیاری)</label><input id="ct-name" autocomplete="name"></div><div class="field"><label for="ct-c">شماره یا ایمیل برای جواب${S.token ? ' (اختیاری)' : ''}</label><input id="ct-c" dir="ltr" value="${esc(S.phone || '')}" autocomplete="tel"></div></div>
    <input id="ct-hp" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
    <div class="field"><label for="ct-t">پیام شما</label><textarea id="ct-t" rows="5" placeholder="هر چه می‌خواهید بگویید؛ کوتاه یا مفصل."></textarea></div>
    <button class="btn ac block" data-a="ct-send">فرستادن پیام</button>
    ${S.token ? '<button class="link" data-a="ticket">پیام‌ها و تیکت‌های قبلی من</button>' : ''}`, 'پیام شما مستقیم به پیشخوان رسیدیم می‌رسد.');
}
async function supportSheet() {
  let list = []; if (S.token) { try { list = (await api('tickets')).list; } catch (e) {} }
  ui.ct = ui.ct || { cat: 'مشکل فنی' }; ui.ct.t0 = Date.now();
  const st = k => k.status === 'open' ? ['در صف بررسی', ''] : k.status === 'answered' ? ['پاسخ داده شد', 'ok'] : ['بسته شد', 'muted'];
  sheet('پشتیبانی', `<div class="sup-how">${ic('ticket')}<span><b>چطور کار می‌کند؟</b> مشکل یا سؤال‌تان را بنویسید. یک <b>شماره‌ی پیگیری</b> می‌گیرید و جواب ما همین‌جا، زیر «درخواست‌های من»، می‌آید${S.token ? '' : '؛ اگر وارد نشده‌اید، به شماره یا ایمیلی که می‌نویسید جواب می‌دهیم'}.</span></div>
    <div class="chips">${['مشکل فنی', 'ثبت‌نام و کد ورود', 'تیم و نوبت', 'حساب و پرداخت', 'گزارش رفتار', 'سایر'].map(c => `<button class="chip" data-a="ct-cat" data-v="${c}" aria-pressed="${ui.ct.cat === c}">${c}</button>`).join('')}</div>
    <div class="adm-form"><div class="field"><label for="ct-name">نام (اختیاری)</label><input id="ct-name" autocomplete="name"></div><div class="field"><label for="ct-c">شماره یا ایمیل برای جواب${S.token ? ' (اختیاری)' : ''}</label><input id="ct-c" dir="ltr" value="${esc(S.phone || '')}"></div></div>
    <input id="ct-hp" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
    <div class="field"><label for="ct-t">چه شده؟</label><textarea id="ct-t" rows="4" placeholder="مثلاً: کد ورود نمی‌رسد / تیم ما برنامه‌ی فردا را نشان نمی‌دهد"></textarea></div>
    <button class="btn ac block" data-a="sup-send">فرستادن درخواست</button>
    ${list.length ? `<h3 style="margin:8px 0 0">درخواست‌های من</h3>${list.map(k => { const [t, c] = st(k); return `<div class="srow"><b>#${fa(k.no)} · ${esc(k.cat)} <span class="tag ${c}">${t}</span></b><span class="small">${esc(k.text)}</span>${k.reply ? `<span class="hint" style="padding:8px 12px">${ic('chat')}<span><b>پاسخ رسیدیم:</b> ${esc(k.reply)}</span></span>` : ''}</div>`; }).join('')}` : ''}`, 'پاسخ معمولاً تا یک روز کاری.');
}
async function feedbackSheet() {
  ui.fb = ui.fb || { st: 0, cat: 'پیشنهاد' }; let L = { list: [], avg: 0, n: 0 }; try { L = await api('fb_list'); } catch (e) {}
  sheet('نظرات و پیشنهادها', `<div class="stars" role="group" aria-label="رضایت شما">${[1, 2, 3, 4, 5].map(i => `<button data-a="fb-star" data-v="${i}" class="${i <= ui.fb.st ? 'on' : ''}" aria-label="${fa(i)} ستاره">★</button>`).join('')}</div>
    <p class="muted small" style="text-align:center;margin:-4px 0 6px">${L.n ? `میانگین رضایت ${fa(L.avg)} از ۵ · ${fa(L.n)} نظر` : 'اولین نفری باشید که امتیاز می‌دهد.'}</p>
    <div class="chips">${['پیشنهاد', 'نیاز تازه', 'تعریف', 'انتقاد'].map(c => `<button class="chip" data-a="fb-cat" data-v="${c}" aria-pressed="${ui.fb.cat === c}">${c}</button>`).join('')}</div>
    <div class="field"><label for="fb-t">نظر یا نیاز شما</label><textarea id="fb-t" rows="3" placeholder="چه چیزی خوب است؟ چه چیزی کم است؟ اگر نیاز دیگری دارید (مرتبط یا نامرتبط)، بگویید؛ شاید بعدی را برای همین بسازیم."></textarea></div>
    <input id="fb-hp" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="btn ac block" data-a="fb-send">ثبت نظر</button>
    ${L.list.length ? `<h3 style="margin:10px 0 2px">پیشنهادهای دیگران؛ به هر کدام موافقید دل بدهید</h3><p class="muted small">پرطرفدارها زودتر ساخته می‌شوند.</p>${L.list.map(x => `<div class="fb-item"><span class="grow"><span class="tag">${esc(x.cat)}</span> ${esc(x.text)}</span><button class="fb-like ${x.liked ? 'on' : ''}" data-a="fb-like" data-id="${x.id}" aria-label="موافقم">♥ <b>${fa(x.likes)}</b></button></div>`).join('')}` : ''}`);
}
async function ambView() {
  const tk = ui.amb; let A; try { A = await api('amb_view', { token: tk }); } catch (e) { $('#main').innerHTML = `<section class="card empty">${ic('warn')}<h1 style="font-size:1.3rem">این لینک معتبر نیست</h1><p class="muted">اگر سفیر رسیدیم هستید، لینک تازه را از مدیر بگیرید.</p></section>`; return; }
  const a = A.amb, link = `${SITE}/?r=${a.code}`, due = A.sum - A.paid; ui.ambA = A;
  $('#main').innerHTML = `<div class="amb stack"><section class="amb-hero"><span class="amb-badge">🎖️ سفیر رسیدیم</span><h1>سلام ${esc(a.name)}!</h1><p>هر خانواده‌ای که با لینک یا پوستر شما بیاید، به اسم شما ثبت می‌شود. این صفحه فقط برای شما و مدیر رسیدیم است؛ لینکش را به کسی ندهید.</p></section>
    <div class="grid">${[[A.profiles, 'خانواده‌ی ثبت‌نام‌شده'], [A.teams, 'خانواده‌ی تیم‌شده'], [money(A.sum), 'کل پورسانت'], [money(due), 'مانده‌ی پرداخت']].map(([v, t]) => `<div class="stat"><b>${typeof v === 'number' ? fa(v) : v}</b><span>${t}</span></div>`).join('')}</div>
    <section class="card stack"><h2>تعرفه‌ی شما</h2><p>هر خانواده که مسیرکش را کامل کند: <b>${money(a.rate_profile)}</b> · هر خانواده که تیم شود: <b>${money(a.rate_team)}</b></p><p class="muted small">تسویه ماهانه، به کارتی که به مدیر داده‌اید. ثبت‌نام‌های تکراری یا آزمایشی حساب نمی‌شوند.</p></section>
    <section class="card stack"><h2>لینک شخصی شما</h2><div class="cardno"><b dir="ltr" class="grow">${esc(link.replace('https://', ''))}</b><button class="btn sm" data-a="copy" data-v="${esc(link)}">${ic('copy')}کپی</button></div>
      <h3 style="margin-top:6px">پوستر یک مدرسه یا محل کار</h3><p class="muted small">کد ۸ حرفی مکان (انتهای لینک پوستر آن، مثل residim.ir/WPXJUG5A) را بنویسید؛ لینک و QR به اسم شما ساخته می‌شود.</p>
      <div class="row"><input id="amb-pl" dir="ltr" placeholder="WPXJUG5A" maxlength="8" style="flex:1"><button class="btn ac" data-a="amb-make">ساختن</button></div><div id="amb-out"></div></section>
    <section class="card stack"><h2>ایده‌های سریع</h2><ol class="steps3"><li>پوستر A5 را روی تابلوی اعلانات مدرسه (با اجازه‌ی مدرسه) بچسبانید.</li><li>متن آماده و لینک را در گروه کلاس و کانال مدرسه بگذارید؛ صبح‌های شنبه بهترین زمان است.</li><li>از ۲ خانواده‌ی هم‌محله بخواهید با هم ثبت‌نام کنند؛ تیم زودتر شکل می‌گیرد.</li></ol></section>
    ${A.list.length ? `<section class="card"><h2>ثبت‌شده‌ها</h2><table><tr><th>تاریخ</th><th>مکان</th><th>نوع</th><th>مبلغ</th></tr>${A.list.slice(0, 60).map(x => `<tr><td>${jLabel(new Date(x.created * 1000))}</td><td>${esc(x.place || '—')}</td><td>${x.kind === 'team' ? 'تیم شد' : 'ثبت‌نام'}</td><td>${money(x.amount)}${+x.paid ? ' ✓' : ''}</td></tr>`).join('')}</table></section>` : ''}</div>`;
  $('#dock').classList.add('hide'); document.body.classList.add('amb-mode'); $('#title').innerHTML = `<img src="assets/icon.svg?v=22" alt=""><span><b>رسیدیم</b><small>صفحه‌ی سفیران</small></span>`;
}
function reportHtml(p, T) {
  const H = (ui.hist && ui.hist.trips) || [], done = H.filter(x => x.status === 'done').sort((a, b) => a.date < b.date ? -1 : 1), b = balances(T), now = new Date();
  const by = {}; T.members.forEach(m => by[m.id] = { n: 0, kids: 0, th: 0 }); done.forEach(x => { if (by[x.exec]) { by[x.exec].n++; by[x.exec].kids += x.kids || 0; by[x.exec].th += x.thanks ? 1 : 0; } });
  const kidRides = done.reduce((a, x) => a + (x.kids || 0), 0), first = done[0] ? ymdD(done[0].date) : now, top = Object.entries(by).sort((a, c) => c[1].n - a[1].n)[0];
  const medal = n => n >= 40 ? '🏅 قهرمان راه' : n >= 15 ? '⭐ همسفر ثابت‌قدم' : n >= 5 ? '🌱 شروع خوب' : '🙂 تازه‌وارد';
  return `<div class="rp"><header class="rp-h"><img src="assets/icon-192.png" alt=""><div class="grow"><small>کارنامه‌ی تیم · رسیدیم</small><h1>${esc(teamName(T.team))}</h1><span>${esc(T.place.name)} · از ${jLabel(first)} تا ${jLabel(now)} ${fa(jp(now).y)}</span></div><div class="rp-seal">${fa(done.length)}<small>سفر به سلامت</small></div></header>
    <section class="rp-k">${[[fa(done.length), 'سفر انجام‌شده'], [fa(kidRides), 'بار رساندن بچه‌ها'], [fa(done.filter(x => x.thanks).length), 'تشکر ثبت‌شده'], [fa(T.members.length), 'خانواده']].map(([v, t]) => `<div><b>${v}</b><span>${t}</span></div>`).join('')}</section>
    <h2>بیلان خانواده‌ها</h2><table class="rp-t"><tr><th>خانواده</th><th>سفرِ رانده‌شده</th><th>رساندن بچه</th><th>تشکر</th><th>تراز حساب</th><th>نشان</th></tr>${T.members.map(m => `<tr><td><b>${esc(fam(m))}</b></td><td>${fa(by[m.id].n)}</td><td>${fa(by[m.id].kids)}</td><td>${fa(by[m.id].th)}</td><td class="${b[m.id] > 0 ? 'plus' : b[m.id] < 0 ? 'minus' : ''}">${b[m.id] > 0 ? '+' : b[m.id] < 0 ? '−' : ''}${money(b[m.id])}</td><td>${medal(by[m.id].n)}</td></tr>`).join('')}</table>
    ${top && top[1].n ? `<p class="rp-note">🌟 بیشترین زحمت این دوره: <b>${esc(fam(mem(T, top[0])))}</b> با ${fa(top[1].n)} سفر. دست‌شان درد نکند!</p>` : ''}
    <h2>جدول سفرها</h2><table class="rp-t rp-s"><tr><th>#</th><th>تاریخ</th><th>روز</th><th>مسیر</th><th>راننده</th><th>بچه‌ها</th><th>تشکر</th></tr>${done.map((x, i) => { const dt = ymdD(x.date); return `<tr><td>${fa(i + 1)}</td><td>${jLabel(dt)} ${fa(jp(dt).y)}</td><td>${DAYS[(dt.getDay() + 1) % 7]}</td><td>${x.dir === 'out' ? 'رفت' : 'برگشت'}</td><td>${esc(fam(mem(T, x.exec)))}</td><td>${fa(x.kids || 0)}</td><td>${x.thanks ? '♥' : ''}</td></tr>`; }).join('') || '<tr><td colspan="7">هنوز سفری ثبت نشده.</td></tr>'}</table>
    <h2>دفتر حساب</h2><table class="rp-t rp-s"><tr><th>شرح</th>${T.members.map(m => `<th>${esc(m.family)}</th>`).join('')}</tr>${T.ledger.slice(-80).map(e => `<tr><td>${esc(e.text)}</td>${T.members.map(m => { const v = Math.round((e.d || {})[m.id] || 0); return `<td class="${v > 0 ? 'plus' : v < 0 ? 'minus' : ''}">${v ? (v > 0 ? '+' : '−') + fa(sep(Math.abs(v))) : ''}</td>`; }).join('')}</tr>`).join('')}</table>
    <footer class="rp-f"><span>تهیه‌شده در ${jLabel(now)} ${fa(jp(now).y)} · residim.ir</span><span>رسیدیم پولی نگه نمی‌دارد؛ این کارنامه از ثبت‌های خود اعضا ساخته شده است.</span></footer></div>`;
}
async function reportPrint() {
  const p = active(), T = ui.team; if (!p || !T || !T.team) return;
  if (NATIVE && false) return sheet('کارنامه‌ی PDF', `<p style="line-height:2">ذخیره‌ی PDF فعلاً در نسخه‌ی وب است. residim.ir را در مرورگر باز کنید و از «حساب ← کارنامه‌ی PDF» بگیرید.</p><a class="btn ac block" href="${SITE}/" target="_blank" rel="noopener">باز کردن در مرورگر</a>`);
  if (!ui.hist) { try { ui.hist = await api('team_history', { profile_id: p.id }); } catch (e) {} }
  let r = $('#print-root'); if (!r) { r = document.createElement('div'); r.id = 'print-root'; document.body.appendChild(r); }
  r.innerHTML = reportHtml(p, T);
  sheet('کارنامه‌ی تیم', `<p class="muted small">فایل همین‌جا ساخته و ذخیره می‌شود.</p><div class="row"><button class="btn ac grow" data-a="rep-pdf">${ic('download')}PDF</button><button class="btn line grow" data-a="rep-png">${ic('download')}تصویر PNG</button></div><button class="link" data-a="rep-print">چاپ با چاپگر</button>`);
}
async function reportFile(kind) {
  const r = $('#print-root'); if (!r || !r.innerHTML) return; toast('در حال ساختن فایل…');
  try { await loadJs('assets/html2canvas.min.js?v=22', () => !!window.html2canvas, 20000); if (kind === 'pdf') await loadJs('assets/jspdf.umd.min.js?v=22', () => !!(window.jspdf && window.jspdf.jsPDF), 20000); } catch (e) { return toast('بارگذاری ابزار ساخت فایل نشد؛ اینترنت را بررسی کنید.'); }
  r.classList.add('render'); try { await document.fonts.ready; } catch (e) {}
  try { const cv = await html2canvas(r.firstElementChild, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false }); const name = 'residim-' + ymd(new Date());
    let blob;
    if (kind === 'png') blob = await new Promise(res => cv.toBlob(res, 'image/png'));
    else { const pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' }), W = 210, H = 297, M = 8, iw = W - 2 * M, pageH = (H - 2 * M) * cv.width / iw;
      for (let y = 0, i = 0; y < cv.height; y += pageH, i++) { const c2 = document.createElement('canvas'); c2.width = cv.width; c2.height = Math.min(pageH, cv.height - y); c2.getContext('2d').drawImage(cv, 0, -y); if (i) pdf.addPage(); pdf.addImage(c2.toDataURL('image/jpeg', .92), 'JPEG', M, M, iw, c2.height * iw / cv.width); }
      blob = pdf.output('blob'); }
    if (!blob || !blob.size) throw new Error('empty');
    const f = new File([blob], name + '.' + kind, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [f] }) && matchMedia('(pointer:coarse)').matches) { try { await navigator.share({ files: [f], title: 'کارنامه‌ی تیم' }); r.classList.remove('render'); return; } catch (e) {} }
    const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 20000); snd('ok'); toast(`فایل ${kind.toUpperCase()} ذخیره شد (${fa(Math.round(blob.size / 1024))} کیلوبایت).`);
  } catch (e) { toast('ساخت فایل نشد؛ «چاپ با چاپگر» را امتحان کنید.'); } r.classList.remove('render');
}
function aboutSheet() {
  sheet('درباره‌ی رسیدیم', `<p style="line-height:2">رسیدیم یک سرویس مشارکتی رفت‌وآمد است: خانواده‌های هم‌محله و هم‌مسیر را پیدا می‌کند تا بچه‌ها را نوبتی به مدرسه، مهد، آموزشگاه و باشگاه ببرند و بیاورند؛ همکاران و دانشجوها هم نوبتی برانند. خرج نصف، ترافیک کمتر، خیال راحت.</p>
    <ul class="ticks"><li>${ic('check')}<span>تیم‌سازی همیشه رایگان است.</span></li><li>${ic('check')}<span>دختران بالای ۸ و پسران بالای ۱۲ سال با جنس مخالف هم‌سرویس نمی‌شوند.</span></li><li>${ic('check')}<span>پرداخت‌ها مستقیم بین خانواده‌هاست؛ رسیدیم پول کسی را نگه نمی‌دارد.</span></li><li>${ic('check')}<span>اطلاعات بچه‌ها فقط برای هم‌تیمی‌ها دیده می‌شود.</span></li></ul>
    <button class="btn line block" data-a="contact">${ic('ticket')}تماس با ما</button><p class="muted small">وب: residim.ir</p><div class="trust-slot center"></div>`);
  putTrust($('.sheet .trust-slot'));
}

/* ═════════ sheets ═════════ */
function famSheet(m) {
  const p = active(), sc = score(p, m), t = m.team, c = t ? col(t.color) : null;
  sheet('خانواده ' + esc(m.family), `
    <div class="row wrap"><span class="tag">${ic(m.pg === 'f' ? 'woman' : 'man')}${isChild(p) ? relLabel(m) : (m.pg === 'f' ? 'خانم' : 'آقا')}</span>
      ${m.role !== 'pay' ? `<span class="tag">${ic('wheel')}رانندگی${(m.days || []).length ? ': ' + m.days.map(d => DAYS[d]).join('، ') : ''} · ${fa(m.seats)} صندلی</span>` : ''}${m.role !== 'drive' ? `<span class="tag">${ic('coin')}مشارکت مالی</span>` : ''}
      <span class="tag">${fa(m.kids.length)} ${isChild(p) ? (m.kids.every(k => k.g === 'f') ? 'دختر' : m.kids.every(k => k.g === 'm') ? 'پسر' : 'فرزند') : 'نفر'}${isChild(p) ? ' · ' + m.kids.map(k => k.age != null ? fa(k.age) + ' ساله' : '').filter(Boolean).join('، ') : ''}</span>
      ${t ? `<span class="tag" style="background:${c.c};color:${c.i};border-color:${c.c}">${esc(teamName(t))}</span>` : '<span class="tag">بی‌تیم</span>'}</div>
    ${(m.values || []).length ? `<div><span class="lbl">برای‌شان مهم است</span><div class="row wrap" style="margin-top:6px">${m.values.map(v => `<span class="tag">${VALUES[v]}</span>`).join('')}</div></div>` : ''}
    <div class="card stack" style="padding:14px"><div class="row between"><b>هم‌خوانی با شما</b><span class="score big">${fa(sc.score)}٪</span></div><ul class="reason">${sc.reasons.map(([x, ok]) => `<li class="${ok ? '' : 'x'}">${esc(x)}</li>`).join('')}</ul>${m.rule_ok ? '' : '<p class="note" style="color:var(--warn)">طبق قانون رسیدیم، دختران بالای ۸ و پسران بالای ۱۲ سال با غیرهم‌جنس در یک سرویس قرار نمی‌گیرند.</p>'}</div>
    ${m.pickup ? `<span class="tag">${ic('pin')}${PICKUP[m.pickup]}</span>` : ''}${m.verified === false ? '<span class="tag warn">شماره‌شان هنوز تأیید نشده</span>' : ''}
    ${m.phone ? `<div class="row between card" style="padding:12px 14px"><span><span class="muted small">شماره</span><br><b class="num" dir="ltr">${esc(fa(m.phone))}</b></span><a class="icon-btn" href="tel:${esc(m.phone)}" aria-label="تماس">${ic('phone')}</a></div>` : (!S.phone ? '<div class="hint warn">' + ic('phone') + '<span class="grow">برای دیدن شماره‌ی هم‌مسیرها، شماره‌ی خودتان را تأیید کنید.</span><button class="btn sm" data-a="verify">تأیید</button></div>' : `<p class="muted small">${m.contact === 'app' ? 'ترجیح داده‌اند ارتباط فقط از طریق اپ باشد؛ دعوت بفرستید.' : 'شماره‌شان بعد از هم‌تیمی شدن نمایش داده می‌شود.'}</p>`)}
    ${m.rule_ok && !m.mate ? (m.invite ? (m.invite.dir === 'in' ? `<button class="btn ac block" data-a="accept" data-id="${m.invite.id}">پذیرفتن دعوت‌شان</button>` : '<button class="btn line block" disabled>دعوت رفت؛ منتظر پاسخ…</button>') : (t && p.team ? '' : `<button class="btn ac block" data-a="invite" data-id="${m.id}">${t ? 'درخواست پیوستن به ' + esc(teamName(t)) : 'هم‌مسیر شویم؟'}</button>`)) : ''}
    <div class="navs"><a href="geo:${m.lat},${m.lng}?q=${m.lat},${m.lng}">مسیریاب گوشی</a><a href="https://neshan.org/maps/@${m.lat},${m.lng},16z,0p" target="_blank" rel="noopener">نشان</a><a href="https://balad.ir/location?latitude=${m.lat}&longitude=${m.lng}" target="_blank" rel="noopener">بلد</a></div>
    <p class="muted small">${m.exact ? '' : 'موقعیت تقریبی (حدود ۱۵۰ متر) است؛ نقطه‌ی دقیق فقط برای هم‌تیمی‌ها.'}</p>`,
    `${esc(m.hood)}${m.dist ? ' · ' + km1(m.dist.m / 1000) + ' کیلومتر مسیر از شما' : ''}`);
}
async function threadSheet(id) { let r; try { r = await api('invite_thread', { id }); } catch (e) { return fail(e); } const o = r.other || {};
  sheet(`آشنایی با خانواده ${esc(o.family || '')}`, `<div class="mate">${shapeAv(o.id || id, 48)}<div><b>خانواده ${esc(o.family || '')}</b><small>${esc(o.hood || '')} · ${o.role === 'pay' ? 'هزینه می‌دهند' : o.role === 'drive' ? 'رانندگی می‌کنند' : 'رانندگی و هزینه'}</small></div>${o.phone ? `<a class="icon-btn" href="tel:${esc(o.phone)}" aria-label="تماس">${ic('phone')}</a>` : ''}</div>
    <div class="th-list">${r.msgs.map(m => `<div class="cx-row ${m.mine ? 'me' : ''}"><div class="cx-b"><span>${esc(m.text)}</span><small>${jLabel(new Date(m.at * 1000))}</small></div></div>`).join('') || '<p class="muted small">هنوز پیامی نیست؛ یک سلام کافی است.</p>'}</div>
    ${r.status === 'pending' ? `<div class="cx-foot" style="position:static;padding:0"><input id="th-in" maxlength="400" placeholder="پیام کوتاه و محترمانه…" enterkeyhint="send"><button class="cx-send" data-a="thread-send" data-id="${id}" aria-label="فرستادن">${ic('send')}</button></div>
      ${r.dir === 'in' ? `<div class="row" style="margin-top:10px"><button class="btn ac grow" data-a="accept" data-id="${id}">آشنا شدیم؛ هم‌تیم شویم</button><button class="btn line grow" data-a="decline" data-id="${id}">فعلاً نه</button></div>` : '<p class="muted small" style="margin-top:8px">وقتی آن‌ها بپذیرند، تیم شکل می‌گیرد و همین پیام‌ها در گفتگوی تیم می‌ماند.</p>'}` : ''}`); }
async function inboxSheet() {
  await loadInbox(true); const I = ui.inbox; if (!I) return;
  sheet('دعوت‌ها و پیام‌ها', `${I.invites.map(v => `<div class="card stack" style="padding:14px"><b>خانواده ${esc(v.from.family)} دعوت به هم‌مسیری داده‌اند</b><span class="muted small">${esc(v.from.hood)}${v.from.dist ? ' · ' + km1(v.from.dist.m / 1000) + ' کیلومتر مسیر' : ''}</span>${v.hi ? `<p class="hi-msg">«${esc(v.hi)}»</p>` : ''}
      <div class="row"><button class="btn line sm grow" data-a="thread" data-id="${v.id}">${ic('chat')}گفتگو و آشنایی</button><button class="btn ac sm grow" data-a="accept" data-id="${v.id}">پذیرفتن</button><button class="btn line sm grow" data-a="decline" data-id="${v.id}">فعلاً نه</button></div></div>`).join('')}
    ${I.notes.map(n => `<div class="row" style="padding:6px 0;border-bottom:1px dashed var(--line)">${ic(n.kind === 'invite' ? 'team' : n.kind === 'arrive' ? 'check' : 'bell')}<span class="grow small">${esc(n.text)}</span></div>`).join('') || (I.invites.length ? '' : '<p class="muted">فعلاً پیامی نیست. وقتی کسی نزدیک شما ثبت‌نام کند یا دعوتی برسد، اینجا می‌بینید.</p>')}
    <button class="btn line sm" data-a="notify">${ic('bell')}روشن کردن نوتیف</button>`);
  paintBell();
}
function posterSheet() {
  const p = active(); const pl = p && p.place; if (!pl) return toast('اول مکان را در مسیرک انتخاب کنید.');
  const link = `${SITE}/${pl.code}`, pretty = `${SITE_HOST}/${pl.code}`, hook = isChild(p) ? HOOK.child : HOOK.adult, K = KINDS[pl.kind] || KINDS.other;
  const caption = `🚗 سرویس مشارکتی «${pl.name}»\n${hook}\n\nثبت‌نام در ۲ دقیقه و پیدا کردن هم‌مسیرهای نزدیک:\n${link}\n\n#رسیدیم`;
  ui.caption = caption;
  let qr = ''; try { const q = qrcode(0, 'M'); q.addData(link); q.make(); qr = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); } catch (e) {}
  sheet('لینک و پوستر ' + esc(K.n), `
    <div class="poster" id="poster"><div class="ph"><b>سرویس مشارکتی!</b><h2>${isChild(p) ? 'مامان، بابا، رسیدیم!' : 'هم‌مسیریم؟ رسیدیم!'}</h2><span>${esc(hook)}</span></div>
      <div class="car">${artCar('')}</div><h3 style="font-size:1.25rem">${esc(pl.name)}${pl.shift ? ' · ' + esc(pl.shift) : ''}</h3><div class="qr">${qr}</div>
      <p>QR را اسکن کنید یا وارد این لینک شوید:</p><p class="url">${esc(pretty)}</p><b>با رسیدیم همیشه ما زود می‌رسیم!</b></div>
    <div class="share-grid no-print"><button class="btn sm" data-a="share">${ic('share')}فرستادن</button><button class="btn line sm" data-a="copy-cap">${ic('copy')}کپی متن و لینک</button>
      <button class="btn line sm" data-a="img">${ic('download')}عکس‌نوشت (PNG)</button><button class="btn line sm" data-a="print">${ic('print')}چاپ یا PDF</button>
      <button class="btn line sm" data-a="share-app" data-v="eitaa">ایتا</button><button class="btn line sm" data-a="share-app" data-v="bale">بله</button></div>
    <div class="caption no-print">${esc(caption)}</div>`, 'برای دیوار، بورد اعلانات، گروه کلاس و شبکه‌های اجتماعی');
}
function printPoster() {
  const src = $('#poster'); if (!src) return;
  let root = $('#print-root'); if (!root) { root = document.createElement('div'); root.id = 'print-root'; document.body.appendChild(root); }
  root.innerHTML = src.outerHTML.replace('id="poster"', '');
  const done = () => { root.innerHTML = ''; removeEventListener('afterprint', done); };
  addEventListener('afterprint', done); setTimeout(() => window.print(), 80);
}
async function posterPng() {
  const p = active(), pl = p.place, link = `${SITE}/${pl.code}`, hook = isChild(p) ? HOOK.child : HOOK.adult;
  await document.fonts.load('900 40px Vazirmatn'); await document.fonts.load('400 30px Vazirmatn');
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  g.fillStyle = '#1DBF73'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#fff'; roundRect(g, 60, 420, W - 120, 860, 48); g.fill();
  g.direction = 'rtl'; g.textAlign = 'center'; g.fillStyle = '#04140B';
  g.font = '900 44px Vazirmatn'; g.fillText('سرویس مشارکتی!', W / 2, 110);
  g.font = '900 92px Vazirmatn'; g.fillText(isChild(p) ? 'مامان، بابا، رسیدیم!' : 'هم‌مسیریم؟ رسیدیم!', W / 2, 225);
  wrap(g, hook, W / 2, 300, W - 180, 46, '400 34px Vazirmatn');
  const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(artCar('').replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="220" '));
  await new Promise(r => { img.onload = r; img.onerror = r; }); try { g.drawImage(img, W / 2 - 200, 440, 400, 220); } catch (e) {}
  g.fillStyle = '#04140B'; wrap(g, pl.name + (pl.shift ? ' · ' + pl.shift : ''), W / 2, 720, W - 200, 58, '900 50px Vazirmatn');
  try { const q = qrcode(0, 'M'); q.addData(link); q.make(); const n = q.getModuleCount(), size = 340, cell = size / n, x0 = W / 2 - size / 2, y0 = 800; g.fillStyle = '#fff'; g.fillRect(x0 - 16, y0 - 16, size + 32, size + 32); g.fillStyle = '#04140B'; for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) g.fillRect(x0 + k * cell, y0 + r * cell, Math.ceil(cell), Math.ceil(cell)); } catch (e) {}
  g.direction = 'ltr'; g.font = '900 46px Vazirmatn'; g.fillText(`${SITE_HOST}/${pl.code}`, W / 2, 1220);
  g.direction = 'rtl'; g.fillStyle = '#04140B'; g.font = '900 40px Vazirmatn'; g.fillText('با رسیدیم همیشه ما زود می‌رسیم!', W / 2, 1320);
  return new Promise(r => c.toBlob(r, 'image/png'));
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function wrap(g, text, x, y, maxW, lh, font) { g.font = font; const words = text.split(' '); let line = '', yy = y; for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, yy); line = w; yy += lh; } else line = t; } if (line) g.fillText(line, x, yy); }

async function quizSheet() {
  const p = active(); if (!p) return;
  sheet('لیگ راه ' + esc(destWord(p)), '<p class="muted">در حال آوردن معمای امروز…</p>');
  let Q; try { Q = await api('quiz_today', { profile_id: p.id }); } catch (e) { return fail(e); }
  const T = ui.team, q = Q.q; if (!$('.sheet')) return;
  const board = T && T.board && T.board.length ? `<div class="board">${T.board.map((b, i) => `<div style="${b.team === (p.team || {}).id ? 'outline:2px solid var(--ac)' : ''}"><b>${fa(i + 1)}</b><i class="team-dot" style="background:${col(b.color).c}"></i><span class="grow">تیم ${fa(b.no)} · ${esc(b.hood)}</span><b>${fa(b.score)}</b> امتیاز</div>`).join('')}</div>` : '<p class="muted small">هنوز امتیازی این هفته ثبت نشده؛ اولین تیم باشید!</p>';
  $('.sheet-b').innerHTML = `<p class="note">${ic('shield')}در مسیر با هم فکر کنید؛ پاسخ را بعد از رسیدن ثبت کنید. راننده درگیر بازی نمی‌شود.</p>
    ${q ? `<div class="card stack"><span class="tag ac">سطح ${fa(q.level)}</span><p class="quiz-q">${esc(q.text)}</p>
      ${Q.done != null ? `<div class="${Q.done ? 'done' : 'hint warn'}"><b>${Q.done ? 'آفرین! درست بود.' : 'این بار نشد؛ فردا!'}</b><span>${esc(Q.why || '')}</span></div>` :
        q.type === 'mc' ? `<div class="stack">${q.choices.map((c, i) => `<button class="btn line" data-a="q-ans" data-v="${i}" data-q="${q.id}">${esc(c)}</button>`).join('')}</div>` :
        `<div class="row"><div class="field grow"><input id="qa" inputmode="numeric" placeholder="پاسخ عددی"></div><button class="btn ac" data-a="q-ans" data-q="${q.id}">ثبت</button></div>`}</div>` : '<p class="muted">معمای امروز آماده نیست.</p>'}
    <h3>جدول این هفته‌ی ${esc(placeName(p))}</h3>${board}
    <div class="card stack"><b>جایزه‌ی این فصل (به انتخاب خودتان)</b><div class="row"><div class="field grow"><input id="prize" value="${esc((T && T.team && T.team.prize) || '')}" placeholder="مثلاً: تیم‌های بازنده بستنی مهمان کنند 🍦"></div><button class="btn line sm" data-a="q-prize">ذخیره</button></div>
      <span class="muted small">قول دوستانه است؛ پولی از رسیدیم جابه‌جا نمی‌شود.</span></div>`;
}
function rulesHtml() {
  return `<div class="rules"><b>قوانین استفاده از رسیدیم</b>
    <h4>۱. رسیدیم چیست</h4>رسیدیم بستری برای آشنایی و هماهنگی خانواده‌ها، همکاران و هم‌دانشگاهی‌هاست. رسیدیم خدمات حمل‌ونقل ارائه نمی‌کند، راننده استخدام نمی‌کند و صلاحیت رانندگان را تأیید نمی‌کند.
    <h4>۲. مسئولیت‌ها</h4>هر راننده مسئول داشتن گواهینامه‌ی معتبر، بیمه‌ی خودرو و سرنشین، سلامت فنی خودرو و رعایت قوانین راهنمایی و رانندگی است. هر خانواده خودش هم‌تیمی‌ها را انتخاب و ارزیابی می‌کند و مسئولیت این انتخاب با خودش است.
    <h4>۳. ایمنی کودکان</h4>کمربند ایمنی برای همه، صندلی کودک طبق قانون، تحویل حضوری و ثبت «رسید» برای هر کودک. استفاده از تلفن همراه حین رانندگی ممنوع است.
    <h4>۴. قانون سن و جنسیت</h4>دختران بالای ۸ سال و پسران بالای ۱۲ سال با غیرهم‌جنس در یک سرویس قرار نمی‌گیرند؛ در مدرسه، مهد، آموزشگاه، باشگاه و ورزشگاه.
    <h4>۵. حریم خصوصی</h4>موقعیت خانه‌ها روی نقشه تقریبی است و نقطه‌ی دقیق فقط برای هم‌تیمی‌ها. شماره‌ی تماس فقط با اجازه‌ی شما نمایش داده می‌شود. نام کودکان فقط برای هم‌تیمی‌ها. داده‌ی فردی به تبلیغ‌دهندگان داده نمی‌شود.
    <h4>۶. حساب‌ها</h4>رسیدیم پول نگه نمی‌دارد؛ تسویه مستقیم بین خانواده‌هاست و فقط ثبت می‌شود. مبلغ پیشنهادی هر سفر توافقی است.
    <h4>۷. رفتار محترمانه</h4>احترام، وقت‌شناسی و اطلاع‌رسانی زودهنگام لازم است. مزاحمت، تبعیض یا سوءاستفاده باعث مسدود شدن حساب می‌شود؛ از «پشتیبانی» گزارش دهید.
    <h4>۸. محدودیت مسئولیت</h4>رسیدیم مسئول حوادث، خسارت‌ها، تأخیرها یا اختلافات میان کاربران نیست. استفاده از رسیدیم به معنای پذیرش این قوانین است.
    </div>`;
}

/* ═════════ wizard ═════════ */
const ART = {
  family: '<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="34" cy="28" r="9"/><circle cx="62" cy="28" r="9"/><path d="M18 74c0-12 7-22 16-22s16 10 16 22M46 74c0-12 7-22 16-22s16 10 16 22"/><path class="bob" d="M48 12c2-5 10-5 10 1 0 5-10 10-10 10S38 18 38 13c0-6 8-6 10-1Z" fill="#FF6B8B" stroke-width="2"/></svg>',
  kids: '<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="34" cy="36" r="9"/><path d="M34 46 24 70h20Z" fill="#FFD84D"/><circle cx="64" cy="40" r="8"/><path d="M64 49l-8 20h16Z" fill="#7FD8FF"/><path class="bob" d="M74 18l3 6 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1Z" fill="#1DBF73" stroke-width="2"/></svg>',
  home: '<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M16 48 44 24l28 24"/><path d="M24 44v30h40V44"/><rect x="38" y="56" width="12" height="18"/><path class="bob" d="M76 20c-6 0-10 4-10 10 0 8 10 16 10 16s10-8 10-16c0-6-4-10-10-10Z" fill="#1DBF73"/><circle cx="76" cy="30" r="3" fill="#fff"/></svg>',
  clock: '<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="48" cy="50" r="30"/><path d="M48 32v18l12 8"/><path class="bob" d="M20 20l10 8M76 20l-10 8" stroke="#1DBF73" stroke-width="4"/></svg>',
  wheel: '<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="40" cy="50" r="26"/><circle cx="40" cy="50" r="6"/><path d="M16 44c8 2 16 2 24 2s16 0 24-2M40 56v20"/><g class="bob"><circle cx="76" cy="26" r="13" fill="#FFD84D"/><path d="M76 19v14M80 22c-1-2-7-2-7 1s7 2 7 5-6 3-7 1" stroke-width="2"/></g></svg>',
  coin: '<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><rect x="14" y="30" width="58" height="40" rx="8"/><path d="M14 42h58"/><g class="bob"><circle cx="72" cy="66" r="14" fill="#1DBF73"/><path d="M72 58v16" stroke="#fff"/></g></svg>',
  heart: '<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path class="bob" d="M48 78S18 60 18 38a14 14 0 0 1 30-6 14 14 0 0 1 30 6c0 22-30 40-30 40Z" fill="#FFB3C4"/><path d="M36 44l8 8 16-16"/></svg>',
  phone: '<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><rect x="30" y="14" width="34" height="66" rx="8"/><path d="M42 70h10"/><g class="bob"><rect x="56" y="18" width="30" height="20" rx="8" fill="#1DBF73"/><path d="M63 28h2M70 28h2M77 28h2" stroke="#fff"/></g></svg>',
  shield: '<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M48 12 20 24v20c0 18 12 31 28 38 16-7 28-20 28-38V24Z" fill="#E6F9EF"/><path class="bob" d="m36 48 9 9 16-18" stroke="#1DBF73" stroke-width="5"/></svg>',
  party: '<svg class="wiz-art draw" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:130px;height:130px"><path d="M18 80 34 30l32 32Z" fill="#FFD84D"/><path d="M26 56l14 14M30 44l22 22"/><g class="bob"><path d="M62 18l2 6M78 26l-5 4M82 44h-6M56 34c4-6 10-6 12-2" stroke="#1DBF73" stroke-width="4"/><circle cx="70" cy="14" r="3" fill="#FF6B8B" stroke="none"/><circle cx="86" cy="34" r="3" fill="#4F8CFF" stroke="none"/></g></svg>'
};
function artCar(cls) { return `<svg class="${cls}" viewBox="0 0 200 110" fill="none" stroke="#04140B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 80V62c0-5 3-8 8-9l14-3 12-18c2-3 5-5 9-5h44c4 0 8 2 10 6l11 17 10 2c5 1 8 5 8 10v18Z" fill="#fff"/><path d="M52 50l10-15c1-2 3-2 4-2h16v17ZM90 33h12c2 0 4 1 5 3l9 14H90Z" fill="#BFF3D8"/><circle cx="52" cy="84" r="11" fill="#04140B"/><circle cx="128" cy="84" r="11" fill="#04140B"/><path d="M10 96h180"/></svg>`; }
function artTeam() { return `<svg width="120" height="90" viewBox="0 0 120 90" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" class="draw"><circle cx="30" cy="30" r="10"/><circle cx="60" cy="24" r="10"/><circle cx="90" cy="30" r="10"/><path d="M14 74c0-12 7-22 16-22s16 10 16 22M44 70c0-12 7-24 16-24s16 12 16 24M74 74c0-12 7-22 16-22s16 10 16 22"/><path class="bob" d="M50 6l3 5 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1Z" fill="var(--ac)" stroke-width="2"/></svg>`; }

const placeGender = w => (w.link && w.link.gender) || (w.place && w.place.gender) || null;
const wChild = w => { const k = KINDS[w.kind] || KINDS.other; if (w.d.forKids === 0) return false; return k.child ?? !!w.d.forKids; };
function wizSteps(w) {
  const all = [
    { key: 'place0', show: w => !!w.link && w.mode === 'new', art: () => kindIcWiz(w.link.kind), q: w => `«${esc(w.link.name)}» همان‌جایی است که می‌روید؟`, help: w => `${esc(w.link.city)}${w.link.shift ? ' · ' + esc(w.link.shift) : ''} · ورود ${clock(w.link.in)} · پایان ${clock(w.link.out)}`,
      body: w => `<div class="choices"><button class="choice" data-a="w-set" data-k="ok0" data-v="1" aria-pressed="${w.d.ok0 === 1}">بله، همین‌جاست ${ic('check')}</button><button class="choice" data-a="w-notthis">نه، جای دیگری است</button></div>`, ok: w => w.d.ok0 === 1 || 'اگر همین‌جاست «بله» را بزنید.' },
    { key: 'kind', show: () => true, art: w => kindIcWiz(w.kind || 'school'), q: w => w.link ? 'اسم این مسیرک چه باشد؟' : 'این مسیرک برای کجاست؟', help: w => w.kind === 'station' ? 'برگشت از ایستگاه قطار، فرودگاه یا ترمینال تا خانه؛ با هم‌سفرهای هم‌جنس که همان حدود می‌رسند و مقصدشان نزدیک شماست.' : 'برای هر جا یک مسیرک می‌سازید و با یک تپ بین‌شان جابه‌جا می‌شوید.' + (CFG.flags.paid_mode ? ' مسیرک اول مهمان ما هستید.' : ''),
      body: w => `${w.link ? '' : `<div class="kinds">${Object.entries(KINDS).filter(([k]) => k !== 'station' || CFG.flags.station_on).map(([k, v]) => `<button class="choice" data-a="w-kind" data-v="${k}" aria-pressed="${w.kind === k}">${kindIc(k, true)}${v.n}</button>`).join('')}</div>`}
        <div class="field"><label for="w-label">اسم مسیرک (به انتخاب خودتان)</label><input id="w-label" data-w="label" value="${esc(w.label || '')}" placeholder="${esc((KINDS[w.kind] || KINDS.school).lbl || 'مثلاً کلاس زبان بچه‌ها')}"></div>
        ${['other', 'school', 'kinder', 'institute', 'club'].includes(w.kind) ? `<span class="lbl">برای چه کسی؟</span><div class="chips"><button class="chip" data-a="w-set" data-k="forKids" data-v="1" aria-pressed="${w.d.forKids === 1 || (w.kind !== 'other' && w.d.forKids !== 0)}">برای فرزندانم</button><button class="chip" data-a="w-set" data-k="forKids" data-v="0" aria-pressed="${w.d.forKids === 0}">${['school', 'kinder'].includes(w.kind) ? 'برای خودم (کادر و کارکنان)' : 'برای خودم'}</button></div>${w.d.forKids === 0 && ['school', 'kinder'].includes(w.kind) ? `<p class="note">${ic('brief')}<span>این مسیرک مثل «محل کار» حساب می‌شود: با همکاران و هم‌مسیرهای بزرگسال جور می‌شوید.</span></p>` : ''}` : ''}`,
      ok: w => !w.kind ? 'یکی را انتخاب کنید.' : (w.kind === 'station' && !CFG.flags.station_on) ? 'مسیرک سفر فعلاً فعال نیست.' : (w.kind === 'other' && w.d.forKids == null) ? 'برای فرزندان است یا خودتان؟' : true },
    { key: 'family', show: () => true, art: () => ART.family, q: () => 'فامیل شریف‌تان؟', help: w => wChild(w) ? 'روی نقشه با نام خانوادگی دیده می‌شوید؛ مثل «خانواده آسمان».' : 'هم‌مسیرها شما را با «خانم/آقای» و نام خانوادگی می‌بینند.',
      body: w => `<div class="field"><label for="w-fam">نام خانوادگی</label><input id="w-fam" data-wd="family" value="${esc(w.d.family || '')}" placeholder="مثلاً آسمان" autocomplete="family-name"></div>
        <span class="lbl">${wChild(w) ? 'نسبت شما با بچه‌ها؟' : 'خانم هستید یا آقا؟'}</span><div class="choices two"><button class="choice col" data-a="w-rel" data-v="${wChild(w) ? 'mother' : 'f'}" aria-pressed="${wChild(w) ? w.d.rel === 'mother' : (w.d.pg === 'f')}">${ic('woman', 'emo')}${wChild(w) ? 'مادر' : 'خانم'}</button><button class="choice col" data-a="w-rel" data-v="${wChild(w) ? 'father' : 'm'}" aria-pressed="${wChild(w) ? w.d.rel === 'father' : (w.d.pg === 'm')}">${ic('man', 'emo')}${wChild(w) ? 'پدر' : 'آقا'}</button></div>
        ${wChild(w) ? `<div class="chips">${['grandpa', 'grandma'].map(k => `<button class="chip" data-a="w-rel" data-v="${k}" aria-pressed="${w.d.rel === k}">${REL[k][0]}</button>`).join('')}</div>${w.moreRel || ['forDad', 'forMom', 'brother', 'sister'].includes(w.d.rel) ? `<div class="chips">${['forDad', 'forMom', 'brother', 'sister'].map(k => `<button class="chip" data-a="w-rel" data-v="${k}" aria-pressed="${w.d.rel === k}">${REL[k][0]}</button>`).join('')}</div><p class="note">${ic('check')}برای هماهنگی و قاعده‌ی راننده‌ی هم‌جنس، کسی حساب می‌شود که بچه‌ها را می‌برد.</p>` : `<button class="link" data-a="w-morerel">کس دیگری فرم را پر می‌کند؟</button>`}` : ''}
        <span class="lbl">کمی بیشتر از خودتان (اختیاری)</span><div class="chips tagchips">${JOBS.map(([k, v]) => `<button class="chip tag-b" data-a="w-job" data-v="${k}" aria-pressed="${w.d.job === k}">${v}</button>`).join('')}<button class="chip tag-b" data-a="w-relig" aria-pressed="${!!w.d.relig}">${w.kind === 'station' || !wChild(w) ? 'مذهبی هستم' : 'مذهبی هستیم'}</button></div>
        <p class="muted small">برای جور شدن با کسانی که همین را ترجیح می‌دهند؛ هر وقت خواستید بردارید.</p>
        ${w.kind === 'station' ? `<p class="note">${ic('shield')}در مسیرک سفر فقط خانم‌ها با خانم‌ها و آقایان با آقایان هم‌سفر می‌شوند.</p>` : ''}`,
      ok: w => (w.d.family || '').trim().length < 2 ? 'نام خانوادگی را بنویسید.' : !w.d.pg ? 'یکی را انتخاب کنید.' : (wChild(w) && !w.d.rel) ? 'یکی را انتخاب کنید.' : true },
    { key: 'kids', show: w => wChild(w), art: () => ART.kids, q: w => (w.d.kids || []).length > 1 ? 'فرزندان گل‌تان؟' : 'فرزند گل‌تان؟', help: () => 'اسم کوچک کنار فامیل نوشته می‌شود و فقط هم‌تیمی‌ها می‌بینند. سال تولد برای قانون سن و جنسیت و سطح بازی‌هاست.',
      body: w => { const g = placeGender(w); const years = Array.from({ length: 18 }, (_, i) => JY - 2 - i); return `<div class="stepper"><span class="lbl grow">تعداد</span><button class="btn line" data-a="w-count" data-v="-1" aria-label="کمتر">−</button><output>${fa((w.d.kids || []).length)}</output><button class="btn line" data-a="w-count" data-v="1" aria-label="بیشتر">+</button></div>
        ${(w.d.kids || []).map((k, i) => `<div class="kidcard"><div class="field"><label for="w-k${i}">اسم فرزند ${fa(i + 1)}</label><input id="w-k${i}" data-wk="${i}" data-f="first" value="${esc(k.first || '')}" placeholder="نام کوچک"></div>
          ${g === 'f' || g === 'm' ? '' : `<div class="chips"><button class="chip" data-a="w-kid" data-i="${i}" data-f="g" data-v="f" aria-pressed="${k.g === 'f'}">دختر</button><button class="chip" data-a="w-kid" data-i="${i}" data-f="g" data-v="m" aria-pressed="${k.g === 'm'}">پسر</button></div>`}
          <div class="field"><label for="w-by${i}">سال تولد</label><select id="w-by${i}" data-wk="${i}" data-f="by"><option value="">انتخاب کنید</option>${years.map(y => `<option value="${y}" ${+k.by === y ? 'selected' : ''}>${fa(y)} (${fa(JY - y)} ساله)</option>`).join('')}</select></div></div>`).join('')}
        ${g === 'f' || g === 'm' ? `<p class="note">${ic('check')}اینجا ${g === 'f' ? 'دخترانه' : 'پسرانه'} است؛ جنسیت را نمی‌پرسیم.</p>` : ''}`; },
      ok: w => { const ks = w.d.kids || [], g = placeGender(w); if (!ks.length) return 'دست‌کم یک فرزند.'; if (ks.some(k => !(k.first || '').trim())) return 'اسم همه را بنویسید.'; if (!(g === 'f' || g === 'm') && ks.some(k => !k.g)) return 'دختر یا پسر بودن را انتخاب کنید.'; if (ks.some(k => !k.by)) return 'سال تولد را انتخاب کنید.'; return true; } },
    { key: 'home', show: () => true, art: () => ART.home, q: w => w.kind === 'station' ? 'از آنجا کجا می‌روید؟' : 'کجا زندگی می‌کنید؟', help: w => w.kind === 'station' ? 'خانه یا هر جایی که می‌روید. هم‌سفرهایی پیدا می‌شوند که مقصدشان تا ۸ کیلومتری شماست.' : 'نقشه را جابه‌جا کنید تا پین روی در خانه بنشیند. روی نقشه‌ی دیگران موقعیت شما تقریبی (حدود ۱۵۰ متر) دیده می‌شود.',
      body: w => `<div class="loc-card ${w.d.lat ? 'set' : ''}">${ic(w.d.lat ? 'check' : 'pin')}<span id="w-addr">${w.d.lat ? (w.addr ? esc(w.addr) : 'موقعیت خانه ثبت شد') : 'هنوز موقعیتی ثبت نشده'}</span></div>
        <div class="choices two"><button class="choice col" data-a="w-locate">${ic('locate', 'emo')}موقعیت فعلی من<small>اگر الان خانه هستید</small></button><button class="choice col" data-a="w-mapick" data-t="home">${ic('map', 'emo')}انتخاب روی نقشه<small>پین را روی در خانه بگذارید</small></button></div>
        <div class="field"><label for="w-hood">نام محله</label><input id="w-hood" data-wd="hood" value="${esc(w.d.hood || '')}" placeholder="مثلاً نارون"></div>
        <details><summary class="small" style="cursor:pointer;font-weight:700">راه دیگر: چسباندن لینک موقعیت از نشان، بلد یا گوگل</summary><div class="row" style="margin-top:8px"><div class="field grow"><input id="w-paste" dir="ltr" placeholder="لینک یا مختصات"></div><button class="btn sm" data-a="w-paste">ثبت</button></div></details>`,
      ok: w => !w.d.lat ? 'موقعیت خانه را با «موقعیت فعلی من» یا «انتخاب روی نقشه» ثبت کنید.' : !(w.d.hood || '').trim() ? 'نام محله را بنویسید.' : true },
    { key: 'needs', show: w => w.kind !== 'station', art: () => ART.clock, q: () => 'کدام مسیرها را لازم دارید؟', help: w => w.link || w.place ? `ساعت‌ها: شروع ${clock((w.link || w.place).in)} و پایان ${clock((w.link || w.place).out)}.` : 'ساعت‌ها را بعداً از مکان می‌خوانیم.',
      body: w => `<div class="choices">${[['both', 'هر دو؛ رفت و برگشت'], ['out', 'فقط رفت'], ['back', 'فقط برگشت']].map(([k, v]) => `<button class="choice" data-a="w-needs" data-v="${k}" aria-pressed="${needKey(w.d) === k}">${v}</button>`).join('')}</div>
        ${isRot(w.link || w.place || w.newPlace) ? `<span class="lbl">شیفت چرخشی است؛ این هفته کدام است؟</span><div class="choices two">${[['am', 'این هفته صبح'], ['pm', 'این هفته عصر']].map(([k, v]) => `<button class="choice col" data-a="w-rot" data-v="${k}" aria-pressed="${w.d.rot_par != null && rotNow(w.d) === k}">${v}</button>`).join('')}</div><p class="note">${ic('check')}فقط با خانواده‌هایی هم‌تیم می‌شوید که هفته‌هایشان با شما یکی است.</p>` : ''}`,
      ok: w => isRot(w.link || w.place || w.newPlace) && w.d.rot_par == null ? 'بگویید این هفته صبح است یا عصر.' : true },
    { key: 'role', show: () => true, art: () => ART.wheel, q: w => w.kind === 'station' ? 'ماشین دارید یا دنبال جای خالی هستید؟' : 'سهم شما در سرویس؟', help: w => w.kind === 'station' ? 'اگر جا دارید، هم‌سفرهای هم‌مسیر را ببرید؛ رایگان یا با سهم هزینه. اگر ماشین ندارید، جای خالی پیدا می‌کنیم.' : 'تیمی که راننده نداشته باشد راه نمی‌افتد؛ حتی یک روز در هفته رانندگی کمک بزرگی است.',
      body: w => w.kind === 'station' ? tripRole(w) : `<div class="choices">${[['drive', 'wheel', 'رانندگی می‌کنم', 'روزهایی که بتوانم می‌برم'], ['pay', 'coin', 'فقط هزینه می‌دهم', 'سهم منصفانه‌ی هر سفر را می‌دهم'], ['both', 'wheel', 'هر دو', 'گاهی می‌برم، گاهی هزینه می‌دهم']].map(([k, i, t, s]) => `<button class="choice" data-a="w-set" data-k="role" data-v="${k}" aria-pressed="${w.d.role === k}"><span class="emo-pair">${ic(i, 'emo')}${k === 'both' ? ic('coin', 'emo') : ''}</span><span>${t}<small>${s}</small></span></button>`).join('')}</div>
        ${w.d.role === 'drive' ? `<label class="check daily"><input type="checkbox" data-a="w-daily" ${w.d.daily ? 'checked' : ''}><span><b>هر روز خودم می‌برم</b><small>خانواده‌ام (و شاید همسرم تا محل کارش) را هر روز می‌رسانم و جای خالی‌ام را به هم‌مسیرها می‌دهم.</small></span></label>` : ''}
        ${w.d.role && w.d.role !== 'pay' ? `<span class="lbl">کدام روزها می‌توانید ببرید؟</span><div class="chips">${[0, 1, 2, 3, 4, 5].map(d => `<button class="chip" data-a="w-day" data-v="${d}" aria-pressed="${(w.d.days || []).includes(d)}">${DAYS[d]}</button>`).join('')}</div>
        <div class="stepper"><span class="lbl grow">صندلی خالی برای ${wChild(w) ? 'بچه‌ها' : 'هم‌مسیرها'}</span><button class="btn line" data-a="w-seats" data-v="-1" aria-label="کمتر">−</button><output>${fa(w.d.seats || 3)}</output><button class="btn line" data-a="w-seats" data-v="1" aria-label="بیشتر">+</button></div>` : ''}`,
      ok: w => !w.d.role ? 'یکی را انتخاب کنید.' : (w.kind !== 'station' && w.d.role !== 'pay' && !(w.d.days || []).length) ? 'دست‌کم یک روز را انتخاب کنید.' : true },
    { key: 'values', show: w => w.kind !== 'station', art: () => ART.heart, q: () => 'چه چیزهایی برایتان مهم است؟', help: () => 'محترم‌اند و دلیل نمی‌خواهند. در پیشنهاد هم‌مسیر و یادآوری به راننده رعایت می‌شوند. اختیاری است.',
      body: w => `<div class="chips">${Object.entries(VALUES).filter(([k]) => wChild(w) || (k !== 'samegender' && k !== 'parent')).map(([k, v]) => `<button class="chip" data-a="w-val" data-v="${k}" aria-pressed="${(w.d.values || []).includes(k)}">${v}</button>`).join('')}</div>
        <span class="lbl">سوار شدن</span><div class="choices">${Object.entries(PICKUP).map(([k, v]) => `<button class="choice" data-a="w-set" data-k="pickup" data-v="${k}" aria-pressed="${w.d.pickup === k}">${ic(k === 'door' ? 'pin' : 'team', 'emo')}${v}</button>`).join('')}</div>`, ok: () => true },
    { key: 'place', show: w => !w.link, art: w => kindIcWiz(w.kind), q: w => w.kind === 'station' ? 'از کدام ایستگاه، فرودگاه یا ترمینال برمی‌گردید؟' : `کدام ${(KINDS[w.kind] || KINDS.other).n}؟`, help: () => 'از نزدیک‌ترین‌ها به خانه‌ی شما. اگر نیست، ثبتش کنید تا لینک و پوسترش ساخته شود.',
      body: w => placeStep(w), mount: w => { if (!w.near) loadNear(w); },
      ok: w => { if (w.place) return true; const n = w.newPlace; if (!n) return 'یک مورد را انتخاب کنید یا مکان تازه ثبت کنید.'; if ((n.name || '').trim().length < 3) return 'نام را بنویسید.'; if (wChild(w) && w.kind !== 'station' && !n.gender) return 'دخترانه، پسرانه یا دختر و پسر؟'; if (!n.lat) return 'موقعیت در ورودی را ثبت کنید.'; if (n.dups && n.dups.length && !n.dupOk) return 'بگویید همین است یا جای دیگری.'; return true; } },
    { key: 'trip', show: w => w.kind === 'station', art: () => ART.clock, q: () => 'کی می‌رسید؟', help: () => 'هم‌سفرهایی پیشنهاد می‌شوند که حداکثر یک ساعت قبل یا بعد از شما برسند.',
      body: w => { const [dd, tt] = (w.d.arrive || '').split('T'); return `<span class="lbl">روز رسیدن</span><div class="chips">${[0, 1, 2, 3, 4, 5, 6].map(i => { const k = isoDay(i); return `<button class="chip" data-a="w-arrday" data-v="${k}" aria-pressed="${dd === k}">${i === 0 ? 'امروز' : i === 1 ? 'فردا' : faDay(k)}</button>`; }).join('')}</div>
        <div class="field"><label for="w-arrt">ساعت تقریبی رسیدن</label><input id="w-arrt" type="time" data-arrt="1" value="${tt || ''}"></div>
        <div class="field"><label for="w-tno">شماره‌ی قطار، پرواز یا اتوبوس (اختیاری)</label><input id="w-tno" data-wd="tripno" value="${esc(w.d.tripno || '')}" placeholder="مثلاً قطار ۳۴۱"></div>
        <p class="note">${ic('bell')}اگر تأخیر داشتید، در گفتگوی هم‌سفرها خبر بدهید.</p>`; },
      ok: w => !/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(w.d.arrive || '') ? 'روز و ساعت رسیدن را انتخاب کنید.' : true },
    { key: 'snapp', show: w => !(w.kind === 'station' && w.d.role !== 'pay' && w.d.free_ride), art: () => ART.coin, q: () => 'یک مسیر با اسنپ حدوداً چقدر می‌شود؟', help: () => 'سهم منصفانه‌ی هر سفر، ۶۰٪ میانگین برآورد اعضای تیم پیشنهاد می‌شود. عددی که بنویسید مبنا می‌شود.',
      body: w => { const tgt = w.link || w.place || w.newPlace; const r = w.route; return `${r ? `<p class="hint">${ic('car')}<span>از خانه تا ${esc(tgt ? tgt.name : 'مقصد')}: حدود <b>${km1(r.m / 1000)} کیلومتر</b> مسیر و ${mins(r.s)} دقیقه${r.src === 'road' ? '' : ' (تقریبی)'}.</span></p>` : ''}
        <span class="lbl">برای دیدن قیمت در اسنپ: الان کجایید؟</span><div class="chips"><button class="chip" data-a="w-snapp" data-v="home">کنار خانه</button><button class="chip" data-a="w-snapp" data-v="dest">کنار ${esc(destWord({ kind: w.kind }))}</button></div>
        <p class="note">${ic('copy')}نشانی طرف مقابل کپی می‌شود و اسنپ باز می‌شود؛ مقصد را بچسبانید، قیمت را ببینید و برگردید.</p>
        <div class="field"><label for="w-snapp">مبلغ یک مسیر (تومان)</label><input id="w-snapp" data-wd="snapp" inputmode="numeric" value="${w.d.snapp ? fa(w.d.snapp) : ''}" placeholder="${r ? fa(r.est || estSnapp(r.m)) : 'مثلاً ۹۰٬۰۰۰'}"></div>
        ${r ? `<div class="note">${ic('spark')}<span>برآورد ما: <b>${money(r.est || estSnapp(r.m))}</b> — ${r.est_src === 'crowd' ? `از روی پاسخ ${fa(r.est_n)} خانواده در همین شهر.` : 'حدس اولیه از روی فاصله (۴۵ هزار تومان پایه + ۱۸ هزار به ازای هر کیلومتر). قیمت واقعی اسنپ دقیق‌تر است؛ عدد خودتان مبنا می‌شود.'}</span></div>${!w.d.snapp ? `<button class="link" data-a="w-est">از همین برآورد استفاده کن</button>` : ''}` : ''}`; },
      mount: w => routeFor(w), ok: w => +en(w.d.snapp) >= 10000 || 'یک عدد تقریبی بنویسید؛ مثلاً ۹۰٬۰۰۰.' },
    { key: 'rules', show: () => true, art: () => ART.shield, q: () => 'قول و قرار ما', help: () => 'کوتاه است؛ برای خیال راحت همه.',
      body: w => `<div class="rules-wrap">${rulesHtml()}<button class="rules-x" data-a="rules-full" aria-label="نمایش بزرگ قوانین">${ic('expand')}<span>بزرگ‌تر</span></button></div><label class="check" style="background:transparent"><input type="checkbox" data-a="w-rules" ${w.d.rules_at ? 'checked' : ''}>قوانین را خواندم و می‌پذیرم</label>
        ${S.token ? contactHtml(w) : ''}`,
      ok: w => !w.d.rules_at ? 'برای ادامه، قوانین را بپذیرید.' : (S.token && !w.d.contact) ? 'روش ارتباط را انتخاب کنید.' : true },
    { key: 'phone', show: () => !S.token, art: () => ART.phone, q: () => 'شماره همراه‌تان؟', help: () => 'کد تأیید پیامک می‌شود. با همین شماره همه‌ی مسیرک‌هایتان در یک حساب می‌ماند.',
      body: w => `<div class="field"><label for="w-ph">شماره همراه</label><input id="w-ph" data-w="phone" type="tel" inputmode="tel" dir="ltr" value="${esc(w.phone || '')}" placeholder="0912 123 4567" autocomplete="tel"></div>
        <p class="note">${ic('check')}با ۰۹، ‎+98، ۰۰۹۸ یا بدون صفر؛ با رقم فارسی یا انگلیسی؛ هر طور راحتید.</p>
        ${contactHtml(w)}
        ${w.smsFail ? `<div class="hint warn" style="display:grid;gap:10px">${ic('warn')}<b>پیامک کد نرسید؛ مشکل از سمت ماست، نه شما.</b><span class="small">${w.smsFail.pcode ? 'کد خطای سرویس: ' + fa(w.smsFail.pcode) + ' · ' : ''}یکی از این راه‌ها را بزنید:</span>
          <div class="choices"><button class="choice" data-a="w-resend">${ic('phone', 'emo')}دوباره با پیامک</button>${CFG.flags.otp_bale ? `<button class="choice" data-a="w-bale">${ic('chat', 'emo')}<span>کد را در بله بگیرم<small>اگر بله دارید؛ سریع و بی‌دردسر</small></span></button>` : ''}${CFG.flags.sms_direct ? '' : `<button class="choice" data-a="w-call">${ic('bell', 'emo')}کد را با تماس صوتی بگیرم</button>`}<button class="choice" data-a="w-guest">${ic('back', 'emo')}<span>فعلاً بدون شماره ادامه می‌دهم<small>بعداً از منو تأیید می‌کنید؛ تا آن موقع شماره‌ی دیگران را نمی‌بینید و کنار نام‌تان «تأییدنشده» می‌آید.</small></span></button></div></div>` : ''}
        ${w.otpSent ? `<div class="field"><label for="w-otp">کد تأیید</label><input id="w-otp" class="otp" data-w="otp" inputmode="numeric" maxlength="6" autocomplete="one-time-code" value="${esc(w.otp || '')}"></div>${w.devCode ? `<p class="note">${ic('flask')}سرویس پیامک هنوز فعال نیست؛ کد آزمایشی: <b dir="ltr">${fa(w.devCode)}</b></p>` : `<p class="note">کد را ${w.channel === 'call' ? 'با تماس صوتی گفتیم' : w.channel === 'bale' ? 'در اپ بله فرستادیم' : 'پیامک کردیم'}.</p>`}<div class="row wrap"><button class="link" data-a="w-resend">ارسال دوباره</button>${CFG.flags.sms_direct ? '' : '<button class="link" data-a="w-call">تماس صوتی</button>'}${CFG.flags.otp_bale ? '<button class="link" data-a="w-bale">در بله بفرست</button>' : ''}<button class="link" data-a="w-guest">بدون شماره ادامه می‌دهم</button></div>` : (w.smsFail ? '' : '<button class="link" data-a="w-guest">فعلاً بدون شماره ادامه می‌دهم</button>')}`,
      ok: w => !normPhone(w.phone) ? 'شماره را درست بنویسید؛ مثلاً ۰۹۱۲۱۲۳۴۵۶۷.' : !w.d.contact ? 'روش ارتباط را انتخاب کنید.' : !w.otpSent ? 'otp-send' : (en(w.otp || '').length < 4 ? 'کد را وارد کنید.' : 'otp-verify') }
  ];
  return all.filter(s => s.show(w));
}
function tripRole(w) {
  const r = w.d.role, cardOk = !w.d.card || en(w.d.card).replace(/\D/g, '').length === 16;
  return `<div class="choices">${[['drive', 'wheel', 'ماشین دارم و جای خالی دارم', 'یا کسی دنبالم می‌آید و جا هست'], ['pay', 'team', 'دنبال جای خالی هستم', 'سهم هزینه را می‌دهم']].map(([k, i, t, sub]) => `<button class="choice" data-a="w-set" data-k="role" data-v="${k}" aria-pressed="${r === k}">${ic(i, 'emo')}<span>${t}<small>${sub}</small></span></button>`).join('')}</div>
  ${r === 'drive' ? `<div class="stepper"><span class="lbl grow">صندلی خالی</span><button class="btn line" data-a="w-seats" data-v="-1" aria-label="کمتر">−</button><output>${fa(w.d.seats || 3)}</output><button class="btn line" data-a="w-seats" data-v="1" aria-label="بیشتر">+</button></div>
    <label class="check"><input type="checkbox" data-a="w-free" ${w.d.free_ride ? 'checked' : ''}>رایگان می‌برم؛ مهمان من باشند ${ic('heart')}</label>
    ${w.d.free_ride ? `<p class="note">${ic('spark')}دمتان گرم! سفر رایگانِ شما برای خودتان هم رایگان است و جزو سهمیه حساب نمی‌شود.</p>` : `<div class="field"><label for="w-card">شماره کارت برای واریز سهم هم‌سفرها (اختیاری)</label><input id="w-card" data-wd="card" inputmode="numeric" dir="ltr" maxlength="23" value="${esc(w.d.card || '')}" placeholder="6037 9900 0000 0000"></div>
    <p class="note">${ic('shield')}فقط هم‌سفرهای همین مسیرک، بعد از هم‌تیم شدن، شماره کارت را می‌بینند.${cardOk ? '' : ' <b style="color:var(--warn)">شماره کارت ۱۶ رقم است.</b>'}</p>`}` : ''}`;
}
const kindIcWiz = k => `<div style="margin-top:8px">${kindIc(k, true)}</div>`;
const isoDay = i => { const t = new Date(Date.now() + i * 864e5); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); };
const faDay = k => { try { return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(k + 'T12:00')); } catch (e) { return k; } };
const tripWhen = d => { if (!d || !d.arrive) return ''; const [k, t] = d.arrive.split('T'); return (k === isoDay(0) ? 'امروز' : k === isoDay(1) ? 'فردا' : faDay(k)) + ' ساعت ' + fa(t); };
const needKey = d => { const n = d.needs || { out: true, back: true }; return n.out && n.back ? 'both' : n.out ? 'out' : 'back'; };
const estSnapp = m => Math.round((45000 + 18 * m) / 5000) * 5000;
function placeStep(w) {
  const near = w.near, n = w.newPlace, K = KINDS[w.kind] || KINDS.other;
  if (n) return `<div class="field"><label for="w-pn">نام ${esc(K.pn || K.n)}</label><input id="w-pn" data-wp="name" value="${esc(n.name || '')}" placeholder="مثلاً ${w.kind === 'station' ? 'راه‌آهن مشهد' : w.kind === 'institute' ? 'آموزشگاه زبان ستاره' : 'دبستان مهر'}"></div>
    <div class="field"><label for="w-pc">شهر</label><select id="w-pc" data-wp="city">${CITIES.map(c => `<option ${n.city === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
    ${w.kind === 'station' ? '' : wChild(w) ? `<span class="lbl">پذیرش</span><div class="chips">${[['f', 'دخترانه'], ['m', 'پسرانه'], ['fm', 'دختر و پسر']].map(([k, v]) => `<button class="chip" data-a="w-np" data-k="gender" data-v="${k}" aria-pressed="${n.gender === k}">${v}</button>`).join('')}</div>
      ${n.gender === 'fm' ? `<div class="chips">${['هم‌زمان', 'در شیفت‌های جدا'].map(v => `<button class="chip" data-a="w-np" data-k="mix" data-v="${v}" aria-pressed="${n.mix === v}">${v}</button>`).join('')}</div>` : ''}` : ''}
    ${w.kind === 'station' ? '' : `<span class="lbl">شیفت یا واحد</span><div class="chips">${['صبح', 'عصر', 'چرخشی', 'شیفتی نیست'].map(v => `<button class="chip" data-a="w-np" data-k="shift" data-v="${v}" aria-pressed="${n.shift === v}">${v === 'چرخشی' ? 'چرخشی (هفته‌ای صبح، هفته‌ای عصر)' : v}</button>`).join('')}</div>
    ${n.shift === 'چرخشی' ? '<span class="lbl">ساعت هفته‌های صبح</span>' : ''}<div class="row"><div class="field grow"><label for="w-pin">${wChild(w) ? 'زنگ ورود (باید آنجا باشند)' : 'ساعت شروع (باید آنجا باشید)'}</label><input id="w-pin" type="time" data-wp="in" value="${n.in || '07:30'}"></div><div class="field grow"><label for="w-pout">${wChild(w) ? 'زنگ تعطیلی (دنبالشان می‌رویم)' : 'ساعت پایان (برگشت)'}</label><input id="w-pout" type="time" data-wp="out" value="${n.out || '13:30'}"></div></div>
    <p class="note small">${ic('clock2')}<span>رفت را طوری می‌چینیم که پیش از ساعت اول برسید؛ برگشت از ساعت دوم شروع می‌شود.</span></p>
    ${n.shift === 'چرخشی' ? `<span class="lbl">ساعت هفته‌های عصر</span><div class="row"><div class="field grow"><label for="w-pin2">ورود</label><input id="w-pin2" type="time" data-wp="in2" value="${n.in2 || '13:30'}"></div><div class="field grow"><label for="w-pout2">تعطیلی</label><input id="w-pout2" type="time" data-wp="out2" value="${n.out2 || '18:00'}"></div></div>` : ''}`}
    <span class="lbl">موقعیت در ورودی</span><div class="loc-card ${n.lat ? 'set' : ''}" id="pick-place">${ic(n.lat ? 'check' : 'pin')}<span>${n.lat ? 'موقعیت ثبت شد' : 'هنوز موقعیتی ثبت نشده'}</span></div>
    <div class="choices two"><button class="choice col" data-a="w-np-here">${ic('locate', 'emo')}کنار در ورودی هستم<small>موقعیت فعلی</small></button><button class="choice col" data-a="w-mapick" data-t="place">${ic('map', 'emo')}انتخاب روی نقشه<small>پین روی در ورودی</small></button></div>
    <details><summary class="small" style="cursor:pointer;font-weight:700">راه دیگر: چسباندن لینک موقعیت</summary><div class="row" style="margin-top:8px"><div class="field grow"><input id="w-np-paste" dir="ltr" placeholder="لینک یا مختصات"></div><button class="btn sm" data-a="w-np-paste">ثبت</button></div></details>
    ${(n.dups || []).map(d => `<div class="hint warn">${ic('warn')}<span>احتمالاً «${esc(d.name)}${d.shift ? ' · ' + esc(d.shift) : ''}» همین‌جا ثبت شده.<br><span class="row wrap" style="margin-top:8px"><button class="btn sm" data-a="w-pick" data-id="${d.id}">همین است</button><button class="btn line sm" data-a="w-dupok">نه، واحد یا شیفت دیگری است</button></span></span></div>`).join('')}
    <button class="link" data-a="w-np-cancel">بازگشت به فهرست</button>`;
  return `<button class="map-entry" data-a="w-px">${ic('map')}<span class="grow"><b>پیدا کردن روی نقشه</b><small>${esc(K.pn || K.n)}‌های اطراف را روی نقشه ببینید و انتخاب کنید</small></span>${ic('back')}</button>
    <div class="field"><label for="w-q">جستجو</label><input id="w-q" data-w="pq" value="${esc(w.pq || '')}" placeholder="نام ${esc(K.pn || K.n)}" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="search"></div>
    <div id="w-near">${nearList(w, K)}</div>`;
}
function nearList(w, K) { const near = w.near;
  return `${!near ? '<p class="muted">در حال پیدا کردن نزدیک‌ترین‌ها…</p>' : near.slice(0, w.nearAll || w.pq ? 30 : 6).map(pl => `<div class="popt-row ${pl.flags ? 'flagged' : ''}"><button class="place-opt" data-a="w-pick" data-id="${pl.id}" aria-pressed="${w.place && w.place.id === pl.id}">${kindIc(pl.kind, false, false)}<span class="grow">${esc(pl.name)}${pl.nv ? ` <span class="nv" title="${esc(pl.nv_title)}">${ic('check')}نشان</span>` : ''}<small>${esc(pl.city)}${pl.shift ? ' · ' + esc(pl.shift) : ''} · ${km1(pl.d / 1000)} کیلومتر · ${fa(pl.families)} خانواده${pl.flags ? ' · یک نفر گفته اشتباه است' : ''}</small></span></button>${pl.verified || pl.nv || pl.families ? '' : `<button class="icon-btn rep" data-a="w-report" data-id="${pl.id}" aria-label="گزارش مکان اشتباه یا آزمایشی">${ic('flag')}</button>`}</div>`).join('') || '<p class="muted">نزدیک شما چیزی ثبت نشده؛ اولین نفر باشید!</p>'}
    ${near && near.length > 6 && !w.nearAll && !w.pq ? `<button class="link" data-a="w-nearall">${fa(near.length - 6)} مورد دیگر هم نزدیک شماست؛ نمایش همه</button>` : ''}
    <div class="row wrap"><button class="btn line sm grow" data-a="w-np-new">${ic('plus')}ثبت ${esc(K.pn || K.n)} تازه</button>${near && near.length > 6 ? `<button class="btn line sm grow" data-a="w-nearmap">${ic('map')}${w.nearAt ? 'جای دیگری روی نقشه' : 'پیدا کردن با نقشه'}</button>` : ''}</div>`;
}
async function loadNear(w) { try { const at = w.nearAt || [w.d.lat, w.d.lng]; const r = await api('place_near', { lat: at[0], lng: at[1], kind: w.kind === 'other' ? '' : w.kind, q: w.pq || '' }); w.near = r.places; } catch (e) { w.near = []; } if (ui.wiz !== w) return; const box = $('#w-near'); if (box) box.innerHTML = nearList(w, KINDS[w.kind] || KINDS.other); else wizRender(); }
async function checkDup(w) { try { const r = await api('place_near', { lat: w.newPlace.lat, lng: w.newPlace.lng }); const d = r.places.filter(x => x.d < 250); const had = (w.newPlace.dups || []).length; w.newPlace.dups = d; if (d.length !== had && ui.wiz === w) wizRender(); } catch (e) {} }
async function routeFor(w) { const t = w.link || w.place || w.newPlace; if (!t || !t.lat || !w.d.lat || (w.route && w.route.key === t.lat + ',' + w.d.lat)) return; try { const r = await api('route', { a: [w.d.lat, w.d.lng], b: [t.lat, t.lng], city: t.city || '' }); w.route = { ...r, key: t.lat + ',' + w.d.lat }; } catch (e) { const m = hav(w.d.lat, w.d.lng, t.lat, t.lng) * 1.3; w.route = { m, s: m / 6.5, src: 'est', key: t.lat + ',' + w.d.lat }; } if (ui.wiz === w) wizRender(); }
let revT; function reverseFill(w) { clearTimeout(revT); revT = setTimeout(async () => { try { const r = await api('reverse', { lat: w.d.lat, lng: w.d.lng }); if (r.address) { w.addr = r.address; const a = $('#w-addr'); if (a) a.textContent = r.address; } if (r.hood && (!w.d.hood || w.autoHood)) { w.d.hood = r.hood; w.autoHood = true; const h = $('#w-hood'); if (h) h.value = r.hood; } else { const a = $('#w-addr'); if (a && !r.address) a.textContent = 'موقعیت انتخاب شد'; } } catch (e) { const a = $('#w-addr'); if (a) a.textContent = 'موقعیت انتخاب شد'; } }, 650); }

function wizOpen(p, opts = {}) {
  closeLayer();
  const base = p ? JSON.parse(JSON.stringify(p)) : null;
  const w = { pid: p ? p.id : null, mode: opts.mode || 'new', kind: base ? base.kind : (opts.kind || (opts.link ? opts.link.kind : null)), label: base ? base.label : '', d: base ? (base.data || {}) : { kids: [], needs: { out: true, back: true }, seats: 3, values: [], phone_show: false },
    place: base ? base.place : null, link: opts.link || null, newPlace: base && base.placeDraft ? base.placeDraft : null, err: '', step: 0, busy: false };
  if (!w.label && w.kind) w.label = (KINDS[w.kind] || KINDS.other).lbl;
  if (w.link && !w.label) w.label = w.link.name;
  if (w.link) w.kind = w.link.kind;
  if (!w.d.kids) w.d.kids = [];
  if (wChild(w) && !w.d.kids.length) w.d.kids = [{ id: uid(), first: '', g: '', by: '' }];
  { const g = placeGender(w); if (g === 'f' || g === 'm') w.d.kids.forEach(k => k.g = g); }
  const steps = wizSteps(w);
  if (opts.at) w.step = Math.max(0, steps.findIndex(s => s.key === opts.at));
  else if (w.mode === 'resume' && p) { const mk = missingStep(p); const mi = Math.max(0, steps.findIndex(s => s.key === mk)); w.step = Math.min(steps.length - 1, Math.max(mi, +p.step || 0)); }
  ui.wiz = w; wizRender();
  if (w.mode === 'resume' && w.step > 0) toast(`از گام ${fa(w.step + 1)} ادامه می‌دهیم؛ پاسخ‌های قبلی سر جایشان است.`);
  if (w.mode === 'review') toast('حالت مرور: با «بعدی» سریع جلو بروید؛ هر تغییری ذخیره می‌شود.');
}
function wizRender() {
  const w = ui.wiz; if (!w) { $('#wiz-root').innerHTML = ''; return; }
  if (w.done) { $('#wiz-root').innerHTML = wizDone(w); return; }
  const steps = wizSteps(w); if (w.step >= steps.length) w.step = steps.length - 1;
  const st = steps[w.step], total = steps.length;
  const ae = document.activeElement, root = $('#wiz-root'), same = w._shown === st.key;
  const sel = ae && root.contains(ae) ? (ae.id ? '#' + ae.id : ['a', 'k', 'v', 'i', 'f'].filter(k => ae.dataset[k] != null).map(k => `[data-${k}="${ae.dataset[k]}"]`).join('')) : null;
  const sc = $('.wiz-body') ? $('.wiz-body').scrollTop : 0;
  if (PK.node && PK.node.parentNode) PK.node.parentNode.removeChild(PK.node);
  w._shown = st.key;
  const review = w.mode === 'review' || w.mode === 'fix';
  root.innerHTML = `<div class="wiz ${same ? '' : 'enter'}" role="dialog" aria-modal="true" aria-labelledby="wq">
    <div class="wiz-top"><button class="icon-btn" data-a="w-close" aria-label="بستن">${ic('close')}</button><div class="prog" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${w.step + 1}"><i style="width:${Math.max(6, Math.round((w.step + 1) / total * 100))}%"></i></div><span class="wiz-count">${review ? '<span class="review-tag">مرور</span> ' : ''}گام ${fa(w.step + 1)} از ${fa(total)}</span></div>
    <div class="wiz-body">${typeof st.art === 'function' ? st.art(w) : ''}<h1 class="wiz-q" id="wq">${st.q(w)}</h1><p class="wiz-help">${st.help(w)}</p>${st.body(w)}<p class="err" role="alert">${esc(w.err)}</p></div>
    <div class="scroll-hint" aria-hidden="true">${HAND}</div>
    <div class="wiz-foot"><div class="foot-row"><button class="btn line" data-a="w-prev" ${w.step > 0 && !w.busy ? '' : 'disabled'}>قبلی</button><button class="btn" data-a="w-next" ${w.busy ? 'disabled' : ''}>${w.busy ? 'لطفاً صبر کنید…' : nextLabel(w, st, steps)}</button></div></div></div>`;
  watchScrollHint();
  if (same) { $('.wiz-body').scrollTop = sc; const n = sel && root.querySelector(sel); if (n) n.focus({ preventScroll: true }); }
  else { const q = $('#wq'); if (q) { q.tabIndex = -1; q.focus({ preventScroll: true }); } clearTimeout(ui.wfT); const key = st.key;
    if (matchMedia('(hover:hover) and (pointer:fine)').matches) ui.wfT = setTimeout(() => { const cur = ui.wiz; if (!cur || cur._shown !== key) return; const a = document.activeElement; if (a && a !== q && a !== document.body && root.contains(a)) return; const inp = [...root.querySelectorAll('.wiz-body input:not([type=checkbox]):not([type=radio]):not([type=time]):not([type=hidden]):not(.hp), .wiz-body textarea')].find(x => !x.value && x.offsetParent); if (inp) inp.focus({ preventScroll: true }); }, 120); }
  if (st.mount) st.mount(w);
}
function nextLabel(w, st, steps) {
  if (st.key === 'phone') return w.otpSent ? 'تأیید و ساخت مسیرک' : 'ارسال کد';
  if (w.step === steps.length - 1) return w.mode === 'review' ? 'پایان مرور' : 'تمام؛ بسازیم!';
  return w.mode === 'review' ? 'بعدی' : 'ادامه';
}
function wizDone(w) {
  const p = active();
  return `<div class="wiz" role="dialog" aria-modal="true" aria-labelledby="wq"><div class="wiz-body" style="text-align:center;justify-items:center;align-content:center;flex:1">${ART.party}
    <h1 class="wiz-q" id="wq">مسیرکِ «${esc(p ? p.label : '')}» آماده است!</h1>
    <p class="wiz-help">${quip('welcome', .8).trim()} حالا نزدیک‌ترین هم‌مسیرها را می‌بینید. اگر هنوز کسی نیست، لینک و پوستر ${esc(p ? destWord(p) : '')} را بفرستید تا بقیه بیایند؛ هر ثبت‌نام نزدیک را خبر می‌دهیم.</p>
    <button class="btn line" data-a="notify">${ic('bell')}نوتیف را روشن کن</button></div>
    <div class="wiz-foot"><button class="btn block" data-a="w-finish">دیدن هم‌مسیرها</button><button class="btn line block" data-a="w-poster">${ic('share')}لینک و پوستر</button></div></div>`;
}
function draftOf(w) { return { id: w.pid || ('d' + uid()), label: (w.label || '').trim() || (KINDS[w.kind] || KINDS.other).lbl || 'مسیرک', kind: w.kind || 'school', color: (KINDS[w.kind] || KINDS.other).c, data: w.d, step: w.step, complete: 0, place: w.link || w.place || null, placeDraft: w.newPlace || null, team: null }; }
async function wizSave(w, complete) {
  { const g = placeGender(w) || (w.newPlace && w.newPlace.gender); if (g === 'f' || g === 'm') (w.d.kids || []).forEach(k => k.g = g); }
  const dp = draftOf(w);
  if (!S.token) { // keep a local draft until the phone step
    const i = S.drafts.findIndex(x => x.id === dp.id); if (i >= 0) S.drafts[i] = dp; else S.drafts = [dp]; w.pid = dp.id; S.active = dp.id; persist(); return;
  }
  let placeId = dp.place ? dp.place.id : null;
  if (!placeId && dp.placeDraft && complete) {
    const n = dp.placeDraft; const r = await api('place_create', { kind: dp.kind, name: n.name.trim(), city: n.city || 'تهران', gender: wChild(w) ? n.gender : 'fm', shift: [n.shift, n.gender === 'fm' ? n.mix : ''].filter(Boolean).join(' · '), lat: n.lat, lng: n.lng, in: n.in || '07:30', out: n.out || '13:30', in2: n.shift === 'چرخشی' ? (n.in2 || '13:30') : '', out2: n.shift === 'چرخشی' ? (n.out2 || '18:00') : '', days: [0, 1, 2, 3, 4], force: true });
    placeId = r.place.id; w.place = r.place; w.newPlace = null;
  }
  const isDraft = !w.pid || String(w.pid).startsWith('d');
  const r = await api('profile_save', { ref: complete ? S.ref || '' : '', id: isDraft ? '' : w.pid, label: dp.label, kind: dp.kind, color: dp.color, place_id: placeId, data: w.d, step: w.step, complete: complete ? 1 : 0 });
  if (isDraft) S.drafts = S.drafts.filter(x => x.id !== w.pid);
  w.pid = r.profile.id; const i = P.findIndex(x => x.id === r.profile.id); if (i >= 0) P[i] = r.profile; else P.push(r.profile);
  S.active = r.profile.id; persist();
}
async function wizNext() {
  const w = ui.wiz, steps = wizSteps(w), st = steps[w.step];
  if (st.key === 'snapp' && w.d.snapp) w.d.snapp = +en(w.d.snapp) || 0;
  const ok = st.ok(w);
  if (ok === 'otp-send') return otpSend(w);
  if (ok === 'otp-verify') return otpVerify(w);
  if (ok !== true) { w.err = ok; return wizRender(); }
  w.err = '';
  const last = w.step === steps.length - 1;
  if (w.mode === 'review' || w.mode === 'fix') {
    w.busy = true; wizRender();
    try { await wizSave(w, true); } catch (e) { w.busy = false; w.err = e.message; return wizRender(); }
    w.busy = false;
    if (w.mode === 'fix' || last) { ui.wiz = null; wizRender(); applyAccent(); render(); loadPeers(); return toast(w.mode === 'fix' ? 'ممنون؛ مسیرک کامل شد.' : 'مرور تمام شد؛ تغییرات ذخیره شد.'); }
    w.step++; return wizRender();
  }
  if (!last) { w.step++; snd('step'); wizRender(); wizSave(w, false).catch(() => {}); return; }
  await finishWizard(w);
}
async function finishWizard(w) {
  w.busy = true; wizRender();
  try { await wizSave(w, true); } catch (e) { w.busy = false; if (e.code === 'paywall') { w.err = ''; wizRender(); return paywallSheet(e.reason, w); } w.err = e.message; return wizRender(); }
  snd('done');
  w.busy = false; w.done = true; ui.linkPlace = null; if (location.pathname !== BASE) history.replaceState(null, '', BASE);
  applyAccent(); wizRender(); render(); loadPeers(); loadInbox();
}
async function otpSend(w, channel) {
  w.busy = true; w.err = ''; wizRender();
  try { const r = await api('otp_send', { phone: normPhone(w.phone), channel: channel || 'sms' }); w.otpSent = true; if (!channel || channel === 'sms') setTimeout(() => otpAuto('#w-otp'), 600); w.smsFail = null; w.channel = channel || 'sms'; w.devCode = r.dev_code || null; }
  catch (e) { if (e.code === 'sms') { w.smsFail = { pcode: e.pcode }; w.otpSent = false; } else if (e.code === 'bale') { w.smsFail = w.smsFail || { pcode: e.pcode }; w.otpSent = false; w.err = e.message; } else w.err = e.message; }
  w.busy = false; wizRender();
}
async function guestStart(w) {
  w.busy = true; w.err = ''; wizRender();
  try { const r = await api('guest_start'); S.token = r.token; S.phone = null; persist(); await refreshMe(); }
  catch (e) { w.busy = false; w.err = e.message; return wizRender(); }
  w.busy = false; await finishWizard(w); toast('مسیرک ساخته شد. هر وقت خواستید شماره را از منو تأیید کنید.');
}
function normPhone(v) {
  let p = en(v).replace(/\D/g, '');
  if (p.startsWith('0098')) p = '0' + p.slice(4); else if (p.startsWith('98') && p.length === 12) p = '0' + p.slice(2); else if (p.startsWith('9') && p.length === 10) p = '0' + p;
  return /^09\d{9}$/.test(p) ? p : '';
}
function contactHtml(w) {
  return `<span class="lbl">ارتباط با هم‌مسیرها</span><div class="choices">
    <button class="choice" data-a="w-contact" data-v="phone" aria-pressed="${w.d.contact === 'phone'}">${ic('phone', 'emo')}<span>شماره‌ام به خانواده‌های همین ${esc(destWord({ kind: w.kind }))} نشان داده شود</span></button>
    <button class="choice" data-a="w-contact" data-v="app" aria-pressed="${w.d.contact === 'app'}">${ic('team', 'emo')}<span>ارتباط‌مان فقط از طریق همین اپ باشد<small>دعوت و گفتگوی تیم داخل رسیدیم؛ گاهی سر بزنید</small></span></button></div>`;
}
async function otpVerify(w) {
  w.busy = true; w.err = ''; wizRender();
  try { const r = await api('otp_verify', { phone: normPhone(w.phone), code: en(w.otp || '') }); S.token = r.token; S.phone = r.phone; persist(); await refreshMe(); }
  catch (e) { w.busy = false; w.err = e.message; return wizRender(); }
  w.busy = false; await finishWizard(w);
}


/* ═════════ v07 building blocks ═════════ */
const HAND = `<svg viewBox="0 0 64 80" width="46" height="58"><g fill="#FFE1C4" stroke="#04140B" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M26 6c3 0 5 2 5 5v28l2-1V24c0-3 2-5 5-5s5 2 5 5v14l2-1v-8c0-3 2-5 5-5s5 2 5 5v20c0 16-10 26-24 26S12 64 10 52L6 38c-1-3 1-6 4-7 2-1 5 0 6 2l5 9V11c0-3 2-5 5-5Z" transform="rotate(180 32 40)"/></g><path d="M22 70c4 3 16 3 20 0" stroke="#04140B" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".25"/></svg>`;
function watchScrollHint() {
  const b = $('.wiz-body'), h = $('.scroll-hint'); if (!b || !h) return;
  const upd = () => { const more = b.scrollHeight - b.clientHeight - b.scrollTop > 60; h.classList.toggle('on', more); };
  b.addEventListener('scroll', upd, { passive: true }); setTimeout(upd, 350); upd();
}
function cityAnim(label) {
  return `<div class="city" aria-hidden="true"><svg viewBox="0 0 360 170" preserveAspectRatio="xMidYMid slice">
    <defs><pattern id="blk" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#E9F6EE"/><rect x="6" y="6" width="22" height="18" rx="4" fill="#D3EEDC"/><rect x="34" y="6" width="20" height="26" rx="4" fill="#CFE8F7"/><rect x="6" y="30" width="22" height="24" rx="4" fill="#FCE7C8"/><rect x="34" y="38" width="20" height="16" rx="4" fill="#D3EEDC"/><path d="M0 .5H60M.5 0V60" stroke="#fff" stroke-width="3"/></pattern></defs>
    <g class="city-pan"><rect x="-60" y="-60" width="540" height="300" fill="url(#blk)"/></g>
    <path d="M-10 128H370" stroke="#fff" stroke-width="22"/><path d="M-10 128H370" stroke="#B9C7BF" stroke-width="2" stroke-dasharray="10 12"/>
    ${[300, 215, 130].map((x, i) => `<g transform="translate(${x} 96)"><path d="M-14 18V2l14-12L14 2v16Z" fill="#fff" stroke="#04140B" stroke-width="2"/><rect x="-4" y="7" width="8" height="11" fill="#FFD84D" stroke="#04140B" stroke-width="1.6"/><g class="kid k${i}"><circle cx="20" cy="10" r="4" fill="#fff" stroke="#04140B" stroke-width="1.6"/><path d="M20 14l-5 9h10Z" fill="${['#FF8FA3', '#7FD8FF', '#FFD84D'][i]}" stroke="#04140B" stroke-width="1.6"/></g></g>`).join('')}
    <g transform="translate(40 92)"><path d="M-22 18V0l22-14L22 0v18Z" fill="#fff" stroke="#04140B" stroke-width="2"/><path d="M-6 -2h12" stroke="#04140B" stroke-width="2"/><path d="M0 -14v-10l10 4-10 4" fill="#1DBF73" stroke="#04140B" stroke-width="1.6"/><g class="kid kin">${[-12, 0, 12].map((dx, i) => `<circle cx="${dx}" cy="30" r="3.4" fill="#fff" stroke="#04140B" stroke-width="1.4"/><path d="M${dx} 33l-4 7h8Z" fill="${['#FF8FA3', '#7FD8FF', '#FFD84D'][i]}" stroke="#04140B" stroke-width="1.4"/>`).join('')}</g></g>
    <g class="city-car"><g transform="translate(0 112)"><path d="M-20 16V6c0-3 2-5 5-5l6-2 6-8c1-2 3-3 5-3h12c2 0 4 1 5 3l5 8 5 1c3 1 4 3 4 6v10Z" fill="#fff" stroke="#04140B" stroke-width="2.2" stroke-linejoin="round"/><circle cx="-12" cy="17" r="5" fill="#04140B"/><circle cx="14" cy="17" r="5" fill="#04140B"/><circle cx="-2" cy="-1" r="3.2" fill="#FFE1C4" stroke="#04140B" stroke-width="1.2"/></g></g>
  </svg>${label ? `<span class="city-label">${label}</span>` : ''}</div>`;
}
/* full-screen map picker (Snapp-style centre pin) */
const PKM = { cur: null, done: null };
function pickOnMap(title, center, onDone) {
  PKM.cur = center ? center.slice() : null; PKM.done = onDone;
  $('#pick-root').innerHTML = `<div class="pickm" role="dialog" aria-modal="true" aria-labelledby="pk-t">
    <div class="pickm-top"><button class="icon-btn" data-a="pk-cancel" aria-label="بستن">${ic('close')}</button><b id="pk-t">${esc(title)}</b><span style="width:46px"></span></div>
    <div class="mapbox" id="pick-full" style="height:auto;flex:1;border-radius:0;border:0"><div class="mapc-holder" style="position:absolute;inset:0"></div><div class="picker-pin"><div class="head"></div><div class="dot"></div></div><button class="fab" data-a="pk-here" aria-label="موقعیت فعلی من">${ic('locate')}</button></div>
    <div class="pickm-foot"><p class="addr" id="pk-addr">${ic('pin')}<span>نقشه را بکشید تا پین روی جای درست بنشیند</span></p><button class="btn block" data-a="pk-ok">همین‌جاست</button></div></div>`;
  mountPicker('#pick-full', center || [35.7, 51.39], (la, ln) => { PKM.cur = [la, ln]; pkReverse(); });
}
let pkT; function pkReverse() { clearTimeout(pkT); pkT = setTimeout(async () => { const a = $('#pk-addr span'); if (!a || !PKM.cur) return; a.textContent = 'در حال خواندن نشانی…'; try { const r = await api('reverse', { lat: PKM.cur[0], lng: PKM.cur[1] }); a.textContent = r.address || (r.hood ? 'محله ' + r.hood : 'همین نقطه'); PKM.hood = r.hood; PKM.addr = r.address; } catch (e) { a.textContent = 'همین نقطه'; } }, 500); }
const PX = { map: null, L: null, idx: new Map(), sel: null, mode: '', kind: '', t: 0 };
const pnorm = t => String(t || '').replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[\u200c\s\-ـ]+/g, '').replace(/[ًٌٍَُِّْ]/g, '').toLowerCase();
async function placeExplorer(mode, center, kind) {
  let root = $('#px-root'); if (!root) { root = document.createElement('div'); root.id = 'px-root'; document.body.appendChild(root); }
  PX.mode = mode; PX.kind = kind || ''; PX.sel = null; PX.idx = new Map(); lastFocus = document.activeElement;
  root.innerHTML = `<div class="px" role="dialog" aria-modal="true" aria-label="مکان‌ها روی نقشه"><div class="px-top"><button class="icon-btn" data-a="px-close" aria-label="بستن">${ic('close')}</button><div class="px-search">${ic('school', 'i px-sic')}<input id="px-q" placeholder="${mode === 'pick' ? 'نام ' + esc((KINDS[kind] || KINDS.school).n) + ' را بنویسید…' : 'جستجوی مدرسه، مهد، دانشگاه…'}" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="search"><div class="px-sug" id="px-sug" role="listbox"></div></div></div>
    <div class="px-map" id="px-map"><p class="px-load">در حال آوردن نقشه…</p></div><button class="fab px-loc" data-a="px-loc" aria-label="موقعیت من">${ic('locate')}</button><div class="px-card" id="px-card"></div></div>`;
  document.body.classList.add('px-open');
  if (matchMedia('(hover:hover) and (pointer:fine)').matches) setTimeout(() => { const i = $('#px-q'); i && i.focus(); }, 200);
  const c0 = center || (active() && active().data && active().data.lat ? [active().data.lat, active().data.lng] : [35.7, 51.39]);
  const node = document.createElement('div'); node.className = 'mapc'; $('#px-map').innerHTML = ''; $('#px-map').appendChild(node);
  try { const r = await makeMap(node, c0, 14); PX.map = r.map; PX.L = r.L; } catch (e) { $('#px-map').innerHTML = '<p class="px-load">نقشه بار نشد؛ از جستجوی بالا استفاده کنید.</p>'; }
  if (PX.map) PX.map.on('moveend', () => { clearTimeout(PX.t); PX.t = setTimeout(pxLoad, 300); });
  pxLoad(c0);
}
async function pxLoad(c) { const M = PX.map; const ce = M ? M.getCenter() : null, at = c || (ce ? [ce.lat, ce.lng] : null); if (!at) return;
  const z = M ? M.getZoom() : 14, r = Math.round(Math.min(20000, Math.max(2500, 9000 * Math.pow(2, 14 - z))));
  try { const res = await api('places_map', { lat: at[0], lng: at[1], r }); res.places.forEach(q => PX.idx.set(q.id, q)); } catch (e) {}
  pxDraw(); }
const pxFit = q => !PX.kind || PX.kind === 'other' || q.kind === PX.kind || (PX.kind === 'school' && q.kind === 'kinder');
function pxDraw() { if (!PX.map) return; try { placesLayer(PX.map, PX.L, 'px-pl', [...PX.idx.values()].filter(pxFit), PX.sel, id => pxSelect(id, false)); } catch (e) {} }
function pxSelect(id, fly) { const q = PX.idx.get(id); if (!q) return; PX.sel = id; pxDraw(); $('#px-sug').innerHTML = ''; const i = $('#px-q'); if (i && fly) i.blur();
  if (PX.map) PX.map.flyTo({ center: [q.lng, q.lat], zoom: Math.max(PX.map.getZoom(), 15.5), duration: 700, padding: { bottom: 160 } }); snd('tap');
  const K = KINDS[q.kind] || KINDS.other, g = { f: 'دخترانه', m: 'پسرانه', fm: 'دختر و پسر' }[q.gender] || '';
  $('#px-card').innerHTML = `<div class="px-c">${kindIc(q.kind, false, false)}<span class="grow"><b>${esc(q.name)}</b><small>${esc(K.n)}${g && ['school', 'kinder'].includes(q.kind) ? ' · ' + g : ''}${q.city ? ' · ' + esc(q.city) : ''}${q.nv ? ' · <span class="nv">' + ic('check') + 'نشان</span>' : ''}</small></span></div>
    <button class="btn ac block" data-a="${PX.mode === 'pick' ? 'px-pick' : 'px-start'}" data-id="${q.id}">${PX.mode === 'pick' ? 'همین را انتخاب می‌کنم' : 'هم‌مسیرهای این مکان را پیدا کن'}</button>`; $('#px-card').classList.add('on'); $('.px').classList.add('has-card'); }
let pxQT; function pxSearch(v) { const n = pnorm(v), box = $('#px-sug'); if (!box) return; if (n.length < 2) { box.innerHTML = ''; return; }
  const show = () => { const L = [...PX.idx.values()].filter(pxFit).map(q => { const t = pnorm(q.name); const i = t.indexOf(n); return i < 0 ? null : [i === 0 ? 0 : 1, t.length, q]; }).filter(Boolean).sort((a, b) => a[0] - b[0] || a[1] - b[1]).slice(0, 8).map(x => x[2]);
    box.innerHTML = L.length ? L.map(q => `<button role="option" data-a="px-go" data-id="${q.id}">${kindIc(q.kind, false, false)}<span class="grow">${esc(q.name)}<small>${esc(q.city || '')}</small></span></button>`).join('') : '<p class="muted small" style="padding:10px">چیزی پیدا نشد؛ نام دیگری امتحان کنید.</p>'; };
  show(); clearTimeout(pxQT); pxQT = setTimeout(async () => { try { const r = await api('place_near', { q: v.trim(), kind: PX.kind && PX.kind !== 'other' ? PX.kind : '' }); r.places.forEach(q => PX.idx.set(q.id, q)); pxDraw(); if ($('#px-q') && pnorm($('#px-q').value) === n) show(); } catch (e) {} }, 320); }
function placeCard(q, mode) { if (!q) return; PX.idx = PX.idx.size ? PX.idx : new Map(); PX.idx.set(q.id, q); PX.mode = mode;
  const K = KINDS[q.kind] || KINDS.other; sheet(q.name, `<p class="muted">${esc(K.n)}${q.city ? ' · ' + esc(q.city) : ''}</p><button class="btn ac block" data-a="px-start" data-id="${q.id}">ساختن مسیرک برای همین مکان</button>`); }
function pxClose() { try { PX.map && PX.map.remove(); } catch (e) {} PX.map = null; const r = $('#px-root'); if (r) r.innerHTML = ''; document.body.classList.remove('px-open'); if (lastFocus && document.contains(lastFocus)) lastFocus.focus(); }
function closePicker() { if (PK.node && PK.node.parentNode) PK.node.parentNode.removeChild(PK.node); $('#pick-root').innerHTML = ''; }
/* undo snackbar: «اشتباه کردم، برگرد» */
let undoT;
function practice(body) { // the trip is not «now»: play along locally so a curious child still has fun, but record nothing
  const T = ui.team, x = (slotsOf(T.place).find(y => y.id === body.slot)) || null; if (!x) return; ui.prac = ui.prac || {}; const P0 = ui.prac[x.id] = ui.prac[x.id] || { status: 'pending', exec: null, arr: {}, empty: 0, ev: { bp: {} } };
  if (body.act === 'start') { P0.status = 'started'; P0.exec = body.exec; P0.ev = { start: Date.now() / 1000, bp: { [body.exec]: Date.now() / 1000 } }; snd('whoosh'); }
  if (body.act === 'board') { P0.ev.bp[body.pid] = Date.now() / 1000; snd('tap'); }
  if (body.act === 'unboard') delete P0.ev.bp[body.pid];
  if (body.act === 'arrive' || body.act === 'finish') { P0.status = body.act === 'finish' ? 'done' : P0.status; P0.ev.arrive = Date.now() / 1000; snd('done'); if (body.act === 'finish') setTimeout(() => { delete ui.prac[x.id]; renderMain(); }, 6000); }
  if (!ui.pracNoted) { ui.pracNoted = 1; toast('حالت تمرین 🎈 الان وقت این سفر نیست؛ هر چه بزنید فقط بازی است و ثبت نمی‌شود.'); }
  renderMain();
}
function pricePoll() { const opts = [0, 30000, 50000, 75000, 100000, 150000];
  sheet('یک سؤال کوتاه 🙏', `<p style="line-height:2">رسیدیم فعلاً رایگان است. اگر روزی اشتراک ماهانه داشته باشد (برای امکاناتی مثل موقعیت زنده و یادآوری‌ها)، به نظرتان <b>چه مبلغی در ماه منصفانه است؟</b></p>
    <div class="field"><label for="pp-f">منصفانه</label><select id="pp-f">${opts.map(v => `<option value="${v}" ${v === 50000 ? 'selected' : ''}>${v ? money(v) : 'باید رایگان بماند'}</option>`).join('')}</select></div>
    <div class="field"><label for="pp-h">از چه مبلغی به بعد دیگر نمی‌خرید؟</label><select id="pp-h">${[50000, 75000, 100000, 150000, 200000, 300000].map(v => `<option value="${v}" ${v === 100000 ? 'selected' : ''}>${money(v)}</option>`).join('')}</select></div>
    <button class="btn ac block" data-a="pp-vote">ثبت نظر</button><p class="muted small">فقط برای تصمیم‌گیری منصفانه است؛ چیزی از شما گرفته نمی‌شود.</p>`); }
function holdThen(msg, ms, fn) { // a countdown bar with «پشیمان شدم»; nothing reaches the server until it ends
  const el = $('#undo'); clearTimeout(undoT); ui.holdFn = fn; el.innerHTML = `<span class="grow">${esc(msg)}<i class="hold-bar" style="animation-duration:${ms}ms"></i></span><button class="btn sm" data-a="hold-cancel">پشیمان شدم</button>`; el.classList.add('show');
  ui.holdT = setTimeout(() => { el.classList.remove('show'); const f = ui.holdFn; ui.holdFn = null; if (f) f(); }, ms); }
function snack(msg, label, fn) {
  const el = $('#undo'); el.innerHTML = `<span class="grow">${esc(msg)}</span><button class="btn sm" data-a="undo">${esc(label)}</button>`;
  el.classList.add('show'); ui.undoFn = fn; clearTimeout(undoT); undoT = setTimeout(() => { el.classList.remove('show'); ui.undoFn = null; }, 9000);
}
function offerUndo(msg, fn) {
  const el = $('#undo'); el.innerHTML = `<span class="grow">${esc(msg)}</span><button class="btn sm" data-a="undo">${ic('undo')}اشتباه کردم، برگرد</button>`;
  el.classList.add('show'); ui.undoFn = fn; clearTimeout(undoT); undoT = setTimeout(() => { el.classList.remove('show'); ui.undoFn = null; }, 9000);
}
/* team chat */
const URGENT = ['⚡ امروز نمی‌توانم ببرم', '⚡ ۱۰ دقیقه تأخیر دارم', '⚡ بچه بیمار است؛ امروز نمی‌آید', '⚡ کجایید؟ منتظریم'];
const QUICK = ['سلام، صبح بخیر 🌤', 'پنج دقیقه دیرتر می‌رسم', 'امروز نمی‌توانم ببرم؛ کسی هست؟', 'بچه‌ها رسیدند ✓', 'دست‌تان درد نکند 🌸'];
const TIPS0 = [];
function tipsFor(p) { const L = (Array.isArray(CFG.tips) && CFG.tips.length ? CFG.tips : TIPS0).filter(x => x && x.t), ages = ((ui.team && mem(ui.team, p.id) || {}).kids || []).map(k => k.age).filter(a => a != null && a < 25);
  const fit = x => { if (!x.a) return true; const [lo, hi] = String(x.a).split('-').map(Number); return !ages.length || ages.some(a => a >= lo && a < hi); };
  const out = L.filter(fit), day = Math.floor(Date.now() / 864e5); return out.slice(day % out.length).concat(out.slice(0, day % out.length)); }
async function famSheet2() { const p = active(); if (!p) return; let L = { list: [] }; try { L = await api('fam_list', { profile_id: p.id }); } catch (e) { return fail(e); }
  const me = L.list.find(x => x.me) || {}, owner = me.role === 'owner';
  const rl = r => r === 'owner' ? 'صاحب مسیرک' : r === 'act' ? 'در حال انجام کار' : 'فقط دیدن';
  sheet('همراه خانواده', `<div class="sup-how">${ic('team')}<span><b>چرا؟</b> وقتی پدر سر کار است، مادر (یا پدربزرگ و مادربزرگ) هم همه‌ی خبرها را روی گوشی خودش می‌بیند: سوار شد، رسیدند، سرویس دم در است. هر کس می‌تواند در صورت نیاز با «من ادامه می‌دهم» کارها را در دست بگیرد.</span></div>
    <div class="fam-list">${L.list.map(x => `<div class="fam-row">${ic(x.role === 'owner' ? 'user' : 'team')}<span class="grow"><b dir="ltr">${esc(x.phone)}</b>${x.me ? ' <span class="tag ac">شما</span>' : ''}<small>${rl(x.role)}${x.trial_left != null && L.paid ? ' · ' + fa(x.trial_left) + ' روز از ماه رایگان مانده' : ''}</small></span>${owner && x.role !== 'owner' ? `<button class="btn line sm" data-a="fam-rm" data-u="${x.user}">حذف</button>` : ''}</div>`).join('')}</div>
    ${owner || me.role === 'act' ? `<button class="btn ac block" data-a="fam-invite">${ic('share')}فرستادن لینک همراه شدن</button><p class="muted small">لینک تا ۴۸ ساعت معتبر است. همراه با شماره‌ی خودش وارد می‌شود و این مسیرک را کنار مسیرک‌های خودش می‌بیند. حداکثر ۳ همراه. ${L.paid ? 'یک ماه اول رایگان؛ بعد با اشتراک همراه.' : 'فعلاً رایگان.'}</p>` : ''}
    ${!owner ? `<div class="seg2"><button data-a="fam-watch" aria-pressed="${me.role !== 'act'}">فقط دیدن</button><button data-a="fam-act" aria-pressed="${me.role === 'act'}">من ادامه می‌دهم</button></div><button class="link" data-a="fam-leave">دیگر همراه این مسیرک نباشم</button>` : ''}`);
}
async function famJoin(code) { if (!S.phone) { toast('برای همراه شدن، اول با شماره‌ی خودتان وارد شوید.'); ui.famCode = code; return act('login'); }
  try { const r = await api('fam_join', { code }); ui.famCode = null; history.replaceState(null, '', location.pathname); await refreshMe(); S.active = r.profile_id; persist(); render(true); snd('done'); toast('همراه شدید! از این به بعد خبرهای این مسیرک را می‌بینید.'); } catch (e) { fail(e); } }
function mateSheet(id) { const T = ui.team, m = T && mem(T, id), p = active(); if (!m) return; const mine = id === p.id;
  const row2 = (k, v) => v ? `<div class="mrow"><span>${k}</span><b>${v}</b></div>` : '';
  const vals = (m.values || []).map(v => VALUES[v]).filter(Boolean);
  sheet(fam(m), `<div class="mate">${shapeAv(m.id, 56)}<div><b>${esc(fam(m))}</b>${mine ? ' <span class="tag ac">شما</span>' : ''}<small>${esc(m.hood || '')}</small></div></div>
    ${row2('نقش', m.role === 'drive' ? 'رانندگی می‌کند' : m.role === 'pay' ? 'هزینه می‌دهد' : 'هم رانندگی، هم هزینه')}${m.role !== 'pay' ? row2('صندلی خالی', fa(m.seats || 0)) : ''}
    ${row2('روزهایی که می‌تواند ببرد', (m.days || []).length ? m.days.map(d => DAYS[d]).join('، ') : (m.role === 'pay' ? '' : 'مشخص نکرده'))}
    ${row2('مسیرها', [(m.needs || {}).out !== false ? 'رفت' : '', (m.needs || {}).back !== false ? 'برگشت' : ''].filter(Boolean).join(' و '))}
    ${row2('سوار شدن', m.pickup === 'door' ? 'دمِ در خانه' : 'سر کوچه یا نقطه‌ی قرار')}
    ${vals.length ? `<div class="mrow col"><span>ارزش‌ها و شرایط</span><div class="chips">${vals.map(v => `<span class="chip on">${esc(v)}</span>`).join('')}</div></div>` : ''}
    ${row2('قیمت اسنپی که دیده', m.snapp ? money(m.snapp) : '')}
    ${mine ? `<button class="btn ac block" data-a="mate-edit">${ic('check')}ویرایش شرایط من</button><p class="muted small">بعد از هم‌فکری در گفتگو، شرایط‌تان را همین‌جا به‌روز کنید؛ هم‌تیمی‌ها خبردار می‌شوند.</p>` : `<button class="btn line block" data-a="pact">${ic('shield')}دیدن یا نوشتن قرار تیم</button>`}`);
}
function fromChat() { if ($('.chatx')) { clearInterval(ui.chatT); document.body.classList.remove('chat-open'); ui.backToChat = true; } }
function pactSheet() { const pc = (ui.team && ui.team.pact) || {}, by = pc.by && ui.team ? mem(ui.team, pc.by) : null;
  sheet('قرار تیم', `<p class="muted small">خلاصه‌ی توافق تیم: ساعت حرکت، جای سوار شدن، اگر کسی دیر کرد، هزینه، تعطیلات… هر عضو می‌تواند ویرایش کند و بقیه خبردار می‌شوند.</p>
    <div class="field"><label for="pact-t">متن قرار</label><textarea id="pact-t" rows="6" maxlength="600" placeholder="مثلاً: صبح‌ها ۷:۰۵ سر کوچه؛ اگر کسی ۵ دقیقه دیر کرد پیام بدهد؛ پنجشنبه‌ها تعطیل؛ تسویه آخر هر ماه.">${esc(pc.text || '')}</textarea></div>
    ${pc.at ? `<p class="muted small">آخرین تغییر: ${esc(by ? fam(by) : '')} · ${jLabel(new Date(pc.at * 1000))}</p>` : ''}<button class="btn ac block" data-a="pact-save">ثبت قرار</button>`); }
async function chatSheet() {
  const p = active(); if (!p || !p.team) return;
  ui.chat = { list: [], sig: '' }; lastFocus = document.activeElement;
  const T = ui.team && ui.team.members ? ui.team.members : [];
  $('#layer').innerHTML = `<div class="scrim cx-scrim" data-a="chat-close"></div><section class="chatx" role="dialog" aria-modal="true" aria-labelledby="ch-t"><div class="mapbg" aria-hidden="true"></div>
    <header class="cx-top"><button class="icon-btn" data-a="chat-close" aria-label="بازگشت">${ic('back')}</button>
      <div class="cx-ttl"><b id="ch-t">گفتگوی تیم</b><small>${esc(teamName(p.team))}${T.length ? ' · ' + fa(T.length) + ' خانواده' : ''}</small></div>
      <div class="cx-avs">${T.slice(0, 5).map(m => `<button class="cx-av" data-a="mate" data-id="${m.id}" aria-label="شرایط ${esc(fam(m))}">${shapeAv(m.id, 28)}</button>`).join('')}</div></header>
    ${(() => { const pc = (ui.team && ui.team.pact) || {}; return `<button class="cx-pact" data-a="pact">${ic('shield')}<span class="grow">${pc.text ? `<b>قرار تیم:</b> ${esc(pc.text.length > 90 ? pc.text.slice(0, 90) + '…' : pc.text)}` : '<b>قرار تیم</b> هنوز نوشته نشده؛ خلاصه‌ی توافق‌تان را اینجا بنویسید.'}</span>${ic('back')}</button>`; })()}
    ${(() => { const L = tipsFor(p); return L.length ? `<div class="cx-tips" id="cx-tips" aria-label="توصیه‌ی تربیتی">${L.map(x => `<div class="tip-c"><span class="tip-ic">🌱</span><span><b>${esc(x.t)}</b><small>${esc(x.s || '')}</small></span></div>`).join('')}</div>` : ''; })()}
    <div class="cx-list" id="chat-list"><div class="cx-load"><i></i><i></i><i></i></div></div>
    <div class="cx-quick urg" role="group" aria-label="پیام فوری">${URGENT.map(q => `<button class="urg" data-a="chat-urgent" data-v="${esc(q)}">${esc(q)}</button>`).join('')}</div>
    <div class="cx-quick" role="group" aria-label="پاسخ سریع">${QUICK.map(q => `<button data-a="chat-quick" data-v="${esc(q)}">${esc(q)}</button>`).join('')}</div>
    <div class="cx-foot"><input id="chat-in" maxlength="400" placeholder="یک پیام محترمانه…" autocomplete="off" enterkeyhint="send"><button class="cx-send" data-a="chat-send" aria-label="فرستادن">${ic('send')}</button></div></section>`;
  document.body.classList.add('chat-open');
  if (matchMedia('(min-width:900px)').matches) $('#chat-in').focus();
  { const tp = $('#cx-tips'); let k = 0, hold = 0; if (tp) { tp.addEventListener('pointerdown', () => { hold = Date.now(); }, { passive: true }); clearInterval(ui.tipT); ui.tipT = setInterval(() => { if (!document.body.contains(tp)) return clearInterval(ui.tipT); if (Date.now() - hold < 15000) return; k = (k + 1) % tp.children.length; tp.children[k].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' }); }, 9000); } }
  await chatPull(); clearInterval(ui.chatT); ui.chatT = setInterval(() => { if (!document.hidden) chatPull(); }, 4000);
}
function chatClose() { ui.backToChat = false; clearInterval(ui.chatT); document.body.classList.remove('chat-open'); closeLayer(); }
async function chatPull() {
  const p = active(), el = $('#chat-list'); if (!el || !p) return clearInterval(ui.chatT);
  try { const r = await api('chat_list', { profile_id: p.id, after: 0 }); const sig = r.list.map(m => m.at + m.text).join('|'); if (sig === ui.chat.sig && el.dataset.ok) return; ui.chat.sig = sig; el.dataset.ok = 1;
    const atBottom = el.scrollHeight - el.clientHeight - el.scrollTop < 60; let lastDay = '';
    el.innerHTML = r.list.length ? r.list.map(m => { const dt = new Date(m.at * 1000), dk = ymd(dt), sep = dk !== lastDay ? `<div class="cx-day"><span>${dk === ymd(new Date()) ? 'امروز' : dk === ymd(addD(new Date(), -1)) ? 'دیروز' : jLabel(dt)}</span></div>` : ''; lastDay = dk;
      if (m.sys) return `${sep}<div class="cx-sys">${esc(m.text)}</div>`;
      if (m.urgent) return `${sep}<div class="cx-row urgent ${m.mine ? 'me' : ''}">${m.mine ? '' : shapeAv(m.who_id || m.who, 30)}<div class="cx-b">${m.mine ? '' : `<b>${esc(m.who)}</b>`}<span>${esc(m.text)}</span><small>فوری · ${fa(new Date(m.at * 1000).toTimeString().slice(0, 5))}</small></div></div>`;
      return `${sep}<div class="cx-row ${m.mine ? 'me' : ''}">${m.mine ? '' : shapeAv(m.who_id || m.who, 30)}<div class="cx-b">${m.mine ? '' : `<b>${esc(m.who)}</b>`}<span>${esc(m.text)}</span><small>${fa(dt.toTimeString().slice(0, 5))}${m.mine ? ' ✓' : ''}</small></div></div>`; }).join('')
      : `<div class="cx-empty">${artTeam()}<b>اولین پیام را بنویسید!</b><span>یخ گروه با یک «سلام، صبح بخیر» آب می‌شود. پاسخ‌های سریع پایین صفحه‌اند.</span></div>`;
    if (atBottom || !ui.chat.seen) { el.scrollTop = el.scrollHeight; ui.chat.seen = true; } S.chatSeen = Date.now(); persist(); } catch (e) {}
}

/* ═════════ admin ═════════ */
const PP_HINT = [
  [/درگاه پرداخت فعال|پذیرنده یافت نشد/, 'یعنی توکن درست است و پی‌پینگ جواب داد، اما <b>درگاه پرداخت این حساب هنوز فعال نشده</b>. در پنل پی‌پینگ: «راهکارها ← درگاه پرداخت» را باز کنید. وضعیت باید «فعال» باشد؛ اگر «در انتظار تأیید شاپرک» است، چند روز کاری صبر لازم است. اگر اصلاً درخواست نداده‌اید، همان‌جا «درخواست درگاه» بدهید (مدارک هویتی، شبای حساب، دامنه و اینماد). هنگام ساخت توکن هم دسترسی «پرداخت» را تیک بزنید.'],
  [/401|Unauthorized|توکن/i, 'توکن نامعتبر یا منقضی است، یا دسترسی «پرداخت» ندارد. در پنل پی‌پینگ (اتصالات ← توکن‌ها) «تعویض توکن» بزنید و توکن تازه را اینجا ذخیره کنید.'],
  [/timeout|curl|SSL/i, 'سرور هاست به api.payping.ir نرسید. از پشتیبانی هاست بپرسید که خروجی HTTPS به این دامنه باز است.'],
  [/۴۲۶|426|پیشرفته/, 'الگو در کاوه‌نگار فقط با اشتراک پیشرفته کار می‌کند.'],
  [/۴۲۴|424|الگو/, 'الگو تعریف یا تأیید نشده؛ نام الگو باید دقیقاً همان باشد که در پنل ساخته‌اید.']
];
async function admReload(k) { const A = ui.adm; if (!A) return; try {
    if (k === 'sec') A.sec = await api('admin_secrets', {}, true);
    if (k === 'my') A.my = await api('admin_mysql_get', {}, true);
    if (k === 'health') { const [e, b, h] = await Promise.all([api('admin_errors', {}, true), api('admin_backups', {}, true), api('health', {}, true)]); A.errs = e.list; A.bk = b; A.hl = h; }
    if (k === 'pays') A.pays = await api('admin_payments', {}, true);
  } catch (e) { fail(e); } renderMain(); }
function pager(key, list, row, wrap = x => x, size = 20) {
  ui.pg = ui.pg || {}; const all = ui.pg[key] === 'all', n = list.length, pages = Math.max(1, Math.ceil(n / size)), pg = all ? 0 : Math.min(ui.pg[key] || 0, pages - 1);
  const part = all ? list : list.slice(pg * size, pg * size + size);
  const nav = n > size ? `<div class="pager">${all ? `<button class="link" data-a="pg" data-k="${key}" data-v="0">صفحه‌بندی</button>` : `<button class="btn line sm" data-a="pg" data-k="${key}" data-v="${pg - 1}" ${pg ? '' : 'disabled'}>قبلی</button><span class="small">صفحه‌ی ${fa(pg + 1)} از ${fa(pages)} · ${fa(n)} مورد</span><button class="btn line sm" data-a="pg" data-k="${key}" data-v="${pg + 1}" ${pg < pages - 1 ? '' : 'disabled'}>بعدی</button><button class="link" data-a="pg" data-k="${key}" data-v="all">نمایش همه</button>`}</div>` : '';
  return wrap(part.map(row).join('')) + nav;
}
const ADM_TABS = [['home', 'نمای کلی', 'gear'], ['live', 'زنده', 'radio'], ['launch', 'چک‌لیست لانچ', 'flag'], ['conn', 'اتصال‌ها', 'spark'], ['pays', 'پرداخت‌ها', 'money'], ['health', 'سلامت', 'shield'], ['msgs', 'پیام‌ها', 'ticket'], ['content', 'نکته‌ها', 'book'], ['fb', 'نظرها', 'spark'], ['amb', 'سفیرها', 'heart'], ['places', 'مکان‌ها و تیم‌ها', 'pin'], ['users', 'کاربران', 'user'], ['sms', 'پیامک', 'phone'], ['posters', 'پوستر مدارس', 'print'], ['db', 'پایگاه داده', 'shield']];
function adminView() {
  if (!S.admin) return `<section class="card stack" style="max-width:420px;margin:30px auto"><h1 style="font-size:1.5rem">ورود مدیر</h1><div class="field"><label for="au">نام کاربری</label><input id="au" dir="ltr" autocomplete="username"></div><div class="field"><label for="ap">رمز</label><input id="ap" type="password" dir="ltr" autocomplete="current-password"></div><button class="btn" data-a="adm-login">ورود</button><button class="link" data-a="adm-exit">بازگشت به اپ</button></section>`;
  const A = ui.adm; if (!A) { loadAdmin(); return '<p class="muted" style="text-align:center;padding:40px">در حال بارگذاری…</p>'; }
  const o = A.ov, cnt = o.counts, tab = ui.admTab || 'home';
  return `<div class="adm">${o.default_pass ? `<div class="hint warn">${ic('warn')}<span>رمز مدیر پیش‌فرض (mot) است؛ در config.local.php مقدار admin_pass را عوض کنید.</span></div>` : ''}
    <div class="row between"><h1 style="font-size:1.4rem">پیشخوان مدیریت</h1><div class="row"><button class="btn line sm" data-a="adm-refresh">تازه‌سازی</button><button class="btn line sm" data-a="adm-exit">بازگشت</button></div></div>
    <nav class="adm-tabs" aria-label="بخش‌های پیشخوان">${ADM_TABS.map(([k, t, i]) => `<button data-a="adm-tab" data-v="${k}" aria-pressed="${tab === k}">${ic(i)}<span>${t}</span>${k === 'msgs' && cnt.unseen ? `<i class="badge">${fa(cnt.unseen)}</i>` : ''}${k === 'live' && ui.evNew ? `<i class="badge">${fa(ui.evNew)}</i>` : ''}</button>`).join('')}</nav>
    ${({ live: admLive, launch: admLaunch, home: admHome, conn: admConn, pays: admPays, health: admHealth, msgs: admMsgs, content: admContent, fb: admFb, amb: admAmb, places: admPlaces, users: admUsers, sms: admSms, posters: admPosters, db: admDb }[tab] || admHome)(A)}</div>`;
}
function secRow(K, k, label, hint, opt) {
  const x = K[k] || {}, hid = opt && opt.secret;
  return `<div class="sec-row"><div class="field"><label for="sx-${k}">${label} ${x.set ? `<span class="tag ok">${x.src === 'config' ? 'در config.local.php' : 'ذخیره‌شده'}${hid && x.show ? ' · <b dir="ltr">' + esc(x.show) + '</b>' : ''}</span>` : '<span class="tag">خالی</span>'}</label>
    <input id="sx-${k}" dir="ltr" ${hid ? 'type="password" autocomplete="new-password"' : ''} value="${hid ? '' : esc(x.show || '')}" placeholder="${esc(hint || '')}"></div>
    <div class="row"><button class="btn sm" data-a="sx-save" data-k="${k}">ذخیره</button>${x.src === 'admin' ? `<button class="link" data-a="sx-clear" data-k="${k}">پاک کردن</button>` : ''}</div></div>`;
}
const cp = (t, label) => `<button class="cpy" data-a="copy" data-v="${esc(t)}" title="کپی">${ic('copy')}${label ? `<span>${label}</span>` : ''}</button>`;
const KAVE_TPL = [
  ['residim-login', 'پیامک', 'رسیدیم\nکد ورود شما: %token\nاین کد را به کسی ندهید.\n\n@residim.ir #%token'],
  ['residim-call', 'پیام صوتی', 'کد ورود شما به رسیدیم %token است. تکرار می‌کنم: %token'],
  ['residim-invite', 'پیامک', 'رسیدیم: خانواده %token10 برای %token20 به شما پیشنهاد هم‌مسیری داده‌اند. دیدن و پاسخ: residim.ir/%token'],
  ['residim-arrived', 'پیامک', 'رسیدیم: %token10 ساعت %token به %token20 رسید. راننده: خانواده %token2']];
const SMSIR_TPL = [
  ['کد ورود', 'smsir_tpl_login', 'رسیدیم\nکد ورود شما: #CODE#\nاین کد را به کسی ندهید.\n\n@residim.ir ##CODE#', 'CODE'],
  ['دعوت', 'smsir_tpl_invite', 'رسیدیم: خانواده #FAMILY# برای #PLACE# به شما پیشنهاد هم‌مسیری داده‌اند. residim.ir/#CODE#', 'CODE، FAMILY، PLACE'],
  ['رسیدن', 'smsir_tpl_arrived', 'رسیدیم: #KID# ساعت #TIME# به #PLACE# رسید. راننده: خانواده #DRIVER#', 'KID، TIME، PLACE، DRIVER']];
const tplShow = x => esc(x).replace(/(%token\d*|#[A-Z]+#|@residim\.ir|residim\.ir\/\S+)/g, '<bdi dir="ltr">$1</bdi>');
let tgN = 0;
function tplGuide(rows) { const k = 'tg' + (tgN++ % 40); return `<details class="tplg" data-dk="${k}" ${(ui.dOpen || {})[k] ? 'open' : ''}><summary>${ic('copy')}متن‌های آماده برای پنل (بزنید و کپی کنید)</summary>${rows}</details>`; }
function admConn(A) {
  tgN = 0; const C2 = A.sec; if (!C2) { api('admin_secrets', {}, true).then(r => { A.sec = r; renderMain(); }).catch(fail); return '<p class="muted">در حال خواندن…</p>'; }
  const K = C2.secrets, ST = A.ov.settings || {}, F = A.ov.flags, out = id => `<div class="t-out" id="${id}"></div>`;
  return `${C2.writable ? '' : `<div class="hint warn">${ic('warn')}<span>پوشه‌ی <span dir="ltr">app/storage</span> روی سرور قابل نوشتن نیست؛ از cPanel دسترسی ۷۵۵ بدهید.</span></div>`}
    <p class="muted small">کلیدها روی خود سرور در پوشه‌ی بسته‌ی <span dir="ltr">app/storage</span> ذخیره می‌شوند (نه در گیت و نه قابل دیدن از وب). کلیدهای محرمانه هرگز کامل به مرورگر برنمی‌گردند؛ فقط چهار حرف آخر. اگر قبلاً در config.local.php گذاشته‌اید، مقدار اینجا بر آن مقدم است.</p>
    <div class="adm-cols">
    <section class="card stack"><h2>پیامک: کدام سرویس؟</h2>
      <div class="chips">${[['kavenegar', 'کاوه‌نگار'], ['smsir', 'sms.ir']].map(([k, v]) => `<button class="chip" data-a="sms-prov" data-v="${k}" aria-pressed="${(ST.sms_provider || 'kavenegar') === k}">${v}</button>`).join('')}</div>
      <label class="switch"><span>ارسال مستقیم بدون الگو (خاموش = الگوی تأییدشده؛ پیشنهاد برای لانچ)</span><input type="checkbox" data-a="adm-flag" data-k="sms_direct" ${F.sms_direct ? 'checked' : ''}></label>
      <p class="muted small">بعد از تأیید الگوها در پنل سرویس، کلید بالا را خاموش کنید و از زبانه‌ی «پیامک» یک پیام آزمایشی بفرستید.</p></section>
    <section class="card stack"><h2>کاوه‌نگار</h2>${secRow(K, 'kavenegar_api_key', 'کلید API', 'از پنل: تنظیمات حساب ← کلید API', { secret: 1 })}
      ${secRow(K, 'kavenegar_template', 'نام الگوی کد ورود', 'residim-login')}${secRow(K, 'kavenegar_tpl_call', 'نام الگوی صوتی کد ورود', 'residim-call')}${secRow(K, 'kavenegar_tpl_invite', 'نام الگوی دعوت', 'residim-invite')}${secRow(K, 'kavenegar_tpl_arrived', 'نام الگوی «رسید»', 'residim-arrived')}
      <button class="btn line sm" data-a="adm-test" data-v="kavenegar">آزمون اتصال و اعتبار</button>${out('t-kavenegar')}
      ${tplGuide(`<p class="muted small">پنل کاوه‌نگار ← اعتبارسنجی ← ایجاد الگوی جدید. «نوع استفاده»: وب سایت. متغیرها را با دکمه‌های «افزودن پارامتر» بگذارید (بدون درصد پایانی).</p>${KAVE_TPL.map(([n, t, x]) => `<div class="tpl"><div class="row between"><b dir="ltr">${n}</b>${cp(n, 'نام')}</div><span class="small muted">نوع ارسال: ${t}</span><pre dir="rtl">${tplShow(x)}</pre>${cp(x, 'کپی متن')}</div>`).join('')}`)}</section>
    <section class="card stack"><h2>sms.ir (جایگزین)</h2>${secRow(K, 'smsir_api_key', 'کلید API', 'از پنل sms.ir: برنامه‌نویسان ← لیست کلیدها', { secret: 1 })}
      ${secRow(K, 'smsir_line', 'شماره خط (برای ارسال مستقیم)', 'مثلاً 30007732000000')}${secRow(K, 'smsir_tpl_login', 'شناسه‌ی عددی قالب کد ورود', 'مثلاً 123456')}${secRow(K, 'smsir_tpl_invite', 'شناسه‌ی قالب دعوت', '')}${secRow(K, 'smsir_tpl_arrived', 'شناسه‌ی قالب «رسید»', '')}
      <button class="btn line sm" data-a="adm-test" data-v="smsir">آزمون اتصال و اعتبار</button>${out('t-smsir')}
      ${tplGuide(`<p class="muted small">پنل sms.ir ← ارسال سریع (وریفای) ← قالب جدید. بعد از تأیید، شناسه‌ی عددی قالب را در فیلد بالا بگذارید.</p>${SMSIR_TPL.map(([n, k, x, v]) => `<div class="tpl"><div class="row between"><b>${n}</b><span class="small muted">متغیرها: <span dir="ltr">${v}</span></span></div><pre dir="rtl">${tplShow(x)}</pre>${cp(x, 'کپی متن')}</div>`).join('')}`)}</section>
    <section class="card stack"><h2>درگاه پی‌پینگ</h2>${secRow(K, 'payping_token_test', 'توکن تست', 'توکن «رسیدیم» (تست)', { secret: 1 })}${secRow(K, 'payping_token_live', 'توکن اصلی', 'توکن «رسیدیم غیر تستی»', { secret: 1 })}
      <div class="chips">${[['test', 'حالت تست'], ['live', 'حالت واقعی']].map(([k, v]) => `<button class="chip" data-a="pay-env" data-v="${k}" aria-pressed="${(ST.pay_env || 'test') === k}">${v}</button>`).join('')}</div>
      <label class="switch"><span>پرداخت دنگ خیر از درگاه (خاموش = فقط کارت به کارت)</span><input type="checkbox" data-a="adm-flag" data-k="pay_gateway" ${F.pay_gateway ? 'checked' : ''}></label>
      <div class="row wrap"><button class="btn line sm" data-a="adm-test" data-v="payping" data-env="test">آزمون توکن تست</button><button class="btn line sm" data-a="adm-test" data-v="payping" data-env="live">آزمون توکن اصلی</button></div>${out('t-payping')}
      ${tplGuide(`<p class="muted small">در پنل پی‌پینگ ← اتصالات ← توکن جدید یا ویرایش: </p>
        <div class="tpl"><div class="row between"><span>آدرس وب‌سایت</span>${cp('https://residim.ir')}</div><pre dir="ltr">https://residim.ir</pre></div>
        <div class="tpl"><div class="row between"><span>نشانی بازگشت (returnUrl)، اگر پرسید</span>${cp('https://residim.ir/app/api/pay.php')}</div><pre dir="ltr">https://residim.ir/app/api/pay.php</pre></div>
        <p class="muted small">دسترسی توکن باید شامل «پرداخت» باشد. و در «راهکارها ← درگاه پرداخت» وضعیت درگاه باید «فعال» باشد.</p>`)}</section>
    <section class="card stack"><h2>کد ورود با بله (سفیر)</h2><p class="muted small">کد ورود به‌جای پیامک در اپ بله می‌رسد (طبق اعلام بله برای کسب‌وکارها رایگان). اگر شماره در بله حساب نداشت، کاربر پیامک یا راه دیگر را انتخاب می‌کند.</p>
      ${secRow(K, 'bale_client_id', 'شناسه‌ی کلاینت (client_id)', 'از پنل سفیر بله')}${secRow(K, 'bale_client_secret', 'رمز کلاینت (client_secret)', '', { secret: 1 })}
      <label class="switch"><span>نمایش گزینه‌ی «کد را در بله بگیرم»</span><input type="checkbox" data-a="adm-flag" data-k="otp_bale" ${F.otp_bale ? 'checked' : ''}></label>
      <button class="btn line sm" data-a="adm-test" data-v="bale">آزمون اتصال</button>${out('t-bale')}
      ${tplGuide(`<p class="muted small">در پنل سفیر بله کسب‌وکار را ثبت کنید و سرویس «ارسال کد یکبارمصرف (OTP)» را بگیرید؛ client_id و client_secret را این بالا بگذارید. مشخصاتی که می‌خواهد:</p>
        <div class="tpl"><div class="row between"><span>نام سرویس</span>${cp('رسیدیم')}</div><pre>رسیدیم</pre></div>
        <div class="tpl"><div class="row between"><span>وب‌سایت</span>${cp('https://residim.ir')}</div><pre dir="ltr">https://residim.ir</pre></div>
        <div class="tpl"><div class="row between"><span>توضیح کوتاه</span>${cp('ارسال کد ورود یکبارمصرف برای کاربران سرویس مشارکتی رفت‌وآمد رسیدیم')}</div><pre>ارسال کد ورود یکبارمصرف برای کاربران سرویس مشارکتی رفت‌وآمد رسیدیم</pre></div>`)}</section>
    <section class="card stack"><h2>اعلان اپ وقتی بسته است (Firebase)</h2><p class="muted small">برای اینکه «سرویس دم در است» و خبرهای مهم حتی با اپ بسته برسد: ۱) در console.firebase.google.com پروژه بسازید و اپ اندروید با شناسه‌ی <b dir="ltr">ir.residim.app</b> اضافه کنید؛ فایل <b dir="ltr">google-services.json</b> را با FTP در <b dir="ltr">app/storage/android/</b> بگذارید و از Actions «Android app» را دوباره اجرا کنید. ۲) در Project settings ← Service accounts یک کلید JSON بسازید و کل متنش را اینجا بچسبانید.</p>
      ${secRow(K, 'fcm_service_json', 'JSON حساب سرویس', '{"type":"service_account",…}', { secret: 1 })}<div class="row wrap"><button class="btn line sm" data-a="adm-push-test">فرستادن اعلان آزمایشی به گوشی‌های خودم</button></div></section>
    <section class="card stack"><h2>نقشه‌ی نشان</h2>${secRow(K, 'neshan_service_key', 'کلید سرویس (service.…)', 'service.xxxxxxxx', { secret: 1 })}${secRow(K, 'neshan_web_key', 'کلید نقشه‌ی وب (web.…)', 'web.xxxxxxxx', { secret: 1 })}
      <button class="btn line sm" data-a="adm-test" data-v="neshan">آزمون کلید سرویس</button>${out('t-neshan')}</section>
    <section class="card stack"><h2>پیام همگانی بالای اپ</h2><p class="muted small">مثلاً «امشب ساعت ۲۳ تا ۲۴ به‌روزرسانی داریم.» خالی = پنهان.</p>
      <div class="field"><input id="st-notice" value="${esc(ST.notice || '')}" maxlength="300"></div><div class="row"><button class="btn sm" data-a="adm-set" data-k="notice">ذخیره</button>${ST.notice ? '<button class="link" data-a="adm-clear" data-k="notice">برداشتن</button>' : ''}</div></section></div>`;
}
function admPays(A) {
  const P = A.pays; if (!P) { api('admin_payments', {}, true).then(r => { A.pays = r; renderMain(); }).catch(fail); return '<p class="muted">در حال خواندن…</p>'; }
  const lbl = { init: 'شروع', sent: 'در درگاه', paid: 'موفق ✓', canceled: 'لغو', failed: 'خطای درگاه', verify_failed: 'تأیید نشد' };
  return `<div class="grid"><div class="stat"><b>${money(P.sum_live)}</b><span>جمع حمایت‌های واقعی</span></div><div class="stat"><b>${fa(P.list.filter(x => x.status === 'paid' && x.env === 'live').length)}</b><span>پرداخت موفق</span></div><div class="stat"><b>${fa(P.list.filter(x => x.env === 'test').length)}</b><span>پرداخت آزمایشی</span></div></div>
    <section class="card"><h2>پرداخت‌ها</h2>${P.list.length ? pager('pays', P.list, x => `<tr class="${x.status === 'paid' ? '' : 'dimrow'}"><td dir="ltr" class="small">${esc(x.ref)}${x.env === 'test' ? ' <span class="tag">تست</span>' : ''}</td><td>${money(x.amount)}</td><td>${lbl[x.status] || esc(x.status)}${x.note ? `<br><span class="muted small">${esc(x.note)}</span>` : ''}</td><td class="small">${esc(x.name || '')}<br><span dir="ltr">${esc(x.mobile || '')}</span></td><td class="small muted">${esc(new Date(x.created * 1000).toLocaleString('fa-IR'))}${x.refid ? '<br>پیگیری: <span dir="ltr">' + esc(x.refid) + '</span>' : ''}</td></tr>`, x => `<table><tr><th>کد</th><th>مبلغ</th><th>وضعیت</th><th>پرداخت‌کننده</th><th>زمان</th></tr>${x}</table>`) : '<p class="muted">هنوز پرداختی نیست.</p>'}</section>`;
}
function admHealth(A) {
  const E = A.errs, B = A.bk; if (!E || !B) { Promise.all([api('admin_errors', {}, true), api('admin_backups', {}, true), api('health', {}, true)]).then(([e, b, h]) => { A.errs = e.list; A.bk = b; A.hl = h; renderMain(); }).catch(fail); return '<p class="muted">در حال خواندن…</p>'; }
  const H = A.hl || {};
  return `<div class="grid">${[['db', 'پایگاه داده', H.db], ['storage_writable', 'پوشه‌ی داده قابل نوشتن', H.storage_writable], ['sms', 'پیامک آماده', H.sms], ['pay', 'درگاه آماده', H.pay]].map(([k, t, ok]) => `<div class="stat"><b>${ok ? '✓' : '✗'}</b><span>${t}</span></div>`).join('')}<div class="stat"><b>${fa(H.disk_free_mb || 0)}</b><span>مگابایت فضای خالی</span></div></div>
    <section class="card stack"><div class="row between"><h2>خطاها (${fa(E.length)})</h2>${E.length ? '<button class="link" data-a="err-clear">پاک کردن همه</button>' : ''}</div><p class="muted small">خطاهای مرورگر کاربران و سرور، یکجا و بدون تکرار. اگر چیزی اینجا زیاد شد، همان را اول درست کنیم.</p>
      ${E.length ? pager('errs', E, x => `<div class="msg-card"><b class="small">${x.src === 'client' ? 'مرورگر' : x.src === 'pay' ? 'پرداخت' : 'سرور'} · ${fa(x.n)} بار · ${esc(new Date(x.last * 1000).toLocaleString('fa-IR'))}</b><span dir="ltr" class="small" style="text-align:left;word-break:break-word">${esc(x.msg)}</span>${x.at_url ? `<span class="muted small" dir="ltr">${esc(x.at_url)}</span>` : ''}</div>`) : '<p class="hint">' + ic('check') + '<span>خطایی ثبت نشده.</span></p>'}</section>
    <section class="card stack"><h2>نسخه‌ی پشتیبان روزانه</h2><p class="muted small">${B.engine === 'sqlite' ? 'هر روز با اولین بازدید یک نسخه‌ی کامل از پایگاه داده در پوشه‌ی بسته‌ی app/storage/backups ساخته می‌شود؛ ۱۴ روز آخر نگه داشته می‌شود. برای دانلود از cPanel (File Manager) بردارید.' : 'روی MySQL هستید؛ پشتیبان را از cPanel (Backup یا phpMyAdmin) بگیرید.'}</p>
      ${B.list.length ? `<table><tr><th>فایل</th><th>حجم</th></tr>${B.list.slice(0, 14).map(x => `<tr><td dir="ltr">${esc(x.name)}</td><td>${fa(x.mb)} MB</td></tr>`).join('')}</table>` : '<p class="muted small">هنوز نسخه‌ای ساخته نشده.</p>'}
      ${B.engine === 'sqlite' ? '<button class="btn line sm" data-a="bk-now">همین حالا پشتیبان بگیر</button>' : ''}</section>`;
}
function admHome(A) {
  const o = A.ov, cnt = o.counts, F = o.flags, SV = o.services, ST = o.settings || {};
  const flagLbl = { bismillah: 'بسم الله الرحمن الرحیم در صفحه‌ی آغاز', price_poll: 'نظرسنجی قیمت منصفانه (بعد از دو سفر واقعی، یک بار)', trip_window: 'اجرای واقعی: سفر فقط در بازه‌ی زمانی خودش ثبت شود (خاموش = حالت آزمایش، همه‌چیز ثبت می‌شود)', trusted_driver: 'راننده‌ی معتمد (فقط برای مکان‌هایی که در زبانه‌ی مکان‌ها روشن شود)', family_link: 'همراه خانواده (همسر، پدربزرگ و مادربزرگ رخدادها را ببینند)', cand_swipe: 'پیشنهادهای هم‌مسیر به شکل کارت‌های ورق‌خوردنی (گوشی)', trip_scene: 'صحنه‌ی کارتونی سفر (ماشین، ایستگاه خانه‌ها، ابرهای پیام)', pay_gateway: 'پرداخت دنگ خیر از درگاه پی‌پینگ', signup_open: 'ثبت‌نام باز است', sms_invite: 'پیامک دعوت هم‌مسیری', sms_direct: 'پیامک مستقیم بدون الگو (روشن = sms/send؛ خاموش = اعتبارسنجی و الگو)', sms_arrive: 'پیامک «فرزندتان رسید» (فقط تیم‌های ویژه)', auto_arrive: 'تشخیص رسیدن با GPS', station_on: 'مسیرک سفر (ایستگاه، فرودگاه، ترمینال)', league_on: 'لیگ راه مدرسه (معما)', paid_mode: 'حالت پولی؛ اشتراک لازم است (خاموش = همه‌چیز رایگان)', test_tools: 'گزینه‌های آزمایشی در منو', otp_dev: 'کد ورود آزمایشی بدون پیامک (فقط تست!)' };
  return `<div class="grid">${[['users', 'کاربر واقعی'], ['complete', 'مسیرکِ کامل'], ['places', 'مکان'], ['teams', 'تیم'], ['invites', 'دعوت منتظر'], ['tickets', 'پیام باز'], ['sms_day', 'پیامک ۲۴ ساعت'], ['app_users', 'نصب اپ اندروید'], ['fb', 'نظر و پیشنهاد'], ['fake', 'کاربر آزمایشی']].map(([k, v]) => `<div class="stat"><b>${fa(cnt[k] || 0)}</b><span>${v}</span></div>`).join('')}</div>
    <details class="card adm-more" data-dk="adm-app" ${(ui.dOpen || {})['adm-app'] ? 'open' : ''}><summary><b>${ic('install')}اپ اندروید</b></summary>
      <p class="muted small">نسخه و لینک اپ را ساخت خودکار (GitHub Actions) در residim.ir/app/android.json می‌نویسد؛ این دو فیلد فقط برای جایگزینی دستی‌اند.</p>
      <div class="adm-form"><div class="field"><label for="st-app_ver">نسخه‌ی اپ (دستی)</label><input id="st-app_ver" dir="ltr" value="${esc(ST.app_ver || '')}"></div><div class="field"><label for="st-app_url">لینک دانلود (دستی)</label><input id="st-app_url" dir="ltr" value="${esc(ST.app_url || '')}" placeholder="https://residim.ir/app/residim.apk"></div></div>
      <div class="row wrap"><button class="btn sm" data-a="adm-set" data-k="app_ver">ذخیره‌ی نسخه</button><button class="btn sm" data-a="adm-set" data-k="app_url">ذخیره‌ی لینک</button></div>
      <p class="muted small">نکته‌های تربیتی: زبانه‌ی «نکته‌ها».</p></details>
    <div class="adm-cols"><section class="card"><h2>سرویس‌ها</h2>${[['db', 'پایگاه داده: ' + (ST.engine || SV.db), true], ['kavenegar', 'کاوه‌نگار', SV.kavenegar], ['neshan_service', 'کلید سرویس نشان (فاصله، نام محله، تأیید مکان)', SV.neshan_service], ['neshan_web', 'کلید نقشه‌ی وب نشان', SV.neshan_web], ['curl', 'cURL روی سرور', SV.curl]].map(([k, t, ok]) => `<div class="switch"><span><i class="${ok ? 'ok-dot' : 'no-dot'}"></i>${t}</span><span class="muted small">${ok ? 'فعال' : 'تنظیم نشده'}</span></div>`).join('')}
      <p class="muted small">PHP ${esc(SV.php)}</p></section>
    <section class="card"><h2>کلیدهای امکانات</h2>${Object.keys(flagLbl).map(k => `<label class="switch"><span>${flagLbl[k]}</span><input type="checkbox" data-a="adm-flag" data-k="${k}" ${F[k] ? 'checked' : ''}></label>`).join('')}</section>
    <section class="card stack"><h2>نقشه و اشتراک</h2>
      <div class="field"><label for="st-map">نقشه‌ی کاربران</label><select id="st-map" data-a="adm-set" data-k="map_provider"><option value="neshan" ${ST.map_provider !== 'openfree' ? 'selected' : ''}>نشان (کلید وب لازم است)</option><option value="openfree" ${ST.map_provider === 'openfree' ? 'selected' : ''}>OpenFreeMap (رایگان)</option></select></div>
      <div class="adm-form three">${[['sub_price', 'قیمت اشتراک ماهانه (تومان)'], ['free_permanent', 'مسیرک دائمی رایگان'], ['free_temp_month', 'مسیرک سفر رایگان در ماه']].map(([k, l]) => `<div class="field"><label for="st-${k}">${l}</label><input id="st-${k}" inputmode="numeric" dir="ltr" value="${esc(ST[k] ?? '')}"><button class="link" data-a="adm-set" data-k="${k}">ذخیره</button></div>`).join('')}</div>
      <h3>اشتراک دستی برای یک کاربر</h3><div class="adm-form"><div class="field"><label for="pu-ph">شماره</label><input id="pu-ph" dir="ltr" inputmode="tel" placeholder="0912…"></div><div class="field"><label for="pu-d">روز (۰ = لغو)</label><input id="pu-d" inputmode="numeric" dir="ltr" value="30"></div></div><button class="btn line sm" data-a="adm-puser">ثبت اشتراک</button>
      <p class="muted small">${fa(ST.sub_interest || 0)} نفر «خبرم کنید» زده‌اند.</p></section>
    <section class="card stack"><h2>دنگ خیر (حمایت از رسیدیم)</h2><p class="muted small">شماره کارت و نام صاحب کارت در منوی کاربران دیده می‌شود. خالی بگذارید تا گزینه پنهان شود.</p>
      <div class="adm-form"><div class="field full"><label for="st-donate_card">شماره کارت (۱۶ رقم)</label><input id="st-donate_card" dir="ltr" inputmode="numeric" value="${esc(ST.donate_card || '')}" placeholder="6037…"></div><div class="field full"><label for="st-donate_name">به نام</label><input id="st-donate_name" value="${esc(ST.donate_name || '')}" placeholder="مثلاً رسیدیم (نام صاحب کارت)"></div></div>
      <div class="row wrap"><button class="btn line sm" data-a="adm-set" data-k="donate_card">ذخیره‌ی کارت</button><button class="btn line sm" data-a="adm-set" data-k="donate_name">ذخیره‌ی نام</button></div></section></div>`;
}
function admMsgs(A) {
  const L = A.tickets || [];
  return `<section class="card stack"><h2>پیام‌ها و تیکت‌ها</h2><p class="muted small">فرم «تماس با ما» (حتی بدون حساب) و تیکت‌های کاربران. پیام‌های تازه با نقطه‌ی رنگی مشخص‌اند.</p>
    ${L.length ? pager('msgs', L, t => `<div class="msg-card ${+t.seen ? '' : 'new'} ${t.status === 'closed' ? 'closed' : ''}"><div class="row between wrap"><b>#${fa(t.no)} · ${esc(t.cat)}</b><span class="tag">${t.status === 'open' ? 'باز' : t.status === 'answered' ? 'پاسخ داده شد' : 'بسته'}</span></div>
      <div class="small muted">${esc(t.name || '')}${t.name ? ' · ' : ''}<span dir="ltr">${esc(t.contact || t.phone || 'بدون راه تماس')}</span> · ${esc(new Date(t.created * 1000).toLocaleString('fa-IR'))}</div>
      <p style="margin:6px 0;line-height:1.9;white-space:pre-wrap">${esc(t.text)}</p>
      <div class="row wrap">${(t.contact || t.phone) && /^[0-9+]{10,}$/.test(en(t.contact || t.phone).replace(/\s/g, '')) ? `<a class="btn line sm" href="tel:${esc(en(t.contact || t.phone).replace(/\s/g, ''))}">${ic('phone')}تماس</a>` : ''}${/@/.test(t.contact || '') ? `<a class="btn line sm" href="mailto:${esc(t.contact)}">ایمیل</a>` : ''}</div>
      <div class="row"><div class="field grow"><input id="rep-${t.id}" value="${esc(t.reply || '')}" placeholder="${t.phone ? 'پاسخ (کاربر در اپ می‌بیند)' : 'یادداشت پاسخ'}"></div><button class="btn sm" data-a="adm-reply" data-id="${t.id}">ثبت</button><button class="link" data-a="adm-tclose" data-id="${t.id}" data-v="${t.status === 'closed' ? 1 : 0}">${t.status === 'closed' ? 'بازکردن' : 'بستن'}</button></div></div>`) : '<p class="muted">پیامی نیست.</p>'}</section>`;
}
function admPlaces(A) {
  return `<section class="card"><h2>مکان‌ها (${fa(A.places.length)})</h2>${pager('places', A.places, p => `<tr class="${p.flags ? 'flagged' : ''}"><td>${esc(p.name)}${p.nv ? ' <span class="nv">' + ic('check') + 'نشان</span>' : ''}${p.flags ? ` <span class="tag warn">${fa(p.flags)} گزارش</span>` : ''}<br><span class="muted small">${esc(p.city)} · ${esc((KINDS[p.kind] || KINDS.other).n)}</span><div class="row wrap" style="gap:4px;margin-top:4px">${p.nv ? '' : `<button class="link" data-a="adm-nv" data-id="${p.id}">بررسی با نشان</button>`}<button class="link danger" data-a="adm-pdel" data-id="${p.id}" data-n="${esc(p.name)}" data-f="${p.families}">حذف</button><button class="link" data-a="adm-trust" data-id="${p.id}" data-v="${p.trusted ? 0 : 1}">راننده‌ی معتمد: ${p.trusted ? 'روشن' : 'خاموش'}</button></div></td><td dir="ltr">${esc(p.code)}</td><td>${fa(p.families)}</td><td><input type="checkbox" data-a="adm-verify" data-id="${p.id}" ${p.verified ? 'checked' : ''} aria-label="تأیید"></td></tr>`, x => `<table><tr><th>نام</th><th>کد</th><th>خانواده</th><th>تأیید</th></tr>${x}</table>`)}</section>
    <section class="card"><h2>تیم‌ها (ویژه = پیامک رسیدن و رسید خودکار)</h2>${pager('teams', A.teams, t => `<tr><td>تیم ${fa(t.no)} · ${esc(t.hood)}</td><td>${esc(t.place || '')}</td><td>${fa(t.members)}</td><td><input type="checkbox" data-a="adm-premium" data-id="${t.id}" ${t.premium ? 'checked' : ''} aria-label="ویژه"></td></tr>`, x => `<table><tr><th>تیم</th><th>مکان</th><th>اعضا</th><th>ویژه</th></tr>${x}</table>`)}</section>`;
}
const APP_BADGE = '<span class="app-b" title="از اپ اندروید استفاده می‌کند"><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><rect x="5" y="2" width="10" height="16" rx="3" fill="#16A34A"/><rect x="7" y="4.5" width="6" height="8" rx="1" fill="#DCFCE7"/><circle cx="8.6" cy="8" r=".9" fill="#0C1410"/><circle cx="11.4" cy="8" r=".9" fill="#0C1410"/><path d="M8.5 10.2q1.5 1.2 3 0" stroke="#0C1410" stroke-width=".8" fill="none" stroke-linecap="round"/><circle cx="10" cy="15.3" r="1" fill="#DCFCE7"/></svg></span>';
/* ═════════ admin: live activity (testing phase) ═════════ */
const EV = { user: ['🎉', 'ok', 'کاربر تازه'], signup: ['🏁', 'ok', 'ثبت‌نام کامل'], login: ['🔑', '', 'ورود'], otp: ['✉️', '', 'کد ورود'], place: ['📍', '', 'مکان تازه'], invite: ['🤝', 'info', 'پیشنهاد'], team: ['👨‍👩‍👧', 'ok', 'تیم'], trip: ['🚗', 'info', 'سفر'], urgent: ['⚡', 'warn', 'فوری'], fb: ['⭐', '', 'نظر'], ticket: ['🎫', 'warn', 'پشتیبانی'], price: ['💬', '', 'قیمت'] };
function evTick() { if (!ui.admin || !S.admin || document.hidden) return; api('admin_events', { after: ui.evAt || Math.floor(Date.now() / 1000) - 86400 * 3 }, true).then(r => {
    const old = new Set((ui.ev || []).map(e => e.id)), fresh = r.list.filter(e => !old.has(e.id)); ui.evToday = r.today;
    ui.ev = [...fresh, ...(ui.ev || [])].slice(0, 300); if (r.list.length) ui.evAt = Math.max(ui.evAt || 0, r.list[0].at - 1);
    if (ui.evPrimed && fresh.length) { const big = fresh.filter(e => ['user', 'signup', 'team', 'urgent', 'ticket'].includes(e.kind) || (e.kind === 'otp' && e.meta && e.meta.ok === false));
      if (ui.admTab !== 'live') ui.evNew = (ui.evNew || 0) + fresh.length; if (big.length) { if (S.evSound !== false) snd(big[0].kind === 'urgent' || big[0].kind === 'ticket' ? 'honk' : 'ok'); toast((EV[big[0].kind] || ['•'])[0] + ' ' + big[0].text); } }
    ui.evPrimed = true; if (ui.admTab === 'live' || ui.admTab === 'home' || fresh.length && ui.evNew) { const y = scrollY; renderMain(); scrollTo(0, y); } }).catch(() => {}); }
setInterval(evTick, 5000);
function admLive(A) { ui.evNew = 0; if (!ui.evPrimed) { evTick(); }
  const L = (ui.ev || []).filter(e => !ui.evF || e.kind === ui.evF || (ui.evF === 'sms' && e.kind === 'otp')), T = ui.evToday || {}, ago = t => { const m = Math.floor((Date.now() / 1000 - t) / 60); return m < 1 ? 'همین حالا' : m < 60 ? fa(m) + ' دقیقه پیش' : m < 1440 ? fa(Math.floor(m / 60)) + ' ساعت پیش' : jLabel(new Date(t * 1000)); };
  const fails = (ui.ev || []).filter(e => e.kind === 'otp' && e.meta && e.meta.ok === false).length, sent = (ui.ev || []).filter(e => e.kind === 'otp').length;
  return `<div class="grid">${[[T.user || 0, 'کاربر تازه امروز'], [T.signup || 0, 'ثبت‌نام کامل امروز'], [T.team || 0, 'تیم امروز'], [sent ? fa(Math.round(100 * (sent - fails) / sent)) + '٪' : '—', 'موفقیت پیامک کد']].map(([v, t]) => `<div class="stat"><b>${typeof v === 'number' ? fa(v) : v}</b><span>${t}</span></div>`).join('')}</div>
    <section class="card stack"><div class="row between"><h2>${ic('radio')}رخدادهای زنده</h2><label class="switch" style="margin:0"><span class="small">صدا</span><input type="checkbox" data-a="ev-sound" ${S.evSound !== false ? 'checked' : ''}></label></div>
      <p class="muted small">هر ۵ ثانیه تازه می‌شود؛ تا وقتی این صفحه باز است، رخدادهای مهم با صدا و پیام کوچک هم خبر داده می‌شوند. شماره‌ها نیمه‌پنهان‌اند.</p>
      <div class="chips">${[['', 'همه'], ['signup', 'ثبت‌نام'], ['user', 'کاربر تازه'], ['sms', 'پیامک'], ['invite', 'پیشنهاد'], ['team', 'تیم'], ['trip', 'سفر'], ['urgent', 'فوری'], ['ticket', 'پشتیبانی']].map(([k, v]) => `<button class="chip" data-a="ev-f" data-v="${k}" aria-pressed="${(ui.evF || '') === k}">${v}</button>`).join('')}</div>
      <div class="ev-list">${L.length ? L.slice(0, 120).map(e => { const [ic0, cl] = EV[e.kind] || ['•', '']; const bad = e.kind === 'otp' && e.meta && e.meta.ok === false;
        return `<div class="ev ${bad ? 'bad' : cl}"><span class="ev-ic">${ic0}</span><span class="grow">${esc(e.text)}${e.meta && e.meta.city ? ` <span class="tag">${esc(e.meta.city)}</span>` : ''}${e.meta && e.meta.guest ? ' <span class="tag warn">مهمان</span>' : ''}</span><small>${ago(e.at)}</small></div>`; }).join('') : '<p class="muted">هنوز رخدادی نیست. وقتی کسی ثبت‌نام کند اینجا می‌آید.</p>'}</div></section>`; }
/* ═════════ admin: pre-launch checklist (one place, shortcuts to the real switches) ═════════ */
const LAUNCH = [
  ['امنیت', [['pass', 'رمز پیشخوان عوض شده', 'در config.local.php مقدار admin_pass را عوض کنید.', null], ['backup', 'پشتیبان روزانه‌ی پایگاه داده ساخته می‌شود', 'زبانه‌ی سلامت', 'tab:health'], ['m_keybk', 'از کلید امضای اپ (app/storage/android) نسخه‌ی پشتیبان آفلاین گرفتم', '', 'manual']]],
  ['ورود و پیامک', [['sms', 'سرویس پیامک تنظیم شده', 'زبانه‌ی اتصال‌ها', 'tab:conn'], ['sms_ok', 'در ۷ روز اخیر دست‌کم یک پیامک موفق', 'یک ورود واقعی امتحان کنید', 'tab:sms'], ['otp_dev', 'کد آزمایشی خاموش است', '', 'flag:otp_dev:0'], ['m_tpl', 'خط آخر الگوی پیامک «@residim.ir #کد» است', 'برای خواندن خودکار کد', 'manual']]],
  ['داده و آزمایش', [['fake', 'هیچ کاربر آزمایشی نمانده', 'زبانه‌ی کاربران ← حذف همه‌ی آزمایشی‌ها', 'tab:users'], ['test_tools', 'ابزار آزمایشی منو خاموش است', '', 'flag:test_tools:0'], ['places', 'مدرسه‌های شهرهای هدف وارد شده‌اند', 'پوستر مدارس ← ورود از OSM', 'tab:posters']]],
  ['اجرای واقعی', [['trip_window', 'سفر فقط در بازه‌ی زمانی خودش ثبت می‌شود', '', 'flag:trip_window:1'], ['league', 'لیگ خاموش است (فعلاً)', '', 'flag:league_on:0'], ['signup', 'ثبت‌نام باز است', '', 'flag:signup_open:1']]],
  ['اپ و اعلان', [['app', 'اپ اندروید منتشر شده', 'residim.ir/app/residim.apk', null], ['fcm', 'اعلان با اپ بسته (Firebase)', 'اختیاری؛ اتصال‌ها', 'tab:conn'], ['neshan', 'کلید سرویس نشان', 'اختیاری؛ اتصال‌ها', 'tab:conn']]],
  ['محتوا و اعتماد', [['m_rules', 'قوانین و حریم خصوصی را خواندم و تأیید کردم', '', 'manual'], ['m_tips', 'نکته‌های تربیتی (اختیاری) با منبع دقیق', 'زبانه‌ی نکته‌ها', 'manual'], ['m_human', '۳ تا ۵ خانواده یک هفته آزمایش واقعی کردند', '', 'manual'], ['m_poster', 'پوستر مدرسه‌های اول چاپ و نصب شد', '', 'manual']]],
  ['ظرفیت', [['mysql', 'پایگاه داده‌ی MySQL (برای بیش از چند صد کاربر)', 'اختیاری در شروع', 'tab:db']]]];
function admLaunch(A) { if (!ui.launch) { api('admin_launch', {}, true).then(r => { ui.launch = r; renderMain(); }).catch(fail); api('admin_price', {}, true).then(r => { ui.price = r; renderMain(); }).catch(() => {}); return '<p class="muted">در حال بررسی…</p>'; }
  const L = ui.launch, st = k => k.startsWith('m_') ? !!L.manual[k] : !!L.auto[k]; let all = 0, done = 0; LAUNCH.forEach(([, it]) => it.forEach(([k]) => { all++; if (st(k)) done++; }));
  const pr = ui.price;
  return `<section class="card launch-hero"><div class="lh-ring" style="--p:${Math.round(100 * done / all)}"><b>${fa(done)}/${fa(all)}</b></div><div><h2>آمادگی لانچ</h2><p class="muted small">موارد خودکار از خود سامانه خوانده می‌شوند؛ موارد دستی را بعد از انجام تیک بزنید. هر دکمه مستقیم به همان تنظیم می‌رود.</p><button class="btn line sm" data-a="launch-refresh">بررسی دوباره</button></div></section>
    ${LAUNCH.map(([g, it]) => `<section class="card"><h2>${g}</h2>${it.map(([k, t, h, sc]) => { const ok = st(k), man = k.startsWith('m_'), [kind, a1, a2] = (sc || '').split(':');
      return `<div class="lc ${ok ? 'ok' : 'no'}">${man ? `<input type="checkbox" data-a="launch-man" data-k="${k}" ${ok ? 'checked' : ''} aria-label="${esc(t)}">` : `<span class="lc-dot">${ok ? '✓' : '!'}</span>`}<span class="grow"><b>${t}</b>${h ? `<small>${esc(h)}</small>` : ''}</span>${!ok && kind === 'tab' ? `<button class="btn line sm" data-a="adm-tab" data-v="${a1}">برو</button>` : ''}${!ok && kind === 'flag' ? `<button class="btn sm" data-a="launch-flag" data-k="${a1}" data-v="${a2}">${a2 === '1' ? 'روشن کن' : 'خاموش کن'}</button>` : ''}</div>`; }).join('')}</section>`).join('')}
    <section class="card stack"><h2>${ic('money')}قیمت منصفانه (نظرسنجی کاربران)</h2>${pr && pr.n ? `<p>از ${fa(pr.n)} پاسخ: میانه‌ی «منصفانه» <b>${money(pr.fair_median)}</b> · میانه‌ی «گران است» <b>${money(pr.high_median)}</b></p>
      <div class="grid">${[['۵۰ هزار', pr.accept_50], ['۷۵ هزار', pr.accept_75], ['۱۰۰ هزار', pr.accept_100]].map(([t, v]) => `<div class="stat"><b>${v == null ? '—' : fa(v) + '٪'}</b><span>هنوز می‌خرند در ${t}</span></div>`).join('')}</div>` : '<p class="muted small">هنوز پاسخی نیست. کلید «نظرسنجی قیمت» را در نمای کلی روشن کنید؛ بعد از دو سفر واقعی، یک بار از هر خانواده می‌پرسد.</p>'}
      <p class="muted small">اشتراک (کلید «حالت پولی») خاموش است. قیمت فعلی در تنظیمات: ${money(+A.ov.settings.sub_price || 75000)}.</p></section>`; }
function admContent(A) {
  const ST = A.ov.settings || {}; if (!ui.tipsEd) { try { ui.tipsEd = JSON.parse(ST.tips || '[]'); } catch (e) { ui.tipsEd = []; } if (!Array.isArray(ui.tipsEd)) ui.tipsEd = []; }
  const ages = [['', 'همه'], ['0-7', '۰ تا ۷'], ['7-14', '۷ تا ۱۴'], ['14-21', '۱۴ تا ۲۱']];
  return `<section class="card stack"><h2>${ic('book')}نکته‌های تربیتی بالای گفتگو</h2><p class="muted small">فقط متن‌هایی را بگذارید که تیم محتوا با منبع دقیق بررسی کرده است. سن = سن فرزندانی که نکته برای خانواده‌شان نمایش داده می‌شود. تا وقتی فهرست خالی است، ردیف نکته‌ها نمایش داده نمی‌شود.</p>
      <div class="row wrap"><button class="btn line sm" data-a="tips-dl">${ic('download')}دانلود JSON</button><label class="btn line sm" style="cursor:pointer">${ic('plus')}بارگذاری JSON<input type="file" accept="application/json,.json" id="tips-up" hidden></label><button class="btn line sm" data-a="tips-add">${ic('plus')}نکته‌ی تازه</button></div>
      ${ui.tipsEd.length ? ui.tipsEd.map((t, i) => `<div class="tip-ed"><textarea data-ti="${i}" data-tf="t" rows="2" placeholder="متن نکته">${esc(t.t || '')}</textarea><div class="row wrap"><input data-ti="${i}" data-tf="s" value="${esc(t.s || '')}" placeholder="منبع دقیق (کتاب، جلد، صفحه)" style="flex:2"><select data-ti="${i}" data-tf="a">${ages.map(([k, v]) => `<option value="${k}" ${String(t.a || '') === k ? 'selected' : ''}>${v}</option>`).join('')}</select><button class="icon-btn sm danger" data-a="tips-del" data-i="${i}" aria-label="حذف">${ic('close')}</button></div></div>`).join('') : '<p class="muted">هنوز نکته‌ای ثبت نشده.</p>'}
      <button class="btn" data-a="tips-save">ذخیره (${fa(ui.tipsEd.length)} نکته)</button></section>`;
}
function admFb(A) {
  if (!A.fb) { api('admin_fb', {}, true).then(r => { A.fb = r; renderMain(); }).catch(fail); return '<p class="muted">در حال بارگذاری…</p>'; }
  const F = A.fb, cats = {}; F.list.forEach(x => cats[x.cat] = (cats[x.cat] || 0) + 1);
  return `<div class="grid">${[[F.n ? fa(F.avg) + ' ★' : '—', 'میانگین رضایت'], [fa(F.n), 'امتیاز ثبت‌شده'], [fa(F.list.length), 'کل نظرها'], [fa(cats['نیاز تازه'] || 0), 'نیاز تازه']].map(([v, t]) => `<div class="stat"><b>${v}</b><span>${t}</span></div>`).join('')}</div>
    <section class="card"><h2>نظرها و نیازها</h2><p class="muted small">«نمایش عمومی» یعنی دیگران آن را در فهرست پیشنهادها ببینند و به آن دل بدهند. متن را پیش از نمایش ویرایش کنید (نام و شماره نماند).</p>${pager('fb', F.list, x => `<div class="srow"><b>${'★'.repeat(+x.stars || 0)}${'☆'.repeat(5 - (+x.stars || 0))} <span class="tag">${esc(x.cat)}</span> <span class="muted small">♥ ${fa(x.likes || 0)} · ${jLabel(new Date(x.created * 1000))} · <span dir="ltr">${esc(x.phone || 'مهمان')}</span></span></b><textarea id="fbt-${x.id}" rows="2">${esc(x.text)}</textarea><div class="row wrap"><button class="btn sm ${+x.pub ? 'line' : ''}" data-a="fb-pub" data-id="${x.id}" data-v="${+x.pub ? 0 : 1}">${+x.pub ? 'برداشتن از نمایش' : 'نمایش عمومی'}</button><button class="btn line sm" data-a="fb-del" data-id="${x.id}">حذف</button></div></div>`)}</section>`;
}
function admAmb(A) {
  if (!A.amb) { api('admin_amb', {}, true).then(r => { A.amb = r.list; renderMain(); }).catch(fail); return '<p class="muted">در حال بارگذاری…</p>'; }
  return `<section class="card stack"><h2>سفیر تازه</h2><p class="muted small">هر سفیر یک لینک مخفی (فقط خودش و شما) و یک کد معرفی می‌گیرد. خانواده‌هایی که با لینک‌های او بیایند به اسمش ثبت می‌شوند؛ پورسانت طبق تعرفه‌ی زیر.</p>
      <div class="adm-form three"><div class="field"><label for="am-n">نام</label><input id="am-n"></div><div class="field"><label for="am-p">موبایل</label><input id="am-p" dir="ltr" inputmode="tel"></div><div class="field"><label for="am-note">یادداشت (کارت، مدرسه…)</label><input id="am-note"></div>
      <div class="field"><label for="am-rp">هر ثبت‌نام کامل (تومان)</label><input id="am-rp" dir="ltr" inputmode="numeric" value="20000"></div><div class="field"><label for="am-rt">هر تیم‌شدن (تومان)</label><input id="am-rt" dir="ltr" inputmode="numeric" value="50000"></div></div>
      <button class="btn" data-a="am-save">${ic('plus')}ساختن لینک سفیر</button></section>
    <section class="card"><h2>سفیرها (${fa(A.amb.length)})</h2>${A.amb.length ? A.amb.map(a => `<div class="srow"><b>${esc(a.name)} ${+a.active ? '' : '<span class="tag">غیرفعال</span>'} <span class="muted small" dir="ltr">${esc(a.phone || '')} · ${esc(a.code)}</span></b>
      <span class="small">${fa(a.n)} معرفی · ${fa(a.teams)} تیم · پورسانت ${money(a.sum)} · پرداخت‌شده ${money(a.paid)} · <b>مانده ${money(a.sum - a.paid)}</b>${a.note ? ' · ' + esc(a.note) : ''}</span>
      <div class="row wrap"><button class="btn sm" data-a="copy" data-v="${SITE}/#amb/${esc(a.token)}">${ic('copy')}لینک مخفی سفیر</button>${a.sum - a.paid > 0 ? `<button class="btn line sm" data-a="am-paid" data-id="${a.id}">تسویه شد</button>` : ''}<button class="btn line sm" data-a="am-off" data-id="${a.id}" data-v="${+a.active ? 1 : 0}">${+a.active ? 'غیرفعال کردن' : 'فعال کردن'}</button></div></div>`).join('') : '<p class="muted small">هنوز سفیری نساخته‌اید.</p>'}</section>`;
}
function admUsers(A) {
  return `<section class="card stack"><h2>کاربران آزمایشی</h2><p class="muted small">همسایه‌ی آزمایشی دور یک مکان (کد ۸ حرفی) یا دور خانه‌ی یک کاربر واقعی (شماره) می‌سازد؛ برای دیدن نقشه و تیم‌سازی. پیامکی برایشان نمی‌رود.</p>
      <div class="adm-form three"><div class="field full"><label for="fk-t">کد مکان یا شماره‌ی کاربر</label><input id="fk-t" dir="ltr" placeholder="WPXJUG5A یا 0912…"></div><div class="field"><label for="fk-n">تعداد (حداکثر ۵۰)</label><input id="fk-n" inputmode="numeric" dir="ltr" value="8"></div><div class="field"><label for="fk-d">درصد راننده</label><input id="fk-d" inputmode="numeric" dir="ltr" value="35"></div></div>
      <div class="row wrap">${A.places.slice(0, 6).map(p => `<button class="chip" data-a="fk-fill" data-v="${esc(p.code)}">${esc(p.name)}</button>`).join('')}</div>
      <div class="row wrap"><button class="btn" data-a="adm-fake">${ic('plus')}ساختن کاربران آزمایشی</button><button class="btn line sm" data-a="adm-purge">حذف همه‌ی کاربران آزمایشی</button></div></section>
    <section class="card"><h2>کاربران (${fa(A.users.length)})</h2>${(() => { const dupl = {}; A.users.forEach(u => (u.labels || '').split(',').filter(Boolean).forEach(l => { dupl[l] = (dupl[l] || 0) + 1; })); const U = ui.uq ? A.users.filter(u => (u.phone || 'مهمان').includes(en(ui.uq)) || (u.labels || '').includes(ui.uq)) : A.users;
      return `<div class="row wrap" style="margin-bottom:8px"><input id="adm-uq" placeholder="جستجوی شماره یا نام مسیرک" value="${esc(ui.uq || '')}" style="flex:1"><button class="btn line sm" data-a="adm-uq">جستجو</button></div>` + pager('users', U, u => `<tr><td dir="ltr">${/^android/.test(u.client || '') ? APP_BADGE : ''}${esc(u.phone || 'مهمان')}</td><td>${(u.labels || '').split(',').filter(Boolean).map(l => `<span class="tag ${dupl[l] > 1 && !+u.fake ? 'warn' : ''}">${esc(l)}</span>`).join(' ') || '—'}</td><td>${+u.fake ? 'آزمایشی' : 'واقعی'}${u.phone && +u.profiles && !+u.fake ? ` <button class="link" data-a="adm-fake5" data-v="${esc(u.phone)}">+۵ همسایه</button>` : ''}</td><td><button class="icon-btn sm danger" data-a="adm-udel" data-id="${esc(u.id)}" data-v="${esc(u.phone || 'مهمان')}" aria-label="حذف کاربر">${ic('close')}</button></td></tr>`, x => `<table class="utab"><tr><th>شماره</th><th>مسیرک‌ها</th><th>نوع</th><th></th></tr>${x}</table>`); })()}
      <p class="muted small">نام‌های زرد در بیش از یک حساب تکرار شده‌اند (احتمالاً یک خانواده چند بار ثبت‌نام کرده). حذف کاربر همه‌ی مسیرک‌ها، تیم‌ها و نشست‌هایش را پاک می‌کند.</p></section>`;
}
function admSms(A) {
  const o = A.ov, F = o.flags, SV = o.services, ST = o.settings || {};
  return `<div class="adm-cols"><section class="card stack"><h2>تست پیامک (کاوه‌نگار)</h2><p class="muted small">یک پیامک واقعی می‌فرستد و جواب دقیق کاوه‌نگار را نشان می‌دهد. ${F.sms_direct ? 'حالت فعلی: <b>مستقیم بدون الگو</b>.' : 'حالت فعلی: <b>اعتبارسنجی با الگو</b>.'}</p>
      <div class="adm-form"><div class="field full"><label for="sm-ph">شماره (به خاطر سپرده می‌شود)</label><input id="sm-ph" dir="ltr" inputmode="tel" placeholder="0912…" value="${esc(S.smsPhone || '')}"></div><div class="field"><label for="sm-tpl">${F.sms_direct ? 'نوع پیام' : 'الگو'}</label><select id="sm-tpl">${[SV.tpl_login || 'residim-login', SV.tpl_invite, SV.tpl_arrived].map(t => `<option>${esc(t)}</option>`).join('')}</select></div><div class="field"><label for="sm-type">روش</label><select id="sm-type"><option value="sms">پیامک</option>${F.sms_direct ? '' : '<option value="call">تماس صوتی</option>'}</select></div></div>
      <button class="btn" data-a="adm-smstest">ارسال آزمایشی</button><div id="sm-out"></div></section>
    <section class="card stack"><h2>خط فرستنده‌ی پیامک مستقیم</h2><p class="muted small">خطای ۴۱۲ یعنی خط فرستنده نامعتبر است. شماره‌ی خط را از پنل کاوه‌نگار (بخش «خطوط من») بنویسید؛ با همان صفرهای اولش. خالی = خط پیش‌فرض حساب${ST.kave_sender_auto ? ' (فعلاً <b dir="ltr">' + esc(ST.kave_sender_auto) + '</b>)' : ''}.</p>
      <div class="field"><label for="st-kave_sender">شماره‌ی خط ${ST.kave_sender ? `<span class="tag ok">ذخیره‌شده: <b dir="ltr">${esc(ST.kave_sender)}</b></span>` : ''}</label><input id="st-kave_sender" dir="ltr" inputmode="numeric" value="${esc(ST.kave_sender || '')}" placeholder="مثلاً 0018018949161"></div>
      <div class="row wrap"><button class="btn sm" data-a="adm-set" data-k="kave_sender">ذخیره‌ی خط</button>${ST.kave_sender ? '<button class="btn line sm" data-a="adm-clear" data-k="kave_sender">پاک کردن</button>' : ''}</div></section></div>
    <section class="card"><h2>آخرین پیامک‌ها</h2>${pager('sms', A.sms, s => `<tr><td dir="ltr">${esc(s.phone)}</td><td dir="ltr">${esc(s.tpl)}</td><td>${esc(s.status)}</td><td class="small muted">${esc(new Date(s.created * 1000).toLocaleString('fa-IR'))}</td></tr>`, x => `<table><tr><th>شماره</th><th>الگو</th><th>وضعیت</th><th>زمان</th></tr>${x}</table>`)}</section>`;
}
function admDb(A) {
  const M = A.my; if (!M) { api('admin_mysql_get', {}, true).then(r => { A.my = r; renderMain(); }).catch(fail); return '<p class="muted">در حال خواندن…</p>'; }
  const t = x => x ? new Date(x * 1000).toLocaleString('fa-IR') : '—';
  return `<section class="card stack"><h2>پایگاه داده: الان <span class="tag ${M.engine === 'mysql' ? 'ok' : ''}">${M.engine === 'mysql' ? 'MySQL' : 'SQLite'}</span></h2>
    ${M.locked ? `<p class="hint">${ic('check')}<span>MySQL از config.local.php روشن شده و از اینجا عوض نمی‌شود.</span></p>` : ''}
    ${M.pdo_mysql ? '' : `<p class="hint warn">${ic('warn')}<span>افزونه‌ی pdo_mysql روی سرور فعال نیست؛ از cPanel (Select PHP Version → Extensions) روشنش کنید.</span></p>`}
    <p class="muted small">مشخصات در پوشه‌ی محافظت‌شده‌ی <span dir="ltr">app/storage</span> روی سرور ذخیره می‌شود (نه در گیت و نه قابل دانلود از وب). رمز هیچ‌وقت به مرورگر برنمی‌گردد. در cPanel از «MySQL Databases» یک پایگاه و کاربر بسازید و کاربر را با همه‌ی دسترسی‌ها به پایگاه اضافه کنید.</p>
    <div class="adm-form"><div class="field"><label for="my-host">میزبان</label><input id="my-host" dir="ltr" value="${esc(M.host || 'localhost')}"></div><div class="field"><label for="my-port">درگاه</label><input id="my-port" dir="ltr" inputmode="numeric" value="${esc(M.port || 3306)}"></div>
      <div class="field"><label for="my-name">نام پایگاه</label><input id="my-name" dir="ltr" value="${esc(M.name || '')}" placeholder="cpaneluser_residim"></div><div class="field"><label for="my-user">نام کاربری</label><input id="my-user" dir="ltr" value="${esc(M.user || '')}" autocomplete="off"></div>
      <div class="field full"><label for="my-pass">رمز</label><input id="my-pass" type="password" dir="ltr" autocomplete="new-password" placeholder="${M.pass_set ? 'ذخیره شده؛ برای تغییر بنویسید' : ''}"></div></div>
    <ol class="steps db-steps">
      <li class="${M.tested ? 'done' : ''}"><b>ذخیره و تست دود</b> <span class="muted small">ساخت جدول آزمایشی، نوشتن و خواندن متن فارسی، حذف · آخرین موفق: ${t(M.tested)}</span><div class="row wrap"><button class="btn sm" data-a="my-save" ${M.active ? 'disabled' : ''}>ذخیره</button><button class="btn line sm" data-a="my-test">تست دود</button></div></li>
      <li class="${M.migrated ? 'done' : ''}"><b>انتقال داده از SQLite</b> <span class="muted small">همه‌ی جدول‌ها کپی و شمارش‌شان مقایسه می‌شود؛ SQLite دست نمی‌خورد · آخرین: ${t(M.migrated)}</span><button class="btn line sm" data-a="my-migrate" ${M.tested && !M.active ? '' : 'disabled'}>انتقال</button></li>
      <li class="${M.active ? 'done' : ''}"><b>سوییچ</b> <span class="muted small">از این لحظه همه‌چیز روی MySQL. برگشت به SQLite داده‌های تازه‌ی MySQL را با خود نمی‌برد.</span>${M.active ? '<button class="btn line sm" data-a="my-switch" data-v="0">برگشت به SQLite</button>' : `<button class="btn ac sm" data-a="my-switch" data-v="1" ${M.migrated ? '' : 'disabled'}>سوییچ به MySQL</button>`}</li></ol>
    <div id="my-out"></div></section>`;
}
const CITY_C = { 'قم': [34.6401, 50.8764], 'تهران': [35.7000, 51.4000], 'مشهد': [36.2970, 59.6060], 'اصفهان': [32.6546, 51.6680], 'شیراز': [29.5918, 52.5837], 'تبریز': [38.0800, 46.2919], 'کرج': [35.8400, 50.9391] };
function admCityImport() { const C = ui.cimp = ui.cimp || { city: 'قم', n: 5, step: 3200, log: '' };
  return `<section class="card stack"><h2>${ic('school')}ورود همه‌ی مدرسه‌ها و دانشگاه‌های یک شهر</h2><p class="muted small">شهر را انتخاب کنید؛ شهر به ${fa(C.n * C.n)} خانه‌ی شطرنجی تقسیم می‌شود و در هر خانه با کلیدواژه‌های دبستان، دبیرستان، هنرستان، پیش‌دبستانی، مهد، دانشگاه و آموزشگاه در نشان جستجو می‌شود. موارد تکراری کنار گذاشته می‌شوند و بقیه با تیک «نشان» در فهرست انتخاب مکانِ ویزارد پیدا می‌شوند. هزینه: حدود ${fa(C.n * C.n * 7)} درخواست جستجوی نشان.</p>
    <div class="row wrap"><select id="ci-city">${Object.keys(CITY_C).map(c => `<option ${c === C.city ? 'selected' : ''}>${c}</option>`).join('')}</select><select id="ci-n">${[[3, 'کوچک (۳×۳)'], [5, 'متوسط (۵×۵)'], [7, 'بزرگ (۷×۷)']].map(([k, v]) => `<option value="${k}" ${+C.n === k ? 'selected' : ''}>${v}</option>`).join('')}</select><button class="btn" data-a="ci-run" ${C.busy ? 'disabled' : ''}>${C.busy ? 'در حال اجرا…' : 'شروع'}</button></div>
    <div class="row wrap">${[['qom', 'قم', 191], ['tehran', 'تهران', 2280], ['mashhad', 'مشهد', 488], ['shiraz', 'شیراز', 375], ['yasuj', 'یاسوج', 30]].map(([k, n, c]) => `<button class="btn line sm" data-a="ci-file" data-c="${k}">${ic('download')}${n}: ${fa(c)} مکان</button>`).join('')}<span class="muted small">مدرسه، مهد و دانشگاه از OpenStreetMap؛ بدون هزینه‌ی نشان.</span></div>
    ${C.log ? `<p class="small" id="ci-log">${C.log}</p>` : ''}</section>`; }
function admPosters(A) {
  const P = ui.post = ui.post || { items: null, sel: {}, layout: 'a4', terms: ['دبستان', 'مدرسه', 'دبیرستان'] };
  const schools = A.places.filter(p => ['school', 'kinder'].includes(p.kind)), pick = schools.filter(p => P.sel[p.id]);
  return `${admCityImport()}<div class="adm-cols"><section class="card stack"><h2>۱. پیدا کردن مدرسه‌ها از نقشه‌ی نشان</h2><p class="muted small">مرکز یک منطقه را روی نقشه بگذارید؛ نشان نزدیک‌ترین دبستان‌ها، مدرسه‌ها و دبیرستان‌ها را با نشانی می‌دهد. منطقه به منطقه جلو بروید.</p>
      <div class="row wrap"><button class="btn line sm" data-a="po-center">${ic('map')}${P.lat ? 'جابه‌جایی مرکز' : 'انتخاب مرکز روی نقشه'}</button>${P.lat ? `<span class="small muted" dir="ltr">${P.lat.toFixed(4)}, ${P.lng.toFixed(4)}</span>` : ''}</div>
      <div class="chips">${['دبستان', 'مدرسه', 'دبیرستان', 'پیش دبستانی', 'مهد کودک'].map(t => `<button class="chip" data-a="po-term" data-v="${t}" aria-pressed="${P.terms.includes(t)}">${t}</button>`).join('')}</div>
      <button class="btn" data-a="po-search" ${P.lat ? '' : 'disabled'}>${ic('spark')}جستجو در نشان</button>
      ${P.items ? `<p class="small"><b>${fa(P.items.length)}</b> نتیجه · ${fa(P.items.filter(x => x.code).length)} مورد از قبل ثبت شده</p>
        <div class="po-list">${P.items.map((x, i) => `<label class="po-item ${x.code ? 'had' : ''}"><input type="checkbox" data-a="po-isel" data-i="${i}" ${x.code ? 'disabled checked' : x.sel ? 'checked' : ''}><span class="grow"><b>${esc(x.title)}</b><small>${esc(x.region ? x.region + ' · ' : '')}${esc(x.address)} · ${km1(x.d / 1000)} کیلومتر</small></span>${x.code ? '<span class="tag">ثبت شده</span>' : ''}</label>`).join('')}</div>
        <div class="row wrap"><button class="link" data-a="po-iall">انتخاب همه‌ی تازه‌ها</button><button class="btn sm" data-a="po-import" ${P.items.some(x => x.sel && !x.code) ? '' : 'disabled'}>ثبت انتخاب‌شده‌ها و ساخت لینک</button></div>` : ''}</section>
    <section class="card stack"><h2>۲. پوستر و چاپ دسته‌ای</h2><p class="muted small">هر دسته ۲۰ پوستر است؛ «چاپ / ذخیره‌ی PDF» را بزنید و در پنجره‌ی چاپ «Save as PDF» را انتخاب کنید. روی هر پوستر «(نسخه‌ی آزمایشی)» ریز چاپ می‌شود.</p>
      <div class="chips"><button class="chip" data-a="po-layout" data-v="a4" aria-pressed="${P.layout === 'a4'}">یک A4 در هر برگ</button><button class="chip" data-a="po-layout" data-v="a5" aria-pressed="${P.layout === 'a5'}">دو A5 در هر برگ A4 (با خط برش)</button></div>
      <div class="row wrap"><button class="link" data-a="po-sall">انتخاب همه (${fa(schools.length)})</button><button class="link" data-a="po-snone">هیچ‌کدام</button><span class="small muted">${fa(pick.length)} انتخاب‌شده</span></div>
      <div class="po-list">${schools.map(p => `<label class="po-item"><input type="checkbox" data-a="po-sel" data-id="${p.id}" ${P.sel[p.id] ? 'checked' : ''}><span class="grow"><b>${esc(p.name)}</b><small>${esc(p.city)} · <span dir="ltr">residim.ir/${esc(p.code)}</span> · ${fa(p.families)} خانواده</small></span></label>`).join('') || '<p class="muted">هنوز مدرسه‌ای ثبت نشده.</p>'}</div>
      <div class="row wrap">${Array.from({ length: Math.ceil(pick.length / 20) }, (_, b) => `<button class="btn sm" data-a="po-print" data-b="${b}">${ic('print')}دسته‌ی ${fa(b + 1)} (${fa(b * 20 + 1)}–${fa(Math.min(pick.length, b * 20 + 20))})</button>`).join('') || '<span class="muted small">مدرسه‌ها را انتخاب کنید.</span>'}</div></section></div>`;
}
function posterHtml(pl, mini) {
  const K = KINDS[pl.kind] || KINDS.other, child = K.child !== false, link = `${SITE}/${pl.code}`, pretty = `${SITE_HOST}/${pl.code}`;
  let qr = ''; try { const q = qrcode(0, 'M'); q.addData(link); q.make(); qr = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); } catch (e) {}
  return `<div class="poster ${mini ? 'mini' : ''}"><div class="ph"><b>سرویس مشارکتی!</b><h2>${child ? 'مامان، بابا، رسیدیم!' : 'هم‌مسیریم؟ رسیدیم!'}</h2><span>${esc(child ? HOOK.child : HOOK.adult)}</span></div>
    <div class="car">${artCar('')}</div><h3>${esc(pl.name)}${pl.shift ? ' · ' + esc(pl.shift) : ''}</h3><div class="qr">${qr}</div>
    <p>QR را اسکن کنید یا وارد این لینک شوید:</p><p class="url">${esc(pretty)}</p><b>با رسیدیم همیشه ما زود می‌رسیم!</b><small class="beta">(نسخه‌ی آزمایشی)</small></div>`;
}
function printBatch(list, layout) {
  let root = $('#print-root'); if (!root) { root = document.createElement('div'); root.id = 'print-root'; document.body.appendChild(root); }
  root.className = 'batch ' + layout;
  const pages = []; if (layout === 'a5') for (let i = 0; i < list.length; i += 2) pages.push(`<div class="pg two">${posterHtml(list[i], true)}<div class="cut"></div>${list[i + 1] ? posterHtml(list[i + 1], true) : '<div></div>'}</div>`);
  else list.forEach(pl => pages.push(`<div class="pg">${posterHtml(pl)}</div>`));
  root.innerHTML = pages.join('');
  const done = () => { root.innerHTML = ''; root.className = ''; removeEventListener('afterprint', done); };
  addEventListener('afterprint', done); setTimeout(() => window.print(), 120);
}

async function loadAdmin() {
  try { const [ov, pl, tm, tk, sm, us] = await Promise.all(['admin_overview', 'admin_places', 'admin_teams', 'admin_tickets', 'admin_sms', 'admin_users'].map(a => api(a, {}, true)));
    ui.adm = { ov, places: pl.list, teams: tm.list, tickets: tk.list, sms: sm.list, users: us.list }; renderMain();
    const n = ov.counts.unseen || 0; if (n && ui.admSeenN !== n) { ui.admSeenN = n; snd('ok'); toast(`${fa(n)} پیام تازه در «پیام‌ها» دارید.`); notify('رسیدیم · پیام تازه', `${n} پیام تازه در پیشخوان`); } }
  catch (e) { if (e.code === 'auth' || e.code === 'admin') { S.admin = null; persist(); renderMain(); } fail(e); }
}

/* ═════════ notify / toast ═════════ */
let nId = 1;
async function notify(title, body, at) {
  if (NATIVE && NP.LocalNotifications) { try { await NP.LocalNotifications.schedule({ notifications: [{ id: at ? Math.floor(at / 1000) % 2e9 : (Date.now() % 2e9) + (nId++), title, body, schedule: at ? { at: new Date(at), allowWhileIdle: true } : undefined, smallIcon: 'ic_stat_residim', sound: null, channelId: 'residim' }] }); } catch (e) {} if (!at) haptic('medium'); return; }
  if (at) return; return notifyWeb(title, body);
}
function haptic(k) { try { if (NATIVE && NP.Haptics) NP.Haptics.impact({ style: k === 'heavy' ? 'HEAVY' : k === 'medium' ? 'MEDIUM' : 'LIGHT' }); else if (navigator.vibrate && k && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(k === 'heavy' ? [40, 60, 40] : 18); } catch (e) {} }
async function notifyWeb(title, body) { try { if ('Notification' in window && Notification.permission === 'granted') { const reg = await navigator.serviceWorker?.getRegistration(); if (reg) reg.showNotification(title, { body, icon: 'assets/icon-192.png', lang: 'fa', dir: 'rtl' }); } } catch (e) {} }
let tt; function toast(m) { const el = $('#toast'); el.textContent = m; el.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 4200); }
async function copyText(t) { try { await navigator.clipboard.writeText(t); return true; } catch (e) { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e2) {} a.remove(); return ok; } }

/* ═════════ geofence (auto «رسید») ═════════ */
const GEO = { id: null };
/* location: in the Android app a foreground service keeps tracking with the screen off; on the web the page must stay open */
function geoWatch(cb) {
  if (NATIVE && NP.BackgroundGeolocation) { const h = { native: true, id: null };
    NP.BackgroundGeolocation.addWatcher({ backgroundTitle: 'رسیدیم · سفر در جریان است', backgroundMessage: 'سوار شدن و رسیدن بچه‌ها خودکار ثبت می‌شود.', requestPermissions: true, stale: false, distanceFilter: 15 },
      (loc, err) => { if (err || !loc) return; cb({ coords: { latitude: loc.latitude, longitude: loc.longitude, accuracy: loc.accuracy } }); }).then(id => { h.id = id; }).catch(() => {});
    return h; }
  return navigator.geolocation ? navigator.geolocation.watchPosition(cb, () => {}, { enableHighAccuracy: true, maximumAge: 15000 }) : null;
}
function geoClear(h) { try { if (h && h.native) { if (h.id) NP.BackgroundGeolocation.removeWatcher({ id: h.id }); } else if (h != null) navigator.geolocation.clearWatch(h); } catch (e) {} }
function watchArrival() {
  const p = active(), T = ui.team;
  if (GEO.id != null) { geoClear(GEO.id); GEO.id = null; }
  if (!p || !T || !T.team || !(CFG.flags.auto_arrive || S.liveOK) || !(navigator.geolocation || NATIVE)) return;
  const plan = planOf(T), x = focusSlot(T, plan), r = recOf(T, x, plan);
  if (r.status !== 'started' || r.exec !== p.id) return;
  GEO.dep = 0; GEO.bd = {};
  GEO.id = geoWatch(pos => {
    const { latitude: la, longitude: ln } = pos.coords, ks = ridersOf(T, x.dir).filter(k => !r.arr[k.id]);
    { const ev = (T.trips[x.id] || {}).ev || {}, me2 = mem(T, p.id);
      if (!ev.depart && !GEO.dep && me2 && me2.lat && hav(la, ln, x.dir === 'out' ? me2.lat : T.place.lat, x.dir === 'out' ? me2.lng : T.place.lng) > 150) { GEO.dep = 1; api('team_act', { profile_id: p.id, act: 'depart', slot: x.id }).catch(() => {}); }
      if (x.dir === 'out') for (const m of T.members) { if (m.id === p.id || !m.lat || (ev.bp || {})[m.id] || (GEO.bd || {})[m.id]) continue; if (!ridersOf(T, x.dir).some(k => k.pid === m.id)) continue;
        if (hav(la, ln, m.lat, m.lng) < 70) { GEO.bd = GEO.bd || {}; GEO.bd[m.id] = 1; api('team_act', { profile_id: p.id, act: 'board', slot: x.id, pid: m.id }).then(() => { snd('tap'); offerUndo(`${fam(m)} سوار شدند ✓ (خودکار)`, () => api('team_act', { profile_id: p.id, act: 'unboard', slot: x.id, pid: m.id }).then(() => { GEO.bd[m.id] = 2; loadTeam(); })); loadTeam(); }).catch(() => {}); } } }
    if (S.liveOK && Date.now() - (GEO.sent || 0) > 12000) { GEO.sent = Date.now(); api('live_push', { profile_id: p.id, slot: x.id, lat: la, lng: ln, acc: Math.round(pos.coords.accuracy || 0) }).catch(() => {}); }
    if (!CFG.flags.auto_arrive) return;
    if (!ks.length) return;
    if (x.dir === 'out') { if (hav(la, ln, T.place.lat, T.place.lng) < 150) arrivalBanner(`به ${T.place.name} رسیدید؟`, '*'); }
    else for (const k of ks) { const m = mem(T, k.pid); if (m && hav(la, ln, m.lat, m.lng) < 120) { arrivalBanner(`نزدیک خانه‌ی ${fam(m)} هستید؛ ${kidName(k, m)} رسید؟`, k.id); break; } }
  });
}
/* riders: where is the car? (premium; free while paid_mode is off) */
async function liveTick() {
  const p = active(); let T = ui.team; if (!p || !p.team || !T || !T.team || document.hidden) return;
  let plan = planOf(T), x = focusSlot(T, plan), r = recOf(T, x, plan);
  if (r.status === 'started' && r.exec !== p.id) { const before = JSON.stringify((r.ev || {}).bp || {}) + ((r.ev || {}).depart || ''); await loadTeam(); T = ui.team; plan = planOf(T); r = recOf(T, x, plan);
    const ev = r.ev || {}, after = JSON.stringify(ev.bp || {}) + (ev.depart || '');
    if (after !== before) { const newest = Object.entries(ev.bp || {}).sort((a, b) => b[1] - a[1])[0]; const m = newest && mem(T, newest[0]);
      snd('tap'); haptic('light'); if (m && newest[0] !== r.exec) toast(`${ridersOf(T, x.dir).filter(k => k.pid === m.id).map(k => k.first).filter(Boolean).join(' و ') || fam(m)} سوار شد ✓`); else if (ev.depart) toast(`${fam(mem(T, r.exec))} راه افتادند 🚗`); } }
  if (r.status !== 'started' || r.exec === p.id) { if (ui.live) { ui.live = null; liveMarker(); } return; }
  loadInbox();
  try { const q = await api('live_get', { profile_id: p.id }); ui.liveLocked = !!q.locked; ui.live = q.live; } catch (e) { return; }
  const L = ui.live; if (L && p.data && p.data.lat) {
    L.m = Math.round(hav(L.lat, L.lng, p.data.lat, p.data.lng)); const key = ymd(new Date()) + x.id; S.liveN = S.liveN || {};
    if (L.m <= 1000 && !S.liveN[key]) { S.liveN[key] = 1; persist(); snd('arrive'); notify('ماشین نزدیک است 🚗', `حدود ${L.m} متر تا خانه‌ی شما؛ کم‌کم آماده شوید.`); toast(`ماشین حدود ${fa(L.m)} متر با خانه‌ی شما فاصله دارد؛ کم‌کم آماده شوید.`); }
  }
  { const ord = stopOrder(T, x, r), ev = r.ev || {}, nxt = x.dir === 'out' ? ord.find(m => !(ev.bp || {})[m.id]) : null, key = ymd(new Date()) + x.id; S.liveN = S.liveN || {};
    if (nxt && nxt.id === p.id && Object.keys(ev.bp || {}).length && !S.liveN[key + 'nx']) { S.liveN[key + 'nx'] = 1; persist(); snd('honk'); haptic('heavy'); notify('نفر بعدی شمایید 🚗', 'ماشین تیم به سمت شما می‌آید؛ بچه‌ها آماده باشند.'); toast('نفر بعدی شمایید؛ بچه‌ها آماده باشند! 🚗'); }
    if (L && T.place && T.place.lat && x.dir === 'out' && !ord.some(m => !(ev.bp || {})[m.id]) && hav(L.lat, L.lng, T.place.lat, T.place.lng) < 800 && !S.liveN[key + 'sc']) { S.liveN[key + 'sc'] = 1; persist(); snd('arrive'); notify(`نزدیک ${T.place.name}`, 'تا چند دقیقه‌ی دیگر می‌رسند.'); toast(`ماشین نزدیک ${T.place.name} است؛ تا چند دقیقه‌ی دیگر می‌رسند.`); } }
  liveMarker(); const strip = $('#live-strip'); if (strip) strip.outerHTML = liveStrip();
}
function liveStrip() {
  const L = ui.live;
  if (ui.liveLocked) return `<div class="live" id="live-strip">${ic('car')}<span class="grow">دیدن زنده‌ی ماشین روی نقشه مخصوص اشتراک «همراه» است.</span><button class="btn sm line" data-a="sub-info">بیشتر</button></div>`;
  if (!L) return `<div class="live dim" id="live-strip">${ic('car')}<span class="grow">راننده هنوز موقعیت زنده را روشن نکرده است.</span></div>`;
  return `<div class="live" id="live-strip"><span class="live-dot"></span><span class="grow"><b>${L.m != null ? (L.m < 1000 ? fa(L.m) + ' متر' : km1(L.m / 1000) + ' کیلومتر') : 'ماشین'}</b> تا خانه‌ی شما <small>· ${L.ago < 60 ? 'همین حالا' : fa(Math.round(L.ago / 60)) + ' دقیقه پیش'}</small></span><button class="btn sm" data-a="live-map">${ic('map')}روی نقشه</button></div>`;
}
const CARTOON_CAR = `<svg viewBox="0 0 64 40" aria-hidden="true"><path d="M6 30V21c0-2 1-3 3-3.5l7-1.5 6-8c1-1.4 2.4-2 4-2h14c1.6 0 3 .7 4 2l6 8 5 1c2 .5 3 1.6 3 3.5V30Z" fill="#22C55E" stroke="#04140B" stroke-width="2.2" stroke-linejoin="round"/><path d="M21 16l5-7h6v7Zm14-7h5l5 7H35Z" fill="#BFF3D8" stroke="#04140B" stroke-width="1.8" stroke-linejoin="round"/><circle cx="17" cy="31" r="5.5" fill="#04140B"/><circle cx="47" cy="31" r="5.5" fill="#04140B"/><circle cx="17" cy="31" r="2" fill="#fff"/><circle cx="47" cy="31" r="2" fill="#fff"/><circle cx="58" cy="22" r="1.6" fill="#FFD84D"/></svg>`;
function liveMarker() {
  if (!PM.map || !PM.L) return; const L = ui.live;
  if (!L) { if (PM.car) { PM.car.remove(); PM.car = null; } return; }
  if (!PM.car) { const el = document.createElement('div'); el.className = 'mk-car'; el.innerHTML = CARTOON_CAR + '<span>ماشین تیم</span>'; PM.car = new PM.L.G.Marker({ element: el, anchor: 'bottom' }).setLngLat([L.lng, L.lat]).addTo(PM.map); }
  else { const a = PM.car.getLngLat(), b = [L.lng, L.lat], t0 = performance.now(), el = PM.car.getElement(); if (Math.abs(b[0] - a.lng) > 1e-6) el.classList.toggle('flip', b[0] > a.lng);
    const step = t => { const k = Math.min(1, (t - t0) / 1800); PM.car.setLngLat([a.lng + (b[0] - a.lng) * k, a.lat + (b[1] - a.lat) * k]); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
}
function arrivalBanner(text, kid) {
  if ($('.banner')) return;
  const T = ui.team; const auto = T && T.team && T.team.premium;
  if (auto) { act('t-arrive', { dataset: { k: kid } }); toast('رسیدن خودکار ثبت شد (اشتراک ویژه).'); return; }
  const b = document.createElement('div'); b.className = 'banner'; b.innerHTML = `${ic('pin')}<span class="grow">${esc(text)}</span><button class="btn sm" data-a="t-arrive" data-k="${kid}">بله، ثبت شود</button><button class="icon-btn" style="background:transparent;border-color:#ffffff40;color:#fff" data-a="banner-x" aria-label="بستن">${ic('close')}</button>`;
  $('#main').prepend(b); notify('رسیدیم', text);
}

/* ═════════ actions ═════════ */
async function act(a, el) {
  const p = active(), T = ui.team, w = ui.wiz;
  const plan = T && T.team ? planOf(T) : null, x = plan ? focusSlot(T, plan) : null;
  const tact = async (body, msg) => { try { await api('team_act', { profile_id: p.id, ...body }); await loadTeam(); renderMain(); watchArrival(); if (msg) toast(msg); } catch (e) { if (e.code === 'practice') return practice(body); fail(e); } };
  switch (a) {
    case 'close': return closeLayer();
    case 'notice-x': S.noticeHid = CFG.notice; persist(); return paintNotice();
    case 'copy': return copyText(el.dataset.v).then(ok => toast(ok ? 'کپی شد.' : 'کپی نشد؛ دستی بردارید.'));
    case 'menu': return drawer();
    case 'switcher': return switcher();
    case 'toggle': { const k = el.dataset.v, o = ui.open[k] = !ui.open[k], L = el.nextElementSibling; el.setAttribute('aria-expanded', o); const cv = el.querySelector('.chev'); if (cv) cv.classList.toggle('open', o);
      if (L && L.classList.contains('plist')) { L.style.maxHeight = o ? L.scrollHeight + 'px' : '0px'; L.classList.toggle('closed', !o); } return; }
    case 'dim': return toast('این گزینه ' + (el.dataset.why || 'بعداً') + ' فعال می‌شود.');
    case 'use': { if (el.closest('.side')) { if (el.dataset.id === S.active) { ui.pcol = !ui.pcol; snd('tap'); return renderSide(); } ui.pcol = false; return setActive(el.dataset.id); }
      const inD = !!el.closest('.drawer'); if (el.dataset.id === S.active) { if (!inD) { closeLayer(); return; } ui.pcol = !ui.pcol; snd('tap'); return drawer(true); } ui.pcol = false; const q = allProfiles().find(x => x.id === el.dataset.id);
      if (inD && q && q.complete) { setActive(el.dataset.id); snd('tap'); return drawer(true); } closeLayer(); return setActive(el.dataset.id); }
    case 'about': closeLayer(); return aboutSheet();
    case 'donate': closeLayer(); return donateSheet();
    case 'dn-amt': ui.dn.amt = +el.dataset.v; $('#dn-v').value = fa(ui.dn.amt); $$('[data-a="dn-amt"]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.v === ui.dn.amt)); snd('tap'); return;
    case 'dn-pay': { const amt = +en($('#dn-v').value).replace(/\D/g, ''); if (amt < 10000) return toast('کمترین مبلغ ۱۰ هزار تومان است.'); el.disabled = true; el.textContent = 'در حال رفتن به درگاه…';
      try { const r = await api('pay_start', { amount: amt, name: $('#dn-n').value, mobile: S.phone || '' }); location.href = r.url; } catch (e) { el.disabled = false; el.textContent = 'پرداخت امن با درگاه پی‌پینگ'; fail(e); } return; }
    case 'donate-copy': return copyText(CFG.donate.card).then(ok => { snd('ok'); toast(ok ? 'شماره کارت کپی شد؛ دمتان گرم!' : 'کپی نشد؛ از روی صفحه بردارید.'); });
    case 'contact': closeLayer(); return contactSheet();
    case 'support': closeLayer(); return supportSheet();
    case 'report': return reportPrint();
    case 'amb-make': { const c = en($('#amb-pl').value.trim()).toUpperCase().replace(/.*\//, ''); if (!/^[A-Z2-9]{8}$/.test(c)) return toast('کد ۸ حرفی مکان را درست بنویسید.'); const A = ui.ambA, link = `${SITE}/${c}?r=${A.amb.code}`;
      let qr = ''; try { const q = qrcode(0, 'M'); q.addData(link); q.make(); qr = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); } catch (e) {}
      const cap = `🚗 سرویس مشارکتی مدرسه‌ی ما\nاگر هم‌محله و هم‌مسیریم، چرا هر کدام جدا؟ بچه‌ها را نوبتی ببریم و بیاوریم.\n\nثبت‌نام در ۲ دقیقه:\n${link}\n\n#رسیدیم`;
      $('#amb-out').innerHTML = `<div class="amb-qr">${qr}</div><div class="cardno"><b dir="ltr" class="grow">${esc(link.replace('https://', ''))}</b><button class="btn sm" data-a="copy" data-v="${esc(link)}">${ic('copy')}لینک</button></div><button class="btn line sm" data-a="copy" data-v="${esc(cap)}">${ic('copy')}کپی متن آماده برای گروه‌ها</button>`; return; }
    case 'sup-send': { const t = $('#ct-t').value.trim(); if (t.length < 5) return toast('چند کلمه بیشتر بنویسید تا بهتر کمک کنیم.'); if (!S.token) return act('ct-send', el);
      el.disabled = true; try { const r = await api('ticket', { cat: ui.ct.cat, text: [$('#ct-name').value.trim(), $('#ct-c').value.trim()].filter(Boolean).join(' · ') ? t + '\n— ' + [$('#ct-name').value.trim(), $('#ct-c').value.trim()].filter(Boolean).join(' · ') : t, profile_id: p ? p.id : null }); snd('ok'); closeLayer(); sheet('درخواست شما ثبت شد ✓', `<div class="sup-ok"><b>شماره‌ی پیگیری: #${fa(r.no)}</b><span>جواب ما در «پشتیبانی ← درخواست‌های من» می‌آید؛ زنگوله‌ی بالای صفحه هم خبرتان می‌کند.</span></div><button class="btn ac block" data-a="close">باشد</button>`); } catch (e) { el.disabled = false; fail(e); } return; }
    case 'feedback': closeLayer(); return feedbackSheet();
    case 'fb-star': ui.fb.st = +el.dataset.v; $$('[data-a="fb-star"]').forEach(b => b.classList.toggle('on', +b.dataset.v <= ui.fb.st)); snd('tap'); return;
    case 'fb-cat': ui.fb.cat = el.dataset.v; $$('[data-a="fb-cat"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === ui.fb.cat)); return;
    case 'fb-send': { el.disabled = true; try { await api('fb_send', { stars: ui.fb.st || 0, cat: ui.fb.cat, text: $('#fb-t').value, hp: $('#fb-hp').value }); snd('ok'); toast('ممنون! نظرتان رسید و خوانده می‌شود.'); ui.fb = null; closeLayer(); } catch (e) { el.disabled = false; fail(e); } return; }
    case 'fb-like': try { const r = await api('fb_like', { id: el.dataset.id }); const n = el.querySelector('b'); n.textContent = fa(Math.max(0, +en(n.textContent) + (r.liked ? 1 : -1))); el.classList.toggle('on', r.liked); snd('tap'); } catch (e) { fail(e); } return;
    case 'ct-cat': ui.ct.cat = el.dataset.v; $$('[data-a="ct-cat"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === ui.ct.cat)); return;
    case 'ct-send': { const body = { cat: ui.ct.cat, name: $('#ct-name').value, contact: $('#ct-c').value, text: $('#ct-t').value, hp: $('#ct-hp').value, t: Date.now() - (ui.ct.t0 || Date.now()) }; el.disabled = true; try { const r = await api('contact', body); ui.ct = null; snd('ok'); closeLayer(); toast(`پیام #${fa(r.no)} رسید؛ به‌زودی جواب می‌دهیم.`); } catch (e) { el.disabled = false; fail(e); } return; }
    case 'new-profile': closeLayer(); ui.linkPlace = null; return wizOpen(null, { mode: 'new', kind: el.dataset.kind });
    case 'resume-draft': return wizOpen(S.drafts[0], { mode: 'resume' });
    case 'wiz-resume': return wizOpen(p, { mode: 'resume' });
    case 'wiz-review': closeLayer(); return p.complete ? wizOpen(p, { mode: 'review' }) : wizOpen(p, { mode: 'resume' });
    case 'wiz-fix': return wizOpen(p, { mode: 'fix', at: missingStep(p) });
    case 'join-place': { const own = P.find(x => x.place && x.place.id === ui.linkPlace.id); if (own) { ui.linkPlace = null; history.replaceState(null, '', BASE); return setActive(own.id); } return wizOpen(null, { mode: 'new', link: ui.linkPlace }); }
    case 'open-code': closeLayer(); return openCode(el.dataset.c);
    case 'go-code': { const v = ($('#code').value || '').trim().toUpperCase().replace(/^.*\//, '').replace(/[^A-Z0-9]/g, ''); if (v.length < 6) return toast('کد ۸ حرفی را وارد کنید.'); return openCode(v); }
    case 'login': closeLayer(); return loginSheet();
    case 'lg-send': case 'lg-call': case 'lg-bale': { const ph = normPhone($('#lg-ph').value); if (!ph) return toast('شماره را درست بنویسید؛ مثلاً ۰۹۱۲۱۲۳۴۵۶۷.'); try { const r = await api('otp_send', { phone: ph, channel: a === 'lg-call' ? 'call' : a === 'lg-bale' ? 'bale' : 'sms' }); ui.lg = { ph, dev: r.dev_code }; loginSheet(); if (a === 'lg-send') setTimeout(() => otpAuto('#lg-otp'), 300); } catch (e) { toast(e.code === 'sms' ? `پیامک نرسید (کد ${fa(e.pcode || 0)})؛ تماس صوتی را امتحان کنید.` : e.message); } return; }
    case 'lg-verify': { try { const wasGuest = S.token && !S.phone; const r = await api('otp_verify', { phone: ui.lg.ph, code: en($('#lg-otp').value) }); S.token = r.token; S.phone = r.phone; ui.lg = null; persist(); await refreshMe(); closeLayer(); if (ui.famCode) return famJoin(ui.famCode); if (wasGuest) { toast('شماره تأیید شد ✓'); return setActive(S.active && P.find(x => x.id === S.active) ? S.active : (P[0] || {}).id, { noWizard: true }); } if (P.length) setActive(P[0].id); else { render(true); toast('خوش آمدید! حالا اولین مسیرک را بسازید.'); } } catch (e) { fail(e); } return; }
    case 'logout': try { await api('logout'); } catch (e) {} S.token = null; S.phone = null; S.active = null; P = []; persist(); closeLayer(); applyAccent(); render(true); return toast('از حساب خارج شدید.');
    case 'theme': { const d = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = d; S.theme = d; persist(); $$('[data-a="theme"]').forEach(b => { b.innerHTML = ic(d === 'dark' ? 'sun' : 'moon'); }); if ($('#peermap-slot')) mountPeerMap(); return; }
    case 'filter': ui.filter = el.dataset.v; PM.key = ''; return renderMain();
    case 'fit': PM.key = ''; return drawPeers();
    case 'map-full': { const on = document.body.classList.toggle('map-full'); $$('[data-a="map-full"]').forEach(b => b.innerHTML = ic(on ? 'shrink' : 'expand')); snd('tap'); setTimeout(() => { if (PM.map) { PM.map.resize(); PM.key = ''; drawPeers(); } }, 60); return; }
    case 'map-clean': { const on = document.body.classList.toggle('map-clean'); $$('[data-a="map-clean"]').forEach(b => b.setAttribute('aria-pressed', on)); snd('tap'); return; }
    case 'cal-mode': ui.calMode = el.dataset.v; ui.calOff = 0; ui.calM = 0; return renderMain();
    case 'cal-go': if ((ui.calMode || 'week') === 'week') ui.calOff = (ui.calOff || 0) + +el.dataset.v; else ui.calM = Math.min(0, (ui.calM || 0) + +el.dataset.v); snd('tap'); return renderMain();
    case 'cal-now': ui.calOff = 0; ui.calM = 0; return renderMain();
    case 'mview': ui.mview = el.dataset.v; snd('tap'); PM.key = ''; $$('.seg [data-a="mview"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === ui.mview)); return drawPeers();
    case 'cand': { const m = ui.cand && ui.cand.list.find(x => x.id === el.dataset.id); return m && famSheet(m); }
    case 'invite': {
      const m = ui.cand.list.find(x => x.id === el.dataset.id); closeLayer(); const kids = (p.data.kids || []).map(k => k.first).filter(Boolean);
      const hi = `سلام، وقت‌تان بخیر 🌷 ما خانواده‌ی ${p.data.family || ''}${p.data.hood ? ' از محله‌ی ' + p.data.hood : ''} هستیم${kids.length ? '؛ ' + kids.join(' و ') + ' به ' + (placeName(p) || destWord(p)) + ' می‌رود' : ''}. اگر موافق باشید با هم آشنا شویم و ببینیم می‌توانیم هم‌مسیر شویم.`;
      return sheet(`آشنایی با خانواده ${m.family}`, `<p class="muted small">پیشنهاد شما با این پیام می‌رود. هنوز تیم نمی‌شوید؛ اول آشنا می‌شوید، بعد اگر هر دو خواستید، تیم شکل می‌گیرد.</p><div class="field"><label for="inv-hi">پیام آشنایی</label><textarea id="inv-hi" rows="4" maxlength="400">${esc(hi)}</textarea></div><button class="btn ac block" data-a="invite-send" data-id="${m.id}">${ic('send')}فرستادن پیشنهاد و پیام</button>`); }
    case 'invite-send': {
      const m = ui.cand.list.find(x => x.id === el.dataset.id), hi = ($('#inv-hi') || {}).value || ''; closeLayer();
      try { const r = await api('invite', { profile_id: p.id, to: m.id, text: hi }); m.invite = { id: r.id, dir: 'out' }; PM.key = ''; renderMain(); snd('ok'); toast(`دعوت برای خانواده ${m.family} رفت${r.sms === 'sent' ? ' و پیامک شد' : ''}.` + (quip('invite') || ' منتظر پاسخ بمانید.')); setTimeout(() => loadInbox(), 4500); setTimeout(() => loadInbox(), 9000); } catch (e) { fail(e); }
      return;
    }
    case 'invite-all': { const sm = smartTeam(p, ui.cand.list); if (!sm) return; let n = 0; for (const m of sm.list) { try { const r = await api('invite', { profile_id: p.id, to: m.id }); m.invite = { id: r.id, dir: 'out' }; n++; } catch (e) {} } PM.key = ''; renderMain(); toast(`${fa(n)} دعوت رفت. هر کس بپذیرد، تیم شکل می‌گیرد.`); setTimeout(() => loadInbox(), 4500); setTimeout(() => loadInbox(), 9000); return; }
    case 'accept': try { const r = await api('invite_respond', { id: el.dataset.id, accept: 1 }); closeLayer(); await refreshMe(); applyAccent(); ui.tab = 'team'; await loadTeam(); loadPeers(); loadInbox(); render(true); snd('done'); toast(`خوش آمدید به ${teamName(r.team)}!` + quip('team', .7)); } catch (e) { fail(e); } return;
    case 'decline': { const id = el.dataset.id; try { await api('invite_respond', { id, accept: 0 }); closeLayer(); loadInbox(); offerUndo('با احترام رد شد؛ پیامی برای‌شان نمی‌رود.', async () => { try { await api('invite_undo', { id }); loadInbox(); toast('دعوت دوباره باز شد.'); } catch (e) { fail(e); } }); } catch (e) { fail(e); } return; }
    case 'inbox': closeLayer(); return inboxSheet();
    case 'leave': closeLayer(); return sheet('جدا شدن از تیم؟', `<p>از ${esc(teamName(p.team))} جدا می‌شوید. سابقه‌ی سفرها و حساب‌ها پاک نمی‌شود.</p><div class="row"><button class="btn grow" data-a="leave-ok">بله، جدا می‌شوم</button><button class="btn line grow" data-a="close">ماندن</button></div>`);
    case 'leave-ok': try { const r = await api('team_leave', { profile_id: p.id }); closeLayer(); await refreshMe(); applyAccent(); ui.team = null; ui.tab = 'peers'; render(true); loadPeers(); toast(r.result === 'closed' ? 'تیم بسته شد؛ دوباره هم‌مسیر پیدا کنید.' : 'از تیم جدا شدید.'); } catch (e) { fail(e); } return;
    case 'poster': closeLayer(); return posterSheet();
    case 'print': return printPoster();
    case 'copy-cap': return copyText(ui.caption).then(ok => toast(ok ? 'متن و لینک کپی شد؛ در گروه‌ها بچسبانید.' : 'کپی نشد.'));
    case 'share-app': { const app = el.dataset.v, nm = app === 'eitaa' ? 'ایتا' : 'بله', t = ui.caption || '';
      if (navigator.share) { try { await navigator.share({ text: t }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
      const ok = await copyText(t); window.open(app === 'eitaa' ? 'https://web.eitaa.com/' : 'https://web.bale.ai/', '_blank', 'noopener');
      return toast(ok ? `متن و لینک کپی شد؛ در ${nm} گروه یا کانال را باز کنید و بچسبانید.` : `${nm} باز شد؛ لینک را از کادر پایین بردارید.`); }
    case 'share': { const t = ui.caption; try { const blob = await posterPng(); const file = new File([blob], 'residim.png', { type: 'image/png' }); if (navigator.canShare && navigator.canShare({ files: [file] })) return navigator.share({ files: [file], text: t }).catch(() => {}); if (navigator.share) return navigator.share({ text: t }).catch(() => {}); } catch (e) {} return copyText(t).then(() => toast('متن و لینک کپی شد.')); }
    case 'img': { const b = await posterPng(); const u = URL.createObjectURL(b); const l = document.createElement('a'); l.href = u; l.download = `residim-${active().place.code}.png`; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); return toast('عکس‌نوشت ذخیره شد.'); }
    case 'notify': if (!('Notification' in window)) return toast('این مرورگر نوتیف ندارد؛ خبرها در «دعوت‌ها و پیام‌ها» می‌آید.'); return Notification.requestPermission().then(r => toast(r === 'granted' ? 'نوتیف روشن شد.' : 'نوتیف روشن نشد؛ از تنظیمات مرورگر روشنش کنید.'));
    case 'radio': closeLayer(); return radioSheet();
    case 'guide': closeLayer(); return guideSheet();
    case 'install': closeLayer(); return installApp();
    case 'install-pwa': { closeLayer(); const k = ui.apk; ui.apk = null; await installApp(); ui.apk = k; return; }
    case 'sound': S.sound = el.checked; persist(); if (el.checked) snd('ok'); return;
    case 'sub': closeLayer(); return paywallSheet('info');
    case 'sub-want': try { await api('sub_interest', { reason: el.dataset.v || '' }); } catch (e) {} closeLayer(); snd('ok'); return toast('ثبت شد؛ به محض باز شدن پرداخت آنلاین خبرتان می‌کنیم.');
    case 'pw-free': closeLayer(); if (ui.wiz) { ui.wiz.d.role = 'drive'; ui.wiz.d.free_ride = true; const st = wizSteps(ui.wiz); ui.wiz.step = Math.max(0, st.findIndex(x => x.key === 'role')); wizRender(); toast('«رایگان می‌برم» را زدیم؛ با «ادامه» جلو بروید.'); } return;
    case 'radio-vote': if (S.radioVoted) return; try { const r = await api('radio_vote'); CFG.radio_votes = r.votes; S.radioVoted = 1; persist(); toast('ممنون! صدای شما شمرده شد.'); return radioSheet(); } catch (e) { return fail(e); }
    case 'mate': fromChat(); return mateSheet(el.dataset.id);
    case 'thread': return threadSheet(el.dataset.id);
    case 'trust-new': return sheet('راننده‌ی معتمد', `<div class="adm-form"><div class="field"><label for="tr-n">نام و نام خانوادگی</label><input id="tr-n"></div><div class="field"><label for="tr-s">صندلی خالی</label><input id="tr-s" inputmode="numeric" value="3"></div></div><div class="field"><label for="tr-o">چه نسبتی با شما دارد؟</label><input id="tr-o" placeholder="مثلاً معلم قرآن مدرسه، دانشجوی دانشگاه قم"></div>
      <label class="check"><input type="checkbox" id="tr-sign">ایشان را شخصاً می‌شناسم و مسئولیت معرفی‌شان با من است.</label><button class="btn ac block" data-a="trust-send">ساختن لینک دعوت</button><p class="muted small">بقیه‌ی خانواده‌ها هم باید بپذیرند؛ بعد ایشان با لینک وارد تیم می‌شود.</p>`);
    case 'trust-send': try { const r = await api('trust_add', { profile_id: p.id, name: $('#tr-n').value, seats: +en($('#tr-s').value) || 3, note: $('#tr-o').value, sign: $('#tr-sign').checked ? 1 : 0 }); await copyText(r.link); closeLayer(); toast('لینک دعوت کپی شد؛ برای ایشان بفرستید.'); renderMain(); } catch (e) { fail(e); } return;
    case 'trust-ok': return sheet('پذیرفتن راننده‌ی معتمد', `<p style="line-height:2">این راننده را خانواده‌ای از تیم معرفی کرده است. با پذیرفتن، تأیید می‌کنید که <b>تصمیم اعتماد با خانواده‌ها است</b> و رسیدیم، که فقط معرفی‌کننده است، مسئولیتی در رفتار یا رانندگی ایشان ندارد.</p><label class="check"><input type="checkbox" id="tr-ok">خواندم و می‌پذیرم.</label><button class="btn ac block" data-a="trust-ok2" data-c="${el.dataset.c}">می‌پذیرم</button>`);
    case 'trust-ok2': if (!$('#tr-ok').checked) return toast('اول متن را تأیید کنید.'); try { await api('trust_accept', { profile_id: p.id, code: el.dataset.c, sign: 1 }); closeLayer(); renderMain(); toast('ثبت شد.'); } catch (e) { fail(e); } return;
    case 'rep-pdf': closeLayer(); return reportFile('pdf');
    case 'rep-png': closeLayer(); return reportFile('png');
    case 'rep-print': closeLayer(); document.body.classList.add('printing'); return setTimeout(() => print(), 300);
    case 'agree': try { await api('team_agree', { profile_id: p.id, v: +el.dataset.v }); await loadTeam(); snd(+el.dataset.v ? 'done' : 'tap'); renderMain(); } catch (e) { fail(e); } return;
    case 'thread-send': { const t = $('#th-in').value.trim(); if (!t) return; try { await api('invite_thread', { id: el.dataset.id, text: t }); snd('tap'); threadSheet(el.dataset.id); } catch (e) { fail(e); } return; }
    case 'dup-pick': { const o = (ui.dups || []).find(x => x.id === el.dataset.id); if (!o) return; ui.dupO = o;
      return sheet('کدام مبنا باشد؟', `<p style="line-height:2">اطلاعات کدام ثبت درست‌تر و کامل‌تر است؟ دیگری حذف می‌شود.</p><div class="choices two"><button class="choice col" data-a="dup-keep" data-v="mine">${ic('check', 'emo')}همین مسیرک فعلی<small>${esc(p.label)}</small></button><button class="choice col" data-a="dup-keep" data-v="other">${ic('check', 'emo')}آن ثبت دیگر<small>${esc(o.label)}${o.team ? ' (در تیم)' : ''}</small></button></div>
        ${!o.mine && o.phone ? `<p class="muted small">آن ثبت با شماره‌ی <span dir="ltr">${esc(o.phone)}</span> است؛ برای اطمینان یک کد به همان شماره می‌فرستیم.</p>` : ''}`); }
    case 'dup-keep': { const o = ui.dupO; ui.dupKeep = el.dataset.v; if (!o.mine && o.phone) { try { await api('dup_send', { other: o.id }); } catch (e) { return fail(e); } return sheet('کد تأیید', `<p>کدی که به <span dir="ltr">${esc(o.phone)}</span> فرستادیم:</p><div class="field"><input id="dup-code" inputmode="numeric" dir="ltr" autocomplete="one-time-code"></div><button class="btn ac block" data-a="dup-go">یکی کن</button>`); } return act('dup-go', el); }
    case 'dup-go': try { const r = await api('dup_merge', { profile_id: p.id, other: ui.dupO.id, keep: ui.dupKeep, code: ($('#dup-code') || {}).value || '' }); S.active = r.kept; persist(); await refreshMe(); closeLayer(); render(true); snd('done'); toast('یکی شد؛ حالا فقط یک «خانواده ' + (p.data.family || '') + '» دارید.'); } catch (e) { fail(e); } return;
    case 'fam': closeLayer(); return famSheet2();
    case 'fam-invite': try { const r = await api('fam_code', { profile_id: p.id }); const txt = `سلام! برای دیدن خبرهای سرویس بچه‌ها در «رسیدیم» این لینک را باز کن و با شماره‌ی خودت وارد شو:\n${r.link}`; if (navigator.share) { try { await navigator.share({ text: txt }); } catch (e) {} } else { await copyText(txt); toast('لینک کپی شد؛ برای همسر یا پدربزرگ/مادربزرگ بفرستید.'); } } catch (e) { fail(e); } return;
    case 'fam-act': case 'fam-watch': try { await api('fam_role', { profile_id: p.id, role: a === 'fam-act' ? 'act' : 'watch' }); await refreshMe(); closeLayer(); render(); toast(a === 'fam-act' ? 'حالا شما هم می‌توانید کارها را انجام دهید.' : 'به حالت «فقط دیدن» برگشتید.'); } catch (e) { fail(e); } return;
    case 'fam-rm': try { await api('fam_remove', { profile_id: p.id, user: el.dataset.u }); closeLayer(); famSheet2(); } catch (e) { fail(e); } return;
    case 'fam-leave': if (!confirm('دیگر خبرهای این مسیرک را نمی‌بینید. مطمئنید؟')) return; try { await api('fam_remove', { profile_id: p.id }); await refreshMe(); S.active = (P[0] || {}).id || null; persist(); closeLayer(); render(true); } catch (e) { fail(e); } return;
    case 'mate-edit': ui.backToChat = false; chatClose(); return act('wiz-review', el);
    case 'pact': fromChat(); return pactSheet();
    case 'pact-save': try { await api('team_pact', { profile_id: p.id, text: $('#pact-t').value }); await loadTeam(); snd('ok'); toast('قرار تیم ثبت شد؛ بقیه خبردار شدند.'); closeLayer(); } catch (e) { fail(e); } return;
    case 'chat': closeLayer(); if (!p || !p.team) return toast('گفتگو بعد از تیم شدن باز می‌شود؛ اول یک هم‌مسیر پیدا کنید.'); return chatSheet();
    case 'chat-close': return chatClose();
    case 'chat-urgent': { const t = el.dataset.v; try { await api('chat_send', { profile_id: p.id, text: t, urgent: 1 }); snd('honk'); toast('پیام فوری برای همه‌ی خانواده‌ها رفت.'); ui.chat.sig = ''; chatPull(); } catch (e) { fail(e); } return; }
    case 'chat-quick': { const i = $('#chat-in'); if (i) { i.value = el.dataset.v; snd('tap'); return act('chat-send', el); } return; }
    case 'chat-send': { const i = $('#chat-in'), t = (i.value || '').trim(); if (!t) return; i.value = ''; const L = $('#chat-list'); if (L) { L.querySelector('.cx-empty')?.remove(); L.insertAdjacentHTML('beforeend', `<div class="cx-row me sending"><div class="cx-b"><span>${esc(t)}</span><small>در حال فرستادن…</small></div></div>`); L.scrollTop = L.scrollHeight; } try { await api('chat_send', { profile_id: p.id, text: t }); snd('tap'); ui.chat.sig = ''; chatPull(); } catch (e) { i.value = t; L && L.querySelector('.sending')?.remove(); fail(e); } return; }
    case 'verify': closeLayer(); ui.lg = null; return loginSheet(true);
    case 'quick-new': closeLayer(); ui.linkPlace = null; return wizOpen(null, { mode: 'new', kind: el.dataset.kind });
    case 'print-poster': return printPoster();
    case 'adm-smstest': { S.smsPhone = $('#sm-ph').value.trim(); persist(); try { const r = await api('admin_sms_test', { phone: $('#sm-ph').value, tpl: $('#sm-tpl').value, type: $('#sm-type').value }, true); const R = r.result; $('#sm-out').innerHTML = `<div class="${R.ok ? 'done' : 'hint warn'}" style="display:grid;gap:6px;margin-top:10px"><b>${R.ok ? 'ارسال شد ✓' : 'ارسال نشد'}</b><span>کد کاوه‌نگار: <b dir="ltr">${esc(R.code)}</b> · ${esc(R.msg)}</span><span class="muted small">کلید: ${r.key_set ? 'تنظیم شده' : 'تنظیم نشده'} · ${r.direct ? 'پیامک مستقیم (بدون الگو)' : 'الگو: <span dir="ltr">' + esc(r.template) + '</span>'}</span></div>`; } catch (e) { fail(e); } return; }
    case 'rules': closeLayer(); return sheet('قوانین و حریم خصوصی', rulesHtml().replace('class="rules"', 'class="rules full"'));
    case 'rules-full': return sheet('قول و قرار ما', rulesHtml().replace('class="rules"', 'class="rules full"') + (ui.wiz ? `<button class="btn block" data-a="rules-accept">خواندم و می‌پذیرم</button>` : ''));
    case 'rules-accept': closeLayer(); if (ui.wiz) { ui.wiz.d.rules_at = Math.floor(Date.now() / 1000); ui.wiz.err = ''; wizRender(); } return;
    case 'ticket': closeLayer(); return ticketSheet();
    case 'tk-cat': ui.tk = ui.tk || {}; ui.tk.cat = el.dataset.v; ui.tk.text = ($('#tk') || {}).value || ''; return ticketSheet();
    case 'tk-send': try { const r = await api('ticket', { cat: (ui.tk || {}).cat || 'فنی', text: $('#tk').value, profile_id: p ? p.id : null }); ui.tk = null; toast(`تیکت #${fa(r.no)} ثبت شد؛ پاسخ همین‌جا می‌آید.`); return ticketSheet(); } catch (e) { return fail(e); }
    case 'quiz': closeLayer(); return quizSheet();
    case 'q-ans': try { const v = el.dataset.v != null ? el.dataset.v : en(($('#qa') || {}).value || ''); const r = await api('quiz_answer', { profile_id: p.id, qid: el.dataset.q, answer: v }); toast(r.ok ? 'آفرین! یک امتیاز برای تیم.' : 'این بار نشد؛ فردا معمای تازه!'); await loadTeam(); return quizSheet(); } catch (e) { return fail(e); }
    case 'q-prize': return tact({ act: 'prize', text: $('#prize').value }, 'جایزه‌ی فصل ثبت شد.');
    case 'how': return sheet('حساب چطور است؟', `<ol class="steps3"><li>هر سفر ${money(T.team.price)} است: ۶۰٪ میانگین برآورد اسنپ اعضا.</li><li>کل مبلغ به اعتبار کسی است که واقعاً برده.</li><li>همان مبلغ بین همه‌ی مسافران آن سفر مساوی تقسیم می‌شود.</li><li>تسویه با «پرداخت شد» یا «حلال است»؛ هیچ رقمی پاک نمی‌شود.</li></ol>`);
    /* team daily */
    case 't-pick': ui.slot = el.dataset.s; return renderMain();
    case 't-next': { ui.slot = null; const n = focusSlot(T, plan); ui.slot = n && n.id; return renderMain(); }
    case 'sl-go': { const tr = $('#sl-track'); const k = tr && tr.children[+el.dataset.v]; if (k) k.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' }); return; }
    case 'to-list': { const L = $('#peer-list'); if (L) scrollTo({ top: L.getBoundingClientRect().top + scrollY - 70, behavior: 'smooth' }); el.classList.add('gone'); return; }
    case 'tsub-noop': return;
    case 'tsub': ui.tsub = el.dataset.v; snd('tap'); return renderMain();
    case 'hold-cancel': clearTimeout(ui.holdT); ui.holdFn = null; $('#undo').classList.remove('show'); return toast('لغو شد؛ چیزی ثبت نشد.');
    case 't-perkid': ui.perKid = true; return renderMain();
    case 't-remind': { if ('Notification' in window && Notification.permission === 'default') { try { await Notification.requestPermission(); } catch (e) {} } const ok = 'Notification' in window && Notification.permission === 'granted'; S.remD = ''; persist();
      return sheet('یادآوری نوبت', `<p style="line-height:2">${ok ? 'اگر عصر رسیدیم را باز کنید، ساعت ۱۸ به بعد یک یادآوری می‌گیرید.' : 'مرورگر اجازه‌ی اعلان نداده.'}<br><b>مطمئن‌ترین راه: اپ اندروید رسیدیم.</b> شب قبل از هر نوبت، ساعت ۲۰:۳۰ حتی وقتی اپ بسته است، با صدا و لرزش خبرتان می‌کند.</p>${ui.apk && ui.apk.url ? `<a class="btn ac block" href="${esc(ui.apk.url)}" download>${ic('install')}دانلود اپ اندروید</a>` : ''}`); }
    case 't-board': { const pid = el.dataset.pid, nm = fam(mem(T, pid)); await tact({ act: 'board', slot: x.id, pid }, null); snd('tap'); return offerUndo(`${nm} سوار شدند ✓`, () => tact({ act: 'unboard', slot: x.id, pid }, 'برگردانده شد.')); }
    case 't-unboard': { const pid = el.dataset.pid; return sheet('سوار نشده‌اند؟', `<p style="line-height:2">«سوار شد» برای ${esc(fam(mem(T, pid)))} برگردد؟</p><div class="row"><button class="btn ac grow" data-a="t-unboard-ok" data-pid="${pid}">بله، برگردان</button><button class="btn line grow" data-a="close">نه</button></div>`); }
    case 't-unboard-ok': closeLayer(); ui.sceneFrom = null; return tact({ act: 'unboard', slot: x.id, pid: el.dataset.pid }, 'برگردانده شد.');
    case 't-allin': return sheet('همه رسیدند؟', `<p style="line-height:2">همه‌ی بچه‌ها را تحویل دادید و <b>خودرو خالی است و چیزی جا نمانده</b>؟</p><div class="row"><button class="btn ac grow" data-a="t-allin-ok">بله، همه رسیدند ✓</button><button class="btn line grow" data-a="close">نه هنوز</button></div>`);
    case 'pp-vote': try { await api('price_vote', { fair: +el.dataset.f || +($('#pp-f') || {}).value || 0, high: +($('#pp-h') || {}).value || 0 }); S.pricePolled = 1; persist(); closeLayer(); toast('ممنون! نظرتان در قیمت‌گذاری منصفانه اثر دارد.'); } catch (e) { fail(e); } return;
    case 't-allin-ok': { closeLayer(); if (ui.prac && ui.prac[x.id]) { practice({ act: 'finish', slot: x.id }); return; } try { await api('team_act', { profile_id: p.id, act: 'arrive', slot: x.id, kid: '*' }); await api('team_act', { profile_id: p.id, act: 'empty', slot: x.id, v: 1 }); await api('team_act', { profile_id: p.id, act: 'finish', slot: x.id, label: (x.dir === 'out' ? 'رفت ' : 'برگشت ') + DAYS[x.d] }); ui.perKid = false; ui.qDone = null; await loadTeam(); renderMain(); watchArrival(); snd('done'); toast('خدا قوت! همه به سلامت رسیدند؛ خانواده‌ها خبردار شدند.'); if (CFG.flags.price_poll && !S.pricePolled && (ui.hist && ui.hist.trips || []).filter(z => z.status === 'done').length >= 2) setTimeout(pricePoll, 2500); } catch (e) { fail(e); } return; }
    case 't-start': { const r = recOf(T, x, plan); if (!r.exec) return; ui.slot = x.id; await tact({ act: 'start', slot: x.id, exec: r.exec }, 'راه افتادید! سوار شدن‌ها خودکار تیک می‌خورد؛ آخر سفر یک «رسیدیم» کافی است.');
      if (r.exec === p.id && S.liveOK == null && navigator.geolocation) sheet('موقعیت زنده را روشن کنیم؟', `<p style="line-height:2">تا پایان همین سفر، خانواده‌های تیم ماشین شما را روی نقشه می‌بینند و وقتی به هزار متری خانه‌شان رسیدید خبردار می‌شوند؛ تا بچه‌ها در سرما زودتر از لازم بیرون نروند.</p><p class="muted small">${ic('shield')} فقط هم‌تیمی‌ها و فقط در طول سفر. با «ثبت پایان سفر» خاموش می‌شود. این صفحه باید باز بماند.</p><div class="row"><button class="btn ac grow" data-a="live-ok" data-v="1">روشن کن</button><button class="btn line grow" data-a="live-ok" data-v="0">این بار نه</button></div>`);
      return; }
    case 'live-ok': S.liveOK = el.dataset.v === '1' ? true : null; persist(); closeLayer(); watchArrival(); return toast(S.liveOK ? 'موقعیت زنده روشن شد؛ سفر بی‌خطر!' : 'باشد؛ دفعه‌ی بعد دوباره می‌پرسیم.');
    case 'live-map': ui.tab = 'peers'; ui.mview = 'peers'; render(true); return setTimeout(() => { if (PM.map && ui.live) PM.map.flyTo({ center: [ui.live.lng, ui.live.lat], zoom: 15, duration: 700 }); }, 900);
    case 'sub-info': closeLayer(); return paywallSheet('info');
    case 't-arrive': { const b = $('.banner'); b && b.remove(); return tact({ act: 'arrive', slot: x.id, kid: el.dataset.k }, el.dataset.k === '*' ? 'رسیدن همه ثبت شد؛ خانواده‌ها خبردار شدند.' : 'ثبت شد؛ خانواده‌اش خبردار شد.'); }
    case 'banner-x': { const b = $('.banner'); b && b.remove(); return; }
    case 't-empty': return tact({ act: 'empty', slot: x.id, v: el.checked ? 1 : 0 });
    case 't-finish': return tact({ act: 'finish', slot: x.id, label: DAYS[x.d] + ' ' + (x.dir === 'out' ? 'رفت' : 'برگشت') }, 'خدا قوت! سفر ثبت شد.');
    case 't-thanks': return tact({ act: 'thanks', slot: x.id }, 'تشکر شما رسید.');
    case 't-swap': case 't-slot': {
      const s2 = a === 't-slot' ? slotsOf(T.place).find(y => y.id === el.dataset.s) : x, r = recOf(T, s2, plan), c = {}; T.members.forEach(m => c[m.id] = 0); slotsOf(T.place).forEach(y => { const e = recOf(T, y, plan).exec; if (c[e] != null && y.id !== s2.id) c[e]++; });
      const cands = T.members.filter(m => m.id !== r.exec && driverOk(T, m, s2.dir)).sort((a1, b1) => ((b1.days || []).includes(s2.d) - (a1.days || []).includes(s2.d)) || (c[a1.id] - c[b1.id]));
      return sheet(`${DAYS[s2.d]} · ${s2.dir === 'out' ? 'رفت' : 'برگشت'} ${clock(s2.time)}`, `<p>${r.exec ? esc(fam(mem(T, r.exec))) + ' می‌برند.' : 'هنوز راننده ندارد.'}</p>
        ${r.status === 'pending' ? `<span class="lbl">چه کسی می‌تواند ببرد؟</span>${cands.map(m => `<button class="fam" data-a="t-swapto" data-s="${s2.id}" data-id="${m.id}"><span class="av" style="--pc:var(--ac);--pi:var(--ac-ink)">${esc(m.family[0])}</span><span class="grow"><b>${esc(fam(m))}${m.id === p.id ? ' (خودم)' : ''}</b><br><span class="muted small">${(m.days || []).includes(s2.d) ? 'این روز را اعلام کرده‌اند' : 'روز اعلام‌شده‌شان نیست'} · ${fa(c[m.id])} نوبت دیگر</span></span><span class="tag ac">${m.id === p.id ? 'می‌برم' : 'بسپار'}</span></button>`).join('') || '<p class="muted">راننده‌ی سازگار دیگری در تیم نیست.</p>'}` : '<p class="muted">این نوبت شروع یا انجام شده.</p>'}
        <button class="btn line" data-a="t-open" data-s="${s2.id}">نمایش در کارت امروز</button>`, 'برنامه‌ی اولیه حفظ می‌شود؛ اعتبار به کسی می‌رسد که واقعاً می‌برد.');
    }
    case 't-open': closeLayer(); ui.slot = el.dataset.s; return renderMain();
    case 't-swapto': closeLayer(); ui.slot = el.dataset.s; return tact({ act: 'swap', slot: el.dataset.s, exec: el.dataset.id }, 'راننده‌ی این نوبت عوض شد؛ هم‌تیمی‌ها خبردار شدند.');
    case 't-pay': case 't-gift': { const sg = settle(T)[+el.dataset.i], gift = a === 't-gift';
      return sheet(gift ? 'حلال می‌کنید؟' : 'پرداخت شده؟', `<p style="line-height:2">${gift ? `${money(sg.amt)} بدهی ${esc(fam(mem(T, sg.from)))} به شما <b>بخشیده</b> می‌شود و دیگر قابل مطالبه نیست.` : `ثبت می‌شود که ${esc(fam(mem(T, sg.from)))} مبلغ ${money(sg.amt)} را به ${esc(fam(mem(T, sg.to)))} <b>پرداخت کرده</b>.`}</p><p class="muted small">بعد از «بله» هم ۷ ثانیه فرصت پشیمانی دارید.</p><div class="row"><button class="btn ac grow" data-a="t-settle-ok" data-i="${el.dataset.i}" data-k="${a}">بله، مطمئنم</button><button class="btn line grow" data-a="close">نه</button></div>`); }
    case 't-settle-ok': { closeLayer(); const sg = settle(T)[+el.dataset.i], k = el.dataset.k; return holdThen(k === 't-gift' ? 'حلال کردن…' : 'ثبت پرداخت…', 7000, () => tact({ act: 'settle', kind: k === 't-pay' ? 'pay' : 'gift', from: sg.from, to: sg.to, amt: sg.amt }, k === 't-pay' ? 'پرداخت ثبت شد.' : 'بزرگواری کردید؛ حلال شد. 🤍')); }
    case 't-pay-old-unused': { const sg = settle(T)[+el.dataset.i]; return tact({ act: 'settle', kind: a === 't-pay' ? 'pay' : 'gift', from: sg.from, to: sg.to, amt: sg.amt }, a === 't-pay' ? 'پرداخت ثبت شد.' : 'بزرگواری‌تان ثبت شد. حساب‌ها روشن، دل‌ها روشن‌تر.'); }
    /* test tools */
    case 't-fake5': case 't-fake1': closeLayer(); try { const r = await api('test_fake', { profile_id: p.id, n: a === 't-fake5' ? 5 : 1, driver: a === 't-fake1' }); toast(`${fa(r.made)} همسایه‌ی آزمایشی اضافه شد.`); loadPeers(); } catch (e) { fail(e); } return;
    case 't-invme': closeLayer(); try { await api('test_invite_me', { profile_id: p.id }); await loadInbox(); toast('یک همسایه‌ی آزمایشی دعوت‌تان کرد؛ زنگوله را ببینید.'); loadPeers(); } catch (e) { fail(e); } return;
    case 't-clear': closeLayer(); try { const r = await api('test_clear', { profile_id: p.id }); await refreshMe(); applyAccent(); ui.team = null; toast(`${fa(r.removed)} همسایه‌ی آزمایشی پاک شد.`); render(); loadPeers(); } catch (e) { fail(e); } return;
    case 'map-places': ui.showPl = !ui.showPl; el.setAttribute('aria-pressed', ui.showPl); if (ui.showPl) toast('مدرسه‌ها و مکان‌های نزدیک روی نقشه آمدند؛ روی هر کدام بزنید.'); return peerPlaces();
    case 'px-open': return placeExplorer(el.dataset.m || 'browse');
    case 'px-close': return pxClose();
    case 'px-go': return pxSelect(el.dataset.id, true);
    case 'px-loc': if (!navigator.geolocation) return; return navigator.geolocation.getCurrentPosition(pos => PX.map && PX.map.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 15 }), () => toast('موقعیت در دسترس نیست.'), { timeout: 8000 });
    case 'px-pick': case 'px-start': { const q = PX.idx.get(el.dataset.id); if (!q) return; let full; try { full = (await api('place_code', { code: q.code })).place; } catch (e) { return fail(e); }
      if (a === 'px-pick' && ui.wiz) { const w = ui.wiz; if (w.d.lat) full.d = Math.round(hav(w.d.lat, w.d.lng, full.lat, full.lng)); w.near = [full, ...(w.near || []).filter(z => z.id !== full.id)]; pxClose(); return act('w-pick', { dataset: { id: full.id } }); }
      pxClose(); closeLayer(); return wizOpen(null, { link: full }); }
    case 'prof-del': { const x = allProfiles().find(z => z.id === el.dataset.id); if (!x) return; closeLayer(); return sheet('پاک کردن این مسیرک نیمه‌کاره؟', `<p style="line-height:2">«${esc(x.label)}» هنوز کامل نشده. با پاک کردن، هر چه تا اینجا وارد کرده‌اید از بین می‌رود و برنمی‌گردد.</p><div class="row"><button class="btn danger grow" data-a="prof-del-ok" data-id="${x.id}">بله، پاک شود</button><button class="btn line grow" data-a="close">نه</button></div>`); }
    case 'prof-del-ok': { const id = el.dataset.id; closeLayer(); try { if (S.drafts.some(z => z.id === id)) S.drafts = S.drafts.filter(z => z.id !== id); else { await api('profile_delete', { id }); await refreshMe(); } if (S.active === id) { S.active = (allProfiles()[0] || {}).id || null; ui.team = null; ui.cand = null; } persist(); applyAccent(); render(true); toast('پاک شد.'); } catch (e) { fail(e); } return; }
    case 't-delprof': closeLayer(); return sheet('پاک کردن کامل این مسیرک؟', `<p>«${esc(p.label)}» و همه‌ی داده‌هایش (تیم، دعوت‌ها، پیام‌ها) پاک می‌شود و برنمی‌گردد.</p><div class="row"><button class="btn grow" data-a="t-delprof-ok">پاک شود</button><button class="btn line grow" data-a="close">نه</button></div>`);
    case 't-delprof-ok': closeLayer(); try { if (String(p.id).startsWith('d')) S.drafts = S.drafts.filter(d => d.id !== p.id); else { await api('profile_delete', { id: p.id }); await refreshMe(); } S.active = (allProfiles()[0] || {}).id || null; persist(); ui.team = null; ui.cand = null; PM.map && PM.map.remove(); PM.map = null; PM.state = 'idle'; applyAccent(); render(true); toast('مسیرک پاک شد.'); if (S.active) setActive(S.active, { noWizard: true }); } catch (e) { fail(e); } return;
    case 't-reset': closeLayer(); return sheet('بازنشانی کامل؟', '<p>حساب، همه‌ی مسیرک‌ها و داده‌های این دستگاه پاک می‌شود و از اول شروع می‌کنید.</p><div class="row"><button class="btn grow" data-a="t-reset-ok">از صفر شروع کن</button><button class="btn line grow" data-a="close">نه</button></div>');
    case 't-reset-ok': { try { if (S.token) await api('account_reset'); } catch (e) {} const th = S.theme; S = { drafts: [], theme: th }; P = []; persist(); location.replace(BASE); return; }
    case 't-splash': closeLayer(); return splash(true);
    case 'admin': closeLayer(); ui.admin = true; history.pushState(null, '', BASE + '#admin'); return render(true);
    case 'adm-login': try { const r = await api('admin_login', { u: $('#au').value, p: $('#ap').value }); S.admin = r.token; persist(); ui.adm = null; renderMain(); } catch (e) { fail(e); } return;
    case 'adm-exit': ui.admin = false; ui.adm = null; history.replaceState(null, '', BASE); return render(true);
    case 'adm-refresh': ui.adm = null; return renderMain();
    case 'adm-flag': try { await api('admin_flag', { k: el.dataset.k, v: el.checked ? 1 : 0 }, true); CFG.flags[el.dataset.k] = el.checked; toast('ذخیره شد.'); } catch (e) { fail(e); } return;
    case 'adm-verify': try { await api('admin_place', { id: el.dataset.id, verified: el.checked ? 1 : 0 }, true); toast('ذخیره شد.'); } catch (e) { fail(e); } return;
    case 'adm-set': case 'adm-clear': { const k = el.dataset.k, raw = a === 'adm-clear' ? '' : el.tagName === 'SELECT' ? el.value : k === 'tips' ? $('#st-tips').value.trim() : en($('#st-' + k).value.trim()), v = ['donate_name', 'map_provider', 'notice', 'tips', 'app_ver', 'app_url'].includes(k) ? raw : raw.replace(/\D/g, '');
      try { await api('admin_setting', { k, v }, true); if (ui.adm && ui.adm.ov.settings) ui.adm.ov.settings[k] = v; if (k === 'kave_sender' && ui.adm) ui.adm.ov.settings.kave_sender_auto = ''; renderMain(); toast(a === 'adm-clear' ? 'پاک شد.' : k === 'map_provider' ? 'ذخیره شد؛ کاربران از بارگذاری بعدی نقشه‌ی تازه را می‌بینند.' : 'ذخیره شد.'); } catch (e) { fail(e); } return; }
    case 'tips-add': ui.tipsEd.push({ a: '', t: '', s: '' }); return renderMain();
    case 'tips-del': ui.tipsEd.splice(+el.dataset.i, 1); return renderMain();
    case 'tips-dl': { const b = new Blob([JSON.stringify(ui.tipsEd, null, 1)], { type: 'application/json' }), u = URL.createObjectURL(b), l = document.createElement('a'); l.href = u; l.download = 'residim-tips.json'; l.click(); setTimeout(() => URL.revokeObjectURL(u), 3000); return; }
    case 'tips-save': { const v = ui.tipsEd.filter(t => (t.t || '').trim()).map(t => ({ a: t.a || '', t: t.t.trim(), s: (t.s || '').trim() })); try { await api('admin_setting', { k: 'tips', v: JSON.stringify(v) }, true); ui.adm.ov.settings.tips = JSON.stringify(v); ui.tipsEd = v; renderMain(); toast('ذخیره شد.'); } catch (e) { fail(e); } return; }
    case 'ev-f': ui.evF = el.dataset.v; return renderMain();
    case 'launch-refresh': ui.launch = null; return renderMain();
    case 'launch-flag': try { await api('admin_flag', { k: el.dataset.k, v: +el.dataset.v }, true); ui.launch = null; if (ui.adm && ui.adm.ov.flags) ui.adm.ov.flags[el.dataset.k] = !!+el.dataset.v; renderMain(); toast('انجام شد.'); } catch (e) { fail(e); } return;
    case 'adm-uq': ui.uq = $('#adm-uq').value.trim(); ui.pg = { ...(ui.pg || {}), users: 0 }; return renderMain();
    case 'adm-udel': if (!confirm(`کاربر ${el.dataset.v} و همه‌ی مسیرک‌هایش حذف شود؟ برگشت ندارد.`)) return; try { await api('admin_user_delete', { id: el.dataset.id }, true); ui.adm.users = ui.adm.users.filter(u => u.id !== el.dataset.id); renderMain(); toast('حذف شد.'); } catch (e) { fail(e); } return;
    case 'adm-push-test': try { const r = await api('admin_push_test', { phone: prompt('شماره‌ی کاربر (که اپ را نصب کرده):') || '' }, true); toast(`فرستاده شد به ${fa(r.n)} گوشی.`); } catch (e) { fail(e); } return;
    case 'ci-run': { const C = ui.cimp; C.city = $('#ci-city').value; C.n = +$('#ci-n').value; const [la0, lo0] = CITY_C[C.city], terms = ['دبستان', 'دبیرستان', 'هنرستان', 'پیش دبستانی', 'مهد کودک', 'دانشگاه', 'آموزشگاه'];
      if (!confirm(`حدود ${C.n * C.n * terms.length} جستجو در نشان برای ${C.city} انجام شود؟`)) return; C.busy = true; let made = 0, seen = 0, k = 0; renderMain();
      const dLa = C.step / 110570, dLo = C.step / (111320 * Math.cos(la0 * Math.PI / 180)), h = (C.n - 1) / 2;
      for (let i = 0; i < C.n; i++) for (let j = 0; j < C.n; j++) { k++; try { const r = await api('admin_neshan_search', { lat: la0 + (i - h) * dLa, lng: lo0 + (j - h) * dLo, terms }, true); const fresh = r.items.filter(x => !x.code); seen += r.items.length; if (r.err && !r.items.length) { C.log = 'نشان: ' + esc(r.err); C.busy = false; renderMain(); return; }
          for (let b = 0; b < fresh.length; b += 100) { const q = await api('admin_import_places', { items: fresh.slice(b, b + 100).map(x => ({ ...x, city: C.city })) }, true); made += (q.places || q.made || []).length; } } catch (e) { C.log = 'خطا: ' + esc(e.message || ''); }
        C.log = `خانه‌ی ${fa(k)} از ${fa(C.n * C.n)} · ${fa(seen)} نتیجه · ${fa(made)} مکان ثبت یا به‌روز شد`; const lg = $('#ci-log'); if (lg) lg.textContent = C.log; else renderMain(); }
      C.busy = false; renderMain(); toast(`تمام شد: ${fa(made)} مکان در ${C.city}.`); return; }
    case 'adm-trust': try { await api('admin_place_trust', { id: el.dataset.id, v: +el.dataset.v }, true); const pp = ui.adm.places.find(x => x.id === el.dataset.id); if (pp) pp.trusted = +el.dataset.v; renderMain(); } catch (e) { fail(e); } return;
    case 'ci-file': { el.disabled = true; try { const r = await api('admin_import_file', { city: el.dataset.c || 'qom' }, true); let made = 0; for (let b = 0; b < r.items.length; b += 100) { const q = await api('admin_import_places', { items: r.items.slice(b, b + 100) }, true); made += (q.places || []).length; } toast(`${fa(made)} مکان ${r.city} ثبت یا به‌روز شد.`); ui.cimp.log = `از فایل OpenStreetMap: ${fa(made)} مکان (${esc(r.source)})`; renderMain(); } catch (e) { fail(e); } el.disabled = false; return; }
    case 'fb-pub': try { await api('admin_fb_set', { id: el.dataset.id, pub: +el.dataset.v, text: $('#fbt-' + el.dataset.id).value }, true); ui.adm.fb = null; renderMain(); toast('ذخیره شد.'); } catch (e) { fail(e); } return;
    case 'fb-del': if (!confirm('این نظر حذف شود؟')) return; try { await api('admin_fb_set', { id: el.dataset.id, delete: 1 }, true); ui.adm.fb = null; renderMain(); } catch (e) { fail(e); } return;
    case 'am-save': try { const r = await api('admin_amb_save', { name: $('#am-n').value, phone: en($('#am-p').value), note: $('#am-note').value, rate_profile: +en($('#am-rp').value).replace(/\D/g, ''), rate_team: +en($('#am-rt').value).replace(/\D/g, '') }, true); ui.adm.amb = null; renderMain(); try { await navigator.clipboard.writeText(`${SITE}/#amb/${r.token}`); } catch (e) {} toast('سفیر ساخته شد؛ لینک مخفی‌اش کپی شد.'); } catch (e) { fail(e); } return;
    case 'am-paid': if (!confirm('همه‌ی مانده‌ی این سفیر پرداخت‌شده ثبت شود؟')) return; try { await api('admin_amb_paid', { id: el.dataset.id }, true); ui.adm.amb = null; renderMain(); } catch (e) { fail(e); } return;
    case 'am-off': { const a = ui.adm.amb.find(x => x.id === el.dataset.id); try { await api('admin_amb_save', { id: a.id, name: a.name, phone: a.phone, note: a.note, rate_profile: a.rate_profile, rate_team: a.rate_team, off: +el.dataset.v }, true); ui.adm.amb = null; renderMain(); } catch (e) { fail(e); } return; }
    case 'adm-tab': ui.admTab = el.dataset.v; renderMain(); scrollTo(0, 0); if (el.dataset.v === 'msgs' && ui.adm && ui.adm.ov.counts.unseen) { api('admin_seen', {}, true).then(() => { ui.adm.ov.counts.unseen = 0; ui.admSeenN = 0; }).catch(() => {}); } return;
    case 'pg': ui.pg = ui.pg || {}; ui.pg[el.dataset.k] = el.dataset.v === 'all' ? 'all' : +el.dataset.v; return renderMain();
    case 'adm-tclose': try { await api('admin_ticket_close', { id: el.dataset.id, open: +el.dataset.v }, true); const t = ui.adm.tickets.find(x => x.id === el.dataset.id); if (t) t.status = +el.dataset.v ? 'open' : 'closed'; renderMain(); } catch (e) { fail(e); } return;
    case 'my-save': try { await api('admin_mysql_save', { host: $('#my-host').value.trim(), port: +en($('#my-port').value) || 3306, name: $('#my-name').value.trim(), user: $('#my-user').value.trim(), pass: $('#my-pass').value }, true); admReload('my'); toast('ذخیره شد؛ حالا «تست دود» را بزنید.'); } catch (e) { fail(e); } return;
    case 'my-test': try { const r = await api('admin_mysql_test', {}, true); admReload('my'); snd('ok'); toast('تست دود موفق بود؛ MySQL ' + r.version); } catch (e) { fail(e); } return;
    case 'my-migrate': if (!confirm('همه‌ی داده‌های SQLite در MySQL کپی شود؟ جدول‌های MySQL اول خالی می‌شوند.')) return; el.disabled = true; try { const r = await api('admin_mysql_migrate', {}, true); admReload('my'); setTimeout(() => { const o = $('#my-out'); if (o) o.innerHTML = `<div class="done">${ic('check')}<span>${Object.entries(r.counts).map(([k, v]) => k + ': ' + fa(v)).join(' · ')}</span></div>`; }, 300); toast('انتقال انجام شد و شمارش‌ها یکی بود.'); } catch (e) { el.disabled = false; fail(e); } return;
    case 'my-switch': if (!confirm(+el.dataset.v ? 'از این لحظه همه‌چیز روی MySQL برود؟' : 'به SQLite برگردیم؟ داده‌هایی که از سوییچ به بعد در MySQL ثبت شده‌اند در SQLite نیستند.')) return; try { await api('admin_mysql_switch', { on: +el.dataset.v }, true); S.admin = null; persist(); ui.adm = null; renderMain(); toast('انجام شد؛ دوباره وارد پیشخوان شوید.'); } catch (e) { fail(e); } return;
    case 'po-center': { const P = ui.post; return pickOnMap('مرکز منطقه برای جستجوی مدرسه‌ها', P.lat ? [P.lat, P.lng] : null, c => { P.lat = c[0]; P.lng = c[1]; renderMain(); }); }
    case 'po-term': { const P = ui.post, t = el.dataset.v; P.terms = P.terms.includes(t) ? P.terms.filter(x => x !== t) : [...P.terms, t]; return renderMain(); }
    case 'po-search': { const P = ui.post; el.disabled = true; try { const r = await api('admin_neshan_search', { lat: P.lat, lng: P.lng, terms: P.terms }, true); P.items = r.items; renderMain(); } catch (e) { el.disabled = false; fail(e); } return; }
    case 'po-iall': ui.post.items.forEach(x => { if (!x.code) x.sel = true; }); return renderMain();
    case 'po-import': { const P = ui.post; el.disabled = true; try { const r = await api('admin_import_places', { items: P.items.filter(x => x.sel && !x.code).map(x => ({ title: x.title, lat: x.lat, lng: x.lng, address: x.address })) }, true); r.places.forEach(pl => { const it = P.items.find(x => x.title === pl.name); if (it) it.code = pl.code; P.sel[pl.id] = true; }); const pl = await api('admin_places', {}, true); ui.adm.places = pl.list; renderMain(); snd('ok'); toast(`${fa(r.places.length)} مدرسه ثبت شد و لینک گرفت.`); } catch (e) { el.disabled = false; fail(e); } return; }
    case 'po-layout': ui.post.layout = el.dataset.v; return renderMain();
    case 'po-sall': ui.adm.places.filter(p => ['school', 'kinder'].includes(p.kind)).forEach(p => ui.post.sel[p.id] = true); return renderMain();
    case 'po-snone': ui.post.sel = {}; return renderMain();
    case 'po-print': { const P = ui.post, list = ui.adm.places.filter(p => P.sel[p.id]).slice(+el.dataset.b * 20, +el.dataset.b * 20 + 20); return printBatch(list, P.layout); }
    case 'adm-puser': try { const r = await api('admin_premium_user', { phone: en($('#pu-ph').value), days: +en($('#pu-d').value) || 0 }, true); toast(r.until ? 'اشتراک فعال شد.' : 'اشتراک لغو شد.'); } catch (e) { fail(e); } return;
    case 'adm-premium': try { await api('admin_team', { id: el.dataset.id, premium: el.checked ? 1 : 0 }, true); toast('ذخیره شد.'); } catch (e) { fail(e); } return;
    case 'adm-reply': try { await api('admin_ticket', { id: el.dataset.id, reply: $('#rep-' + el.dataset.id).value, status: 'answered' }, true); toast('پاسخ ثبت شد.'); ui.adm = null; renderMain(); } catch (e) { fail(e); } return;
    case 'adm-fake5': try { const r = await api('admin_fake', { target: el.dataset.v, n: 5, drivers: 40 }, true); snd('ok'); toast(`۵ همسایه‌ی آزمایشی کنار «${r.place}» ساخته شد.`); ui.adm = null; renderMain(); } catch (e) { fail(e); } return;
    case 'adm-nv': try { const r = await api('admin_place_nv', { id: el.dataset.id }, true); toast(r.result.ok ? `نشان تأیید کرد: «${r.result.title}» در ${fa(r.result.m)} متری.` : r.result.why === 'no-key-or-network' ? 'کلید سرویس نشان تنظیم نیست یا نشان پاسخ نداد.' : 'نشان مکانی با این نام همین‌جا پیدا نکرد.'); ui.adm = null; renderMain(); } catch (e) { fail(e); } return;
    case 'adm-pdel': if (!confirm(`«${el.dataset.n}» حذف شود؟${+el.dataset.f ? ' ' + fa(el.dataset.f) + ' خانواده این مکان را انتخاب کرده‌اند و مسیرک‌شان نیمه‌کاره می‌شود.' : ''}`)) return; try { await api('admin_place', { id: el.dataset.id, delete: 1 }, true); toast('حذف شد.'); ui.adm = null; renderMain(); } catch (e) { fail(e); } return;
    case 'sx-save': case 'sx-clear': { const k = el.dataset.k, v = a === 'sx-clear' ? '' : $('#sx-' + k).value.trim(); if (a === 'sx-save' && !v) return toast('مقدار را بنویسید.'); try { await api('admin_secret_set', { k, v }, true); admReload('sec'); snd('ok'); toast(a === 'sx-clear' ? 'پاک شد.' : 'ذخیره شد.'); } catch (e) { fail(e); } return; }
    case 'adm-test': { const o = $('#t-' + el.dataset.v); if (o) o.innerHTML = '<span class="muted small">در حال آزمون…</span>'; el.disabled = true; try { const r = await api('admin_test', { what: el.dataset.v, env: el.dataset.env || '' }, true); const hint = PP_HINT.find(([re]) => re.test(r.msg)); if (o) o.innerHTML = `<div class="${r.pass ? 'done' : 'hint warn'}" style="margin-top:6px;display:grid;gap:6px">${ic(r.pass ? 'check' : 'warn')}<span><b>${r.pass ? 'موفق' : 'ناموفق'}:</b> ${esc(r.msg)}</span>${!r.pass && hint ? `<span class="small">${hint[1]}</span>` : ''}</div>`; } catch (e) { if (o) o.innerHTML = `<div class="hint warn">${ic('warn')}<span>${esc(e.message)}</span></div>`; } el.disabled = false; return; }
    case 'sms-prov': case 'pay-env': { const k = a === 'sms-prov' ? 'sms_provider' : 'pay_env', v = el.dataset.v; if (k === 'pay_env' && v === 'live' && !confirm('درگاه روی حالت واقعی برود؟ از این لحظه پرداخت‌ها واقعی‌اند.')) return; try { await api('admin_setting', { k, v }, true); ui.adm.ov.settings[k] = v; renderMain(); toast('انجام شد.'); } catch (e) { fail(e); } return; }
    case 'err-clear': try { await api('admin_errors_clear', {}, true); admReload('health'); } catch (e) { fail(e); } return;
    case 'bk-now': try { await api('admin_backup_now', {}, true); admReload('health'); toast('پشتیبان ساخته شد.'); } catch (e) { fail(e); } return;
    case 'fk-fill': $('#fk-t').value = el.dataset.v; return;
    case 'adm-fake': try { const r = await api('admin_fake', { target: en($('#fk-t').value.trim()), n: +en($('#fk-n').value) || 5, drivers: +en($('#fk-d').value) || 0 }, true); snd('ok'); toast(`${fa(r.made)} کاربر آزمایشی کنار «${r.place}» ساخته شد.`); ui.adm = null; renderMain(); } catch (e) { fail(e); } return;
    case 'adm-purge': try { const r = await api('admin_purge_fake', {}, true); toast(`${fa(r.removed)} مسیرکِ آزمایشی حذف شد.`); ui.adm = null; renderMain(); } catch (e) { fail(e); } return;
    /* wizard */
    case 'w-close': { const ww = ui.wiz; ui.wiz = null; wizRender(); if (ww && !ww.done && ww.mode === 'new' && !S.token) toast('ثبت‌نام نیمه‌کاره روی همین گوشی ماند؛ هر وقت خواستید ادامه دهید.'); render(); return; }
    case 'w-notthis': { const lp = ui.linkPlace; ui.wiz = null; wizRender(); ui.linkPlace = null; history.replaceState(null, '', BASE); render(true); wizOpen(null, { mode: 'new' }); return offerUndo('سراغ جای دیگری رفتیم.', () => { ui.wiz = null; wizRender(); ui.linkPlace = lp; render(true); wizOpen(null, { mode: 'new', link: lp }); }); }
    case 'w-prev': w.step--; w.err = ''; return wizRender();
    case 'w-next': return wizNext();
    case 'w-set': { const v = el.dataset.v; w.d[el.dataset.k] = ['ok0', 'forKids'].includes(el.dataset.k) ? +v : v; if (el.dataset.k === 'forKids' && w.d.forKids === 1 && !w.d.kids.length) w.d.kids = [{ id: uid(), first: '', g: '', by: '' }]; w.err = ''; return wizRender(); }
    case 'w-kind': { w.kind = el.dataset.v; const K = KINDS[w.kind]; if (!w.label || Object.values(KINDS).some(k => k.lbl === w.label)) w.label = K.lbl; if (K.child === false) w.d.kids = []; else if (K.child && !w.d.kids.length) w.d.kids = [{ id: uid(), first: '', g: '', by: '' }]; w.near = null; w.place = null; w.err = ''; return wizRender(); }
    case 'w-count': { const ks = w.d.kids; if (+el.dataset.v > 0 && ks.length < 5) ks.push({ id: uid(), first: '', g: '', by: '' }); if (+el.dataset.v < 0 && ks.length > 1) ks.pop(); return wizRender(); }
    case 'w-kid': w.d.kids[+el.dataset.i][el.dataset.f] = el.dataset.v; return wizRender();
    case 'w-needs': { const v = el.dataset.v; w.d.needs = { out: v !== 'back', back: v !== 'out' }; return wizRender(); }
    case 'w-day': { const v = +el.dataset.v, ds = w.d.days || []; w.d.days = ds.includes(v) ? ds.filter(z => z !== v) : [...ds, v].sort(); return wizRender(); }
    case 'w-seats': { const n = (w.d.seats || 3) + +el.dataset.v; if (n > 5) return toast('بیشتر از ۵ نفر نمی‌شود؛ ایمنی بچه‌ها اول است.'); w.d.seats = Math.max(1, n); if (n === 5) toast('۵ نفر فقط وقتی حساب می‌شود که همه‌ی بچه‌ها زیر ۹ سال باشند.'); return wizRender(); }
    case 'w-val': { const v = el.dataset.v, vs = w.d.values || []; w.d.values = vs.includes(v) ? vs.filter(z => z !== v) : [...vs, v]; return wizRender(); }
    case 'w-rules': w.d.rules_at = el.checked ? Date.now() : null; w.err = ''; return;
    case 'w-show': w.d.phone_show = el.checked; return;
    case 'w-locate': if (!navigator.geolocation) return toast('این مرورگر موقعیت‌یابی ندارد؛ «انتخاب روی نقشه» را بزنید.'); toast('در حال گرفتن موقعیت؛ فقط با اجازه‌ی شما.');
      navigator.geolocation.getCurrentPosition(pos => { w.d.lat = +pos.coords.latitude.toFixed(5); w.d.lng = +pos.coords.longitude.toFixed(5); w.addr = ''; wizRender(); reverseFill(w); toast('ثبت شد. اگر دقیق نیست، «انتخاب روی نقشه» را بزنید.'); }, () => toast('موقعیت گرفته نشد؛ «انتخاب روی نقشه» را بزنید.'), { enableHighAccuracy: true, timeout: 10000 });
      return;
    case 'w-mapick': { const home = el.dataset.t === 'home', n = w.newPlace; const c = home ? (w.d.lat ? [w.d.lat, w.d.lng] : (w.link ? [w.link.lat, w.link.lng] : null)) : (n && n.lat ? [n.lat, n.lng] : (w.d.lat ? [w.d.lat, w.d.lng] : null));
      return pickOnMap(home ? 'موقعیت خانه' : 'در ورودی ' + destWord({ kind: w.kind }), c || [35.7, 51.39], ll => { if (home) { w.d.lat = ll[0]; w.d.lng = ll[1]; w.addr = PKM.addr || ''; if (PKM.hood && (!w.d.hood || w.autoHood)) { w.d.hood = PKM.hood; w.autoHood = true; } } else { n.lat = ll[0]; n.lng = ll[1]; checkDup(w); } wizRender(); }); }
    case 'pk-cancel': return closePicker();
    case 'pk-ok': { if (!PKM.cur) return toast('نقشه بالا نیامد؛ «موقعیت من» را بزنید.'); const f = PKM.done, c = PKM.cur; closePicker(); f && f(c); return toast('موقعیت ثبت شد.'); }
    case 'pk-here': if (!navigator.geolocation) return; navigator.geolocation.getCurrentPosition(pos => { PKM.cur = [+pos.coords.latitude.toFixed(5), +pos.coords.longitude.toFixed(5)]; if (PK.map) { PK.prog = null; PK.map.flyTo({ center: [PKM.cur[1], PKM.cur[0]], zoom: 17 }); } pkReverse(); }, () => toast('موقعیت گرفته نشد.'), { enableHighAccuracy: true, timeout: 10000 }); return;
    case 'w-job': w.d.job = w.d.job === el.dataset.v ? '' : el.dataset.v; return wizRender();
    case 'w-relig': w.d.relig = !w.d.relig; return wizRender();
    case 'w-rel': { const v = el.dataset.v; if (REL[v]) { w.d.rel = v; w.d.pg = REL[v][1]; } else { w.d.pg = v; delete w.d.rel; } w.err = ''; return wizRender(); }
    case 'w-nearall': w.nearAll = true; return wizRender();
    case 'w-px': return placeExplorer('pick', w.nearAt || (w.d.lat ? [w.d.lat, w.d.lng] : null), w.kind);
    case 'w-nearmap': return pickOnMap('مکان را روی نقشه نشان دهید', w.nearAt || [w.d.lat, w.d.lng], c => { w.nearAt = c; w.near = null; w.nearAll = false; wizRender(); loadNear(w); });
    case 'w-report': { const pl = (w.near || []).find(x => x.id === el.dataset.id); if (!pl) return;
      return sheet('این مکان اشتباه است؟', `<p style="line-height:2">«${esc(pl.name)}» آزمایشی، تکراری یا اشتباه ثبت شده؟ ${pl.flags ? `<b>یک نفر دیگر هم گزارش داده؛ با تأیید شما حذف می‌شود.</b>` : 'گزارش شما ثبت می‌شود و اگر یک نفر دیگر هم تأیید کند، حذف می‌شود.'}</p><p class="muted small">مکانی که خانواده‌ای انتخابش کرده، یا مدیر یا نقشه‌ی نشان تأییدش کرده، حذف نمی‌شود.</p><button class="btn block" data-a="w-report-ok" data-id="${pl.id}">${pl.flags ? 'تأیید می‌کنم؛ حذف شود' : 'بله، گزارش می‌دهم'}</button>`); }
    case 'w-report-ok': try { const r = await api('place_report', { id: el.dataset.id }); closeLayer(); snd('ok'); toast(r.deleted ? 'حذف شد؛ ممنون که کمک کردید فهرست تمیز بماند.' : 'گزارش ثبت شد؛ با تأیید یک نفر دیگر حذف می‌شود.'); w.near = null; loadNear(w); } catch (e) { fail(e); } return;
    case 'w-rot': { const k = weekIdx(satOf(0)) % 2; w.d.rot_par = el.dataset.v === 'am' ? k : 1 - k; w.err = ''; return wizRender(); }
    case 'w-arrday': { const t = (w.d.arrive || '').split('T')[1] || ''; w.d.arrive = el.dataset.v + 'T' + t; w.err = ''; return wizRender(); }
    case 'w-free': w.d.free_ride = el.checked; if (el.checked) delete w.d.card; return wizRender();
    case 'w-morerel': w.moreRel = true; return wizRender();
    case 'w-contact': w.d.contact = el.dataset.v; w.d.phone_show = el.dataset.v === 'phone'; w.err = ''; return wizRender();
    case 'w-call': return otpSend(w, 'call');
    case 'w-bale': w.otpSent = false; return otpSend(w, 'bale');
    case 'w-guest': return guestStart(w);
    case 'undo': { const f = ui.undoFn; ui.undoFn = null; $('#undo').classList.remove('show'); if (f) f(); return; }
    case 'w-paste': { const ll = parseLoc($('#w-paste').value); if (!ll) return toast('مختصاتی در این لینک پیدا نشد. لینک‌های کوتاه را اول در مرورگر باز کنید و آدرس کامل را بچسبانید.'); w.d.lat = ll[0]; w.d.lng = ll[1]; if (PK.map) PK.map.jumpTo({ center: [ll[1], ll[0]], zoom: 16.5 }); reverseFill(w); return toast('موقعیت ثبت شد.'); }
    case 'w-np-new': w.newPlace = { name: w.pq || '', city: 'تهران', in: '07:30', out: '13:30', lat: null, lng: null, dups: [] }; w.place = null; return wizRender();
    case 'w-np-here': if (!navigator.geolocation) return toast('این مرورگر موقعیت‌یابی ندارد.'); navigator.geolocation.getCurrentPosition(pos => { w.newPlace.lat = +pos.coords.latitude.toFixed(5); w.newPlace.lng = +pos.coords.longitude.toFixed(5); if (PK.map) { PK.prog = null; PK.map.flyTo({ center: [w.newPlace.lng, w.newPlace.lat], zoom: 17 }); } else wizRender(); checkDup(w); }, () => toast('موقعیت گرفته نشد.'), { enableHighAccuracy: true, timeout: 10000 }); return;
    case 'w-np-paste': { const ll = parseLoc($('#w-np-paste').value); if (!ll) return toast('مختصاتی پیدا نشد.'); w.newPlace.lat = ll[0]; w.newPlace.lng = ll[1]; if (PK.map) PK.map.jumpTo({ center: [ll[1], ll[0]], zoom: 17 }); else wizRender(); checkDup(w); return toast('موقعیت ثبت شد.'); }
    case 'w-np-cancel': w.newPlace = null; return wizRender();
    case 'w-np': w.newPlace[el.dataset.k] = el.dataset.v; w.err = ''; return wizRender();
    case 'w-dupok': w.newPlace.dupOk = true; w.newPlace.dups = []; return wizRender();
    case 'w-pick': { const before = { place: w.place, newPlace: w.newPlace }; let pl = (w.near || []).find(z => z.id === el.dataset.id) || ((w.newPlace && w.newPlace.dups) || []).find(z => z.id === el.dataset.id); w.place = pl; w.newPlace = null; w.err = ''; if (before.newPlace) offerUndo(`«${pl.name}» انتخاب شد.`, () => { w.place = before.place; w.newPlace = before.newPlace; wizRender(); }); if (pl && (pl.gender === 'f' || pl.gender === 'm')) w.d.kids.forEach(k => k.g = pl.gender); return wizRender(); }
    case 'w-est': w.d.snapp = w.route.est || estSnapp(w.route.m); return wizRender();
    case 'w-snapp': { const tgt = w.link || w.place || w.newPlace, here = el.dataset.v; const txt = here === 'home' ? `${tgt.name}${tgt.city ? '، ' + tgt.city : ''}` : (w.addr || ('محله ' + (w.d.hood || '')));
      const win = window.open('https://app.snapp.taxi/', '_blank'); copyText(txt).catch(() => {});
      if (!win) location.href = 'https://app.snapp.taxi/';
      return sheet('قیمت را در اسنپ ببینید', `<ol class="steps"><li>اسنپ باز شد (اگر نشد <a href="https://app.snapp.taxi/" target="_blank" rel="noopener">اینجا</a>). مبدأ همان جایی است که هستید.</li><li>در «مقصد» بچسبانید: <b>${esc(txt)}</b> (کپی شد).</li><li>فقط قیمت را ببینید؛ <b>درخواست سفر ندهید</b>. برگردید و عدد را اینجا بنویسید.</li></ol><p class="muted small">اسنپ لینک عمومی برای پر کردن خودکار مقصد ندارد؛ برای همین مقصد را کپی می‌کنیم.</p><button class="btn ac block" data-a="close">برگشتم</button>`); }
    case 'w-resend': w.otpSent = false; return otpSend(w, 'sms');
    case 'w-finish': ui.wiz = null; wizRender(); ui.tab = 'peers'; return render(true);
    case 'w-poster': ui.wiz = null; wizRender(); render(); return posterSheet();
  }
}
function parseLoc(s) {
  s = decodeURIComponent(String(s || ''));
  const pats = [/@(-?\d+\.\d+),(-?\d+\.\d+)/, /[?&](?:q|ll|query|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/, /latitude=(-?\d+\.\d+).*longitude=(-?\d+\.\d+)/, /geo:(-?\d+\.\d+),(-?\d+\.\d+)/, /(-?\d{2}\.\d{3,})[,\s]+(-?\d{2}\.\d{3,})/];
  for (const r of pats) { const m = s.match(r); if (m) { const a = +m[1], b = +m[2]; return a > 20 && a < 45 && b > 40 && b < 65 ? [a, b] : (b > 20 && b < 45 ? [b, a] : null); } }
  return null;
}
function loginSheet(verify) {
  const L = ui.lg;
  sheet(verify || (S.token && !S.phone) ? 'تأیید شماره' : 'ورود', L ? `<p>کد تأیید به <b dir="ltr">${esc(fa(L.ph))}</b> رفت.</p><div class="field"><label for="lg-otp">کد</label><input id="lg-otp" class="otp" inputmode="numeric" autocomplete="one-time-code"></div>${L.dev ? `<p class="note">${ic('flask')}کد آزمایشی: <b dir="ltr">${fa(L.dev)}</b></p>` : ''}<button class="btn" data-a="lg-verify">ورود</button>`
    : `<div class="field"><label for="lg-ph">شماره همراه</label><input id="lg-ph" type="tel" inputmode="tel" dir="ltr" placeholder="0912 123 4567" autocomplete="tel"></div><div class="row wrap"><button class="btn" data-a="lg-send">ارسال کد با پیامک</button>${CFG.flags.sms_direct ? '' : '<button class="btn line" data-a="lg-call">تماس صوتی</button>'}${CFG.flags.otp_bale ? '<button class="btn line" data-a="lg-bale">در بله بفرست</button>' : ''}</div>`, S.token && !S.phone ? 'با تأیید شماره، «تأییدنشده» از کنار نام‌تان برمی‌دارد و شماره‌ی هم‌مسیرها را می‌بینید.' : 'همه‌ی مسیرک‌های شما با همین شماره');
}
async function ticketSheet() {
  ui.tk = ui.tk || { cat: 'فنی', text: '' }; let list = [];
  try { list = (await api('tickets')).list; } catch (e) {}
  sheet('پشتیبانی و تیکت', `<div class="chips">${['فنی', 'پیشنهاد', 'گزارش رفتار', 'حساب و پرداخت', 'سایر'].map(c => `<button class="chip" data-a="tk-cat" data-v="${c}" aria-pressed="${ui.tk.cat === c}">${c}</button>`).join('')}</div>
    <div class="field"><label for="tk">چه شده؟ با جزئیات بنویسید.</label><textarea id="tk">${esc(ui.tk.text)}</textarea></div><button class="btn ac" data-a="tk-send">ثبت تیکت</button>
    ${list.map(k => `<div class="srow"><b>#${fa(k.no)} · ${esc(k.cat)} <span class="tag">${k.status === 'open' ? 'در صف' : k.status === 'answered' ? 'پاسخ داده شد' : 'بسته'}</span></b><span class="small">${esc(k.text)}</span>${k.reply ? `<span class="hint" style="padding:8px 12px">${esc(k.reply)}</span>` : ''}</div>`).join('')}`);
}
async function radioSheet() {
  sheet('رادیو رسیدیم', '<p class="muted">در حال آماده‌سازی…</p>'); let eps = [];
  try { eps = (await (await fetch('radio.json', { cache: 'no-store' })).json()).episodes || []; } catch (e) {}
  if (!$('.sheet')) return;
  $('.sheet-b').innerHTML = eps.length ? eps.map(e => `<div class="card stack" style="padding:14px"><b>${esc(e.title)}</b>${e.desc ? `<span class="muted small">${esc(e.desc)}</span>` : ''}<audio controls preload="none" src="${esc(e.src)}" style="width:100%"></audio></div>`).join('')
    : `${cityAnim('')}<p><b>به‌زودی روی آنتن!</b> اپیزودهای کوتاه و شاد برای مسیر: قصه، دانستنی، معما و ادب و مهربانی؛ چند دقیقه‌ای، با نسخه‌ی بدون موسیقی.</p>
      <button class="btn ac block" data-a="radio-vote" ${S.radioVoted ? 'disabled' : ''}>${ic('heart')}${S.radioVoted ? 'صدای شما شمرده شد' : 'دوست دارم زود راه بیفتد'}</button>
      <p class="muted small" style="text-align:center"><b class="num">${fa(CFG.radio_votes || 0)}</b> نفر منتظر رادیو رسیدیم هستند.</p>`;
}
async function openCode(code) {
  try { const r = await api('place_code', { code }); ui.linkPlace = r.place; history.replaceState(null, '', BASE === '/' ? '/' + code : BASE + '#/c/' + code); const own = P.find(x => x.place && x.place.id === r.place.id); if (own) { ui.linkPlace = null; history.replaceState(null, '', BASE); return setActive(own.id); } render(true); wizOpen(null, { mode: 'new', link: r.place }); }
  catch (e) { toast(e.code === 'notfound' ? 'این لینک پیدا نشد؛ کد را دوباره بررسی کنید.' : e.message); history.replaceState(null, '', BASE); render(true); }
}

/* ═════════ splash ═════════ */
function dockFun() {
  const dock = $('#dock'); if (!dock || dock.classList.contains('hide') || isDesk() || ui.wiz || $('#layer').innerHTML || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (Date.now() - (S.funAt || 0) < 3 * 3600e3) return;
  const pats = ['honk', 'kids', 'smoke', 'hop'], k = pats[((S.funI ?? -1) + 1) % pats.length]; S.funI = pats.indexOf(k); S.funAt = Date.now(); persist();
  const r = dock.getBoundingClientRect(), el = document.createElement('div'); el.className = 'dock-fun ' + k; el.style.bottom = (innerHeight - r.top - 6) + 'px'; el.setAttribute('aria-hidden', 'true');
  const kid = c => `<svg viewBox="0 0 16 24" class="fk"><circle cx="8" cy="5" r="4" fill="#FFE1C4" stroke="#04140B" stroke-width="1.4"/><path d="M3 22l2-8h6l2 8M5 14l-3 3M11 14l3 3" stroke="#04140B" stroke-width="1.6" fill="${c}"/></svg>`;
  el.innerHTML = k === 'smoke' ? `<div class="fr"><i class="pf"></i><i class="pf"></i><i class="pf"></i><em>ویژژژ…</em></div>` : `<div class="fr"><div class="fc">${CARTOON_CAR}</div>${k === 'kids' ? `<div class="kids3">${kid('#F97316')}${kid('#2563EB')}${kid('#DB2777')}</div>` : ''}${k === 'hop' ? '<span class="heart">❤</span>' : ''}<i class="pf"></i></div>`;
  document.body.appendChild(el); snd(k === 'smoke' ? 'whoosh' : k === 'honk' ? 'honk' : 'step'); if (k === 'kids') setTimeout(() => snd('ok'), 900); if (k === 'hop') setTimeout(() => snd('honk'), 1500);
  setTimeout(() => el.remove(), 6200);
}
/** «بسم‌الله» as a soft toast once per launch, after the first screen has settled (flag bismillah). A tap hides it at once. */
function bism() {
  if (S.bism === false || ui.bismDone) return; ui.bismDone = 1;
  const el = document.createElement('div'); el.className = 'bism-t'; el.setAttribute('role', 'img'); el.setAttribute('aria-label', 'بسم الله الرحمن الرحیم'); el.innerHTML = '<img src="assets/bism.png?v=22" alt="" width="220" height="220" decoding="async">';
  const go = fast => { if (!el.isConnected || el.classList.contains('out')) return; el.classList.add('out'); if (fast) el.classList.add('now'); setTimeout(() => el.remove(), fast ? 200 : 700); };
  el.addEventListener('pointerdown', () => go(true)); document.body.appendChild(el); setTimeout(() => go(false), 2000);
}
function splash(force) {
  let el = $('#splash');
  if (S.bism !== false) { const im = new Image(); im.src = 'assets/bism.png?v=22'; }
  if (!el && force) { location.reload(); return; }
  if (!el) { setTimeout(bism, 900); return; }
  const end = () => { if (!el.isConnected) return; el.classList.add('out'); setTimeout(() => el.remove(), 360); setTimeout(bism, 900); };
  el.addEventListener('click', end); el.addEventListener('keydown', e => { if (['Enter', ' ', 'Escape'].includes(e.key)) end(); });
  el.focus();
  setTimeout(end, matchMedia('(prefers-reduced-motion: reduce)').matches ? 1400 : 4400);
}

/* ═════════ events ═════════ */
document.addEventListener('click', e => {
  const tab = e.target.closest('[data-tab]');
  if (tab) { if (!$('.chatx')) closeLayer(); ui.tab = tab.dataset.tab; render(true); scrollTo(0, 0); if (ui.tab !== 'peers') loadTeam(); return; }
  const el = e.target.closest('[data-a]');
  if (!el || el.disabled || el.dataset.a === '' || el.tagName === 'SELECT') return;
  if (el.tagName === 'INPUT' && el.type === 'checkbox') return;
  act(el.dataset.a, el);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('.px')) return pxClose();
  if (e.key === 'Enter' && e.target.id === 'px-q') { const b = $('#px-sug [data-a="px-go"]'); if (b) b.click(); return; }
  if (e.key === 'Escape') { if ($('.chatx')) chatClose(); else if ($('#layer').innerHTML) closeLayer(); else if (ui.wiz && !ui.wiz.busy) act('w-close'); }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('#title[data-a="switcher"]')) { e.preventDefault(); switcher(); }
  if (e.key === 'Enter' && ui.wiz && e.target.matches('.wiz input:not([type=checkbox])') && !ui.wiz.busy) { e.preventDefault(); wizNext(); }
  if (e.key === 'Enter' && e.target.id === 'code') act('go-code');
  if (e.key === 'Enter' && e.target.id === 'chat-in') { e.preventDefault(); act('chat-send', e.target); }
  if (e.key === 'Escape' && document.body.classList.contains('map-full')) act('map-full');
});
document.addEventListener('toggle', e => { const d = e.target; if (d && d.dataset && d.dataset.dk) { ui.dOpen = ui.dOpen || {}; ui.dOpen[d.dataset.dk] = d.open; } }, true);
document.addEventListener('input', e => { const el = e.target; if (el.dataset && el.dataset.ti != null && ui.tipsEd) ui.tipsEd[+el.dataset.ti][el.dataset.tf] = el.value; });
document.addEventListener('change', e => { const el = e.target;
  if (el.matches('[data-a="launch-man"]')) { api('admin_launch_set', { k: el.dataset.k, v: el.checked ? 1 : 0 }, true).then(() => { ui.launch.manual[el.dataset.k] = el.checked; renderMain(); }).catch(fail); return; }
  if (el.matches('[data-a="ev-sound"]')) { S.evSound = el.checked; persist(); return; }
  if (el.matches('[data-a="w-daily"]') && ui.wiz) { const w = ui.wiz; w.d.daily = el.checked; if (el.checked) { w.d.days = [0, 1, 2, 3, 4]; } wizRender(); }
  if (el.id === 'tips-up' && el.files[0]) { el.files[0].text().then(t => { const j = JSON.parse(t); if (!Array.isArray(j)) throw 0; ui.tipsEd = j.filter(x => x && x.t).map(x => ({ a: x.a || '', t: String(x.t), s: String(x.s || '') })); renderMain(); toast(`${fa(ui.tipsEd.length)} نکته بارگذاری شد؛ «ذخیره» را بزنید.`); }).catch(() => toast('این فایل JSON معتبر نیست.')); }
  if (el.dataset && el.dataset.ti != null && ui.tipsEd) ui.tipsEd[+el.dataset.ti][el.dataset.tf] = el.value;
  if (el.matches('select[data-a="adm-set"]')) act('adm-set', el);
  if (el.matches('[data-a="po-sel"]')) { ui.post.sel[el.dataset.id] = el.checked; renderMain(); }
  if (el.matches('[data-a="po-isel"]')) { ui.post.items[+el.dataset.i].sel = el.checked; renderMain(); }
  if (el.dataset.arrt && ui.wiz) { const k = (ui.wiz.d.arrive || '').split('T')[0] || isoDay(0); ui.wiz.d.arrive = k + 'T' + el.value; }
  if (el.matches('input[type=checkbox][data-a]')) act(el.dataset.a, el);
  if (ui.wiz && el.matches('select[data-wk]')) { ui.wiz.d.kids[+el.dataset.wk][el.dataset.f] = +el.value || ''; }
  if (ui.wiz && el.matches('select[data-wp]')) ui.wiz.newPlace[el.dataset.wp] = el.value;
});
let pqT;
document.addEventListener('input', e => {
  if (e.target.id === 'px-q') return pxSearch(e.target.value);
  const el = e.target, w = ui.wiz; if (!w) return;
  if (el.dataset.w) { w[el.dataset.w] = el.value; if (el.dataset.w === 'pq') { clearTimeout(pqT); pqT = setTimeout(() => loadNear(w), 400); } }
  if (el.dataset.wd) { w.d[el.dataset.wd] = el.value; if (el.dataset.wd === 'hood') w.autoHood = false; }
  if (el.dataset.wk != null && el.tagName === 'INPUT') w.d.kids[+el.dataset.wk][el.dataset.f] = el.value;
  if (el.dataset.wp && el.tagName === 'INPUT') w.newPlace[el.dataset.wp] = el.value;
});
addEventListener('popstate', () => { ui.admin = location.hash === '#admin'; render(true); });

/* ═════════ boot ═════════ */
const BASE = location.pathname.replace(/[^/]*$/, '').replace(/\/[A-Z2-9]{8}\/?$/, '/');
{ let sent = 0; const rep = (m, u) => { if (sent++ > 5) return; try { fetch(API + 'client_error', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ msg: String(m).slice(0, 380), url: location.pathname + location.hash.slice(0, 40) + ' ' + (u || '') }), keepalive: true }); } catch (e) {} };
  addEventListener('error', e => { if (e.message && !/ResizeObserver|Script error/.test(e.message)) rep(e.message + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno); });
  addEventListener('unhandledrejection', e => { const r = e.reason; if (r && r.code !== 'net' && !(r.message || '').startsWith('اتصال')) rep('promise: ' + (r && (r.stack || r.message) || r)); }); }
{ const r = new URLSearchParams(location.search).get('r'); if (r && /^A[0-9A-F]{6}$/i.test(r)) { try { const s0 = JSON.parse(localStorage.getItem(KEY) || '{}'); s0.ref = r.toUpperCase(); localStorage.setItem(KEY, JSON.stringify(s0)); } catch (e) {} } }
function loadApk() { fetch('/app/android.json?' + Math.floor(Date.now() / 36e5), { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(j => { const c = CFG.app || {}; ui.apk = j && j.url ? j : c.url ? { ver: c.ver, url: c.url } : null; renderSide(); }).catch(() => { const c = CFG.app || {}; if (c.url) ui.apk = { ver: c.ver, url: c.url }; }); }
function otpAuto(sel) { if (!('OTPCredential' in window)) return; try { ui.otpAbort && ui.otpAbort.abort(); const ac = ui.otpAbort = new AbortController(); setTimeout(() => ac.abort(), 180000);
  navigator.credentials.get({ otp: { transport: ['sms'] }, signal: ac.signal }).then(o => { const i = $(sel); if (o && o.code && i) { i.value = fa(o.code); i.dispatchEvent(new Event('input', { bubbles: true })); snd('ok'); const b = sel === '#lg-otp' ? $('[data-a="lg-verify"]') : $('[data-a="w-next"]'); if (b) b.click(); } }).catch(() => {}); } catch (e) {} }
async function nativeInit() { if (!NATIVE) return; document.body.classList.add('native');
  try { const PN = NP.PushNotifications; if (PN && / push/.test(navigator.userAgent) && S.token) { const st = await PN.checkPermissions(); if (st.receive !== 'granted') await PN.requestPermissions(); PN.addListener('registration', t => { api('push_reg', { token: t.value }).catch(() => {}); }); PN.addListener('pushNotificationActionPerformed', () => { ui.tab = 'team'; render(true); }); await PN.register(); } } catch (e) {}
  try { const LN = NP.LocalNotifications; if (LN) { await LN.createChannel({ id: 'residim', name: 'رسیدیم', description: 'سوار شدن، رسیدن، پیام تیم', importance: 5, visibility: 1, vibration: true, lights: true, lightColor: '#16A34A' }); await LN.createChannel({ id: 'turns', name: 'نوبت فردا', description: 'یادآوری شب قبل از نوبت رانندگی', importance: 5, visibility: 1, vibration: true });
      const st = await LN.checkPermissions(); if (st.display !== 'granted') await LN.requestPermissions();
      LN.addListener('localNotificationActionPerformed', () => { ui.tab = 'team'; render(true); }); } } catch (e) {}
  try { NP.App && NP.App.addListener('backButton', () => { if ($('.chatx')) chatClose(); else if ($('#layer').innerHTML) closeLayer(); else if (ui.wiz) act('w-close'); else if (ui.tab !== 'peers' && active()) { ui.tab = 'peers'; render(true); } else NP.App.minimizeApp(); }); } catch (e) {} }
(async function boot() {
  setTimeout(loadApk, 1200); nativeInit();
  splash();
  try { const r = await fetch(API + 'cfg', { cache: 'no-store' }); const j = await r.json(); if (j.ok) { CFG = j; if (j.jyear) JY = j.jyear; const bm = !(j.flags && j.flags.bismillah === false); if (S.bism !== bm) { S.bism = bm; persist(); } } } catch (e) {}
  await refreshMe();
  const code = (location.pathname.match(/\/([A-Z2-9]{8})\/?$/) || [])[1] || (location.hash.match(/^#\/c\/([A-Z2-9]{8})/) || [])[1];
  if (location.hash === '#admin') ui.admin = true;
  { const fm = location.hash.match(/^#fam\/([A-Za-z0-9]{6,12})/); if (fm) ui.famCode = fm[1]; const tm = location.hash.match(/^#trust\/([A-Za-z0-9]{6,12})/); if (tm) ui.trustCode = tm[1]; }
  { const am = location.hash.match(/^#amb\/([A-Za-z0-9]{8,40})/); if (am) { ui.amb = am[1]; const mr = document.createElement('meta'); mr.name = 'robots'; mr.content = 'noindex,nofollow'; document.head.appendChild(mr); } }
  if (!active()) S.active = (allProfiles()[0] || {}).id || null;
  applyAccent();
  { const pm = location.hash.match(/^#pay\/(ok|fail)\/([A-Za-z0-9]+)/); if (pm) { render(true); return payResult(pm[1], pm[2]); } }
  if (code) return openCode(code);
  const rd = location.hash.match(/^#\/([^/]+)\/(.+)$/);
  if (rd && rd[1] !== 'c') { try { const city = decodeURIComponent(rd[1]), name = decodeURIComponent(rd[2]).replace(/-/g, ' '); const r = await api('place_near', { q: name.split(' ').slice(0, 3).join(' ') }); const m = r.places.filter(x => !city || x.city === city || /^[a-z]+$/i.test(city)); if (m.length === 1) return openCode(m[0].code); if (m.length) { render(true); return sheet('کدام یکی؟', m.map(x => `<button class="place-opt" data-a="open-code" data-c="${x.code}">${kindIc(x.kind, false, false)}<span class="grow">${esc(x.name)}<small>${esc(x.city)}${x.shift ? ' · ' + esc(x.shift) : ''} · کد ${x.code}</small></span></button>`).join(''), 'چند مکان با این نام هست؛ برای همین لینک‌های رسیدیم کد کوتاه دارند.'); } } catch (e) {} }
  render(true);
  if (ui.famCode) famJoin(ui.famCode);
  if (ui.trustCode) { if (!S.phone) { toast('برای پیوستن به‌عنوان راننده‌ی معتمد، با شماره‌ی خودتان وارد شوید.'); act('login'); } else { try { const r = await api('trust_join', { code: ui.trustCode }); ui.trustCode = null; history.replaceState(null, '', location.pathname); await refreshMe(); S.active = r.profile_id; persist(); render(true); toast('به تیم پیوستید؛ خوش آمدید!'); } catch (e) { fail(e); } } }
  const p = active();
  if (p && p.complete) { if (p.team) { ui.tab = 'team'; await loadTeam(); render(); } loadPeers(); loadInbox(); }
  setInterval(liveTick, 10000);
  setTimeout(() => { if (Math.random() < .6) dockFun(); }, 25000 + Math.random() * 35000);
  setInterval(() => { if (!document.hidden && S.token && active() && active().complete && !ui.wiz) { loadInbox(); if (ui.tab !== 'peers' && active().team) loadTeam().then(watchArrival); } }, 20000);
  setInterval(() => { if (!document.hidden && S.token && active() && active().team && !ui.wiz) loadInbox(); }, 9000); // urgent and «near» messages arrive within seconds
})();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
window.__rs = { PM, dockFun, liveTick, get S() { return S; }, get P() { return P; }, get ui() { return ui; }, api, planOf, balances };
})();
