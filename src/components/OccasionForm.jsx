import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RippleButton } from './ui/ripple-button';

function OccasionForm({ onSubmit, isLoading = false }) {
  const [formData, setFormData] = useState({
    occasion: 'Concert', time: 'Night', weather: 'Sunny', artist: '', location: '', venue: '',
  });

  const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (next.time === 'Night' && next.weather === 'Sunny') next.weather = 'Clear';
      return next;
    });
  };

  const weatherOptions = formData.time === 'Night'
    ? ['Clear', 'Rainy', 'Cold/Winter', 'Windy']
    : ['Sunny', 'Rainy', 'Cold/Winter', 'Windy'];

  return (
    <form onSubmit={handleSubmit}>
      <div className="section-divider">Occasion Details</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label>Occasion</label>
          <input
            name="occasion" placeholder="e.g. Concert, Dinner"
            value={formData.occasion} onChange={handleChange} required
          />
        </div>
        <div>
          <label>Time of Day</label>
          <select name="time" value={formData.time} onChange={handleChange}>
            <option>Day</option>
            <option>Night</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label>Weather</label>
          <select name="weather" value={formData.weather} onChange={handleChange}>
            {weatherOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label>Location</label>
          <input
            name="location" placeholder="e.g. New York, Tokyo"
            value={formData.location} onChange={handleChange} required
          />
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Venue</label>
        <input
          name="venue" placeholder="e.g. Indoor Arena, Rooftop Bar, Outdoor Festival"
          value={formData.venue} onChange={handleChange}
        />
      </div>

      <div style={{ marginBottom: '1.75rem' }}>
        <label>
          Artist / Event Theme{' '}
          <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(Optional)</span>
        </label>
        <input
          name="artist" placeholder="e.g. Taylor Swift, Rock Theme"
          value={formData.artist} onChange={handleChange}
        />
      </div>

      <RippleButton
        type="submit"
        className="shimmer-btn"
        style={{ width: '100%', opacity: isLoading ? 0.6 : 1, pointerEvents: isLoading ? 'none' : 'auto' }}
        whileHover={isLoading ? {} : { scale: 1.01 }}
        whileTap={isLoading ? {} : { scale: 0.99 }}
        rippleColor="rgba(255,255,255,0.28)"
        disabled={isLoading}
      >
        {isLoading ? 'Styling…' : 'Stylize Me ✦'}
      </RippleButton>
    </form>
  );
}

export default OccasionForm;
