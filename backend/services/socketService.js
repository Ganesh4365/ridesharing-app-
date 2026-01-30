const { updateDriverLocation, findNearbyDrivers, calculateDistance } = require('../config/redis');
const { query } = require('../config/database');

let io;

const initializeSocket = (socketIo) => {
  io = socketIo;
  
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const userId = socket.handshake.auth.userId;
      const role = socket.handshake.auth.role;
      
      if (!userId || !role) {
        return next(new Error('Authentication failed'));
      }
      
      socket.userId = userId;
      socket.role = role;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.role})`);
    
    // Join user to their personal room
    socket.join(socket.userId);
    
    // Handle driver going online/offline
    socket.on('driver_status_change', async (data) => {
      if (socket.role !== 'driver') return;
      
      try {
        const { isOnline, location } = data;
        
        // Update driver status in database
        await query(
          `UPDATE drivers 
           SET is_online = $1, current_latitude = $2, current_longitude = $3, 
               last_location_update = CURRENT_TIMESTAMP 
           WHERE id = $4`,
          [isOnline, location?.latitude, location?.longitude, socket.userId]
        );
        
        // Update Redis cache
        if (isOnline && location) {
          await updateDriverLocation(socket.userId, location);
        }
        
        // Broadcast status change to nearby users
        socket.broadcast.emit('driver_status_update', {
          driverId: socket.userId,
          isOnline,
          location,
        });
      } catch (error) {
        console.error('Driver status change error:', error);
        socket.emit('error', { message: 'Failed to update driver status' });
      }
    });
    
    // Handle ride request
    socket.on('request_ride', async (data) => {
      if (socket.role !== 'rider') return;
      
      try {
        const { pickup, dropoff, vehicleType } = data;
        
        // Calculate fare and distance (simplified)
        const distance = calculateDistance(
          pickup.latitude, pickup.longitude,
          dropoff.latitude, dropoff.longitude
        );
        const fare = calculateFare(vehicleType, distance);
        
        // Create ride record
        const rideResult = await query(
          `INSERT INTO rides 
           (rider_id, pickup_latitude, pickup_longitude, dropoff_latitude, dropoff_longitude,
            vehicle_type, fare, distance, duration, estimated_time)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING *`,
          [
            socket.userId, pickup.latitude, pickup.longitude,
            dropoff.latitude, dropoff.longitude, vehicleType,
            fare, distance / 1000, // Convert to km
            Math.ceil(distance / 40), // Assuming 40 km/h average speed
            Math.ceil(distance / 40), // Same as duration for simplicity
          ]
        );
        
        const ride = rideResult.rows[0];
        
        // Find nearby drivers
        const nearbyDrivers = await findNearbyDrivers(
          pickup.latitude, pickup.longitude, 5000 // 5km radius
        );
        
        // Send ride request to nearby drivers
        nearbyDrivers.forEach(driver => {
          io.to(driver.id).emit('ride_request', {
            rideId: ride.id,
            pickup,
            dropoff,
            vehicleType,
            fare,
            distance,
            riderId: socket.userId,
          });
        });
        
        // Add rider to ride room for updates
        socket.join(`ride_${ride.id}`);
        
        socket.emit('ride_created', { rideId: ride.id });
      } catch (error) {
        console.error('Ride request error:', error);
        socket.emit('error', { message: 'Failed to create ride request' });
      }
    });
    
    // Handle ride acceptance
    socket.on('accept_ride', async (data) => {
      if (socket.role !== 'driver') return;
      
      try {
        const { rideId } = data;
        
        // Update ride with driver
        const rideResult = await query(
          `UPDATE rides 
           SET driver_id = $1, status = 'accepted', updated_at = CURRENT_TIMESTAMP
           WHERE id = $2 AND status = 'requested'
           RETURNING *`,
          [socket.userId, rideId]
        );
        
        if (rideResult.rows.length === 0) {
          return socket.emit('error', { message: 'Ride not available' });
        }
        
        const ride = rideResult.rows[0];
        
        // Notify rider
        io.to(`ride_${rideId}`).emit('driver_assigned', {
          driverId: socket.userId,
          rideId,
          status: 'accepted',
        });
        
        // Add driver to ride room
        socket.join(`ride_${rideId}`);
        
        // Reject ride for other drivers
        socket.broadcast.emit('ride_rejected', { rideId });
      } catch (error) {
        console.error('Accept ride error:', error);
        socket.emit('error', { message: 'Failed to accept ride' });
      }
    });
    
    // Handle location updates
    socket.on('update_location', async (data) => {
      try {
        const { location } = data;
        
        // Update driver location in database
        if (socket.role === 'driver') {
          await query(
            `UPDATE drivers 
             SET current_latitude = $1, current_longitude = $2, 
                 last_location_update = CURRENT_TIMESTAMP 
             WHERE id = $3`,
            [location.latitude, location.longitude, socket.userId]
          );
          
          await updateDriverLocation(socket.userId, location);
        }
        
        // Broadcast location to relevant rides
        const activeRides = await query(
          `SELECT id FROM rides 
           WHERE (rider_id = $1 OR driver_id = $1) 
           AND status IN ('accepted', 'arrived', 'in_progress')`,
          [socket.userId]
        );
        
        activeRides.rows.forEach(ride => {
          socket.to(`ride_${ride.id}`).emit('location_update', {
            userId: socket.userId,
            location,
            timestamp: new Date().toISOString(),
          });
        });
      } catch (error) {
        console.error('Location update error:', error);
      }
    });
    
    // Handle ride status changes
    socket.on('update_ride_status', async (data) => {
      try {
        const { rideId, status } = data;
        
        const rideResult = await query(
          `UPDATE rides 
           SET status = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2 AND (rider_id = $3 OR driver_id = $3)
           RETURNING *`,
          [status, rideId, socket.userId]
        );
        
        if (rideResult.rows.length === 0) {
          return socket.emit('error', { message: 'Ride not found' });
        }
        
        const ride = rideResult.rows[0];
        
        // Notify all participants in the ride
        io.to(`ride_${rideId}`).emit('ride_status_change', {
          rideId,
          status,
          timestamp: ride.updated_at,
        });
        
        // Update completed_at if ride is completed
        if (status === 'completed') {
          await query(
            `UPDATE rides SET completed_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [rideId]
          );
        }
      } catch (error) {
        console.error('Ride status update error:', error);
        socket.emit('error', { message: 'Failed to update ride status' });
      }
    });
    
    // Handle chat messages
    socket.on('send_message', (data) => {
      const { rideId, message } = data;
      
      // Broadcast message to ride participants
      socket.to(`ride_${rideId}`).emit('message_received', {
        rideId,
        message,
        senderId: socket.userId,
        timestamp: new Date().toISOString(),
      });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId} (${socket.role})`);
      
      // Handle driver going offline
      if (socket.role === 'driver') {
        query(
          `UPDATE drivers SET is_online = false WHERE id = $1`,
          [socket.userId]
        ).catch(console.error);
      }
    });
  });
};

// Utility functions
function calculateFare(vehicleType, distance) {
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
  const distanceKm = distance / 1000; // Convert to km
  
  return Math.round(baseFare + (perKmRate * distanceKm));
}

function broadcastToNearbyDrivers(latitude, longitude, event, data) {
  // In a real implementation, this would use geospatial queries
  // For now, we'll broadcast to all online drivers
  io.emit(event, data);
}

module.exports = {
  initializeSocket,
};