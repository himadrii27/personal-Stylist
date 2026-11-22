// MediaPipe Face Landmarker (478 face points incl. irises), running in the browser.
// The WASM runtime comes from jsDelivr at the installed package version and the 3.6 MB model from
// Google's model bucket; both are cached by the browser. No image ever leaves the device.
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// must match the installed @mediapipe/tasks-vision version (package.json pins it exactly)
export const MEDIAPIPE_VERSION = '0.10.21';
const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

let fileset;
const cache = {};

async function create(runningMode, delegate) {
  fileset ??= FilesetResolver.forVisionTasks(WASM);
  return FaceLandmarker.createFromOptions(await fileset, {
    baseOptions: { modelAssetPath: MODEL, delegate },
    runningMode, numFaces: 1,
  });
}

/** One shared landmarker per mode ('VIDEO' for the live camera, 'IMAGE' for uploads). GPU first, CPU fallback. */
export function getLandmarker(mode = 'VIDEO') {
  cache[mode] ??= create(mode, 'GPU').catch(() => create(mode, 'CPU'));
  cache[mode].catch(() => { delete cache[mode]; });        // let a later attempt retry after a failure
  return cache[mode];
}
