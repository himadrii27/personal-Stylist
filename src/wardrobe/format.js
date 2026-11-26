// Small display helpers for the wardrobe screens.
export const fmtDate = (t) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
export const rupees = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;
