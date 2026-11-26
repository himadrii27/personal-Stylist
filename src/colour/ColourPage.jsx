import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, RotateCcw, Sparkles, X, ShieldCheck, Sun, Shirt } from 'lucide-react';
import { FaceLandmarker } from '@mediapipe/tasks-vision';
import { getLandmarker } from './faceLandmarker';
import { measureFace, rankSeasons, describe, medianScores, spread, averageLab, labToHex } from './analyse';
import { seasonById } from './seasons';

/* ════════════════════════════════════════════════
   KNOW YOUR COLOURS — reads skin, hair and eyes live from the camera (on-device),
   places the person on the 12-season colour system and shows the palette,
   with a live "drape" to try the colours against their own face.
═══════════════════════════════════════════════════ */

const STEADY_MS = 1200;         // a steady reading for this long locks the result
const WINDOW_MS = 1600;         // readings compared for steadiness
const MAX_SPREAD = 0.15;        // how much the three scores may wobble and still count as steady
const FALLBACK_READINGS = 70;   // ~8 s of usable frames without settling → take the median anyway

const HINTS = {
  noface: 'Look at the camera',
  far: 'Come a little closer',
  close: 'Move back a little',
  centre: 'Centre your face in the oval',
  turn: 'Face the camera straight on',
  dark: 'Too dark: face a window or a bright light',
  glare: 'Too much glare: soften the light or step back',
  uneven: 'One side is in shadow: turn towards the light',
  tint: 'The light looks tinted. Daylight gives the truest reading',
};

/* ── camera ─────────────────────────────────────────────────────────── */
function useCamera(videoRef) {
  const [status, setStatus] = useState(() => (navigator.mediaDevices?.getUserMedia ? 'starting' : 'unsupported'));
  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) return undefined;
    let stream, cancelled = false;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
      .then(s => {
        if (cancelled) { s.getTracks().forEach(t => t.stop()); return; }
        stream = s;
        const v = videoRef.current;
        if (v) { v.srcObject = s; v.play().catch(() => {}); }
        setStatus('live');
      })
      .catch(() => !cancelled && setStatus('denied'));
    return () => { cancelled = true; stream?.getTracks().forEach(t => t.stop()); };
  }, [videoRef]);
  return status;
}

/* ── overlay: face outline + the spots being sampled ────────────────── */
const MARK = { skin: '#FFFFFF', hair: '#F2C230', eye: '#7FD1FF', white: '#E2571A' };
function drawOverlay(canvas, W, H, pts, m) {
  if (!canvas) return;
  if (canvas.width !== W) { canvas.width = W; canvas.height = H; }
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, W, H);
  if (!pts) return;
  g.strokeStyle = m?.issue && m.issue !== 'tint' ? 'rgba(255,255,255,0.35)' : 'rgba(226,87,26,0.85)';
  g.lineWidth = Math.max(1.5, W / 400);
  g.beginPath();
  for (const { start, end } of FaceLandmarker.FACE_LANDMARKS_FACE_OVAL) {
    g.moveTo(pts[start].x * W, pts[start].y * H);
    g.lineTo(pts[end].x * W, pts[end].y * H);
  }
  g.stroke();
  for (const k of m?.marks || []) {
    g.beginPath();
    g.arc(k.x, k.y, Math.max(2, k.r), 0, Math.PI * 2);
    g.strokeStyle = MARK[k.kind];
    g.lineWidth = Math.max(1, W / 600);
    g.stroke();
  }
}

/** Readings (several frames, or one photo) → the saved result. */
function buildResult(readings, source) {
  const scores = medianScores(readings.map(r => r.scores));
  const ranked = rankSeasons(scores);
  const hex = k => { const lab = averageLab(readings.map(r => r[k]).filter(Boolean)); return lab && labToHex(lab); };
  return {
    seasonId: ranked[0].season.id, runnerUpId: ranked[1].season.id, scores,
    skin: hex('skin'), hair: hex('hair'), eyes: hex('eyes'), source, at: new Date().toISOString(),
  };
}

