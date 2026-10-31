"""First-draft notification sounds for Residim, synthesised from scratch (no samples, no licences).
Warm, short, family-friendly: soft bells and marimba, a cartoon horn, no sirens.
Run: python3 scripts/mksounds.py landing/assets/snd   (needs numpy, scipy, ffmpeg with libmp3lame)
Each file: mono 44.1 kHz, ~112 kbps MP3, < 30 KB, 5 ms fade-in, no silent head/tail."""
import os, subprocess, sys, tempfile
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt, fftconvolve

SR = 44100
rng = np.random.default_rng(7)

def t(d): return np.arange(int(SR * d)) / SR
def env(n, a=0.004, d=0.4):
    x = np.arange(n) / SR; e = np.exp(-x / d); k = max(1, int(SR * a)); e[:k] *= np.linspace(0, 1, k); return e
def rel(x, frac=.35):
    """smooth release so no note is ever cut while still ringing (no clicks)"""
    n = len(x); k = max(1, int(n * frac)); x = x.copy(); x[-k:] *= (np.cos(np.linspace(0, np.pi, k)) + 1) / 2; return x
def place(buf, sig, at):
    i = int(SR * at); j = min(len(buf), i + len(sig)); buf[i:j] += sig[: j - i]
def bell(f, d=1.2, bright=1.0):
    """struck bell / glockenspiel: slightly inharmonic partials with their own decays"""
    tt = t(d); out = np.zeros_like(tt)
    for ratio, amp, dec in [(1, 1, .9), (2.0, .45 * bright, .5), (2.76, .28 * bright, .35), (4.07, .14 * bright, .2), (5.4, .07 * bright, .12)]:
        out += amp * np.sin(2 * np.pi * f * ratio * tt + rng.uniform(0, 6.28)) * np.exp(-tt / (dec * d))
    return rel(out * env(len(tt), .003, d))
def marimba(f, d=.6):
    tt = t(d); out = np.sin(2 * np.pi * f * tt) * np.exp(-tt / .28) + .35 * np.sin(2 * np.pi * f * 4 * tt) * np.exp(-tt / .05) + .12 * np.sin(2 * np.pi * f * 10 * tt) * np.exp(-tt / .015)
    return rel(out * env(len(tt), .002, d))
def bp(x, lo, hi, order=4): return sosfilt(butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x)
def lp(x, f, order=4): return sosfilt(butter(order, f, btype='low', fs=SR, output='sos'), x)
def hp(x, f, order=2): return sosfilt(butter(order, f, btype='high', fs=SR, output='sos'), x)
def room(x, wet=.16, size=.55):
    n = int(SR * size); ir = rng.standard_normal(n) * np.exp(-np.arange(n) / (SR * size / 5)); ir = lp(ir, 6000); ir /= np.abs(ir).sum() / 4
    y = fftconvolve(x, ir); dry = np.pad(x, (0, len(y) - len(x)))
    return (1 - wet) * dry + wet * y
def horn(f, d=.16):
    """friendly cartoon horn: two detuned pulse waves through a soft low-pass, quick wobble"""
    tt = t(d); ph = 2 * np.pi * f * tt * (1 + .012 * np.sin(2 * np.pi * 9 * tt))
    sq = np.tanh(3 * np.sin(ph)) + .6 * np.tanh(3 * np.sin(ph * 1.5)); x = lp(sq, 2200)
    e = np.ones_like(tt); k = int(SR * .01); e[:k] = np.linspace(0, 1, k); e[-int(SR * .03):] *= np.linspace(1, 0, int(SR * .03))
    return x * e
def master(x, rms_db=-16.0, peak_db=-1.0, tail=.08):
    x = hp(x, 70)
    nz = np.nonzero(np.abs(x) > 1e-4)[0]; x = x[nz[0]: nz[-1] + 1] if len(nz) else x
    r = np.sqrt(np.mean(x ** 2)) + 1e-12; x = x * (10 ** (rms_db / 20) / r)
    pk = 10 ** (peak_db / 20); x = np.tanh(x / pk) * pk                         # soft limiter
    k = int(SR * .005); x[:k] *= np.linspace(0, 1, k); m = int(SR * tail); x[-m:] *= np.linspace(1, 0, m) ** 2
    return x

S = {}
# 1) door — «سرویس دم در است»: bright two-note chime + a small cartoon beep-beep
b = np.zeros(int(SR * 1.5)); place(b, bell(784, 1.1), 0); place(b, bell(1047, 1.2), .17)
place(b, .32 * horn(523, .11), .62); place(b, .32 * horn(523, .15), .78)
S['door'] = master(room(b, .14), -12)
# 2) arrived — «رسید»: warm major arpeggio, the reassuring brand sound
b = np.zeros(int(SR * 1.3))
for i, f in enumerate([523.25, 659.25, 783.99, 1046.5]): place(b, (.9 if i < 3 else .75) * bell(f, 1.0, .7), i * .075)
place(b, .25 * bell(1568, .8, .4), .3)
S['arrived'] = master(room(b, .2), -15)
# 3) urgent — پیام فوری: three rising pulses, attention without fear
b = np.zeros(int(SR * 1.1))
for i, f in enumerate([880, 1108.7, 1318.5]):
    place(b, marimba(f, .32), i * .14); place(b, .5 * bell(f, .35, .5), i * .14)
