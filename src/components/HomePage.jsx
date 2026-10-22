import React, { lazy, Suspense } from 'react';
import { motion, MotionConfig } from 'framer-motion';
import LookbookHero from './LookbookHero';
import DotText from './DotText';
import StylingMatters from './StylingMatters';
import FeaturesSection from './FeaturesSection';

/* ════════════════════════════════════════════════
   DESIGN TOKENS — warm editorial palette
   Off-white ivories replace cold whites
═══════════════════════════════════════════════════ */
const C = {
  bg:         '#F9F7F4',
  bg2:        '#F4F1EC',
  surface:    '#EDE9E2',
  surface2:   '#E5E0D8',
  text:       '#0d0d0b',
  text2:      '#5c5549',
  text3:      '#9a9183',
  border:     '#DDD8CF',
  borderHv:   '#BDB7AC',
  dark:       '#0a0a0a',
  darkSurf:   '#141414',
  darkText:   '#f0f0f0',
  darkText2:  'rgba(240,240,240,0.55)',
  darkText3:  'rgba(240,240,240,0.28)',
};

// Map journey pulls in d3-geo + world data — keep it out of the hero's bundle
const StoryMap = lazy(() => import('./StoryMap'));

const sans   = '"Inter", -apple-system, BlinkMacSystemFont, sans-serif';
const serif  = '"Instrument Serif", Georgia, serif';
const ACCENT = '#E2571A';

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

/* ════════════════════════════════════════════════
   TYPE + ANIMATION PRIMITIVES (Campione-inspired)
═══════════════════════════════════════════════════ */
const serifHeading = (fontSize, color = C.text) => ({
  fontFamily: serif, fontWeight: 400, fontSize, color,
  lineHeight: 0.95, letterSpacing: '-0.03em',
});

// Per-word 3D stagger reveal
function AnimatedHeading({ text, style, delay = 0 }) {
  const words = text.split(' ');
  return (
    <div style={{ display: 'block', lineHeight: 'inherit', ...style }}>
      {words.map((word, i) => (
        <React.Fragment key={i}>
        {i > 0 && ' '}
        <motion.span
          initial={{ opacity: 0, rotateX: -30, rotateY: 20, y: 40 }}
          whileInView={{ opacity: 1, rotateX: 0, rotateY: 0, y: 0 }}
          viewport={{ once: true, margin: '-60px 0px' }}
          transition={{ type: 'spring', bounce: 0.3, duration: 0.7, delay: delay + i * 0.1 }}
          style={{
            display: 'inline-block',
            transformPerspective: 1500, transformOrigin: 'bottom center',
          }}
        >
          {word}
        </motion.span>
        </React.Fragment>
      ))}
    </div>
  );
}

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 28 },
  whileInView:{ opacity: 1, y: 0 },
  viewport:   { once: true, margin: '-40px 0px' },
  transition: { type: 'spring', bounce: 0.1, duration: 0.6, delay },
});

// "(How it works)" / "#Looks" style section label
function SectionLabel({ children, dark = false, delay = 0 }) {
  return (
    <motion.p {...fadeUp(delay)} style={{
      fontFamily: sans, fontSize: '0.75rem', fontWeight: 500,
      letterSpacing: '0.04em', color: dark ? C.darkText3 : C.text3,
      marginBottom: '1.25rem',
    }}>
      {children}
    </motion.p>
  );
}

function PrimaryButton({ children, onClick, style }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', bounce: 0.3, duration: 0.25 }}
      style={{
        background: ACCENT, color: '#fff', border: 'none', borderRadius: 999,
        padding: '0.95rem 1.9rem', fontSize: '0.9375rem', fontWeight: 600,
        fontFamily: sans, cursor: 'pointer', letterSpacing: '-0.01em',
        boxShadow: '0 8px 28px rgba(226,87,26,0.28)',
        ...style,
      }}
    >
      {children}
    </motion.button>
  );
}

/* ════════════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════════════ */
function Navbar({ onGetStarted, onOpenWardrobe }) {
  return (
    <motion.nav
      className="hp-nav"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
    >
      <button className="hp-nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        Personal Stylist<span className="hp-nav-logo-mark" aria-hidden="true" />
      </button>
      <div className="hp-nav-cells">
        {[
          { label: 'Features',    id: 'features' },
          { label: 'Story',       id: 'story' },
          { label: 'Why styling', id: 'why-styling' },
        ].map(({ label, id }) => (
          <button key={id} className="hp-nav-cell hp-nav-links" onClick={() => scrollTo(id)}>{label}</button>
        ))}
        <button className="hp-nav-cell" onClick={onOpenWardrobe}>Wardrobe</button>
        <button className="hp-nav-cell hp-nav-cta" onClick={onGetStarted}>Style my event</button>
      </div>
    </motion.nav>
  );
}

