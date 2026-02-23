import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LiquidPixelWave from './components/LiquidPixelWave';
import Preferences from './components/Preferences';
import OccasionForm from './components/OccasionForm';
import Recommendation from './components/Recommendation';
import { generateArtistVector, calculateSimilarity } from './utils/styleEngine';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 }
};

const stagger = { animate: { transition: { staggerChildren: 0.06 } } };
const GARMENT_DATABASE = {
  top: [
    { name: "Silk Camisole", vectors: { minimal_loud: -0.5, fitted_oversized: -0.4, classic_experimental: -0.3, soft_edgy: -0.4, casual_glam: 0.6 }, weather: ["warm", "all"], gender: "F" },
    { name: "Structured Blazer", vectors: { minimal_loud: -0.3, fitted_oversized: -0.5, classic_experimental: -0.4, soft_edgy: 0.2, casual_glam: 0.4 }, weather: ["all", "cold"], gender: "any" },
    { name: "Graphic Mesh Bodysuit", vectors: { minimal_loud: 0.6, fitted_oversized: -0.6, classic_experimental: 0.5, soft_edgy: 0.4, casual_glam: 0.3 }, weather: ["warm", "all"], gender: "F" },
    { name: "Pima Cotton Tee", vectors: { minimal_loud: -0.8, fitted_oversized: -0.1, classic_experimental: -0.7, soft_edgy: -0.6, casual_glam: -0.5 }, weather: ["warm", "all"], gender: "any" },
    { name: "Reflective Tech Jersey", vectors: { minimal_loud: 0.4, fitted_oversized: 0.2, classic_experimental: 0.6, soft_edgy: 0.3, casual_glam: -0.2 }, weather: ["warm", "all"], gender: "any" },
    { name: "Victorian Corset Top", vectors: { minimal_loud: 0.3, fitted_oversized: -0.7, classic_experimental: 0.5, soft_edgy: -0.3, casual_glam: 0.4 }, weather: ["all"], gender: "F" },
    { name: "Metallic Fringe Vest", vectors: { minimal_loud: 0.8, fitted_oversized: -0.2, classic_experimental: 0.6, soft_edgy: 0.2, casual_glam: 0.7 }, weather: ["warm"], gender: "any" },
    { name: "Heavyweight Overshirt", vectors: { minimal_loud: -0.4, fitted_oversized: 0.4, classic_experimental: 0.2, soft_edgy: 0.3, casual_glam: -0.4 }, weather: ["cold", "all"], gender: "M" },
    { name: "Sheer Organza Shirt", vectors: { minimal_loud: -0.2, fitted_oversized: -0.3, classic_experimental: 0.6, soft_edgy: -0.4, casual_glam: 0.5 }, weather: ["warm"], gender: "any" },
    { name: "Compression Knit Top", vectors: { minimal_loud: -0.1, fitted_oversized: -0.4, classic_experimental: 0.4, soft_edgy: 0.5, casual_glam: -0.3 }, weather: ["all"], gender: "any" },
    { name: "Raw-edge Heavy Tee", vectors: { minimal_loud: -0.3, fitted_oversized: 0.3, classic_experimental: 0.4, soft_edgy: 0.4, casual_glam: -0.5 }, weather: ["all"], gender: "any" }
  ],
  bottom: [
    { name: "Tailored Trousers", vectors: { minimal_loud: -0.6, fitted_oversized: -0.5, classic_experimental: -0.4, soft_edgy: -0.2, casual_glam: 0.4 }, weather: ["all"], gender: "any" },
    { name: "Baggy Cargo Pants", vectors: { minimal_loud: 0.2, fitted_oversized: 0.8, classic_experimental: 0.3, soft_edgy: 0.4, casual_glam: -0.4 }, weather: ["all"], gender: "any" },
    { name: "Distressed Mini Skirt", vectors: { minimal_loud: 0.5, fitted_oversized: -0.4, classic_experimental: 0.2, soft_edgy: 0.5, casual_glam: -0.2 }, weather: ["warm"], gender: "F" },
    { name: "Wide-leg Raw Denim", vectors: { minimal_loud: -0.4, fitted_oversized: 0.5, classic_experimental: -0.3, soft_edgy: -0.2, casual_glam: -0.3 }, weather: ["all"], gender: "any" },
    { name: "Technical Biker Shorts", vectors: { minimal_loud: -0.2, fitted_oversized: -0.7, classic_experimental: 0.4, soft_edgy: 0.1, casual_glam: -0.5 }, weather: ["warm"], gender: "any" },
    { name: "Silver Hardware Chinos", vectors: { minimal_loud: -0.2, fitted_oversized: 0.1, classic_experimental: 0.2, soft_edgy: 0.4, casual_glam: -0.3 }, weather: ["all"], gender: "M" },
    { name: "Sequin Wide-leg Pants", vectors: { minimal_loud: 0.6, fitted_oversized: 0.4, classic_experimental: 0.4, soft_edgy: -0.3, casual_glam: 0.8 }, weather: ["all"], gender: "F" },
    { name: "Leather Racing Pants", vectors: { minimal_loud: 0.5, fitted_oversized: 0.2, classic_experimental: 0.4, soft_edgy: 0.7, casual_glam: -0.2 }, weather: ["all"], gender: "any" },
    { name: "Pleated Micro Skirt", vectors: { minimal_loud: 0.4, fitted_oversized: -0.6, classic_experimental: 0.5, soft_edgy: -0.5, casual_glam: 0.3 }, weather: ["warm"], gender: "F" }
  ],
  footwear: [
    { name: "Square-toe Leather Boots", vectors: { minimal_loud: -0.4, fitted_oversized: -0.5, classic_experimental: 0.2, soft_edgy: 0.3, casual_glam: 0.5 }, weather: ["all", "cold"], gender: "any" },
    { name: "Platform Sneakers", vectors: { minimal_loud: 0.5, fitted_oversized: 0.6, classic_experimental: 0.4, soft_edgy: -0.2, casual_glam: 0.2 }, weather: ["all"], gender: "any" },
    { name: "Avant-garde Thigh-highs", vectors: { minimal_loud: 0.7, fitted_oversized: -0.4, classic_experimental: 0.8, soft_edgy: 0.4, casual_glam: 0.6 }, weather: ["all"], gender: "F" },
    { name: "Leather Loafers", vectors: { minimal_loud: -0.7, fitted_oversized: -0.6, classic_experimental: -0.4, soft_edgy: -0.5, casual_glam: 0.3 }, weather: ["all"], gender: "any" },
    { name: "Technical Sandals", vectors: { minimal_loud: -0.1, fitted_oversized: -0.2, classic_experimental: 0.5, soft_edgy: 0.1, casual_glam: -0.6 }, weather: ["warm"], gender: "any" },
    { name: "Chunky Combat Boots", vectors: { minimal_loud: 0.2, fitted_oversized: 0.4, classic_experimental: 0.2, soft_edgy: 0.6, casual_glam: -0.4 }, weather: ["all", "cold", "rainy"], gender: "any" },
    { name: "Dad Shoes", vectors: { minimal_loud: 0.2, fitted_oversized: 0.5, classic_experimental: -0.2, soft_edgy: -0.4, casual_glam: -0.6 }, weather: ["all"], gender: "any" },
    { name: "Silver Pointed Stilettos", vectors: { minimal_loud: 0.4, fitted_oversized: -0.8, classic_experimental: 0.5, soft_edgy: -0.2, casual_glam: 0.8 }, weather: ["all"], gender: "F" }
  ],
  layering: [
    { name: "Nylon Windbreaker", vectors: { minimal_loud: 0.1, fitted_oversized: 0.5, classic_experimental: 0.4, soft_edgy: 0.4, casual_glam: -0.5 }, weather: ["windy", "rainy", "all"], gender: "any" },
    { name: "Distressed Bomber", vectors: { minimal_loud: 0.3, fitted_oversized: 0.6, classic_experimental: 0.2, soft_edgy: 0.5, casual_glam: -0.3 }, weather: ["cold", "all"], gender: "any" },
    { name: "Wool Overcoat", vectors: { minimal_loud: -0.6, fitted_oversized: -0.1, classic_experimental: -0.5, soft_edgy: -0.2, casual_glam: 0.3 }, weather: ["cold"], gender: "any" },
    { name: "Padded Vest", vectors: { minimal_loud: -0.1, fitted_oversized: 0.5, classic_experimental: -0.2, soft_edgy: 0.3, casual_glam: -0.6 }, weather: ["cold", "all"], gender: "any" },
    { name: "Sheer Trench Coat", vectors: { minimal_loud: -0.1, fitted_oversized: 0, classic_experimental: 0.6, soft_edgy: -0.3, casual_glam: 0.4 }, weather: ["warm", "all"], gender: "any" },
    { name: "Leather Racing Jacket", vectors: { minimal_loud: 0.5, fitted_oversized: 0.3, classic_experimental: 0.5, soft_edgy: 0.8, casual_glam: -0.2 }, weather: ["all", "cold"], gender: "any" },
    { name: "Oversized Denim Jacket", vectors: { minimal_loud: -0.1, fitted_oversized: 0.7, classic_experimental: -0.2, soft_edgy: 0.1, casual_glam: -0.3 }, weather: ["all"], gender: "any" }
  ]
};

