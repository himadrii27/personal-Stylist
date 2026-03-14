import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RippleButton } from './ui/ripple-button';

const SLIDERS = [
  { id: 'minimalLoud',      labels: ['Minimal',  'Loud']         },
  { id: 'fittedOversized',  labels: ['Fitted',   'Oversized']    },
  { id: 'classicTrendy',    labels: ['Classic',  'Trendy']       },
  { id: 'sportyPolished',   labels: ['Sporty',   'Polished']     },
  { id: 'safeExperimental', labels: ['Safe',     'Experimental'] },
];

const GENS    = ['Gen Z', 'Millennial', 'Gen X', 'Boomer'];
const GENDERS = ['Feminine', 'Masculine', 'Non-binary/Unisex'];

function Preferences({ onSave }) {
  const [sliders, setSliders] = useState({
    minimalLoud: 50, fittedOversized: 50, classicTrendy: 50,
    sportyPolished: 50, safeExperimental: 50,
  });
  const [age, setAge]       = useState('Millennial');
  const [gender, setGender] = useState('Feminine');

  const handleSliderChange = (id, value) =>
    setSliders(prev => ({ ...prev, [id]: parseInt(value) }));

  const handleSubmit = (e) => { e.preventDefault(); onSave({ sliders, age, gender }); };

  return (
    <motion.div
      className="magic-card"
      style={{ maxWidth: '560px', margin: '2rem auto', padding: '2.5rem' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <span style={{
          display: 'inline-block',
          fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--accent)',
          background: 'rgba(255,107,157,0.1)', padding: '4px 14px',
          borderRadius: '999px', border: '1px solid rgba(255,107,157,0.22)',
          marginBottom: '0.875rem',
        }}>
          Style Profile
        </span>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>
          Define Your{' '}
          <span className="gradient-text">Aesthetic</span>
        </h2>
        <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', marginTop: '0.4rem' }}>
          Adjust the dials to reflect your personal style.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Sliders */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="section-divider">Style Dimensions</div>

          {SLIDERS.map((s, i) => {
            const val = sliders[s.id];
            return (
              <motion.div
                key={s.id}
                style={{ marginBottom: '1.35rem' }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
              >
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: '0.45rem', fontSize: '0.8125rem',
                }}>
                  <span style={{
                    color: val < 42 ? 'var(--accent)' : 'var(--text-3)',
                    fontWeight: val < 42 ? 600 : 400,
                    transition: 'color 0.2s',
                  }}>
                    {s.labels[0]}
                  </span>
                  <span style={{
                    fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-3)',
                    background: 'rgba(255,255,255,0.05)', padding: '1px 9px',
                    borderRadius: '999px', border: '1px solid var(--border)',
                    minWidth: '32px', textAlign: 'center',
                  }}>
                    {val}
                  </span>
                  <span style={{
                    color: val > 58 ? 'var(--accent-2)' : 'var(--text-3)',
                    fontWeight: val > 58 ? 600 : 400,
                    transition: 'color 0.2s',
                  }}>
                    {s.labels[1]}
                  </span>
                </div>
                <input
                  type="range" min="0" max="100"
                  value={val}
                  onChange={(e) => handleSliderChange(s.id, e.target.value)}
                  style={{ width: '100%' }}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Generation + Gender */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
          <div>
            <label>Generation</label>
            <select value={age} onChange={(e) => setAge(e.target.value)}>
              {GENS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label>Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)}>
              {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        <RippleButton
          type="submit"
          className="shimmer-btn"
          style={{ width: '100%' }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          rippleColor="rgba(255,255,255,0.3)"
        >
          Generate My Palette ✦
        </RippleButton>
      </form>
    </motion.div>
  );
}

export default Preferences;