/* ── live meter (cool ↔ warm etc.) ──────────────────────────────────── */
function Meter({ label, left, right, value, gradient }) {
  const pct = value == null ? 50 : (value + 1) * 50;
  return (
    <div className="cl-meter">
      <div className="cl-meter-head"><span>{label}</span></div>
      <div className="cl-meter-track" style={{ background: gradient }}>
        <motion.span className="cl-meter-dot" animate={{ left: `${pct}%`, opacity: value == null ? 0.3 : 1 }} transition={{ type: 'spring', stiffness: 160, damping: 22 }} />
      </div>
      <div className="cl-meter-ends"><span>{left}</span><span>{right}</span></div>
    </div>
  );
}

function Swatch({ hex, label }) {
  return (
    <div className="cl-read">
      <span className="cl-read-dot" style={{ background: hex || 'transparent', borderStyle: hex ? 'solid' : 'dashed' }} />
      <span>{label}</span>
    </div>
  );
}

/* ── live scan ──────────────────────────────────────────────────────── */
function Scanner({ onDone, onCancel }) {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const cam = useCamera(videoRef);
  const [model, setModel] = useState('loading');           // loading | ready | failed
  const [live, setLive] = useState({ issue: 'noface', progress: 0 });
  const lmRef = useRef(null);
  const doneRef = useRef(onDone);
  useEffect(() => { doneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    let alive = true;
    getLandmarker('VIDEO').then(lm => { if (alive) { lmRef.current = lm; setModel('ready'); } }).catch(() => alive && setModel('failed'));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (cam !== 'live' || model !== 'ready') return undefined;
    const work = document.createElement('canvas');
    const ctx = work.getContext('2d', { willReadFrequently: true });
    const win = [];          // recent usable readings
    const all = [];          // every usable reading this session
    let raf, last = 0, steadySince = null, finished = false, fails = 0;

    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const v = videoRef.current;
      if (finished || !v || v.readyState < 2 || !v.videoWidth || now - last < 110) return;
      last = now;
      const scale = Math.min(1, 720 / v.videoWidth);
      const W = Math.round(v.videoWidth * scale), H = Math.round(v.videoHeight * scale);
      if (work.width !== W) { work.width = W; work.height = H; }
      ctx.drawImage(v, 0, 0, W, H);
      let pts;
      try {
        pts = lmRef.current.detectForVideo(v, now).faceLandmarks?.[0];
        fails = 0;
      } catch {
        // a browser without WebGL can create the model but never run it: say so instead of waiting forever
        if (++fails > 15) { finished = true; setModel('failed'); }
        return;
      }
      const m = measureFace(ctx.getImageData(0, 0, W, H).data, W, H, pts);
      drawOverlay(overlayRef.current, W, H, pts, m);

      const usable = !m.issue || m.issue === 'tint';
      if (usable) {
        const r = { t: now, scores: m.scores, skin: m.skin, hair: m.hair, eyes: m.eyes };
        win.push(r); all.push(r);
        while (win.length && now - win[0].t > WINDOW_MS) win.shift();
      } else {
        win.length = 0;
      }
      const steady = win.length >= 8 && spread(win.map(r => r.scores)) < MAX_SPREAD;
      steadySince = steady ? (steadySince ?? now) : null;
      const progress = steadySince ? Math.min(1, (now - steadySince) / STEADY_MS) : Math.min(0.25, win.length / 32);

      if (progress >= 1 || all.length >= FALLBACK_READINGS) {
        finished = true;
        doneRef.current(buildResult(progress >= 1 ? win : all.slice(-40), 'live'));
        return;
      }
      const shown = win.length ? medianScores(win.map(r => r.scores)) : null;
      setLive({
        issue: m.issue, progress, scores: shown,
        lead: shown && rankSeasons(shown)[0].season,
        skin: m.skin && labToHex(m.skin), hair: m.hair && labToHex(m.hair), eyes: m.eyes && labToHex(m.eyes),
      });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cam, model]);

  if (cam === 'denied' || cam === 'unsupported' || model === 'failed') {
    return (
      <div className="cl-card" style={{ textAlign: 'center' }}>
        <p className="wd-msg" style={{ marginBottom: '1rem' }}>
          {model === 'failed'
            ? "We couldn't run the face reader in this browser. Check your connection, try another browser, or upload a selfie instead."
            : "We couldn't open your camera. Allow camera access in your browser, or upload a photo instead."}
        </p>
        <button className="wd-btn wd-btn--ghost" onClick={onCancel}>Back</button>
      </div>
    );
  }

  const d = live.scores && describe(live.scores);
  const hint = cam !== 'live' ? 'Opening your camera…'
    : model !== 'ready' ? 'Loading the face reader…'
    : live.issue ? HINTS[live.issue]
    : live.progress > 0.3 ? 'Hold still… reading your colours' : 'Good light. Hold still';
  const ok = cam === 'live' && model === 'ready' && (!live.issue || live.issue === 'tint');

  return (
    <div className="cl-scan">
      <div className="cl-stage">
        <video ref={videoRef} playsInline muted aria-label="Your camera" />
        <canvas ref={overlayRef} aria-hidden="true" />
        <div className={`cl-oval${ok ? ' is-ok' : ''}`} aria-hidden="true">
          <svg viewBox="0 0 78 100">
            <ellipse cx="39" cy="50" rx="38" ry="49" pathLength="100" className="cl-oval-ring"
              style={{ strokeDashoffset: 100 - live.progress * 100, opacity: live.progress > 0 ? 1 : 0 }} />
          </svg>
        </div>
        <p className={`cl-hint${ok ? ' is-ok' : ''}`} role="status" aria-live="polite">{hint}</p>
        <button className="cl-close" onClick={onCancel} aria-label="Stop scanning"><X size={18} /></button>
      </div>

      <aside className="cl-live">
        <p className="wd-label" style={{ marginBottom: 4 }}>(Live reading)</p>
        <p className="cl-live-lead">
          <AnimatePresence mode="wait">
            <motion.span key={live.lead?.id || 'none'} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              {live.lead ? <>Looks like <em>{live.lead.name}</em></> : 'Waiting for a clear view…'}
            </motion.span>
          </AnimatePresence>
        </p>
        <div className="cl-reads">
          <Swatch hex={live.skin} label="Skin" />
          <Swatch hex={live.hair} label="Hair" />
          <Swatch hex={live.eyes} label="Eyes" />
        </div>
        <Meter label={d ? `Undertone · ${d.undertone}` : 'Undertone'} left="Cool" right="Warm" value={live.scores?.temp}
          gradient="linear-gradient(90deg, #C9A3B4, #E8D6CC 50%, #E2B27A)" />
        <Meter label={d ? `Depth · ${d.depth}` : 'Depth'} left="Deep" right="Light" value={live.scores?.value}
          gradient="linear-gradient(90deg, #4A3226, #A27A5C 50%, #F1DCC6)" />
        <Meter label={d ? `Contrast · ${d.contrast}` : 'Contrast'} left="Soft" right="High" value={live.scores?.chroma}
          gradient="linear-gradient(90deg, #B8AFA6, #8E7F74 50%, #1B1B1B)" />
        <p className="cl-fine"><ShieldCheck size={13} /> Read on your device. No photo is saved or sent.</p>
      </aside>
    </div>
  );
}

