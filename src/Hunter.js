import React, { useState, useEffect } from 'react';
import { Compass, Map, HeartPulse } from 'lucide-react';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const generateRandomPoint = (centerLat, centerLng, radiusInMeters) => {
  const radiusInDegrees = radiusInMeters / 111300;
  const randomAngle = Math.random() * 2 * Math.PI;
  const randomRadius = Math.sqrt(Math.random()) * radiusInDegrees;
  
  return {
    lat: centerLat + randomRadius * Math.cos(randomAngle),
    lng: centerLng + randomRadius * Math.sin(randomAngle)
  };
};

// کامپوننت نقشه فانتزی
const FantasyMap = ({ distance, maxDistance = 20 }) => {
  const progress = 1 - Math.min(distance, maxDistance) / maxDistance;
  
  return (
    <div className="relative w-full h-64 bg-amber-50 rounded-lg overflow-hidden border-4 border-amber-800">
      {/* پس‌زمینه نقشه فانتزی */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" className="text-amber-700">
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      {/* دایره‌های نشان‌دهنده فاصله */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-40 h-40 rounded-full border-2 border-amber-600 animate-pulse" />
        <div className="absolute w-32 h-32 rounded-full border-2 border-amber-700 animate-pulse" />
      </div>
      
      {/* قطب‌نما */}
      <div className="absolute top-4 right-4 animate-spin-slow">
        <Compass className="w-8 h-8 text-amber-800" />
      </div>
      
      {/* نشانگر گرما */}
      <div className="absolute bottom-4 left-4 right-4 h-2 bg-amber-200 rounded-full">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500 transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
};

// کامپوننت تور راهنما
const TutorialOverlay = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const steps = [
    {
      title: "به ماجراجویی خوش آمدید!",
      description: "در این بازی شما باید گنج پنهان شده در نزدیکی خود را پیدا کنید.",
      icon: Map
    },
    {
      title: "نقشه گنج",
      description: "از نقشه جادویی برای پیدا کردن گنج استفاده کنید. هر چه رنگ گرم‌تر باشد، به گنج نزدیک‌تر هستید!",
      icon: Compass
    },
    {
      title: "شروع ماجراجویی",
      description: "به اطراف حرکت کنید و گنج را پیدا کنید. موفق باشید!",
      icon: HeartPulse
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="text-xl font-bold mb-4 flex items-center gap-2">
          {React.createElement(steps[step - 1].icon, { className: "w-6 h-6" })}
          {steps[step - 1].title}
        </div>
        <p className="mb-6 text-gray-600">{steps[step - 1].description}</p>
        <div className="flex justify-between">
          <button
            className={`px-4 py-2 rounded ${
              step === 1 ? 'bg-gray-200' : 'bg-amber-100 hover:bg-amber-200'
            }`}
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
          >
            قبلی
          </button>
          {step < totalSteps ? (
            <button
              className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => setStep(step + 1)}
            >
              بعدی
            </button>
          ) : (
            <button
              className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-600 text-white"
              onClick={onClose}
            >
              شروع بازی
            </button>
          )}
        </div>
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i + 1 === step ? 'bg-amber-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const TreasureHuntGame = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [treasureLocation, setTreasureLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [found, setFound] = useState(false);
  const [error, setError] = useState(null);
  const [showTutorial, setShowTutorial] = useState(true);

  useEffect(() => {
    if (!gameStarted) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newUserLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(newUserLocation);

        if (!treasureLocation) {
          const newTreasure = generateRandomPoint(
            newUserLocation.lat,
            newUserLocation.lng,
            20
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
          }
        }
      },
      (error) => {
        setError('خطا در دسترسی به موقعیت مکانی: ' + error.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [gameStarted, treasureLocation]);

  const startGame = () => {
    setGameStarted(true);
    setFound(false);
    setTreasureLocation(null);
  };

  const resetGame = () => {
    setGameStarted(false);
    setFound(false);
    setTreasureLocation(null);
    setDistance(null);
    setShowTutorial(true);
  };

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">خطا! </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <>
      {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}

      <div className="max-w-md mx-auto bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-center text-amber-800 mb-6">
            ماجراجویی گنج پنهان
          </h1>
          
          <div className="space-y-6">
            {!gameStarted ? (
              <button
                onClick={startGame}
                className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                شروع ماجراجویی
              </button>
            ) : found ? (
              <div className="text-center space-y-6">
                <div className="text-yellow-500 text-8xl mb-4">🏆</div>
                <div className="bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-300 rounded-lg p-4">
                  <h2 className="text-xl font-bold text-amber-800 mb-2">تبریک!</h2>
                  <p className="text-lg text-amber-700">
                    شما گنج افسانه‌ای را پیدا کردید!
                  </p>
                </div>
                <button
                  onClick={resetGame}
                  className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  ماجراجویی جدید
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <FantasyMap distance={distance || 20} />
                
                <div className="text-lg font-semibold text-amber-800 text-center">
                  <span className="inline-flex items-center gap-2">
                    <Compass className="w-6 h-6" />
                    فاصله تا گنج:{' '}
                    {distance ? `${Math.round(distance)} متر` : 'در حال محاسبه...'}
                  </span>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-center text-blue-800">
                    به اطراف حرکت کنید تا گنج را پیدا کنید!
                    <br />
                    هر چه نشانگر قرمزتر باشد، به گنج نزدیک‌تر هستید.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TreasureHuntGame;