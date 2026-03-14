import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useMotionTemplate } from 'framer-motion';
import { Shirt, Layers, Wind, Footprints, ShoppingBag, ExternalLink, Loader2 } from 'lucide-react';
import { RippleButton } from './ui/ripple-button';
import { generateOutfitImage } from '../utils/geminiService';
import { searchAllCategories } from '../utils/productSearchService';

const serif = '"Cormorant Garant", Georgia, serif';

const CLOTHING_ICONS = {
  top:       <Shirt      size={15} strokeWidth={1.5} />,
  bottom:    <Layers     size={15} strokeWidth={1.5} />,
  outerwear: <Wind       size={15} strokeWidth={1.5} />,
  footwear:  <Footprints size={15} strokeWidth={1.5} />,
};
const CATEGORY_LABELS = { top: 'Top', bottom: 'Bottom', outerwear: 'Outerwear', footwear: 'Footwear' };
const CATEGORIES = ['top', 'bottom', 'outerwear', 'footwear'];

/* ── Spotlight card (mouse-tracking gradient) ── */
function SpotlightCard({ selected, onClick, children, accentColor = 'rgba(255,107,157,0.35)' }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const ref = useRef(null);

  const background = useMotionTemplate`radial-gradient(180px circle at ${mouseX}px ${mouseY}px, ${accentColor}, transparent 80%)`;

  function handlePointerMove(e) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={handlePointerMove}
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      style={{
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        borderRadius: 'var(--radius-sm)',
        border: selected
          ? '1.5px solid rgba(255,107,157,0.65)'
          : '1px solid var(--border)',
        background: selected
          ? 'linear-gradient(var(--surface), var(--surface)) padding-box, linear-gradient(135deg, rgba(255,107,157,0.65), rgba(192,132,252,0.55)) border-box'
          : 'rgba(255,255,255,0.025)',
        padding: '0.9rem 1rem',
        boxShadow: selected
          ? '0 0 22px rgba(255,107,157,0.2), inset 0 0 24px rgba(255,107,157,0.04)'
          : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
      }}
    >
      {/* spotlight overlay */}
      <motion.div
        style={{
          position: 'absolute', inset: 0, borderRadius: 'inherit',
          opacity: 0.6, pointerEvents: 'none', background,
        }}
      />
      {/* selected checkmark */}
      {selected && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          width: 18, height: 18, borderRadius: '50%',
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: '#fff', fontWeight: 700,
        }}>✓</div>
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </motion.div>
  );
}

