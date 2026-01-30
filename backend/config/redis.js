const redis = require('redis');

let client;

const connectRedis = async () => {
  try {
    client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('Redis Client Connected');
    });

    await client.connect();
    return client;
  } catch (error) {
    console.error('Redis connection error:', error);
    throw error;
  }
};

const getClient = () => {
  if (!client) {
    throw new Error('Redis not connected. Call connectRedis() first.');
  }
  return client;
};

// Cache utilities
const set = async (key, value, expiry = 3600) => {
  try {
    await getClient().setEx(key, expiry, JSON.stringify(value));
  } catch (error) {
    console.error('Redis set error:', error);
  }
};

const get = async (key) => {
  try {
    const value = await getClient().get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
};

const del = async (key) => {
  try {
    await getClient().del(key);
  } catch (error) {
    console.error('Redis delete error:', error);
  }
};

const exists = async (key) => {
  try {
    return await getClient().exists(key);
  } catch (error) {
    console.error('Redis exists error:', error);
    return false;
  }
};

// Session management
const setSession = async (sessionId, userId, expiry = 86400) => {
  const key = `session:${sessionId}`;
  await set(key, { userId, createdAt: new Date().toISOString() }, expiry);
};

const getSession = async (sessionId) => {
  const key = `session:${sessionId}`;
  return await get(key);
};

const deleteSession = async (sessionId) => {
  const key = `session:${sessionId}`;
  await del(key);
};

// Real-time location tracking
const updateDriverLocation = async (driverId, location) => {
  const key = `driver:${driverId}:location`;
  await set(key, location, 60); // Cache for 1 minute
};

const getDriverLocation = async (driverId) => {
  const key = `driver:${driverId}:location`;
  return await get(key);
};

// Nearby drivers
const findNearbyDrivers = async (latitude, longitude, radius = 5000) => {
  try {
    // Get all online drivers from Redis (using geo commands in production)
    // For now, we'll use a simple approach
    const key = 'online_drivers';
    const drivers = await get(key) || [];
    
    // Calculate distance (simplified - use proper geospatial queries in production)
    return drivers.filter(driver => {
      const distance = calculateDistance(
        latitude, longitude,
        driver.latitude, driver.longitude
      );
      return distance <= radius;
    });
  } catch (error) {
    console.error('Error finding nearby drivers:', error);
    return [];
  }
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000; // Distance in meters
};

module.exports = {
  connectRedis,
  getClient,
  set,
  get,
  del,
  exists,
  setSession,
  getSession,
  deleteSession,
  updateDriverLocation,
  getDriverLocation,
  findNearbyDrivers,
  calculateDistance,
};