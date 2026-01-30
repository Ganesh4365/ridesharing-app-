const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { exec } = require('child_process');
require('dotenv').config();

// Allow connections from localhost:7000 (frontend port)
const corsOptions = {
  origin: [
    'http://localhost:7000',
    'http://127.0.0.1:7000',
    'http://0.0.0.0:7000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
};

const app = express();
const server = http.createServer(app);

// Security middleware
app.use(cors(corsOptions));

// Mock user database
const mockUsers = [
  {
    id: 'user1',
    name: 'Test Rider',
    email: 'rider@swiftride.com',
    phone: '9876543210',
    password: 'password123', // In production, this would be hashed
    role: 'rider',
    rating: 4.8,
  },
  {
    id: 'driver1',
    name: 'Test Driver',
    email: 'driver@swiftride.com',
    phone: '9876543211',
    password: 'password123', // In production, this would be hashed
    role: 'driver',
    rating: 4.9,
    vehicleType: 'sedan',
    vehicleNumber: 'KA01AB1234',
    isOnline: false,
    currentLocation: { latitude: 12.9716, longitude: 77.5946 },
    earnings: 2850,
    totalRides: 42,
  }
];

// Authentication routes
app.post('/api/auth/login', (req, res) => {
  console.log('Login request received:', req.body);
  const { email, password } = req.body;
  
  const user = mockUsers.find(u => u.email === email && u.password === password);
  
  if (user) {
    // Mock JWT token (use real JWT in production)
    const token = 'mock_token_' + user.id;
    
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      rating: user.rating,
      ...(user.role === 'driver' && {
        driverInfo: {
          vehicleType: user.vehicleType,
          vehicleNumber: user.vehicleNumber,
          isOnline: user.isOnline,
          earnings: user.earnings,
          totalRides: user.totalRides,
          rating: user.rating,
        }
      })
    };
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        accessToken: token,
        refreshToken: 'refresh_' + token,
      },
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, password, role } = req.body;
  
  // Check if user already exists
  if (mockUsers.find(u => u.email === email)) {
    return res.status(409).json({
      success: false,
      message: 'User with this email already exists',
    });
  }
  
  // Create new user
  const newUser = {
    id: 'user' + Date.now(),
    name,
    email,
    phone,
    password, // Hash in production
    role,
    rating: 5.0,
    ...(role === 'driver' && {
      vehicleType: 'sedan',
      vehicleNumber: 'TEMP' + Date.now(),
      isOnline: false,
      earnings: 0,
      totalRides: 0,
    })
  };
  
  mockUsers.push(newUser);
  
  const token = 'mock_token_' + newUser.id;
  
  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: newUser,
      accessToken: token,
      refreshToken: 'refresh_' + token,
    },
  });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
    });
  }
  
  const token = authHeader.substring(7);
  const userId = token.replace('mock_token_', '');
  
  const user = mockUsers.find(u => u.id === userId);
  
  if (user) {
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      rating: user.rating,
      ...(user.role === 'driver' && {
        driverInfo: {
          vehicleType: user.vehicleType,
          vehicleNumber: user.vehicleNumber,
          isOnline: user.isOnline,
          earnings: user.earnings,
          totalRides: user.totalRides,
          rating: user.rating,
        }
      })
    };
    
    res.json({
      success: true,
      data: { user: userData },
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }
});

// Ride routes
app.post('/api/rides/estimate', (req, res) => {
  const { pickup, dropoff, vehicleType } = req.body;
  
  if (!pickup || !dropoff || !vehicleType) {
    return res.status(400).json({
      success: false,
      message: 'Pickup, dropoff, and vehicle type are required',
    });
  }
  
  // Mock distance calculation (use real maps API in production)
  const distance = Math.random() * 10 + 2; // 2-12 km
  
  // Calculate fare based on vehicle type
  const baseFares = {
    bike: 15,
    auto: 25,
    sedan: 40,
    suv: 60,
    premium: 80,
  };
  
  const perKmRates = {
    bike: 8,
    auto: 12,
    sedan: 15,
    suv: 20,
    premium: 25,
  };
  
  const baseFare = baseFares[vehicleType] || 40;
  const perKmRate = perKmRates[vehicleType] || 15;
  const fare = Math.round(baseFare + (perKmRate * distance));
  const estimatedTime = Math.round(distance / 0.4); // Assuming 40 km/h average
  
  res.json({
    success: true,
    data: {
      distance: Math.round(distance * 1000), // Convert to meters
      fare,
      estimatedTime,
      vehicleType,
    },
  });
});

