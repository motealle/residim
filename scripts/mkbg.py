"""Seamless aerial 'city' tile for the animated background (chat + empty desktop areas).
Not a real place: a jittered periodic street lattice, blocks with building footprints, parks,
a winding river, one diagonal avenue (SE↔NW, the pan direction) and a curved boulevard.
Everything is periodic in W×H, so tiling and a W,H translate loop are seamless."""
import math, random, sys
out = sys.argv[1]
W = H = 960; N = 12; S = W / N
P = {
  'light': dict(bg='#F2F4F0', blk='#EAEDE7', bld='#E1E5DE', bld2='#DCE1D9', park='#E2EDDF', tree='#D3E4CF', water='#DCE7EC', wedge='#D1DFE6',
                road='#FBFCFA', case='#E3E7E1', major='#FFFFFF', mcase='#DADFD8', plaza='#EEF1EB'),
  'dark':  dict(bg='#0C110E', blk='#101712', bld='#141C17', bld2='#17201A', park='#0F1C14', tree='#13241A', water='#0E1820', wedge='#122029',
                road='#18211B', case='#0A0F0C', major='#1C261F', mcase='#0A0F0C', plaza='#121914'),
}
R = random.Random(7)
J = [[(R.uniform(-.17, .17) * S, R.uniform(-.17, .17) * S) for j in range(N)] for i in range(N)]
def pt(i, j):  # periodic jittered lattice point (may lie outside the tile; copies cover the wrap)
    dx, dy = J[i % N][j % N]
    return (i * S + dx, j * S + dy)
kind = {}
for i in range(N):
    for j in range(N):
        r = R.random(); kind[i, j] = 'park' if r < .12 else 'plaza' if r < .16 else 'city'
def f(v): return f'{v:.1f}'.rstrip('0').rstrip('.')
def shrink(poly, k):
    cx = sum(p[0] for p in poly) / len(poly); cy = sum(p[1] for p in poly) / len(poly)
    return [(cx + (x - cx) * k, cy + (y - cy) * k) for x, y in poly], (cx, cy)
def path(poly): return 'M' + 'L'.join(f'{f(x)} {f(y)}' for x, y in poly) + 'Z'
def build(c):
    g = []
    for i in range(N):
        for j in range(N):
            poly = [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)]
            blk, (cx, cy) = shrink(poly, .86)
            k = kind[i, j]
            g.append(f'<path d="{path(blk)}" fill="{c[k if k != "city" else "blk"]}"/>')
            if k == 'park':
                for _ in range(9):
                    x, y = cx + R.uniform(-.28, .28) * S, cy + R.uniform(-.28, .28) * S
                    g.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(R.uniform(3, 6.5))}" fill="{c["tree"]}"/>')
            elif k == 'city':
                inner, _ = shrink(poly, .7)
                a = math.degrees(math.atan2(inner[1][1] - inner[0][1], inner[1][0] - inner[0][0]))
                for q in range(R.randint(3, 5)):
                    x, y = cx + R.uniform(-.24, .24) * S, cy + R.uniform(-.24, .24) * S
                    w, h = R.uniform(.12, .26) * S, R.uniform(.1, .2) * S
                    g.append(f'<rect x="{f(-w / 2)}" y="{f(-h / 2)}" width="{f(w)}" height="{f(h)}" rx="1.5" fill="{c["bld2" if q % 3 == 0 else "bld"]}" transform="translate({f(x)} {f(y)}) rotate({f(a)})"/>')
    # river: x = W*.3 + 46 sin(2πy/H) (+ a softer harmonic), periodic in y
    riv = [(W * .3 + 70 * math.sin(2 * math.pi * y / H) + 26 * math.sin(6 * math.pi * y / H + 1), y) for y in range(-10, H + 11, 10)]
    rp = 'M' + 'L'.join(f'{f(x)} {f(y)}' for x, y in riv)
    g.append(f'<path d="{rp}" fill="none" stroke="{c["wedge"]}" stroke-width="30"/><path d="{rp}" fill="none" stroke="{c["water"]}" stroke-width="25"/>')
    # minor streets
    st = []
    for i in range(N):
        for j in range(N):
            a = pt(i, j)
            for b in (pt(i + 1, j), pt(i, j + 1)):
                st.append(f'M{f(a[0])} {f(a[1])}L{f(b[0])} {f(b[1])}')
    d = ''.join(st)
    g.append(f'<path d="{d}" fill="none" stroke="{c["case"]}" stroke-width="7.5" stroke-linecap="round"/><path d="{d}" fill="none" stroke="{c["road"]}" stroke-width="5.5" stroke-linecap="round"/>')
    # boulevard: y = H*.62 + 34 sin(2πx/W), periodic in x; diagonal avenue (0,0)→(W,H)
    bl = 'M' + 'L'.join(f'{f(x)} {f(H * .62 + 48 * math.sin(2 * math.pi * x / W) + 18 * math.sin(4 * math.pi * x / W + 2))}' for x in range(-10, W + 11, 10))
    av = f'M-20 -20L{W + 20} {H + 20}'
    for p_ in (bl, av):
        g.append(f'<path d="{p_}" fill="none" stroke="{c["mcase"]}" stroke-width="14"/><path d="{p_}" fill="none" stroke="{c["major"]}" stroke-width="11"/>')
    # roundabouts at two crossings
    for (i, j) in ((3, 3), (8, 6), (10, 10)):
        x, y = pt(i, j)
        g.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="11" fill="{c["major"]}" stroke="{c["mcase"]}" stroke-width="2"/><circle cx="{f(x)}" cy="{f(y)}" r="5" fill="{c["park"]}"/>')
    return ''.join(g)
for name, c in P.items():
    R.seed(11)
    body = build(c)
    uses = ''.join(f'<use href="#t" x="{dx}" y="{dy}"/>' for dx in (-W, 0, W) for dy in (-H, 0, H) if (dx, dy) != (0, 0))
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><rect width="{W}" height="{H}" fill="{c["bg"]}"/><g id="t">{body}</g>{uses}</svg>'
    fn = f'{out}/mapbg{"-dark" if name == "dark" else ""}.svg'
    open(fn, 'w').write(svg); print(fn, len(svg))
