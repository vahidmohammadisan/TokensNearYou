import React, { useState, useEffect,useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabaseClient';
import { generateRandomPoint, calculateDistance } from './utils';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents  } from 'react-leaflet';
import L from 'leaflet';
// Leaflet Default Icon Fix
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { saveScore, fetchScore } from './utils';////score
import 'leaflet/dist/leaflet.css';
import { Compass, Trophy, MapPin, XCircle,Send } from 'lucide-react';


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
const MainScreen = ({ username, score, onPlay1, onPlay2 }) => {
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
          onClick={onPlay1}
          className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          Play
        </button>

        <button
          onClick={onPlay2}
          className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          Play
        </button>
      </div>
    </div>
  );
};


// Location Permission Screen
const LocationPermissionScreen1 = ({ onPermissionAcknowledged }) => {
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

// Location Permission Screen
const LocationPermissionScreen2 = ({ onPermissionAcknowledged }) => {
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
const GameScreen1 = ({ username, score }) => {
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


let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Markers
const UserMarkerIcon = L.icon({
  iconUrl: '/user-marker.png', // Fantasy-style user marker
  iconSize: [50, 50],
  iconAnchor: [25, 50],
  popupAnchor: [0, -50]
});

const TreasureMarkerIcon = L.icon({
  iconUrl: '/treasure-marker.png', // Fantasy-style treasure marker
  iconSize: [60, 60],
  iconAnchor: [30, 60],
  popupAnchor: [0, -60]
});

// Map Interaction Component
const MapTracker = ({ userLocation, onMapMove }) => {
  const map = useMapEvents({
    move: () => {
      // Track map center when user manually moves the map
      const center = map.getCenter();
      onMapMove({
        lat: center.lat,
        lng: center.lng
      });
    },
    zoomend: () => {
      // Optional: Handle zoom changes if needed
      const zoom = map.getZoom();
      console.log('Current Zoom:', zoom);
    }
  });

  // Automatically center map on user location
  useEffect(() => {
    if (userLocation) {
      map.setView(userLocation, 15);
    }
  }, [userLocation, map]);

  return null;
};

const ResizeMap = () => {
  const map = useMap();
  map._onResize();
  return null;
};

// Game Screen Component
const GameScreen2 = ({ username, score, onExit }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [treasureLocation, setTreasureLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [distance, setDistance] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isVictory, setIsVictory] = useState(false);
  const [watchId, setWatchId] = useState(null);

  const calculateCurrentDistance = useCallback((currentLocation, treasureLoc) => {
    if (currentLocation && treasureLoc) {
      const dist = calculateDistance(
        currentLocation.lat, 
        currentLocation.lng, 
        treasureLoc.lat, 
        treasureLoc.lng
      );
      setDistance(dist);

      if (dist <= 10) {
        setIsVictory(true);
      }
    }
  }, []);

  useEffect(() => {
    // Previous setup logic remains the same
    // ...
  }, [calculateCurrentDistance]);

  if (locationError) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white shadow-2xl rounded-2xl p-8 text-center">
          <XCircle className="mx-auto mb-4 text-red-500" size={64} />
          <p className="text-red-600 text-xl font-semibold">{locationError}</p>
          <p className="text-gray-500 mt-2">Please check your location settings</p>
        </div>
      </div>
    );
  }

  if (!userLocation || !treasureLocation) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <Compass className="text-purple-600 mb-4" size={64} />
          <p className="text-2xl text-purple-800 font-bold">Locating treasure...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-gradient-to-br from-indigo-50 to-purple-50"
    >
      {isVictory && (
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute z-50 inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center"
        >
          <Trophy className="text-yellow-400 mb-6" size={96} />
          <h2 className="text-4xl font-extrabold text-yellow-400 mb-6 text-center px-4">
            Congratulations! 🏆
          </h2>
          <p className="text-white text-xl mb-6 text-center px-4">
            You've found the treasure, {username}!
          </p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onExit}
            className="px-8 py-4 bg-yellow-500 text-white rounded-full text-lg font-bold shadow-lg hover:bg-yellow-600 transition-all"
          >
            Exit Adventure
          </motion.button>
        </motion.div>
      )}
  
      <div className="absolute inset-0 bottom-[120px]">
        <MapContainer 
          center={mapCenter || userLocation} 
          zoom={15}
          scrollWheelZoom={true}
          zoomControl={true}
          className="h-full w-full rounded-b-3xl shadow-lg"
        >
          <ResizeMap />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={userLocation} icon={UserMarkerIcon}>
            <Popup>Your Current Location</Popup>
          </Marker>
          <Marker position={treasureLocation} icon={TreasureMarkerIcon}>
            <Popup>Treasure Awaits!</Popup>
          </Marker>
        </MapContainer>
      </div>
  
      <div className="absolute bottom-0 left-0 w-full bg-white/90 rounded-t-3xl px-6 py-4 flex items-center justify-between gap-4 h-[120px] shadow-2xl">
        <div className="flex items-center gap-4">
          <MapPin className="text-purple-600" size={32} />
          <p className="text-xl font-bold text-purple-800">
            {distance ? `${Math.round(distance)}m to Treasure` : 'Locating...'}
          </p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onExit}
          className="px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center gap-2 transition-all shadow-md"
        >
          <XCircle size={20} />
          Exit Game
        </motion.button>
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

  const handleOnGoToPlay1 = () => {
    setStage('permission1');
  };

  const handleOnGoToPlay2 = () => {
    setStage('permission2');
  };

  const handlePermissionAcknowledged1 = () => {
    setStage('game1');
  };

  const handlePermissionAcknowledged2 = () => {
    setStage('game2');
  };

  const handleExitGame = () => {
    setStage('main');
  };

  return (
    <AnimatePresence>
      {stage === 'splash' && <SplashScreen onComplete={handleSplashComplete} />}
      {stage === 'main' && (
        <MainScreen
          username={username}
          score={score}
          onPlay1={handleOnGoToPlay1}
          onPlay2={handleOnGoToPlay2}
        />
      )}
      {stage === 'permission1' && (
        <LocationPermissionScreen1 onPermissionAcknowledged={handlePermissionAcknowledged1} />
      )}
      {stage === 'permission2' && (
        <LocationPermissionScreen2 onPermissionAcknowledged={handlePermissionAcknowledged2} />
      )}
      {stage === 'game1' && (
        <GameScreen1
          username={username}
          score={score}
        />
      )}
      {stage === 'game2' && (
        <GameScreen2
          username={username}
          score={score}
          onExit={handleExitGame}
        />
      )}
    </AnimatePresence>
  );
};

export default TreasureHuntApp;