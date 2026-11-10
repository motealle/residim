/* «قصه‌های هم‌مسیری»: wheel of stories → the chosen story (poster or film) → share as poster, story image, caption, mp4.
   Data: stories-data.js (generated). Music: rsmusic.js. No dependency on the app's code, so nothing here can break the app. */
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const fa = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clean = x => x.replace(/\[[^\]]+\]/g, '').replace(/[ً-ْ]/g, '').replace(/\s+/g, ' ').trim();
  const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2600); };
  const ST = window.STORIES || [], AUD = window.STORY_AUD || {}, FILMS = window.STORY_FILMS || {};
  const V = '51', FONT = 'Vazirmatn,Tahoma,sans-serif';
  /* one palette per story: a→b = art gradient, d = deep tone for text panels, l = light tint */
  const PALS = {
    dawn: { a: '#FF7A59', b: '#FFC46B', d: '#A9361A', l: '#FFF1E8' }, sun: { a: '#F59E0B', b: '#FFD966', d: '#8A4F00', l: '#FFF7DC' },
    sky: { a: '#2F6BFF', b: '#6FC3FF', d: '#173A9E', l: '#EAF3FF' }, rose: { a: '#F43F75', b: '#FF9DB5', d: '#9C1546', l: '#FFEAF1' },
    grape: { a: '#7454F6', b: '#B794FF', d: '#3F23AE', l: '#F2EDFF' }, teal: { a: '#0E9F9A', b: '#5EE3D1', d: '#05605C', l: '#E6FBF8' },
    mint: { a: '#12A865', b: '#5FE0A0', d: '#0A6A3F', l: '#E6F9EF' }, night: { a: '#1E2A78', b: '#6A4FD6', d: '#141B52', l: '#EEEBFF' } };
  const pal = s => PALS[s.pal] || PALS.mint;
  const pv = p => `--a:${p.a};--b:${p.b};--d:${p.d};--l:${p.l}`;
  const URL0 = 'https://residim.ir/stories/';
  const order = [...ST.filter(s => s.main), ...ST.filter(s => !s.main)];
  let cur = 0, aud = 'all', UID = 0;

  /* ───── icon set (24×24, drawn in one colour; details in white) ───── */
  const W = '#fff';
  const I = {
    school: c => `<path d="M3 21V10.5l9-5.5 9 5.5V21h-6.5v-5h-5v5z" fill="${c}"/><path d="M12 5V1.2h4.4l-1.2 1.4 1.2 1.4H12" fill="${c}"/><circle cx="12" cy="11.3" r="2.2" fill="${W}"/>`,
    office: c => `<path d="M4 21V3h10v18zM15 21V9h5v12z" fill="${c}"/>${[6, 10, 14].map(y => `<rect x="6.2" y="${y}" width="2" height="2" fill="${W}"/><rect x="9.8" y="${y}" width="2" height="2" fill="${W}"/>`).join('')}<rect x="16.6" y="12" width="1.8" height="1.8" fill="${W}"/><rect x="16.6" y="16" width="1.8" height="1.8" fill="${W}"/>`,
    cap: c => `<path d="M12 4 1 9l11 5 9-4.1V16h2V9z" fill="${c}"/><path d="M5 13.2v3.6c0 1.5 3.1 3.2 7 3.2s7-1.7 7-3.2v-3.6l-7 3.2z" fill="${c}"/>`,
    book: c => `<path d="M3 5.2c3.2-1.3 6.3-1.1 9 .9 2.7-2 5.8-2.2 9-.9v14c-3.2-1.3-6.3-1.1-9 .9-2.7-2-5.8-2.2-9-.9z" fill="${c}"/><path d="M12 6.4v13.4" stroke="${W}" stroke-width="1.4"/>`,
    factory: c => `<path d="M2.5 21V11l5 3v-3l5 3v-3l5 3V4h3.5v17z" fill="${c}"/><rect x="5" y="16.5" width="2.4" height="2.4" fill="${W}"/><rect x="10" y="16.5" width="2.4" height="2.4" fill="${W}"/><rect x="15" y="16.5" width="2.4" height="2.4" fill="${W}"/>`,
    ball: c => `<circle cx="12" cy="12" r="9.5" fill="${c}"/><path d="m12 7.6 3.4 2.5-1.3 4H9.9l-1.3-4z" fill="${W}"/>`,
    cal: c => `<rect x="3.5" y="5" width="17" height="15.5" rx="3" fill="${c}"/><rect x="7" y="2.5" width="2.2" height="5" rx="1" fill="${c}"/><rect x="14.8" y="2.5" width="2.2" height="5" rx="1" fill="${c}"/><rect x="6" y="10" width="12" height="8" rx="1.5" fill="${W}"/><rect x="8" y="12" width="3" height="3" rx=".8" fill="${c}"/>`,
    train: c => `<path d="M6 3h12a2.5 2.5 0 0 1 2.5 2.5V15a3 3 0 0 1-3 3l2 3h-2.2l-2-3H8.7l-2 3H4.5l2-3a3 3 0 0 1-3-3V5.5A2.5 2.5 0 0 1 6 3z" fill="${c}"/><rect x="6" y="6" width="12" height="5" rx="1.2" fill="${W}"/><circle cx="8" cy="14.5" r="1.3" fill="${W}"/><circle cx="16" cy="14.5" r="1.3" fill="${W}"/>`,
    dome: c => `<path d="M11 2.5h2v2.2c3.6 1.8 6.5 4 6.5 7.3H4.5c0-3.3 2.9-5.5 6.5-7.3z" fill="${c}"/><path d="M4 13h16v8h-5.5v-3.5a2.5 2.5 0 0 0-5 0V21H4z" fill="${c}"/><path d="M21 21V8.5h1.6V21zM1.4 21V8.5H3V21z" fill="${c}"/>`,
    moon: c => `<path d="M15.5 3.2A9 9 0 1 0 20.8 16 7.5 7.5 0 0 1 15.5 3.2z" fill="${c}"/>`,
    metro: c => `<circle cx="12" cy="12" r="9.5" fill="${c}"/><path d="M7.2 16.5V7.5h1.9l2.9 4.6 2.9-4.6h1.9v9h-2v-5.6L12 15.2l-2.8-4.3v5.6z" fill="${W}"/>`,
    art: c => `<path d="M12 2.5a9.5 9.5 0 0 0 0 19c1.6 0 2.2-1 2.2-2 0-1.4-1.4-1.8-1.4-3.1 0-1 .9-1.6 2-1.6h2.4a4.3 4.3 0 0 0 4.3-4.3C21.5 6.1 17.3 2.5 12 2.5z" fill="${c}"/><circle cx="7.5" cy="11" r="1.6" fill="${W}"/><circle cx="10" cy="7" r="1.6" fill="${W}"/><circle cx="14.5" cy="6.8" r="1.6" fill="${W}"/>`,
    cross: c => `<rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="${c}"/><path d="M10 6.5h4v3.5h3.5v4H14v3.5h-4V14H6.5v-4H10z" fill="${W}"/>`,
    heart: c => `<path d="M12 21s-8.5-5.2-8.5-11.3A4.7 4.7 0 0 1 12 7a4.7 4.7 0 0 1 8.5 2.7C20.5 15.8 12 21 12 21z" fill="${c}"/>`,
    star: c => `<path d="m12 1.8 2.6 6.9 7.2.7-5.5 4.7 1.7 7.1L12 17.4l-6 3.8 1.7-7.1-5.5-4.7 7.2-.7z" fill="${c}"/>`,
    home: c => `<path d="M2.5 11.2 12 3l9.5 8.2V21h-6.3v-6H8.8v6H2.5z" fill="${c}"/>`,
    trophy: c => `<path d="M7 2.5h10v3h4c0 4-2.2 6.3-5.3 6.8A5 5 0 0 1 13 15v2.5h4V21H7v-3.5h4V15a5 5 0 0 1-2.7-2.7C5.2 11.8 3 9.5 3 5.5h4zM5.1 7.5c.4 1.6 1.2 2.6 2.2 3V7.5zm13.8 0h-2.2v3c1-.4 1.8-1.4 2.2-3z" fill="${c}"/>`,
    paper: c => `<path d="M6 2h9l5 5v15H6z" fill="${c}"/><path d="M9 11h8M9 14.5h8M9 18h5" stroke="${W}" stroke-width="1.6" stroke-linecap="round"/>`,
    pin: c => `<path d="M12 22.5s7.5-7 7.5-12.5a7.5 7.5 0 0 0-15 0c0 5.5 7.5 12.5 7.5 12.5z" fill="${c}"/><circle cx="12" cy="10" r="3" fill="${W}"/>`,
    pool: c => `<path d="M2.5 9.5c2.4-2 4.7-2 7 0s4.7 2 7 0 4.4-2 5 0M2.5 14.5c2.4-2 4.7-2 7 0s4.7 2 7 0 4.4-2 5 0M2.5 19.5c2.4-2 4.7-2 7 0s4.7 2 7 0 4.4-2 5 0" fill="none" stroke="${c}" stroke-width="2.3" stroke-linecap="round"/><circle cx="17" cy="4.5" r="2.3" fill="${c}"/>`,
    clock: c => `<circle cx="12" cy="12" r="9.5" fill="${c}"/><path d="M12 6.5V12l3.6 2.2" fill="none" stroke="${W}" stroke-width="2" stroke-linecap="round"/>`,
    tool: c => `<path d="M14.7 2.6a5 5 0 0 0-5.6 6.6L2.6 15.7a2.2 2.2 0 0 0 3.1 3.1l6.5-6.5a5 5 0 0 0 6.6-5.6l-3 3-2.7-.6-.6-2.7z" fill="${c}"/>`,
    case: c => `<rect x="2.5" y="7" width="19" height="13" rx="3" fill="${c}"/><path d="M8.5 7V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" fill="none" stroke="${c}" stroke-width="2"/><rect x="2.5" y="11.5" width="19" height="1.6" fill="${W}" opacity=".7"/>`,
    leaf: c => `<path d="M20.5 3.5C9 3.5 3.5 9 3.5 15.5c0 1.6.4 3 1 4.2C6 14 10 10.5 15 8.8c-4.2 2.4-7.4 6-9 11 1.3.5 2.7.7 4 .7 6.5 0 10.5-6.2 10.5-17z" fill="${c}"/>`,
    cup: c => `<path d="M3.5 8h13v5.5a6.5 6.5 0 0 1-13 0z" fill="${c}"/><path d="M16.5 9.5h1.6a2.6 2.6 0 0 1 0 5.2h-2" fill="none" stroke="${c}" stroke-width="2"/><rect x="2.5" y="20" width="15" height="2" rx="1" fill="${c}"/>`,
    chat: c => `<path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="${c}"/><circle cx="8" cy="11" r="1.4" fill="${W}"/><circle cx="12" cy="11" r="1.4" fill="${W}"/><circle cx="16" cy="11" r="1.4" fill="${W}"/>`
  };
  const EMO = { '🏫': 'school', '🏢': 'office', '🏭': 'factory', '📚': 'book', '🏟️': 'ball', '📅': 'cal', '🚆': 'train', '🕌': 'dome', '🌙': 'moon', '🎓': 'cap', '🚇': 'metro', '⚽': 'ball', '🎨': 'art', '📖': 'book', '🏥': 'cross', '🏆': 'trophy', '🎉': 'star', '📝': 'paper', '💚': 'heart', '🏊': 'pool', '🏡': 'home', '📍': 'pin' };
  const ic = (k, x, y, sz, c) => `<g transform="translate(${x - sz / 2} ${y - sz / 2}) scale(${sz / 24})">${(I[EMO[k] || k] || I.pin)(c)}</g>`;
  const twinkles = (pts, cls = 'tw') => pts.map(([x, y, r], k) => `<path class="${cls}" style="animation-delay:${k * .6}s" transform="translate(${x} ${y}) scale(${r})" d="M0-6 1.4-1.4 6 0 1.4 1.4 0 6-1.4 1.4-6 0-1.4-1.4z" fill="#fff"/>`).join('');

  /* ───── mini scenes for cards (320×180; homes on the right, destination on the left) ───── */
  function sceneSvg(sc, p, still) {
    const id = 'sg' + (++UID), t = sc.t, D = sc.dest || '📍', night = p === PALS.night;
    const pill = (x, y, tx) => { const w = Math.max(54, tx.length * 6.4 + 18); return `<g transform="translate(${x} ${y})"><rect x="${-w / 2}" y="-11" width="${w}" height="22" rx="11" fill="#fff" opacity=".94"/><text y="4" font-family="${FONT}" font-size="11" font-weight="900" fill="${p.d}" text-anchor="middle">${tx}</text></g>`; };
    const route = (d, k = 0) => `<path d="${d}" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="10" stroke-linecap="round"/><path class="flow" style="animation-delay:${-k * .3}s" d="${d}" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="1 8" stroke-linecap="round"/>`;
    const car = c => `<g><ellipse cy="9" rx="14" ry="2.4" fill="#000" opacity=".15"/><path d="M-15 5v-5a4 4 0 0 1 4-4h2l4-6h11l4 6h1a4 4 0 0 1 4 4v5z" fill="#fff"/><path d="M-6 -4l3-4.6h4.4V-4zM3.4 -4v-4.6h3.4l3 4.6z" fill="${c}"/><circle cx="-8" cy="5.5" r="3.4" fill="${p.d}"/><circle cx="8" cy="5.5" r="3.4" fill="${p.d}"/></g>`;
    const mover = (d, mid, dur, k = 0, c = p.a) => still ? `<g transform="translate(${mid[0]} ${mid[1]})">${car(c)}</g>` : `<g>${car(c)}<animateMotion dur="${dur}s" begin="${-k * .9}s" repeatCount="indefinite" path="${d}" rotate="0" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines=".45 0 .55 1"/></g>`;
    const home = (x, y, k = 0) => `<g transform="translate(${x} ${y})"><circle class="ring" style="animation-delay:${k * .5}s" r="19" fill="none" stroke="#fff" stroke-width="2"/><ellipse cy="13" rx="15" ry="2.6" fill="#000" opacity=".12"/><path d="M-12 12V-2L0-12.5 12-2v14z" fill="#fff"/><path d="M-15.5 0 0-14.5 15.5 0" fill="none" stroke="${p.d}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><rect x="-3.6" y="2.5" width="7.2" height="9.5" rx="1.8" fill="${p.a}"/><rect x="5" y="-3.5" width="4.6" height="4.6" rx="1" fill="#FFD15C"/></g>`;
    const dest = (e, x, y, r = 21) => `<g transform="translate(${x} ${y})"><g class="pop"><circle r="${r + 9}" fill="#fff" opacity=".22"/><circle r="${r}" fill="#fff"/>${ic(e, 0, 0, r * 1.12, p.d)}</g></g>`;
    const person = (x, y, k = 0) => `<g transform="translate(${x} ${y})"><g class="pop" style="animation-delay:${k * .3}s"><circle r="12" fill="#fff"/><circle cy="-3" r="4" fill="${p.d}"/><path d="M-6.5 7.5a6.5 5.5 0 0 1 13 0z" fill="${p.d}"/></g></g>`;
    let b = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.a}"/><stop offset="1" stop-color="${p.b}"/></linearGradient></defs><rect width="320" height="180" fill="url(#${id})"/>`;
    b += night ? `<path d="M64 14a20 20 0 1 0 22 26 16 16 0 0 1-22-26z" fill="#FFE9A8" opacity=".9"/>` + twinkles([[120, 22, .7], [180, 14, .5], [230, 30, .6], [24, 60, .5]]) : `<circle cx="62" cy="30" r="44" fill="#fff" opacity=".14"/><circle cx="62" cy="30" r="22" fill="#fff" opacity=".22"/>` + twinkles([[140, 22, .6], [250, 18, .45]]);
    b += `<path d="M0 150h16v-20h12v9h11v-28h15v19h9v-11h19v32h13v-17h16v17h21v-25h11v25h19v-13h17v13h15v-34h13v34h19v-19h15v19h20V180H0z" fill="#fff" opacity=".12"/><path d="M0 162q80-16 160-6t160-5v29H0z" fill="#fff" opacity=".16"/>`;
    if (t === 'merge' || t === 'event' || t === 'org') { const n = t === 'org' ? 4 : Math.max(2, Math.min(4, sc.n || 3)), Y = [38, 84, 132, 60].slice(0, n), X = [272, 236, 272, 300];
      Y.forEach((y, k) => { b += route(`M${X[k] - 12} ${y + 8} C ${X[k] - 70} ${y + 8}, 150 98, 82 98`, k); });
      Y.forEach((y, k) => { b += home(X[k], y, k); });
      b += mover(`M${X[0] - 12} ${Y[0] + 8} C ${X[0] - 70} ${Y[0] + 8}, 150 98, 82 98`, [168, 82], 3.6) + dest(D, 56, 98);
      if (t === 'event') b += `<g transform="translate(100 46)"><g class="pop"><circle r="15" fill="#fff"/>${ic(sc.badge || '📅', 0, 0, 18, p.a)}</g></g>`;
      if (t === 'org') b += pill(110, 150, 'سرویسِ مدرسه، با خانواده‌ها'); }
    else if (t === 'split' || t === 'pin' || t === 'swap') {
      if (t === 'split') { b += route('M256 84 C 200 22, 124 22, 80 84') + route('M80 110 C 124 168, 200 168, 256 110', 1) + pill(166, 32, 'رفت: صبح') + pill(166, 150, 'برگشت: ظهر');
        b += home(272, 96) + mover('M256 84 C 200 22, 124 22, 80 84', [166, 54], 3.4) + mover('M80 110 C 124 168, 200 168, 256 110', [166, 132], 3.4, 1, p.d); }
      if (t === 'pin') { b += route('M256 98 H 84') + `<g opacity=".55">${ic('pin', 150, 50, 20, '#fff')}${ic('pin', 206, 62, 18, '#fff')}</g>` + pill(178, 30, '«نزدیک»، ولی نه آن‌جا') + `<g transform="translate(56 58)"><g class="pop">${ic('pin', 0, 0, 30, '#fff')}</g></g>` + home(272, 96) + mover('M256 98 H 84', [176, 98], 3.2); }
      if (t === 'swap') { b += home(272, 96) + home(214, 42, 1) + `<g transform="translate(214 82)"><circle r="11" fill="#fff"/>${ic('tool', 0, 0, 14, p.d)}</g>` + route('M256 98 C 200 98, 140 98, 84 98') + mover('M256 98 C 200 98, 140 98, 84 98', [164, 98], 3.2) + pill(150, 140, 'این هفته با من'); }
      b += dest(D, 56, 98); }
    else if (t === 'multi') { const ds = sc.dests || ['🏫', '🏢'];
      ds.forEach((e, k) => { const y = ds.length === 2 ? [52, 138][k] : [38, 94, 150][k]; b += route(`M258 94 C 200 94, 140 ${y}, 84 ${y}`, k) + dest(e, 56, y, ds.length === 2 ? 20 : 16); });
      b += home(272, 94) + mover('M258 94 C 200 94, 140 52, 84 52', [170, 70], 3.2) + pill(190, 168, `${fa(ds.length)} مقصد، یک صبح`); }
    else if (t === 'nocar') { [[276, 40], [290, 96], [262, 146]].forEach(([x, y], k) => { b += route(`M${x - 14} ${y} C 226 ${y}, 214 98, 192 98`, k) + person(x, y, k); });
      b += route('M160 98 H 84') + `<g transform="translate(178 98)">${car('#FFC93C')}</g>` + dest(D, 56, 98) + pill(182, 168, 'تاکسیِ دارای مجوز، کرایه تقسیم'); }
    else if (t === 'hub') { b += dest(D, 56, 98) + person(104, 50) + person(110, 146, 1);
      [[272, 42], [272, 146]].forEach(([x, y], k) => { b += route(`M90 98 C 160 98, 220 ${y + 6}, ${x - 14} ${y + 6}`, k) + home(x, y, k); });
      b += mover('M90 98 C 160 98, 220 48, 258 48', [180, 72], 3.4) + pill(178, 172, 'از ایستگاه تا خانه، با هم'); }
    else if (t === 'relay') { [[272, 40], [290, 96], [272, 150]].forEach(([x, y], k) => { b += route(`M${x - 14} ${y + 6} C 220 ${y + 6}, 200 98, 176 98`, k) + home(x, y, k); });
      b += `<path d="M136 98 H 34" stroke="#fff" stroke-width="3" stroke-dasharray="10 7" opacity=".7"/>` + `<g transform="translate(156 98)"><g class="pop"><circle r="17" fill="#fff"/>${ic('metro', 0, 0, 22, p.d)}</g></g>` + pill(96, 128, 'ادامه با مترو') + mover('M258 46 C 220 46, 200 98, 176 98', [214, 72], 2.8); }
    return `<svg class="ms" viewBox="0 0 320 180" role="img" aria-label="نمایش نمونه" xmlns="http://www.w3.org/2000/svg">${b}</svg>`;
  }

  /* ───── wheel, grid, filters ───── */
  const vis = () => order.filter(s => aud === 'all' || s.aud === aud);
  function renderAud() { const used = [...new Set(ST.map(s => s.aud))];
    $('#aud').innerHTML = [['all', 'همه'], ...used.map(k => [k, AUD[k] || k])].map(([k, v]) => `<button data-aud="${k}" aria-pressed="${aud === k}">${v}</button>`).join(''); }
  function renderWheel() { const L = vis();
    $('#track').innerHTML = L.map((s, i) => `<button class="sc" data-i="${i}" data-id="${s.id}" style="${pv(pal(s))}"><span class="art">${sceneSvg(s.scene, pal(s))}</span><span class="tx"><span class="who">${esc(s.who)}</span><span class="hk">${esc(s.hook)}</span><span class="meta">${s.main ? '<span class="tag">● فیلم کوتاه</span>' : ''}<span class="more">قصه را ببینید ←</span></span></span></button>`).join('');
    $('#dots').innerHTML = L.map((_, i) => `<i data-i="${i}"></i>`).join('');
    $('#grid').innerHTML = order.map(s => `<button class="gi" data-id="${s.id}" style="${pv(pal(s))}"><span class="art">${sceneSvg(s.scene, pal(s), true)}</span><span class="gt"><b>${esc(s.title)}</b><small>${esc(AUD[s.aud] || '')}${s.main ? ' · فیلم کوتاه' : ''}</small></span></button>`).join('');
  }
  function mark() { $$('.sc').forEach((c, i) => c.classList.toggle('on', i === cur)); const DT = $$('#dots i'), n = DT.length, lo = Math.max(0, Math.min(cur - 3, n - 7)); DT.forEach((d, i) => { d.classList.toggle('on', i === cur); d.classList.toggle('far', i < lo || i > lo + 6); d.classList.toggle('edge', (i === lo && lo > 0) || (i === lo + 6 && lo + 6 < n - 1)); }); const cn = $('#cnt'); if (cn) cn.textContent = fa(cur + 1) + ' / ' + fa(n); const s = vis()[cur]; $$('.gi').forEach(g => g.setAttribute('aria-current', !!s && g.dataset.id === s.id)); }
  function go(i, scroll = true, open = true) { const L = vis(); if (!L.length) return; cur = (i + L.length) % L.length; mark();
    if (scroll) { const c = $$('.sc')[cur], tr = $('#track'); if (c && tr) { const r = c.getBoundingClientRect(), t = tr.getBoundingClientRect(); tr.scrollBy({ left: r.left + r.width / 2 - (t.left + t.width / 2), behavior: 'smooth' }); } }
    if (open) show(L[cur]); }
  let autoT = null; const stopAuto = () => { clearInterval(autoT); autoT = null; };
  // turn only while the wheel is on screen and the reader is not scrolling or touching it
  let wheelOn = true, lastMove = 0; const io = 'IntersectionObserver' in window ? new IntersectionObserver(E => { wheelOn = E[0].isIntersecting && E[0].intersectionRatio > .6; }, { threshold: [0, .6, 1] }) : null; io && io.observe($('#track'));
  addEventListener('scroll', () => { lastMove = Date.now(); }, { passive: true }); ['touchstart', 'wheel'].forEach(ev => $('#track').addEventListener(ev, () => { lastMove = Date.now() + 4000; }, { passive: true }));
  const startAuto = () => { stopAuto(); if (matchMedia('(prefers-reduced-motion:reduce)').matches) return; autoT = setInterval(() => { if (!document.hidden && !film.on && wheelOn && Date.now() - lastMove > 2500) go(cur + 1, true, false); }, 5200); };
  let scT; $('#track').addEventListener('scroll', () => { clearTimeout(scT); scT = setTimeout(() => { const tr = $('#track'), mid = tr.getBoundingClientRect().left + tr.clientWidth / 2; let best = 0, bd = 1e9;
    $$('.sc').forEach((c, i) => { const r = c.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - mid); if (d < bd) { bd = d; best = i; } }); if (best !== cur) { cur = best; mark(); } }, 90); }, { passive: true });
  const toDetail = () => requestAnimationFrame(() => requestAnimationFrame(() => { const top = $('#detail').getBoundingClientRect().top + scrollY - (($('.bar') || {}).offsetHeight || 0) - 8; scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' }); }));
  $('#track').addEventListener('click', e => { const c = e.target.closest('.sc'); if (!c) return; stopAuto(); go(+c.dataset.i); toDetail(); });
  $('#track').addEventListener('pointerdown', stopAuto); $('#track').addEventListener('keydown', e => { if (e.key === 'ArrowLeft') { stopAuto(); go(cur + 1); } if (e.key === 'ArrowRight') { stopAuto(); go(cur - 1); } });
  $('#next').onclick = () => { stopAuto(); go(cur + 1); }; $('#prev').onclick = () => { stopAuto(); go(cur - 1); };
  $('#dots').addEventListener('click', e => { const d = e.target.closest('i'); if (d) { stopAuto(); go(+d.dataset.i); } });
  $('#aud').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; aud = b.dataset.aud; renderAud(); renderWheel(); go(0); });
  $('#grid').addEventListener('click', e => { const g = e.target.closest('.gi'); if (!g) return; stopAuto(); if (aud !== 'all') { aud = 'all'; renderAud(); renderWheel(); } go(vis().findIndex(s => s.id === g.dataset.id)); toDetail(); });

  /* ───── detail ───── */
  const link = s => `${URL0}?from=${s.id}#${s.id}`; // ?from= lets server logs count visits per story (the app ignores it)
  const caption = s => `${s.hook}\n✅ ${s.offer || ''}\n\n👈 ${link(s)}\n#رسیدیم #هم_مسیر`;
  const MONEY = [['heart', 'احسانی', 'رایگان، برای ثواب و همسایگی'], ['cal', 'دنگی', 'تقسیم هزینه‌ی بنزین، شفاف'], ['chat', 'به توافق', 'هرطور خودتان قرار بگذارید']];
  const stillCard = s => { const p = pal(s); return `<div class="still" style="${pv(p)}"><div class="hk">${esc(s.hook)}</div>${sceneSvg(s.scene, p)}<div class="ft"><img src="../assets/icon.svg?v=${V}" alt="">رسیدیم · residim.ir</div></div>`; };
  function show(s) { if (!s) return; film.stop(); try { history.replaceState(null, '', '#' + s.id); } catch (e) {}
    const F = FILMS[s.id], p = pal(s);
    $('#det').style.cssText = pv(p);
    $('#det').innerHTML = `<div class="det"><div class="dh"><span class="who">${esc(s.who)}</span><h2>${esc(s.hook)}</h2>${s.offer ? `<p class="offer">${esc(s.offer)}</p>` : ''}</div>
      <div class="stage" id="stage"><span class="demo">نمایش نمونه</span>${F ? '' : stillCard(s)}</div>
      <div class="db"><p class="story">${esc(s.story)}</p>
        <div class="how"><h3>در رسیدیم چطور؟</h3><ol>${s.how.map(h => `<li><span>${esc(h.replace(' (به‌زودی)', ''))}${/به‌زودی/.test(h) ? '<span class="soon">به‌زودی</span>' : ''}</span></li>`).join('')}</ol></div>
        <div class="money">${MONEY.map(([k, a, b]) => `<div><svg viewBox="0 0 24 24" aria-hidden="true">${I[k]('currentColor')}</svg><b>${a}</b><span>${b}</span></div>`).join('')}</div>
        <div class="cta"><a class="btn pri" href="../?from=story-${esc(s.id)}#new-${esc(s.kind)}">همین را در رسیدیم بسازید</a>${s.aud === 'school' ? '<a class="btn ghost" href="../schools/">رسیدیم برای مدارس</a>' : ''}</div>
        <div class="share"><div class="sh-h"><h3>بفرستید برای گروهی که هم‌مسیرتان در آن است</h3><p>ایتا، تلگرام، واتساپ، بله یا گروه کلاس؛ متن آماده است.</p></div>
          <textarea id="cap" readonly aria-label="متن آماده برای کپشن">${esc(caption(s))}</textarea>
          <div class="row"><button class="btn pri sm" data-do="copy">کپی متن</button><button class="btn glass sm" data-do="poster">پوستر پست</button><button class="btn glass sm" data-do="storyimg">تصویر استوری</button><button class="btn glass sm" data-do="share">اشتراک</button>${F && F.mp4 ? `<a class="btn glass sm" href="${esc(F.mp4)}" download>ویدیو (mp4)</a>` : ''}</div>
          <p class="note">تصویرها «نمایش نمونه» است، نه هم‌مسیرِ واقعی. متن را زیر پوستر یا ویدیو بچسبانید.</p></div>
      </div></div>`;
    if (F) film.mount(s, F);
    mark();
  }
  $('#det').addEventListener('click', async e => { const b = e.target.closest('[data-do]'); if (!b) return; const s = vis()[cur] || order[0];
    if (b.dataset.do === 'copy') { const t = $('#cap'); try { await navigator.clipboard.writeText(t.value); toast('کپی شد؛ در گروه‌تان بچسبانید.'); } catch (er) { t.select(); toast('متن انتخاب شد؛ کپی کنید.'); } return; }
    b.disabled = true; try { const tall = b.dataset.do === 'storyimg', blob = await poster(s, tall), file = new File([blob], `residim-${s.id}${tall ? '-story' : ''}.png`, { type: 'image/png' });
      if (b.dataset.do === 'share' && navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], text: caption(s) });
      else if (b.dataset.do === 'share' && navigator.share) await navigator.share({ title: s.title, text: caption(s), url: link(s) });
      else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); toast(tall ? 'تصویر استوری ذخیره شد.' : 'پوستر ذخیره شد.'); } }
    catch (er) { if (er && er.name !== 'AbortError') toast('ساخت تصویر نشد؛ دوباره امتحان کنید.'); } b.disabled = false; });

  /* ───── poster (1080×1350 post or 1080×1920 story), drawn on canvas ───── */
  const wrapT = (x, t, w) => { const out = []; let line = ''; for (const wd of t.split(' ')) { const tr = line ? line + ' ' + wd : wd; if (x.measureText(tr).width > w && line) { out.push(line); line = wd; } else line = tr; } if (line) out.push(line); return out; };
  const loadImg = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
  async function poster(s, tall) { await Promise.all(['900 60px Vazirmatn', '800 34px Vazirmatn'].map(f => document.fonts.load(f).catch(() => {})));
    const Wd = 1080, H = tall ? 1920 : 1350, cv = document.createElement('canvas'); cv.width = Wd; cv.height = H; const x = cv.getContext('2d'), INK = '#04140B', GR = '#1DBF73';
    let g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#22C97B'); g.addColorStop(1, '#13A863'); x.fillStyle = g; x.fillRect(0, 0, Wd, H);
    x.fillStyle = 'rgba(255,255,255,.10)'; x.beginPath(); x.arc(Wd * .12, H * .1, 330, 0, 7); x.fill();
    x.direction = 'rtl'; x.textAlign = 'right'; const R = Wd - 90;
    const logo = await loadImg(`../assets/icon.svg?v=${V}`); x.fillStyle = INK; x.beginPath(); x.roundRect(R - 96, 80, 96, 96, 28); x.fill(); if (logo) x.drawImage(logo, R - 84, 92, 72, 72);
    x.fillStyle = INK; x.strokeStyle = INK; x.lineJoin = 'round'; x.font = '900 46px Vazirmatn'; x.fillText('رسیدیم', R - 120, 142); x.lineWidth = 1.5; x.strokeText('رسیدیم', R - 120, 142);
    let y = tall ? 470 : 330; x.font = `900 ${tall ? 92 : 80}px Vazirmatn`; x.fillStyle = INK; const lh = tall ? 140 : 120;
    x.lineWidth = 2.5; for (const l of wrapT(x, s.hook, Wd - 180).slice(0, 4)) { x.fillText(l, R, y); x.strokeText(l, R, y); y += lh; }
    const fh = tall ? 200 : 150; x.font = `800 ${tall ? 44 : 38}px Vazirmatn`; const OL = wrapT(x, s.offer || '', Wd - 260).slice(0, 2), olh = tall ? 66 : 56, oh = OL.length * olh + 50, oy = H - fh - (tall ? 150 : 70) - oh;
    // one motif: a dotted route from a home to the destination
    const my = Math.round((y - lh * .4 + oy) / 2), ax = R - 40, bx = 170; x.strokeStyle = '#fff'; x.lineWidth = 9; x.lineCap = 'round'; x.setLineDash([2, 26]);
    x.beginPath(); x.moveTo(ax, my); x.bezierCurveTo(ax - 260, my - 150, bx + 260, my + 150, bx, my); x.stroke(); x.setLineDash([]);
    const dot = (cx, r, fill) => { x.fillStyle = 'rgba(255,255,255,.28)'; x.beginPath(); x.arc(cx, my, r + 22, 0, 7); x.fill(); x.fillStyle = fill; x.beginPath(); x.arc(cx, my, r, 0, 7); x.fill(); };
    dot(ax, 38, '#fff'); dot(bx, 50, INK);
    const ic = await loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96">${(I[EMO[(s.scene || {}).dest] || 'pin'] || I.pin)('#FFC93C')}</svg>`)), hm = await loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96">${I.home(GR)}</svg>`));
    if (ic) x.drawImage(ic, bx - 30, my - 30, 60, 60); if (hm) x.drawImage(hm, ax - 24, my - 24, 48, 48);
    // the offer, once
    x.font = `800 ${tall ? 44 : 38}px Vazirmatn`; y = oy + 25 + olh * .72;
    x.fillStyle = '#fff'; x.beginPath(); x.roundRect(90, oy, Wd - 180, oh, 34); x.fill();
    x.fillStyle = GR; x.beginPath(); x.arc(R - 30, y - olh * .3, 22, 0, 7); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 6; x.beginPath(); x.moveTo(R - 41, y - olh * .3); x.lineTo(R - 32, y - olh * .3 + 9); x.lineTo(R - 18, y - olh * .3 - 10); x.stroke();
    x.fillStyle = INK; OL.forEach((l, k) => x.fillText(l, R - 70, y + k * olh));
    // the address
    x.fillStyle = INK; x.fillRect(0, H - fh, Wd, fh); x.textAlign = 'center';
    x.fillStyle = '#FFC93C'; x.font = `900 ${tall ? 64 : 54}px Vazirmatn`; x.fillText('residim.ir', Wd / 2, H - fh / 2 + 6);
    x.fillStyle = '#8FB09E'; x.font = '700 22px Vazirmatn'; x.fillText('فقط آشنا می‌کنیم؛ رفت‌وآمد با تصمیم و مسئولیت خودتان', Wd / 2, H - fh / 2 + 50);
    return new Promise(r => cv.toBlob(r, 'image/png')); }

  /* ───── film: a 9:16 stage whose scenes change on the narration's timecodes ───── */
  const sfx = (() => { let C; const ctx = () => (C = C || new (window.AudioContext || window.webkitAudioContext)());
    const tone = (f, d, type = 'sine', v = .14, at = 0, f2) => { const c = ctx(), o = c.createOscillator(), g = c.createGain(), t = c.currentTime + at; o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d * .5); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .006); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + .05); };
    return { chime: () => { tone(1318, .9); tone(1976, 1.1, 'sine', .07, .06); }, pop: () => tone(520, .16, 'sine', .16, 0, 1250), swoosh: () => tone(300, .5, 'triangle', .05, 0, 1600), ctx }; })();
  const SFX = { pins: 'pop', chat: 'pop', week: 'chime', weekB: 'chime', week4: 'chime', cta: 'swoosh', logo: 'chime', jam: 'pop', h2: 'pop', near: 'pop', tea: 'chime', flip: 'pop', both: 'pop', one: 'swoosh' };
  const cuesOf = F => F.plans.slice(1).filter(p => SFX[p.v]).map(p => ({ t: p.t + .05, k: SFX[p.v], n: p.v === 'logo' ? 84 : 88, v: SFX[p.v] === 'swoosh' ? .5 : .32 }));
  const MOODBG = { tension: ['#3D6FD6', '#FFC49A'], pain: ['#4C5C8E', '#D7A9BC'], still: ['#0A1F17', '#1F4A37'], lift: ['#FF8A5B', '#FFD27A'], joy: ['#0FAE66', '#86EBB9'], warm: ['#FF9F5A', '#FFE2A6'], build: ['#0E9C9C', '#86E8DA'], peak: ['#F29A16', '#FFE27D'], resolve: ['#04140B', '#0E3A24'] };
  const G = '#1DBF73', O = '#FF9F45', B = '#4F8CFF', RS = '#FF6B9A', INK = '#04140B';
  const shadow = (rx, y = 0) => `<ellipse cy="${y}" rx="${rx}" ry="${rx * .16}" fill="${INK}" opacity=".16"/>`;
  const house = (x, y, c, who) => `<g transform="translate(${x} ${y})">${shadow(36, 22)}<path d="M-30 20v-30L0-36l30 26v30z" fill="#fff"/><path d="M-37-8 0-41l37 33" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><rect x="-8" y="1" width="16" height="19" rx="4" fill="${c}"/><circle cx="17" cy="-1" r="13" fill="#FFD15C" opacity=".28"/><rect x="11" y="-7" width="12" height="12" rx="3" fill="#FFD15C"/>${who ? `<g transform="translate(0 -62)"><circle r="16" fill="#fff"/><circle cy="-4" r="5.5" fill="${c}"/><path d="M-9 10a9 7.5 0 0 1 18 0z" fill="${c}"/></g>` : ''}</g>`;
  const carG = (c, heads = 0) => `<g>${shadow(32, 17)}<path d="M-32 8v-9a8 8 0 0 1 8-8h5l9-12h21l9 12h4a8 8 0 0 1 8 8v9a4 4 0 0 1-4 4h-56a4 4 0 0 1-4-4z" fill="${c}"/><path d="M-15-9l7-9.5h8V-9zM4-9v-9.5h7l7 9.5z" fill="#fff" opacity=".92"/>${heads ? [-9, 4, 13].slice(0, heads > 3 ? 3 : heads).map(hx => `<circle cx="${hx}" cy="-13" r="3.4" fill="${c}"/>`).join('') : ''}<circle cx="-16" cy="12" r="7.5" fill="${INK}"/><circle cx="-16" cy="12" r="3" fill="#DDE6E1"/><circle cx="18" cy="12" r="7.5" fill="${INK}"/><circle cx="18" cy="12" r="3" fill="#DDE6E1"/><circle cx="-31" cy="0" r="3.4" fill="#FFF1A8"/><circle cx="-31" cy="0" r="9" fill="#FFF1A8" opacity=".3"/></g>`;
  const tw = t => Math.max(96, [...t].length * 8.6 + 34);
  const bubble = (x, y, t, c = '#fff', tc = INK, k) => { const w = tw(t); return `<g transform="translate(${x} ${y})"><rect x="${-w / 2}" y="-17" width="${w}" height="40" rx="20" fill="${INK}" opacity=".14"/><rect x="${-w / 2}" y="-21" width="${w}" height="40" rx="20" fill="${c}"/>${k ? `<g transform="translate(${w / 2 - 22} -1)">${ic(k, 0, 0, 20, tc === INK ? G : tc)}</g>` : ''}<text x="${k ? -10 : 0}" y="5" font-size="15" font-weight="900" text-anchor="middle" font-family="${FONT}" fill="${tc}">${t}</text></g>`; };
  const pinG = (c, x, y) => `<g transform="translate(${x} ${y})"><g class="inner">${shadow(10, 2)}<path d="M0 0c-12-14-18-22-18-30a18 18 0 0 1 36 0c0 8-6 16-18 30z" fill="${c}"/><circle cy="-30" r="7.5" fill="#fff"/></g></g>`;
  const week = (cols, labels, title = 'برنامه‌ی هفته') => `<g transform="translate(26 96)"><rect y="6" width="308" height="122" rx="26" fill="${INK}" opacity=".16"/><rect width="308" height="122" rx="26" fill="#fff"/><text x="284" y="36" font-size="17" font-weight="900" text-anchor="start" font-family="${FONT}" fill="${INK}">${title}</text>${['ش', 'ی', 'د', 'س', 'چ'].map((d, i) => `<g transform="translate(${256 - i * 56} 78)"><rect x="-23" y="-22" width="46" height="46" rx="14" fill="${cols[i]}"/><text y="${labels ? -1 : 6}" font-size="16" font-weight="900" text-anchor="middle" font-family="${FONT}" fill="#fff">${d}</text>${labels ? `<text y="15" font-size="10" font-weight="800" text-anchor="middle" font-family="${FONT}" fill="#fff">${labels[i]}</text>` : ''}</g>`).join('')}</g>`;
  function filmSvg(s) { const F = s.scene || {}, D = F.dest || '🏫';
    const E = {
      sun: `<g transform="translate(286 132)"><circle r="70" fill="#fff" opacity=".12"/><circle r="44" fill="#FFE08A" opacity=".45"/><circle r="29" fill="#FFF3C4"/></g>`, sun2: `<g transform="translate(180 120)"><circle r="76" fill="#fff" opacity=".12"/><circle r="46" fill="#FFD36A" opacity=".5"/><circle r="31" fill="#FFF0B8"/></g>`,
      ground: `<path d="M0 282h22v-30h16v12h14v-40h20v28h12v-16h24v44h18v-24h20v24h26v-34h14v34h24v-18h22v18h20v-46h16v46h24v-26h20v26h28v12H0z" fill="#fff" opacity=".13"/><path d="M0 300q90-24 180-6t180-8v354H0z" fill="#fff" opacity=".16"/>${[[30, 318], [126, 312], [328, 322], [24, 560], [334, 590]].map(([tx, ty]) => `<g transform="translate(${tx} ${ty})"><rect x="-2" y="0" width="4" height="16" fill="#fff" opacity=".5"/><circle cy="-6" r="13" fill="#fff" opacity=".3"/></g>`).join('')}`,
      road: `<rect y="370" width="360" height="50" fill="${INK}" opacity=".24"/><rect y="369" width="360" height="2" fill="#fff" opacity=".35"/><rect y="419" width="360" height="2" fill="#fff" opacity=".35"/><g class="loop-dash">${[...Array(9)].map((_, i) => `<rect x="${i * 50}" y="393" width="26" height="4" rx="2" fill="#fff" opacity=".85"/>`).join('')}</g>`,
      clock1: bubble(92, 124, '۷:۱۵ صبح', '#fff', INK, 'clock'), clock2: bubble(92, 124, '۱۳:۰۰ ظهر', '#fff', INK, 'clock'), clockAM: bubble(92, 124, '۷:۰۰ صبح', '#fff', INK, 'clock'), clockPM: bubble(92, 124, '۱۳:۰۰ ظهر', '#fff', INK, 'clock'),
      dest: `<g transform="translate(70 344)"><circle r="54" fill="#fff" opacity=".22"/><circle r="40" fill="#fff"/>${ic(D, 0, 0, 46, '#0E8F52')}<g transform="translate(0 58)"><rect x="-38" y="-14" width="76" height="28" rx="14" fill="${INK}" opacity=".55"/><text y="5" font-size="14" font-weight="900" text-anchor="middle" font-family="${FONT}" fill="#fff">${s.kind === 'work' ? 'محل کار' : 'مدرسه'}</text></g></g>`,
      hA: house(286, 330, G), hB: house(286, 478, O), ringB: `<circle cx="286" cy="466" r="46" fill="none" stroke="#fff" stroke-width="4" class="loop-pulse"/>`,
      cA: `<g transform="translate(252 386)"><g class="inner">${carG(G)}</g></g>`, cB: `<g transform="translate(252 408)"><g class="inner">${carG(O)}</g></g>`,
      dim: `<rect width="360" height="640" fill="${INK}" opacity=".5"/>`, q: `<g transform="translate(286 470)"><circle r="52" fill="#fff" opacity=".14" class="loop-pulse"/><circle r="38" fill="#fff" opacity=".2"/><text y="26" font-size="72" font-weight="900" text-anchor="middle" font-family="${FONT}" fill="#fff">؟</text></g>`,
      pA: pinG(G, 286, 288), pB: pinG(O, 286, 434),
      link: `<path d="M262 300C196 330 196 420 262 446" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="12" stroke-linecap="round"/><path d="M262 300C196 330 196 420 262 446" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="1 11" stroke-linecap="round" class="loop-dashp"/>`,
      badge: `<g transform="translate(206 372)"><circle r="40" fill="${G}" opacity=".35" class="loop-pulse"/><rect x="-27" y="-27" width="54" height="54" rx="16" fill="${G}"/><image href="../assets/icon.svg?v=${V}" x="-20" y="-20" width="40" height="40"/></g>`,
      bA: bubble(150, 236, 'سلام، همسایه‌ایم!'), bB: bubble(196, 524, 'چه خوب، آشنا شویم', '#FFF4D6'),
      week: week([G, O, G, O, G]), weekB: week([G, O, G, O, G], ['صبح', 'ظهر', 'صبح', 'ظهر', 'صبح'], 'صبح‌ها شما، ظهرها آن‌ها'), week4: week([G, O, B, RS, G]),
      tea: `<g transform="translate(220 486)"><circle r="40" fill="#fff" opacity=".25"/>${ic('cup', 0, 6, 46, '#fff')}<path d="M-8-26c-6-8 6-12 0-20M8-26c-6-8 6-12 0-20" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" class="loop-steam"/></g>`,
      work: bubble(276, 210, 'سر کار', '#fff', INK, 'case'), sad: bubble(244, 262, 'دلم پیشِ درِ مدرسه‌ست…', '#FFE4EC', '#9C1546'), free: bubble(196, 530, 'ظهرها آزادم!', '#FFF4D6'),
      lblAM: bubble(162, 344, 'رفت: شما', '#fff', INK, 'clock'), lblPM: bubble(162, 456, 'برگشت: آن‌ها', '#FFF4D6', INK, 'clock'),
      h1: house(300, 312, G, 1), h2: house(220, 312, O, 1), h3: house(300, 502, B, 1), h4: house(220, 502, RS, 1),
      r2: `<circle cx="220" cy="300" r="52" fill="none" stroke="#fff" stroke-width="4" class="loop-pulse"/>`,
      jam: `<g transform="translate(0 392)">${[[318, G], [254, O], [190, B], [130, RS]].map(([xx, c]) => `<g transform="translate(${xx} 0)">${carG(c)}<circle cx="29" cy="0" r="4" fill="#FF4D4D"/><circle cx="29" cy="0" r="10" fill="#FF4D4D" opacity=".35" class="loop-pulse"/></g>`).join('')}</g><g transform="translate(50 238)"><rect x="-18" y="-50" width="36" height="100" rx="14" fill="${INK}" opacity=".85"/><circle cy="-26" r="10" fill="#FF4D4D"/><circle cy="-26" r="20" fill="#FF4D4D" opacity=".3"/><circle cy="0" r="10" fill="#fff" opacity=".2"/><circle cy="26" r="10" fill="#fff" opacity=".2"/><rect x="-3" y="50" width="6" height="60" fill="${INK}" opacity=".5"/></g>`,
      p4: [[300, 236, G], [220, 236, O], [300, 426, B], [220, 426, RS]].map(([xx, yy, c]) => pinG(c, xx, yy)).join(''),
      links4: `<path d="M286 312C200 332 150 350 108 350M206 312C176 330 150 350 108 352M286 500C200 470 150 380 108 360M206 500C176 450 150 380 108 362" fill="none" stroke="#fff" stroke-width="3.5" stroke-dasharray="1 10" stroke-linecap="round" class="loop-dashp"/>`,
      bus: `<g transform="translate(252 390)"><g class="inner">${carG(G, 3)}</g></g>`,
      leaf: `<g><g transform="translate(212 196)"><circle r="40" fill="#fff" opacity=".22" class="loop-pulse"/>${ic('leaf', 0, 0, 52, '#fff')}</g>${bubble(176, 270, 'سه ماشین کمتر در صف', '#E6F9EF', '#0A6A3F', 'leaf')}</g>`,
      cta: `<g><rect x="22" y="160" width="316" height="300" rx="30" fill="${INK}" opacity=".9"/><rect x="22" y="160" width="316" height="6" rx="3" fill="${G}"/><foreignObject x="42" y="186" width="276" height="190"><div xmlns="http://www.w3.org/1999/xhtml" style="font:900 22px/1.75 ${FONT};color:#fff;direction:rtl;text-align:right">${esc(s.hook)}</div></foreignObject><rect x="62" y="392" width="236" height="48" rx="24" fill="${G}"/><text x="180" y="423" font-size="19" font-weight="900" text-anchor="middle" font-family="${FONT}" fill="${INK}">residim.ir</text></g>`,
      logo: `<g><rect width="360" height="640" fill="${INK}"/><circle cx="180" cy="250" r="160" fill="${G}" opacity=".16"/><circle cx="180" cy="250" r="92" fill="${G}" opacity=".18" class="loop-pulse"/><rect x="128" y="186" width="104" height="104" rx="30" fill="${G}"/><image href="../assets/icon.svg?v=${V}" x="142" y="200" width="76" height="76"/><text x="180" y="350" font-size="38" font-weight="900" fill="#fff" text-anchor="middle" font-family="${FONT}">رسیدیم</text><text x="180" y="390" font-size="18" fill="#FFC93C" font-weight="800" text-anchor="middle" font-family="${FONT}">نوبت‌ها روشن، خیال‌ها جمع</text><text x="180" y="452" font-size="12" fill="#8FB09E" text-anchor="middle" font-family="${FONT}">فقط آشنا می‌کنیم؛ رفت‌وآمد با تصمیم و مسئولیت خودتان</text></g>` };
    const bgs = Object.entries(MOODBG).map(([m, [c1, c2]]) => `<linearGradient id="mb-${m}" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`).join('');
    const pts = [...Array(12)].map((_, k) => `<circle class="pt" cx="${(k * 67) % 340 + 10}" cy="${600 - (k * 41) % 260}" r="${2 + (k % 3)}" fill="#fff" style="animation-delay:${-k * 1.3}s;animation-duration:${9 + (k % 4) * 2}s"/>`).join('');
    return `<svg class="film" viewBox="0 0 360 640" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(s.title)}"><defs>${bgs}</defs>
      <g class="bgs">${Object.keys(MOODBG).map(m => `<rect data-m="${m}" width="360" height="640" fill="url(#mb-${m})" style="opacity:0"/>`).join('')}</g>
      <g class="pts">${pts}</g><g class="cam">${Object.entries(E).map(([k, v]) => `<g class="el" data-k="${k}" style="opacity:0;transform:translateY(26px) scale(.96)">${v}</g>`).join('')}</g>
      <g class="kick" style="opacity:0"><rect x="110" y="30" width="140" height="34" rx="17" fill="#fff" opacity=".22"/><text id="kickt" x="180" y="53" font-size="14" font-weight="900" text-anchor="middle" font-family="${FONT}" fill="#fff"></text></g></svg>`; }
  const STATES = {
    noservice: { h1: 'sun ground road dest hA cA clock1', shuttle: 'sun2 ground road dest hA cA:drive clock2', dim: 'sun2 ground road dest hA cA:drive dim q', h2: 'sun2 ground road dest hA cA:drive hB cB:drive ringB',
      pins: 'sun ground road dest hA hB pA:bob pB:bob link badge', chat: 'sun ground road dest hA hB pA pB link bA bB', week: 'sun ground road dest hA hB link week', tea: 'sun ground road dest hA hB cA:drive tea week', cta: 'sun ground road dest hA hB cta', logo: 'logo' },
    oneway: { am: 'sun ground road dest hA cA:drive clockAM work', noon: 'sun2 ground road dest hA work sad clockPM', h2: 'sun2 ground road dest hA hB ringB work', flip: 'sun2 ground road dest hA hB free work',
      pins: 'sun ground road dest hA hB pA:bob pB:bob link badge', both: 'sun ground road dest hA hB cA:drive cB:drive lblAM lblPM', week: 'sun ground road dest hA hB weekB', cta: 'sun ground road dest hA hB cta', logo: 'logo' },
    colleagues: { jam: 'sun ground road dest jam', four: 'sun ground road dest h1 h2 h3 h4 jam', near: 'sun ground road dest h1 h2 h3 h4 r2', pins: 'sun ground road dest h1 h2 h3 h4 p4 links4 badge',
      week: 'sun ground road dest h1 h2 h3 h4 week4', one: 'sun ground road dest h1 h2 h3 h4 bus:drive', city: 'sun ground road dest leaf bus:drive', cta: 'sun ground road dest h1 h2 h3 h4 cta', logo: 'logo' } };
  const SPKC = { Madar: '#FF6B9A', Ravi: '#1DBF73', Darya: '#6FB6FF', Baba: '#FFB020', Baran: '#B794FF' };
  const film = { on: false, s: null, F: null, t0: 0, raf: 0, idx: -1, au: null, ev: null, sound: true,
    mount(s, F) { this.s = s; this.F = F; this.idx = -1; this.ev = null; const st = $('#stage');
      st.insertAdjacentHTML('beforeend', filmSvg(s) + `<div class="cap" id="cap2"></div><button class="play" id="play" aria-label="پخش فیلم"><span><svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z" fill="#04140B"/></svg></span><b>${esc(s.title)}</b><small>${F.voice ? 'با صدای راوی و موسیقی' : 'با موسیقی و زیرنویس'} · ${fa(Math.round(F.end))} ثانیه</small></button>
        <div class="ctl"><button id="f-pp" aria-label="پخش یا توقف">▶</button><button id="f-rs" aria-label="از اول">↻</button><div class="pg" id="f-pg"><i></i></div><button id="f-mu" aria-label="صدا" aria-pressed="true">♪</button><button id="f-fs" aria-label="تمام‌صفحه">⛶</button></div>`);
      this.apply(0, true); this.au = null;
      if (F.audio && !document.body.classList.contains('rec')) { const a = new Audio(); a.preload = 'auto'; a.src = F.audio; a.addEventListener('error', () => { if (this.au === a) this.au = null; }); this.au = a; }
      $('#play').onclick = () => this.play(0); $('#f-pp').onclick = () => this.on ? this.pause() : this.play(this.now());
      $('#f-rs').onclick = () => this.play(0); $('#f-mu').onclick = e => { this.sound = !this.sound; e.currentTarget.setAttribute('aria-pressed', this.sound); if (this.au) this.au.muted = !this.sound; else if (!this.sound) window.MUS && MUS.stop(); else if (this.on) this.musicAt(this.now()); };
      $('#f-fs').onclick = () => { const el = $('#stage'); (document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen ? el.requestFullscreen() : Promise.reject()).catch(() => {}); };
      $('#f-pg').onclick = e => { const r = e.currentTarget.getBoundingClientRect(), p = 1 - (e.clientX - r.left) / r.width; this.play(p * F.end); }; },
    marks() { return [...this.F.plans.map(p => p.t), this.F.end]; },
    now() { return this.au && !this.au.paused ? this.au.currentTime : this.on ? (performance.now() - this.t0) / 1000 : this.paused || 0; },
    musicAt(t) { if (!window.MUS || !this.sound || document.body.classList.contains('rec')) return; this.ev = this.ev || MUS.score(this.F.plans.map(p => p.mood), this.marks(), this.F.end); MUS.start(this.ev, t, .5); },
    play(t) { stopAuto(); window.__filmStarted = performance.now(); $('#play') && ($('#play').hidden = true); this.on = true; this.paused = 0; $('#stage').classList.add('playing');
      if (this.au) { this.au.muted = !this.sound; try { this.au.currentTime = t; } catch (e) {} this.au.play().catch(() => { this.au = null; this.musicAt(t); }); } else { try { sfx.ctx().resume(); } catch (e) {} this.musicAt(t); }
      this.t0 = performance.now() - t * 1000; this.idx = -1; $('#f-pp').textContent = '❚❚';
      cancelAnimationFrame(this.raf); const tick = () => { if (!this.on) return; const n = this.now(); this.apply(n); $('#f-pg i').style.width = Math.min(100, n / this.F.end * 100) + '%';
        if (n >= this.F.end + .8) { this.stop(true); window.__filmDone = true; return; } this.raf = requestAnimationFrame(tick); }; tick(); },
    pause() { this.paused = this.now(); this.on = false; cancelAnimationFrame(this.raf); this.au && this.au.pause(); window.MUS && MUS.stop(); $('#f-pp').textContent = '▶'; },
    stop(end) { if (!this.s) return; this.on = false; cancelAnimationFrame(this.raf); this.au && this.au.pause(); window.MUS && MUS.stop(); const st = $('#stage'); st && st.classList.remove('playing'); if (end && $('#play')) { $('#play').hidden = false; $('#play b').textContent = 'دوباره ببینید'; } },
    apply(t, first) { const P = this.F.plans; let i = 0; P.forEach((p, k) => { if (t >= p.t) i = k; }); if (i === this.idx && !first) return; this.idx = i;
      const pl = P[i], spec = (STATES[this.s.id] || {})[pl.v] || '', on = {}; let n = 0; spec.split(' ').filter(Boolean).forEach(tk => { const [k, l] = tk.split(':'); on[k] = { l: l || '', n: n++ }; });
      $$('#stage .film .bgs rect').forEach(r => { r.style.opacity = r.dataset.m === pl.mood ? 1 : 0; });
      $$('#stage .film .el').forEach(g => { const k = g.dataset.k, o = on[k]; g.style.transitionDelay = o && !first ? Math.min(o.n, 8) * 70 + 'ms' : '0ms'; g.style.opacity = o ? 1 : 0; g.style.transform = o ? 'none' : 'translateY(26px) scale(.96)';
        const inner = g.querySelector('.inner'); if (inner) inner.setAttribute('class', 'inner' + (o && o.l === 'drive' ? ' loop-drive' : o && o.l === 'bob' ? ' loop-bob' : '')); });
      const cam = $('#stage .film .cam'); if (cam) cam.style.transform = first ? 'none' : (i % 2 ? 'scale(1.04) translate(-6px,-8px)' : 'scale(1.015)');
      const kk = $('#stage .film .kick'), kt = $('#kickt'); if (kk && kt) { kt.textContent = pl.title; kk.style.opacity = first || pl.v === 'logo' || pl.v === 'cta' ? 0 : 1; }
      const cap = $('#cap2'); if (cap) cap.innerHTML = first ? '' : pl.lines.map(l => `<span class="ln"><i style="--sc:${SPKC[l.s] || '#1DBF73'}">${esc((this.F.spk || {})[l.s] || l.s)}</i>${esc(clean(l.x))}</span>`).join('');
      if (!first && this.on && !this.au && SFX[pl.v]) try { sfx[SFX[pl.v]](); } catch (e) {} } };

  /* ───── boot ───── */
  window.__storyCues = id => FILMS[id] ? cuesOf(FILMS[id]) : [];
  window.__storyFilm = film;
  renderAud(); renderWheel();
  const deck = $('#deck'); if (deck) deck.innerHTML = order.slice(0, 3).map(s => `<i style="${pv(pal(s))}">${sceneSvg(s.scene, pal(s))}<b>${esc(s.hook)}</b></i>`).join('');
  const h = location.hash.slice(1), rec = new URLSearchParams(location.search).get('rec');
  const i0 = Math.max(0, vis().findIndex(s => s.id === (rec || h)));
  if (rec && FILMS[rec]) document.body.classList.add('rec');
  go(i0, !!h, true); mark();
  if (rec && FILMS[rec] && new URLSearchParams(location.search).get('step')) { // frame-exact export: the recorder drives a virtual clock, one frame at a time
    film.sound = false; film.stop(); const play = $('#play'); if (play) play.hidden = true; $('#stage').classList.add('playing');
    window.__recStep = t => { if (t === 0) film.idx = -1; film.apply(t); const A = document.getAnimations(); A.forEach(an => { if (an._v0 == null) an._v0 = t; an.pause(); an.currentTime = Math.max(0, (t - an._v0) * 1000); }); return A.length; };
    document.fonts.ready.then(() => { window.__recReady = true; }); }
  else if (rec && FILMS[rec]) { film.sound = false; setTimeout(() => film.play(0), 1500); }
  else if (!h) startAuto();
  addEventListener('hashchange', () => { const k = vis().findIndex(s => s.id === location.hash.slice(1)); if (k >= 0 && k !== cur) go(k); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && film.on) film.pause(); });
})();
