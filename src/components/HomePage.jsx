import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';

/* ── Design tokens (earthy luxury dark palette) ── */
const C = {
  bg:       '#0d0d0a',
  bg2:      '#131310',
  surface:  '#1a1a15',
  surface2: '#222219',
  border:   'rgba(255,255,255,0.07)',
  borderHv: 'rgba(255,255,255,0.13)',
  text:     '#e8e2d5',
  text2:    '#8a8575',
  text3:    '#57534a',
  accent:   '#c9b99a',   /* warm beige/gold */
  accentHv: '#d9ccb2',
  pink:     '#FF6B9D',   /* app accent for primary CTAs */
};

const serif = '"Cormorant Garant", Georgia, serif';
const sans  = 'var(--font)';

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] } }),
};

/* ════════════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════════════ */
function Navbar({ onGetStarted }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(13,13,10,0.88)' : 'rgba(13,13,10,0.4)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent',
        transition: 'all 0.35s ease',
        padding: '0 2.5rem',
      }}
    >
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64,
      }}>
        {/* Logo */}
        <span style={{ fontFamily: serif, fontSize: '1.25rem', fontWeight: 600, color: C.text, letterSpacing: '0.01em', cursor: 'default' }}>
          Personal Stylist
        </span>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {[
            { label: 'Aesthetic Explorer', id: 'features' },
            { label: 'Features', id: 'features' },
            { label: 'Lookbook', id: 'wardrobe' },
            { label: 'Pricing', id: 'cta' },
          ].map(({ label, id }) => (
            <button key={label} onClick={() => scrollTo(id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: C.text2, fontSize: '0.875rem', fontWeight: 500,
              fontFamily: sans, letterSpacing: '0.01em',
              transition: 'color 0.2s',
              padding: '4px 0',
            }}
              onMouseEnter={e => e.target.style.color = C.text}
              onMouseLeave={e => e.target.style.color = C.text2}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Profile icon */}
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: C.surface2, border: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.text2} strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          {/* CTA */}
          <button
            onClick={onGetStarted}
            style={{
              background: 'transparent',
              border: `1px solid ${C.border}`,
              color: C.text,
              fontFamily: sans, fontSize: '0.8125rem', fontWeight: 600,
              padding: '0.5rem 1.25rem', borderRadius: 8,
              cursor: 'pointer', letterSpacing: '0.02em',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.target.style.background = C.surface; e.target.style.borderColor = C.borderHv; }}
            onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.borderColor = C.border; }}
          >
            Get Started
          </button>
        </div>
      </div>
    </motion.nav>
  );
}

