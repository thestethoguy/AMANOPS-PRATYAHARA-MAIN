import React, { useState } from 'react';
import axios from 'axios';
import { User, Mail, Lock, Fingerprint, Bell, Shield, Settings as SettingsIcon } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function Profile({ token, user }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleEnableBiometric = async () => {
    if (!window.PublicKeyCredential) {
      setMessage('Biometric authentication not supported on this device');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Get challenge from server
      const challengeResponse = await axios.post(
        `${API_URL}/api/auth/webauthn/register-challenge`,
        { email: user.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { challenge, user_id, rp_id, rp_name } = challengeResponse.data;

      // Create credential
      const publicKeyCredentialCreationOptions = {
        challenge: Uint8Array.from(atob(challenge), c => c.charCodeAt(0)),
        rp: {
          name: rp_name,
          id: rp_id,
        },
        user: {
          id: Uint8Array.from(user_id, c => c.charCodeAt(0)),
          name: user.email,
          displayName: user.email.split('@')[0],
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
        attestation: 'direct',
      };

      // Request credential from authenticator
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      });

      // Send credential to server
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
            <h1 className="text-3xl font-bold mb-1">{user?.email?.split('@')[0]}</h1>
            <p className="text-purple-100">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
            activeTab === 'profile'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
            activeTab === 'security'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Shield className="w-5 h-5" />
          <span>Security</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
            activeTab === 'settings'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <SettingsIcon className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Personal Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline w-4 h-4 mr-2" />
                Email Address
              </label>
              <input
                type="email"
                value={user?.email}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <div className="pt-4 border-t">
              <p className="text-gray-600 text-sm">
                Your personal information is secure. We use industry-standard encryption to protect your data.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Security Settings</h2>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('✅')
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-6">
            {/* Biometric Authentication */}
            <div className="p-6 border-2 border-purple-200 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Fingerprint className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                      Biometric Authentication
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Use fingerprint or face recognition to login quickly and securely.
                      Works with devices that support WebAuthn (most modern browsers and devices).
                    </p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>✓ Fingerprint reader support</p>
                      <p>✓ Face ID / Windows Hello</p>
                      <p>✓ Enhanced security</p>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={handleEnableBiometric}
                disabled={loading || biometricEnabled}
                className="mt-4 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <p className="text-gray-600 text-sm mb-4">
                    Your password is encrypted and stored securely.
                  </p>
                  <button className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all">
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">App Settings</h2>
          <div className="space-y-6">
            {/* Notifications */}
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

            {/* Theme would go here but since we're not implementing it */}
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
