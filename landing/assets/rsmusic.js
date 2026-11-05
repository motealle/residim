/* Residim music engine (shared with the timecoder): score(moods, marks, end) → events → realtime / offline WebAudio, WAV and MIDI. */
const MUS = (() => {
  const BPM = 96, B = 60 / BPM;
  const CH = { Am: [57, 60, 64], F: [53, 57, 60], E: [52, 56, 59], Dm: [50, 53, 57], C: [48, 52, 55], G: [55, 59, 62], Fmaj7: [53, 57, 60, 64], Cadd9: [48, 55, 60, 62] };
  const MOOD = {
    tension: { ch: ['Am', 'F', 'Am', 'E'], pad: [700, .15], bass: 8, tick: 1 },
    pain: { ch: ['Dm', 'Am', 'F', 'E'], pad: [900, .19], ep: 'whole' },
    still: { ch: ['Fmaj7', 'Fmaj7', 'Cadd9', 'Cadd9'], pad: [1500, .21], bell: 1 },
    lift: { ch: ['C', 'G', 'Am', 'F'], pad: [2200, .13], ep: 'arp', bass: 4, kick: [0, 2], motif: 1 },
    joy: { ch: ['C', 'G', 'Am', 'F'], pad: [2600, .11], ep: 'arp', bass: 4, kick: [0, 1, 2, 3], hat: 1 },
    warm: { ch: ['F', 'C', 'G', 'C'], pad: [1800, .16], ep: 'half', bass: 2, kick: [0] },
    build: { ch: ['F', 'G', 'Am', 'G'], pad: [2400, .13], ep: 'arp', bass: 8, kick: [0, 1, 2, 3], roll: 1 },
    peak: { ch: ['C', 'G', 'Am', 'F'], pad: [3200, .12], ep: 'arp', bass: 8, kick: [0, 1, 2, 3], hat: 1, motif: 1 },
    resolve: { ch: ['Fmaj7', 'Cadd9', 'Cadd9', 'Cadd9'], pad: [2000, .19], sting: 1 }
  };
  const MOTIF = [[76, 0, .5], [79, .5, .5], [84, 1, 1.5]];
  function score(moods, marks, end) {
    const ev = [], st = moods.map((_, i) => Math.max(0, Math.round(marks[i] / B))), push = (i, t, d, n, v, x) => ev.push(Object.assign({ i, t, d, n, v }, x || {}));
    moods.forEach((mo, s) => {
      const m = MOOD[mo] || MOOD.warm, b0 = st[s], b1 = s + 1 < moods.length ? Math.max(b0 + 1, st[s + 1]) : Math.ceil(end / B) + (m.sting ? 7 : 2);
      for (let b = b0; b < b1; b++) {
        const k = b - b0, bar = Math.floor(k / 4), bt = k % 4, t = b * B, ch = CH[m.ch[bar % 4]];
        let root = ch[0] - 12; if (root > 47) root -= 12;
        if (bt === 0 || b === b0) push('pad', t, Math.min(4 - bt, b1 - b) * B + .4, ch, m.pad[1], { cut: m.pad[0] });
        if (m.bass === 8) { push('bass', t, B * .4, [root], .5); push('bass', t + B / 2, B * .4, [root], .38); }
        else if (m.bass === 4) push('bass', t, B * .85, [root], .5);
        else if (m.bass === 2 && bt % 2 === 0) push('bass', t, B * 1.8, [root], .45);
        if (m.ep === 'whole' && bt === 0) push('ep', t, 4 * B, ch.map(n => n + 12), .16);
        if (m.ep === 'half' && bt % 2 === 0) push('ep', t, 2 * B, ch.map(n => n + 12), .17);
        if (m.ep === 'arp') { const a = [...ch.map(n => n + 12), ch[1] + 24]; push('ep', t, B * .9, [a[(bt * 2) % a.length]], .2); push('ep', t + B / 2, B * .9, [a[(bt * 2 + 1) % a.length]], .15); }
        if (m.kick && m.kick.includes(bt)) push('kick', t, .4, [36], bt === 0 ? .9 : .7);
        if (m.hat) push('hat', t + B / 2, .05, [42], .35);
        if (m.tick) { push('tick', t, .03, [37], .45); push('tick', t + B / 2, .03, [37], .25); }
        if (m.bell && bt === 0) push('bell', t, 3 * B, [[76, 72, 79, 74][bar % 4]], .22);
        if (m.bell && bt === 2 && bar % 2) push('bell', t, 2 * B, [[84, 81][bar % 2]], .14);
        if (m.roll && b1 - b <= 4) for (let r = 0; r < 4; r++) push('snare', t + r * B / 4, .1, [38], .12 + .5 * (1 - (b1 - b - r / 4) / 4));
      }
      if (m.motif || m.sting) MOTIF.forEach(([n, o, d]) => { push('bell', b0 * B + o * B + (m.sting ? B : 0), d * B + 1, [n], .3); push('ep', b0 * B + o * B + (m.sting ? B : 0), d * B, [n - 12], .14); });
      if (m.sting) push('pad', (b0 + 3) * B, 6 * B, [48, 55, 60, 64, 67], .2, { cut: 2600 });
      const nx = moods[s + 1]; if (nx && ['lift', 'peak', 'joy'].includes(nx) && mo !== nx) push('riser', Math.max(b0, b1 - 4) * B, (b1 - Math.max(b0, b1 - 4)) * B, [0], .14);
    });
    return ev.sort((a, b) => a.t - b.t);
  }
  const hz = n => 440 * Math.pow(2, (n - 69) / 12);
  function bus(ctx, out) {
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = .01; comp.release.value = .25;
    const master = ctx.createGain(); master.gain.value = .6; comp.connect(master); master.connect(out);
    const len = ctx.sampleRate * 3.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); let s = 1234 + c * 77; for (let i = 0; i < len; i++) { s = (s * 16807) % 2147483647; d[i] = ((s / 2147483647) * 2 - 1) * Math.pow(1 - i / len, 3.2); } }
    const rev = ctx.createConvolver(); rev.buffer = ir; const rg = ctx.createGain(); rg.gain.value = .55; rev.connect(rg); rg.connect(comp);
    const dl = ctx.createDelay(1); dl.delayTime.value = B * .75; const fb = ctx.createGain(); fb.gain.value = .28; const lp = ctx.createBiquadFilter(); lp.frequency.value = 2500;
    dl.connect(lp); lp.connect(fb); fb.connect(dl); const dg = ctx.createGain(); dg.gain.value = .35; lp.connect(dg); dg.connect(comp);
    const nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), nd = nb.getChannelData(0); let s = 99; for (let i = 0; i < nd.length; i++) { s = (s * 16807) % 2147483647; nd[i] = (s / 2147483647) * 2 - 1; }
    return { ctx, dry: comp, rev, del: dl, noise: nb, master };
  }
  function voice(bs, e, at, dur) {
    const c = bs.ctx, o = [], g = c.createGain(), send = (node, dry, rv, dl) => { const a = c.createGain(); a.gain.value = dry; node.connect(a); a.connect(bs.dry); if (rv) { const r = c.createGain(); r.gain.value = rv; node.connect(r); r.connect(bs.rev); } if (dl) { const q = c.createGain(); q.gain.value = dl; node.connect(q); q.connect(bs.del); } };
    const env = (a, peak, decay, sus, rel) => { g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(peak, at + a); g.gain.setTargetAtTime(peak * sus, at + a, decay); g.gain.setTargetAtTime(0, at + dur, rel); };
    const osc = (type, f, det) => { const x = c.createOscillator(); x.type = type; x.frequency.value = f; if (det) x.detune.value = det; o.push(x); return x; };
    const noise = () => { const x = c.createBufferSource(); x.buffer = bs.noise; x.loop = true; o.push(x); return x; };
    let tail = 1.2;
    if (e.i === 'pad') { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(e.cut * .6, at); f.frequency.linearRampToValueAtTime(e.cut, at + Math.min(dur, 2.5)); f.Q.value = .8; f.connect(g);
      e.n.forEach(n => { [-8, 8].forEach(d => osc('sawtooth', hz(n), d).connect(f)); osc('triangle', hz(n - 12)).connect(f); }); env(.7, e.v / e.n.length, .8, .85, .5); send(g, .5, .6); tail = 2.5; }
    else if (e.i === 'ep' || e.i === 'bell') { const r = e.i === 'bell' ? 3.5 : 1, ix = e.i === 'bell' ? 3.2 : 1.8;
      e.n.forEach(n => { const m = osc('sine', hz(n) * r), mg = c.createGain(); mg.gain.setValueAtTime(hz(n) * ix, at); mg.gain.setTargetAtTime(hz(n) * ix * .12, at, e.i === 'bell' ? .5 : .25); m.connect(mg); const cr = osc('sine', hz(n)); mg.connect(cr.frequency); cr.connect(g); });
      env(.006, e.v / Math.sqrt(e.n.length), e.i === 'bell' ? 1.1 : .7, .25, .35); send(g, .6, e.i === 'bell' ? .8 : .35, e.i === 'ep' ? .5 : .2); tail = 2.5; }
    else if (e.i === 'bass') { const f = c.createBiquadFilter(); f.frequency.value = 420; f.connect(g); osc('triangle', hz(e.n[0])).connect(f); osc('sine', hz(e.n[0])).connect(f); env(.01, e.v, .3, .6, .06); send(g, 1, .05); tail = .4; }
    else if (e.i === 'kick') { const x = osc('sine', 110); x.frequency.setValueAtTime(120, at); x.frequency.exponentialRampToValueAtTime(42, at + .12); x.connect(g); g.gain.setValueAtTime(e.v * .9, at); g.gain.exponentialRampToValueAtTime(.001, at + .38); send(g, 1, .04); tail = .45; dur = 0; }
    else { const x = noise(), f = c.createBiquadFilter(); x.connect(f); f.connect(g);
      if (e.i === 'hat') { f.type = 'highpass'; f.frequency.value = 7500; g.gain.setValueAtTime(e.v * .25, at); g.gain.exponentialRampToValueAtTime(.001, at + .05); tail = .1; dur = 0; send(g, 1, .15); }
      else if (e.i === 'tick') { f.type = 'bandpass'; f.frequency.value = 3200; f.Q.value = 6; g.gain.setValueAtTime(e.v * .6, at); g.gain.exponentialRampToValueAtTime(.001, at + .03); tail = .08; dur = 0; send(g, 1, .2); }
      else if (e.i === 'snare') { f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = .9; g.gain.setValueAtTime(e.v * .7, at); g.gain.exponentialRampToValueAtTime(.001, at + .12); tail = .2; dur = 0; send(g, 1, .3); }
      else { f.type = 'bandpass'; f.Q.value = 2.5; f.frequency.setValueAtTime(400, at); f.frequency.exponentialRampToValueAtTime(5200, at + dur); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(e.v, at + dur); g.gain.linearRampToValueAtTime(0, at + dur + .05); tail = .1; send(g, .8, .5); } }
    o.forEach(x => { x.start(at); x.stop(at + dur + tail); });
    return { stop: t => { try { g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, .05); o.forEach(x => x.stop(t + .3)); } catch (err) {} } };
  }
  /* realtime: schedule events from "from" (seconds on the voice timeline) with a lookahead loop */
  let RT = null;
  function start(ev, from, vol) {
    stop(); const ctx = (MUS.ctx = MUS.ctx || new (window.AudioContext || window.webkitAudioContext)()); ctx.resume && ctx.resume();
    const out = ctx.createGain(); out.gain.value = vol; out.connect(ctx.destination); const bs = bus(ctx, out), t0 = ctx.currentTime + .06, live = [];
    let k = 0; for (const e of ev) { if (e.t >= from) break; if (e.t + e.d > from && (e.i === 'pad' || e.i === 'bell')) live.push(voice(bs, e, t0, e.d - (from - e.t))); k++; }
    const tick = () => { const now = ctx.currentTime - t0 + from + .35; while (k < ev.length && ev[k].t < now) { const e = ev[k++]; live.push(voice(bs, e, t0 + e.t - from, e.d)); if (live.length > 300) live.splice(0, 100); } };
    tick(); RT = { ctx, out, live, iv: setInterval(tick, 60) };
  }
  function stop() { if (!RT) return; clearInterval(RT.iv); const t = RT.ctx.currentTime; RT.live.forEach(v => v.stop(t)); RT.out.gain.setTargetAtTime(0, t, .05); const o = RT.out; setTimeout(() => o.disconnect(), 600); RT = null; }
  function setVol(v) { if (RT) RT.out.gain.setTargetAtTime(v, RT.ctx.currentTime, .05); }
  async function render(ev, end, sr = 44100) {
    const ctx = new OfflineAudioContext(2, Math.ceil(sr * (end + 5)), sr), out = ctx.createGain(); out.gain.value = .9; out.connect(ctx.destination);
    const bs = bus(ctx, out); ev.forEach(e => voice(bs, e, e.t + .05, e.d)); return ctx.startRendering();
  }
  function wav(buf) {
    const n = buf.length, ch = buf.numberOfChannels, dv = new DataView(new ArrayBuffer(44 + n * ch * 2)), W = (o, s) => [...s].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
    W(0, 'RIFF'); dv.setUint32(4, 36 + n * ch * 2, true); W(8, 'WAVEfmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, ch, true); dv.setUint32(24, buf.sampleRate, true); dv.setUint32(28, buf.sampleRate * ch * 2, true); dv.setUint16(32, ch * 2, true); dv.setUint16(34, 16, true); W(36, 'data'); dv.setUint32(40, n * ch * 2, true);
    const d = [...Array(ch)].map((_, c) => buf.getChannelData(c)); let o = 44; for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { dv.setInt16(o, Math.max(-1, Math.min(1, d[c][i])) * 32767, true); o += 2; }
    return dv.buffer;
  }
  function midi(ev) {
    const PPQ = 480, tk = s => Math.round(s / B * PPQ), TR = { pad: [0, 89], ep: [1, 4], bell: [2, 11], bass: [3, 33], kick: [9], hat: [9], tick: [9], snare: [9] };
    const vlq = v => { const b = [v & 127]; while ((v >>= 7)) b.unshift((v & 127) | 128); return b; }, chunk = (id, d) => [...id].map(c => c.charCodeAt(0)).concat([d.length >>> 24, (d.length >> 16) & 255, (d.length >> 8) & 255, d.length & 255], d);
    const names = ['pad', 'ep', 'bell', 'bass', 'drums'], tracks = names.map(nm => {
      const mine = ev.filter(e => nm === 'drums' ? TR[e.i] && TR[e.i][0] === 9 : e.i === nm), list = [];
      mine.forEach(e => e.n.forEach(n => { const ch = TR[e.i][0]; list.push([tk(e.t), 0x90 | ch, n, Math.max(1, Math.min(127, Math.round(e.v * (e.i === 'pad' ? 300 : 160))))]); list.push([tk(e.t + (ch === 9 ? .1 : e.d)), 0x80 | ch, n, 0]); }));
      list.sort((a, b) => a[0] - b[0] || (a[1] & 0xf0) - (b[1] & 0xf0)); let last = 0, d = [];
      if (nm === 'pad') d.push(0, 0xff, 0x51, 3, ...[Math.round(B * 1e6)].flatMap(x => [x >> 16, (x >> 8) & 255, x & 255]));
      if (nm !== 'drums') d.push(0, 0xc0 | TR[nm][0], TR[nm][1]);
      list.forEach(([t, s, n, v]) => { d.push(...vlq(t - last), s, n, v); last = t; }); d.push(0, 0xff, 0x2f, 0); return chunk('MTrk', d); });
    return new Uint8Array([...chunk('MThd', [0, 1, 0, tracks.length, PPQ >> 8, PPQ & 255]), ...tracks.flat()]);
  }
  return { score, start, stop, setVol, render, wav, midi, MOOD };
})();
window.MUS = MUS;
