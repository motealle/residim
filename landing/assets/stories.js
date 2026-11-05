/* «قصه‌های هم‌مسیری»: wheel of stories → the chosen story (poster or narrated film) → share as poster, caption or link.
   Data: stories-data.js (generated). Music: rsmusic.js. No dependency on the app's code, so nothing here can break the app. */
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const fa = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clean = x => x.replace(/\[[^\]]+\]/g, '').replace(/[ً-ْ]/g, '').replace(/\s+/g, ' ').trim();
  const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2600); };
  const ST = window.STORIES || [], AUD = window.STORY_AUD || {}, FILMS = window.STORY_FILMS || {};
  const PAL = { family: ['#E8F8F0', '#FFF4D6'], school: ['#FFF1E0', '#E8F1FF'], work: ['#E8F1FF', '#F1EAFF'], uni: ['#F1EAFF', '#E8F8F0'], hood: ['#FFEAF2', '#FFF7DD'], event: ['#EDE9FE', '#FFF1E0'], kind: ['#E8F8F0', '#FFEAF2'] };
  const pal = s => PAL[s.aud] || PAL.family;
  const URL0 = 'https://residim.ir/stories/';
  const order = [...ST.filter(s => s.main), ...ST.filter(s => !s.main)];
  let cur = 0, aud = 'all';

  /* ───── mini scenes (320×180, homes on the right, destination on the left) ───── */
  const COLS = ['#1DBF73', '#FF9F45', '#4F8CFF', '#FF7AA8'];
  const home = (x, y, c, k) => `<g transform="translate(${x} ${y})"><circle class="ring" r="22" style="animation-delay:${k * .4}s"/><path class="home" d="M-15 12v-17l15-13 15 13v17z"/><path class="roof" style="--rc:${c}" d="M-19 -3l19-17 19 17"/><rect class="door" x="-4" y="2" width="8" height="10" rx="1.5"/></g>`;
  const car = (c, id) => `<g class="car" id="${id}" style="--cc:${c}"><rect x="-16" y="-7" width="32" height="13" rx="5"/><rect x="-8" y="-15" width="17" height="9" rx="3"/><circle cx="-9" cy="7" r="4"/><circle cx="9" cy="7" r="4"/></g>`;
  const mover = (c, d, dur, still, k = 0) => still ? `<g transform="translate(${d.mid[0]} ${d.mid[1]})">${car(c, '')}</g>` : `<g>${car(c, '')}<animateMotion dur="${dur}s" begin="${k * .7}s" repeatCount="indefinite" path="${d.p}" rotate="0"/></g>`;
  const dest = (e, x, y, s = 44) => `<text class="dest pop" x="${x}" y="${y}" font-size="${s}" text-anchor="middle">${e}</text>`;
  function sceneSvg(sc, still) {
    const t = sc.t, D = sc.dest || '📍'; let b = `<path class="road" d="M30 140 H300"/>`;
    if (t === 'merge' || t === 'event' || t === 'org') { const n = t === 'org' ? 4 : Math.max(2, Math.min(4, sc.n || 3)), Y = [36, 82, 128, 60].slice(0, n), X = [272, 236, 272, 300];
      Y.forEach((y, k) => { const p = `M${X[k]} ${y + 10} C ${X[k] - 70} ${y + 10}, 150 96, 74 96`; b += `<path class="path ${'abc'[k % 3]}" d="${p}"/>` + home(X[k], y, COLS[k % 4], k); });
      b += mover(COLS[0], { p: `M${X[0]} ${Y[0] + 10} C ${X[0] - 70} ${Y[0] + 10}, 150 96, 74 96`, mid: [170, 80] }, 3.4, still) + dest(D, 52, 112);
      if (t === 'event') b += `<text x="88" y="52" font-size="26" text-anchor="middle" class="pop">${sc.badge || '📅'}</text>`;
      if (t === 'org') b += `<text x="100" y="56" font-size="24" class="pop">📣</text>`; }
    else if (t === 'split' || t === 'pin' || t === 'swap') {
      b += home(270, 92, COLS[0], 0);
      if (t === 'split') { b += `<path class="path" d="M256 86 C 200 20, 120 20, 74 84"/><path class="path b" d="M256 100 C 200 166, 120 166, 74 104"/><text x="165" y="30" font-size="20">☀️</text><text class="lbl m" x="186" y="44">رفت</text><text x="165" y="168" font-size="18">🕐</text><text class="lbl m" x="186" y="162">برگشت</text>`;
        b += mover(COLS[0], { p: 'M256 86 C 200 20, 120 20, 74 84', mid: [165, 40] }, 3.2, still) + mover(COLS[1], { p: 'M74 104 C 120 166, 200 166, 256 100', mid: [165, 142] }, 3.2, still, 1); }
      if (t === 'pin') { b += `<path class="path" d="M256 96 H 80"/><text x="96" y="58" font-size="22" text-anchor="middle" class="pop">📍</text><text x="150" y="40" font-size="16" opacity=".45">📍</text><text class="lbl m" x="170" y="36">«نزدیک»</text><text x="210" y="62" font-size="16" opacity=".45">📍</text>` + mover(COLS[2], { p: 'M256 96 H 80', mid: [170, 96] }, 3, still); }
      if (t === 'swap') { b += home(210, 40, COLS[1], 1) + `<text x="210" y="80" font-size="20" text-anchor="middle">🔧</text><path class="path" d="M256 96 C 200 96, 140 96, 74 96"/>` + mover(COLS[0], { p: 'M256 96 C 200 96, 140 96, 74 96', mid: [160, 96] }, 3.2, still) + `<text class="lbl m" x="150" y="128">این هفته با من</text>`; }
      b += dest(D, 52, 112); }
    else if (t === 'multi') { b += home(270, 92, COLS[0], 0); const ds = sc.dests || ['🏫', '🏢'];
      ds.forEach((e, k) => { const y = ds.length === 2 ? [52, 136][k] : [40, 96, 152][k]; b += `<path class="path ${'abc'[k]}" d="M256 92 C 200 92, 140 ${y}, 74 ${y - 12}"/>` + dest(e, 52, y, 30); });
      b += mover(COLS[0], { p: `M256 92 C 200 92, 140 52, 74 40`, mid: [170, 70] }, 3, still) + `<text class="lbl" x="196" y="170">${fa(ds.length)} مقصد، یک صبح</text>`; }
    else if (t === 'nocar') { [[272, 40], [290, 96], [252, 140]].forEach(([x, y], k) => { b += `<text x="${x}" y="${y}" font-size="26" text-anchor="middle" class="pop" style="animation-delay:${k * .3}s">🙂</text><path class="path ${'abc'[k]}" d="M${x - 14} ${y - 8} C 220 ${y - 8}, 210 92, 186 92"/>`; });
      b += `<text x="176" y="102" font-size="30" text-anchor="middle">🚕</text><path class="path" d="M160 92 H 80"/>` + dest(D, 52, 112) + `<text class="lbl m" x="200" y="172">تاکسیِ دارای مجوز، هزینه تقسیم</text>`; }
    else if (t === 'hub') { b += dest(D, 52, 112); [[96, 50], [108, 140]].forEach(([x, y]) => { b += `<text x="${x}" y="${y}" font-size="20">🙂</text>`; });
      [[272, 40], [272, 140]].forEach(([x, y], k) => { b += home(x, y, COLS[k + 1], k) + `<path class="path ${'bc'[k]}" d="M90 96 C 160 96, 220 ${y + 6}, ${x - 16} ${y + 6}"/>`; });
      b += mover(COLS[0], { p: 'M90 96 C 160 96, 220 46, 256 46', mid: [180, 70] }, 3.2, still) + `<text class="lbl m" x="150" y="172">از ایستگاه تا خانه، با هم</text>`; }
    else if (t === 'relay') { [[272, 40], [290, 96], [272, 150]].forEach(([x, y], k) => { b += home(x, y, COLS[k], k) + `<path class="path ${'abc'[k]}" d="M${x - 16} ${y + 6} C 220 ${y + 6}, 200 96, 170 96"/>`; });
      b += `<text x="158" y="108" font-size="30" text-anchor="middle">🚇</text><path class="path c" d="M140 96 H 26" style="stroke-dasharray:2 6"/><text class="lbl m" x="120" y="128">ادامه با مترو</text>` + mover(COLS[0], { p: 'M256 46 C 220 46, 200 96, 176 96', mid: [210, 70] }, 2.6, still); }
    return `<svg class="ms" viewBox="0 0 320 180" role="img" aria-label="نمایش نمونه" xmlns="http://www.w3.org/2000/svg">${b}</svg>`;
  }

  /* ───── wheel, grid, filters ───── */
  const vis = () => order.filter(s => aud === 'all' || s.aud === aud);
  function renderAud() { const used = [...new Set(ST.map(s => s.aud))];
    $('#aud').innerHTML = [['all', 'همه'], ...used.map(k => [k, AUD[k] || k])].map(([k, v]) => `<button data-aud="${k}" aria-pressed="${aud === k}">${v}</button>`).join(''); }
  function renderWheel() { const L = vis();
    $('#track').innerHTML = L.map((s, i) => { const [c1, c2] = pal(s); return `<button class="sc" data-i="${i}" data-id="${s.id}" style="--c1:${c1};--c2:${c2}"><span class="art">${sceneSvg(s.scene)}</span><span class="tx"><span class="who">${esc(s.who)}</span><span class="hk">${esc(s.hook)}</span>${s.main ? '<span class="tag">🎬 فیلم کوتاه</span>' : ''}</span></button>`; }).join('');
    $('#dots').innerHTML = L.map((_, i) => `<i data-i="${i}"></i>`).join('');
    $('#grid').innerHTML = order.map(s => { const [c1, c2] = pal(s); return `<button class="gi" data-id="${s.id}" style="--c1:${c1};--c2:${c2}"><span class="art">${sceneSvg(s.scene, true)}</span><span><b>${esc(s.title)}</b><small>${esc(AUD[s.aud] || '')}${s.main ? ' – فیلم کوتاه' : ''}</small></span></button>`; }).join('');
  }
  function mark() { $$('.sc').forEach((c, i) => c.classList.toggle('on', i === cur)); $$('#dots i').forEach((d, i) => d.classList.toggle('on', i === cur)); const s = vis()[cur]; $$('.gi').forEach(g => g.setAttribute('aria-current', s && g.dataset.id === s.id)); }
  function go(i, scroll = true, open = true) { const L = vis(); if (!L.length) return; cur = (i + L.length) % L.length; mark();
    if (scroll) { const c = $$('.sc')[cur]; c && c.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); }
    if (open) show(L[cur]); }
  let autoT = null; const stopAuto = () => { clearInterval(autoT); autoT = null; };
  const startAuto = () => { stopAuto(); if (matchMedia('(prefers-reduced-motion:reduce)').matches) return; autoT = setInterval(() => { if (!document.hidden && !film.on) go(cur + 1, true, false); }, 5200); };
  let scT; $('#track').addEventListener('scroll', () => { clearTimeout(scT); scT = setTimeout(() => { const tr = $('#track'), mid = tr.getBoundingClientRect().left + tr.clientWidth / 2; let best = 0, bd = 1e9;
    $$('.sc').forEach((c, i) => { const r = c.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - mid); if (d < bd) { bd = d; best = i; } }); if (best !== cur) { cur = best; mark(); } }, 90); }, { passive: true });
  $('#track').addEventListener('click', e => { const c = e.target.closest('.sc'); if (!c) return; stopAuto(); go(+c.dataset.i); $('#detail').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  $('#track').addEventListener('pointerdown', stopAuto); $('#track').addEventListener('keydown', e => { if (e.key === 'ArrowLeft') { stopAuto(); go(cur + 1); } if (e.key === 'ArrowRight') { stopAuto(); go(cur - 1); } });
  $('#next').onclick = () => { stopAuto(); go(cur + 1); }; $('#prev').onclick = () => { stopAuto(); go(cur - 1); };
  $('#dots').addEventListener('click', e => { const d = e.target.closest('i'); if (d) { stopAuto(); go(+d.dataset.i); } });
  $('#aud').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; aud = b.dataset.aud; renderAud(); renderWheel(); go(0); });
  $('#grid').addEventListener('click', e => { const g = e.target.closest('.gi'); if (!g) return; stopAuto(); if (aud !== 'all') { aud = 'all'; renderAud(); renderWheel(); } go(vis().findIndex(s => s.id === g.dataset.id)); $('#detail').scrollIntoView({ behavior: 'smooth', block: 'start' }); });

  /* ───── detail ───── */
  const caption = s => `${s.hook}\n\n${s.story}\n\nرسیدیم فقط هم‌مسیرها را به هم معرفی می‌کند؛ رفت‌وآمد با تصمیم و مسئولیت خودتان است.\n🔗 ${URL0}#${s.id}\n#رسیدیم #هم_سرویس #هم‌مسیر`;
  const still = s => { const [c1, c2] = pal(s); return `<div class="still" style="--c1:${c1};--c2:${c2}"><div class="hk">${esc(s.hook)}</div>${sceneSvg(s.scene)}<div class="ft"><img src="../assets/icon.svg?v=34" alt="">رسیدیم – residim.ir</div></div>`; };
  function show(s) { if (!s) return; film.stop(); try { history.replaceState(null, '', '#' + s.id); } catch (e) {}
    const F = FILMS[s.id];
    $('#det').innerHTML = `<div class="det"><div class="dh"><span class="who">${esc(s.who)}</span><h2>${esc(s.hook)}</h2></div>
      <div class="stage" id="stage"><span class="demo">نمایش نمونه</span>${F ? '' : still(s)}</div>
      <div class="db"><p class="story">${esc(s.story)}</p>
        <h3 style="margin:6px 0 0">در رسیدیم چطور؟</h3><ol class="how">${s.how.map(h => `<li><span>${esc(h.replace(' (به‌زودی)', ''))}${/به‌زودی/.test(h) ? '<span class="soon">به‌زودی</span>' : ''}</span></li>`).join('')}</ol>
        <div class="money"><span>رایگان (احسانی)</span><span>تقسیم هزینه (دنگی)</span><span>به توافق خودتان</span></div>
        <div class="cta"><a class="btn pri" href="../#new-${esc(s.kind)}">همین را در رسیدیم بسازید</a>${s.aud === 'school' ? '<a class="btn line" href="../schools/">رسیدیم برای مدارس</a>' : ''}</div>
        <div class="share"><h3>برای گروه‌تان بفرستید (ایتا، تلگرام، واتساپ…)</h3><textarea id="cap" readonly aria-label="متن آماده برای کپشن">${esc(caption(s))}</textarea>
          <div class="row"><button class="btn dark sm" data-do="copy">کپی متن</button><button class="btn line sm" data-do="poster">پوستر (عکس)</button><button class="btn line sm" data-do="share">اشتراک</button>${F && F.mp4 ? `<a class="btn line sm" href="${esc(F.mp4)}" download>ویدیو (mp4)</a>` : ''}</div>
          <p class="note">پوستر برای استوری و گروه‌ها ساخته می‌شود؛ متن را زیرش بچسبانید. همه‌ی تصویرها «نمایش نمونه» است، نه هم‌مسیرِ واقعی.</p></div>
      </div></div>`;
    if (F) film.mount(s, F);
    mark();
  }
  $('#det').addEventListener('click', async e => { const b = e.target.closest('[data-do]'); if (!b) return; const s = vis()[cur] || order[0];
    if (b.dataset.do === 'copy') { const t = $('#cap'); try { await navigator.clipboard.writeText(t.value); toast('کپی شد؛ در گروه‌تان بچسبانید.'); } catch (er) { t.select(); toast('متن انتخاب شد؛ کپی کنید.'); } }
    if (b.dataset.do === 'poster' || b.dataset.do === 'share') { b.disabled = true; try { const blob = await poster(s), file = new File([blob], `residim-${s.id}.png`, { type: 'image/png' });
        if (b.dataset.do === 'share' && navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], text: caption(s) });
        else if (b.dataset.do === 'share' && navigator.share) await navigator.share({ title: s.title, text: caption(s), url: URL0 + '#' + s.id });
        else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); toast('پوستر ذخیره شد.'); } }
      catch (er) { if (er && er.name !== 'AbortError') toast('ساخت پوستر نشد؛ دوباره امتحان کنید.'); } b.disabled = false; } });

  /* ───── poster (1080×1350 PNG, drawn on canvas) ───── */
  const wrapT = (x, t, w) => { const out = []; let line = ''; for (const wd of t.split(' ')) { const tr = line ? line + ' ' + wd : wd; if (x.measureText(tr).width > w && line) { out.push(line); line = wd; } else line = tr; } if (line) out.push(line); return out; };
  async function poster(s) { await Promise.all(['900 60px Vazirmatn', '700 34px Vazirmatn'].map(f => document.fonts.load(f).catch(() => {})));
    const W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d'), [c1, c2] = pal(s);
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, c1); g.addColorStop(1, c2); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.direction = 'rtl'; x.textAlign = 'right'; x.fillStyle = '#0E8F52'; x.font = '900 34px Vazirmatn'; x.fillText('قصه‌های هم‌مسیری – ' + s.title, W - 70, 110);
    x.fillStyle = '#04140B'; x.font = '900 64px Vazirmatn'; let y = 210; for (const l of wrapT(x, s.hook, W - 140)) { x.fillText(l, W - 70, y); y += 92; }
    const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sceneSvg(s.scene, true).replace('<svg class="ms"', `<svg class="ms" width="960" height="540"`).replace('</svg>', `<style>${MS_CSS}</style></svg>`));
    await new Promise(r => { img.onload = r; img.onerror = r; }); x.save(); x.fillStyle = '#ffffffb3'; x.beginPath(); x.roundRect(60, y - 20, W - 120, 560, 40); x.fill(); x.restore(); try { x.drawImage(img, 60, y - 10, W - 120, 540); } catch (e) {}
    y += 600; x.fillStyle = '#1E2B24'; x.font = '700 34px Vazirmatn'; const LL = wrapT(x, s.story, W - 140), L = LL.slice(0, 3); L.forEach((l, i) => x.fillText(i === 2 && LL.length > 3 ? l + '…' : l, W - 70, y + i * 54));
    x.fillStyle = '#04140B'; x.fillRect(0, H - 150, W, 150); x.fillStyle = '#1DBF73'; x.beginPath(); x.roundRect(W - 150, H - 120, 90, 90, 26); x.fill();
    const ic = new Image(); ic.src = '../assets/icon.svg?v=34'; await new Promise(r => { ic.onload = r; ic.onerror = r; }); try { x.drawImage(ic, W - 140, H - 110, 70, 70); } catch (e) {}
    x.textAlign = 'right'; x.fillStyle = '#fff'; x.font = '900 46px Vazirmatn'; x.fillText('رسیدیم – residim.ir', W - 180, H - 82);
    x.fillStyle = '#A9C4B4'; x.font = '700 22px Vazirmatn'; x.fillText('فقط آشنا می‌کنیم؛ رفت‌وآمد با تصمیم و مسئولیت خودتان. نمایش نمونه.', W - 180, H - 40);
    return new Promise(r => cv.toBlob(r, 'image/png')); }
  const MS_CSS = `.road{fill:none;stroke:#C9D6CE;stroke-width:10;stroke-linecap:round}.path{fill:none;stroke:#0E8F52;stroke-width:3;stroke-dasharray:6 7}.path.b{stroke:#FF9F45}.path.c{stroke:#4F8CFF}.home{fill:#fff;stroke:#04140B;stroke-width:2.2}.roof{fill:var(--rc);stroke:#04140B;stroke-width:2.2}.door{fill:#04140B}.car rect{fill:var(--cc);stroke:#04140B;stroke-width:2}.car circle{fill:#04140B}.ring{display:none}.lbl{font:900 13px sans-serif;fill:#04140B}.lbl.m{fill:#5B6B62;font-size:11px}`;

  /* ───── film: a 9:16 stage whose elements enter and leave on the narration's timecodes ───── */
  const sfx = (() => { let C; const ctx = () => (C = C || new (window.AudioContext || window.webkitAudioContext)());
    const tone = (f, d, type = 'sine', v = .18, at = 0, f2) => { const c = ctx(), o = c.createOscillator(), g = c.createGain(), t = c.currentTime + at; o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + .05); };
    return { ding: () => { tone(988, .35); tone(1480, .5, 'sine', .12, .09); }, pop: () => tone(520, .14, 'triangle', .2, 0, 900), horn: () => { tone(392, .18, 'square', .06); tone(494, .18, 'square', .05, .2); }, whoosh: () => tone(200, .5, 'sawtooth', .04, 0, 1400), ctx }; })();
  const SFX = { pins: 'pop', chat: 'pop', week: 'ding', weekB: 'ding', week4: 'ding', cta: 'whoosh', logo: 'ding', jam: 'horn', h2: 'pop', near: 'pop', tea: 'ding', flip: 'pop' };
  const house = (x, y, c, face) => `<g transform="translate(${x} ${y})"><path d="M-30 18v-30l30-26 30 26v30z" fill="#fff" stroke="#04140B" stroke-width="3" stroke-linejoin="round"/><path d="M-37 -10l37-33 37 33" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><rect x="-8" y="0" width="16" height="18" rx="3" fill="#04140B"/>${face ? `<text y="-14" font-size="22" text-anchor="middle">${face}</text>` : ''}</g>`;
  const carG = (c, n) => `<g><rect x="-30" y="-14" width="60" height="24" rx="10" fill="${c}" stroke="#04140B" stroke-width="3"/><rect x="-14" y="-30" width="30" height="18" rx="6" fill="#DFF7EA" stroke="#04140B" stroke-width="3"/><circle cx="-16" cy="11" r="7" fill="#04140B"/><circle cx="16" cy="11" r="7" fill="#04140B"/>${n ? `<text x="2" y="-16" font-size="12" text-anchor="middle">${n}</text>` : ''}</g>`;
  const bubble = (x, y, t, c = '#fff') => `<g transform="translate(${x} ${y})"><rect x="-58" y="-20" width="116" height="36" rx="14" fill="${c}" stroke="#04140B" stroke-width="2.5"/><text y="4" font-size="15" font-weight="900" text-anchor="middle" font-family="Vazirmatn">${t}</text></g>`;
  const week = (cols, labels) => `<g transform="translate(30 92)"><rect width="300" height="112" rx="22" fill="#fff" stroke="#04140B" stroke-width="3"/><text x="280" y="34" font-size="17" font-weight="900" text-anchor="end" font-family="Vazirmatn">برنامه‌ی هفته</text>${['ش', 'ی', 'د', 'س', 'چ'].map((d, i) => `<g transform="translate(${252 - i * 54} 66)"><rect x="-22" y="-18" width="44" height="40" rx="12" fill="${cols[i]}" stroke="#04140B" stroke-width="2"/><text y="2" font-size="15" font-weight="900" text-anchor="middle" font-family="Vazirmatn">${d}</text>${labels ? `<text y="16" font-size="10" text-anchor="middle" font-family="Vazirmatn">${labels[i]}</text>` : ''}</g>`).join('')}</g>`;
  function filmSvg(s) { const F = s.scene || {}, D = F.dest || '🏫', G = '#1DBF73', O = '#FF9F45';
    const E = { sky: `<rect width="360" height="250" fill="url(#skyg)"/>`, ground: `<rect y="250" width="360" height="390" fill="#EAF1EC"/>${[...Array(7)].map((_, i) => `<rect x="${i * 56 - 10}" y="270" width="40" height="40" rx="6" fill="#DCE7E0"/><rect x="${i * 56 + 10}" y="470" width="36" height="30" rx="6" fill="#DCE7E0"/>`).join('')}`,
      road: `<rect x="0" y="378" width="360" height="34" fill="#C9D6CE"/><g class="loop-dash">${[...Array(8)].map((_, i) => `<rect x="${i * 50}" y="393" width="26" height="4" rx="2" fill="#fff"/>`).join('')}</g>`,
      sun: `<circle cx="292" cy="96" r="30" fill="#FFC93C"/>`, sun2: `<circle cx="180" cy="66" r="30" fill="#FFB020"/>`,
      clock1: bubble(78, 62, '۷:۱۵ صبح'), clock2: bubble(78, 62, '۱۳:۰۰ ظهر'), clockAM: bubble(78, 62, '۷:۰۰ صبح'), clockPM: bubble(78, 62, '۱۳:۰۰ ظهر'),
      dest: `<g transform="translate(66 352)"><text font-size="74" text-anchor="middle">${D}</text><text y="34" font-size="15" font-weight="900" text-anchor="middle" font-family="Vazirmatn">${s.kind === 'work' ? 'محل کار' : 'مدرسه'}</text></g>`,
      hA: house(286, 330, G), hB: house(286, 476, O), ringB: `<circle cx="286" cy="466" r="40" fill="none" stroke="${O}" stroke-width="4" class="loop-pulse"/>`,
      cA: `<g transform="translate(250 382)"><g class="inner">${carG(G)}</g></g>`, cB: `<g transform="translate(250 404)"><g class="inner">${carG(O)}</g></g>`,
      dim: `<rect width="360" height="640" fill="#04140B" opacity=".55"/>`, q: `<text x="286" y="490" font-size="64" text-anchor="middle">❓</text>`,
      pA: `<g transform="translate(286 280)"><g class="inner"><text font-size="34" text-anchor="middle">📍</text></g></g>`, pB: `<g transform="translate(286 426)"><g class="inner"><text font-size="34" text-anchor="middle">📍</text></g></g>`,
      link: `<path d="M262 300 C 200 330, 200 420, 262 446" fill="none" stroke="#0E8F52" stroke-width="4" stroke-dasharray="8 8" class="loop-dashp"/>`,
      badge: `<g transform="translate(196 372)"><circle r="26" fill="#1DBF73" stroke="#04140B" stroke-width="3"/><text y="8" font-size="22" font-weight="900" text-anchor="middle" font-family="Vazirmatn">ر</text></g>`,
      bA: bubble(200, 292, 'سلام 👋'), bB: bubble(200, 520, 'سلام، خوش‌حالم 🌿', '#FFF4D6'),
      week: week([G, O, G, O, G]), weekB: week([G, G, G, G, G], ['صبح', 'صبح', 'صبح', 'صبح', 'صبح']).replace('برنامه‌ی هفته', 'صبح‌ها: شما – ظهرها: آن‌ها'), week4: week([G, O, '#4F8CFF', '#FF7AA8', G]),
      tea: `<g transform="translate(222 470)"><text font-size="40" text-anchor="middle">☕</text><path d="M-8 -34c-6-8 6-12 0-20M6 -34c-6-8 6-12 0-20" stroke="#5B6B62" stroke-width="3" fill="none" class="loop-steam"/></g>`,
      work: bubble(286, 196, '💼 سر کار'), sad: `<text x="286" y="262" font-size="34" text-anchor="middle">😟</text>`, free: bubble(200, 520, 'ظهرها آزادم 🙂', '#FFF4D6'),
      lblAM: bubble(160, 350, '☀️ رفت: شما'), lblPM: bubble(160, 452, '🕐 برگشت: آن‌ها', '#FFF4D6'),
      h1: house(300, 300, G, '👩‍🏫'), h2: house(232, 300, O, '👩‍🏫'), h3: house(300, 486, '#4F8CFF', '👩‍🏫'), h4: house(232, 486, '#FF7AA8', '👩‍🏫'),
      r2: `<circle cx="232" cy="294" r="44" fill="none" stroke="${O}" stroke-width="4" class="loop-pulse"/>`,
      jam: `<g transform="translate(0 384)">${[300, 236, 172].map((xx, i) => `<g transform="translate(${xx} 0)">${carG(['#1DBF73', '#FF9F45', '#4F8CFF'][i])}<circle cx="27" cy="-2" r="4" fill="#EF4444"/></g>`).join('')}<g transform="translate(108 0)">${carG('#FF7AA8')}<circle cx="27" cy="-2" r="4" fill="#EF4444"/></g></g><text x="66" y="292" font-size="34" text-anchor="middle">🚦</text>`,
      p4: [[300, 250], [232, 250], [300, 436], [232, 436]].map(([xx, yy]) => `<text x="${xx}" y="${yy}" font-size="28" text-anchor="middle">📍</text>`).join(''),
      links4: `<path d="M286 310 C 200 330, 150 350, 100 352 M220 310 C 180 330, 150 350, 100 352 M286 470 C 200 450, 150 380, 100 360 M220 470 C 180 440, 150 380, 100 360" fill="none" stroke="#0E8F52" stroke-width="3" stroke-dasharray="7 8"/>`,
      bus: `<g transform="translate(250 384)"><g class="inner">${carG(G, '👩‍🏫👩‍🏫👩‍🏫👩‍🏫')}</g></g>`,
      leaf: `<g><text x="200" y="200" font-size="38" class="loop-bob">🍃</text>${bubble(150, 250, '۳ ماشین کمتر در صف 🌿', '#E8F8F0')}</g>`,
      cta: `<g><rect x="22" y="150" width="316" height="300" rx="28" fill="#04140B"/><foreignObject x="40" y="170" width="280" height="200"><div xmlns="http://www.w3.org/1999/xhtml" style="font:900 22px/1.7 Vazirmatn,sans-serif;color:#fff;direction:rtl;text-align:right">${esc(s.hook)}</div></foreignObject><rect x="70" y="384" width="220" height="44" rx="22" fill="#1DBF73"/><text x="180" y="413" font-size="18" font-weight="900" text-anchor="middle" font-family="Vazirmatn">residim.ir</text></g>`,
      logo: `<g><rect width="360" height="640" fill="#04140B"/><rect x="132" y="190" width="96" height="96" rx="28" fill="#1DBF73"/><image href="../assets/icon.svg?v=34" x="146" y="204" width="68" height="68"/><text x="180" y="340" font-size="34" font-weight="900" fill="#fff" text-anchor="middle" font-family="Vazirmatn">رسیدیم</text><text x="180" y="378" font-size="17" fill="#A9C4B4" text-anchor="middle" font-family="Vazirmatn">نوبت‌ها روشن، خیال‌ها جمع</text><text x="180" y="440" font-size="12" fill="#6F8A7B" text-anchor="middle" font-family="Vazirmatn">فقط آشنا می‌کنیم؛ رفت‌وآمد با تصمیم و مسئولیت خودتان</text></g>` };
    return `<svg class="film" viewBox="0 0 360 640" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(s.title)}"><defs><linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BDE7FF"/><stop offset="1" stop-color="#EAF7FF"/></linearGradient></defs>${Object.entries(E).map(([k, v]) => `<g class="el" data-k="${k}" style="opacity:0;transform:translateY(24px)">${v}</g>`).join('')}</svg>`; }
  const STATES = {
    noservice: { h1: 'sky sun ground road dest hA cA clock1', shuttle: 'sky sun2 ground road dest hA cA:drive clock2', dim: 'sky sun2 ground road dest hA cA:drive dim q', h2: 'sky sun2 ground road dest hA cA:drive hB cB:drive ringB',
      pins: 'sky sun ground road dest hA hB pA:bob pB:bob link badge', chat: 'sky sun ground road dest hA hB pA pB link bA bB', week: 'sky sun ground road dest hA hB link week', tea: 'sky sun ground road dest hA hB cA:drive tea week', cta: 'sky sun ground road dest hA hB cta', logo: 'logo' },
    oneway: { am: 'sky sun ground road dest hA cA:drive clockAM work', noon: 'sky sun2 ground road dest hA work sad clockPM', h2: 'sky sun2 ground road dest hA hB ringB work', flip: 'sky sun2 ground road dest hA hB free work',
      pins: 'sky sun ground road dest hA hB pA:bob pB:bob link badge', both: 'sky sun ground road dest hA hB cA:drive cB:drive lblAM lblPM', week: 'sky sun ground road dest hA hB weekB', cta: 'sky sun ground road dest hA hB cta', logo: 'logo' },
    colleagues: { jam: 'sky sun ground road dest jam', four: 'sky sun ground road dest h1 h2 h3 h4 jam', near: 'sky sun ground road dest h1 h2 h3 h4 r2', pins: 'sky sun ground road dest h1 h2 h3 h4 p4 links4 badge',
      week: 'sky sun ground road dest h1 h2 h3 h4 week4', one: 'sky sun ground road dest h1 h2 h3 h4 bus:drive', city: 'sky sun ground road dest leaf bus:drive', cta: 'sky sun ground road dest h1 h2 h3 h4 cta', logo: 'logo' } };
  const film = { on: false, s: null, F: null, t0: 0, raf: 0, idx: -1, au: null, ev: null, music: true,
    mount(s, F) { this.s = s; this.F = F; this.idx = -1; const st = $('#stage');
      st.insertAdjacentHTML('beforeend', filmSvg(s) + `<div class="cap" id="cap2"></div><button class="play" id="play" aria-label="پخش فیلم"><span><svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z" fill="#04140B"/></svg></span><b>${esc(s.title)} – پخش با صدا</b></button>
        <div class="ctl"><button id="f-pp" aria-label="پخش یا توقف">❚❚</button><button id="f-rs" aria-label="از اول">↻</button><div class="pg" id="f-pg"><i></i></div><button id="f-mu" aria-label="موسیقی" aria-pressed="true">♪</button><button id="f-fs" aria-label="تمام‌صفحه">⛶</button></div>`);
      this.apply(0, true); this.au = null; const url = F.audio; // set in stories-data.js once the narration mp3 exists in /stories/audio/
      if (url) fetch(url, { method: 'HEAD' }).then(r => { if (r.ok && /audio/.test(r.headers.get('content-type') || '')) { this.au = new Audio(url); this.au.preload = 'auto'; } }).catch(() => {});
      $('#play').onclick = () => this.play(0); $('#f-pp').onclick = () => this.on ? this.pause() : this.play(this.now());
      $('#f-rs').onclick = () => this.play(0); $('#f-mu').onclick = e => { this.music = !this.music; e.currentTarget.setAttribute('aria-pressed', this.music); if (!this.music) window.MUS && MUS.stop(); else if (this.on) this.musicAt(this.now()); };
      $('#f-fs').onclick = () => { const el = $('#stage'); (document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen ? el.requestFullscreen() : Promise.reject()).catch(() => {}); };
      $('#f-pg').onclick = e => { const r = e.currentTarget.getBoundingClientRect(), p = 1 - (e.clientX - r.left) / r.width; this.play(p * F.end); }; },
    marks() { return [...this.F.plans.map(p => p.t), this.F.end]; },
    now() { return this.au && !this.au.paused ? this.au.currentTime : this.on ? (performance.now() - this.t0) / 1000 : this.paused || 0; },
    musicAt(t) { if (!window.MUS || !this.music) return; this.ev = this.ev || MUS.score(this.F.plans.map(p => p.mood), this.marks(), this.F.end); MUS.start(this.ev, t, this.au ? .32 : .55); },
    play(t) { stopAuto(); window.__filmStarted = performance.now(); $('#play') && ($('#play').hidden = true); this.on = true; this.paused = 0; try { sfx.ctx().resume(); } catch (e) {}
      if (this.au) { this.au.currentTime = t; this.au.play().catch(() => {}); } this.t0 = performance.now() - t * 1000; this.musicAt(t); this.idx = -1; $('#f-pp').textContent = '❚❚';
      cancelAnimationFrame(this.raf); const tick = () => { if (!this.on) return; const n = this.now(); this.apply(n); $('#f-pg i').style.width = Math.min(100, n / this.F.end * 100) + '%';
        if (n >= this.F.end + .8) { this.stop(true); window.__filmDone = true; return; } this.raf = requestAnimationFrame(tick); }; tick(); },
    pause() { this.paused = this.now(); this.on = false; cancelAnimationFrame(this.raf); this.au && this.au.pause(); window.MUS && MUS.stop(); $('#f-pp').textContent = '▶'; },
    stop(end) { if (!this.s) return; this.on = false; cancelAnimationFrame(this.raf); this.au && this.au.pause(); window.MUS && MUS.stop(); if (end && $('#play')) { $('#play').hidden = false; $('#play b').textContent = 'دوباره ببینید'; } },
    apply(t, first) { const P = this.F.plans; let i = 0; P.forEach((p, k) => { if (t >= p.t) i = k; }); if (i === this.idx && !first) return; this.idx = i;
      const v = P[i].v, spec = (STATES[this.s.id] || {})[v] || '', on = {}; spec.split(' ').filter(Boolean).forEach(tk => { const [k, l] = tk.split(':'); on[k] = l || true; });
      $$('#stage .film .el').forEach(g => { const k = g.dataset.k, vis = k in on; g.style.opacity = vis ? 1 : 0; g.style.transform = vis ? 'none' : 'translateY(24px)';
        const inner = g.querySelector('.inner'); if (inner) inner.setAttribute('class', 'inner' + (on[k] === 'drive' ? ' loop-drive' : on[k] === 'bob' ? ' loop-bob' : '')); });
      const cap = $('#cap2'); if (cap) cap.innerHTML = first ? '' : `<span>${esc(P[i].lines.map(l => clean(l.x)).join(' '))}</span>`;
      if (!first && this.on && SFX[v]) try { sfx[SFX[v]](); } catch (e) {} } };

  /* ───── boot ───── */
  renderAud(); renderWheel();
  const h = location.hash.slice(1), rec = new URLSearchParams(location.search).get('rec');
  const i0 = Math.max(0, vis().findIndex(s => s.id === (rec || h)));
  go(i0, !!h, true); mark();
  if (rec && FILMS[rec]) { document.body.classList.add('rec'); film.music = false; setTimeout(() => film.play(0), 1500); }
  else if (!h) startAuto();
  addEventListener('hashchange', () => { const k = vis().findIndex(s => s.id === location.hash.slice(1)); if (k >= 0 && k !== cur) go(k); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && film.on) film.pause(); });
})();
