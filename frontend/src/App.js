import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import MoodCheckIn from './components/MoodCheckIn';
import Journal from './components/Journal';
import Meditation from './components/Meditation';
import Breathing from './components/Breathing';
import Analytics from './components/Analytics';
import Chat from './components/Chat';
import MediaPlayer from './components/MediaPlayer';
import Profile from './components/Profile';
import Navbar from './components/Navbar';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token
    const storedToken = localStorage.getItem('pratyahara_token');
    const storedUser = localStorage.getItem('pratyahara_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (authData) => {
    setToken(authData.access_token);
    setUser(authData.user);
    localStorage.setItem('pratyahara_token', authData.access_token);
    localStorage.setItem('pratyahara_user', JSON.stringify(authData.user));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('pratyahara_token');
    localStorage.removeItem('pratyahara_user');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <div className="animate-pulse text-2xl text-purple-600">Loading PRATYAHARA...</div>
      </div>
    );
  }

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
        <Navbar onLogout={handleLogout} user={user} />
        <div className="pt-16">
          <Routes>
            <Route path="/" element={<Dashboard token={token} user={user} />} />
            <Route path="/mood" element={<MoodCheckIn token={token} />} />
            <Route path="/journal" element={<Journal token={token} />} />
            <Route path="/meditation" element={<Meditation token={token} />} />
            <Route path="/breathing" element={<Breathing />} />
            <Route path="/analytics" element={<Analytics token={token} />} />
            <Route path="/chat" element={<Chat token={token} />} />
            <Route path="/media" element={<MediaPlayer token={token} />} />
            <Route path="/profile" element={<Profile token={token} user={user} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
