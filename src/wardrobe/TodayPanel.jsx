import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, CloudSun, Snowflake, CloudRain, MapPin, Shuffle, Check, Bookmark, SlidersHorizontal, Loader2 } from 'lucide-react';
import { DRESSINESS } from './store';
import { WEATHERS, suggestOutfits, verdict, weatherFromForecast, wearKey } from './style';
import { FlatLay } from './parts';

/* "What do I wear today?" — weather + how dressed up → three looks from what you own. */

const ICONS = { hot: Sun, mild: CloudSun, cold: Snowflake, rainy: CloudRain };
const KEY = 'personalStylistToday';

function remembered() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    return v && v.day === new Date().toDateString() ? v : {};
  } catch { return {}; }
}
function remember(v) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...v, day: new Date().toDateString() })); } catch { /* storage blocked */ }
}

export default function TodayPanel({ items, urls, season, onWear, onSave, onTweak, wornTodayKeys }) {
  const start = remembered();
  const [weather, setWeather] = useState(start.weather || null);
  const [dressiness, setDressiness] = useState(start.dressiness || 'casual');
  const [place, setPlace] = useState(start.place || null);      // { temp, label } from the forecast
  const [locating, setLocating] = useState(false);
  const [locErr, setLocErr] = useState(null);
  const [seed, setSeed] = useState(0);

  const pick = (patch) => {
    const next = { weather, dressiness, place, ...patch };
    if (patch.weather !== undefined) { setWeather(patch.weather); if (!patch.place) { next.place = null; setPlace(null); } }
    if (patch.dressiness) setDressiness(patch.dressiness);
    if (patch.place) setPlace(patch.place);
    setSeed(0);
    remember(next);
  };

  const ideas = useMemo(() => suggestOutfits(items, { weather, dressiness, season }, { n: 3, seed }), [items, weather, dressiness, season, seed]);

  const locate = () => {
    if (!navigator.geolocation) { setLocErr("Your browser can't share location — pick the weather instead."); return; }
    setLocating(true); setLocErr(null);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        // rounded to ~10 km before it leaves the device
        const lat = coords.latitude.toFixed(1), lon = coords.longitude.toFixed(1);
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,weather_code`);
        if (!r.ok) throw new Error();
        const { current } = await r.json();
        const w = weatherFromForecast(current);
        pick({ weather: w, place: { temp: Math.round(current.temperature_2m) } });
      } catch {
        setLocErr("Couldn't get the forecast — pick the weather instead.");
      } finally { setLocating(false); }
    }, () => { setLocating(false); setLocErr('Location is off — pick the weather instead.'); }, { timeout: 10000, maximumAge: 30 * 60000 });
  };

  return (
    <section className="wd-today" aria-labelledby="wd-today-title">
      <div className="wd-today-head">
        <div>
          <p className="wd-label">(Today)</p>
          <h2 id="wd-today-title" className="wd-h2">What do I wear today?</h2>
        </div>
        <div className="wd-today-controls">
          <div className="wd-ctl">
            <span className="wd-tagrow-label">Weather</span>
            <div className="wd-chips" role="radiogroup" aria-label="Weather">
              {WEATHERS.map(w => {
                const Icon = ICONS[w.id];
                return (
                  <button key={w.id} type="button" role="radio" aria-checked={weather === w.id}
                    className={`wd-chip wd-chip--icon${weather === w.id ? ' is-on' : ''}`} onClick={() => pick({ weather: weather === w.id ? null : w.id })}>
                    <Icon size={14} aria-hidden="true" /> {w.label}{weather === w.id && place ? ` · ${place.temp}°` : ''}
                  </button>
                );
              })}
              <button type="button" className="wd-link wd-link--icon" onClick={locate} disabled={locating}>
                {locating ? <Loader2 size={14} className="wd-spin" /> : <MapPin size={14} />} {locating ? 'Checking…' : 'Use my location'}
              </button>
            </div>
            {locErr && <p className="wd-hint" role="status">{locErr}</p>}
          </div>
          <div className="wd-ctl">
            <span className="wd-tagrow-label">Going for</span>
            <div className="wd-seg" role="radiogroup" aria-label="How dressed up">
              {DRESSINESS.map(d => (
                <button key={d.id} type="button" role="radio" aria-checked={dressiness === d.id} className={dressiness === d.id ? 'is-on' : ''} onClick={() => pick({ dressiness: d.id })}>{d.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="wd-ideas">
        <AnimatePresence mode="popLayout" initial={false}>
          {ideas.map((o, i) => {
            const v = verdict(o.score);
            const key = wearKey(o.slots);
            const worn = wornTodayKeys?.has(key);
            return (
              <motion.article key={`${seed}-${i}-${key}`} className="wd-idea" layout
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.06 } }} exit={{ opacity: 0, scale: 0.97 }}>
                <FlatLay slots={o.slots} urls={urls} />
                <div className="wd-idea-body">
                  <p className={`wd-verdict wd-verdict--${v.tone}`}><i aria-hidden="true" />{v.label}</p>
                  <ul className="wd-reasons">
                    {o.reasons.slice(0, 2).map(r => <li key={r}>{r}</li>)}
                    {o.warnings.slice(0, 1).map(r => <li key={r} className="is-warn">{r}</li>)}
                  </ul>
                  <div className="wd-idea-actions">
                    <button className="wd-btn wd-btn--sm" onClick={() => onWear(o.slots, key)} disabled={worn}><Check size={14} /> {worn ? 'Wearing it' : 'Wear today'}</button>
                    <button className="wd-icon-btn wd-icon-btn--line" onClick={() => onSave(o.slots)} aria-label="Save outfit" title="Save outfit"><Bookmark size={15} /></button>
                    <button className="wd-icon-btn wd-icon-btn--line" onClick={() => onTweak(o.slots)} aria-label="Tweak in the builder" title="Tweak in the builder"><SlidersHorizontal size={15} /></button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>
      {ideas.length > 0 && (
        <div className="wd-today-foot">
          <p className="wd-hint">{weather ? '' : 'Tip: pick the weather for better ideas. '}Built from your own pieces, on this device.</p>
          <button className="wd-btn wd-btn--ghost wd-btn--sm" onClick={() => setSeed(s => s + 1)}><Shuffle size={14} /> More ideas</button>
        </div>
      )}
    </section>
  );
}
