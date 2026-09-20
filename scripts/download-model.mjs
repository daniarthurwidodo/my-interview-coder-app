import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const MODEL_NAME = 'sherpa-onnx-streaming-zipformer-en-2023-06-26';
const MODEL_URL = `https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/${MODEL_NAME}.tar.bz2`;
const MODELS_DIR = path.join(process.cwd(), 'models');
const ARCHIVE_PATH = path.join(MODELS_DIR, `${MODEL_NAME}.tar.bz2`);

async function downloadModel() {
  if (fs.existsSync(path.join(MODELS_DIR, MODEL_NAME))) {
    console.log(`Model already present: ${MODEL_NAME}`);
    return;
  }
  fs.mkdirSync(MODELS_DIR, { recursive: true });

  const response = await fetch(MODEL_URL);
  if (!response.ok || !response.body) {
    throw new Error(`Download failed: HTTP ${response.status} ${response.statusText}`);
  }
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(ARCHIVE_PATH));
  execFileSync('tar', ['-xjf', ARCHIVE_PATH, '-C', MODELS_DIR], { stdio: 'inherit' });
  fs.rmSync(ARCHIVE_PATH);
  console.log(`Model ready: ${path.join(MODELS_DIR, MODEL_NAME)}`);
}

downloadModel().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