/* ════════════════════════════════════════════════
   HERO SECTION
═══════════════════════════════════════════════════ */
function HeroSection({ onGetStarted }) {
  return (
    <section style={{
      minHeight: '100vh',
      background: `radial-gradient(ellipse 80% 60% at 60% 40%, rgba(50,44,35,0.45) 0%, ${C.bg} 65%)`,
      display: 'flex', alignItems: 'center',
      padding: '0 2.5rem',
      paddingTop: 80,
      overflow: 'hidden',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>

        {/* Left: Text */}
        <motion.div variants={{ visible: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="visible">
          <motion.p variants={fadeUp} custom={0} style={{
            fontFamily: sans, fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: C.accent,
            marginBottom: '1.5rem',
          }}>
            AI-Powered Fashion Intelligence
          </motion.p>

          <motion.h1 variants={fadeUp} custom={1} style={{
            fontFamily: serif, fontWeight: 600, lineHeight: 1.06,
            color: C.text, marginBottom: '1.75rem',
          }}>
            <span style={{ display: 'block', fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontStyle: 'italic', fontWeight: 400 }}>
              Your
            </span>
            <span style={{ display: 'block', fontSize: 'clamp(3rem, 6.5vw, 5.5rem)', fontWeight: 700 }}>
              Personal Stylist
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} style={{
            fontFamily: sans, fontSize: '1.0625rem', color: C.text2,
            lineHeight: 1.7, maxWidth: 440, marginBottom: '2.5rem',
          }}>
            Experience a high-end fashion magazine digital edition tailored
            specifically to your unique silhouette and aesthetic preferences.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={onGetStarted}
              style={{
                background: C.text, color: C.bg,
                border: 'none', borderRadius: 8,
                padding: '0.875rem 2rem', fontSize: '0.9rem', fontWeight: 700,
                fontFamily: sans, cursor: 'pointer', letterSpacing: '0.02em',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.target.style.background = '#fff'; e.target.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.target.style.background = C.text; e.target.style.transform = 'none'; }}
            >
              Begin Your Transformation
            </button>
            <button
              onClick={() => document.getElementById('wardrobe')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                background: 'transparent', color: C.text2,
                border: `1px solid ${C.border}`, borderRadius: 8,
                padding: '0.875rem 2rem', fontSize: '0.9rem', fontWeight: 600,
                fontFamily: sans, cursor: 'pointer', letterSpacing: '0.02em',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = C.borderHv; }}
              onMouseLeave={e => { e.currentTarget.style.color = C.text2; e.currentTarget.style.borderColor = C.border; }}
            >
              View Lookbook
            </button>
          </motion.div>
        </motion.div>

        {/* Right: Fashion photo */}
        <motion.div
          initial={{ opacity: 0, x: 30, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ position: 'relative' }}
        >
          {/* Main photo container */}
          <div style={{
            borderRadius: 20,
            overflow: 'hidden',
            aspectRatio: '4/5',
            background: `linear-gradient(160deg, #2a2418 0%, #1a1512 50%, #231e15 100%)`,
            border: `1px solid ${C.border}`,
            position: 'relative',
          }}>
            <img
              src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=700&q=80"
              alt="Editorial fashion portrait"
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9, display: 'block' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
            {/* Subtle overlay gradient at bottom */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%',
              background: 'linear-gradient(to top, rgba(13,13,10,0.7), transparent)',
              pointerEvents: 'none',
            }} />
          </div>

          {/* Floating tag */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            style={{
              position: 'absolute', bottom: 24, left: 24,
              background: 'rgba(13,13,10,0.75)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${C.border}`,
              borderRadius: 10, padding: '0.6rem 0.875rem',
            }}
          >
            <p style={{ fontSize: '0.6875rem', color: C.accent, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 2 }}>Style Profile</p>
            <p style={{ fontSize: '0.8125rem', color: C.text, fontWeight: 600 }}>Aesthetic Analysis Active</p>
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════
   FEATURES SECTION  (bento grid)
═══════════════════════════════════════════════════ */
const FEATURES = [
  {
    id: 'aesthetic',
    title: 'Aesthetic Explorer',
    desc: 'A soft, warm-toned lens that reveals hidden patterns in your style history, predicting your next favorite trend.',
    img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80',
    large: true,
  },
  {
    id: 'color',
    title: 'Color Theory',
    desc: 'Analyzes wardrobe colors and seasonal palettes to ensure every piece resonates with your natural beauty.',
    colors: ['#c4b49a', '#9b8c78', '#7a6e5c'],
    large: false,
  },
  {
    id: 'wardrobe',
    title: 'Virtual Wardrobe',
    desc: 'Digitize your entire closet and let AI suggest daily outfits based on weather and occasion.',
    img: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=500&q=80',
    large: false,
  },
  {
    id: 'lookbooks',
    title: 'Curated Lookbooks',
    desc: 'Weekly digital editions of your style journey, presented in a high-fashion editorial layout.',
    large: false,
  },
];

function FeatureCard({ feature, style }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      variants={fadeUp}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.surface,
        border: `1px solid ${hovered ? C.borderHv : C.border}`,
        borderRadius: 16,
        overflow: 'hidden',
        transition: 'border-color 0.25s, transform 0.25s',
        transform: hovered ? 'translateY(-2px)' : 'none',
        position: 'relative',
        ...style,
      }}
    >
      {feature.img && (
        <div style={{
          height: feature.large ? 260 : 160,
          background: `linear-gradient(135deg, #1e1c16, #2a271e)`,
          overflow: 'hidden',
          position: 'relative',
        }}>
          <img
            src={feature.img}
            alt={feature.title}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              opacity: hovered ? 0.75 : 0.6,
              transition: 'opacity 0.4s, transform 0.5s',
              transform: hovered ? 'scale(1.04)' : 'scale(1)',
              display: 'block',
            }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        </div>
      )}

      {feature.colors && (
        <div style={{
          height: 120, background: C.surface,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '0 1.5rem', gap: '0.75rem',
        }}>
          {feature.colors.map((c, i) => (
            <div key={i} style={{
              width: 36, height: 36, borderRadius: '50%', background: c,
              boxShadow: `0 0 12px ${c}55`,
              transition: 'transform 0.2s',
              transform: hovered ? 'scale(1.1)' : 'scale(1)',
              transitionDelay: `${i * 40}ms`,
            }} />
          ))}
        </div>
      )}

      <div style={{ padding: '1.25rem 1.5rem', paddingBottom: '1.5rem' }}>
        <p style={{ fontFamily: serif, fontSize: '1.2rem', fontWeight: 600, color: C.text, marginBottom: '0.5rem' }}>
          {feature.title}
        </p>
        <p style={{ fontFamily: sans, fontSize: '0.8125rem', color: C.text2, lineHeight: 1.65 }}>
          {feature.desc}
        </p>
        {feature.large && (
          <p style={{
            marginTop: '1.25rem', fontSize: '0.75rem', color: C.accent, fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
          }}>
            Explore →
          </p>
        )}
      </div>
    </motion.div>
  );
}

