import { supabase } from './supabaseClient';
import crypto from 'crypto';

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
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
  
  export const generateRandomPoint = (centerLat, centerLng, radiusInMeters) => {
    const radiusInDegrees = radiusInMeters / 111300;
    const randomAngle = Math.random() * 2 * Math.PI;
    const randomRadius = Math.sqrt(Math.random()) * radiusInDegrees;
    
    return {
      lat: centerLat + randomRadius * Math.cos(randomAngle),
      lng: centerLng + randomRadius * Math.sin(randomAngle)
    };
  };

//database
// Function to validate Telegram WebApp data
const validateTelegramWebAppData = (initData) => {
  try {
    // Get the hash and remove it from the data
    const searchParams = new URLSearchParams(initData);
    const hash = searchParams.get('hash');
    searchParams.delete('hash');
    
    // Sort the params alphabetically
    const params = Array.from(searchParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    // Create a secret key from your bot token
    const secret = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.TELEGRAM_BOT_TOKEN)
      .digest();
    
    // Calculate the hash
    const calculatedHash = crypto
      .createHmac('sha256', secret)
      .update(params)
      .digest('hex');
    
    return calculatedHash === hash;
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
};

export const saveScore = async (username, score, initData) => {
  try {
    // First, validate that this is a legitimate Telegram WebApp request
    if (!initData || !validateTelegramWebAppData(initData)) {
      throw new Error('Invalid or missing Telegram WebApp data');
    }

    // Parse the initData to get the Telegram user info
    const parsedData = Object.fromEntries(new URLSearchParams(initData));
    const user = JSON.parse(parsedData.user);

    // Verify that the username matches the Telegram user
    if (user.username !== username) {
      throw new Error('Username mismatch');
    }

    // If validation passes, proceed with the upsert
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          username,
          score,
          telegram_user_id: user.id, // Store Telegram user ID for extra verification
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'username',
          returning: 'minimal'
        }
      );

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Error saving score:', err.message);
    return null;
  }
};

export const fetchScore = async (username) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('score')
      .eq('username', username)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return data?.score || 0;
  } catch (err) {
    console.error('Error fetching user score:', err.message);
    return 0;
  }
};