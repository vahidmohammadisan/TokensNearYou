import React, { useState, useEffect } from 'react';
import { Compass, Map, HeartPulse } from 'lucide-react';

// کامپوننت نقشه فانتزی
const FantasyMap = ({ distance, maxDistance = 100 }) => {
  const distancePercentage = Math.min((distance / maxDistance) * 100, 100);
  const heatColor = `hsl(${Math.max(0, 120 - distancePercentage * 1.2)}, 100%, 50%)`;

  return (
    <div className="bg-white rounded-lg p-4 shadow-inner">
      <div className="relative">
        <div className="w-full h-48 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg overflow-hidden">
          {/* نقشه پس‌زمینه */}
          <div className="absolute inset-0 bg-opacity-20 bg-yellow-100">
            <div className="grid grid-cols-8 grid-rows-6 h-full">
              {[...Array(48)].map((_, i) => (
                <div
                  key={i}
                  className="border border-amber-200 border-opacity-20"
                />
              ))}
            </div>
          </div>
          
          {/* نشانگر گنج */}
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            style={{
              width: '100px',
              height: '100px',
              background: `radial-gradient(circle, ${heatColor} 0%, transparent 70%)`,
              opacity: 0.6,
            }}
          />
          
          {/* نشانگر کاربر */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse">
              <div className="absolute w-8 h-8 bg-blue-500 rounded-full -inset-2 animate-ping opacity-20" />
            </div>
          </div>
        </div>
        
        {/* راهنمای جهت */}
        <div className="absolute top-4 right-4 w-8 h-8">
          <Compass className="w-full h-full text-amber-800" />
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
  const [tg, setTg] = useState(null);

  useEffect(() => {
    // اضافه کردن اسکریپت تلگرام به صفحه
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-web-app.js';
    script.async = true;
    script.onload = () => {
      if (window.Telegram?.WebApp) {
        const tgApp = window.Telegram.WebApp;
        setTg(tgApp);
        
        // راه‌اندازی
        tgApp.ready();
        tgApp.expand();
      }
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // نمایش دکمه اصلی بعد از لود شدن تلگرام
  useEffect(() => {
    if (tg && gameStarted) {
      tg.MainButton.setText('بروزرسانی موقعیت');
      tg.MainButton.show();
      tg.MainButton.onClick(requestLocation);
    }
  }, [tg, gameStarted]);

  const requestLocation = async () => {
    try {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newUserLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            handleNewLocation(newUserLocation);
          },
          (error) => {
            setError('خطا در دریافت موقعیت مکانی: ' + error.message);
            console.error('Geolocation error:', error);
          },
          { 
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      } else {
        setError('مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند');
      }
    } catch (err) {
      setError('خطا در دریافت موقعیت مکانی');
      console.error('Location request error:', err);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // شعاع زمین به متر
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
    const radiusInDegrees = radiusInMeters / 111320;

    const u = Math.random();
    const v = Math.random();

    const w = radiusInDegrees * Math.sqrt(u);
    const t = 2 * Math.PI * v;
    const x = w * Math.cos(t);
    const y = w * Math.sin(t);

    const newLng = x / Math.cos((Math.PI * centerLat) / 180) + centerLng;
    const newLat = y + centerLat;

    return { lat: newLat, lng: newLng };
  };

  const handleNewLocation = (newUserLocation) => {
    setUserLocation(newUserLocation);
    console.log('New user location:', newUserLocation);

    if (!treasureLocation && !found) {
      const newTreasure = generateRandomPoint(
        newUserLocation.lat,
        newUserLocation.lng,
        100
      );
      setTreasureLocation(newTreasure);
      console.log('Generated treasure location:', newTreasure);
    }

    if (treasureLocation) {
      const dist = calculateDistance(
        newUserLocation.lat,
        newUserLocation.lng,
        treasureLocation.lat,
        treasureLocation.lng
      );
      setDistance(dist);
      console.log('Distance to treasure:', dist);

      if (dist < 5) {
        setFound(true);
        if (tg) {
          tg.MainButton.setText('بازی جدید');
          tg.HapticFeedback.notificationOccurred('success');
        }
      }
    }
  };

  const startGame = () => {
    setGameStarted(true);
    setFound(false);
    setTreasureLocation(null);
    requestLocation();
  };

  const resetGame = () => {
    setGameStarted(false);
    setFound(false);
    setTreasureLocation(null);
    setDistance(null);
    setShowTutorial(true);
    if (tg) {
      tg.MainButton.hide();
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg shadow-lg overflow-hidden p-4">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-center text-amber-800 mb-6">
          ماجراجویی گنج پنهان
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
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
              <FantasyMap distance={distance || 100} />
              
              {distance && (
                <div className="text-lg font-semibold text-amber-800 text-center">
                  <span className="inline-flex items-center gap-2">
                    <Compass className="w-6 h-6" />
                    فاصله تا گنج: {Math.round(distance)} متر
                  </span>
                </div>
              )}

              {!tg && (
                <button
                  onClick={requestLocation}
                  className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  به‌روزرسانی موقعیت
                </button>
              )}

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <p className="text-center text-blue-800">
                  برای به‌روزرسانی موقعیت خود، دکمه پایین صفحه را لمس کنید
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TreasureHuntGame;