function FeaturesSection() {
  return (
    <section id="features" style={{ padding: '7rem 2.5rem', background: C.bg }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{ marginBottom: '3.5rem' }}
        >
          <motion.p variants={fadeUp} style={{
            fontFamily: sans, fontSize: '0.6875rem', fontWeight: 600,
            letterSpacing: '0.18em', textTransform: 'uppercase', color: C.accent,
            marginBottom: '0.75rem',
          }}>
            Curated tools designed to refine your personal brand
          </motion.p>
          <motion.h2 variants={fadeUp} style={{
            fontFamily: serif, fontSize: 'clamp(2rem, 4vw, 3.25rem)',
            fontWeight: 600, color: C.text, lineHeight: 1.1,
          }}>
            Sophisticated Features
          </motion.h2>
        </motion.div>

        {/* Bento grid */}
        <motion.div
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gridTemplateRows: 'auto auto',
            gap: '1.25rem',
          }}
        >
          {/* Large left card */}
          <FeatureCard feature={FEATURES[0]} style={{ gridRow: '1 / 3' }} />

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <FeatureCard feature={FEATURES[1]} style={{}} />
            <FeatureCard feature={FEATURES[2]} style={{}} />
            <FeatureCard feature={FEATURES[3]} style={{}} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════
   WARDROBE MANAGEMENT SECTION
═══════════════════════════════════════════════════ */
const WARDROBE_FEATURES = [
  {
    num: '01',
    title: 'Virtual Fitting',
    desc: 'Try on curated pieces from world-renowned designers in a high-fidelity virtual environment using your precise digital twin.',
  },
  {
    num: '02',
    title: 'Style Evolution',
    desc: 'Watch your aesthetic mature over time with longitudinal data tracking and progressive taste mapping.',
  },
  {
    num: '03',
    title: 'Global Trends',
    desc: 'Real-time insights from Paris, Milan, and Tokyo filtered through your personal style lens.',
  },
];

