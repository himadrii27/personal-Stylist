import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LiquidPixelWave from './components/LiquidPixelWave';
import InteractiveHero3D from './components/InteractiveHero3D';
import CurrentVibeCard from './components/CurrentVibeCard';
import Preferences from './components/Preferences';
import OccasionForm from './components/OccasionForm';
import Recommendation from './components/Recommendation';
import { getGeminiOutfit } from './utils/geminiService';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 }
};

const stagger = { animate: { transition: { staggerChildren: 0.06 } } };

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userPrefs) {
      localStorage.setItem('personalStylistPrefs', JSON.stringify(userPrefs));
    }
  }, [userPrefs]);

  const generateRecommendation = async (occasionData) => {
    setIsLoading(true);
    setError(null);
    setRecommendation(null);
    try {
      const result = await getGeminiOutfit(userPrefs, occasionData);
      setRecommendation({ ...result, gender: userPrefs.gender });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToMain = () => {
    document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <InteractiveHero3D onCtaClick={scrollToMain} />
      <section id="main-content" style={{ position: 'relative' }}>
        <LiquidPixelWave />
        <div className="app-container" style={{ position: 'relative', zIndex: 1 }}>
          <AnimatePresence mode="wait">
            {!userPrefs ? (
              <motion.div key="prefs" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <Preferences onSave={setUserPrefs} />
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
                  gridTemplateColumns: (recommendation || isLoading || error) ? '1fr 1fr' : '1fr',
                  gap: '2rem',
                  alignItems: 'start',
                }}
              >
                <motion.section variants={pageVariants}>
                  <CurrentVibeCard userPrefs={userPrefs} onEditProfile={() => { setUserPrefs(null); setRecommendation(null); }}>
                    <OccasionForm onSubmit={generateRecommendation} isLoading={isLoading} />
                  </CurrentVibeCard>
                </motion.section>

                <AnimatePresence mode="wait">
                  {isLoading && (
                    <motion.section
                      key="loading"
                      variants={pageVariants}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.3 }}
                    >
                      <GeminiLoadingCard />
                    </motion.section>
                  )}
                  {error && !isLoading && (
                    <motion.section
                      key="error"
                      variants={pageVariants}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ErrorCard message={error} onRetry={() => setError(null)} />
                    </motion.section>
                  )}
                  {recommendation && !isLoading && (
                    <motion.section
                      key="recommendation"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35, delay: 0.1 }}
                    >
                      <Recommendation data={recommendation} />
                    </motion.section>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </>
  );
}

function GeminiLoadingCard() {
  return (
    <div className="magic-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
      <div style={{
        width: 52, height: 52, margin: '0 auto 1.5rem',
        borderRadius: '50%',
        border: '3px solid rgba(255,107,157,0.15)',
        borderTopColor: 'var(--accent)',
        animation: 'spin 0.9s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: 'var(--text)', fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem' }}>
        Styling you up…
      </p>
      <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>
        Our AI stylist is crafting your look
      </p>
    </div>
  );
}

function ErrorCard({ message, onRetry }) {
  return (
    <div className="magic-card" style={{ padding: '2rem' }}>
      <p style={{ color: '#ff6b6b', fontWeight: 600, marginBottom: '0.5rem' }}>Something went wrong</p>
      <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>{message}</p>
      <button
        onClick={onRetry}
        style={{
          background: 'rgba(255,107,157,0.1)', border: '1px solid rgba(255,107,157,0.35)',
          color: 'var(--accent)', borderRadius: 'var(--radius-sm)',
          padding: '0.6rem 1.25rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
        }}
      >
        Dismiss
      </button>
    </div>
  );
}

export default App;
