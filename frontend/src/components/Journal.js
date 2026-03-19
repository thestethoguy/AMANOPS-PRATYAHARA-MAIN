import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Send, Calendar, Tag } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function Journal({ token }) {
  const [content, setContent] = useState('');
  const [moodTag, setMoodTag] = useState('');
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const moodTags = ['Happy', 'Calm', 'Anxious', 'Grateful', 'Reflective', 'Inspired', 'Peaceful'];

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/journal`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJournals(response.data);
    } catch (error) {
      console.error('Error fetching journals:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setSuccess(false);

    try {
      await axios.post(
        `${API_URL}/api/journal`,
        {
          content: content.trim(),
          mood_tag: moodTag || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(true);
      setContent('');
      setMoodTag('');
      fetchJournals();
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving journal:', error);
      alert('Failed to save journal entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" data-testid="journal">
      {/* New Entry */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Journal</h1>
            <p className="text-gray-600">Express your thoughts and feelings</p>
          </div>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-center">
            ✅ Journal entry saved successfully!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="inline w-4 h-4 mr-1" />
              Mood Tag (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {moodTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setMoodTag(tag === moodTag ? '' : tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    moodTag === tag
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  data-testid={`tag-${tag.toLowerCase()}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your thoughts
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows="6"
              placeholder="Dear Journal, today I feel..."
              required
              data-testid="journal-content"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            data-testid="save-journal-button"
          >
            <Send className="w-5 h-5" />
            <span>{loading ? 'Saving...' : 'Save Entry'}</span>
          </button>
        </form>
      </div>

      {/* Journal Entries */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Past Entries</h2>
        
        {journals.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No journal entries yet. Start writing to track your journey!</p>
          </div>
        ) : (
          journals.map((journal) => (
            <div key={journal.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">{formatDate(journal.created_at)}</span>
                </div>
                {journal.mood_tag && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    {journal.mood_tag}
                  </span>
                )}
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{journal.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Journal;
