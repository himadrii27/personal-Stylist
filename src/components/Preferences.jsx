import React, { useState } from 'react';
import { motion } from 'framer-motion';

const SLIDERS = [
    { id: 'minimalLoud', labels: ['Minimal', 'Loud'] },
    { id: 'fittedOversized', labels: ['Fitted', 'Oversized'] },
    { id: 'classicTrendy', labels: ['Classic', 'Trendy'] },
    { id: 'sportyPolished', labels: ['Sporty', 'Polished'] },
    { id: 'safeExperimental', labels: ['Safe', 'Experimental'] }
];

const GENS = ['Gen Z', 'Millennial', 'Gen X', 'Boomer'];
const GENDERS = ['Feminine', 'Masculine', 'Non-binary/Unisex'];

function Preferences({ onSave }) {
    const [sliders, setSliders] = useState({
        minimalLoud: 50,
        fittedOversized: 50,
        classicTrendy: 50,
        sportyPolished: 50,
        safeExperimental: 50
    });
    const [age, setAge] = useState('Millennial');
    const [gender, setGender] = useState('Feminine');

    const handleSliderChange = (id, value) => {
        setSliders(prev => ({ ...prev, [id]: parseInt(value) }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ sliders, age, gender });
    };

    return (
        <motion.div
            className="glass-card"
            style={{ maxWidth: '560px', margin: '2rem auto' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.5rem' }}>
                Define Your <span className="accent-text">Aesthetic</span>
            </h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '2rem' }}>
                    <p style={{ color: 'var(--framer-text-secondary)', fontSize: '0.75rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                        Style Dimensions
                    </p>
                    {SLIDERS.map((s, i) => (
                        <motion.div
                            key={s.id}
                            style={{ marginBottom: '1.25rem' }}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 * i }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem', fontSize: '0.8125rem' }}>
                                <span style={{ color: sliders[s.id] < 40 ? 'var(--framer-accent)' : 'var(--framer-text-muted)' }}>{s.labels[0]}</span>
                                <span style={{ color: sliders[s.id] > 60 ? 'var(--framer-accent)' : 'var(--framer-text-muted)' }}>{s.labels[1]}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={sliders[s.id]}
                                onChange={(e) => handleSliderChange(s.id, e.target.value)}
                                style={{ width: '100%', accentColor: 'var(--framer-accent)' }}
                            />
                        </motion.div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label>Generation</label>
                        <select value={age} onChange={(e) => setAge(e.target.value)}>
                            {GENS.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div>
                        <label>Gender</label>
                        <select value={gender} onChange={(e) => setGender(e.target.value)}>
                            {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                </div>

                <motion.button
                    type="submit"
                    style={{ width: '100%', marginTop: '0.5rem' }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                >
                    Generate My Palette
                </motion.button>
            </form>
        </motion.div>
    );
}

export default Preferences;
