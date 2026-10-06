#!/usr/bin/env python3
"""Freeze numbered /t/NN snapshots and build a newest-first three-column index."""
import argparse,hashlib,html,json,shutil,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];LAB=ROOT/'t'
def hashes(folder):return {p.relative_to(folder).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(folder.rglob('*')) if p.is_file()}
def read():
 rows=json.loads((LAB/'tests.json').read_text())
 if [row['id'] for row in rows]!=list(range(1,len(rows)+1)):raise ValueError('Nonconsecutive test IDs')
 for row in rows:
  if row['folder']!=f"{row['id']:02d}":raise ValueError('Use zero-padded folder numbers')
  if hashes(LAB/row['folder'])!=row['files']:raise ValueError('Frozen test changed: '+row['folder'])
 return rows
def render(rows):
 p=LAB/'index.html';s=p.read_text();start=s.index('<nav class="test-grid"');end=s.index('</nav>',start)+len('</nav>')
 links=''.join('<a class="test-button" href="'+row['folder']+'/"><span class="test-number">'+row['folder'].translate(str.maketrans('0123456789','۰۱۲۳۴۵۶۷۸۹'))+'</span><strong>'+html.escape(row['title'])+'</strong><small>'+html.escape(row['direction'])+'</small></a>' for row in reversed(rows))
 s=s[:start]+'<nav class="test-grid" aria-label="تست‌های رسیدیم">'+links+'</nav>'+s[end:]
 p.write_text(s);(LAB/'index.htm').write_text(s)
def main():
 a=argparse.ArgumentParser(description=__doc__);a.add_argument('--source',type=Path);a.add_argument('--title');a.add_argument('--direction');a.add_argument('--check',action='store_true');args=a.parse_args();rows=read()
 if args.check:print(f'PASS: {len(rows)} immutable numbered tests');return
 if args.source:
  source=args.source.resolve()
  if source==LAB or source.is_relative_to(LAB) or LAB.is_relative_to(source):a.error('Source must be outside /t and cannot contain it')
  if not (source/'index.html').is_file() or not args.title or not args.direction:a.error('Need a complete index.html, title and direction')
  if any(p.is_symlink() or p.name.startswith('.') or p.suffix.lower() in {'.php','.sqlite','.env'} for p in source.rglob('*')):a.error('Only public static snapshots without symlinks are allowed')
  n=len(rows)+1;folder=f'{n:02d}';target=LAB/folder
  if target.exists():raise ValueError('Never overwrite an existing test folder')
  with tempfile.TemporaryDirectory(dir=LAB,prefix='.new-') as tmp:
   stage=Path(tmp)/'snapshot';shutil.copytree(source,stage);stage.rename(target)
  rows.append({'id':n,'folder':folder,'title':args.title,'direction':args.direction,'files':hashes(target)})
  (LAB/'tests.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
 render(rows);print('Generated /t index with newest test first')
if __name__=='__main__':main()
