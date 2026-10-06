#!/usr/bin/env python3
"""Append a completed design snapshot; regenerate the newest-first static index."""
import argparse, hashlib, html, json, shutil, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
LAB=ROOT/'test'
def read_registry():
 records=json.loads((LAB/'tests.json').read_text())
 ids=[r['id'] for r in records]
 if ids != list(range(1,len(ids)+1)): raise ValueError('IDs must be consecutive, starting at 1')
 return records
def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def verify(records):
 for r in records:
  folder=LAB/str(r['id'])
  if digest(folder/'index.html')!=r['sha256']:raise ValueError(f"Frozen test {r['id']} changed; append a new test instead")
  if 'files' in r:
   current={p.relative_to(folder).as_posix():digest(p) for p in sorted(folder.rglob('*')) if p.is_file()}
   if current!=r['files']:raise ValueError(f"Frozen test {r['id']} assets changed")
 locks=json.loads((LAB/'assets/v1/hashes.json').read_text())
 actual={p.name:digest(p) for p in (LAB/'assets/v1').iterdir() if p.is_file() and p.name!='hashes.json'}
 if locks!=actual:raise ValueError('Frozen v1 assets changed; create assets/v2 instead')
def render(records):
 cards='\n'.join(f'<a class="test-link" href="{r["id"]}/"><span class="num">{str(r["id"]).translate(str.maketrans("0123456789","۰۱۲۳۴۵۶۷۸۹"))}</span><strong>{html.escape(r["title"])}</strong><small>{html.escape(r["direction"])}</small></a>' for r in reversed(records))
 content='''<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#101524"><meta name="description" content="طرح‌های شماره‌دار رسیدیم؛ تازه‌ترین تست در ابتدای فهرست"><title>آزمایشگاه طراحی | رسیدیم</title><link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="assets/v1/icon.svg"><link rel="stylesheet" href="assets/v1/base.css"><style>.lead{padding:64px 0 36px;max-width:800px}.lead h1{font-size:clamp(2.3rem,5vw,4rem)}.test-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.test-link{min-height:160px;padding:24px 18px;background:var(--surface);border:1px solid var(--line);border-radius:20px;display:flex;flex-direction:column;gap:6px;overflow-wrap:anywhere}.test-link:hover{border-color:var(--accent)}.num{font-size:2.1rem;color:var(--accent);line-height:1.3}.test-link small{color:var(--muted)}.preference{margin-top:30px}.test-link strong{font-size:1.15rem}@media(max-width:520px){.test-grid{gap:8px}.test-link{padding:16px 9px;min-height:155px}.test-link strong{font-size:.9rem}.test-link small{font-size:.72rem}.num{font-size:1.7rem}.lead{padding-top:38px}}</style></head><body><div class="wrap"><header class="labbar"><span class="brand">رسیدیم / آزمایشگاه</span><div class="controls"><label for="appearance">ظاهر</label><select id="appearance" data-appearance><option value="dark">تیره</option><option value="light">روشن</option><option value="soft">نرم</option></select></div></header><main><section class="lead"><h1>رسیدیم،<br>از نگاه‌های تازه.</h1><p>هر شماره، یک تجربه متفاوت. طرح‌ها را ببینید و آنی را که بیشتر دوست دارید انتخاب کنید.</p><p>تازه‌ترین تست، بالای فهرست است.</p></section><nav class="test-grid" aria-label="تست‌های طراحی">CARDS</nav><p class="preference" data-preferred aria-live="polite"></p><p class="status" data-status role="status"></p></main><footer class="footer"><span>هر تست یک طرح مستقل است.</span><a href="../app/">ورود به اپ رسیدیم</a></footer></div><script src="assets/v1/lab.js"></script></body></html>'''.replace('CARDS',cards)
 (LAB/'index.html').write_text(content,encoding='utf-8')
def main():
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--source',type=Path,help='Completed snapshot directory containing index.html')
 parser.add_argument('--title');parser.add_argument('--direction');parser.add_argument('--check',action='store_true')
 args=parser.parse_args();records=read_registry();verify(records)
 if args.check:print(f'PASS: {len(records)} frozen snapshots and v1 assets');return
 if args.source:
  source=args.source.resolve()
  if source == LAB or source.is_relative_to(LAB) or LAB.is_relative_to(source):parser.error('Source must be outside the lab and cannot contain it')
  if not (source/'index.html').is_file() or not args.title or not args.direction:parser.error('--source requires index.html, --title and --direction')
  # Reject symlinks and reserved script/server files: visual snapshots are static.
  if any(p.is_symlink() or p.suffix.lower() in {'.php','.sqlite','.env'} or p.name.startswith('.') for p in source.rglob('*')):parser.error('Snapshot must contain only public static files without symlinks')
  number=len(records)+1;destination=LAB/str(number)
  if destination.exists():raise ValueError('Next test folder already exists; never overwrite it')
  with tempfile.TemporaryDirectory(dir=LAB,prefix='.new-test-') as tmp:
   staged=Path(tmp)/'snapshot';shutil.copytree(source,staged);staged.rename(destination)
  records.append({'id':number,'title':args.title,'direction':args.direction,'sha256':digest(destination/'index.html'),'files':{p.relative_to(destination).as_posix():digest(p) for p in sorted(destination.rglob('*')) if p.is_file()}})
  (LAB/'tests.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 render(records);print('Generated test/index.html; newest test first')
if __name__=='__main__':main()
