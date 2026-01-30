const { Pool } = require('pg');

let pool;

const connectDatabase = async () => {
  try {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'swiftride',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    // Create tables if they don't exist
    await createTables();
    
    return pool;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) CHECK (role IN ('rider', 'driver')) NOT NULL,
        avatar_url VARCHAR(500),
        rating DECIMAL(3,2) DEFAULT 0.00,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Drivers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        vehicle_type VARCHAR(20) CHECK (vehicle_type IN ('bike', 'auto', 'sedan', 'suv', 'premium')) NOT NULL,
        vehicle_number VARCHAR(20) UNIQUE NOT NULL,
        license_number VARCHAR(50) UNIQUE NOT NULL,
        is_online BOOLEAN DEFAULT false,
        current_latitude DECIMAL(10,8),
        current_longitude DECIMAL(11,8),
        last_location_update TIMESTAMP,
        earnings DECIMAL(10,2) DEFAULT 0.00,
        total_rides INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Rides table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rides (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rider_id UUID REFERENCES users(id) ON DELETE CASCADE,
        driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
        pickup_latitude DECIMAL(10,8) NOT NULL,
        pickup_longitude DECIMAL(11,8) NOT NULL,
        pickup_address TEXT,
        dropoff_latitude DECIMAL(10,8) NOT NULL,
        dropoff_longitude DECIMAL(11,8) NOT NULL,
        dropoff_address TEXT,
        vehicle_type VARCHAR(20) CHECK (vehicle_type IN ('bike', 'auto', 'sedan', 'suv', 'premium')) NOT NULL,
        status VARCHAR(20) CHECK (status IN ('requested', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled')) DEFAULT 'requested',
        fare DECIMAL(8,2) NOT NULL,
        distance DECIMAL(8,2) NOT NULL,
        duration INTEGER NOT NULL,
        estimated_time INTEGER NOT NULL,
        driver_eta INTEGER,
        payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'wallet', 'upi')) DEFAULT 'cash',
        payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
        pickup_time TIMESTAMP,
        dropoff_time TIMESTAMP,
        completed_at TIMESTAMP,
        cancellation_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Payments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
        amount DECIMAL(8,2) NOT NULL,
        method VARCHAR(20) CHECK (method IN ('cash', 'card', 'wallet', 'upi')) NOT NULL,
        status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
        transaction_id VARCHAR(100),
        gateway_response JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Reviews table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
        comment TEXT,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(ride_id, user_id)
      )
    `);

    // Location tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS location_tracking (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        latitude DECIMAL(10,8) NOT NULL,
        longitude DECIMAL(11,8) NOT NULL,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Indexes for better performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_rides_rider_id ON rides(rider_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides(driver_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_drivers_is_online ON drivers(is_online)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_location_tracking_ride_id ON location_tracking(ride_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_location_tracking_user_id ON location_tracking(user_id)');

    await client.query('COMMIT');
    console.log('✅ Database tables created/verified successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return pool;
};

const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await getPool().query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error', { text, error });
    throw error;
  }
};

module.exports = {
  connectDatabase,
  getPool,
  query,
};