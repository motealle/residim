// Story films → landing/stories/video/<id>.mp4 (1080×1920) + landing/stories/audio/<id>.mp3 (the page's soundtrack).
// Usage: node scripts/video/story-film.cjs [noservice oneway colleagues]
// Narration (optional): docs/video/<NN-story-id>/voice.wav|mp3|m4a. Put the timecoder's output in timings.txt next to it and
// run `python3 scripts/video/gen_stories.py` first, so the scenes change exactly on the recorded voice.
// Music + sound effects are rendered offline (rsmusic.js), ducked under the voice, loudness-normalised to −14 LUFS.
const { chromium } = require('playwright'), fs = require('fs'), path = require('path'), { spawn, execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../..'), LAND = ROOT + '/landing', OUT = LAND + '/stories', TMP = fs.mkdtempSync(require('os').tmpdir() + '/film-');
const SLUG = { noservice: '06-story-noservice', oneway: '07-story-oneway', colleagues: '08-story-colleagues' };
const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SLUG);
const PORT = 8800 + Math.floor(Math.random() * 90);
const ff = a => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...a], { stdio: 'inherit' });
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: LAND, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 900));
  const b = await chromium.launch();
  try {
    for (const id of ids) {
      const dir = ROOT + '/docs/video/' + SLUG[id] + '/', voice = ['wav', 'mp3', 'm4a'].map(e => dir + 'voice.' + e).find(f => fs.existsSync(f));
      const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1, recordVideo: { dir: TMP + '/' + id, size: { width: 1080, height: 1920 } } });
      const pg = await ctx.newPage(), t0 = Date.now();
      await pg.goto(`http://127.0.0.1:${PORT}/stories/?rec=${id}`, { waitUntil: 'domcontentloaded' });
      await pg.waitForFunction(() => window.__filmStarted, null, { timeout: 20000 }); const start = (Date.now() - t0) / 1000;
      await pg.waitForFunction(() => window.__filmDone, null, { timeout: 180000, polling: 250 });
      const { wav, end } = await pg.evaluate(async id => { const F = STORY_FILMS[id], marks = [...F.plans.map(p => p.t), F.end];
        const ev = MUS.score(F.plans.map(p => p.mood), marks, F.end, window.__storyCues(id)), buf = await MUS.render(ev, F.end + 2, 48000), w = new Uint8Array(MUS.wav(buf));
        let s = ''; for (let i = 0; i < w.length; i += 32768) s += String.fromCharCode(...w.subarray(i, i + 32768)); return { wav: btoa(s), end: F.end }; }, id);
      const vid = await pg.video().path(); await ctx.close();
      const mus = TMP + `/${id}.wav`, mix = TMP + `/${id}-mix.wav`; fs.writeFileSync(mus, Buffer.from(wav, 'base64'));
      const len = (end + 1.6).toFixed(2);
      // soundtrack: music alone, or voice on top with the music ducked under it
      const chain = voice
        ? ['-i', mus, '-i', voice, '-filter_complex', '[1:a]aresample=48000,highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=5:release=120,asplit=2[v][sc];[0:a]volume=0.55[m];[m][sc]sidechaincompress=threshold=0.04:ratio=6:attack=20:release=400[md];[md][v]amix=inputs=2:duration=first:normalize=0,highpass=f=40,loudnorm=I=-14:TP=-1.5:LRA=11[o]', '-map', '[o]']
        : ['-i', mus, '-af', 'highpass=f=40,loudnorm=I=-15:TP=-1.5:LRA=11'];
      ff([...chain, '-t', len, '-ar', '48000', '-ac', '2', mix]);
      fs.mkdirSync(OUT + '/video', { recursive: true }); fs.mkdirSync(OUT + '/audio', { recursive: true });
      ff(['-ss', start.toFixed(2), '-i', vid, '-i', mix, '-t', len, '-map', '0:v', '-map', '1:a', '-r', '30', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-movflags', '+faststart', OUT + `/video/${id}.mp4`]);
      ff(['-i', mix, '-c:a', 'libmp3lame', '-b:a', '128k', '-ar', '48000', OUT + `/audio/${id}.mp3`]);
      console.log(id, voice ? 'with narration' : 'music only', 'start', start.toFixed(2), 'end', end);
    }
  } finally { await b.close(); srv.kill(); fs.rmSync(TMP, { recursive: true, force: true }); }
  console.log('now run: python3 scripts/video/gen_stories.py  (marks mp4/audio in stories-data.js)');
})();