app.get('/api/rides/history', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
    });
  }
  
  const token = authHeader.substring(7);
  const userId = token.replace('mock_token_', '');
  
  // Mock ride history
  const mockRides = [
    {
      id: 'ride1',
      pickup_latitude: 12.9716,
      pickup_longitude: 77.5946,
      dropoff_latitude: 12.9352,
      dropoff_longitude: 77.6245,
      vehicle_type: 'sedan',
      status: 'completed',
      fare: 150.00,
      distance: 8500,
      duration: 15,
      payment_method: 'card',
      payment_status: 'paid',
      created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
    {
      id: 'ride2',
      pickup_latitude: 12.9768,
      pickup_longitude: 77.5713,
      dropoff_latitude: 12.9942,
      dropoff_longitude: 77.6172,
      vehicle_type: 'auto',
      status: 'completed',
      fare: 85.00,
      distance: 5200,
      duration: 12,
      payment_method: 'cash',
      payment_status: 'paid',
      created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    }
  ];
  
  res.json({
    success: true,
    data: {
      rides: mockRides,
      page: 1,
      limit: 10,
    },
  });
});

// Driver routes
app.put('/api/drivers/status', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
    });
  }
  
  const token = authHeader.substring(7);
  const userId = token.replace('mock_token_', '');
  
  const driver = mockUsers.find(u => u.id === userId && u.role === 'driver');
  
  if (driver) {
    const { isOnline, vehicleType, vehicleNumber } = req.body;
    
    if (isOnline !== undefined) driver.isOnline = isOnline;
    if (vehicleType) driver.vehicleType = vehicleType;
    if (vehicleNumber) driver.vehicleNumber = vehicleNumber;
    
    res.json({
      success: true,
      message: 'Driver status updated successfully',
      data: { driver },
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Driver not found',
    });
  }
});

app.get('/api/drivers/earnings', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
    });
  }
  
  const token = authHeader.substring(7);
  const userId = token.replace('mock_token_', '');
  
  const driver = mockUsers.find(u => u.id === userId && u.role === 'driver');
  
  if (driver) {
    // Mock earnings data
    const earningsData = {
      total_rides: driver.totalRides || 0,
      total_earnings: driver.earnings || 0,
      average_fare: (driver.earnings || 0) / Math.max(driver.totalRides || 1, 1),
      total_distance: 357.5,
      average_rating: driver.rating || 5.0,
    };
    
    const detailedRides = [
      {
        id: 'driver_ride1',
        amount: 450,
        distance: 8.5,
        duration: 15,
        created_at: new Date().toISOString(),
        status: 'completed',
      },
      {
        id: 'driver_ride2',
        amount: 380,
        distance: 7.2,
        duration: 12,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        status: 'completed',
      }
    ];
    
    res.json({
      success: true,
      data: {
        summary: earningsData,
        rides: detailedRides,
      },
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Driver not found',
    });
  }
});

