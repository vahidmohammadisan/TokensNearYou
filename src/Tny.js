import React, { useState, useEffect } from 'react';
import { MapPin, Trophy, Compass, RefreshCw } from 'lucide-react';
import { FantasyMap } from './FantasyMap';
import { calculateDistance, generateRandomPoint } from './utils';
import { Card, CardContent } from './components/ui/card';

const TreasureHuntGame = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [treasureLocation, setTreasureLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [found, setFound] = useState(false);
  const [error, setError] = useState(null);
  const [treasuresFound, setTreasuresFound] = useState(0);
  const [username, setUsername] = useState('');
  const [locationPermission, setLocationPermission] = useState(null);
  
  // Calculate base distance based on days since launch
  const calculateBaseDistance = () => {
    const launchDate = new Date('2024-11-23'); // Set your launch date here
    const today = new Date();
    const diffTime = Math.abs(today - launchDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return 20 + (diffDays * 5); // 20m base + 5m per day
  };

  // Initialize Telegram WebApp integration
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.enableClosingConfirmation();
      if (tg.initDataUnsafe?.user?.username) {
        setUsername(tg.initDataUnsafe.user.username);
      }
      tg.expand();
    }
  }, []);

  // Check location permission on mount
  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setLocationPermission(permission.state);
      
      if (permission.state === 'granted') {
        setError(null);
      } else if (permission.state === 'prompt') {
        setError('Please enable location access to play the game.');
      } else if (permission.state === 'denied') {
        setError('Location access is denied. Please enable it in your browser settings.');
      }

      permission.addEventListener('change', handlePermissionChange);
      return () => permission.removeEventListener('change', handlePermissionChange);
    } catch (err) {
      setError('Unable to check location permission.');
    }
  };

  const handlePermissionChange = (e) => {
    setLocationPermission(e.target.state);
    if (e.target.state === 'granted') {
      setError(null);
      startLocationWatch();
    }
  };

  const startLocationWatch = () => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setError(null);
        const newUserLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(newUserLocation);

        if (!treasureLocation) {
          const baseDistance = calculateBaseDistance();
          const newTreasure = generateRandomPoint(
            newUserLocation.lat,
            newUserLocation.lng,
            baseDistance
          );
          setTreasureLocation(newTreasure);
        }

        if (treasureLocation) {
          const dist = calculateDistance(
            newUserLocation.lat,
            newUserLocation.lng,
            treasureLocation.lat,
            treasureLocation.lng
          );
          setDistance(dist);

          if (dist < 5) {
            setFound(true);
            setTreasuresFound(prev => prev + 1);
          }
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setError('Location access denied. Please enable location services to play.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setError('Unable to determine your location. Please check your GPS signal.');
        } else if (error.code === error.TIMEOUT) {
          setError('Location request timed out. Please try again.');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );

    return watchId;
  };

  useEffect(() => {
    if (!gameStarted) return;
    
    if (locationPermission === 'granted') {
      const watchId = startLocationWatch();
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [gameStarted, treasureLocation, locationPermission]);

  const startGame = async () => {
    if (locationPermission !== 'granted') {
      await checkLocationPermission();
    }
    setGameStarted(true);
    setFound(false);
    setTreasureLocation(null);
  };

  const resetGame = () => {
    setGameStarted(false);
    setFound(false);
    setTreasureLocation(null);
    setDistance(null);
  };

  const retryLocation = async () => {
    await checkLocationPermission();
    if (locationPermission === 'granted') {
      setError(null);
      startGame();
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-amber-50 p-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="text-red-600 mb-4">
                <MapPin className="w-12 h-12 mx-auto mb-2" />
              </div>
              <h2 className="text-xl font-bold text-red-700 mb-2">Location Access Required</h2>
              <p className="text-gray-700 mb-4">{error}</p>
              <button
                onClick={retryLocation}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all duration-300"
              >
                <RefreshCw className="w-5 h-5" />
                Retry Location Access
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-amber-50">
      {/* Rest of the component remains the same */}
      {/* Header */}
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-purple-600" />
          </div>
          <span className="text-sm font-medium text-purple-600">
            {username ? `@${username}` : 'Treasure Hunter'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
            {treasuresFound} 🏆
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 flex items-center justify-center">
            <span className="text-xs font-bold text-white">TNY</span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold text-center text-amber-800 mb-6">
              Treasure Hunt Adventure
            </h1>
            
            {!gameStarted ? (
              <div className="space-y-6">
                <ul className="space-y-4 text-gray-700">
                  <li className="flex items-start gap-2">
                    <Compass className="w-5 h-5 mt-1 text-amber-600 flex-shrink-0" />
                    <p>Scan your surroundings with your mobile device to discover hidden treasures nearby.</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 mt-1 text-amber-600 flex-shrink-0" />
                    <p>Avoid crowded areas for better accuracy and a more enjoyable treasure hunting experience.</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <Trophy className="w-5 h-5 mt-1 text-amber-600 flex-shrink-0" />
                    <p>Stay safe! Keep away from dangerous areas and always be aware of your surroundings.</p>
                  </li>
                </ul>
                <button
                  onClick={startGame}
                  className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  Start Adventure
                </button>
              </div>
            ) : found ? (
              <div className="text-center space-y-6">
                <div className="text-yellow-500 text-8xl mb-4">🏆</div>
                <div className="bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-300 rounded-lg p-4">
                  <h2 className="text-xl font-bold text-amber-800 mb-2">Congratulations!</h2>
                  <p className="text-lg text-amber-700">
                    You found the legendary treasure!
                  </p>
                </div>
                <button
                  onClick={resetGame}
                  className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  New Adventure
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <FantasyMap distance={distance || calculateBaseDistance()} />
                
                <div className="text-lg font-semibold text-amber-800 text-center">
                  <span className="inline-flex items-center gap-2">
                    <Compass className="w-6 h-6" />
                    Distance to treasure:{' '}
                    {distance ? `${Math.round(distance)}m` : 'Calculating...'}
                  </span>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-center text-blue-800">
                    Move around to find the treasure!
                    <br />
                    The indicator gets warmer as you get closer.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TreasureHuntGame;