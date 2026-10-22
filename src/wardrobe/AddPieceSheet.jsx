import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, RotateCcw, Sparkles } from 'lucide-react';
import { removeBackground, isModelCached, HD_MODEL_URL, HD_MODEL_MB } from './segment/removeBackground';
import { CATEGORIES } from './store';

/* ════════════════════════════════════════════════
   ADD A PIECE — capture → cutting out → review → add.
   The photo never leaves the device: U2-Net + SegFormer run in a Web Worker.
   If someone is wearing the clothes, the person is removed and every garment
   found becomes a piece the user can pick.
═══════════════════════════════════════════════════ */

const serif = '"Instrument Serif", Georgia, serif';
const ACCENT = '#E2571A';

// rough first guess from the cut-out's shape; the user confirms with the chips
function guessCategory(w, h) {
  const r = h / w;
  if (r < 0.7) return 'shoes';
  if (r > 2.0) return 'bottom';
  if (r > 1.65) return 'dress';
  return 'top';
}

function CameraView({ onShot, onCancel }) {
  const videoRef = useRef(null);
  const [err, setErr] = useState(() => !navigator.mediaDevices?.getUserMedia);
  useEffect(() => {
    let stream;
    if (!navigator.mediaDevices?.getUserMedia) return undefined;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 } }, audio: false })
      .then(s => { stream = s; if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play().catch(() => {}); } })
      .catch(() => setErr(true));
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);

  const shoot = () => {
    const v = videoRef.current;
    if (!v?.videoWidth) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    c.toBlob(b => b && onShot(b), 'image/jpeg', 0.92);
  };

  if (err) {
    return (
      <div className="wd-sheet-body" style={{ textAlign: 'center' }}>
        <p className="wd-msg">We couldn't open your camera. Allow camera access, or upload a photo instead.</p>
        <button className="wd-btn wd-btn--ghost" onClick={onCancel}>Back</button>
      </div>
    );
  }
  return (
    <div className="wd-camera">
      <video ref={videoRef} playsInline muted />
      <div className="wd-camera-guide" aria-hidden="true" />
      <p className="wd-camera-hint">Lay it flat or hang it · plain background · good light</p>
      <div className="wd-camera-bar">
        <button className="wd-btn wd-btn--ghost wd-btn--sm" onClick={onCancel}>Cancel</button>
        <button className="wd-shutter" onClick={shoot} aria-label="Take photo"><span /></button>
        <span style={{ width: 72 }} />
      </div>
    </div>
  );
}

function BeforeAfter({ photoUrl, cutoutUrl }) {
  const [pos, setPos] = useState(55);
  return (
    <div className="wd-compare">
      <img src={photoUrl} alt="Your photo" />
      <div className="wd-compare-after" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
        <img src={cutoutUrl} alt="Background removed" />
      </div>
      <div className="wd-compare-line" style={{ left: `${pos}%` }}><span>⇆</span></div>
      <span className="wd-compare-tag" style={{ left: 10 }}>Photo</span>
      <span className="wd-compare-tag" style={{ right: 10 }}>Cut-out</span>
      <input type="range" min="0" max="100" value={pos} onChange={e => setPos(+e.target.value)} aria-label="Compare photo and cut-out" />
    </div>
  );
}

