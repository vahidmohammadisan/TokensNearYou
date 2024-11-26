import React, { useState, useEffect,useCallback } from 'react';
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
const LocationPermissionScreen = ({ onPermissionAcknowledged }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-gradient-to-br from-purple-50 to-amber-50 flex flex-col items-center justify-center p-4"
    >
      {/* Background image */}
      <img 
        src="/map-screen.png" 
        alt="Location Permission" 
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      />

      <div className="relative z-10 text-center max-w-md px-4">
        <h2 className="text-2xl font-bold mb-4 text-amber-800">
          Location Required
        </h2>
        <p className="text-lg mb-6 text-purple-800">
          This treasure hunt game requires your location to generate a nearby treasure spot. 
          We'll use your current location to create a unique hunting experience.
        </p>
        <button 
          onClick={onPermissionAcknowledged}
          className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          I Understand, Let's Play
        </button>
      </div>
    </motion.div>
  );
};

// Game Screen (with Location Retrieval)
const GameScreen = ({ username, score }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [treasureLocation, setTreasureLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [watchId, setWatchId] = useState(null);

  // Function to calculate distance
  const calculateCurrentDistance = useCallback((currentLocation, treasureLoc) => {
    if (currentLocation && treasureLoc) {
      const dist = calculateDistance(
        currentLocation.lat, 
        currentLocation.lng, 
        treasureLoc.lat, 
        treasureLoc.lng
      );
      setDistance(dist);
    }
  }, []);

  useEffect(() => {
    // Initial location setup and treasure generation
    const setupInitialLocation = () => {
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by your browser');
        return;
      }

      // First, get initial position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Set user's current location
          const currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(currentLocation);

          // Generate treasure location near the user
          const generatedTreasureLocation = generateRandomPoint(
            currentLocation.lat, 
            currentLocation.lng, 
            300 // 300 meters radius
          );
          setTreasureLocation(generatedTreasureLocation);

          // Set up continuous location watching
          const id = navigator.geolocation.watchPosition(
            (newPosition) => {
              const newLocation = {
                lat: newPosition.coords.latitude,
                lng: newPosition.coords.longitude
              };
              setUserLocation(prevLocation => {
                // Only update and recalculate if location has significantly changed
                if (!prevLocation || 
                    calculateDistance(
                      prevLocation.lat, prevLocation.lng, 
                      newLocation.lat, newLocation.lng
                    ) > 5 // Recalculate if moved more than 5 meters
                ) {
                  calculateCurrentDistance(newLocation, generatedTreasureLocation);
                  return newLocation;
                }
                return prevLocation;
              });
            },
            (err) => {
              setLocationError(err.message);
            },
            {
              enableHighAccuracy: true, // More accurate location
              maximumAge: 0, // Always get fresh location
              timeout: 5000 // 5 seconds timeout
            }
          );

          setWatchId(id);
        },
        (err) => {
          setLocationError(err.message);
        }
      );
    };

    setupInitialLocation();

    // Cleanup function to stop watching location when component unmounts
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  // Recalculate distance whenever user location or treasure location changes
  useEffect(() => {
    calculateCurrentDistance(userLocation, treasureLocation);
  }, [userLocation, treasureLocation, calculateCurrentDistance]);

  // Render loading or error states
  if (locationError) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-50 to-amber-50 flex items-center justify-center">
        <p className="text-red-600 text-xl">{locationError}</p>
      </div>
    );
  }

  if (!userLocation || !treasureLocation) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-50 to-amber-50 flex items-center justify-center">
        <p className="text-xl text-purple-800">Locating treasure...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-gradient-to-br from-purple-50 to-amber-50"
    >
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
          Treasure is {distance ? `${Math.round(distance)}m away` : 'Locating...'}
        </p>
      </div>
    </motion.div>
  );
};
// Main App Component
const TreasureHuntApp = () => {
  const [stage, setStage] = useState('splash');
  const [username, setUsername] = useState('user');
  const [score, setScore] = useState(100);

  useEffect(() => {
    // Telegram WebApp integration
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.enableClosingConfirmation();

      if (tg.initDataUnsafe?.user?.username) {
        setUsername(tg.initDataUnsafe.user.username);
      }

      tg.expand();
  }}, []);

  const handleSplashComplete = () => {
    setStage('main');
  };

  const handleOnGoToPlay = () => {
    setStage('permission');
  };

  const handlePermissionAcknowledged = () => {
    setStage('game');
  };

  return (
    <AnimatePresence>
      {stage === 'splash' && <SplashScreen onComplete={handleSplashComplete} />}
      {stage === 'main' && (
        <MainScreen
          username={username}
          score={score}
          onComplete={handleOnGoToPlay}
        />
      )}
      {stage === 'permission' && (
        <LocationPermissionScreen onPermissionAcknowledged={handlePermissionAcknowledged} />
      )}
      {stage === 'game' && (
        <GameScreen
          username={username}
          score={score}
        />
      )}
    </AnimatePresence>
  );
};

export default TreasureHuntApp;