/* ── live drape: hold colours up to your face ───────────────────────── */
function Drape({ season }) {
  const videoRef = useRef(null);
  const cam = useCamera(videoRef);
  const colours = [...season.best, ...season.neutrals];
  const [pick, setPick] = useState(colours[0]);
  const [compare, setCompare] = useState(false);
  const shown = compare ? season.avoid[colours.indexOf(pick) % season.avoid.length] : pick;
  if (cam === 'denied' || cam === 'unsupported') return <p className="wd-msg">Allow camera access to try colours on live.</p>;
  return (
    <div className="cl-drape">
      <div className="cl-drape-mirror" style={{ '--drape': shown.hex }}>
        <video ref={videoRef} playsInline muted aria-label="Your camera with the colour around your face" />
        <span className="cl-drape-name">{compare ? `Avoid · ${shown.name}` : shown.name}</span>
      </div>
      <div>
        <div className="cl-drape-picks" role="radiogroup" aria-label="Colour to try">
          {colours.map(c => (
            <button key={c.hex + c.name} role="radio" aria-checked={pick === c && !compare} aria-label={c.name}
              className={`cl-pick${pick === c && !compare ? ' is-on' : ''}`} style={{ background: c.hex }}
              onClick={() => { setPick(c); setCompare(false); }} />
          ))}
        </div>
        <button className="wd-btn wd-btn--ghost" style={{ marginTop: '0.9rem' }} onPointerDown={() => setCompare(true)} onPointerUp={() => setCompare(false)}
          onPointerLeave={() => setCompare(false)} onKeyDown={e => (e.key === ' ' || e.key === 'Enter') && setCompare(true)} onKeyUp={() => setCompare(false)}>
          Hold to compare with a colour to avoid
        </button>
        <p className="wd-msg" style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
          Your colours should make your skin look even and your eyes brighter. Colours to avoid tend to show shadows or make you look tired.
        </p>
      </div>
    </div>
  );
}

