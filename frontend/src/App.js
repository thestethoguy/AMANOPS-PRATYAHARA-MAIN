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
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('pratyahara_token');
    const storedUser = localStorage.getItem('pratyahara_user');
    const storedGuest = localStorage.getItem('pratyahara_guest');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    } else if (storedGuest === 'true') {
      setIsGuest(true);
    }
    setLoading(false);
  }, []);

 const handleLogin = (authData) => {
    // Preserve existing username if backend doesn't return one
    const existingUser = localStorage.getItem('pratyahara_user');
    const existingUsername = existingUser
      ? JSON.parse(existingUser).username
      : null;

    const mergedUser = {
      ...authData.user,
      username: authData.user.username || existingUsername || null,
    };

    setToken(authData.access_token);
    setUser(mergedUser);
    setIsGuest(false);
    localStorage.setItem('pratyahara_token', authData.access_token);
    localStorage.setItem('pratyahara_user', JSON.stringify(mergedUser));
    localStorage.removeItem('pratyahara_guest');
  };

  const handleGuestLogin = () => {
    setIsGuest(true);
    setToken(null);
    setUser(null);
    localStorage.setItem('pratyahara_guest', 'true');
  };

  // Called by Profile when username is updated
  const handleUsernameUpdate = (newUsername) => {
    const updatedUser = { ...user, username: newUsername };
    setUser(updatedUser);
    localStorage.setItem('pratyahara_user', JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setIsGuest(false);
    localStorage.removeItem('pratyahara_token');
    localStorage.removeItem('pratyahara_user');
    localStorage.removeItem('pratyahara_guest');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <div className="animate-pulse text-2xl text-purple-600">Loading PRATYAHARA...</div>
      </div>
    );
  }

  if (!token && !isGuest) {
    return <Login onLogin={handleLogin} onGuestLogin={handleGuestLogin} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
        <Navbar onLogout={handleLogout} user={user} isGuest={isGuest} />
        <div className="pt-16">
          {isGuest && (
            <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white text-center py-2 px-4 text-sm font-medium">
              👋 You're browsing as a Guest — data won't be saved permanently.{' '}
              <button
                onClick={handleLogout}
                className="underline font-bold hover:text-amber-100 transition-colors"
              >
                Sign Up / Login
              </button>{' '}
              to save your progress!
            </div>
          )}
          <Routes>
            <Route path="/" element={<Dashboard token={token} user={user} isGuest={isGuest} />} />
            <Route path="/mood" element={<MoodCheckIn token={token} isGuest={isGuest} />} />
            <Route path="/journal" element={<Journal token={token} isGuest={isGuest} />} />
            <Route path="/meditation" element={<Meditation token={token} isGuest={isGuest} />} />
            <Route path="/breathing" element={<Breathing token={token} isGuest={isGuest} />} />
            <Route path="/analytics" element={<Analytics token={token} isGuest={isGuest} />} />
            <Route path="/chat" element={<Chat token={token} isGuest={isGuest} />} />
            <Route path="/media" element={<MediaPlayer token={token} isGuest={isGuest} />} />
            <Route path="/profile" element={
              isGuest
                ? <Navigate to="/" replace />
                : <Profile token={token} user={user} onUsernameUpdate={handleUsernameUpdate} />
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