place(b, .5 * bell(1760, .5, .6), .42)
S['urgent'] = master(room(b, .1), -11)
# 4) boarded — «سوار شد»: soft pop + sparkle
tt = t(.09); pop = np.sin(2 * np.pi * np.cumsum(np.linspace(520, 1250, len(tt))) / SR) * env(len(tt), .002, .035); pop = rel(pop, .5)
b = np.zeros(int(SR * .45)); place(b, pop, 0); place(b, .22 * bell(2637, .35, .3), .05)
S['boarded'] = master(room(b, .12), -17)
# 5) start — «راه افتادیم»: key click + soft engine purr that revs up
d = .95; tt = t(d); f0 = 38 + 30 * (1 - np.exp(-tt / .35)); ph = 2 * np.pi * np.cumsum(f0) / SR
eng = sum(a * np.sin(k * ph) for k, a in [(1, 1), (2, .55), (3, .35), (4, .2), (6, .1)]) * (1 + .25 * np.sin(2 * np.pi * 7 * tt))
eng = lp(eng + .05 * rng.standard_normal(len(tt)), 900) * np.minimum(1, tt / .12) * np.exp(-np.maximum(0, tt - .55) / .18)
click = bp(rng.standard_normal(int(SR * .02)), 1500, 5000) * env(int(SR * .02), .0005, .006)
b = np.zeros(int(SR * 1.0)); place(b, .6 * click, 0); place(b, .7 * eng, .03)
S['start'] = master(b, -16)
# 6) done — «خدا قوت»: little victory jingle
b = np.zeros(int(SR * 1.4))
for i, f in enumerate([523.25, 659.25, 783.99]): place(b, marimba(f, .4), i * .1)
for f in [1046.5, 1318.5, 1568]: place(b, .45 * bell(f, 1.0, .6), .32)
S['done'] = master(room(b, .18), -15)
# 7) invite — پیشنهاد هم‌مسیری: two polite knocks on a wooden door
def knock():
    n = int(SR * .12); x = bp(rng.standard_normal(n), 180, 1400) * env(n, .001, .018); tt = t(.12)
    return rel(x + .8 * np.sin(2 * np.pi * 165 * tt) * env(n, .001, .03), .5)
b = np.zeros(int(SR * .55)); place(b, knock(), 0); place(b, .85 * knock(), .17)
S['invite'] = master(room(b, .2, .35), -15)
# 8) team — تیم شکل گرفت: shaker rhythm + bells
b = np.zeros(int(SR * 1.3))
for i, at in enumerate([0, .12, .24, .3, .36]):
    n = int(SR * .07); place(b, (.5 if i % 2 else .35) * bp(rng.standard_normal(n), 5000, 12000) * env(n, .004, .025), at)
for i, f in enumerate([1568, 2093]): place(b, .6 * bell(f, .9, .6), .36 + i * .1)
place(b, .5 * marimba(784, .5), .36)
S['team'] = master(room(b, .18), -16)
# 9) remind — «فردا نوبت شماست» (evening): one calm bell, nobody jumps
b = np.zeros(int(SR * 1.0)); place(b, bell(659.25, 1.0, .45), 0); place(b, .3 * bell(988, .8, .3), .12)
S['remind'] = master(room(b, .22), -19)
# 10) msg — پیام گفتگو: tiny bubble
tt = t(.1); bub = rel(np.sin(2 * np.pi * np.cumsum(np.linspace(480, 980, len(tt))) / SR) * env(len(tt), .002, .03), .5)
b = np.zeros(int(SR * .25)); place(b, bub, 0)
S['msg'] = master(room(b, .08, .2), -19)

out = sys.argv[1] if len(sys.argv) > 1 else 'snd'; os.makedirs(out, exist_ok=True)
for k, x in S.items():
    with tempfile.NamedTemporaryFile(suffix='.wav') as w:
        wavfile.write(w.name, SR, (x * 32767).astype(np.int16))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', w.name, '-ac', '1', '-ar', '44100', '-codec:a', 'libmp3lame', '-b:a', '112k', '-map_metadata', '-1', os.path.join(out, k + '.mp3')], check=True)
    print(k, round(len(x) / SR, 2), 's', os.path.getsize(os.path.join(out, k + '.mp3')), 'bytes')
