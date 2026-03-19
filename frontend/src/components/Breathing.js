import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
import { Wind, Play, Pause } from 'lucide-react';

function Breathing({ token }) {
  const [phase, setPhase] = useState('ready'); // ready, inhale, hold, exhale
  const [count, setCount] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [rounds, setRounds] = useState(0);

  const breathingPattern = [
    { phase: 'inhale', duration: 4, instruction: 'Breathe In', color: 'from-blue-400 to-blue-600' },
    { phase: 'hold', duration: 4, instruction: 'Hold', color: 'from-purple-400 to-purple-600' },
    { phase: 'exhale', duration: 4, instruction: 'Breathe Out', color: 'from-pink-400 to-pink-600' },
    { phase: 'hold', duration: 4, instruction: 'Hold', color: 'from-indigo-400 to-indigo-600' },
  ];

  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  const currentPattern = breathingPattern[currentPatternIndex];

  useEffect(() => {
    let interval = null;

    if (isActive) {
      interval = setInterval(() => {
        setCount((prevCount) => {
          if (prevCount >= currentPattern.duration - 1) {
            // Move to next phase
            setCurrentPatternIndex((prevIndex) => {
              const nextIndex = (prevIndex + 1) % breathingPattern.length;
              if (nextIndex === 0) {
                setRounds((r) => r + 1);
              }
              return nextIndex;
            });
            return 0;
          }
          return prevCount + 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isActive, currentPattern, currentPatternIndex]);

  const saveBreathingSession = async (completedRounds) => {
    if (completedRounds === 0 || !token) return;
    try {
      await axios.post(
        `${API_URL}/api/meditation`,
        {
          duration_minutes: Math.round((completedRounds * 16) / 60),
          session_type: "breathing",
          rounds_completed: completedRounds
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (error) {
      console.error('Error saving breathing session:', error);
    }
  };
  const handleStart = () => {
    setIsActive(true);
    if (phase === 'ready') {
      setPhase('inhale');
      setCount(0);
      setRounds(0);
    }
  };

  const handlePause = () => {
    setIsActive(false);
    saveBreathingSession(rounds);
  };

  const handleReset = () => {
    saveBreathingSession(rounds);
    setIsActive(false);
    setPhase('ready');
    setCount(0);
    setCurrentPatternIndex(0);
    setRounds(0);
  };

  const scale = isActive
    ? currentPattern.phase === 'inhale'
      ? 1.5
      : currentPattern.phase === 'exhale'
      ? 0.8
      : 1.2
    : 1;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" data-testid="breathing">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wind className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Breathing Exercise</h1>
          <p className="text-gray-600">Box Breathing (4-4-4-4 Pattern)</p>
        </div>

        {/* Breathing Circle */}
        <div className="relative w-80 h-80 mx-auto mb-8">
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${currentPattern.color} transition-all duration-1000 ease-in-out flex items-center justify-center`}
            style={{
              transform: `scale(${scale})`,
              opacity: 0.8,
            }}
          >
            <div className="text-center text-white">
              <div className="text-6xl font-bold mb-2" data-testid="breathing-count">
                {currentPattern.duration - count}
              </div>
              <div className="text-2xl font-semibold" data-testid="breathing-instruction">
                {isActive ? currentPattern.instruction : 'Ready'}
              </div>
            </div>
          </div>
        </div>

        {/* Rounds Counter */}
        {isActive && (
          <div className="text-center mb-6">
            <p className="text-lg text-gray-600">
              Rounds Completed: <span className="font-bold text-purple-600">{rounds}</span>
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {!isActive ? (
            <button
              onClick={handleStart}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
              data-testid="start-breathing-button"
            >
              <Play className="w-5 h-5" />
              <span>Start</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center space-x-2 bg-orange-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-orange-600 transition-all shadow-lg"
              data-testid="pause-breathing-button"
            >
              <Pause className="w-5 h-5" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={handleReset}
            className="bg-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-300 transition-all"
            data-testid="reset-breathing-button"
          >
            Reset
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
          <h3 className="font-bold text-gray-800 mb-3">How to Practice</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span><strong>Inhale</strong> through your nose for 4 seconds</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span><strong>Hold</strong> your breath for 4 seconds</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-pink-500"></div>
              <span><strong>Exhale</strong> through your mouth for 4 seconds</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
              <span><strong>Hold</strong> again for 4 seconds</span>
            </div>
          </div>
          <p className="mt-4 text-gray-600 text-sm">
            This technique helps reduce stress, improve focus, and calm your nervous system.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Breathing;
