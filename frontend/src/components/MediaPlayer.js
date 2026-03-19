import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { PlayCircle, Music, Video, Headphones, X, Clock, Tag, Pause, StopCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function MediaPlayer({ token }) {
  const [activeTab, setActiveTab] = useState('audio');
  const [audioItems, setAudioItems] = useState([]);
  const [videoItems, setVideoItems] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  // Auto-play audio when selectedMedia changes
  useEffect(() => {
    if (selectedMedia && !isYouTubeUrl(selectedMedia.url)) {
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play()
            .then(() => setIsPlaying(true))
            .catch((e) => console.log('Autoplay blocked by browser:', e));
        }
      }, 300);
    }
  }, [selectedMedia]);

  const fetchMedia = async () => {
    try {
      const [audioRes, videoRes] = await Promise.all([
        axios.get(`${API_URL}/api/media/audio`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/media/videos`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      
      // Hotfix: Replace broken YouTube URLs coming from the deployed backend
      const patchedAudioData = audioRes.data.map(item => {
        if (item.id === 'audio_1') {
          return { ...item, url: 'https://www.youtube.com/watch?v=jA4GBfxQxzg', thumbnail: 'https://img.youtube.com/vi/jA4GBfxQxzg/hqdefault.jpg' };
        } else if (item.id === 'audio_3') {
          return { ...item, url: 'https://www.youtube.com/watch?v=nwRoHC83wx0', thumbnail: 'https://img.youtube.com/vi/nwRoHC83wx0/hqdefault.jpg' };
        } else if (item.id === 'audio_4') {
          return { ...item, url: 'https://www.youtube.com/watch?v=Ss6V_PCDtUw', thumbnail: 'https://img.youtube.com/vi/Ss6V_PCDtUw/hqdefault.jpg' };
        } else if (item.id === 'audio_6') {
          return { 
            ...item, 
            title: "Om Mani Padme Hum",
            category: "Chanting",
            description: "Peaceful Buddhist chanting for deep meditation",
            url: 'https://www.youtube.com/watch?v=mvBLSJWk6HE', 
            thumbnail: 'https://img.youtube.com/vi/mvBLSJWk6HE/hqdefault.jpg' 
          };
        }
        return item;
      });

      setAudioItems(patchedAudioData);
      setVideoItems(videoRes.data);
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const isYouTubeUrl = (url) => {
    return url && (url.includes('youtube.com') || url.includes('youtu.be'));
  };

  const handleMediaClick = (media) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
    setSelectedMedia(media);
  };

  const handleCloseModal = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
    setSelectedMedia(null);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch((e) => console.log('Play error:', e));
      }
    }
  };

  const mediaItems = activeTab === 'audio' ? audioItems : videoItems;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-white rounded-2xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-64 bg-white rounded-2xl"></div>
            <div className="h-64 bg-white rounded-2xl"></div>
            <div className="h-64 bg-white rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" data-testid="media-player">

      {/* MODAL POPUP PLAYER */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-lg">{selectedMedia.title}</h2>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="flex items-center space-x-1 text-purple-200 text-sm">
                    <Tag className="w-3 h-3" />
                    <span>{selectedMedia.category}</span>
                  </span>
                  <span className="flex items-center space-x-1 text-purple-200 text-sm">
                    <Clock className="w-3 h-3" />
                    <span>{selectedMedia.duration}</span>
                  </span>
                  {isPlaying && (
                    <span className="text-green-300 text-sm font-bold animate-pulse">▶ Playing</span>
                  )}
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Player */}
            {isYouTubeUrl(selectedMedia.url) ? (
              <div className="aspect-video bg-black">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${getYouTubeId(selectedMedia.url)}?autoplay=1&rel=0`}
                  title={selectedMedia.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-purple-900 to-indigo-900 p-8 flex flex-col items-center">
                <div className="w-48 h-48 rounded-2xl overflow-hidden mb-6 shadow-2xl">
                  <img
                    src={selectedMedia.thumbnail}
                    alt={selectedMedia.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Om_symbol.svg/320px-Om_symbol.svg.png';
                    }}
                  />
                </div>
                <h3 className="text-white text-xl font-bold mb-1 text-center">{selectedMedia.title}</h3>
                <p className="text-purple-300 text-sm mb-6 text-center">{selectedMedia.category}</p>

                {/* Big Play/Pause Button */}
                <button
                  onClick={togglePlay}
                  className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform mb-6"
                >
                  {isPlaying ? (
                    <Pause className="w-10 h-10 text-purple-600" />
                  ) : (
                    <PlayCircle className="w-10 h-10 text-purple-600" />
                  )}
                </button>

                {/* Audio controls (fallback) */}
                <audio
                  ref={audioRef}
                  src={selectedMedia.url}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  controls
                  className="w-full mt-2"
                  crossOrigin="anonymous"
                >
                  Your browser does not support audio.
                </audio>
              </div>
            )}

            {/* Footer */}
            <div className="p-4 bg-gray-50">
              <p className="text-gray-600 text-sm">{selectedMedia.description}</p>
              <button
                onClick={handleCloseModal}
                className="mt-3 w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-all flex items-center justify-center space-x-2"
              >
                <StopCircle className="w-4 h-4" />
                <span>Stop & Close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 mb-8 text-white shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
            <Headphones className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Media Library</h1>
            <p className="text-purple-100">Click any card to play instantly 🎵</p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex space-x-2 mb-8">
        <button
          onClick={() => setActiveTab('audio')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'audio' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          data-testid="audio-tab"
        >
          <Music className="w-5 h-5" />
          <span>Audio</span>
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'video' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          data-testid="video-tab"
        >
          <Video className="w-5 h-5" />
          <span>Videos</span>
        </button>
      </div>

      {/* MEDIA GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mediaItems.map((item) => (
          <div
            key={item.id}
            onClick={() => handleMediaClick(item)}
            className={`bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all transform hover:scale-105 group ${
              selectedMedia?.id === item.id ? 'ring-4 ring-purple-500 shadow-2xl' : 'hover:shadow-2xl'
            }`}
            data-testid={`media-${item.id}`}
          >
            <div className="relative aspect-video bg-gradient-to-br from-purple-100 to-pink-100">
              <img
                src={
                  isYouTubeUrl(item.url)
                    ? `https://img.youtube.com/vi/${getYouTubeId(item.url)}/hqdefault.jpg`
                    : item.thumbnail
                }
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Om_symbol.svg/320px-Om_symbol.svg.png';
                }}
              />
              <div className={`absolute inset-0 flex items-center justify-center transition-all ${
                selectedMedia?.id === item.id ? 'bg-purple-900 bg-opacity-60' : 'bg-black bg-opacity-30 group-hover:bg-opacity-50'
              }`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform ${
                  selectedMedia?.id === item.id && isPlaying ? 'bg-green-400' : 'bg-white bg-opacity-90'
                }`}>
                  {selectedMedia?.id === item.id && isPlaying ? (
                    <Pause className="w-8 h-8 text-white" />
                  ) : (
                    <PlayCircle className="w-10 h-10 text-purple-600" />
                  )}
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                {item.duration}
              </div>
              <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1">
                {item.type === 'audio' ? <Music className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                <span>{item.type === 'audio' ? 'Audio' : 'Video'}</span>
              </div>
              {selectedMedia?.id === item.id && isPlaying && (
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-bold animate-pulse">
                  ▶ Playing
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-800 mb-1 line-clamp-2">{item.title}</h3>
              <p className="text-gray-500 text-sm line-clamp-2 mb-3">{item.description}</p>
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  {item.category}
                </span>
                <span className="text-purple-600 text-xs font-semibold flex items-center space-x-1">
                  <PlayCircle className="w-4 h-4" />
                  <span>Tap to Play</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* INFO BOX */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-purple-200">
        <h3 className="text-lg font-bold text-gray-800 mb-2">🎵 About Our Media Library</h3>
        <p className="text-gray-700 text-sm">
          Click any card to play instantly. Audio tracks use a built-in player, videos open YouTube. All content is copyright-free.
        </p>
      </div>
    </div>
  );
}

export default MediaPlayer;