/* ════════════════════════════════════════════════
   HERO — lookbook frame (photo tiles circling the headline)
═══════════════════════════════════════════════════ */
function HeroSection({ onGetStarted }) {
  const rise = (delay) => ({
    initial:    { opacity: 0, y: 16 },
    animate:    { opacity: 1, y: 0 },
    transition: { type: 'spring', bounce: 0.15, duration: 0.8, delay },
  });

  return (
    <LookbookHero onGetStarted={onGetStarted}>
      <motion.h1 {...rise(0.15)} className="hp-lb-word">
        <DotText text="Stylist" color={ACCENT} />
        <span className="hp-sr-only">Stylist — your AI stylist for every event</span>
      </motion.h1>
      <motion.p {...rise(0.3)} className="hp-lb-sub">Event / Colour / Wardrobe</motion.p>
    </LookbookHero>
  );
}

/* ════════════════════════════════════════════════
   CTA SECTION
═══════════════════════════════════════════════════ */
function CTASection({ onGetStarted }) {
  return (
    <section style={{ padding: 'clamp(3rem, 6vw, 6rem) clamp(1rem, 4vw, 2.5rem) clamp(4.5rem, 10vw, 9rem)', background: C.bg }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px 0px' }}
          transition={{ type: 'spring', bounce: 0.1, duration: 0.7 }}
          style={{
            background: C.dark, borderRadius: 16,
            padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 4rem)',
            textAlign: 'center', overflow: 'hidden', position: 'relative',
          }}
        >
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 60% 50% at 50% 60%, rgba(226,87,26,0.12) 0%, transparent 70%)',
          }} />

          <div style={{ position: 'relative' }}>
            <SectionLabel dark>(Ready when you are)</SectionLabel>
            <AnimatedHeading text="Got something" delay={0.1} style={{ ...serifHeading('clamp(3rem, 8vw, 7rem)', '#fff'), textAlign: 'center' }} />
            <AnimatedHeading text="on the calendar?" delay={0.3} style={{ ...serifHeading('clamp(3rem, 8vw, 7rem)', ACCENT), fontStyle: 'italic', textAlign: 'center' }} />

            <motion.p {...fadeUp(0.5)} style={{
              fontFamily: sans, fontSize: '1rem', color: C.darkText2,
              maxWidth: 440, margin: '1.75rem auto 2.75rem', lineHeight: 1.75,
            }}>
              Tell us the occasion. We'll handle the rest, top to toe, in your budget.
            </motion.p>

            <motion.div {...fadeUp(0.6)}>
              <PrimaryButton onClick={onGetStarted} style={{ padding: '1.05rem 2.5rem', fontSize: '1rem' }}>
                Style my event →
              </PrimaryButton>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer style={{ background: C.bg, borderTop: `1px solid ${C.border}`, padding: '2rem clamp(1rem, 4vw, 2.5rem)' }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem',
      }}>
        <span style={{ fontFamily: serif, fontSize: '1.25rem', color: C.text, letterSpacing: '-0.02em' }}>
          Personal Stylist<span style={{ color: ACCENT }}>.</span>
        </span>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Features',     id: 'features' },
            { label: 'Story',        id: 'story' },
            { label: 'Why styling',  id: 'why-styling' },
          ].map(({ label, id }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                fontFamily: sans, fontSize: '0.8125rem', color: C.text3, transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = C.text2}
              onMouseLeave={e => e.currentTarget.style.color = C.text3}
            >
              {label}
            </button>
          ))}
        </div>

        <p style={{ fontFamily: sans, fontSize: '0.75rem', color: C.text3 }}>
          © 2026 Personal Stylist · Powered by Gemini
        </p>
      </div>
    </footer>
  );
}

/* ════════════════════════════════════════════════
   ROOT EXPORT
═══════════════════════════════════════════════════ */
export default function HomePage({ onGetStarted, onOpenWardrobe }) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="hp-root" style={{ background: C.bg, minHeight: '100vh', overflowX: 'clip' }}>
        <Navbar onGetStarted={onGetStarted} onOpenWardrobe={onOpenWardrobe} />
        <HeroSection onGetStarted={onGetStarted} />
        <FeaturesSection onGetStarted={onGetStarted} onOpenWardrobe={onOpenWardrobe} />
        <section id="story">
          <Suspense fallback={<div style={{ height: '100vh', background: '#F3EDE2' }} />}>
            <StoryMap onGetStarted={onGetStarted} />
          </Suspense>
        </section>
        <StylingMatters onGetStarted={onGetStarted} />
        <CTASection onGetStarted={onGetStarted} />
        <Footer />
      </div>
    </MotionConfig>
  );
}