/* ── result ─────────────────────────────────────────────────────────── */
function Chips({ list, crossed }) {
  return (
    <div className="cl-chips">
      {list.map(c => (
        <div key={c.hex + c.name} className={`cl-chip${crossed ? ' is-avoid' : ''}`}>
          <span style={{ background: c.hex }} />
          <p>{c.name}</p>
        </div>
      ))}
    </div>
  );
}

function Result({ result, onRescan, onForget, onStyleEvent, onCheckWardrobe }) {
  const season = seasonById(result.seasonId);
  const close = seasonById(result.runnerUpId);
  const d = describe(result.scores);
  const [drape, setDrape] = useState(false);
  const [first, ...rest] = season.name.split(' ');
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="cl-result">
      <div className="cl-result-head">
        <div>
          <p className="wd-label">(Your colours)</p>
          <h1 className="cl-title">You're a {first} <em>{rest.join(' ')}</em></h1>
          <p className="wd-msg" style={{ maxWidth: 520, marginTop: 8 }}>{season.blurb}</p>
          <div className="cl-tags">
            <span>{d.undertone}</span><span>{d.depth}</span><span>{d.contrast}</span>
            {close && <span className="is-soft">Close to {close.name}</span>}
          </div>
        </div>
        <div className="cl-reads cl-reads--big" aria-label="Colours read from your face">
          <Swatch hex={result.skin} label="Skin" />
          <Swatch hex={result.hair} label="Hair" />
          <Swatch hex={result.eyes} label="Eyes" />
        </div>
      </div>

      <section className="cl-block">
        <h2>Your best colours</h2>
        <Chips list={season.best} />
      </section>
      <div className="cl-two">
        <section className="cl-block">
          <h2>Neutrals</h2>
          <Chips list={season.neutrals} />
          <p className="wd-msg" style={{ marginTop: 10, fontSize: '0.875rem' }}>Metals · {season.metal}</p>
        </section>
        <section className="cl-block">
          <h2>Keep away from your face</h2>
          <Chips list={season.avoid} crossed />
        </section>
      </div>

      <section className="cl-block">
        <h2>Try them on, live</h2>
        {drape ? <Drape season={season} /> : (
          <button className="wd-btn wd-btn--ghost" onClick={() => setDrape(true)}><Camera size={15} /> Hold colours up to your face</button>
        )}
      </section>

      <div className="wd-actions" style={{ marginTop: '1.75rem' }}>
        <button className="wd-btn" onClick={onStyleEvent}><Sparkles size={15} /> Style an event in my colours</button>
        {onCheckWardrobe && <button className="wd-btn wd-btn--ghost" onClick={onCheckWardrobe}><Shirt size={15} /> Check my wardrobe against these</button>}
        <button className="wd-btn wd-btn--ghost" onClick={onRescan}><RotateCcw size={15} /> Scan again</button>
        <button className="wd-link" onClick={onForget}>Forget my palette</button>
      </div>
      <p className="cl-fine" style={{ marginTop: '1.25rem' }}>
        <Sun size={13} /> This is an estimate from your camera ({result.source === 'photo' ? 'photo' : 'live scan'}, {new Date(result.at).toLocaleDateString()}).
        Cameras and indoor light shift colour, so scan in daylight without makeup for the truest reading, and trust the live drape over the label.
      </p>
    </motion.div>
  );
}

