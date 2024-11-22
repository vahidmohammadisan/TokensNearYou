import React, { useState, useEffect } from 'react';
import { Compass, Map, HeartPulse } from 'lucide-react';

const TreasureHuntGame = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [treasureLocation, setTreasureLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [found, setFound] = useState(false);
  const [error, setError] = useState(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [userData, setUserData] = useState(null);
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
        
        // راه‌اندازی و گرفتن اطلاعات کاربر
        tgApp.ready();
        tgApp.expand();
        
        // دریافت اطلاعات کاربر
        const user = tgApp.initDataUnsafe?.user;
        if (user) {
          setUserData({
            firstName: user.first_name,
            lastName: user.last_name,
            username: user.username,
            id: user.id,
          });
        }
      }
    };
    document.body.appendChild(script);

    // پاک کردن اسکریپت در cleanup
    return () => {
      document.body.removeChild(script);
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
      // استفاده از Geolocation API به جای API تلگرام
      if (navigator.geolocation) {
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
          }
        );
      } else {
        setError('مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند');
      }
    } catch (err) {
      setError('خطا در دریافت موقعیت مکانی');
    }
  };

  const handleNewLocation = (newUserLocation) => {
    setUserLocation(newUserLocation);

    if (!treasureLocation && !found) {
      const newTreasure = generateRandomPoint(
        newUserLocation.lat,
        newUserLocation.lng,
        100
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
    if (tg) {
      tg.MainButton.show();
    }
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
    <>
      {showTutorial && (
        <TutorialOverlay 
          onClose={() => {
            setShowTutorial(false);
            if (tg) tg.MainButton.show();
          }} 
        />
      )}

      <div className="max-w-md mx-auto bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg shadow-lg overflow-hidden p-4">
        <div className="p-6">
          {/* نمایش اطلاعات کاربر */}
          {userData && (
            <div className="text-center mb-4">
              <p className="text-lg text-amber-800">
                خوش آمدید{' '}
                <span className="font-bold">
                  {userData.firstName} {userData.lastName}
                </span>
              </p>
              {userData.username && (
                <p className="text-sm text-amber-600">@{userData.username}</p>
              )}
            </div>
          )}

          <h1 className="text-2xl font-bold text-center text-amber-800 mb-6">
            ماجراجویی گنج پنهان
          </h1>
          
          {/* بقیه کد UI مثل قبل ... */}
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
    </>
  );
};

// توابع کمکی باقی می‌مانند...
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // ... کد قبلی
};

const generateRandomPoint = (centerLat, centerLng, radiusInMeters) => {
  // ... کد قبلی
};

const FantasyMap = ({ distance, maxDistance = 100 }) => {
  // ... کد قبلی
};

const TutorialOverlay = ({ onClose }) => {
  // ... کد قبلی
};

export default TreasureHuntGame;