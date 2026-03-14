import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shirt, Layers, Wind, Footprints,
  ShoppingBag, ShoppingCart, ExternalLink, Loader2, Check, Plus, Sparkles,
  Battery, Droplets, Sun, Umbrella, Package,
} from 'lucide-react';
import { generateOutfitImage } from '../utils/geminiService';
import { searchAllCategories } from '../utils/productSearchService';

/* ── Theme tokens ─────────────────────────────────────────────────── */
const G = {
  gold:       '#c9b99a',
  goldMid:    'rgba(201,185,154,0.55)',
  goldDim:    'rgba(201,185,154,0.35)',
  goldFaint:  'rgba(201,185,154,0.07)',
  goldBorder: 'rgba(201,185,154,0.14)',
  surface:    '#111109',
  surfaceL:   '#161612',
  bg:         '#0d0d0a',
  text:       '#e8e2d5',
  textDim:    'rgba(232,226,213,0.55)',
  textFaint:  'rgba(232,226,213,0.28)',
  serif:      '"Cormorant Garant", Georgia, serif',
  sans:       '"Inter", -apple-system, sans-serif',
};

const CATEGORIES = ['top', 'bottom', 'outerwear', 'footwear'];
const CAT_LABELS  = { top: 'TOP', bottom: 'BOTTOM', outerwear: 'OUTERWEAR', footwear: 'FOOTWEAR' };
const CAT_ICONS   = {
  top:       <Shirt      size={13} strokeWidth={1.5} />,
  bottom:    <Layers     size={13} strokeWidth={1.5} />,
  outerwear: <Wind       size={13} strokeWidth={1.5} />,
  footwear:  <Footprints size={13} strokeWidth={1.5} />,
};
const BUDGETS = ['₹2,000', '₹5,000', '₹10,000', '₹20,000+'];

/* ── Divider label ───────────────────────────────────────────────── */
function DividerLabel({ children }) {
  return (
    <p style={{
      fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.18em',
      textTransform: 'uppercase', color: G.goldDim,
      fontFamily: G.sans, marginBottom: '0.5rem',
    }}>{children}</p>
  );
}

/* ── Survival icon helper ─────────────────────────────────────────── */
function getSurvivalIcon(item) {
  const l = item.toLowerCase();
  if (l.includes('power') || l.includes('bank') || l.includes('charg')) return <Battery size={13} strokeWidth={1.5} />;
  if (l.includes('water') || l.includes('bottle') || l.includes('hydrat')) return <Droplets size={13} strokeWidth={1.5} />;
  if (l.includes('fan') || l.includes('cool')) return <Wind size={13} strokeWidth={1.5} />;
  if (l.includes('bag') || l.includes('purse') || l.includes('clutch') || l.includes('crossbody')) return <ShoppingBag size={13} strokeWidth={1.5} />;
  if (l.includes('sun') || l.includes('spf') || l.includes('screen')) return <Sun size={13} strokeWidth={1.5} />;
  if (l.includes('umbrella') || l.includes('rain')) return <Umbrella size={13} strokeWidth={1.5} />;
  return <Package size={13} strokeWidth={1.5} />;
}

