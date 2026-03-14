import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music2, Wine, Utensils, Gem, Tent, Sparkles, Briefcase, Leaf,
  Sun, Sunset, Moon,
  Building2, Building, TreePine, Headphones, Waves, Landmark,
  CloudSun, CloudFog, CloudRain, CloudSnow, CloudDrizzle, CloudLightning,
  Check, Loader2, ChevronRight, ArrowLeft,
} from 'lucide-react';
import { RippleButton } from './ui/ripple-button';

/* ── Theme tokens ─────────────────────────────────────────────────── */
const G = {
  gold:       '#c9b99a',
  goldMid:    'rgba(201,185,154,0.55)',
  goldDim:    'rgba(201,185,154,0.35)',
  goldFaint:  'rgba(201,185,154,0.07)',
  goldBorder: 'rgba(201,185,154,0.15)',
  text:       '#e8e2d5',
  textDim:    'rgba(232,226,213,0.5)',
  textFaint:  'rgba(232,226,213,0.25)',
  serif:      '"Cormorant Garant", Georgia, serif',
  sans:       '"Inter", -apple-system, sans-serif',
};

/* ── Data ─────────────────────────────────────────────────────────── */
const OCCASIONS = [
  { id: 'Concert',    Icon: Music2    },
  { id: 'Party',      Icon: Wine      },
  { id: 'Dinner',     Icon: Utensils  },
  { id: 'Wedding',    Icon: Gem       },
  { id: 'Festival',   Icon: Tent      },
  { id: 'Date Night', Icon: Sparkles  },
  { id: 'Office',     Icon: Briefcase },
  { id: 'Casual',     Icon: Leaf      },
];

const TIMES = [
  { id: 'Day',     Icon: Sun    },
  { id: 'Evening', Icon: Sunset },
  { id: 'Night',   Icon: Moon   },
];

const VENUES = [
  { id: 'Rooftop Bar',      Icon: Building2  },
  { id: 'Indoor Arena',     Icon: Building   },
  { id: 'Outdoor Festival', Icon: TreePine   },
  { id: 'Club',             Icon: Headphones },
  { id: 'Beach Event',      Icon: Waves      },
  { id: 'Formal Hall',      Icon: Landmark   },
];

const STYLE_ENERGIES = [
  { id: 'Minimal',    desc: 'Clean lines, quiet luxury',     grad: 'linear-gradient(135deg, #c8bfb0, #e8e2d5)' },
  { id: 'Streetwear', desc: 'Urban edge, cultural codes',    grad: 'linear-gradient(135deg, #1c1a1a, #3a3030)' },
  { id: 'Elegant',    desc: 'Timeless, refined silhouettes', grad: 'linear-gradient(135deg, #a07840, #c8a060)' },
  { id: 'Edgy',       desc: 'Sharp cuts, bold contrast',     grad: 'linear-gradient(135deg, #3a0a5a, #7a1a9a)' },
  { id: 'Sporty',     desc: 'Athletic meets lifestyle',      grad: 'linear-gradient(135deg, #0a2a4a, #1a5a8a)' },
];

const COLOR_MOODS = [
  { id: 'Monochrome',  label: 'Mono',    colors: ['#1a1a1a', '#404040', '#787878', '#b4b4b4', '#e8e8e8'] },
  { id: 'Earth Tones', label: 'Earth',   colors: ['#4a2c1a', '#7a5c2a', '#b89050', '#d4b478', '#e8d0a8'] },
  { id: 'Vibrant Pop', label: 'Vibrant', colors: ['#FF6B9D', '#C084FC', '#60A5FA', '#34D399', '#FBBF24'] },
  { id: 'Soft Pastel', label: 'Pastel',  colors: ['#ffd1e3', '#e8d5ff', '#d1e8ff', '#d1ffe8', '#fff3d1'] },
  { id: 'Dark Mode',   label: 'Dark',    colors: ['#0d0d0a', '#1a1a14', '#C084FC', '#FF6B9D', '#60A5FA'] },
];

/* ── WMO weather code → description ──────────────────────────────── */
function wmoToDesc(code, isNight) {
  if (code === 0)  return isNight ? 'Clear Night' : 'Sunny';
  if (code <= 2)   return 'Partly Cloudy';
  if (code === 3)  return 'Overcast';
  if (code <= 49)  return 'Foggy';
  if (code <= 67)  return 'Rainy';
  if (code <= 77)  return 'Snowy';
  if (code <= 82)  return 'Showers';
  if (code <= 99)  return 'Thunderstorm';
  return isNight ? 'Clear Night' : 'Sunny';
}