function WardrobeSection() {
  return (
    <section id="wardrobe" style={{ padding: '7rem 2.5rem', background: C.bg2 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center' }}>

        {/* Left: Text */}
        <motion.div
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          <motion.h2 variants={fadeUp} style={{
            fontFamily: serif, fontSize: 'clamp(2rem, 4vw, 3.25rem)',
            fontWeight: 600, color: C.text, lineHeight: 1.1,
            marginBottom: '1rem',
          }}>
            The Future of<br />
            <span style={{ fontStyle: 'italic', fontWeight: 400 }}>Wardrobe Management</span>
          </motion.h2>

          <motion.div variants={fadeUp} style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {WARDROBE_FEATURES.map((f) => (
              <div key={f.num} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                <span style={{
                  fontFamily: serif, fontSize: '0.8125rem', color: C.accent,
                  fontWeight: 600, letterSpacing: '0.05em', minWidth: 24, marginTop: 2,
                }}>
                  {f.num}
                </span>
                <div>
                  <p style={{ fontFamily: sans, fontSize: '0.9375rem', fontWeight: 700, color: C.text, marginBottom: '0.375rem' }}>
                    {f.title}
                  </p>
                  <p style={{ fontFamily: sans, fontSize: '0.8125rem', color: C.text2, lineHeight: 1.65 }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right: Wardrobe image */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ position: 'relative' }}
        >
          <div style={{
            borderRadius: 20, overflow: 'hidden',
            aspectRatio: '4/5',
            background: `linear-gradient(160deg, #1e1c14, #2e2820)`,
            border: `1px solid ${C.border}`,
            position: 'relative',
          }}>
            <img
              src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=700&q=80"
              alt="Organized wardrobe"
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8, display: 'block' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%',
              background: 'linear-gradient(to top, rgba(13,13,10,0.85), transparent)',
              pointerEvents: 'none',
            }} />
          </div>

          {/* Overlay recommendation card */}
          <div style={{
            position: 'absolute', bottom: 24, left: 24, right: 24,
            background: 'rgba(13,13,10,0.78)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: `1px solid ${C.border}`,
            borderRadius: 12, padding: '0.875rem 1.125rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ fontSize: '0.625rem', color: C.accent, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 4 }}>
                Weekly Recommendation
              </p>
              <p style={{ fontSize: '0.875rem', color: C.text, fontWeight: 600, fontFamily: serif }}>
                Minimalist Fall Ensemble
              </p>
            </div>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: C.surface2, border: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <span style={{ color: C.text2, fontSize: '0.875rem', lineHeight: 1 }}>+</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════
   EVENT OUTFIT GENERATOR SECTION
═══════════════════════════════════════════════════ */
function EventSection({ onGetStarted }) {
  return (
    <section id="event-gen" style={{ padding: '7rem 2.5rem', background: C.bg }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <motion.div
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{ textAlign: 'center', marginBottom: '3.5rem' }}
        >
          <motion.p variants={fadeUp} style={{
            fontFamily: sans, fontSize: '0.6875rem', fontWeight: 600,
            letterSpacing: '0.18em', textTransform: 'uppercase', color: C.accent,
            marginBottom: '0.75rem',
          }}>
            Event-Driven Intelligence
          </motion.p>
          <motion.h2 variants={fadeUp} style={{
            fontFamily: serif, fontSize: 'clamp(2rem, 4vw, 3.25rem)',
            fontWeight: 600, color: C.text, lineHeight: 1.1,
          }}>
            Dress Perfectly for Every Event
          </motion.h2>
          <motion.p variants={fadeUp} style={{
            fontFamily: sans, fontSize: '1rem', color: C.text2, marginTop: '1rem',
            maxWidth: 520, margin: '1rem auto 0',
          }}>
            Let AI analyze your event, venue, and wardrobe to suggest the perfect outfit.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          style={{
            maxWidth: 760, margin: '0 auto',
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 20, padding: '2.5rem',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Event Type', options: ['Concert', 'Wedding', 'Office', 'Date Night', 'Party', 'Casual Hangout'] },
              { label: 'Venue', options: ['Indoor', 'Outdoor', 'Rooftop', 'Beach', 'Club', 'Formal Hall'] },
              { label: 'Time of Day', options: ['Day', 'Evening', 'Night'] },
            ].map(({ label, options }) => (
              <div key={label}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: C.text2, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.5rem', fontFamily: sans }}>
                  {label}
                </label>
                <select style={{
                  width: '100%', background: C.surface2, color: C.text,
                  border: `1px solid ${C.border}`, borderRadius: 8,
                  padding: '0.6rem 0.875rem', fontFamily: sans, fontSize: '0.875rem',
                  cursor: 'pointer', outline: 'none',
                  appearance: 'none', WebkitAppearance: 'none',
                }}>
                  {options.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={onGetStarted}
              style={{
                background: C.text, color: C.bg,
                border: 'none', borderRadius: 8,
                padding: '0.875rem 2.5rem', fontSize: '0.9rem', fontWeight: 700,
                fontFamily: sans, cursor: 'pointer', letterSpacing: '0.02em',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.target.style.background = '#fff'; }}
              onMouseLeave={e => { e.target.style.background = C.text; }}
            >
              Generate Outfit ✦
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════
   CTA SECTION
═══════════════════════════════════════════════════ */
function CTASection({ onGetStarted }) {
  return (
    <section id="cta" style={{ padding: '5rem 2.5rem 7rem', background: C.bg2 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 24, padding: '5rem 3rem',
            textAlign: 'center',
            backgroundImage: `radial-gradient(ellipse 60% 70% at 50% 50%, rgba(201,185,154,0.06) 0%, transparent 70%)`,
          }}
        >
          <p style={{
            fontFamily: sans, fontSize: '0.6875rem', fontWeight: 600,
            letterSpacing: '0.18em', textTransform: 'uppercase', color: C.accent,
            marginBottom: '1.25rem',
          }}>
            Begin Your Journey
          </p>
          <h2 style={{
            fontFamily: serif, fontSize: 'clamp(2.25rem, 4.5vw, 3.75rem)',
            fontWeight: 600, color: C.text, lineHeight: 1.1, marginBottom: '1.25rem',
          }}>
            Refine Your<br />
            <span style={{ fontStyle: 'italic', fontWeight: 400 }}>Personal Brand</span>
          </h2>
          <p style={{
            fontFamily: sans, fontSize: '1rem', color: C.text2,
            maxWidth: 480, margin: '0 auto 2.5rem', lineHeight: 1.7,
          }}>
            Join a curated community of individuals who value the intersection of
            technology and classic sophistication.
          </p>
          <button
            onClick={onGetStarted}
            style={{
              background: 'transparent', color: C.text,
              border: `1px solid ${C.borderHv}`, borderRadius: 8,
              padding: '0.9rem 2.5rem', fontSize: '0.9rem', fontWeight: 600,
              fontFamily: sans, cursor: 'pointer', letterSpacing: '0.04em',
              transition: 'all 0.25s',
            }}
            onMouseEnter={e => { e.target.style.background = C.surface2; e.target.style.borderColor = C.accent; e.target.style.color = C.accent; }}
            onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.borderColor = C.borderHv; e.target.style.color = C.text; }}
          >
            Begin Your Consultation
          </button>
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
    <footer style={{
      background: C.bg,
      borderTop: `1px solid ${C.border}`,
      padding: '2.25rem 2.5rem',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem',
      }}>
        <span style={{ fontFamily: serif, fontSize: '1.05rem', fontWeight: 600, color: C.text2 }}>
          Personal Stylist
        </span>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {['Privacy', 'Terms', 'Press', 'Contact'].map(link => (
            <a key={link} href="#" style={{
              fontFamily: sans, fontSize: '0.8125rem', color: C.text3,
              textDecoration: 'none', transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.target.style.color = C.text2}
              onMouseLeave={e => e.target.style.color = C.text3}
            >
              {link}
            </a>
          ))}
        </div>

        <p style={{ fontFamily: sans, fontSize: '0.75rem', color: C.text3 }}>
          © 2026 Personal Stylist AI Digital Edition
        </p>
      </div>
    </footer>
  );
}

/* ════════════════════════════════════════════════
   ROOT COMPONENT
═══════════════════════════════════════════════════ */
export default function HomePage({ onGetStarted }) {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', overflowX: 'hidden' }}>
      <Navbar onGetStarted={onGetStarted} />
      <HeroSection onGetStarted={onGetStarted} />
      <FeaturesSection />
      <EventSection onGetStarted={onGetStarted} />
      <WardrobeSection />
      <CTASection onGetStarted={onGetStarted} />
      <Footer />
    </div>
  );
}
