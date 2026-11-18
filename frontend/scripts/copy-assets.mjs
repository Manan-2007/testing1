/**
 * Stage the MediaPipe WebAssembly runtime into public/ before dev and build.
 *
 * The wasm (~33 MB) ships inside @mediapipe/tasks-vision and is gitignored here,
 * so a fresh clone works after `npm install` with no manual step. The landmarker
 * models in public/models/ are committed: they must be byte-identical to the
 * ones the recognition service was trained against.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = join(ROOT, "node_modules/@mediapipe/tasks-vision/wasm");
const DST = join(ROOT, "public/mediapipe/wasm");

if (!existsSync(SRC)) {
  console.error("@mediapipe/tasks-vision is not installed. Run: npm install");
  process.exit(1);
}
mkdirSync(DST, { recursive: true });

let copied = 0;
for (const name of readdirSync(SRC)) {
  const from = join(SRC, name);
  const to = join(DST, name);
  if (!existsSync(to) || statSync(from).size !== statSync(to).size) {
    copyFileSync(from, to);
    copied += 1;
  }
}
console.log(`mediapipe wasm: ${copied} copied, ${readdirSync(DST).length} present`);

for (const model of ["hand_landmarker.task", "pose_landmarker_lite.task"]) {
  if (!existsSync(join(ROOT, "public/models", model))) {
    console.warn(`warning: public/models/${model} is missing; on-device tracking will not start`);
  }
}
