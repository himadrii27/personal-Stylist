import React, { useState } from 'react';
import { motion } from 'framer-motion';

function Recommendation({ data }) {
    const { title, options, tips, inspo } = data;
    const [selections, setSelections] = useState({
        top: null,
        bottom: null,
        footwear: null,
        layering: null
    });

    const categories = ['top', 'bottom', 'footwear', 'layering'];
    const currentCategoryIndex = categories.findIndex(c => selections[c] === null);
    const isComplete = currentCategoryIndex === -1;

    const handleSelect = (category, value) => {
        setSelections(prev => ({ ...prev, [category]: value }));
    };

    const SelectionCard = ({ value, isSelected, onClick }) => (
        <motion.div
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick()}
            style={{
                background: isSelected ? 'rgba(0, 102, 255, 0.08)' : 'var(--framer-bg)',
                border: isSelected ? '2px solid var(--framer-accent)' : '1px solid var(--framer-border)',
                borderRadius: 'var(--framer-radius-sm)',
                padding: '1.2rem',
                cursor: 'pointer',
                marginBottom: '1rem',
                position: 'relative'
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
            <p style={{ fontSize: '0.9375rem', color: 'var(--framer-text)', lineHeight: '1.4' }}>{value}</p>
            {isSelected && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--framer-accent)', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}
                >
                    ✓
                </motion.div>
            )}
        </motion.div>
    );

    const pinterestUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(`${inspo.artist || inspo.vibe} fashion inspiration ${title}`)}`;

    if (isComplete) {
        return (
            <motion.div
                className="glass-card"
                style={{ borderLeft: '4px solid var(--framer-accent)' }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
                <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                    Final <span className="accent-text">Ensemble</span>
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                    {categories.map((cat, i) => (
                        <motion.div
                            key={cat}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 * i }}
                        >
                            <p style={{ fontSize: '0.6875rem', color: 'var(--framer-accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem', fontWeight: 600 }}>{cat}</p>
                            <p style={{ fontSize: '0.9375rem', color: 'var(--framer-text)', fontWeight: 500 }}>{selections[cat]}</p>
                        </motion.div>
                    ))}
                </div>

                <div style={{ background: 'rgba(0, 102, 255, 0.05)', padding: '1.25rem', borderRadius: 'var(--framer-radius-sm)', marginBottom: '2rem', border: '1px solid var(--framer-border)' }}>
                    <h4 style={{ color: 'var(--framer-accent)', marginBottom: '0.5rem', fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Styling note</h4>
                    <p style={{ color: 'var(--framer-text)', fontSize: '0.9375rem', fontStyle: 'italic', lineHeight: 1.5 }}>
                        "This curated selection perfectly balances your {inspo.vibe.toLowerCase()} preferences with the {title}'s requirements."
                    </p>
                </div>

                <motion.button
                    type="button"
                    onClick={() => setSelections({ top: null, bottom: null, footwear: null, layering: null })}
                    style={{ background: 'transparent', color: 'var(--framer-accent)', border: '1px solid var(--framer-accent)', width: '100%', padding: '0.75rem' }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                >
                    Redesign Outfit
                </motion.button>
            </motion.div>
        );
    }

    const currentCat = categories[currentCategoryIndex];
    const progress = (currentCategoryIndex / categories.length) * 100;

    return (
        <motion.div
            className="glass-card"
            style={{ borderLeft: '4px solid var(--framer-accent)' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.9375rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                    Builder: <span className="accent-text">{currentCat}</span>
                </h3>
                <span style={{ fontSize: '0.8125rem', color: 'var(--framer-text-secondary)' }}>Step {currentCategoryIndex + 1} of 4</span>
            </div>

            <div style={{ width: '100%', height: '4px', background: 'var(--framer-border)', borderRadius: '2px', marginBottom: '2rem', overflow: 'hidden' }}>
                <motion.div
                    style={{ height: '100%', background: 'var(--framer-accent)', borderRadius: '2px' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
            </div>

            <div style={{ marginBottom: '2rem' }}>
                {options[currentCat].map((opt, i) => (
                    <SelectionCard
                        key={`${currentCat}-${i}-${opt.slice(0, 20)}`}
                        value={opt}
                        isSelected={selections[currentCat] === opt}
                        onClick={() => handleSelect(currentCat, opt)}
                    />
                ))}
            </div>

            {inspo && (
                <div style={{ opacity: 0.9, borderTop: '1px solid var(--framer-border)', paddingTop: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <img src={inspo.image} alt="Inspiration" style={{ width: '56px', height: '56px', borderRadius: 'var(--framer-radius-sm)', objectFit: 'cover' }} />
                        <div>
                            <p style={{ fontSize: '0.6875rem', color: 'var(--framer-accent)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Vibe Context</p>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--framer-text-secondary)' }}>{inspo.artistStyle !== 'N/A' ? inspo.artistStyle : inspo.audienceStyle}</p>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

export default Recommendation;
