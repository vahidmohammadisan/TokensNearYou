import React, { useState, useEffect } from 'react';
import { Camera, User, Map, Award } from 'lucide-react';

const TreasureHuntApp = () => {
  const [stage, setStage] = useState('splash');
  const [username, setUsername] = useState('');
  const [userScore, setUserScore] = useState(0);
  const [location, setLocation] = useState(null);
  const [treasureLocation, setTreasureLocation] = useState(null);
  const [islands, setIslands] = useState([
    { x: 100, y: 300 },
    { x: 300, y: 400 },
    { x: 500, y: 200 },
    { x: 400, y: 600 },
  ]);
  const [selectedIsland, setSelectedIsland] = useState(null);

  // Splash Screen (4 seconds)
  useEffect(() => {
    const timer = setTimeout(() => setStage('main'), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Simulate getting Telegram username (in real app, use Telegram API)
  useEffect(() => {
    setUsername('UserExample');
  }, []);

  const requestLocationPermission = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          
          // Generate treasure location within 50-300m range
          const treasureLat = latitude + (Math.random() * 0.003) - 0.0015;
          const treasureLng = longitude + (Math.random() * 0.003) - 0.0015;
          setTreasureLocation({ lat: treasureLat, lng: treasureLng });
          
          // Select one of the islands as the treasure island
          setSelectedIsland(islands[Math.floor(Math.random() * islands.length)]);
          
          setStage('game');
        },
        (error) => {
          alert('Location is not available. Please allow the permission.');
        }
      );
    } else {
      alert('Location is not supported on this device');
    }
  };

  const calculateDistance = (loc1, loc2) => {
    const R = 6371e3; // meters
    const φ1 = loc1.lat * Math.PI/180;
    const φ2 = loc2.lat * Math.PI/180;
    const Δφ = (loc2.lat-loc1.lat) * Math.PI/180;
    const Δλ = (loc2.lng-loc1.lng) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // distance in meters
  };

  const renderSplashScreen = () => (
    <div className="flex items-center justify-center h-screen bg-blue-500">
      <img 
        src="/api/placeholder/300/400" 
        alt="Splash Screen" 
        className="w-64 h-64 object-cover rounded-lg"
      />
    </div>
  );

  const renderMainScreen = () => (
    <div className="h-screen bg-cover" style={{backgroundImage: 'url(/api/placeholder/400/800)'}}>
      <div className="flex justify-between p-4">
        <div className="flex items-center">
          <img 
            src="/api/placeholder/50/50" 
            alt="Profile" 
            className="w-12 h-12 rounded-full mr-2"
          />
          <span>{username}</span>
        </div>
        <div className="flex items-center">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-2">
            TNY
          </div>
          <span>{userScore}</span>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 flex space-x-4">
        <button 
          onClick={() => setStage('game-start')} 
          className="flex-1 bg-green-500 text-white py-3 rounded-lg"
        >
          Play
        </button>
        <button 
          className="flex-1 bg-blue-500 text-white py-3 rounded-lg"
        >
          Invite Friends
        </button>
      </div>
    </div>
  );

  const renderGameStartScreen = () => (
    <div className="h-screen flex flex-col items-center justify-center bg-blue-100">
      <p>This game requires access to your location to find the hidden treasure.</p>
      <button 
        onClick={requestLocationPermission}
        className="bg-green-500 text-white px-6 py-3 rounded-lg mt-4"
      >
        Allow Location Access
      </button>
    </div>
  );

  const renderGameScreen = () => {
    const distance = location && treasureLocation 
      ? calculateDistance(location, treasureLocation) 
      : Infinity;

    // Curved ship path logic
    const shipPosition = {
      top: `${selectedIsland?.y || 0}%`,
      left: `${selectedIsland?.x || 0}%`
    };

    if (distance < 50) {
      setStage('treasure-found');
    }

    return (
      <div className="h-screen relative" style={{backgroundImage: 'url(/api/placeholder/400/800)'}}>
        <div className="flex justify-between p-4">
          <div className="flex items-center">
            <img 
              src="/api/placeholder/50/50" 
              alt="Profile" 
              className="w-12 h-12 rounded-full mr-2"
            />
            <span>{username}</span>
          </div>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-2">
              TNY
            </div>
            <span>{userScore}</span>
          </div>
        </div>
        
        {/* Islands and Ship */}
        {islands.map((island, index) => (
          <div 
            key={index}
            className="absolute w-16 h-16 bg-gray-400 rounded-full"
            style={{
              top: `${island.y}%`, 
              left: `${island.x}%`
            }}
          >
            {index + 1}
          </div>
        ))}
        <div 
          className="absolute w-16 h-16 bg-black rounded-full" 
          style={shipPosition}
        >
          Pirate Ship
        </div>
      </div>
    );
  };

  const renderTreasureFoundScreen = () => (
    <div className="h-screen flex items-center justify-center bg-gold-500">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Congratulations! 🎉</h1>
        <p>You found the hidden treasure</p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch(stage) {
      case 'splash': return renderSplashScreen();
      case 'main': return renderMainScreen();
      case 'game-start': return renderGameStartScreen();
      case 'game': return renderGameScreen();
      case 'treasure-found': return renderTreasureFoundScreen();
      default: return null;
    }
  };

  return (
    <div className="app-container">
      {renderContent()}
    </div>
  );
};

export default TreasureHuntApp;