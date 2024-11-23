import { supabase } from './supabaseClient';

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
export const saveScore = async (username, score) => {
  try {
    // Use upsert operation with username as the unique key
    const { data, error } = await supabase
      .from('users')
      .upsert(
        { 
          username, 
          score,
          updated_at: new Date().toISOString() // Add timestamp for tracking
        },
        {
          onConflict: 'username', // Specify the unique constraint
          returning: 'minimal' // Reduce data transfer
        }
      );

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Error saving score:', err.message);
    // Return null instead of throwing to prevent app crashes
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

    return data?.score || 0; // Return 0 instead of null for new users
  } catch (err) {
    console.error('Error fetching user score:', err.message);
    return 0; // Return 0 instead of throwing
  }
};