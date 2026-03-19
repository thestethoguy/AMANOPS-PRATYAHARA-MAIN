import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Timer, Play, Pause, RotateCcw, Volume2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function Meditation({ token }) {
  const [duration, setDuration] = useState(5); // minutes
  const [timeLeft, setTimeLeft] = useState(duration * 60); // seconds
  const [isActive, setIsActive] = useState(false);
  const [completed, setCompleted] = useState(false);

  const durations = [5, 10, 15, 20, 30];

  useEffect(() => {
    let interval = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            setIsActive(false);
            setCompleted(true);
            saveSessionAndUpdateStreak();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    } else if (!isActive && timeLeft !== 0) {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const saveSessionAndUpdateStreak = async () => {
    try {
      await axios.post(
        `${API_URL}/api/meditation`,
        {
          duration_minutes: duration,
          session_type: "meditation",
          rounds_completed: null
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (error) {
      console.error('Error saving meditation session:', error);
    }
  };

  const handleStart = () => {
    setIsActive(true);
    setCompleted(false);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(duration * 60);
    setCompleted(false);
  };

  const handleDurationChange = (newDuration) => {
    setDuration(newDuration);
    setTimeLeft(newDuration * 60);
    setIsActive(false);
    setCompleted(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" data-testid="meditation">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Timer className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Meditation Timer</h1>
          <p className="text-gray-600">Find your inner peace</p>
        </div>

        {/* Duration Selection */}
        {!isActive && !completed && (
          <div className="mb-8">
            <label className="block text-center text-lg font-semibold text-gray-700 mb-4">
              Choose Duration
            </label>
            <div className="flex justify-center gap-3">
              {durations.map((d) => (
                <button
                  key={d}
                  onClick={() => handleDurationChange(d)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    duration === d
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  data-testid={`duration-${d}`}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Timer Display */}
        <div className="relative w-64 h-64 mx-auto mb-8">
          {/* Progress Ring */}
          <svg className="transform -rotate-90 w-full h-full">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="#E5E7EB"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 120}`}
              strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9333EA" />
                <stop offset="100%" stopColor="#DB2777" />
              </linearGradient>
            </defs>
          </svg>

          {/* Time Display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-800" data-testid="timer-display">
                {formatTime(timeLeft)}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {isActive ? 'In Progress' : completed ? 'Completed!' : 'Ready'}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {!isActive ? (
            <button
              onClick={handleStart}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
              data-testid="start-button"
            >
              <Play className="w-5 h-5" />
              <span>{completed ? 'Restart' : 'Start'}</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center space-x-2 bg-orange-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-orange-600 transition-all shadow-lg"
              data-testid="pause-button"
            >
              <Pause className="w-5 h-5" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={handleReset}
            className="flex items-center space-x-2 bg-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-300 transition-all"
            data-testid="reset-button"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Completed Message */}
        {completed && (
          <div className="mt-8 p-4 bg-green-50 border-2 border-green-200 rounded-xl text-center">
            <p className="text-green-700 font-semibold text-lg">
              🎉 Great job! You've completed your meditation session.
            </p>
            <p className="text-green-600 text-sm mt-1">
              Your streak has been updated!
            </p>
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
          <h3 className="font-bold text-gray-800 mb-2 flex items-center">
            <Volume2 className="w-5 h-5 mr-2" />
            Meditation Tips
          </h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Find a quiet, comfortable place to sit</li>
            <li>• Close your eyes and focus on your breath</li>
            <li>• Let thoughts come and go without judgment</li>
            <li>• Start with shorter sessions and build up gradually</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Meditation;
