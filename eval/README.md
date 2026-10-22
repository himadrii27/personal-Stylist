# Background-removal accuracy

`eval/run.mjs` runs the **same pipeline the website uses** (`src/wardrobe/segment/pipeline.js`:
rembg-style preprocessing → U²-Net → min-max normalise → upscale → keep garment regions /
drop specks → 1px feather) through onnxruntime-node, and scores the alpha mask against
ground-truth garment masks at a 0.5 threshold.

Nothing large is kept on disk: the evaluation has its own packages (not installed with the app)
and downloads data + models into a temp folder that is deleted afterwards.

```bash
npm install --prefix eval                  # onnxruntime-node, jpeg-js, pngjs (~290 MB) — only when evaluating
npm run eval --prefix eval                 # full run: 600 garments, u2netp + u2net + person false alarms → eval/results/
npm run eval --prefix eval -- --limit 20   # quick smoke test (~100 garments, u2netp); results stay in the temp folder
npm run eval --prefix eval -- --keep       # keep the temp folder (path printed) for repeated runs
rm -rf eval/node_modules                   # free the space again
```

Python needs `fsspec` and `pyarrow` (for the parquet range reads). To run a single script by hand,
point `EVAL_DIR` at a kept temp folder, e.g. `EVAL_DIR=/tmp/stylist-eval-xxxx node eval/inspect.mjs eval/results/<run>.json 8`
(photo | ground truth | prediction strips for the worst cases). Without `EVAL_DIR` the scripts use `eval/data` and `eval/models`.

## Results — 600 garments, VITON-HD test split (seed 42), 2026-10-19

| Model | Mean IoU | Median IoU | 10th pct IoU | Mean pixel accuracy | Mean F1 | Time / image (Node, M3 CPU) |
|---|---|---|---|---|---|---|
| u2netp (default, 4.6 MB) | **93.74%** | 95.46% | 88.95% | **97.20%** | 96.50% | ~170 ms |
| u2net (HD, 176 MB) | **94.23%** | 95.65% | 89.77% | **97.41%** | 96.81% | ~540 ms (median) |

Full per-image results: `eval/results/*.json`; summaries: `eval/results/*.md`.

### What this does and doesn't show
- **Dataset:** VITON-HD garment product photos with `cloth-mask` ground truth
  (Hugging Face mirror `SaffalPoosh/VITON-HD-test`). These are clean studio shots on light
  backgrounds — easier than phone photos on a bed or floor. A harder, self-labelled set of real
  phone photos is still to do; expect lower numbers there.
- **Known failure mode:** white or very light garments on a white background — the model keeps
  only the print/logo (IoU near 0 on a handful of images). The app's tips ask for a contrasting
  background for this reason.
- A few ground-truth masks are themselves wrong (e.g. row 0792), which slightly lowers the scores.
- VITON-HD is CC BY-NC 4.0: used here for measurement only; images are not committed or shipped
  (`eval/data/` is gitignored).

Honest one-liner: *"U²-Net background removal running fully in the browser; mean IoU 93.7%
(u2netp) / 94.2% (u2net) and ~97% pixel accuracy on 600 VITON-HD garment images."*

## Removing the person (photos of clothes being worn)

The app also runs a clothing parser (SegFormer-B2 clothes, see `public/models/README.md`).
A photo counts as "worn" when it shows a face **and** arms/legs (≥0.3% of the image each);
then only clothing pixels are kept and each garment becomes a separate piece.

```bash
node eval/person-false-alarms.mjs viton          # garment-only photos wrongly treated as "worn" (part of npm run eval)
node eval/try-person.mjs <photo.jpg> <outPrefix> # writes photo | U2-Net | piece strips (needs EVAL_DIR with models/)
```

- **False "person" triggers on garment-only photos:** 2 / 600 (0.3%) — graphic tees with printed
  people. (A looser "any skin/hair pixels" rule triggered on 3.8%.)
- **Worn photos:** spot-checked on 4 photos (3 VITON-HD models, 1 street photo): person removed,
  garments split correctly into top / bottoms / dress / bag. Not yet a measured accuracy number.
- **Known limits:** same-colour outfits can merge (black top + black jeans → one "dress");
  matching co-ord sets can bleed into each other; a hand over the garment leaves a hole.
