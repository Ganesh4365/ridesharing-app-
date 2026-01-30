const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 7005;

// Enable CORS for all origins
app.use(cors({
  origin: ['http://localhost:7000', 'http://127.0.0.1:7000', 'http://192.168.1.4:7000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SwiftRide Backend is Running!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('Login request:', req.body);
  const { email, password } = req.body;
  
  // Mock authentication
  if (email && password) {
    const isRider = email.includes('rider');
    const user = {
      id: isRider ? 'user1' : 'driver1',
      name: isRider ? 'Test Rider' : 'Test Driver',
      email: email,
      role: isRider ? 'rider' : 'driver',
      rating: 4.8,
      ...(isRider ? {} : {
        vehicleType: 'sedan',
        vehicleNumber: 'KA01AB1234',
        earnings: 2850,
        totalRides: 42,
      })
    };
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        accessToken: 'token_' + user.id,
        refreshToken: 'refresh_token_' + user.id
      }
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Email and password required'
    });
  }
});

// Ride estimate
app.post('/api/rides/estimate', (req, res) => {
  const { pickup, dropoff, vehicleType } = req.body;
  console.log('Estimate request:', req.body);
  
  const fares = { bike: 15, auto: 25, sedan: 40, suv: 60, premium: 80 };
  const baseFare = fares[vehicleType] || 40;
  const distance = Math.random() * 8 + 2; // 2-10 km
  const fare = Math.round(baseFare + (15 * distance));
  
  res.json({
    success: true,
    data: {
      distance: Math.round(distance * 1000),
      fare,
      estimatedTime: Math.round(distance * 2), // minutes
      vehicleType
    }
  });
});

// Ride history
app.get('/api/rides/history', (req, res) => {
  res.json({
    success: true,
    data: {
      rides: [
        {
          id: 'ride1',
          pickup_latitude: 12.9716,
          pickup_longitude: 77.5946,
          dropoff_latitude: 12.9352,
          dropoff_longitude: 77.6245,
          vehicle_type: 'sedan',
          status: 'completed',
          fare: 150,
          distance: 8500,
          duration: 15,
          payment_method: 'card',
          payment_status: 'paid',
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ],
      page: 1,
      limit: 10
    }
  });
});

// Test accounts
app.get('/api/test-accounts', (req, res) => {
  res.json({
    success: true,
    message: 'Test accounts for SwiftRide',
    data: {
      rider: {
        email: 'rider@swiftride.com',
        password: 'password123',
        description: 'Use this for testing rider features'
      },
      driver: {
        email: 'driver@swiftride.com',
        password: 'password123',
        description: 'Use this for testing driver features'
      }
    }
  });
});

// Static files
app.use(express.static(path.join(__dirname, '../dist')));

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🚀 SWIFTRIDE BACKEND SERVER');
  console.log('========================');
  console.log('✅ Server is RUNNING on port ' + PORT);
  console.log('✅ Health Check: http://localhost:' + PORT + '/health');
  console.log('✅ API Base URL: http://localhost:' + PORT + '/api');
  console.log('✅ Test Accounts: http://localhost:' + PORT + '/api/test-accounts');
  console.log('');
  console.log('🎯 FRONTEND URL: http://localhost:7000');
  console.log('');
  console.log('👥 TEST CREDENTIALS:');
  console.log('   📱 Rider: rider@swiftride.com / password123');
  console.log('   🚗 Driver: driver@swiftride.com / password123');
  console.log('');
  console.log('🔍 READY FOR TESTING!');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