/* ── One category row: label + 3 selectable option cards ── */
function CategorySelector({ category, options = [], selected, onSelect, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      style={{ marginBottom: '1.25rem' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
        <span style={{ fontSize: '0.75rem' }}>{CLOTHING_ICONS[category]}</span>
        <span style={{
          fontSize: '0.6rem', color: 'var(--accent)',
          textTransform: 'uppercase', letterSpacing: '0.16em',
          fontWeight: 700, fontFamily: 'var(--font)',
        }}>
          {CATEGORY_LABELS[category]}
        </span>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(255,107,157,0.2), transparent)' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
        {options.map((opt, i) => (
          <SpotlightCard
            key={i}
            selected={selected?.name === opt.name}
            onClick={() => onSelect(opt)}
          >
            <p style={{
              fontFamily: serif, fontSize: '0.9375rem', fontWeight: 600,
              color: 'var(--text)', marginBottom: '0.3rem', lineHeight: 1.25,
            }}>
              {opt.name}
            </p>
            <p style={{
              fontSize: '0.6875rem', color: 'var(--text-3)', lineHeight: 1.5,
            }}>
              {opt.description}
            </p>
          </SpotlightCard>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Budget pill (single-select) ── */
function BudgetPill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active
          ? 'linear-gradient(135deg, rgba(255,107,157,0.2), rgba(192,132,252,0.15))'
          : 'rgba(255,255,255,0.04)',
        border: active ? '1px solid rgba(255,107,157,0.5)' : '1px solid rgba(255,255,255,0.08)',
        color: active ? 'var(--text)' : 'var(--text-2)',
        borderRadius: 999,
        padding: '0.3rem 0.75rem',
        fontSize: '0.75rem', fontWeight: 600,
        fontFamily: 'var(--font)', cursor: 'pointer',
        boxShadow: active ? '0 0 12px rgba(255,107,157,0.15)' : 'none',
        transition: 'all 0.2s',
      }}
    >
      {label}
    </button>
  );
}

/* ── Product card ── */
function ProductCard({ product }) {
  const hasUrl = product.url && product.url !== '#';

  function handleClick(e) {
    e.stopPropagation();
    if (hasUrl) window.open(product.url, '_blank', 'noopener,noreferrer');
  }

  return (
    <motion.div
      onClick={handleClick}
      whileHover={{ y: -2, boxShadow: '0 4px 20px rgba(255,107,157,0.12)' }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10, overflow: 'hidden',
        transition: 'border-color 0.2s',
        cursor: hasUrl ? 'pointer' : 'default',
      }}
    >
      {/* Product image */}
      <div style={{
        width: '100%', height: 110,
        background: 'rgba(255,255,255,0.04)',
        overflow: 'hidden', position: 'relative',
      }}>
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShoppingBag size={24} strokeWidth={1} style={{ color: 'var(--text-3)' }} />
          </div>
        )}
        {hasUrl && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.5))',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
            padding: '0.375rem',
          }}>
            <ExternalLink size={11} strokeWidth={2} style={{ color: 'rgba(255,255,255,0.6)' }} />
          </div>
        )}
      </div>
      {/* Info */}
      <div style={{ padding: '0.5rem 0.625rem' }}>
        <p style={{
          fontSize: '0.625rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.35,
          fontFamily: 'var(--font)', marginBottom: '0.25rem',
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {product.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontSize: '0.6875rem', fontWeight: 700, color: 'var(--accent)',
            fontFamily: 'var(--font)',
          }}>
            {product.price || '—'}
          </span>
          {product.store && (
            <span style={{
              fontSize: '0.5rem', color: 'var(--text-3)', fontFamily: 'var(--font)',
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              {product.store}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Tag pill list ── */
function TagList({ items, color = 'var(--text-2)' }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
      {items.map((item, i) => (
        <span key={i} style={{
          fontSize: '0.8125rem', color,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border)',
          borderRadius: '999px',
          padding: '2px 10px', lineHeight: 1.6,
        }}>
          {item}
        </span>
      ))}
    </div>
  );
}

function Section({ title, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '1rem 1.125rem',
        marginBottom: '0.875rem',
      }}
    >
      <p style={{
        fontSize: '0.625rem', color: 'var(--accent)',
        textTransform: 'uppercase', letterSpacing: '0.12em',
        fontWeight: 600, marginBottom: '0.6rem',
      }}>
        {title}
      </p>
      {children}
    </motion.div>
  );
}

const BUDGETS = ['₹2,000', '₹5,000', '₹10,000', '₹20,000+'];

/* ── Final assembled outfit view ── */
function FinalOutfit({ selections, data, gender, onReselect }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState(null);
  const [activeBudget, setActiveBudget] = useState(null);
  const [shopResults, setShopResults] = useState({});
  const [shopLoading, setShopLoading] = useState(false);
  const [shopError, setShopError] = useState(null);

  useEffect(() => {
    if (!activeBudget) return;
    setShopLoading(true);
    setShopError(null);
    setShopResults({});
    searchAllCategories(selections, activeBudget)
      .then(results => setShopResults(results))
      .catch(err => setShopError(err.message))
      .finally(() => setShopLoading(false));
  }, [activeBudget]);

  async function handleVisualize() {
    setImgLoading(true);
    setImgError(null);
    setImageUrl(null);
    try {
      const url = await generateOutfitImage(
        {
          top: selections.top?.name,
          bottom: selections.bottom?.name,
          outerwear: selections.outerwear?.name,
          footwear: selections.footwear?.name,
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
      key="final"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Outfit name */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
          <h3 style={{
            fontFamily: serif, fontSize: '1.5rem', fontWeight: 600,
            letterSpacing: '0.02em',
          }}>
            <span className="gradient-text">{data.outfit_name || 'Your Look'}</span>
          </h3>
          <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, rgba(255,107,157,0.35), transparent)' }} />
        </div>
        {data.outfit_description && (
          <p style={{ fontSize: '0.8375rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
            {data.outfit_description}
          </p>
        )}
      </div>

      {/* Selected items summary grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
        {CATEGORIES.map((cat) => selections[cat] && (
          <div key={cat} style={{
            background: 'rgba(255,107,157,0.06)',
            border: '1px solid rgba(255,107,157,0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 0.875rem',
          }}>
            <p style={{
              fontSize: '0.6rem', color: 'var(--accent)',
              textTransform: 'uppercase', letterSpacing: '0.12em',
              fontWeight: 600, marginBottom: '0.25rem',
            }}>
              {CLOTHING_ICONS[cat]} {CATEGORY_LABELS[cat]}
            </p>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, marginBottom: '0.15rem' }}>
              {selections[cat].name}
            </p>
            <p style={{ fontSize: '0.7375rem', color: 'var(--text-3)', lineHeight: 1.4 }}>
              {selections[cat].description}
            </p>
          </div>
        ))}
      </div>

      {/* Accessories */}
      {data.mandatory_accessories?.length > 0 && (
        <Section title="✦ Accessories" delay={0.05}>
          <TagList items={data.mandatory_accessories} color="var(--text)" />
        </Section>
      )}

      {/* Crowd Vibe */}
      {data.general_crowd_style?.description && (
        <Section title="👥 Crowd Vibe" delay={0.1}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)', marginBottom: '0.6rem', lineHeight: 1.55 }}>
            {data.general_crowd_style.description}
          </p>
          {data.general_crowd_style.typical_items?.length > 0 && (
            <TagList items={data.general_crowd_style.typical_items} />
          )}
        </Section>
      )}

      {/* Survival Kit */}
      {data.mandatory_survival_items?.length > 0 && (
        <Section title="🎒 Survival Kit" delay={0.15}>
          <TagList items={data.mandatory_survival_items} />
        </Section>
      )}

      {/* Stylist Tip */}
      {data.stylist_tip && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          style={{
            background: 'rgba(255,107,157,0.05)',
            border: '1px solid rgba(255,107,157,0.18)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem 1.125rem',
            marginBottom: '1.25rem',
          }}
        >
          <p style={{
            fontSize: '0.625rem', color: 'var(--accent)',
            textTransform: 'uppercase', letterSpacing: '0.12em',
            fontWeight: 600, marginBottom: '0.4rem',
          }}>
            💡 Stylist Tip
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.6, fontStyle: 'italic' }}>
            "{data.stylist_tip}"
          </p>
        </motion.div>
      )}

      {/* Inline image preview */}
      <AnimatePresence>
        {imgLoading && (
          <motion.div
            key="img-loading"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              overflow: 'hidden',
              marginBottom: '1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(192,132,252,0.2)',
              background: 'rgba(192,132,252,0.04)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '2.5rem 1rem', gap: '0.875rem',
            }}
          >
            <span style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '3px solid rgba(192,132,252,0.2)',
              borderTopColor: 'rgba(192,132,252,0.9)',
              animation: 'spin 0.8s linear infinite',
              display: 'block',
            }} />
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', fontWeight: 500 }}>
              Generating your look…
            </p>
          </motion.div>
        )}

        {imageUrl && !imgLoading && (
          <motion.div
            key="img-result"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{ marginBottom: '1rem', position: 'relative' }}
          >
            <img
              src={imageUrl}
              alt="AI-generated outfit"
              style={{
                width: '100%',
                borderRadius: 10,
                display: 'block',
                boxShadow: '0 0 40px rgba(192,132,252,0.18), 0 0 80px rgba(255,107,157,0.1)',
              }}
            />
            <p style={{
              textAlign: 'center', marginTop: '0.5rem',
              fontSize: '0.7rem', color: 'var(--text-3)',
            }}>
              AI-generated preview
            </p>
          </motion.div>
        )}

        {imgError && !imgLoading && (
          <motion.p
            key="img-error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              fontSize: '0.8rem', color: '#ff6b6b',
              background: 'rgba(255,107,107,0.07)',
              border: '1px solid rgba(255,107,107,0.2)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.6rem 0.875rem',
              marginBottom: '0.875rem',
            }}
          >
            {imgError}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Budget shopping */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10, padding: '0.875rem 1rem',
          marginBottom: '1rem',
        }}
      >
        <p style={{
          fontSize: '0.6rem', fontWeight: 700,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'var(--accent)', marginBottom: '0.625rem',
          fontFamily: 'var(--font)',
        }}>
          ✦ Find Similar Pieces
        </p>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {BUDGETS.map((b) => (
            <BudgetPill
              key={b} label={b}
              active={activeBudget === b}
              onClick={() => setActiveBudget(prev => prev === b ? null : b)}
            />
          ))}
        </div>

        {/* Product results */}
        <AnimatePresence>
          {activeBudget && (
            <motion.div
              key="shop-results"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden', marginTop: '0.875rem' }}
            >
              {shopLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
                  <Loader2 size={14} strokeWidth={2} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--text-3)' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontFamily: 'var(--font)' }}>
                    Searching for products…
                  </span>
                </div>
              ) : shopError ? (
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,100,100,0.8)', fontFamily: 'var(--font)', padding: '0.25rem 0' }}>
                  {shopError}
                </p>
              ) : (
                Object.entries(shopResults).map(([cat, products]) =>
                  products.length > 0 && (
                    <div key={cat} style={{ marginBottom: '0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-3)' }}>{CLOTHING_ICONS[cat]}</span>
                        <span style={{
                          fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.15em',
                          textTransform: 'uppercase', color: 'var(--text-3)', fontFamily: 'var(--font)',
                        }}>
                          {CATEGORY_LABELS[cat]}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                        {products.map((p, i) => <ProductCard key={i} product={p} />)}
                      </div>
                    </div>
                  )
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <RippleButton
          type="button"
          onClick={handleVisualize}
          disabled={imgLoading}
          rippleColor="rgba(192,132,252,0.3)"
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, rgba(192,132,252,0.15), rgba(255,107,157,0.1))',
            color: 'var(--text)',
            border: '1px solid rgba(192,132,252,0.4)',
            padding: '0.8rem',
            boxShadow: '0 0 18px rgba(192,132,252,0.12)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem', fontWeight: 700,
            cursor: imgLoading ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          }}
          whileHover={!imgLoading ? { scale: 1.01, borderColor: 'rgba(192,132,252,0.7)', boxShadow: '0 0 28px rgba(192,132,252,0.22)' } : {}}
          whileTap={!imgLoading ? { scale: 0.99 } : {}}
        >
          {imageUrl && !imgLoading ? '↺ Regenerate' : '✦ Visualize My Outfit'}
        </RippleButton>
        <button
          onClick={onReselect}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,107,157,0.3)',
            color: 'var(--accent)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.8rem 1rem',
            cursor: 'pointer',
            fontSize: '0.8125rem', fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          ↩ Reselect
        </button>
      </div>
    </motion.div>
  );
}

