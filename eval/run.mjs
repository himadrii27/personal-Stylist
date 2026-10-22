// Segmentation accuracy harness.
// Runs the SAME pipeline the website uses (src/wardrobe/segment/pipeline.js) through
// onnxruntime-node over every garment in eval/data/<set>/cloth, compares the alpha mask
// with eval/data/<set>/mask, and writes eval/results/<model>-<set>-<date>.{json,md}.
//
// Usage: node eval/run.mjs [model=u2netp] [set=viton] [--no-cleanup]
//   model: u2netp → public/models/u2netp.onnx,  u2net → eval/models/u2net.onnx
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import ort from 'onnxruntime-node';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';
import { INPUT_SIZE, preprocess, postprocess, scoreMasks } from '../src/wardrobe/segment/pipeline.js';

const model = process.argv[2] || 'u2netp';
const set = process.argv[3] || 'viton';
const cleanup = !process.argv.includes('--no-cleanup');
// EVAL_DIR: where data/ and models/ live (run-all.mjs points it at a temp folder)
const WORK = process.env.EVAL_DIR || 'eval';
const MODEL_PATHS = { u2netp: 'public/models/u2netp.onnx', u2net: path.join(WORK, 'models/u2net.onnx') };
const DATA = path.resolve(WORK, 'data', set);

function decode(buf) {
  if (buf[0] === 0x89) { const p = PNG.sync.read(buf); return { data: p.data, width: p.width, height: p.height }; }
  const j = jpeg.decode(buf, { useTArray: true, formatAsRGBA: true, maxMemoryUsageInMB: 1024 });
  return { data: j.data, width: j.width, height: j.height };
}
const toGray = ({ data, width, height }) => {
  const g = new Uint8Array(width * height);
  for (let i = 0; i < g.length; i++) g[i] = Math.round((data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3);
  return g;
};
const stats = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  const q = (p) => s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))];
  return { mean: s.reduce((a, b) => a + b, 0) / s.length, median: q(0.5), p10: q(0.1), min: s[0] };
};

const session = await ort.InferenceSession.create(MODEL_PATHS[model]);
const inputName = session.inputNames[0], outputName = session.outputNames[0];
const files = (await readdir(path.join(DATA, 'cloth'))).filter(f => /\.(jpe?g|png)$/i.test(f)).sort();
const maskFiles = new Map((await readdir(path.join(DATA, 'mask'))).map(f => [path.parse(f).name, f]));
console.log(`${model} on ${files.length} images from ${set} (cleanup ${cleanup ? 'on' : 'off'})`);

const per = [];
const t0 = Date.now();
for (const [k, f] of files.entries()) {
  const img = decode(await readFile(path.join(DATA, 'cloth', f)));
  const gtImg = decode(await readFile(path.join(DATA, 'mask', maskFiles.get(path.parse(f).name))));
  const t = Date.now();
  const tensor = new ort.Tensor('float32', preprocess(img.data, img.width, img.height), [1, 3, INPUT_SIZE, INPUT_SIZE]);
  const out = await session.run({ [inputName]: tensor });
  const alpha = postprocess(out[outputName].data, img.width, img.height, { cleanup });
  const ms = Date.now() - t;
  const gt = toGray(gtImg);
  if (gt.length !== alpha.length) throw new Error(`size mismatch on ${f}`);
  per.push({ file: f, ms, ...scoreMasks(alpha, gt) });
  if ((k + 1) % 50 === 0) console.log(`${k + 1}/${files.length}  running mean IoU ${(per.reduce((a, b) => a + b.iou, 0) / per.length).toFixed(4)}`);
}

const metrics = ['iou', 'pixelAcc', 'f1', 'precision', 'recall', 'ms'];
const summary = Object.fromEntries(metrics.map(m => [m, stats(per.map(p => p[m]))]));
const worst = [...per].sort((a, b) => a.iou - b.iou).slice(0, 10).map(p => ({ file: p.file, iou: +p.iou.toFixed(4) }));
const sample = JSON.parse(await readFile(path.join(DATA, 'sample.json'), 'utf8').catch(() => '{}'));
const date = new Date().toISOString().slice(0, 10);
const result = { model, set, cleanup, images: per.length, date, threshold: 0.5, sample, summary, worst, totalSeconds: (Date.now() - t0) / 1000, perImage: per };

const RESULTS = process.env.EVAL_RESULTS || 'eval/results';
await mkdir(RESULTS, { recursive: true });
const base = `${RESULTS}/${model}-${set}${cleanup ? '' : '-raw'}-${date}`;
await writeFile(`${base}.json`, JSON.stringify(result, null, 1));
const pct = (v) => (v * 100).toFixed(2) + '%';
const md = `# ${model} on ${per.length} garments (${set})

Date: ${date} · threshold 0.5 · post-processing ${cleanup ? 'on' : 'off'} · dataset: ${sample.dataset || set} (seed ${sample.seed ?? '-'})

| Metric | Mean | Median | 10th pct | Min |
|---|---|---|---|---|
${['iou', 'pixelAcc', 'f1', 'precision', 'recall'].map(m => `| ${m} | ${pct(summary[m].mean)} | ${pct(summary[m].median)} | ${pct(summary[m].p10)} | ${pct(summary[m].min)} |`).join('\n')}
| time / image | ${summary.ms.mean.toFixed(0)} ms | ${summary.ms.median.toFixed(0)} ms | | |

Lowest IoU: ${worst.map(w => `${w.file} (${pct(w.iou)})`).join(', ')}
`;
await writeFile(`${base}.md`, md);
console.log('\n' + md);
