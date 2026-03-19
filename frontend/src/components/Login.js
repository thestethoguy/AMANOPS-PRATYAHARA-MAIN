import React, { useState } from 'react';
import axios from 'axios';
import { Wind, Mail, Lock, Eye, EyeOff, Fingerprint } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  React.useEffect(() => {
    if (window.PublicKeyCredential) {
      setBiometricSupported(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const response = await axios.post(`${API_URL}${endpoint}`, {
        email,
        password,
      });
      onLogin(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotMessage('❌ Passwords do not match');
      return;
    }
    if (forgotNewPassword.length < 6) {
      setForgotMessage('❌ Password must be at least 6 characters');
      return;
    }
    setForgotLoading(true);
    setForgotMessage('');
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, {
        email: forgotEmail,
        new_password: forgotNewPassword,
      });
      setForgotMessage('✅ Password reset! You can now login.');
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotMessage('');
        setForgotEmail('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
      }, 2000);
    } catch (err) {
      setForgotMessage('❌ ' + (err.response?.data?.detail || 'Reset failed'));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      setLoading(true);
      setError('');

      const challengeResponse = await axios.post(`${API_URL}/api/auth/webauthn/login-challenge`, {
        email,
      });

      const { challenge, credentials } = challengeResponse.data;

      const credentialRequestOptions = {
        challenge: Uint8Array.from(atob(challenge.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
        allowCredentials: credentials.map(id => ({
          type: 'public-key',
          id: Uint8Array.from(atob(id.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
        })),
        timeout: 60000,
      };

      const assertion = await navigator.credentials.get({
        publicKey: credentialRequestOptions,
      });

      const verifyResponse = await axios.post(`${API_URL}/api/auth/webauthn/login-verify`, {
        credential_id: btoa(String.fromCharCode(...new Uint8Array(assertion.rawId))),
      });

      onLogin(verifyResponse.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Biometric authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mb-4 shadow-xl">
            <Wind className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            PRATYAHARA
          </h1>
          <p className="text-gray-600">Your Journey to Mindfulness</p>
        </div>

        {/* Login/Register Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                !isRegister
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600'
              }`}
              data-testid="login-tab"
            >
              Login
            </button>
            <button
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                isRegister
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600'
              }`}
              data-testid="register-tab"
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="your@email.com"
                  required
                  data-testid="email-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="submit-button"
            >
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>

            {!isRegister && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                >
                  Forgot Password?
                </button>
              </div>
            )}
          </form>

          {/* Biometric Login */}
          {!isRegister && biometricSupported && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
              <button
                onClick={handleBiometricLogin}
                disabled={loading || !email}
                className="mt-4 w-full flex items-center justify-center space-x-2 py-3 border-2 border-purple-200 rounded-lg text-purple-600 hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="biometric-login-button"
              >
                <Fingerprint className="w-5 h-5" />
                <span className="font-medium">Biometric Login</span>
              </button>
              <p className="mt-2 text-xs text-gray-500 text-center">
                Enter your email and use fingerprint/face to login
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-gray-600 text-sm mt-6">
          Find peace and mindfulness every day 🧘‍♀️
        </p>

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Reset Password</h2>
              <p className="text-gray-600 text-sm mb-6">Enter your email and choose a new password.</p>

              {forgotMessage && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                  forgotMessage.includes('✅')
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {forgotMessage}
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <input
                  type="email"
                  placeholder="Your email address"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                >
                  {forgotLoading ? 'Resetting...' : 'Reset Password'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(false); setForgotMessage(''); }}
                  className="w-full py-3 border-2 border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
