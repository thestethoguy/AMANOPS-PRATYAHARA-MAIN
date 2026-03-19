import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Flame, TrendingUp, BookOpen, Heart, Timer, Award, UserCheck } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function Dashboard({ token, user, isGuest }) {
  const navigate = useNavigate();
  const [streak, setStreak] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGuest) {
      setLoading(false);
      return;
    }
    fetchDashboardData();
  }, [isGuest]);

  const fetchDashboardData = async () => {
    try {
      const [streakRes, analyticsRes] = await Promise.all([
        axios.get(`${API_URL}/api/streak`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/analytics/summary?days=7`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setStreak(streakRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-white rounded-2xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-40 bg-white rounded-2xl"></div>
            <div className="h-40 bg-white rounded-2xl"></div>
            <div className="h-40 bg-white rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" data-testid="dashboard">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 mb-8 text-white shadow-xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          {isGuest ? 'Welcome, Guest! 🙏' : `Welcome back, ${user?.email?.split('@')[0]}! 🙏`}
        </h1>
        <p className="text-purple-100 text-lg">
          {isGuest
            ? 'Explore PRATYAHARA — create an account to save your journey'
            : 'Continue your journey to inner peace and mindfulness'}
        </p>
      </div>

      {/* Guest CTA Card */}
      {isGuest && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 mb-8 flex items-start space-x-4">
          <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-amber-800 mb-1">You're in Guest Mode</h3>
            <p className="text-amber-700 text-sm mb-3">
              You can try all features freely! Create a free account to save your mood logs,
              journal entries, streaks, and chat history permanently.
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-amber-700 mb-3">
              <span className="bg-amber-100 px-2 py-1 rounded-full">✅ Meditation Timer</span>
              <span className="bg-amber-100 px-2 py-1 rounded-full">✅ Breathing Exercise</span>
              <span className="bg-amber-100 px-2 py-1 rounded-full">✅ Media Library</span>
              <span className="bg-amber-100 px-2 py-1 rounded-full">⚠️ Mood & Journal (not saved)</span>
              <span className="bg-amber-100 px-2 py-1 rounded-full">🔒 Chat (login required)</span>
            </div>
          </div>
        </div>
      )}

      {/* Streak Card — only for logged-in users */}
      {!isGuest && (
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                <Flame className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {streak?.current_streak || 0} Day Streak!
                </h2>
                <p className="text-gray-600">Longest: {streak?.longest_streak || 0} days</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-orange-500">{streak?.current_streak || 0}</div>
              <p className="text-sm text-gray-500">Days</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid — only for logged-in users */}
      {!isGuest && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Mood Check-ins</p>
                <p className="text-2xl font-bold text-gray-800">{analytics?.total_moods || 0}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Last 7 days</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Journal Entries</p>
                <p className="text-2xl font-bold text-gray-800">{analytics?.total_journals || 0}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Last 7 days</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Avg Mood</p>
                <p className="text-2xl font-bold text-gray-800">
                  {analytics?.average_intensity?.toFixed(1) || '0.0'}/10
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Last 7 days</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/mood')}
            className="flex flex-col items-center p-4 rounded-xl bg-pink-50 hover:bg-pink-100 transition-colors"
            data-testid="mood-checkin-button"
          >
            <Heart className="w-8 h-8 text-pink-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Check Mood</span>
          </button>

          <button
            onClick={() => navigate('/meditation')}
            className="flex flex-col items-center p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors"
            data-testid="meditation-button"
          >
            <Timer className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Meditate</span>
          </button>

          <button
            onClick={() => navigate('/journal')}
            className="flex flex-col items-center p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
            data-testid="journal-button"
          >
            <BookOpen className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Journal</span>
          </button>

          <button
            onClick={() => navigate('/media')}
            className="flex flex-col items-center p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors"
            data-testid="media-button"
          >
            <Award className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Media</span>
          </button>
        </div>
      </div>

      {/* Daily Tip */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-purple-200">
        <h3 className="text-lg font-bold text-gray-800 mb-2">✨ Daily Mindfulness Tip</h3>
        <p className="text-gray-700">
          Take 5 minutes today to practice deep breathing. Inhale peace, exhale stress.
          Your mind will thank you! 🌿
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
