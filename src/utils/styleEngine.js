/**
 * Style Intelligence Engine
 * Follows strict pipeline for generating artist style vectors from signals.
 */

const GENRE_PRESETS = {
    pop: { minimal_loud: 0.4, fitted_oversized: -0.2, classic_experimental: 0.2, soft_edgy: -0.3, casual_glam: 0.6 },
    techno: { minimal_loud: -0.4, fitted_oversized: 0.3, classic_experimental: 0.5, soft_edgy: 0.8, casual_glam: -0.6 },
    industrial: { minimal_loud: -0.6, fitted_oversized: 0.5, classic_experimental: 0.7, soft_edgy: 0.9, casual_glam: -0.8 },
    rock: { minimal_loud: 0.2, fitted_oversized: -0.3, classic_experimental: 0.3, soft_edgy: 0.6, casual_glam: 0.1 },
    classic: { minimal_loud: -0.8, fitted_oversized: -0.6, classic_experimental: -0.7, soft_edgy: -0.5, casual_glam: 0.3 },
    neutral: { minimal_loud: 0, fitted_oversized: 0, classic_experimental: 0, soft_edgy: 0, casual_glam: 0 }
};

const SIGNAL_MAP = {
    // Texture/Material
    "silk": { soft_edgy: -0.4, casual_glam: 0.5 },
    "leather": { soft_edgy: 0.6, classic_experimental: 0.2 },
    "mesh": { classic_experimental: 0.5, soft_edgy: 0.4 },
    "denim": { casual_glam: -0.4, minimal_loud: 0.1 },
    "organza": { soft_edgy: -0.5, classic_experimental: 0.4 },
    "vinyl": { soft_edgy: 0.7, classic_experimental: 0.6 },

    // Detail/Attribute
    "sparkle": { casual_glam: 0.6, minimal_loud: 0.5 },
    "sequin": { casual_glam: 0.7, minimal_loud: 0.6 },
    "oversized": { fitted_oversized: 0.8 },
    "baggy": { fitted_oversized: 0.7 },
    "fitted": { fitted_oversized: -0.8 },
    "tailored": { fitted_oversized: -0.7, classic_experimental: -0.4 },
    "distressed": { soft_edgy: 0.5, minimal_loud: 0.3 },
    "reflective": { classic_experimental: 0.6, soft_edgy: 0.3 },
    "sheer": { classic_experimental: 0.4, soft_edgy: -0.2 },
    "neon": { minimal_loud: 0.8, classic_experimental: 0.5 },
    "monochrome": { minimal_loud: -0.7 },
    "minimalist": { minimal_loud: -0.8 },
    "avant-garde": { classic_experimental: 0.9, soft_edgy: 0.4 },
};

/**
 * 1. SIGNAL COLLECTION (Mocked for current implementation)
 * In a real scenario, this would fetch from a search API or LLM.
 */
function collectSignals(artistName) {
    const name = artistName.toLowerCase();
    const signals = [];

    // Mocking signal detection based on artist name for demonstration
    if (name.includes('swift')) signals.push('sparkle', 'sequin', 'silk', 'fitted', 'glam');
    if (name.includes('harry')) signals.push('avant-garde', 'sheer', 'organza', 'oversized', 'glam');
    if (name.includes('witte') || name.includes('techno')) signals.push('leather', 'vinyl', 'mesh', 'oversized', 'monochrome', 'edgy');
    if (name.includes('gala')) signals.push('tailored', 'silk', 'minimalist', 'monochrome');

    return signals;
}

/**
 * 2. SIGNAL NORMALIZATION
 */
function normalizeSignals(signals) {
    const counts = {};
    signals.forEach(s => counts[s] = (counts[s] || 0) + 1);

    const total = signals.length || 1;
    const normalized = {};
    for (const [key, count] of Object.entries(counts)) {
        normalized[key] = count / total;
    }
    return normalized;
}

/**
 * 3. SIGNAL -> STYLE VECTOR MAPPING
 */
function mapToStyleVector(normalizedSignals) {
    const vector = { minimal_loud: 0, fitted_oversized: 0, classic_experimental: 0, soft_edgy: 0, casual_glam: 0 };

    for (const [signal, weight] of Object.entries(normalizedSignals)) {
        const deltas = SIGNAL_MAP[signal];
        if (deltas) {
            for (const [dim, value] of Object.entries(deltas)) {
                vector[dim] += value * weight;
            }
        }
    }
    return vector;
}

/**
 * 4, 5, 6. VECTOR AGGREGATION & NORMALIZATION
 */
export function generateArtistVector(artistName, genreHint = 'neutral') {
    const rawSignals = collectSignals(artistName);
    const normalizedSignals = normalizeSignals(rawSignals);
    const liveSignalVector = mapToStyleVector(normalizedSignals);

    const baseVector = GENRE_PRESETS[genreHint.toLowerCase()] || GENRE_PRESETS.neutral;

    const finalVector = {};
    const dimensions = ['minimal_loud', 'fitted_oversized', 'classic_experimental', 'soft_edgy', 'casual_glam'];

    dimensions.forEach(dim => {
        const val = (0.7 * (baseVector[dim] || 0)) + (0.3 * (liveSignalVector[dim] || 0));
        finalVector[dim] = Math.max(-1, Math.min(1, val)); // Clamping
    });

    return {
        artist: artistName,
        artistStyleVector: finalVector,
        dominantSignals: Object.keys(normalizedSignals).slice(0, 3)
    };
}

/**
 * Vector Similarity calculation (Dot Product)
 */
export function calculateSimilarity(vecA, vecB) {
    const dimensions = ['minimal_loud', 'fitted_oversized', 'classic_experimental', 'soft_edgy', 'casual_glam'];
    let dotProduct = 0;
    dimensions.forEach(dim => {
        dotProduct += (vecA[dim] || 0) * (vecB[dim] || 0);
    });
    return dotProduct;
}
