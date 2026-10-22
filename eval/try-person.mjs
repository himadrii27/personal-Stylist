// Quick visual check of person removal: node eval/try-person.mjs <photo> <outPrefix>
// Writes <outPrefix>-<piece>.png strips (photo | U2-Net alpha | piece alpha) and prints the pieces found.
import { readFile, writeFile } from 'node:fs/promises';
import ort from 'onnxruntime-node';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';
import { INPUT_SIZE, PARSE_SIZE, preprocess, postprocess, preprocessParse, parseGarments } from '../src/wardrobe/segment/pipeline.js';

const [photo, prefix] = process.argv.slice(2);
const buf = await readFile(photo);
const img = buf[0] === 0x89 ? PNG.sync.read(buf) : jpeg.decode(buf, { useTArray: true, formatAsRGBA: true });
const u2 = await ort.InferenceSession.create('public/models/u2netp.onnx');
const WORK = process.env.EVAL_DIR || 'eval';
const seg = await ort.InferenceSession.create(`${WORK}/models/segformer_b2_clothes_q.onnx`);
const t0 = Date.now();
const sal = postprocess((await u2.run({ [u2.inputNames[0]]: new ort.Tensor('float32', preprocess(img.data, img.width, img.height), [1, 3, INPUT_SIZE, INPUT_SIZE]) }))[u2.outputNames[0]].data, img.width, img.height);
const logits = (await seg.run({ pixel_values: new ort.Tensor('float32', preprocessParse(img.data, img.width, img.height), [1, 3, PARSE_SIZE, PARSE_SIZE]) })).logits.data;
const res = parseGarments(logits, sal, img.width, img.height);
console.log(photo, `${Date.now() - t0} ms`, 'person:', res.person, 'personShare', res.personShare.toFixed(3), res.pieces.map(p => `${p.label} ${(p.share * 100).toFixed(1)}%`).join(', '));
const W = img.width, H = img.height;
for (const piece of res.pieces) {
  const s = new PNG({ width: W * 3, height: H });
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, row = y * W * 3;
    for (let c = 0; c < 3; c++) {
      s.data[(row + x) * 4 + c] = img.data[i * 4 + c];
      s.data[(row + W + x) * 4 + c] = sal[i];
      // cut-out over a checker so transparency is visible
      const bg = ((x >> 4) + (y >> 4)) % 2 ? 235 : 250, a = piece.alpha[i] / 255;
      s.data[(row + 2 * W + x) * 4 + c] = Math.round(img.data[i * 4 + c] * a + bg * (1 - a));
    }
    for (const o of [0, W, 2 * W]) s.data[(row + o + x) * 4 + 3] = 255;
  }
  await writeFile(`${prefix}-${piece.label}.png`, PNG.sync.write(s));
}
