// How often does the person detector fire on garment-only photos (which should stay in flat-lay mode)?
// node eval/person-false-alarms.mjs [set=viton]
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import ort from 'onnxruntime-node';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';
import { PARSE_SIZE, preprocessParse, parseGarments } from '../src/wardrobe/segment/pipeline.js';

const WORK = process.env.EVAL_DIR || 'eval';
const DATA = path.resolve(WORK, 'data', process.argv[2] || 'viton', 'cloth');
const seg = await ort.InferenceSession.create(`${WORK}/models/segformer_b2_clothes_q.onnx`);
const files = (await readdir(DATA)).sort();
let alarms = 0; const hits = [];
for (const f of files) {
  const b = await readFile(path.join(DATA, f));
  const img = b[0] === 0x89 ? PNG.sync.read(b) : jpeg.decode(b, { useTArray: true, formatAsRGBA: true });
  const logits = (await seg.run({ pixel_values: new ort.Tensor('float32', preprocessParse(img.data, img.width, img.height), [1, 3, PARSE_SIZE, PARSE_SIZE]) })).logits.data;
  const r = parseGarments(logits, new Uint8Array(img.width * img.height).fill(255), img.width, img.height);
  if (r.person) { alarms++; hits.push(`${f} (${(r.personShare * 100).toFixed(1)}%)`); }
}
console.log(`person mode triggered on ${alarms} / ${files.length} garment-only photos (${(alarms / files.length * 100).toFixed(1)}%)`);
if (hits.length) console.log('triggered on:', hits.slice(0, 15).join(', '));
