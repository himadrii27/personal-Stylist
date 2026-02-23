import React, { useState } from 'react';
import { motion } from 'framer-motion';

function OccasionForm({ onSubmit }) {
    const [formData, setFormData] = useState({
        occasion: 'Concert',
        time: 'Night',
        weather: 'Sunny',
        artist: '',
        location: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            // If time is Night and weather was Sunny, reset weather to Clear
            if (newState.time === 'Night' && newState.weather === 'Sunny') {
                newState.weather = 'Clear';
            }
            return newState;
        });
    };

    const weatherOptions = formData.time === 'Night'
        ? ['Clear', 'Rainy', 'Cold/Winter', 'Windy']
        : ['Sunny', 'Rainy', 'Cold/Winter', 'Windy'];

    return (
        <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label>Occasion</label>
                    <input name="occasion" placeholder="e.g. Concert, Dinner" value={formData.occasion} onChange={handleChange} required />
                </div>
                <div>
                    <label>Time of Day</label>
                    <select name="time" value={formData.time} onChange={handleChange}>
                        <option>Day</option>
                        <option>Night</option>
                    </select>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label>Weather</label>
                    <select name="weather" value={formData.weather} onChange={handleChange}>
                        {weatherOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
                <div>
                    <label>Location</label>
                    <input name="location" placeholder="e.g. New York, Indoor Arena" value={formData.location} onChange={handleChange} required />
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <label>Artist/Event Theme (Optional)</label>
                <input name="artist" placeholder="e.g. Taylor Swift, Rock Theme" value={formData.artist} onChange={handleChange} />
            </div>

            <motion.button
                type="submit"
                style={{ width: '100%' }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
            >
                Stylize Me
            </motion.button>
        </form>
    );
}

export default OccasionForm;
