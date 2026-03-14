import React from 'react';
import { motion } from 'framer-motion';

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
      <div className="current-vibe-card__header">
        <div className="current-vibe-card__vibe-wrap">
          <span className="current-vibe-card__label">Current Vibe</span>
          <motion.span
            className="current-vibe-card__badge"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <span className="current-vibe-card__badge-dot" aria-hidden />
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
      <div className="current-vibe-card__body">
        {children}
      </div>
    </motion.div>
  );
}

export default CurrentVibeCard;