// Payment routes
app.post('/api/payments/process', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
    });
  }
  
  const { rideId, amount, method } = req.body;
  
  if (!rideId || !amount || !method) {
    return res.status(400).json({
      success: false,
      message: 'Ride ID, amount, and payment method are required',
    });
  }
  
  // Mock payment processing
  setTimeout(() => {
    const payment = {
      id: 'payment_' + Date.now(),
      rideId,
      amount,
      method,
      status: 'completed',
      transactionId: 'txn_' + Date.now(),
      created_at: new Date().toISOString(),
    };
    
    payments.push(payment);
  }, 1000);
  
  res.json({
    success: true,
    message: 'Payment processing started',
    data: {
      status: 'processing',
      message: 'Your payment is being processed...',
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Socket.IO setup
const io = socketIo(server, {
  cors: corsOptions,
});

// Store connected users
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Simple auth (use proper JWT in production)
  socket.on('authenticate', (data) => {
    const { userId, role } = data;
    const user = mockUsers.find(u => u.id === userId && u.role === role);
    
    if (user) {
      socket.userId = userId;
      socket.role = role;
      connectedUsers.set(userId, socket);
      
      console.log(`${role} authenticated:`, user.name);
      socket.emit('authenticated', { success: true, user });
    } else {
      socket.emit('authenticated', { success: false, message: 'Invalid credentials' });
    }
  });
  
  // Handle ride requests
  socket.on('request_ride', (data) => {
    const { pickup, dropoff, vehicleType, fare } = data;
    
    console.log('Ride request received:', data);
    
    // Create ride
    const ride = {
      id: 'ride_' + Date.now(),
      riderId: socket.userId,
      pickup,
      dropoff,
      vehicleType,
      fare,
      status: 'requested',
      createdAt: new Date().toISOString(),
    };
    
    rides.push(ride);
    
    // Find available drivers
    const availableDrivers = mockUsers.filter(u => u.role === 'driver' && u.isOnline);
    
    // Send ride requests to available drivers
    availableDrivers.forEach(driver => {
      const driverSocket = connectedUsers.get(driver.id);
      if (driverSocket) {
        driverSocket.emit('new_ride_request', {
          rideId: ride.id,
          pickup,
          dropoff,
          vehicleType,
          fare,
          riderId: socket.userId,
        });
      }
    });
    
    // Notify rider
    socket.emit('ride_requested', { rideId: ride.id });
  });
  
  // Handle ride acceptance
  socket.on('accept_ride', (data) => {
    const { rideId } = data;
    
    console.log('Ride accepted:', { rideId, driverId: socket.userId });
    
    // Update ride status
    const ride = rides.find(r => r.id === rideId);
    if (ride) {
      ride.status = 'accepted';
      ride.driverId = socket.userId;
      ride.acceptedAt = new Date().toISOString();
    }
    
    // Notify rider
    const riderSocket = connectedUsers.get(ride.riderId);
    if (riderSocket) {
      riderSocket.emit('driver_assigned', {
        driverId: socket.userId,
        rideId,
        status: 'accepted',
        driver: mockUsers.find(u => u.id === socket.userId),
      });
    }
    
    // Notify other drivers that ride is taken
    const otherDrivers = mockUsers.filter(u => u.role === 'driver' && u.id !== socket.userId);
    otherDrivers.forEach(driver => {
      const driverSocket = connectedUsers.get(driver.id);
      if (driverSocket) {
        driverSocket.emit('ride_taken', { rideId });
      }
    });
  });
  
  // Handle location updates
  socket.on('update_location', (data) => {
    const { location } = data;
    
    // Update driver location
    const driver = mockUsers.find(u => u.id === socket.userId && u.role === 'driver');
    if (driver) {
      driver.currentLocation = location;
      driver.lastLocationUpdate = new Date().toISOString();
    }
    
    // Broadcast to relevant users
    const activeRides = rides.filter(r => 
      (r.riderId === socket.userId || r.driverId === socket.userId) &&
      ['accepted', 'arrived', 'in_progress'].includes(r.status)
    );
    
    activeRides.forEach(ride => {
      const participantId = ride.riderId === socket.userId ? ride.driverId : ride.riderId;
      const participantSocket = connectedUsers.get(participantId);
      
      if (participantSocket) {
        participantSocket.emit('location_update', {
          userId: socket.userId,
          location,
          timestamp: new Date().toISOString(),
        });
      }
    });
  });
  
  // Handle ride status updates
  socket.on('update_ride_status', (data) => {
    const { rideId, status } = data;
    
    // Update ride status
    const ride = rides.find(r => r.id === rideId);
    if (ride) {
      ride.status = status;
      ride.updatedAt = new Date().toISOString();
      
      if (status === 'completed') {
        ride.completedAt = new Date().toISOString();
      }
    }
    
    // Notify all participants
    const participants = [ride.riderId, ride.driverId].filter(id => id && id !== socket.userId);
    participants.forEach(participantId => {
      const participantSocket = connectedUsers.get(participantId);
      if (participantSocket) {
        participantSocket.emit('ride_status_change', {
          rideId,
          status,
          timestamp: ride.updatedAt,
        });
      }
    });
  });
  
  // Handle chat messages
  socket.on('send_message', (data) => {
    const { rideId, message } = data;
    
    // Find ride and notify other participant
    const ride = rides.find(r => r.id === rideId);
    if (ride) {
      const recipientId = ride.riderId === socket.userId ? ride.driverId : ride.riderId;
      const recipientSocket = connectedUsers.get(recipientId);
      
      if (recipientSocket) {
        recipientSocket.emit('message_received', {
          rideId,
          message,
          senderId: socket.userId,
          timestamp: new Date().toISOString(),
        });
      }
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove from connected users
    connectedUsers.forEach((userSocket, userId) => {
      if (userSocket.id === socket.id) {
        connectedUsers.delete(userId);
      }
    });
    
    // Mark driver as offline
    const driver = mockUsers.find(u => u.id === socket.userId && u.role === 'driver');
    if (driver) {
      driver.isOnline = false;
    }
  });
});

// Firewall and Proxy Configuration
const configureFirewall = () => {
  try {
    // Log firewall status (Linux systems)
    const { exec } = require('child_process');
    
    console.log('🔥 Checking firewall configuration...');
    
    // Check if ufw is available
    exec('which ufw', (error, stdout, stderr) => {
      if (!error) {
        console.log('📋 UFW firewall detected');
        exec('ufw status', (error, stdout, stderr) => {
          console.log('🛡️ Firewall Status:', stdout);
          
          // Allow our ports
          exec('sudo ufw allow 7000/tcp && sudo ufw allow 7005/tcp && sudo ufw reload', (error, stdout, stderr) => {
            if (!error) {
              console.log('✅ Firewall rules updated for ports 7000, 7005');
            } else {
              console.log('⚠️ Need to manually allow ports: sudo ufw allow 7000/tcp && sudo ufw allow 7005/tcp');
            }
          });
        });
      }
    });
    
    // Check network interfaces
    exec('ip addr show', (error, stdout, stderr) => {
      if (!error) {
        console.log('🌐 Network Interfaces:');
        const interfaces = stdout.match(/^[0-9]+:\s+.*$/gm);
        interfaces?.forEach(iface => console.log('   ', iface.trim()));
      }
    });
    
  } catch (err) {
    console.log('⚠️ Firewall configuration check failed:', err.message);
  }
};

// Start server
const PORT = process.env.PORT || 7005;

server.listen(PORT, () => {
  console.log(`🚀 SwiftRide Backend Server Running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
  console.log(`🔌 Health Check: http://localhost:${PORT}/health`);
  console.log(`📱 WebSocket: ws://localhost:${PORT}`);
  console.log(`🔗 Frontend URL: http://localhost:7000`);
  
  // Configure firewall and show status
  configureFirewall();
  
  // Add some test users
  console.log('');
  console.log('👥 Test Users Created:');
  console.log('📱 Rider: rider@swiftride.com / password123');
  console.log('🚗 Driver: driver@swiftride.com / password123');
  console.log('');
  
  // Startup health checks
  setTimeout(() => {
    console.log('🔍 RUNNING HEALTH CHECKS...');
    
    // Test API endpoints
    const http = require('http');
    
    const testHealth = () => {
      const options = {
        hostname: 'localhost',
        port: PORT,
        path: '/health',
        method: 'GET',
        timeout: 2000
      };
      
      const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
          console.log('✅ Backend Health Check: PASSED');
        } else {
          console.log('❌ Backend Health Check: FAILED');
        }
      });
      
      req.on('error', (err) => {
        console.log('❌ Backend Health Check: FAILED -', err.message);
      });
      
      req.end();
    };
    
    testHealth();
    
    // Test frontend accessibility
    const testFrontend = () => {
      const frontendOptions = {
        hostname: 'localhost',
        port: 7000,
        path: '/',
        method: 'GET',
        timeout: 2000
      };
      
      const frontendReq = http.request(frontendOptions, (res) => {
        if (res.statusCode === 200) {
          console.log('✅ Frontend Accessibility: PASSED');
        } else {
          console.log('❌ Frontend Accessibility: FAILED');
        }
      });
      
      frontendReq.on('error', (err) => {
        console.log('⚠️ Frontend not running yet (this is normal during startup)');
      });
      
      frontendReq.end();
    };
    
    testFrontend();
    
    setTimeout(() => {
      console.log('');
      console.log('🌍 EXTERNAL ACCESS CHECKS:');
      console.log('   🔗 Local Access:');
      console.log('     • Frontend: http://localhost:7000');
      console.log('     • Backend API: http://localhost:7005/api');
      console.log('     • Health: http://localhost:7005/health');
      console.log('');
      console.log('   🔗 Network Access:');
      exec('hostname -I', (error, stdout, stderr) => {
        if (!error) {
          const localIP = stdout.match(/(\d+\.\d+\.\d+\.\d+)/);
          if (localIP) {
            console.log(`     • Frontend: http://${localIP[1]}:7000`);
            console.log(`     • Backend API: http://${localIP[1]}:7005/api`);
          }
        }
      });
      console.log('');
      console.log('🔥 FIREWALL NOTES:');
      console.log('   • If blocked, run: sudo ufw allow 7000/tcp && sudo ufw allow 7005/tcp');
      console.log('   • To check: sudo ufw status');
      console.log('   • For system firewall: Check your OS firewall settings');
      console.log('');
      console.log('📱 MOBILE ACCESS:');
      console.log('   • Install "Expo Go" app from App Store/Play Store');
      console.log('   • Open http://localhost:7000 in browser');
      console.log('   • Scan QR code with Expo Go');
      console.log('');
    }, 3000);
    
  }, 2000);
});