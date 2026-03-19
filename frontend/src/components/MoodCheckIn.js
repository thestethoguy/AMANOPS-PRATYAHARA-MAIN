import React, { useState } from 'react';
import axios from 'axios';
import { Smile, Frown, Meh, Heart, ThumbsUp, MessageCircle, Send } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function MoodCheckIn({ token }) {
  const [selectedMood, setSelectedMood] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const moods = [
    { id: 'happy', label: 'Happy', icon: Smile, color: 'text-yellow-500', bg: 'bg-yellow-100' },
    { id: 'calm', label: 'Calm', icon: Heart, color: 'text-blue-500', bg: 'bg-blue-100' },
    { id: 'anxious', label: 'Anxious', icon: Frown, color: 'text-orange-500', bg: 'bg-orange-100' },
    { id: 'sad', label: 'Sad', icon: Frown, color: 'text-purple-500', bg: 'bg-purple-100' },
    { id: 'grateful', label: 'Grateful', icon: ThumbsUp, color: 'text-green-500', bg: 'bg-green-100' },
    { id: 'neutral', label: 'Neutral', icon: Meh, color: 'text-gray-500', bg: 'bg-gray-100' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      await axios.post(
        `${API_URL}/api/moods`,
        {
          mood_type: selectedMood,
          intensity,
          note: note || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(true);
      setSelectedMood('');
      setIntensity(5);
      setNote('');
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving mood:', error);
      alert('Failed to save mood. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" data-testid="mood-checkin">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">How are you feeling?</h1>
          <p className="text-gray-600">Share your mood and track your emotional wellbeing</p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-center">
            ✅ Mood saved successfully! Keep tracking your emotions.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Mood Selection */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-700 mb-4">
              Select your mood
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {moods.map((mood) => {
                const Icon = mood.icon;
                return (
                  <button
                    key={mood.id}
                    type="button"
                    onClick={() => setSelectedMood(mood.id)}
                    className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                      selectedMood === mood.id
                        ? `${mood.bg} border-current ${mood.color} shadow-lg`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    data-testid={`mood-${mood.id}`}
                  >
                    <Icon className={`w-12 h-12 mb-2 ${selectedMood === mood.id ? mood.color : 'text-gray-400'}`} />
                    <span className={`font-medium ${selectedMood === mood.id ? mood.color : 'text-gray-600'}`}>
                      {mood.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Intensity Slider */}
          {selectedMood && (
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Intensity: {intensity}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value))}
                className="w-full h-3 bg-gradient-to-r from-blue-200 to-purple-500 rounded-lg appearance-none cursor-pointer"
                data-testid="intensity-slider"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          )}

          {/* Note */}
          {selectedMood && (
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                <MessageCircle className="inline w-5 h-5 mr-2" />
                Add a note (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="4"
                placeholder="What's on your mind? Share your thoughts..."
                data-testid="mood-note"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!selectedMood || loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            data-testid="save-mood-button"
          >
            <Send className="w-5 h-5" />
            <span>{loading ? 'Saving...' : 'Save Mood Check-in'}</span>
          </button>
        </form>
      </div>

      {/* Mood History Preview */}
      <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
        <h3 className="text-lg font-bold text-gray-800 mb-2">📊 Track Your Patterns</h3>
        <p className="text-gray-700">
          Regular mood check-ins help you understand your emotional patterns and triggers. 
          Visit the Analytics page to see your progress over time!
        </p>
      </div>
    </div>
  );
}

export default MoodCheckIn;
