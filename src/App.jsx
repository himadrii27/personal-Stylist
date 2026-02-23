import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LiquidPixelWave from './components/LiquidPixelWave';
import Preferences from './components/Preferences';
import OccasionForm from './components/OccasionForm';
import Recommendation from './components/Recommendation';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 }
};

const stagger = { animate: { transition: { staggerChildren: 0.06 } } };

// --- DATA LAYER ---
const GARMENT_DATABASE = {
  top: [
    { name: "Silk Camisole", vibes: ["minimalist", "polished"], weather: ["warm", "all"], gender: "F" },
    { name: "Structured Blazer", vibes: ["polished", "classic"], weather: ["all", "cold"], gender: "any" },
    { name: "Graphic Mesh Bodysuit", vibes: ["loud", "experimental"], weather: ["warm", "all"], gender: "F" },
    { name: "Pima Cotton Tee", vibes: ["minimalist", "classic"], weather: ["warm", "all"], gender: "any" },
    { name: "Reflective Tech Jersey", vibes: ["industrial", "sporty"], weather: ["warm", "all"], gender: "any" },
    { name: "Victorian Corset Top", vibes: ["experimental", "pop"], weather: ["all"], gender: "F" },
    { name: "Metallic Fringe Vest", vibes: ["loud", "experimental", "pop"], weather: ["warm"], gender: "any" },
    { name: "Heavyweight Overshirt", vibes: ["minimalist", "industrial"], weather: ["cold", "all"], gender: "M" },
    { name: "Sheer Organza Shirt", vibes: ["polished", "experimental"], weather: ["warm"], gender: "any" },
    { name: "Compression Knit Top", vibes: ["industrial", "techno"], weather: ["all"], gender: "any" },
    { name: "Raw-edge Heavy Tee", vibes: ["industrial", "minimalist"], weather: ["all"], gender: "any" }
  ],
  bottom: [
    { name: "Tailored Trousers", vibes: ["polished", "classic"], weather: ["all"], gender: "any" },
    { name: "Baggy Cargo Pants", vibes: ["industrial", "trendy"], weather: ["all"], gender: "any" },
    { name: "Distressed Mini Skirt", vibes: ["loud", "trendy"], weather: ["warm"], gender: "F" },
    { name: "Wide-leg Raw Denim", vibes: ["minimalist", "classic"], weather: ["all"], gender: "any" },
    { name: "Technical Biker Shorts", vibes: ["sporty", "industrial"], weather: ["warm"], gender: "any" },
    { name: "Silver Hardware Chinos", vibes: ["industrial", "polished"], weather: ["all"], gender: "M" },
    { name: "Sequin Wide-leg Pants", vibes: ["loud", "pop"], weather: ["all"], gender: "F" },
    { name: "Leather Racing Pants", vibes: ["loud", "industrial"], weather: ["all"], gender: "any" },
    { name: "Pleated Micro Skirt", vibes: ["trendy", "pop"], weather: ["warm"], gender: "F" }
  ],
  footwear: [
    { name: "Square-toe Leather Boots", vibes: ["polished", "classic"], weather: ["all", "cold"], gender: "any" },
    { name: "Platform Sneakers", vibes: ["trendy", "loud"], weather: ["all"], gender: "any" },
    { name: "Avant-garde Thigh-highs", vibes: ["experimental", "loud"], weather: ["all"], gender: "F" },
    { name: "Leather Loafers", vibes: ["polished", "classic"], weather: ["all"], gender: "any" },
    { name: "Technical Sandals", vibes: ["industrial", "sporty"], weather: ["warm"], gender: "any" },
    { name: "Chunky Combat Boots", vibes: ["industrial", "classic"], weather: ["all", "cold", "rainy"], gender: "any" },
    { name: "Dad Shoes", vibes: ["sporty", "trendy"], weather: ["all"], gender: "any" },
    { name: "Silver Pointed Stilettos", vibes: ["loud", "polished"], weather: ["all"], gender: "F" }
  ],
  layering: [
    { name: "Nylon Windbreaker", vibes: ["sporty", "industrial"], weather: ["windy", "rainy", "all"], gender: "any" },
    { name: "Distressed Bomber", vibes: ["trendy", "industrial"], weather: ["cold", "all"], gender: "any" },
    { name: "Wool Overcoat", vibes: ["classic", "polished"], weather: ["cold"], gender: "any" },
    { name: "Padded Vest", vibes: ["sporty", "industrial"], weather: ["cold", "all"], gender: "any" },
    { name: "Sheer Trench Coat", vibes: ["experimental", "polished"], weather: ["warm", "all"], gender: "any" },
    { name: "Leather Racing Jacket", vibes: ["loud", "industrial"], weather: ["all", "cold"], gender: "any" },
    { name: "Oversized Denim Jacket", vibes: ["classic", "trendy"], weather: ["all"], gender: "any" }
  ]
};

const ARTIST_MAPPING = {
  'swift': { vibes: ['pop', 'classic', 'polished'], desc: 'Eras Aesthetic' },
  'harry': { vibes: ['experimental', 'loud', 'trendy'], desc: 'Love on Tour Vibe' },
  'witte': { vibes: ['industrial', 'techno', 'minimalist'], desc: 'KNTXT Dark Aesthetic' },
  'techno': { vibes: ['industrial', 'minimalist', 'techno'], desc: 'Rave Ready' },
  'gala': { vibes: ['polished', 'experimental', 'loud'], desc: 'High Fashion' },
  'festival': { vibes: ['loud', 'sporty', 'trendy'], desc: 'Day Party' }
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
    const artistKey = Object.keys(ARTIST_MAPPING).find(key => artist.toLowerCase().includes(key));
    const artistData = artistKey ? ARTIST_MAPPING[artistKey] : null;

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

      // Score based on vibes
      const scored = filtered.map(item => {
        let score = 0;

        // Match artist vibes (high priority)
        if (artistData) {
          artistData.vibes.forEach(v => {
            if (item.vibes.includes(v)) score += 5;
          });
        }

        // Match slider vibes
        if (sliders.minimalLoud < 40 && item.vibes.includes('minimalist')) score += 3;
        if (sliders.minimalLoud > 60 && item.vibes.includes('loud')) score += 3;
        if (sliders.classicTrendy < 40 && item.vibes.includes('classic')) score += 3;
        if (sliders.classicTrendy > 60 && item.vibes.includes('trendy')) score += 3;
        if (sliders.sportyPolished < 40 && item.vibes.includes('sporty')) score += 3;
        if (sliders.sportyPolished > 60 && item.vibes.includes('polished')) score += 3;
        if (sliders.safeExperimental > 70 && item.vibes.includes('experimental')) score += 3;
        if (item.vibes.includes('industrial') && (artistData?.vibes.includes('industrial') || occasion.toLowerCase().includes('techno'))) score += 4;

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
      title: `${artistData ? artistData.desc : (artist || 'Custom')} ${occasion}`,
      options: {
        top: filterGarments('top'),
        bottom: filterGarments('bottom'),
        footwear: filterGarments('footwear'),
        layering: filterGarments('layering'),
      },
      inspo: {
        artistStyle: artistData ? artistData.desc : "Personal Vibe",
        audienceStyle: `${occasion} Aesthetic`,
        vibe: sliders.minimalLoud > 50 ? 'Loud' : 'Minimal',
        image: getInspoImage(),
        artist: artist || ""
      },
      tips: [
        `Optimized for ${weather} conditions in ${location}.`,
        artistData ? `Drawing inspiration from ${artist}'s signature palette.` : "Focusing on your unique style profile."
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
