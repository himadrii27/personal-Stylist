// Renders the lowest-IoU images of an eval run as side-by-side strips:
//   photo | ground-truth mask | predicted mask
// into eval/results/failures/<run>/ so failures can be inspected by eye.
// Usage: node eval/inspect.mjs eval/results/<run>.json [count=8]
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import ort from 'onnxruntime-node';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';
import { INPUT_SIZE, preprocess, postprocess } from '../src/wardrobe/segment/pipeline.js';

const runFile = process.argv[2];
const count = Number(process.argv[3] || 8);
const run = JSON.parse(await readFile(runFile, 'utf8'));
// EVAL_DIR: where data/ and models/ live (run-all.mjs points it at a temp folder)
const WORK = process.env.EVAL_DIR || 'eval';
const MODEL_PATHS = { u2netp: 'public/models/u2netp.onnx', u2net: path.join(WORK, 'models/u2net.onnx') };
const DATA = path.resolve(WORK, 'data', run.set);
const outDir = path.join('eval/results/failures', path.basename(runFile, '.json'));
await mkdir(outDir, { recursive: true });

const decode = (b) => (b[0] === 0x89 ? PNG.sync.read(b) : jpeg.decode(b, { useTArray: true, formatAsRGBA: true, maxMemoryUsageInMB: 1024 }));
const masks = new Map((await readdir(path.join(DATA, 'mask'))).map(f => [path.parse(f).name, f]));
const session = await ort.InferenceSession.create(MODEL_PATHS[run.model]);

for (const { file, iou } of [...run.perImage].sort((a, b) => a.iou - b.iou).slice(0, count)) {
  const img = decode(await readFile(path.join(DATA, 'cloth', file)));
  const gt = decode(await readFile(path.join(DATA, 'mask', masks.get(path.parse(file).name))));
  const out = await session.run({ [session.inputNames[0]]: new ort.Tensor('float32', preprocess(img.data, img.width, img.height), [1, 3, INPUT_SIZE, INPUT_SIZE]) });
  const alpha = postprocess(out[session.outputNames[0]].data, img.width, img.height, { cleanup: run.cleanup });
  const W = img.width, H = img.height, strip = new PNG({ width: W * 3, height: H });
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, row = y * W * 3;
    for (let c = 0; c < 4; c++) strip.data[(row + x) * 4 + c] = img.data[i * 4 + c];
    for (let c = 0; c < 3; c++) {
      strip.data[(row + W + x) * 4 + c] = gt.data[i * 4];
      strip.data[(row + 2 * W + x) * 4 + c] = alpha[i];
    }
    strip.data[(row + W + x) * 4 + 3] = 255; strip.data[(row + 2 * W + x) * 4 + 3] = 255;
  }
  const name = `${(iou * 100).toFixed(1).padStart(5, '0')}-${path.parse(file).name}.png`;
  await writeFile(path.join(outDir, name), PNG.sync.write(strip));
  console.log(name);
}
console.log(`wrote ${count} strips to ${outDir}`);
