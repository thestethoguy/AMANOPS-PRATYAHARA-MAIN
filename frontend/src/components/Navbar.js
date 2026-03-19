import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Heart, BookOpen, Timer, Wind, BarChart3, MessageCircle, PlayCircle, User, LogOut, Menu, X, LogIn } from 'lucide-react';

function Navbar({ onLogout, user, isGuest }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/mood', icon: Heart, label: 'Mood' },
    { path: '/journal', icon: BookOpen, label: 'Journal' },
    { path: '/meditation', icon: Timer, label: 'Meditate' },
    { path: '/breathing', icon: Wind, label: 'Breathe' },
    { path: '/analytics', icon: BarChart3, label: 'Progress' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/media', icon: PlayCircle, label: 'Media' },
    // Hide Profile for guests
    ...(!isGuest ? [{ path: '/profile', icon: User, label: 'Profile' }] : []),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
              <Wind className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              PRATYAHARA
            </span>
            {isGuest && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-300">
                Guest
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-all ${
                    isActive ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}

            {isGuest ? (
              <button
                onClick={onLogout}
                className="flex items-center space-x-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all font-medium text-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign Up / Login</span>
              </button>
            ) : (
              <button
                onClick={onLogout}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-all"
                data-testid="logout-button"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-2 space-y-1">
            {isGuest && (
              <div className="px-4 py-2 mb-2 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs text-amber-700 font-medium">👋 Browsing as Guest</p>
              </div>
            )}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    isActive ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}

            {isGuest ? (
              <button
                onClick={() => { setMobileMenuOpen(false); onLogout(); }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white transition-all"
              >
                <LogIn className="w-5 h-5" />
                <span className="font-medium">Sign Up / Login</span>
              </button>
            ) : (
              <button
                onClick={() => { setMobileMenuOpen(false); onLogout(); }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
