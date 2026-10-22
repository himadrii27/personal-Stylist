import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CurrentVibeCard from './components/CurrentVibeCard';
import Preferences from './components/Preferences';
import OccasionForm from './components/OccasionForm';
import Recommendation from './components/Recommendation';
import HomePage from './components/HomePage';
import WardrobePage from './wardrobe/WardrobePage';
import { getGeminiOutfit } from './utils/geminiService';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 }
};

function App() {
  const [appStarted, setAppStarted] = useState(false);
  const [section, setSection] = useState('event');          // 'event' | 'wardrobe' once inside the app
  const [startOccasion, setStartOccasion] = useState(null);

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

  // each step of the flow starts at the top of the page
  useEffect(() => { window.scrollTo(0, 0); }, [appStarted, section, view, isLoading, error]);

  if (!appStarted) {
    return (
      <HomePage
        onGetStarted={(occ) => { setStartOccasion(typeof occ === 'string' ? occ : null); setSection('event'); setAppStarted(true); }}
        onOpenWardrobe={() => { setSection('wardrobe'); setAppStarted(true); }}
      />
    );
  }

  const goHome = () => { setAppStarted(false); setRecommendation(null); setView('form'); setError(null); };

  if (section === 'wardrobe') {
    return (
      <>
        <nav className="hp-nav">
          <button className="hp-nav-logo" onClick={goHome}>
            Personal Stylist<span className="hp-nav-logo-mark" aria-hidden="true" />
          </button>
          <div className="hp-nav-cells">
            <button className="hp-nav-cell hp-nav-links" onClick={goHome}>← Home</button>
            <button className="hp-nav-cell hp-nav-cta" onClick={() => setSection('event')}>Style my event</button>
          </div>
        </nav>
        <main style={{ paddingTop: 56, minHeight: '100vh' }}>
          <WardrobePage />
        </main>
      </>
    );
  }

  return (
    <>
      {/* Same header as the homepage: logo left, bordered cells right */}
      <nav className="hp-nav">
        <button className="hp-nav-logo" onClick={goHome}>
          Personal Stylist<span className="hp-nav-logo-mark" aria-hidden="true" />
        </button>
        <div className="hp-nav-cells">
          <button className="hp-nav-cell" onClick={goHome}>← Home</button>
          {view === 'recommendation' ? (
            <button className="hp-nav-cell hp-nav-cta" onClick={() => setView('form')}>← Brief</button>
          ) : recommendation ? (
            <button className="hp-nav-cell hp-nav-cta" onClick={() => setView('recommendation')}>Resume look →</button>
          ) : null}
        </div>
      </nav>

      <section id="main-content" style={{ position: 'relative', paddingTop: 56, overflow: view === 'recommendation' ? 'hidden' : 'visible' }}>
        <div className="app-container" style={{ position: 'relative', zIndex: 1, padding: view === 'recommendation' ? 0 : undefined, minHeight: 'calc(100vh - 56px)' }}>
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
                      background: 'rgba(43,38,32,0.06)',
                      border: '1px solid rgba(43,38,32,0.14)',
                      borderRadius: 9,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(226,87,26,0.45)', fontFamily: 'var(--font)', marginBottom: '0.15rem' }}>
                        Saved Look
                      </p>
                      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0d0d0b', fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic' }}>
                        {recommendation.outfit_name}
                      </p>
                    </div>
                    <button
                      onClick={() => setView('recommendation')}
                      style={{
                        background: 'rgba(43,38,32,0.1)', border: '1px solid rgba(43,38,32,0.22)',
                        color: '#E2571A', borderRadius: 7, padding: '0.35rem 0.75rem',
                        fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                        fontFamily: 'var(--font)', letterSpacing: '0.03em', boxShadow: 'none',
                      }}
                    >
                      Resume →
                    </button>
                  </motion.div>
                )}
                <CurrentVibeCard userPrefs={userPrefs} onEditProfile={() => { setUserPrefs(null); setRecommendation(null); setView('form'); }}>
                  <OccasionForm onSubmit={generateRecommendation} isLoading={isLoading} initialOccasion={startOccasion} />
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
        border: '3px solid rgba(226,87,26,0.15)',
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
      <p style={{ color: '#C0392B', fontWeight: 600, marginBottom: '0.5rem' }}>Something went wrong</p>
      <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>{message}</p>
      <button
        onClick={onRetry}
        style={{
          background: 'rgba(226,87,26,0.1)', border: '1px solid rgba(226,87,26,0.35)',
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