/* ── Main component ── */
function Recommendation({ data }) {
  const {
    outfit_name,
    outfit_description,
    clothing_options = {},
    mandatory_accessories = [],
    general_crowd_style = {},
    mandatory_survival_items = [],
    stylist_tip,
    gender,
  } = data;

  const [selections, setSelections] = useState({ top: null, bottom: null, outerwear: null, footwear: null });
  const [showFinal, setShowFinal] = useState(false);

  const allSelected = CATEGORIES.every((cat) => selections[cat] !== null);

  function handleSelect(category, option) {
    setSelections((prev) => ({ ...prev, [category]: option }));
  }

  const selectedCount = CATEGORIES.filter((c) => selections[c]).length;

  return (
    <motion.div
      className="magic-card"
      style={{ padding: '2rem' }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <AnimatePresence mode="wait">
        {!showFinal ? (
          <motion.div key="selection" exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                <h3 style={{
                  fontFamily: serif, fontSize: '1.5rem', fontWeight: 600,
                  letterSpacing: '0.02em', textTransform: 'none',
                }}>
                  <span className="gradient-text">{outfit_name || 'Build Your Look'}</span>
                </h3>
                <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, rgba(255,107,157,0.35), transparent)' }} />
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', lineHeight: 1.5 }}>
                Pick one option per category to assemble your outfit.
              </p>
            </div>

            {/* Category selectors */}
            {CATEGORIES.map((cat, i) => (
              <CategorySelector
                key={cat}
                category={cat}
                options={clothing_options[cat] || []}
                selected={selections[cat]}
                onSelect={(opt) => handleSelect(cat, opt)}
                delay={i * 0.07}
              />
            ))}

            {/* Live selection summary + CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{ marginTop: '1.25rem' }}
            >
              {/* Outfit summary row */}
              <div style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10, padding: '0.75rem 1rem',
                marginBottom: '0.875rem',
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem',
              }}>
                {CATEGORIES.map((cat) => (
                  <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem' }}>{CLOTHING_ICONS[cat]}</span>
                    <AnimatePresence mode="wait">
                      {selections[cat] ? (
                        <motion.span
                          key="sel"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          style={{
                            fontSize: '0.5625rem', fontWeight: 700, color: 'var(--accent)',
                            fontFamily: serif, textAlign: 'center', lineHeight: 1.3,
                            maxWidth: '100%', overflow: 'hidden',
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {selections[cat].name.split(' ').slice(0, 3).join(' ')}
                        </motion.span>
                      ) : (
                        <motion.span
                          key="empty"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          style={{ fontSize: '0.5625rem', color: 'var(--text-3)', fontFamily: 'var(--font)' }}
                        >—</motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              <RippleButton
                type="button"
                onClick={() => setShowFinal(true)}
                disabled={!allSelected}
                rippleColor="rgba(255,107,157,0.3)"
                style={{
                  width: '100%', padding: '0.85rem',
                  background: allSelected
                    ? 'linear-gradient(135deg, rgba(255,107,157,0.2), rgba(192,132,252,0.15))'
                    : 'rgba(255,255,255,0.04)',
                  border: allSelected
                    ? '1px solid rgba(255,107,157,0.5)'
                    : '1px solid rgba(255,255,255,0.08)',
                  color: allSelected ? 'var(--text)' : 'var(--text-3)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9375rem', fontWeight: 700,
                  cursor: allSelected ? 'pointer' : 'not-allowed',
                  boxShadow: allSelected ? '0 0 20px rgba(255,107,157,0.15)' : 'none',
                  transition: 'all 0.25s',
                }}
                whileHover={allSelected ? { scale: 1.01 } : {}}
                whileTap={allSelected ? { scale: 0.99 } : {}}
              >
                {allSelected
                  ? '✦ Build My Outfit'
                  : `Select ${4 - selectedCount} more ${4 - selectedCount === 1 ? 'category' : 'categories'}`}
              </RippleButton>
            </motion.div>
          </motion.div>
        ) : (
          <FinalOutfit
            key="final"
            selections={selections}
            data={data}
            gender={gender}
            onReselect={() => setShowFinal(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Recommendation;
