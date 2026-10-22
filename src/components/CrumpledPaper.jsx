import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/* ════════════════════════════════════════════════
   CRUMPLED PAPER — a ball of paper that opens into a flat map
   A finely subdivided plane is morphed between a noisy, crushed ball and a
   flat sheet. Flat shading gives the faceted creases; the map is printed on
   it via a canvas texture. At the end the flat sheet exactly fills the stage,
   so the caller can cross-fade to the live SVG map without a jump.
═══════════════════════════════════════════════════ */

// Small deterministic value noise (no deps)
const hash = (x, y, z) => { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); };
const smooth = t => t * t * (3 - 2 * t);
function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = smooth(x - xi), yf = smooth(y - yi), zf = smooth(z - zi);
  const l = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => hash(xi + dx, yi + dy, zi + dz);
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), xf), l(c(0, 1, 0), c(1, 1, 0), xf), yf),
    l(l(c(0, 0, 1), c(1, 0, 1), xf), l(c(0, 1, 1), c(1, 1, 1), xf), yf), zf);
}
function fbm(x, y, z) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < 4; i++) { s += a * noise3(x * f, y * f, z * f); f *= 2.03; a *= 0.5; } return s; }
// Ridged noise: sharp crease lines instead of soft bumps
const ridged = (x, y, z) => 1 - Math.abs(2 * fbm(x, y, z) - 1);

const clamp01 = v => Math.min(1, Math.max(0, v));
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = t => 1 - Math.pow(1 - t, 3);

// Timeline (seconds)
const T_APPEAR = 0.5;    // ball drops in and turns
const T_UNFOLD = 1.7;    // opens from the centre outwards
const T_FLATTEN = 0.6;   // last wrinkles relax
export const CRUMPLE_DURATION = T_APPEAR + T_UNFOLD + T_FLATTEN;