const WEATHER_MAPPING = {
  'Sunny': 'warm',
  'Clear': 'warm',
  'Rainy': 'rainy',
  'Cold/Winter': 'cold',
  'Windy': 'windy'
};

function App() {
  const [userPrefs, setUserPrefs] = useState(() => {
    const saved = localStorage.getItem('personalStylistPrefs');
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (!parsed.sliders) {
      localStorage.removeItem('personalStylistPrefs');
      return null;
    }
    return parsed;
  });

  const [recommendation, setRecommendation] = useState(null);

  useEffect(() => {
    if (userPrefs) {
      localStorage.setItem('personalStylistPrefs', JSON.stringify(userPrefs));
    }
  }, [userPrefs]);

  const handlePersonalize = (prefs) => {
    setUserPrefs(prefs);
  };

  const generateRecommendation = (occasionData) => {
    const { sliders, gender } = userPrefs;
    const { occasion, weather, artist, location } = occasionData;

    const weatherTag = WEATHER_MAPPING[weather] || 'all';

    // --- STYLE INTELLIGENCE AGENT PIPELINE ---
    // Guessing genre for base vector selection
    let genreHint = 'neutral';
    if (occasion.toLowerCase().includes('techno') || artist.toLowerCase().includes('witte')) genreHint = 'techno';
    else if (artist.toLowerCase().includes('swift')) genreHint = 'pop';

    const artistVectorData = generateArtistVector(artist, genreHint);
    const artistVector = artistVectorData.artistStyleVector;

    // Filter Logic
    const filterGarments = (category) => {
      let filtered = GARMENT_DATABASE[category].filter(item => {
        // Gender match
        const genderMatch = item.gender === 'any' ||
          (gender === 'Feminine' && item.gender === 'F') ||
          (gender === 'Masculine' && item.gender === 'M');

        // Weather match
        const weatherMatch = item.weather.includes('all') || item.weather.includes(weatherTag);

        return genderMatch && weatherMatch;
      });

      // Score based on vector similarity
      const scored = filtered.map(item => {
        const score = calculateSimilarity(artistVector, item.vectors);
        return { ...item, score };
      });

      // Sort by score and take top 3
      return scored.sort((a, b) => b.score - a.score).slice(0, 3).map(i => i.name);
    };

    const getInspoImage = () => {
      const a = (artist || '').toLowerCase();
      const o = (occasion || '').toLowerCase();
      if (a.includes('swift')) return "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80";
      if (a.includes('harry')) return "https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&w=800&q=80";
      if (a.includes('witte') || o.includes('techno')) return "https://images.unsplash.com/photo-1574433013023-1f196654e99f?auto=format&fit=crop&w=800&q=80";
      if (o.includes('gallery') || o.includes('dinner')) return "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=800&q=80";
      return "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80";
    };

    setRecommendation({
      title: `${artist || 'Custom'} ${occasion}`,
      options: {
        top: filterGarments('top'),
        bottom: filterGarments('bottom'),
        footwear: filterGarments('footwear'),
        layering: filterGarments('layering'),
      },
      inspo: {
        artistStyle: artistVectorData.dominantSignals.join(', '),
        audienceStyle: `${occasion} Aesthetic`,
        vibe: sliders.minimalLoud > 50 ? 'Loud' : 'Minimal',
        image: getInspoImage(),
        artist: artist || ""
      },
      tips: [
        `Analysis dominant signals: ${artistVectorData.dominantSignals.join(', ')}.`,
        `Optimized for ${weather} conditions in ${location}.`
      ]
    });
  };

  return (
    <>
      <LiquidPixelWave />
      <div className="app-container" style={{ position: 'relative', zIndex: 1 }}>
        <motion.header
          initial="initial"
          animate="animate"
          variants={stagger}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <motion.h1
            variants={pageVariants}
            style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em' }}
          >
            Personal <span className="accent-text">Stylist</span>
          </motion.h1>
          <motion.p variants={pageVariants} style={{ color: 'var(--framer-text-secondary)', marginTop: '0.5rem', fontSize: '1.0625rem' }}>
            Your curated fashion companion for every occasion.
          </motion.p>
        </motion.header>

        <AnimatePresence mode="wait">
          {!userPrefs ? (
            <motion.div key="prefs" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <Preferences onSave={handlePersonalize} />
            </motion.div>
          ) : (
            <motion.div
              key="main"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={stagger}
              style={{
                display: 'grid',
                gridTemplateColumns: recommendation ? '1fr 1fr' : '1fr',
                gap: '2rem',
                alignItems: 'start'
              }}
            >
              <motion.section variants={pageVariants}>
                <motion.div
                  className="glass-card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                      Current Vibe: <span className="accent-text">{userPrefs.sliders.minimalLoud > 70 ? 'Loud' : userPrefs.sliders.minimalLoud < 30 ? 'Minimalist' : 'Balanced'} Aesthetic</span>
                    </h2>
                    <button
                      type="button"
                      onClick={() => setUserPrefs(null)}
                      style={{ background: 'transparent', color: 'var(--framer-text-secondary)', fontSize: '0.8125rem', padding: '0.25rem 0.5rem' }}
                    >
                      Edit Profile
                    </button>
                  </div>
                  <OccasionForm onSubmit={generateRecommendation} />
                </motion.div>
              </motion.section>

              {recommendation && (
                <motion.section
                  variants={pageVariants}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.1 }}
                >
                  <Recommendation data={recommendation} />
                </motion.section>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export default App;
