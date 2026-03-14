import React from 'react';
import { motion } from 'framer-motion';

const serif = '"Cormorant Garant", Georgia, serif';

function getVibeLabel(sliders) {
  if (!sliders) return 'Balanced';
  const v = sliders.minimalLoud;
  if (v > 70) return 'Loud';
  if (v < 30) return 'Minimalist';
  return 'Balanced';
}

function CurrentVibeCard({ userPrefs, onEditProfile, children }) {
  const vibe = getVibeLabel(userPrefs?.sliders);

  return (
    <motion.div
      className="current-vibe-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Header */}
      <div className="current-vibe-card__header">
        <div className="current-vibe-card__vibe-wrap">
          <span style={{
            fontSize: '0.6rem', fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'rgba(240,240,240,0.3)', fontFamily: 'var(--font)',
          }}>
            Current Vibe
          </span>
          <motion.span
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              fontFamily: serif, fontSize: '1.3rem', fontWeight: 600,
              background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 50%, var(--accent-3) 100%)',
              backgroundSize: '300% 300%',
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradient-shift 5s ease infinite',
            }}
          >
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--accent)', flexShrink: 0,
              WebkitTextFillColor: 'initial',
              animation: 'glow-pulse 2s ease-in-out infinite',
              display: 'inline-block',
            }} />
            {vibe} Aesthetic
          </motion.span>
        </div>

        <motion.button
          type="button"
          className="current-vibe-card__edit-btn"
          onClick={onEditProfile}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Edit Profile
        </motion.button>
      </div>

      {/* Body */}
      <div className="current-vibe-card__body">
        {children}
      </div>
    </motion.div>
  );
}

export default CurrentVibeCard;