export default function AddPieceSheet({ open, onClose, onAdd, startWithCamera }) {
  const fileRef = useRef(null);
  const [step, setStep] = useState('choose');          // choose · camera · working · review · error
  const [photo, setPhoto] = useState(null);             // { blob, url }
  const [result, setResult] = useState(null);           // { mode, ms, model }
  const [pieces, setPieces] = useState([]);             // [{ ...worker piece, url, previewUrl, name, category, selected, nameTouched }]
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(null);       // { label, loaded, total } while a model downloads
  const [error, setError] = useState(null);
  const [hd, setHd] = useState(false);
  const [hdCached, setHdCached] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { isModelCached(HD_MODEL_URL).then(setHdCached); }, [open]);
  useEffect(() => {
    if (!open) return;
    setStep(startWithCamera ? 'camera' : 'choose'); setPhoto(null); setResult(null); setPieces([]); setError(null); setHd(false);
  }, [open, startWithCamera]);
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.url); }, [photo]);
  useEffect(() => () => pieces.forEach(p => { URL.revokeObjectURL(p.url); URL.revokeObjectURL(p.previewUrl); }), [pieces]);

  const autoName = (colour, category) => `${colour.name} ${CATEGORIES.find(c => c.id === category)?.label.toLowerCase()}`;
  const editPiece = (i, patch) => setPieces(prev => prev.map((p, k) => {
    if (k !== i) return p;
    const next = { ...p, ...patch };
    if (patch.category && !next.nameTouched) next.name = autoName(next.colour, next.category);
    return next;
  }));

  const run = async (blob, model) => {
    setStep('working'); setError(null); setProgress(null);
    try {
      const r = await removeBackground(blob, { model, onProgress: (label, loaded, total) => setProgress({ label, loaded, total }) });
      const list = r.pieces.map((p, k) => {
        const category = p.category || guessCategory(p.width, p.height);
        return { ...p, category, name: autoName(p.colour, category), selected: k === 0 || r.mode === 'person', nameTouched: false,
                 url: URL.createObjectURL(p.cutout), previewUrl: URL.createObjectURL(p.preview) };
      });
      setPieces(list); setActive(0);
      setResult({ mode: r.mode, ms: r.ms, model: r.model });
      if (model === 'u2net') setHdCached(true);
      setStep('review');
    } catch (e) {
      setError(e.message === 'NOTHING_FOUND'
        ? "We couldn't find a garment in that photo. Try a plainer, contrasting background and fill more of the frame."
        : e.message === 'NO_CLOTHES'
          ? "We found a person but no clothing we could separate. Try a photo where the outfit is clearly visible."
          : e.message);
      setStep('error');
    } finally {
      setProgress(null);
    }
  };

  const takePhoto = (blob) => {
    setPhoto({ blob, url: URL.createObjectURL(blob) });
    setHd(false);
    run(blob, 'u2netp');
  };

  const toggleHd = () => {
    if (!photo) return;
    if (!hd && !hdCached && !window.confirm(`HD cut-out downloads a ${HD_MODEL_MB} MB model once (it's cached afterwards). Continue?`)) return;
    const next = !hd;
    setHd(next);
    run(photo.blob, next ? 'u2net' : 'u2netp');
  };

  const chosen = pieces.filter(p => p.selected);
  const add = async () => {
    setSaving(true);
    try {
      await onAdd(chosen.map(p => ({
        name: p.name.trim() || 'Untitled piece', category: p.category, colour: p.colour,
        image: p.cutout, width: p.width, height: p.height, model: result.model, source: result.mode,
      })));
    } finally {
      setSaving(false);
    }
  };
  const cur = pieces[active];

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="wd-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className="wd-sheet"
            role="dialog" aria-modal="true" aria-label="Add a piece"
            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="wd-sheet-head">
              <p className="wd-label">Add a piece</p>
              <button className="wd-icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
            </div>

            <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden data-testid="wd-file"
              onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) takePhoto(f); }} />

            {step === 'choose' && (
              <div className="wd-sheet-body">
                <h2 style={{ fontFamily: serif, fontWeight: 400, fontSize: '2rem', lineHeight: 1, margin: '0 0 0.4rem' }}>Photograph a piece</h2>
                <p className="wd-msg">We'll cut it out and hang it in your wardrobe. Your photo stays on this device.</p>
                <div className="wd-choose">
                  <button className="wd-choice" onClick={() => setStep('camera')}><Camera size={22} /> <span><strong>Take a photo</strong><small>Use your camera</small></span></button>
                  <button className="wd-choice" onClick={() => fileRef.current?.click()}><Upload size={22} /> <span><strong>Upload a photo</strong><small>From your gallery</small></span></button>
                </div>
                <ul className="wd-tips">
                  <li>Lay it flat or hang it up</li><li>Plain, contrasting background</li><li>Good daylight, no flash</li>
                </ul>
              </div>
            )}

            {step === 'camera' && <CameraView onShot={takePhoto} onCancel={() => setStep('choose')} />}

            {step === 'working' && photo && (
              <div className="wd-sheet-body">
                <div className="wd-working">
                  <img src={photo.url} alt="Your photo" />
                  <span className="wd-scan" aria-hidden="true" />
                </div>
                {progress ? (
                  <div style={{ marginTop: 14 }}>
                    <p className="wd-msg" style={{ marginBottom: 6 }}>
                      Downloading the {progress.label} model (one time)… {Math.round(progress.loaded / 1e6)} / {Math.round(progress.total / 1e6)} MB
                    </p>
                    <div className="wd-bar"><span style={{ width: `${(progress.loaded / progress.total) * 100}%` }} /></div>
                  </div>
                ) : (
                  <p className="wd-msg" style={{ marginTop: 14, textAlign: 'center' }}>
                    <Sparkles size={14} style={{ verticalAlign: '-2px', color: ACCENT }} /> Removing background{hd ? ' (HD)' : ''}…
                  </p>
                )}
              </div>
            )}

            {step === 'review' && photo && result && cur && (
              <div className="wd-sheet-body">
                {result.mode === 'person' && (
                  <div className="wd-found">
                    <p className="wd-msg"><strong>We removed the person</strong> and found {pieces.length} piece{pieces.length > 1 ? 's' : ''}. Pick what to add.</p>
                    <div className="wd-found-strip" role="listbox" aria-label="Pieces found">
                      {pieces.map((p, i) => (
                        <div key={i} className={`wd-found-item${i === active ? ' is-active' : ''}`}>
                          <button type="button" className="wd-found-thumb" onClick={() => setActive(i)} aria-label={`Show ${p.label}`} aria-pressed={i === active}>
                            <img src={p.url} alt="" />
                            <span>{p.label}</span>
                          </button>
                          <label className="wd-found-check" title="Add this piece">
                            <input type="checkbox" checked={p.selected} onChange={e => editPiece(i, { selected: e.target.checked })} aria-label={`Add ${p.label}`} />
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <BeforeAfter key={active} photoUrl={photo.url} cutoutUrl={cur.previewUrl} />
                <div className="wd-review-row">
                  <span className="wd-swatch" style={{ background: cur.colour.hex }} title={cur.colour.name} />
                  <input className="wd-name" value={cur.name} onChange={e => editPiece(active, { name: e.target.value, nameTouched: true })} aria-label="Name" />
                </div>
                <div className="wd-chips" role="radiogroup" aria-label="Category">
                  {CATEGORIES.map(c => (
                    <button key={c.id} role="radio" aria-checked={cur.category === c.id} className={`wd-chip${cur.category === c.id ? ' is-on' : ''}`} onClick={() => editPiece(active, { category: c.id })}>{c.label}</button>
                  ))}
                </div>
                <label className="wd-hd">
                  <input type="checkbox" checked={hd} onChange={toggleHd} />
                  <span><strong>HD cut-out</strong> sharper edges on lace and fringe{hdCached ? '' : ` · ${HD_MODEL_MB} MB one-time download`}</span>
                </label>
                <p className="wd-meta">{result.model === 'u2net' ? 'U²-Net' : 'U²-Net lite'}{result.mode === 'person' ? ' + clothing parser' : ''} · {result.ms} ms · on-device</p>
                <div className="wd-actions">
                  <button className="wd-btn wd-btn--ghost" onClick={() => setStep('choose')}><RotateCcw size={15} /> Retake</button>
                  <button className="wd-btn" onClick={add} disabled={saving || !chosen.length}>
                    {saving ? 'Adding…' : chosen.length > 1 ? `Add ${chosen.length} pieces` : 'Add to wardrobe'}
                  </button>
                </div>
              </div>
            )}

            {step === 'error' && (
              <div className="wd-sheet-body" style={{ textAlign: 'center' }}>
                {photo && <img src={photo.url} alt="" style={{ maxHeight: 180, borderRadius: 10, opacity: 0.6, margin: '0 auto 12px', display: 'block' }} />}
                <p className="wd-msg">{error}</p>
                <div className="wd-actions" style={{ justifyContent: 'center' }}>
                  <button className="wd-btn wd-btn--ghost" onClick={() => setStep('choose')}><RotateCcw size={15} /> Try another photo</button>
                  {photo && <button className="wd-btn" onClick={() => run(photo.blob, hd ? 'u2net' : 'u2netp')}>Retry</button>}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
