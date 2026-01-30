const express = require('express');
const { authenticate, authorize, asyncHandler } = require('../middleware/auth');

const router = express.Router();

// Get ride history
router.get('/history', authenticate, asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE rider_id = $1';
    const queryParams = [req.user.id];
    
    if (status) {
      whereClause += ' AND status = $2';
      queryParams.push(status);
    }
    
    const result = await query(
      `SELECT id, pickup_latitude, pickup_longitude, dropoff_latitude, dropoff_longitude,
              vehicle_type, status, fare, distance, duration, estimated_time,
              payment_method, payment_status, created_at, completed_at
       FROM rides 
       ${whereClause}
       ORDER BY created_at DESC 
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
      [...queryParams, limit, offset]
    );
    
    res.json({
      success: true,
      data: {
        rides: result.rows,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get ride history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ride history',
    });
  }
}));

// Get ride details
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  try {
    const rideId = req.params.id;
    
    const result = await query(
      `SELECT r.*, 
              u.name as rider_name, u.phone as rider_phone,
              d.vehicle_type, d.vehicle_number, d.rating as driver_rating
       FROM rides r
       LEFT JOIN users u ON r.rider_id = u.id
       LEFT JOIN drivers d ON r.driver_id = d.id
       WHERE r.id = $1 AND (r.rider_id = $2 OR r.driver_id = $2)`,
      [rideId, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found',
      });
    }
    
    res.json({
      success: true,
      data: { ride: result.rows[0] },
    });
  } catch (error) {
    console.error('Get ride details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ride details',
    });
  }
}));

// Cancel ride
router.post('/:id/cancel', authenticate, asyncHandler(async (req, res) => {
  try {
    const rideId = req.params.id;
    const { reason } = req.body;
    
    const result = await query(
      `UPDATE rides 
       SET status = 'cancelled', cancellation_reason = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND (rider_id = $3 OR driver_id = $3) 
       AND status IN ('requested', 'accepted')
       RETURNING *`,
      [reason, rideId, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found or cannot be cancelled',
      });
    }
    
    res.json({
      success: true,
      message: 'Ride cancelled successfully',
      data: { ride: result.rows[0] },
    });
  } catch (error) {
    console.error('Cancel ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel ride',
    });
  }
}));

// Get ride estimate
router.post('/estimate', authenticate, asyncHandler(async (req, res) => {
  try {
    const { pickup, dropoff, vehicleType } = req.body;
    
    if (!pickup || !dropoff || !vehicleType) {
      return res.status(400).json({
        success: false,
        message: 'Pickup, dropoff, and vehicle type are required',
      });
    }
    
    // Calculate distance (simplified - use Google Maps API in production)
    const distance = calculateDistance(
      pickup.latitude, pickup.longitude,
      dropoff.latitude, dropoff.longitude
    );
    
    // Calculate fare
    const fare = calculateFare(vehicleType, distance);
    
    // Calculate estimated time
    const estimatedTime = Math.ceil(distance / (40 * 1000 / 60)); // Assuming 40 km/h average speed
    
    res.json({
      success: true,
      data: {
        distance: Math.round(distance),
        fare,
        estimatedTime,
        vehicleType,
      },
    });
  } catch (error) {
    console.error('Get estimate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get estimate',
    });
  }
}));

// Submit review
router.post('/:id/review', authenticate, asyncHandler(async (req, res) => {
  try {
    const rideId = req.params.id;
    const { rating, comment, targetUserId } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }
    
    // Check if ride belongs to user and is completed
    const rideCheck = await query(
      `SELECT id, rider_id, driver_id, status FROM rides 
       WHERE id = $1 AND status = 'completed' AND (rider_id = $2 OR driver_id = $2)`,
      [rideId, req.user.id]
    );
    
    if (rideCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found or not completed',
      });
    }
    
    // Create review
    const result = await query(
      `INSERT INTO reviews (ride_id, rating, comment, user_id, target_user_id) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (ride_id, user_id) DO UPDATE SET
       rating = EXCLUDED.rating,
       comment = EXCLUDED.comment
       RETURNING *`,
      [rideId, rating, comment, req.user.id, targetUserId]
    );
    
    // Update user's average rating
    await updateUserRating(targetUserId);
    
    res.json({
      success: true,
      message: 'Review submitted successfully',
      data: { review: result.rows[0] },
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review',
    });
  }
}));

// Get reviews for a user
router.get('/reviews/:userId', authenticate, asyncHandler(async (req, res) => {
  try {
    const userId = req.params.userId;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const result = await query(
      `SELECT r.rating, r.comment, r.created_at,
              u.name as reviewer_name, u.avatar_url
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.target_user_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    res.json({
      success: true,
      data: {
        reviews: result.rows,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reviews',
    });
  }
}));

// Utility functions
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000; // Distance in meters
}

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

async function updateUserRating(userId) {
  try {
    const result = await query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
       FROM reviews WHERE target_user_id = $1`,
      [userId]
    );
    
    if (result.rows.length > 0) {
      const { avg_rating, total_reviews } = result.rows[0];
      
      await query(
        `UPDATE users SET rating = $1 WHERE id = $2`,
        [parseFloat(avg_rating).toFixed(2), userId]
      );
      
      if (req.user.role === 'driver') {
        await query(
          `UPDATE drivers SET rating = $1 WHERE id = $2`,
          [parseFloat(avg_rating).toFixed(2), userId]
        );
      }
    }
  } catch (error) {
    console.error('Update user rating error:', error);
  }
}

module.exports = router;