/* ── Section label ───────────────────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.875rem' }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${G.goldBorder})` }} />
      <span style={{
        fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.2em',
        textTransform: 'uppercase', color: G.goldDim,
        fontFamily: G.sans, whiteSpace: 'nowrap',
      }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${G.goldBorder}, transparent)` }} />
    </div>
  );
}

/* ── Selectable chip ─────────────────────────────────────────────── */
function SelectChip({ Icon, label, selected, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      style={{
        position: 'relative',
        background: selected ? G.goldFaint : 'rgba(255,255,255,0.02)',
        border: `1px solid ${selected ? G.goldBorder : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 9, padding: '0.5rem 0.625rem', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
        boxShadow: selected ? `0 0 16px rgba(201,185,154,0.1)` : 'none',
        transition: 'all 0.2s', minWidth: 0,
        color: selected ? G.gold : G.textFaint,
      }}
      onMouseEnter={e => {
        if (!selected) {
          e.currentTarget.style.borderColor = G.goldBorder;
          e.currentTarget.style.color = G.goldDim;
        }
      }}
      onMouseLeave={e => {
        if (!selected) {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
          e.currentTarget.style.color = G.textFaint;
        }
      }}
    >
      <Icon size={17} strokeWidth={1.5} />
      <span style={{
        fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.04em',
        color: selected ? G.text : G.textDim,
        fontFamily: G.sans, textAlign: 'center', lineHeight: 1.2,
        transition: 'color 0.2s',
      }}>{label}</span>
      {selected && (
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          style={{
            position: 'absolute', top: -5, right: -5,
            width: 14, height: 14, borderRadius: '50%',
            background: G.gold,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#0d0d0a',
          }}
        ><Check size={8} strokeWidth={3} /></motion.div>
      )}
    </motion.button>
  );
}

/* ── Time toggle ─────────────────────────────────────────────────── */
function TimeToggle({ value, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: '0.375rem',
      background: 'rgba(255,255,255,0.02)',
      border: `1px solid rgba(201,185,154,0.1)`,
      borderRadius: 10, padding: '0.25rem',
    }}>
      {TIMES.map(t => (
        <button
          key={t.id} type="button" onClick={() => onChange(t.id)}
          style={{
            flex: 1, padding: '0.5rem 0.25rem',
            borderRadius: 7, border: 'none', cursor: 'pointer',
            background: value === t.id ? G.goldFaint : 'transparent',
            color: value === t.id ? G.gold : G.textFaint,
            fontSize: '0.6875rem', fontWeight: 600,
            fontFamily: G.sans, letterSpacing: '0.04em',
            boxShadow: value === t.id ? `0 0 12px rgba(201,185,154,0.08)` : 'none',
            transition: 'all 0.2s',
          }}
        >
          <t.Icon size={13} strokeWidth={1.5} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} />
          {t.id}
        </button>
      ))}
    </div>
  );
}

/* ── Style Energy card ───────────────────────────────────────────── */
function StyleCard({ item, selected, onClick }) {
  return (
    <motion.button
      type="button" onClick={onClick} whileTap={{ scale: 0.97 }}
      style={{
        background: selected ? G.goldFaint : 'rgba(255,255,255,0.02)',
        border: `1px solid ${selected ? G.goldBorder : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 10, padding: '0.75rem 0.625rem', cursor: 'pointer', position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
        boxShadow: selected ? `0 0 20px rgba(201,185,154,0.1)` : 'none',
        transition: 'all 0.2s', flex: 1, minWidth: 0,
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = 'rgba(201,185,154,0.12)'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
    >
      <div style={{
        width: '100%', height: 36, borderRadius: 7,
        background: item.grad, opacity: selected ? 1 : 0.65,
        transition: 'opacity 0.2s',
      }} />
      <p style={{
        fontSize: '0.6875rem', fontWeight: 700, color: selected ? G.text : G.textDim,
        fontFamily: G.sans, transition: 'color 0.2s', textAlign: 'center',
      }}>{item.id}</p>
      <p style={{
        fontSize: '0.5625rem', color: G.textFaint, fontFamily: G.sans,
        lineHeight: 1.4, textAlign: 'center',
      }}>{item.desc}</p>
      {selected && (
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          style={{
            position: 'absolute', top: 6, right: 6,
            width: 15, height: 15, borderRadius: '50%',
            background: G.gold,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#0d0d0a',
          }}
        ><Check size={9} strokeWidth={3} /></motion.div>
      )}
    </motion.button>
  );
}

/* ── Color mood palette ──────────────────────────────────────────── */
function PaletteCard({ item, selected, onClick }) {
  return (
    <motion.button
      type="button" onClick={onClick} whileTap={{ scale: 0.97 }}
      style={{
        background: selected ? G.goldFaint : 'rgba(255,255,255,0.02)',
        border: `1px solid ${selected ? G.goldBorder : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 10, padding: '0.625rem 0.5rem',
        cursor: 'pointer', position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
        boxShadow: selected ? `0 0 18px rgba(201,185,154,0.1)` : 'none',
        transition: 'all 0.2s', flex: 1, minWidth: 0,
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = 'rgba(201,185,154,0.12)'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
    >
      <div style={{ display: 'flex', gap: 3 }}>
        {item.colors.map((c, i) => (
          <div key={i} style={{
            width: 14, height: 14, borderRadius: '50%',
            background: c, border: '1px solid rgba(255,255,255,0.08)',
          }} />
        ))}
      </div>
      <p style={{
        fontSize: '0.625rem', fontWeight: 700,
        color: selected ? G.text : G.textFaint,
        fontFamily: G.sans, transition: 'color 0.2s', textAlign: 'center',
      }}>{item.label}</p>
      {selected && (
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          style={{
            position: 'absolute', top: 4, right: 4,
            width: 13, height: 13, borderRadius: '50%',
            background: G.gold,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#0d0d0a',
          }}
        ><Check size={8} strokeWidth={3} /></motion.div>
      )}
    </motion.button>
  );
}

/* ── Weather chip ────────────────────────────────────────────────── */
function WeatherChip({ info, loading }) {
  return (
    <AnimatePresence>
      {(info || loading) && (
        <motion.div
          key="chip"
          initial={{ opacity: 0, y: -6, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -4, height: 0 }}
          transition={{ duration: 0.25 }}
          style={{ overflow: 'hidden', marginTop: '0.5rem' }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(201,185,154,0.05)',
            border: `1px solid ${G.goldBorder}`,
            borderRadius: 999, padding: '0.3rem 0.75rem',
          }}>
            {loading ? (
              <>
                <Loader2 size={12} strokeWidth={2} style={{ animation: 'spin 0.8s linear infinite', color: G.goldDim }} />
                <span style={{ fontSize: '0.6875rem', color: G.textDim, fontFamily: G.sans }}>Detecting weather…</span>
              </>
            ) : info ? (
              <>
                {info.code <= 2
                  ? <Sun size={13} strokeWidth={1.5} style={{ color: '#fbbf24' }} />
                  : info.code <= 3
                  ? <CloudSun size={13} strokeWidth={1.5} style={{ color: '#94a3b8' }} />
                  : info.code <= 49
                  ? <CloudFog size={13} strokeWidth={1.5} style={{ color: '#94a3b8' }} />
                  : info.code <= 67
                  ? <CloudRain size={13} strokeWidth={1.5} style={{ color: '#60a5fa' }} />
                  : info.code <= 77
                  ? <CloudSnow size={13} strokeWidth={1.5} style={{ color: '#bae6fd' }} />
                  : info.code <= 82
                  ? <CloudDrizzle size={13} strokeWidth={1.5} style={{ color: '#60a5fa' }} />
                  : <CloudLightning size={13} strokeWidth={1.5} style={{ color: '#a78bfa' }} />
                }
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: G.goldMid, fontFamily: G.sans }}>
                  {info.city} · {info.temp}°C · {info.desc}
                </span>
              </>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Step indicator ──────────────────────────────────────────────── */
function StepIndicator({ step }) {
  const Dot = ({ n }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        background: step >= n ? G.gold : 'transparent',
        border: `1.5px solid ${step >= n ? G.gold : 'rgba(201,185,154,0.2)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.6875rem', fontWeight: 700,
        color: step >= n ? '#0d0d0a' : 'rgba(201,185,154,0.3)',
        fontFamily: G.sans, transition: 'all 0.35s',
      }}>{n}</div>
      <span style={{
        fontSize: '0.5rem', letterSpacing: '0.12em', textTransform: 'uppercase',
        color: step === n ? G.goldMid : 'rgba(201,185,154,0.2)',
        fontFamily: G.sans, transition: 'color 0.35s',
      }}>{n === 1 ? 'Event' : 'Style'}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
      <Dot n={1} />
      <div style={{
        width: 64, height: 1.5, margin: '0 10px', marginBottom: 18,
        background: `linear-gradient(90deg, ${step >= 2 ? G.gold : 'rgba(201,185,154,0.2)'}, ${step >= 2 ? G.goldDim : 'rgba(201,185,154,0.1)'})`,
        transition: 'all 0.4s',
      }} />
      <Dot n={2} />
    </div>
  );
}

/* ── Styled input ────────────────────────────────────────────────── */
function GoldInput({ name, placeholder, value, onChange, required }) {
  return (
    <input
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      style={{
        width: '100%', padding: '0.75rem 1rem',
        background: 'rgba(201,185,154,0.04)',
        border: `1px solid rgba(201,185,154,0.14)`,
        borderRadius: 9, outline: 'none',
        color: G.text, fontFamily: G.sans, fontSize: '0.875rem',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onFocus={e => {
        e.target.style.borderColor = 'rgba(201,185,154,0.4)';
        e.target.style.boxShadow = '0 0 0 3px rgba(201,185,154,0.07)';
        e.target.style.background = 'rgba(201,185,154,0.06)';
      }}
      onBlur={e => {
        e.target.style.borderColor = 'rgba(201,185,154,0.14)';
        e.target.style.boxShadow = 'none';
        e.target.style.background = 'rgba(201,185,154,0.04)';
      }}
    />
  );
}

/* ════════════════════════════════════════════════
   MAIN FORM
═══════════════════════════════════════════════════ */
function OccasionForm({ onSubmit, isLoading = false }) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [formData, setFormData] = useState({
    occasion: 'Concert', time: 'Night', weather: 'Clear',
    location: '', venue: '', artist: '',
    styleEnergy: '', colorMood: '',
  });
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    if (!formData.location || formData.location.length < 3) {
      setWeatherInfo(null);
      return;
    }
    setWeatherLoading(true);
    const timer = setTimeout(async () => {
      try {
        const geo = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(formData.location)}&count=1&language=en&format=json`
        ).then(r => r.json());
        if (!geo.results?.[0]) { setWeatherInfo(null); setWeatherLoading(false); return; }
        const { latitude, longitude, name } = geo.results[0];

        const wx = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,apparent_temperature&timezone=auto`
        ).then(r => r.json());

        const temp = Math.round(wx.current.temperature_2m);
        const code = wx.current.weather_code;
        const desc = wmoToDesc(code, formData.time === 'Night');
        setWeatherInfo({ city: name, temp, code, desc });
        setFormData(prev => ({ ...prev, weather: desc }));
      } catch {
        setWeatherInfo(null);
      } finally {
        setWeatherLoading(false);
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [formData.location, formData.time]);

  const goNext = () => { setDirection(1); setStep(2); };
  const goBack = () => { setDirection(-1); setStep(1); };
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData); };
  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  const variants = {
    initial: (d) => ({ x: d > 0 ? 36 : -36, opacity: 0 }),
    animate: { x: 0, opacity: 1, transition: { duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] } },
    exit:    (d) => ({ x: d > 0 ? -36 : 36, opacity: 0, transition: { duration: 0.22, ease: [0.55, 0.06, 0.68, 0.19] } }),
  };

  return (
    <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
      <StepIndicator step={step} />

      <AnimatePresence mode="wait" custom={direction}>
        {step === 1 ? (
          <motion.div
            key="step1"
            custom={direction}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}
          >
            {/* Decorative step number */}
            <div style={{
              position: 'absolute', top: -40, right: -8, zIndex: 0, pointerEvents: 'none',
              fontFamily: G.serif, fontSize: '8rem', fontWeight: 700, lineHeight: 1,
              color: G.gold, opacity: 0.04, userSelect: 'none', letterSpacing: '-0.02em',
            }}>01</div>

            {/* Step title */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{
                fontFamily: G.serif, fontSize: '1.7rem', fontWeight: 600,
                color: G.text, lineHeight: 1.15, marginBottom: '0.25rem',
              }}>The Event</h2>
              <p style={{ fontSize: '0.8rem', color: G.goldDim, fontFamily: G.sans }}>
                Where are you headed?
              </p>
            </div>

            {/* Occasion */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <SectionLabel>Occasion</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                {OCCASIONS.map(o => (
                  <SelectChip
                    key={o.id} Icon={o.Icon} label={o.id}
                    selected={formData.occasion === o.id}
                    onClick={() => set('occasion', o.id)}
                  />
                ))}
              </div>
            </div>

            {/* Time */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <SectionLabel>When</SectionLabel>
              <TimeToggle value={formData.time} onChange={v => set('time', v)} />
            </div>

            {/* Location */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <SectionLabel>Location</SectionLabel>
              <GoldInput
                name="location"
                placeholder="e.g. Mumbai, New York, Tokyo"
                value={formData.location}
                onChange={e => set('location', e.target.value)}
                required
              />
              <WeatherChip info={weatherInfo} loading={weatherLoading} />
            </div>

            {/* Continue button */}
            <motion.button
              type="button"
              onClick={goNext}
              disabled={!formData.location}
              whileHover={formData.location ? { y: -1 } : {}}
              whileTap={formData.location ? { scale: 0.99 } : {}}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', padding: '13px 36px',
                background: formData.location
                  ? `linear-gradient(135deg, rgba(201,185,154,0.18), rgba(201,185,154,0.1))`
                  : 'rgba(255,255,255,0.02)',
                border: `1px solid ${formData.location ? G.goldBorder : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 10, cursor: formData.location ? 'pointer' : 'not-allowed',
                color: formData.location ? G.gold : G.textFaint,
                fontFamily: G.sans, fontSize: '0.9rem', fontWeight: 600,
                letterSpacing: '0.04em', transition: 'all 0.2s',
                boxShadow: formData.location ? '0 0 24px rgba(201,185,154,0.08)' : 'none',
              }}
            >
              Continue to Style
              <ChevronRight size={16} strokeWidth={2} />
            </motion.button>
          </motion.div>

        ) : (
          <motion.div
            key="step2"
            custom={direction}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}
          >
            {/* Decorative step number */}
            <div style={{
              position: 'absolute', top: -40, right: -8, zIndex: 0, pointerEvents: 'none',
              fontFamily: G.serif, fontSize: '8rem', fontWeight: 700, lineHeight: 1,
              color: G.gold, opacity: 0.04, userSelect: 'none', letterSpacing: '-0.02em',
            }}>02</div>

            {/* Step title */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{
                fontFamily: G.serif, fontSize: '1.7rem', fontWeight: 600,
                color: G.text, lineHeight: 1.15, marginBottom: '0.25rem',
              }}>Your Style</h2>
              <p style={{ fontSize: '0.8rem', color: G.goldDim, fontFamily: G.sans }}>
                Define the vibe you want to bring
              </p>
            </div>

            {/* Venue */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <SectionLabel>Venue</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                {VENUES.map(v => (
                  <SelectChip
                    key={v.id} Icon={v.Icon} label={v.id}
                    selected={formData.venue === v.id}
                    onClick={() => set('venue', v.id)}
                  />
                ))}
              </div>
            </div>

            {/* Style Energy */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <SectionLabel>Style Energy</SectionLabel>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {STYLE_ENERGIES.map(s => (
                  <StyleCard
                    key={s.id} item={s}
                    selected={formData.styleEnergy === s.id}
                    onClick={() => set('styleEnergy', formData.styleEnergy === s.id ? '' : s.id)}
                  />
                ))}
              </div>
            </div>

            {/* Color Mood */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <SectionLabel>Color Mood</SectionLabel>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {COLOR_MOODS.map(c => (
                  <PaletteCard
                    key={c.id} item={c}
                    selected={formData.colorMood === c.id}
                    onClick={() => set('colorMood', formData.colorMood === c.id ? '' : c.id)}
                  />
                ))}
              </div>
            </div>

            {/* Artist / Theme (optional) */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <SectionLabel>Artist / Theme <span style={{ fontWeight: 400 }}>(Optional)</span></SectionLabel>
              <GoldInput
                name="artist"
                placeholder="e.g. Taylor Swift, Rock Theme, Minimalist Gala"
                value={formData.artist}
                onChange={e => set('artist', e.target.value)}
              />
            </div>

            {/* Footer: Back + Submit */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              <motion.button
                type="button"
                onClick={goBack}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: '13px 18px',
                  background: 'transparent',
                  border: `1px solid rgba(201,185,154,0.14)`,
                  borderRadius: 10, cursor: 'pointer',
                  color: G.goldDim, fontFamily: G.sans, fontSize: '0.875rem',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.2s', boxShadow: 'none',
                  flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = G.gold; e.currentTarget.style.borderColor = G.goldBorder; }}
                onMouseLeave={e => { e.currentTarget.style.color = G.goldDim; e.currentTarget.style.borderColor = 'rgba(201,185,154,0.14)'; }}
              >
                <ArrowLeft size={14} strokeWidth={2} /> Back
              </motion.button>
              <RippleButton
                type="submit"
                className="shimmer-btn"
                style={{ flex: 1, opacity: isLoading ? 0.6 : 1, pointerEvents: isLoading ? 'none' : 'auto' }}
                whileHover={isLoading ? {} : { scale: 1.01 }}
                whileTap={isLoading ? {} : { scale: 0.99 }}
                rippleColor="rgba(255,255,255,0.28)"
                disabled={isLoading}
              >
                {isLoading ? 'Styling…' : 'Stylize Me ✦'}
              </RippleButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}

export default OccasionForm;
