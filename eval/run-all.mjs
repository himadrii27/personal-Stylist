// One-command evaluation that leaves nothing large on disk: downloads the VITON-HD sample and
// the HD/parser models into a temp folder, runs every measurement, then deletes the folder.
//
// Usage (from the repo root, after `npm install --prefix eval`):
//   npm run eval --prefix eval                       full run → eval/results/
//   npm run eval --prefix eval -- --limit 20         quick check (~100 images, u2netp only; results stay in the temp folder)
//   npm run eval --prefix eval -- --keep             keep the temp folder for repeated runs (path is printed)
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i === -1 ? null : args[i + 1] ?? ''; };
const keep = args.includes('--keep');
const limit = flag('--limit');
const quick = limit !== null;

// same pinned files the app fetches (src/wardrobe/segment/segmentWorker.js)
const MODELS = {
  'u2net.onnx': 'https://huggingface.co/BritishWerewolf/U-2-Net/resolve/main/onnx/model.onnx',
  'segformer_b2_clothes_q.onnx': 'https://huggingface.co/Xenova/segformer_b2_clothes/resolve/main/onnx/model_quantized.onnx',
};

const work = await mkdtemp(path.join(os.tmpdir(), 'stylist-eval-'));
const env = { ...process.env, EVAL_DIR: work, ...(quick ? { EVAL_RESULTS: path.join(work, 'results') } : {}) };
const run = (cmd, cmdArgs) => {
  console.log(`\n$ ${cmd} ${cmdArgs.join(' ')}`);
  const r = spawnSync(cmd, cmdArgs, { stdio: 'inherit', env });
  if (r.status !== 0) throw new Error(`${cmd} ${cmdArgs.join(' ')} failed (exit ${r.status})`);
};

try {
  console.log(`working in ${work}`);
  run('python3', ['eval/download-viton.py', quick ? String(limit || 20) : '520', '42']);

  if (!quick) {
    await mkdir(path.join(work, 'models'), { recursive: true });
    for (const [file, url] of Object.entries(MODELS)) {
      console.log(`downloading ${file}…`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
      await pipeline(Readable.fromWeb(res.body), createWriteStream(path.join(work, 'models', file)));
    }
  }

  run('node', ['eval/run.mjs', 'u2netp', 'viton']);
  if (!quick) {
    run('node', ['eval/run.mjs', 'u2net', 'viton']);
    run('node', ['eval/person-false-alarms.mjs', 'viton']);
  }
} finally {
  if (keep) console.log(`\nkept ${work} (delete it when done)`);
  else { await rm(work, { recursive: true, force: true }); console.log(`\nremoved ${work}`); }
}