export default function CrumpledPaper({ width, height, play, paint, onDone }) {
  const canvasRef = useRef(null);
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);
  const playRef = useRef(play);
  useEffect(() => { playRef.current = play; }, [play]);

  useEffect(() => {
    if (!width || !height) return;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true, alpha: true });
    } catch {
      onDoneRef.current?.();          // no WebGL: skip straight to the map
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const aspect = width / height;
    const scene = new THREE.Scene();
    // Plane is 2 units tall; at z = 0 it exactly fills the view
    const fov = 30;
    const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 50);
    camera.position.z = 1 / Math.tan(THREE.MathUtils.degToRad(fov / 2));

    // Map printed on the paper
    const tw = 2048, th = Math.round(2048 / aspect);
    const tcanvas = document.createElement('canvas'); tcanvas.width = tw; tcanvas.height = th;
    paint(tcanvas.getContext('2d'), tw, th);
    const texture = new THREE.CanvasTexture(tcanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;

    // Coarse mesh on purpose: flat shading turns big triangles into crisp paper facets.
    // (Once flat, every facet is coplanar, so the printed map is unaffected.)
    const long = 64, segX = Math.round(aspect >= 1 ? long : long * aspect), segY = Math.round(aspect >= 1 ? long / aspect : long);
    const geometry = new THREE.PlaneGeometry(2 * aspect, 2, segX, segY);
    const material = new THREE.MeshStandardMaterial({
      map: texture, roughness: 0.95, metalness: 0, flatShading: true, side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    const group = new THREE.Group(); group.add(mesh); scene.add(group);

    scene.add(new THREE.AmbientLight(0xffffff, 1.9));
    const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(-1.2, 1.6, 2.2); scene.add(key);
    const rim = new THREE.DirectionalLight(0xfff1e0, 0.5); rim.position.set(1.5, -1, 1); scene.add(rim);

    // Precompute flat + crumpled positions and per-vertex unfold delay
    const pos = geometry.attributes.position;
    const n = pos.count;
    const flat = new Float32Array(pos.array);
    const ball = new Float32Array(n * 3);
    const delay = new Float32Array(n);
    const wrinkle = new Float32Array(n);
    const jitter = new Float32Array(n * 2);                      // breaks up the regular triangle grid
    const cell = 2 / Math.min(segX / aspect, segY);
    const R = 0.34 * Math.min(aspect, 1);                        // ball size follows the short side
    const L = Math.max(aspect, 1);                               // half-length of the long side
    for (let i = 0; i < n; i++) {
      const x = flat[i * 3], y = flat[i * 3 + 1];
      const u = x / aspect, v = y;                                 // −1..1
      jitter[i * 2] = (hash(i, 1.3, 7.7) - 0.5) * cell * 0.9;
      jitter[i * 2 + 1] = (hash(i, 5.1, 2.9) - 0.5) * cell * 0.9;
      // wrap the long side around the ball, the short side pole-to-pole (else portrait sheets band)
      const ju = u + jitter[i * 2] / aspect, jv = v + jitter[i * 2 + 1];
      const [around, polar] = aspect >= 1 ? [ju, jv] : [jv, ju];
      const theta = around * Math.PI * 0.98, phi = polar * Math.PI * 0.49;
      const dx = Math.cos(phi) * Math.sin(theta), dy = Math.sin(phi), dz = Math.cos(phi) * Math.cos(theta);
      // creases sampled on the ball's surface → same look in every direction, any aspect ratio
      const bump = 1 + 0.6 * (ridged(dx * 1.8 + 3, dy * 1.8, dz * 1.8) - 0.55) + 0.3 * (ridged(dx * 5 + 7, dy * 5, dz * 5) - 0.55);
      ball[i * 3] = dx * R * bump;
      ball[i * 3 + 1] = dy * R * bump;
      ball[i * 3 + 2] = dz * R * bump;
      delay[i] = Math.min(1, Math.hypot(u, v) / Math.SQRT2);
      const sx = x / L, sy = y / L;
      wrinkle[i] = ((ridged(sx * 5 + 11, sy * 5, 2.3) - 0.55) * 0.14 + (ridged(sx * 13, sy * 13, 9.1) - 0.55) * 0.04) * Math.min(aspect, 1);
    }

    let start = null, raf = 0, done = false;
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      if (playRef.current && start === null) start = now;
      const t = start === null ? 0 : (now - start) / 1000;

      const appear = easeOut(clamp01(t / T_APPEAR));
      const tu = clamp01((t - T_APPEAR) / T_UNFOLD);
      const relax = easeInOut(clamp01((t - T_APPEAR - T_UNFOLD * 0.7) / (T_FLATTEN + T_UNFOLD * 0.3)));
      const a = pos.array;
      for (let i = 0; i < n; i++) {
        // centre opens first, edges follow
        const p = easeInOut(clamp01((tu - delay[i] * 0.42) / 0.58));
        const w = wrinkle[i] * (1 - relax) * Math.sin(Math.PI * Math.min(1, p * 1.15) * 0.5 + 0.0001);
        const j = 1 - relax;                                     // irregular facets until the sheet relaxes
        a[i * 3] = ball[i * 3] + (flat[i * 3] + jitter[i * 2] * j - ball[i * 3]) * p;
        a[i * 3 + 1] = ball[i * 3 + 1] + (flat[i * 3 + 1] + jitter[i * 2 + 1] * j - ball[i * 3 + 1]) * p;
        a[i * 3 + 2] = ball[i * 3 + 2] * (1 - p) + w;
      }
      pos.needsUpdate = true;

      const open = easeInOut(tu);
      group.scale.setScalar(0.55 + 0.45 * appear);
      group.position.y = (1 - appear) * 0.35 * (1 - open);
      group.rotation.set((1 - open) * 0.5, (1 - open) * (1.4 - 0.9 * appear), (1 - open) * -0.25);
      renderer.render(scene, camera);

      if (!done && t >= CRUMPLE_DURATION) { done = true; onDoneRef.current?.(); }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      geometry.dispose(); material.dispose(); texture.dispose(); renderer.dispose();
    };
  }, [width, height, paint]);

  return <canvas ref={canvasRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />;
}