/* ── photo upload (fallback when there's no camera) ─────────────────── */
async function analysePhoto(file) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1024 / Math.max(bmp.width, bmp.height));
  const W = Math.round(bmp.width * scale), H = Math.round(bmp.height * scale);
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bmp, 0, 0, W, H);
  bmp.close?.();
  const lm = await getLandmarker('IMAGE');
  const pts = lm.detect(c).faceLandmarks?.[0];
  const m = measureFace(ctx.getImageData(0, 0, W, H).data, W, H, pts);
  if (m.issue && m.issue !== 'tint') throw new Error(m.issue === 'noface' ? "We couldn't find a face in that photo." : `${HINTS[m.issue]}. Try another photo.`);
  return buildResult([m], 'photo');
}

/* ── page ───────────────────────────────────────────────────────────── */
export default function ColourPage({ palette, onSave, onForget, onStyleEvent, onCheckWardrobe }) {
  const [phase, setPhase] = useState(palette ? 'result' : 'intro');
  const [photoState, setPhotoState] = useState(null);           // null | 'working' | error message
  const fileRef = useRef(null);

  // warm the model while the person reads the intro
  useEffect(() => { if (!palette) getLandmarker('VIDEO').catch(() => {}); }, [palette]);

  const done = (result) => { onSave(result); setPhase('result'); };
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoState('working');
    try { done(await analysePhoto(file)); setPhotoState(null); } catch (err) { setPhotoState(err.message || 'Something went wrong reading that photo.'); }
  };

  return (
    <div className="wd-page cl-page">
      <AnimatePresence mode="wait">
        {phase === 'result' && palette ? (
          <Result key="res" result={palette} onStyleEvent={onStyleEvent} onCheckWardrobe={onCheckWardrobe}
            onRescan={() => setPhase('scan')} onForget={() => { onForget(); setPhase('intro'); }} />
        ) : phase === 'scan' ? (
          <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Scanner onDone={done} onCancel={() => setPhase(palette ? 'result' : 'intro')} />
          </motion.div>
        ) : (
          <motion.div key="intro" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="cl-intro">
            <p className="wd-label">(Know your colours)</p>
            <h1 className="cl-title">Find the colours<br /><em>that make you glow.</em></h1>
            <p className="wd-msg" style={{ maxWidth: 520, margin: '0.75rem 0 1.25rem' }}>
              Look into your camera. We read your skin undertone, the depth of your colouring and the contrast between your skin, hair and eyes,
              live, then match you to one of 12 colour seasons.
            </p>
            <ul className="wd-tips wd-tips--row" style={{ justifyContent: 'flex-start', marginBottom: '1.5rem' }}>
              <li>Face a window, in daylight</li><li>No heavy makeup or filters</li><li>Hair off your face</li>
            </ul>
            <div className="wd-actions">
              <button className="wd-btn" onClick={() => setPhase('scan')}><Camera size={16} /> Start live scan</button>
              <button className="wd-link" onClick={() => fileRef.current?.click()} disabled={photoState === 'working'}>
                <Upload size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                {photoState === 'working' ? 'Reading your photo…' : 'or upload a selfie'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
            </div>
            {photoState && photoState !== 'working' && <p className="wd-msg" role="alert" style={{ color: '#B03A2E', marginTop: '0.75rem' }}>{photoState}</p>}
            <p className="cl-fine" style={{ marginTop: '1.5rem' }}><ShieldCheck size={13} /> Everything runs on your device. No photo is saved or sent, only your season is remembered.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
