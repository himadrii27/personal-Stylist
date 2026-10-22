"""Download a reproducible sample of garment photos + ground-truth cloth masks from the
VITON-HD test split (Hugging Face mirror SaffalPoosh/VITON-HD-test, 2,032 garments in two
parquet shards) into eval/data/viton/{cloth,mask}/.

Only the `cloth` and `cloth_mask` columns of a seeded random set of row groups are fetched
(HTTP range requests), so a ~550-garment sample costs ~80 MB instead of the 730 MB dataset.
Measurement only — never shipped (eval/data is gitignored).

Usage: python3 eval/download-viton.py [min_count=520] [seed=42]
"""
import json, os, random, sys
from pathlib import Path
import fsspec
import pyarrow.parquet as pq

DATASET = 'SaffalPoosh/VITON-HD-test'
SHARD = 'data/train-00000-of-00002-d373a9018965c120.parquet'
URL = f'https://huggingface.co/datasets/{DATASET}/resolve/main/{SHARD}'
OUT = Path(os.environ.get('EVAL_DIR', 'eval'), 'data', 'viton')
min_count = int(sys.argv[1]) if len(sys.argv) > 1 else 520
seed = int(sys.argv[2]) if len(sys.argv) > 2 else 42

pf = pq.ParquetFile(fsspec.filesystem('http').open(URL, block_size=4 * 2**20))
groups = list(range(pf.metadata.num_row_groups))
random.Random(seed).shuffle(groups)
chosen, total = [], 0
for g in groups:
    chosen.append(g); total += pf.metadata.row_group(g).num_rows
    if total >= min_count: break
chosen.sort()

for sub in ('cloth', 'mask'):
    d = OUT / sub; d.mkdir(parents=True, exist_ok=True)
    for f in d.iterdir(): f.unlink()

rows = []
offsets = {}
acc = 0
for g in range(pf.metadata.num_row_groups):
    offsets[g] = acc; acc += pf.metadata.row_group(g).num_rows
for g in chosen:
    t = pf.read_row_group(g, columns=['cloth', 'cloth_mask'])
    for j in range(t.num_rows):
        i = offsets[g] + j
        for col, sub in (('cloth', 'cloth'), ('cloth_mask', 'mask')):
            data = t.column(col)[j].as_py()['bytes']
            ext = 'png' if data[:4] == b'\x89PNG' else 'jpg'
            (OUT / sub / f'{i:04d}.{ext}').write_bytes(data)
        rows.append(i)
    print(f'row group {g}: {len(rows)} garments so far', flush=True)

(OUT / 'sample.json').write_text(json.dumps({
    'dataset': DATASET, 'shard': SHARD, 'split': 'VITON-HD test', 'seed': seed,
    'row_groups': chosen, 'count': len(rows), 'rows': rows}, indent=1))
print(f'done: {len(rows)} garment/mask pairs in {OUT}')
