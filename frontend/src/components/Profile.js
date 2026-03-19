import React, { useState } from 'react';
import axios from 'axios';
import { User, Mail, Lock, Fingerprint, Bell, Shield, Settings as SettingsIcon, Edit2, Check, X } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function Profile({ token, user, onUsernameUpdate }) {
  const [activeTab, setActiveTab] = useState('profile');

  // Username state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(user?.username || user?.email?.split('@')[0] || '');
  const [usernameMessage, setUsernameMessage] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);

  // Biometric state
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Current display name
  const displayName = user?.username || user?.email?.split('@')[0] || '';

  const handleSaveUsername = async () => {
    const trimmed = usernameInput.trim();
    if (!trimmed) {
      setUsernameMessage('❌ Username cannot be empty');
      return;
    }
    if (trimmed.length < 2) {
      setUsernameMessage('❌ Username must be at least 2 characters');
      return;
    }
    if (trimmed.length > 30) {
      setUsernameMessage('❌ Username must be 30 characters or less');
      return;
    }
    if (!/^[a-zA-Z0-9_. ]+$/.test(trimmed)) {
      setUsernameMessage('❌ Only letters, numbers, spaces, dots and underscores allowed');
      return;
    }
    setUsernameLoading(true);
    setUsernameMessage('');
    try {
      await axios.post(
        `${API_URL}/api/auth/update-username`,
        { username: trimmed },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsernameMessage('✅ Username updated successfully!');
      setIsEditingUsername(false);
      onUsernameUpdate(trimmed);
      setTimeout(() => setUsernameMessage(''), 3000);
    } catch (error) {
      setUsernameMessage('❌ ' + (error.response?.data?.detail || 'Failed to update username'));
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleCancelUsername = () => {
    setUsernameInput(user?.username || user?.email?.split('@')[0] || '');
    setIsEditingUsername(false);
    setUsernameMessage('');
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMessage('❌ New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage('❌ New password must be at least 6 characters');
      return;
    }
    setPasswordLoading(true);
    setPasswordMessage('');
    try {
      await axios.post(
        `${API_URL}/api/auth/change-password`,
        { current_password: currentPassword, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPasswordMessage('✅ Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (error) {
      setPasswordMessage('❌ ' + (error.response?.data?.detail || 'Failed to change password'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEnableBiometric = async () => {
    if (!window.PublicKeyCredential) {
      setMessage('Biometric authentication not supported on this device');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const challengeResponse = await axios.post(
        `${API_URL}/api/auth/webauthn/register-challenge`,
        { email: user.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { challenge, user_id, rp_id, rp_name } = challengeResponse.data;
      const publicKeyCredentialCreationOptions = {
        challenge: Uint8Array.from(atob(challenge.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
        rp: { name: rp_name, id: rp_id },
        user: {
          id: Uint8Array.from(user_id, c => c.charCodeAt(0)),
          name: user.email,
          displayName: displayName,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
        timeout: 60000,
        attestation: 'direct',
      };
      const credential = await navigator.credentials.create({ publicKey: publicKeyCredentialCreationOptions });
      await axios.post(
        `${API_URL}/api/auth/webauthn/register-verify`,
        {
          user_id: user_id,
          credential: {
            id: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
            publicKey: btoa(String.fromCharCode(...new Uint8Array(credential.response.attestationObject))),
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBiometricEnabled(true);
      setMessage('✅ Biometric authentication enabled successfully!');
    } catch (error) {
      console.error('Biometric setup error:', error);
      setMessage('❌ Failed to enable biometric authentication. ' + (error.message || ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" data-testid="profile">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 mb-8 text-white shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-1">{displayName}</h1>
            <p className="text-purple-100">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-8 overflow-x-auto">
        {[
          { key: 'profile', label: 'Profile', icon: User },
          { key: 'security', label: 'Security', icon: Shield },
          { key: 'settings', label: 'Settings', icon: SettingsIcon },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
              activeTab === key ? 'bg-purple-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── PROFILE TAB ── */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Personal Information</h2>
          <div className="space-y-6">

            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline w-4 h-4 mr-2" />
                Display Name
              </label>

              {usernameMessage && (
                <div className={`mb-3 p-3 rounded-lg text-sm ${
                  usernameMessage.includes('✅')
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {usernameMessage}
                </div>
              )}

              {!isEditingUsername ? (
                <div className="flex items-center space-x-3">
                  <div className="flex-1 px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-800 font-medium">
                    {displayName}
                  </div>
                  <button
                    onClick={() => { setIsEditingUsername(true); setUsernameInput(displayName); }}
                    className="flex items-center space-x-2 px-4 py-3 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveUsername(); if (e.key === 'Escape') handleCancelUsername(); }}
                    className="w-full px-4 py-3 border-2 border-purple-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 font-medium"
                    placeholder="Enter your display name"
                    maxLength={30}
                    autoFocus
                  />
                  <p className="text-xs text-gray-400">{usernameInput.length}/30 characters · Letters, numbers, spaces, dots and underscores only</p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveUsername}
                      disabled={usernameLoading}
                      className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{usernameLoading ? 'Saving...' : 'Save Name'}</span>
                    </button>
                    <button
                      onClick={handleCancelUsername}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">
                This name appears on your dashboard and throughout the app.
              </p>
            </div>

            {/* Email Field (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline w-4 h-4 mr-2" />
                Email Address
              </label>
              <input
                type="email"
                value={user?.email}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
            </div>

            <div className="pt-4 border-t">
              <p className="text-gray-600 text-sm">
                Your personal information is secure. We use industry-standard encryption to protect your data.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── SECURITY TAB ── */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Security Settings</h2>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('✅') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-6">
            {/* Biometric */}
            <div className="p-6 border-2 border-purple-200 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Fingerprint className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Biometric Authentication</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Use fingerprint or face recognition to login quickly and securely.
                  </p>
                  <div className="space-y-1 text-sm text-gray-600 mb-4">
                    <p>✓ Fingerprint reader support</p>
                    <p>✓ Face ID / Windows Hello</p>
                    <p>✓ Enhanced security</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleEnableBiometric}
                disabled={loading || biometricEnabled}
                className="mt-2 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="enable-biometric-button"
              >
                {loading ? 'Setting up...' : biometricEnabled ? '✓ Biometric Enabled' : 'Enable Biometric Login'}
              </button>
            </div>

            {/* Password */}
            <div className="p-6 border border-gray-200 rounded-xl">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">Password</h3>
                  <p className="text-gray-600 text-sm mb-4">Your password is encrypted and stored securely.</p>

                  {passwordMessage && (
                    <div className={`mb-4 p-3 rounded-lg text-sm ${
                      passwordMessage.includes('✅') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                      {passwordMessage}
                    </div>
                  )}

                  {!showPasswordForm ? (
                    <button
                      onClick={() => setShowPasswordForm(true)}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
                    >
                      Change Password
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <input type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                      <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                      <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                      <div className="flex gap-3">
                        <button onClick={handleChangePassword} disabled={passwordLoading} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50">
                          {passwordLoading ? 'Saving...' : 'Save Password'}
                        </button>
                        <button onClick={() => { setShowPasswordForm(false); setPasswordMessage(''); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">App Settings</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
              <div className="flex items-center space-x-4">
                <Bell className="w-6 h-6 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-gray-800">Daily Reminders</h3>
                  <p className="text-gray-600 text-sm">Get reminded to practice mindfulness</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <p className="text-gray-600 text-sm">
                More settings coming soon: themes, language preferences, data export, and more!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* About */}
      <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
        <h3 className="text-lg font-bold text-gray-800 mb-2">📱 About PRATYAHARA</h3>
        <p className="text-gray-700 text-sm">
          Version 1.0.0 - Your personal mindfulness companion designed for students and anyone seeking inner peace.
          Built with care to support your mental wellness journey.
        </p>
      </div>
    </div>
  );
}

export default Profile;