/* ── LEFT PANEL ──────────────────────────────────────────────────── */
function LeftPanel({ data, selections }) {
  const [expanded, setExpanded] = useState(false);
  const {
    outfit_name, outfit_description, style_tags = [],
    mandatory_accessories = [], general_crowd_style = {},
    mandatory_survival_items = [], stylist_tip,
  } = data;

  const crowdItems = (general_crowd_style.typical_items || []).filter(Boolean);
  const tagline = outfit_description
    ? outfit_description.split(/[.!?]/)[0].trim()
    : '';
  const hasMore = outfit_description && outfit_description.length > tagline.length + 5;

  return (
    <div style={{
      width: 232, flexShrink: 0,
      background: G.surface,
      borderRight: `1px solid rgba(201,185,154,0.08)`,
      padding: '1.75rem 1.125rem',
      overflowY: 'auto',
      display: 'flex', flexDirection: 'column', gap: '1.25rem',
    }}>

      {/* ── 1. Outfit Header ── */}
      <div>
        <p style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: G.goldDim, fontFamily: G.sans, marginBottom: '0.5rem' }}>
          Current Vibe
        </p>
        <h2 style={{ fontFamily: G.serif, fontSize: '1.6rem', fontWeight: 600, fontStyle: 'italic', color: G.text, lineHeight: 1.15, marginBottom: '0.4rem' }}>
          {outfit_name || 'Your Look'}
        </h2>
        {tagline && (
          <p style={{ fontSize: '0.7rem', color: G.textDim, lineHeight: 1.55, fontFamily: G.sans }}>
            {tagline}.
          </p>
        )}
        {/* Style DNA tags */}
        {style_tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.6rem' }}>
            {style_tags.map((tag, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                style={{
                  fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.08em',
                  color: G.gold, background: G.goldFaint,
                  border: `1px solid ${G.goldBorder}`,
                  borderRadius: 999, padding: '2px 7px',
                  fontFamily: G.sans, textTransform: 'uppercase',
                }}
              >{tag}</motion.span>
            ))}
          </div>
        )}
        {/* Show more toggle */}
        {hasMore && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              background: 'none', border: 'none', padding: '0.35rem 0 0',
              color: G.goldDim, fontSize: '0.58rem', cursor: 'pointer',
              fontFamily: G.sans, letterSpacing: '0.05em',
              display: 'flex', alignItems: 'center', gap: 3, boxShadow: 'none',
            }}
          >
            {expanded ? 'Show less ↑' : 'Read more ↓'}
          </button>
        )}
        <AnimatePresence>
          {expanded && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ fontSize: '0.7rem', color: G.textDim, lineHeight: 1.6, fontFamily: G.sans, marginTop: '0.375rem', overflow: 'hidden' }}
            >
              {outfit_description}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── 2. Selections ── */}
      <div>
        <DividerLabel>Selections</DividerLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {CATEGORIES.map(cat => {
            const catSels = selections[cat] || [];
            const hasAny = catSels.length > 0;
            return (
              <div key={cat} style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                padding: '0.5rem 0.625rem',
                background: hasAny ? G.goldFaint : 'rgba(255,255,255,0.02)',
                border: `1px solid ${hasAny ? G.goldBorder : 'rgba(255,255,255,0.05)'}`,
                borderRadius: 7, transition: 'all 0.2s',
              }}>
                <span style={{ color: hasAny ? G.gold : G.textFaint, marginTop: 1 }}>{CAT_ICONS[cat]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.1rem' }}>
                    <p style={{ fontSize: '0.48rem', fontWeight: 700, letterSpacing: '0.1em', color: hasAny ? G.goldDim : G.textFaint, textTransform: 'uppercase', fontFamily: G.sans }}>{CAT_LABELS[cat]}</p>
                    {catSels.length > 1 && (
                      <span style={{ fontSize: '0.42rem', fontWeight: 800, color: '#0d0d0a', background: G.gold, borderRadius: 3, padding: '1px 5px', fontFamily: G.sans }}>
                        {catSels.length}
                      </span>
                    )}
                  </div>
                  {catSels.length === 0 ? (
                    <p style={{ fontSize: '0.68rem', color: G.textFaint, fontFamily: G.sans }}>—</p>
                  ) : catSels.map((item, idx) => (
                    <p key={idx} style={{
                      fontSize: '0.65rem', color: G.text, fontWeight: 500,
                      fontFamily: G.sans, lineHeight: 1.3,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{item.name}</p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. Accessories ── */}
      {mandatory_accessories.length > 0 && (
        <div>
          <DividerLabel>Accessories</DividerLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {mandatory_accessories.map((a, i) => (
              <span key={i} style={{
                fontSize: '0.62rem', color: G.textDim,
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid rgba(255,255,255,0.07)`,
                borderRadius: 999, padding: '2px 8px', fontFamily: G.sans,
              }}>{a}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. Crowd Style Insight ── */}
      {crowdItems.length > 0 && (
        <div>
          <DividerLabel>Crowd Style</DividerLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {crowdItems.slice(0, 4).map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: G.goldDim, flexShrink: 0 }} />
                <p style={{ fontSize: '0.68rem', color: G.textDim, fontFamily: G.sans, lineHeight: 1.4 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. Essentials (icon cards) ── */}
      {mandatory_survival_items.length > 0 && (
        <div>
          <DividerLabel>Essentials</DividerLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem' }}>
            {mandatory_survival_items.slice(0, 3).map((item, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid rgba(255,255,255,0.06)`,
                borderRadius: 8, padding: '0.5rem 0.3rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem',
                textAlign: 'center',
              }}>
                <span style={{ color: G.goldDim }}>{getSurvivalIcon(item)}</span>
                <p style={{ fontSize: '0.54rem', color: G.textDim, fontFamily: G.sans, lineHeight: 1.35 }}>
                  {item.split(' ').slice(0, 3).join(' ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 6. Stylist Tip ── */}
      {stylist_tip && (
        <div style={{
          background: G.goldFaint, border: `1px solid ${G.goldBorder}`,
          borderRadius: 8, padding: '0.75rem 0.875rem',
        }}>
          <p style={{ fontSize: '0.48rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: G.goldDim, fontFamily: G.sans, marginBottom: '0.4rem' }}>
            Stylist Tip
          </p>
          <p style={{
            fontSize: '0.7rem', color: G.text, lineHeight: 1.6,
            fontStyle: 'italic', fontFamily: G.serif,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
          }}>"{stylist_tip}"</p>
        </div>
      )}
    </div>
  );
}

/* ── CENTER PANEL ────────────────────────────────────────────────── */
function CenterPanel({ imageUrl, imgLoading, imgError, onVisualize, outfitName }) {
  return (
    <div style={{
      flex: 1,
      background: G.bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      borderRight: `1px solid rgba(201,185,154,0.06)`,
    }}>
      <AnimatePresence mode="wait">
        {imgLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              border: `3px solid ${G.goldFaint}`,
              borderTopColor: G.gold,
              animation: 'spin 0.9s linear infinite',
            }} />
            <p style={{ color: G.goldDim, fontSize: '0.875rem', fontFamily: G.sans, letterSpacing: '0.06em' }}>
              Generating your look…
            </p>
          </motion.div>

        ) : imageUrl ? (
          <motion.div
            key="image"
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{ width: '100%', height: '100%', position: 'relative' }}
          >
            <img
              src={imageUrl}
              alt="Outfit visualization"
              style={{
                width: '100%', height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
            {/* Gradient overlay at bottom */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: 120,
              background: `linear-gradient(to top, ${G.bg}, transparent)`,
              display: 'flex', alignItems: 'flex-end', padding: '1.5rem',
            }}>
              <button
                onClick={onVisualize}
                style={{
                  background: 'rgba(201,185,154,0.1)', border: `1px solid ${G.goldBorder}`,
                  color: G.gold, borderRadius: 8, padding: '0.5rem 1rem',
                  fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                  fontFamily: G.sans, letterSpacing: '0.04em',
                  display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: 'none', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,185,154,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,185,154,0.1)'; }}
              >
                ↺ Regenerate
              </button>
            </div>
          </motion.div>

        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', padding: '2rem', textAlign: 'center' }}
          >
            {/* Decorative outfit name */}
            <h1 style={{
              fontFamily: G.serif, fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 600,
              fontStyle: 'italic', color: 'rgba(201,185,154,0.15)', lineHeight: 1.1,
              userSelect: 'none', letterSpacing: '-0.01em',
            }}>
              {outfitName || 'Your Look'}
            </h1>

            {/* Visualize button */}
            <motion.button
              onClick={onVisualize}
              whileHover={{ y: -2, boxShadow: `0 8px 32px rgba(201,185,154,0.15)` }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.625rem',
                background: `linear-gradient(135deg, rgba(201,185,154,0.15), rgba(201,185,154,0.08))`,
                border: `1px solid ${G.goldBorder}`,
                color: G.gold,
                borderRadius: 10, padding: '0.875rem 1.75rem',
                fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer',
                fontFamily: G.sans, letterSpacing: '0.04em',
                boxShadow: `0 0 28px rgba(201,185,154,0.06)`,
                transition: 'all 0.2s',
              }}
            >
              <Sparkles size={16} strokeWidth={1.5} />
              Visualize My Outfit
            </motion.button>

            {imgError && (
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,100,100,0.7)', fontFamily: G.sans, maxWidth: 280, lineHeight: 1.5 }}>
                {imgError}
              </p>
            )}

            {/* Grid decorative bg */}
            <div style={{
              position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none',
              backgroundImage: `linear-gradient(rgba(201,185,154,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,185,154,0.03) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── AI Suggestion card (when no budget selected) ─────────────────── */
function AISuggestionCard({ option, selected, onSelect }) {
  return (
    <motion.div
      onClick={() => onSelect(option)}
      whileHover={{ y: -1 }}
      style={{
        background: selected ? G.goldFaint : 'rgba(255,255,255,0.02)',
        border: `1px solid ${selected ? G.goldBorder : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 9, padding: '0.75rem', cursor: 'pointer',
        position: 'relative', transition: 'all 0.2s',
        boxShadow: selected ? `0 0 16px rgba(201,185,154,0.08)` : 'none',
      }}
    >
      {selected && (
        <div style={{
          position: 'absolute', top: 7, right: 7,
          background: G.gold, color: '#0d0d0a',
          fontSize: '0.42rem', fontWeight: 800, letterSpacing: '0.12em',
          padding: '2px 6px', borderRadius: 3,
        }}>SELECTED</div>
      )}
      <p style={{
        fontFamily: G.serif, fontSize: '0.9rem', fontWeight: 600,
        color: G.text, marginBottom: '0.3rem', lineHeight: 1.25,
        paddingRight: selected ? '3.5rem' : 0,
      }}>{option.name}</p>
      <p style={{ fontSize: '0.6875rem', color: G.textFaint, lineHeight: 1.5, fontFamily: G.sans }}>
        {option.description}
      </p>
    </motion.div>
  );
}

/* ── Real product card ───────────────────────────────────────────── */
function ProductCard({ product, selected, onSelect }) {
  const hasUrl = product.url && product.url !== '#';

  return (
    <div
      onClick={() => onSelect(product)}
      style={{
        background: G.surfaceL,
        border: `1px solid ${selected ? G.goldBorder : 'rgba(255,255,255,0.05)'}`,
        borderRadius: 8, overflow: 'hidden', position: 'relative',
        boxShadow: selected ? `0 0 20px rgba(201,185,154,0.08)` : 'none',
        transition: 'all 0.2s', cursor: 'pointer',
      }}
    >
      {/* Product image */}
      <div style={{ aspectRatio: '3/4', background: '#1a1a13', overflow: 'hidden', position: 'relative' }}>
        {product.image ? (
          <img
            src={product.image} alt={product.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <ShoppingBag size={22} strokeWidth={1} style={{ color: G.textFaint }} />
          </div>
        )}

        {/* Selected badge */}
        {selected && (
          <div style={{
            position: 'absolute', top: 7, left: 7,
            background: G.gold, color: '#0d0d0a',
            fontSize: '0.42rem', fontWeight: 800, letterSpacing: '0.12em',
            padding: '2px 7px', borderRadius: 3,
          }}>SELECTED</div>
        )}

        {/* External link */}
        {hasUrl && (
          <button
            onClick={e => { e.stopPropagation(); window.open(product.url, '_blank', 'noopener,noreferrer'); }}
            style={{
              position: 'absolute', top: 7, right: 7,
              width: 24, height: 24, borderRadius: '50%',
              background: 'rgba(0,0,0,0.55)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.7)',
              boxShadow: 'none', padding: 0,
            }}
          >
            <ExternalLink size={10} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '0.5rem 0.625rem 0.625rem' }}>
        {product.store && (
          <p style={{
            fontSize: '0.48rem', fontWeight: 700, letterSpacing: '0.14em',
            color: G.goldDim, textTransform: 'uppercase',
            fontFamily: G.sans, marginBottom: '0.15rem',
          }}>{product.store}</p>
        )}
        <p style={{
          fontSize: '0.7rem', fontWeight: 600, color: G.text, lineHeight: 1.3,
          fontFamily: G.sans, marginBottom: '0.375rem',
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>{product.title}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: G.gold, fontFamily: G.sans }}>
            {product.price || '—'}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onSelect(product); }}
            style={{
              width: 22, height: 22, borderRadius: '50%',
              background: selected ? G.gold : 'rgba(201,185,154,0.1)',
              border: `1px solid ${selected ? G.gold : G.goldBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: selected ? '#0d0d0a' : G.gold,
              transition: 'all 0.18s', boxShadow: 'none', padding: 0,
            }}
          >
            {selected
              ? <Check size={10} strokeWidth={2.5} />
              : <Plus  size={10} strokeWidth={2.5} />
            }
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── RIGHT PANEL ─────────────────────────────────────────────────── */
function RightPanel({ data, selections, onSelect, onCheckout, activeBudget, setActiveBudget, shopResults, shopLoading, shopError }) {
  const [activeTab, setActiveTab] = useState('top');
  const clothing_options = data.clothing_options || {};

  const currentTabProducts = shopResults[activeTab] || [];
  const currentTabOptions  = clothing_options[activeTab] || [];
  const showRealProducts    = activeBudget && !shopLoading && !shopError && currentTabProducts.length > 0;

  return (
    <div style={{
      width: 336,
      flexShrink: 0,
      background: G.surface,
      borderLeft: `1px solid rgba(201,185,154,0.08)`,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '1.25rem 1.25rem 1rem',
        borderBottom: `1px solid rgba(201,185,154,0.07)`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <ShoppingBag size={14} strokeWidth={1.5} style={{ color: G.goldDim }} />
          <h3 style={{
            fontFamily: G.serif, fontSize: '1.2rem', fontWeight: 600,
            color: G.text, letterSpacing: '0.01em',
          }}>
            Shop This Look
          </h3>
        </div>
        <p style={{
          fontSize: '0.68rem', color: G.textFaint, fontFamily: G.sans,
          lineHeight: 1.5, marginBottom: '1rem',
        }}>
          Pick a budget and we'll find real products from brands online — matched to your outfit.
        </p>

        {/* Budget selector */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: `1px solid rgba(255,255,255,0.06)`,
          borderRadius: 10, padding: '0.75rem 0.875rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <p style={{
              fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: G.goldDim, fontFamily: G.sans,
            }}>Your Budget</p>
            {activeBudget && (
              <motion.span
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.1em',
                  color: '#0d0d0a', background: G.gold,
                  borderRadius: 3, padding: '2px 6px', fontFamily: G.sans,
                }}
              >SEARCHING</motion.span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {BUDGETS.map(b => (
              <button
                key={b}
                onClick={() => setActiveBudget(prev => prev === b ? null : b)}
                style={{
                  background: activeBudget === b ? G.goldFaint : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${activeBudget === b ? G.gold : 'rgba(255,255,255,0.08)'}`,
                  color: activeBudget === b ? G.gold : G.textFaint,
                  borderRadius: 999, padding: '0.3rem 0.75rem',
                  fontSize: '0.72rem', fontWeight: 600,
                  fontFamily: G.sans, cursor: 'pointer',
                  transition: 'all 0.2s', boxShadow: activeBudget === b ? `0 0 12px rgba(201,185,154,0.12)` : 'none',
                }}
                onMouseEnter={e => { if (activeBudget !== b) { e.currentTarget.style.color = G.goldDim; e.currentTarget.style.borderColor = G.goldBorder; }}}
                onMouseLeave={e => { if (activeBudget !== b) { e.currentTarget.style.color = G.textFaint; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}}
              >{b}</button>
            ))}
          </div>
          {!activeBudget && (
            <p style={{
              fontSize: '0.6rem', color: 'rgba(232,226,213,0.2)',
              fontFamily: G.sans, marginTop: '0.5rem', fontStyle: 'italic',
            }}>
              ↑ Tap a range to browse real items
            </p>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid rgba(201,185,154,0.07)`,
        flexShrink: 0,
      }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            style={{
              flex: 1, padding: '0.625rem 0.25rem',
              background: 'transparent', border: 'none',
              borderBottom: activeTab === cat ? `2px solid ${G.gold}` : '2px solid transparent',
              color: activeTab === cat ? G.gold : G.textFaint,
              fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.12em',
              fontFamily: G.sans, cursor: 'pointer',
              transition: 'all 0.2s', boxShadow: 'none',
              marginBottom: -1,
            }}
          >
            {CAT_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Product / suggestion grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1rem 0' }}>
        {shopLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: '0.75rem' }}>
            <Loader2 size={20} strokeWidth={1.5} style={{ animation: 'spin 0.8s linear infinite', color: G.goldDim }} />
            <p style={{ fontSize: '0.75rem', color: G.textFaint, fontFamily: G.sans }}>Finding products…</p>
          </div>
        ) : shopError ? (
          <div style={{ padding: '1rem', background: 'rgba(255,100,100,0.05)', border: '1px solid rgba(255,100,100,0.15)', borderRadius: 8 }}>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,120,120,0.8)', fontFamily: G.sans, lineHeight: 1.5 }}>{shopError}</p>
          </div>
        ) : showRealProducts ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={`real-${activeTab}`}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}
            >
              {currentTabProducts.map((p, i) => (
                <ProductCard
                  key={i}
                  product={p}
                  selected={(selections[activeTab] || []).some(s => s.url === p.url && !!p.url)}
                  onSelect={item => onSelect(activeTab, { ...item, name: item.title, isReal: true })}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`ai-${activeTab}`}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
            >
              {activeBudget && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 6, marginBottom: '0.25rem' }}>
                  <Loader2 size={11} strokeWidth={2} style={{ color: G.goldDim, animation: 'spin 0.8s linear infinite' }} />
                  <p style={{ fontSize: '0.65rem', color: G.textFaint, fontFamily: G.sans }}>No results for this category — showing AI suggestions</p>
                </div>
              )}
              {!activeBudget && (
                <p style={{ fontSize: '0.65rem', color: G.textFaint, fontFamily: G.sans, marginBottom: '0.25rem' }}>
                  Select a budget to find real products ↑
                </p>
              )}
              {currentTabOptions.map((opt, i) => (
                <AISuggestionCard
                  key={i}
                  option={opt}
                  selected={(selections[activeTab] || []).some(s => s.name === opt.name && !s.isReal)}
                  onSelect={item => onSelect(activeTab, { ...item, isReal: false })}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Total ensemble bar */}
      <TotalEnsembleBar selections={selections} onCheckout={onCheckout} activeBudget={activeBudget} />
    </div>
  );
}

/* ── TOTAL ENSEMBLE BAR ──────────────────────────────────────────── */
function TotalEnsembleBar({ selections, onCheckout, activeBudget }) {
  const allItems = CATEGORIES.flatMap(cat => selections[cat] || []);
  const totalCount = allItems.length;

  const totalPrice = allItems.reduce((sum, item) => {
    if (!item?.price) return sum;
    const num = parseFloat(String(item.price).replace(/[^\d.]/g, ''));
    return isNaN(num) ? sum : sum + num;
  }, 0);

  const hasPrice = totalPrice > 0;

  return (
    <div style={{
      padding: '0.75rem 1.25rem',
      borderTop: `1px solid rgba(201,185,154,0.08)`,
      background: G.surface,
      flexShrink: 0,
    }}>
      {/* Mini cart list */}
      {totalCount > 0 && (
        <div style={{ marginBottom: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          {allItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
              <p style={{
                fontSize: '0.6rem', color: G.textDim, fontFamily: G.sans,
                overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1,
              }}>{item.name}</p>
              {item.price && (
                <span style={{ fontSize: '0.6rem', color: G.gold, fontFamily: G.sans, flexShrink: 0 }}>
                  {item.price}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary row + Checkout */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div>
          <p style={{
            fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.16em',
            textTransform: 'uppercase', color: G.goldDim,
            fontFamily: G.sans, marginBottom: '0.2rem',
          }}>Outfit Cart</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            {hasPrice ? (
              <span style={{ fontFamily: G.serif, fontSize: '1.4rem', fontWeight: 700, color: G.text, lineHeight: 1 }}>
                ₹{totalPrice.toLocaleString('en-IN')}
              </span>
            ) : (
              <span style={{ fontFamily: G.serif, fontSize: '1.1rem', fontWeight: 600, color: 'rgba(232,226,213,0.25)', fontStyle: 'italic', lineHeight: 1 }}>—</span>
            )}
            <span style={{ fontSize: '0.68rem', color: G.textFaint, fontFamily: G.sans }}>
              {totalCount} {totalCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          {/* Budget hint */}
          {totalCount > 0 && !activeBudget && (
            <p style={{
              fontSize: '0.58rem', color: 'rgba(201,185,154,0.45)',
              fontFamily: G.sans, marginTop: '0.25rem',
            }}>
              Select a budget above to checkout
            </p>
          )}
        </div>

        <motion.button
          onClick={totalCount > 0 && activeBudget ? onCheckout : undefined}
          whileHover={totalCount > 0 && activeBudget ? { scale: 1.03, boxShadow: `0 6px 24px rgba(201,185,154,0.25)` } : {}}
          whileTap={totalCount > 0 && activeBudget ? { scale: 0.97 } : {}}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            background: totalCount > 0 && activeBudget ? G.gold : 'rgba(201,185,154,0.07)',
            border: `1px solid ${totalCount > 0 && activeBudget ? G.gold : G.goldBorder}`,
            color: totalCount > 0 && activeBudget ? '#0d0d0a' : G.textFaint,
            borderRadius: 8, padding: '0.5rem 1rem',
            fontSize: '0.75rem', fontWeight: 700,
            fontFamily: G.sans, letterSpacing: '0.04em',
            cursor: totalCount > 0 && activeBudget ? 'pointer' : 'not-allowed',
            opacity: totalCount > 0 && activeBudget ? 1 : 0.45,
            transition: 'all 0.2s', boxShadow: 'none', flexShrink: 0,
          }}
        >
          <ShoppingCart size={13} strokeWidth={2} />
          Checkout
        </motion.button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
function Recommendation({ data }) {
  const {
    clothing_options = {},
    gender,
  } = data;

  const [selections, setSelections] = useState(() => {
    const init = {};
    CATEGORIES.forEach(cat => { init[cat] = []; });
    return init;
  });

  const [activeBudget, setActiveBudget] = useState(null);
  const [shopResults,  setShopResults]  = useState({});
  const [shopLoading,  setShopLoading]  = useState(false);
  const [shopError,    setShopError]    = useState(null);
  const [imageUrl,     setImageUrl]     = useState(null);
  const [imgLoading,   setImgLoading]   = useState(false);
  const [imgError,     setImgError]     = useState(null);

  // Fetch products when budget changes
  useEffect(() => {
    if (!activeBudget) {
      setShopResults({});
      return;
    }
    const searchSelections = {};
    CATEGORIES.forEach(cat => {
      const opts = clothing_options[cat] || [];
      if (opts[0]) searchSelections[cat] = opts[0];
    });
    setShopLoading(true);
    setShopError(null);
    setShopResults({});
    searchAllCategories(searchSelections, activeBudget)
      .then(r => setShopResults(r))
      .catch(e => setShopError(e.message))
      .finally(() => setShopLoading(false));
  }, [activeBudget]);

  function handleSelect(cat, item) {
    setSelections(prev => {
      const current = prev[cat] || [];
      const idx = current.findIndex(s =>
        s.isReal && item.isReal ? s.url === item.url : s.name === item.name && s.isReal === item.isReal
      );
      return {
        ...prev,
        [cat]: idx >= 0 ? current.filter((_, i) => i !== idx) : [...current, item],
      };
    });
  }

  function handleCheckout() {
    const allItems = CATEGORIES.flatMap(cat => selections[cat] || []);
    if (allItems.length === 0) return;
    const realItems = allItems.filter(item => item.url && item.url !== '#');
    const aiItems   = allItems.filter(item => !item.url || item.url === '#');
    realItems.forEach(item => window.open(item.url, '_blank', 'noopener,noreferrer'));
    if (realItems.length === 0) {
      aiItems.forEach(item => {
        const q = encodeURIComponent(item.name);
        window.open(`https://www.google.com/search?q=${q}&tbm=shop`, '_blank', 'noopener,noreferrer');
      });
    }
  }

  async function handleVisualize() {
    setImgLoading(true);
    setImgError(null);
    setImageUrl(null);
    try {
      const url = await generateOutfitImage(
        {
          top:       selections.top?.[0]?.name,
          bottom:    selections.bottom?.[0]?.name,
          outerwear: selections.outerwear?.[0]?.name,
          footwear:  selections.footwear?.[0]?.name,
        },
        gender,
      );
      setImageUrl(url);
    } catch (err) {
      setImgError(err.message);
    } finally {
      setImgLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      style={{
        margin: '-3rem -1.5rem',
        display: 'flex',
        height: 'calc(100vh - 56px)',
        background: G.bg,
        overflow: 'hidden',
      }}
    >
      <LeftPanel data={data} selections={selections} />

      <CenterPanel
        imageUrl={imageUrl}
        imgLoading={imgLoading}
        imgError={imgError}
        onVisualize={handleVisualize}
        outfitName={data.outfit_name}
      />

      <RightPanel
        data={data}
        selections={selections}
        onSelect={handleSelect}
        onCheckout={handleCheckout}
        activeBudget={activeBudget}
        setActiveBudget={setActiveBudget}
        shopResults={shopResults}
        shopLoading={shopLoading}
        shopError={shopError}
      />
    </motion.div>
  );
}

export default Recommendation;
