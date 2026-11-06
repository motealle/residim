// Finds content that spills past the screen or is silently cut by an overflow:hidden box (horizontal scrollers are fine).
module.exports = () => { const W = innerWidth, out = [];
  document.querySelectorAll('body *').forEach(e => { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || s.position === 'fixed' || e.closest('svg')) return;
    const R = e.getBoundingClientRect(); if (!R.width || !R.height) return;
    let a = e.parentElement, bad = R.right > W + 2 || R.left < -2, sc = false;
    while (a && a !== document.documentElement) { const o = getComputedStyle(a).overflowX; if (o === 'auto' || o === 'scroll') { sc = true; break; }
      if (o === 'hidden' || o === 'clip') { const A = a.getBoundingClientRect(); if (R.right > A.right + 2 || R.left < A.left - 2) { if (e.textContent.trim() && e.children.length === 0) bad = true; } } a = a.parentElement; }
    if (bad && !sc && e.textContent.trim()) out.push(e.tagName + '.' + String(e.className && e.className.baseVal === undefined ? e.className : '').split(' ')[0] + ' ' + Math.round(R.left) + '..' + Math.round(R.right) + ' «' + e.textContent.trim().slice(0, 24) + '»'); });
  return [...new Set(out)].slice(0, 8); };
