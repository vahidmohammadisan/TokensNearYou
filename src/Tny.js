import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trophy } from 'lucide-react';
import { supabase } from './supabaseClient';
import { generateRandomPoint, calculateDistance } from './utils';
import { saveScore, fetchScore } from './utils';////score

// Splash Screen Component
const SplashScreen = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 100);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-br from-purple-500 to-amber-500 flex items-center justify-center"
    >
      {/* Add your splash video or image here */}
      {/* <video 
        autoPlay 
        muted 
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/path-to-your-splash-video.mp4" type="video/mp4" />
      </video> */}

      <img 
        src="/splash-screen.png" 
        alt="Splash Screen" 
        className="absolute inset-0 w-full h-full object-cover"
      />

    </motion.div>
  );
  
};

// Main Screen Component
const MainScreen = ({ username, score, onComplete }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-50 to-amber-50 flex flex-col items-center justify-center p-4">
      {/* Splash Image */}
      <img
        src="/map-screen.png"
        alt="Splash Screen"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Top Bar */}
      <div className="relative flex w-full justify-between backdrop-blur-md shadow-md">
        {/* Username Section */}
        <div className="flex items-center gap-2">
          <Send className="w-6 h-6 text-purple-600" />
          <span className="text-xl font-bold text-purple-800">
            {username}
          </span>
        </div>

        {/* Score Section */}
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-600" />
          <span className="text-xl font-bold text-amber-800">
            {score}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center mt-auto">
        <button
          onClick={onComplete}
          className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          Play
        </button>
      </div>
    </div>
  );
};


// Location Permission Screen
const LocationPermissionScreen = ({ onPermissionGranted }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Generate initial treasure location
        const initialLocation = generateRandomPoint(
          position.coords.latitude, 
          position.coords.longitude, 
          300
        );
        onPermissionGranted({
          userLocation: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          },
          treasureLocation: initialLocation
        });
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-gradient-to-br from-purple-50 to-amber-50 flex flex-col items-center justify-center p-4"
    >
      {/* Background video with alpha layer */}
      <video 
        autoPlay 
        loop 
        muted 
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      >
        <source src="/path-to-background-video.mp4" type="video/mp4" />
      </video>

      <img 
        src="/map-screen.png" 
        alt="Splash Screen" 
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="relative z-10 text-center">
        <h2 className="text-2xl font-bold mb-4 text-amber-800">
          We need your current location
        </h2>
        {error && (
          <p className="text-red-600 mb-4">{error}</p>
        )}
        <button 
          onClick={requestLocation}
          disabled={loading}
          className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          {loading ? 'getting the location...' : 'Agree'}
        </button>
      </div>
    </motion.div>
  );
};

// Game Screen
const GameScreen = ({
  username,
  score,
  userLocation,
  treasureLocation,
  onLocationChange,
}) => {
  const [distance, setDistance] = useState(null);
  const [objectPosition, setObjectPosition] = useState(0);

  useEffect(() => {
    const calculateDistanceAndPosition = () => {
      if (userLocation && treasureLocation) {
        const dist = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          treasureLocation.lat,
          treasureLocation.lng
        );

        setDistance(dist);

        // Calculate object position based on distance (closer = higher)
        const maxDistance = 100; // Adjust as needed
        const position = 1 - Math.min(dist, maxDistance) / maxDistance;
        setObjectPosition(position * 100); // Percentage
      }
    };

    calculateDistanceAndPosition();
  }, [userLocation, treasureLocation]); // Recalculate when userLocation changes

  useEffect(() => {
    // Example to fetch new location periodically or via an event
    const locationUpdateInterval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          onLocationChange(newLocation); // Notify parent of location update
        },
        (error) => console.error('Location update failed:', error),
        { enableHighAccuracy: true }
      );
    }, 5000); // Update every 5 seconds

    return () => clearInterval(locationUpdateInterval); // Cleanup on unmount
  }, [onLocationChange]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-50 to-amber-50">
      {/* Top Bar */}
      <div className="flex justify-between p-4">
        {/* Username Section */}
        <div className="flex items-center gap-2">
          <Send className="w-6 h-6 text-purple-600" />
          <span className="text-xl font-bold text-purple-800">
            {username}
          </span>
        </div>

        {/* Score Section */}
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-600" />
          <span className="text-xl font-bold text-amber-800">
            {score}
          </span>
        </div>
      </div>

      {/* Center Text */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <p className="text-xl font-bold text-amber-800">
          {distance !== null ? `You are ${Math.round(distance)}m away` : 'Locating...'}
        </p>
      </div>
    </div>
  );
};


// Main App Component
const TreasureHuntApp = () => {
  const [stage, setStage] = useState('splash');
  const [username, setUsername] = useState('user');
  const [score, setScore] = useState(100);
  const [gameData, setGameData] = useState(null);
  const [userLocation, setUserLocation] = useState(null); // Track user location

  useEffect(() => {
    // Telegram WebApp integration
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.enableClosingConfirmation();

      if (tg.initDataUnsafe?.user?.username) {
        setUsername(tg.initDataUnsafe.user.username);
      }

      tg.expand();
    }
  }, []);

  const handleSplashComplete = () => {
    setStage('main');
  };

  const handleOnGoToPaly = () => {
    setStage('permission');
  };

  const handlePermissionGranted = (data) => {
    setGameData(data);
    setUserLocation(data.userLocation); // Initialize user location
    setStage('game');
  };

  const updateUserLocation = (location) => {
    setUserLocation(location); // Update user location dynamically
  };

  return (
    <AnimatePresence>
      {stage === 'splash' && <SplashScreen onComplete={handleSplashComplete} />}
      {stage === 'main' && (
        <MainScreen
          username={username}
          score={score}
          onComplete={handleOnGoToPaly}
        />
      )}
      {stage === 'permission' && (
        <LocationPermissionScreen onPermissionGranted={handlePermissionGranted} />
      )}
      {stage === 'game' && gameData && userLocation && (
        <GameScreen
          username={username}
          score={score}
          userLocation={userLocation}
          treasureLocation={gameData.treasureLocation}
          onLocationChange={updateUserLocation} // Handle dynamic updates
        />
      )}
    </AnimatePresence>
  );
};


export default TreasureHuntApp;