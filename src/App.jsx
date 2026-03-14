import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LiquidPixelWave from './components/LiquidPixelWave';
import CurrentVibeCard from './components/CurrentVibeCard';
import Preferences from './components/Preferences';
import OccasionForm from './components/OccasionForm';
import Recommendation from './components/Recommendation';
import HomePage from './components/HomePage';
import { getGeminiOutfit } from './utils/geminiService';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 }
};

function App() {
  const [appStarted, setAppStarted] = useState(false);

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
  const [view, setView] = useState('form'); // 'form' | 'recommendation'
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
      setView('recommendation');
    } catch (err) {
      console.error('[Stylist] generateRecommendation failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!appStarted) {
    return <HomePage onGetStarted={() => setAppStarted(true)} />;
  }

  const navBtnStyle = {
    background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(240,240,240,0.5)', fontSize: '0.8125rem',
    fontFamily: 'var(--font)', padding: '0.375rem 0.875rem',
    borderRadius: 7, cursor: 'pointer', letterSpacing: '0.01em',
    transition: 'color 0.2s, border-color 0.2s', boxShadow: 'none',
  };

  return (
    <>
      {/* App sticky nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(8,8,8,0.88)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2rem', height: 56,
      }}>
        <button
          onClick={() => { setAppStarted(false); setRecommendation(null); setView('form'); setError(null); }}
          style={navBtnStyle}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(240,240,240,0.9)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(240,240,240,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
        >
          ← Home
        </button>
        <span style={{
          fontFamily: '"Cormorant Garant", Georgia, serif',
          fontSize: '1.1rem', fontWeight: 600, color: '#e8e2d5',
          letterSpacing: '0.01em',
        }}>
          Personal Stylist
        </span>
        {view === 'recommendation' ? (
          <button
            onClick={() => setView('form')}
            style={navBtnStyle}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(240,240,240,0.9)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(240,240,240,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            ← Back
          </button>
        ) : recommendation ? (
          <button
            onClick={() => setView('recommendation')}
            style={navBtnStyle}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(240,240,240,0.9)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(240,240,240,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            Resume Look →
          </button>
        ) : (
          <div style={{ width: 80 }} />
        )}
      </nav>

      <section id="main-content" style={{ position: 'relative', paddingTop: 56, overflow: view === 'recommendation' ? 'hidden' : 'visible' }}>
        {view !== 'recommendation' && <LiquidPixelWave />}
        <div className="app-container" style={{ position: 'relative', zIndex: 1, padding: view === 'recommendation' ? 0 : undefined }}>
          <AnimatePresence mode="wait">
            {!userPrefs ? (
              <motion.div key="prefs" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <Preferences onSave={setUserPrefs} />
              </motion.div>

            ) : view === 'form' && !isLoading && !error ? (
              <motion.div
                key="form"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ maxWidth: 660, margin: '0 auto' }}
              >
                {/* Resume banner — shown when a saved look exists */}
                {recommendation && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      marginBottom: '0.875rem',
                      padding: '0.625rem 1rem',
                      background: 'rgba(201,185,154,0.05)',
                      border: '1px solid rgba(201,185,154,0.13)',
                      borderRadius: 9,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(201,185,154,0.45)', fontFamily: 'var(--font)', marginBottom: '0.15rem' }}>
                        Saved Look
                      </p>
                      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e8e2d5', fontFamily: '"Cormorant Garant", Georgia, serif', fontStyle: 'italic' }}>
                        {recommendation.outfit_name}
                      </p>
                    </div>
                    <button
                      onClick={() => setView('recommendation')}
                      style={{
                        background: 'rgba(201,185,154,0.09)', border: '1px solid rgba(201,185,154,0.2)',
                        color: '#c9b99a', borderRadius: 7, padding: '0.35rem 0.75rem',
                        fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                        fontFamily: 'var(--font)', letterSpacing: '0.03em', boxShadow: 'none',
                      }}
                    >
                      Resume →
                    </button>
                  </motion.div>
                )}
                <CurrentVibeCard userPrefs={userPrefs} onEditProfile={() => { setUserPrefs(null); setRecommendation(null); setView('form'); }}>
                  <OccasionForm onSubmit={generateRecommendation} isLoading={isLoading} />
                </CurrentVibeCard>
              </motion.div>

            ) : isLoading ? (
              <motion.div
                key="loading"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ maxWidth: 480, margin: '4rem auto' }}
              >
                <GeminiLoadingCard />
              </motion.div>

            ) : error ? (
              <motion.div
                key="error"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ maxWidth: 480, margin: '4rem auto' }}
              >
                <ErrorCard message={error} onRetry={() => setError(null)} />
              </motion.div>

            ) : (
              <motion.div
                key="recommendation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Recommendation data={recommendation} />
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
