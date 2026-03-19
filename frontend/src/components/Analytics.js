import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, TrendingUp, Calendar, Heart, BookOpen } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function Analytics({ token }) {
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/analytics/summary?days=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-white rounded-2xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-64 bg-white rounded-2xl"></div>
            <div className="h-64 bg-white rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" data-testid="analytics">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Your Progress</h1>
              <p className="text-gray-600">Track your mindfulness journey</p>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex space-x-2">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                onClick={() => setPeriod(days)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  period === days
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                data-testid={`period-${days}`}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-2">
            <Heart className="w-8 h-8 text-pink-600" />
            <p className="text-gray-600 text-sm">Mood Entries</p>
          </div>
          <p className="text-3xl font-bold text-gray-800">{analytics?.total_moods || 0}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-2">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <p className="text-gray-600 text-sm">Journal Entries</p>
          </div>
          <p className="text-3xl font-bold text-gray-800">{analytics?.total_journals || 0}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-2">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <p className="text-gray-600 text-sm">Avg Mood</p>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            {analytics?.average_intensity?.toFixed(1) || '0.0'}/10
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-2">
            <Calendar className="w-8 h-8 text-purple-600" />
            <p className="text-gray-600 text-sm">Current Streak</p>
          </div>
          <p className="text-3xl font-bold text-gray-800">{analytics?.current_streak || 0} days</p>
        </div>
      </div>

      {/* Mood Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Mood Distribution</h3>
          {analytics?.mood_distribution && Object.keys(analytics.mood_distribution).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(analytics.mood_distribution).map(([mood, count]) => (
                <div key={mood}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-700 capitalize font-medium">{mood}</span>
                    <span className="text-gray-600 font-semibold">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all"
                      style={{
                        width: `${(count / analytics.total_moods) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>No mood data for this period</p>
              <p className="text-sm mt-2">Start logging your moods to see insights!</p>
            </div>
          )}
        </div>

        {/* Streak Info */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Streak Stats</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
              <div>
                <p className="text-gray-600 text-sm">Current Streak</p>
                <p className="text-3xl font-bold text-orange-600">{analytics?.current_streak || 0}</p>
                <p className="text-gray-500 text-sm">days</p>
              </div>
              <div className="text-5xl">🔥</div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
              <div>
                <p className="text-gray-600 text-sm">Longest Streak</p>
                <p className="text-3xl font-bold text-purple-600">{analytics?.longest_streak || 0}</p>
                <p className="text-gray-500 text-sm">days</p>
              </div>
              <div className="text-5xl">🏆</div>
            </div>

            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <p className="text-gray-700 text-sm">
                Keep up the great work! Consistency is key to building a lasting mindfulness practice.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
        <h3 className="text-lg font-bold text-gray-800 mb-2">💡 Insights</h3>
        <div className="space-y-2 text-gray-700">
          {analytics?.total_moods > 0 && (
            <p>• You've logged {analytics.total_moods} mood entries in the last {period} days. Great job tracking your emotions!</p>
          )}
          {analytics?.total_journals > 0 && (
            <p>• You've written {analytics.total_journals} journal entries. Writing helps process thoughts and emotions.</p>
          )}
          {analytics?.current_streak > 3 && (
            <p>• Amazing! You have a {analytics.current_streak}-day streak. Consistency builds lasting habits!</p>
          )}
          {analytics?.average_intensity > 7 && (
            <p>• Your average mood intensity is high. You're doing great maintaining positive emotional states!</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Analytics;
