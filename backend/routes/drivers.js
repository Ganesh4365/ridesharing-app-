const express = require('express');
const { authenticate, authorize, asyncHandler } = require('../middleware/auth');

const router = express.Router();

// Get driver profile
router.get('/profile', authenticate, authorize('driver'), asyncHandler(async (req, res) => {
  try {
    const result = await query(
      `SELECT d.*, u.name, u.email, u.phone, u.avatar_url, u.rating as user_rating
       FROM drivers d
       JOIN users u ON d.id = u.id
       WHERE d.id = $1`,
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found',
      });
    }
    
    res.json({
      success: true,
      data: { driver: result.rows[0] },
    });
  } catch (error) {
    console.error('Get driver profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get driver profile',
    });
  }
}));

// Update driver status (online/offline)
router.put('/status', authenticate, authorize('driver'), asyncHandler(async (req, res) => {
  try {
    const { isOnline, vehicleType, vehicleNumber, licenseNumber } = req.body;
    
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    
    if (isOnline !== undefined) {
      updateFields.push(`is_online = $${paramIndex}`);
      updateValues.push(isOnline);
      paramIndex++;
    }
    
    if (vehicleType) {
      updateFields.push(`vehicle_type = $${paramIndex}`);
      updateValues.push(vehicleType);
      paramIndex++;
    }
    
    if (vehicleNumber) {
      updateFields.push(`vehicle_number = $${paramIndex}`);
      updateValues.push(vehicleNumber);
      paramIndex++;
    }
    
    if (licenseNumber) {
      updateFields.push(`license_number = $${paramIndex}`);
      updateValues.push(licenseNumber);
      paramIndex++;
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(req.user.id);
    
    const result = await query(
      `UPDATE drivers 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      updateValues
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Driver status updated successfully',
      data: { driver: result.rows[0] },
    });
  } catch (error) {
    console.error('Update driver status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update driver status',
    });
  }
}));

// Get driver earnings
router.get('/earnings', authenticate, authorize('driver'), asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let whereClause = 'WHERE driver_id = $1';
    const queryParams = [req.user.id];
    let paramIndex = 2;
    
    if (startDate) {
      whereClause += ` AND created_at >= $${paramIndex}`;
      queryParams.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      whereClause += ` AND created_at <= $${paramIndex}`;
      queryParams.push(endDate);
      paramIndex++;
    }
    
    const result = await query(
      `SELECT 
              COUNT(*) as total_rides,
              SUM(fare) as total_earnings,
              AVG(fare) as average_fare,
              SUM(distance) as total_distance,
              AVG(rating) as average_rating
       FROM rides 
       ${whereClause}
       AND status = 'completed'`,
      queryParams
    );
    
    // Get detailed earnings breakdown
    const detailedResult = await query(
      `SELECT id, fare, distance, duration, created_at, status
       FROM rides 
       ${whereClause}
       ORDER BY created_at DESC`,
      queryParams
    );
    
    res.json({
      success: true,
      data: {
        summary: result.rows[0] || {
          total_rides: 0,
          total_earnings: 0,
          average_fare: 0,
          total_distance: 0,
          average_rating: 0,
        },
        rides: detailedResult.rows,
      },
    });
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get earnings',
    });
  }
}));

// Update driver location
router.post('/location', authenticate, authorize('driver'), asyncHandler(async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }
    
    await query(
      `UPDATE drivers 
       SET current_latitude = $1, current_longitude = $2, 
           last_location_update = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [latitude, longitude, req.user.id]
    );
    
    res.json({
      success: true,
      message: 'Location updated successfully',
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
    });
  }
}));

// Get nearby drivers (for testing)
router.get('/nearby', authenticate, asyncHandler(async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }
    
    const result = await query(
      `SELECT d.id, d.vehicle_type, d.vehicle_number, d.rating as driver_rating,
              d.current_latitude, d.current_longitude, d.earnings, d.total_rides,
              u.name, u.avatar_url
       FROM drivers d
       JOIN users u ON d.id = u.id
       WHERE d.is_online = true
       AND d.current_latitude IS NOT NULL
       AND d.current_longitude IS NOT NULL
       AND (6371 * acos(cos(radians($1)) * cos(radians(d.current_latitude)) * 
           cos(radians(d.current_longitude) - radians($2)) + sin(radians($1)) * 
           sin(radians(d.current_latitude)))) <= $3
       ORDER BY (6371 * acos(cos(radians($1)) * cos(radians(d.current_latitude)) * 
           cos(radians(d.current_longitude) - radians($2)) + sin(radians($1)) * 
           sin(radians(d.current_latitude)))) ASC
       LIMIT 20`,
      [latitude, longitude, radius / 1000] // Convert radius to km
    );
    
    res.json({
      success: true,
      data: {
        drivers: result.rows,
        count: result.rows.length,
      },
    });
  } catch (error) {
    console.error('Get nearby drivers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get nearby drivers',
    });
  }
}));

// Get driver statistics
router.get('/statistics', authenticate, authorize('driver'), asyncHandler(async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    let dateFilter = '';
    switch (period) {
      case 'today':
        dateFilter = "AND DATE(created_at) = CURRENT_DATE";
        break;
      case 'week':
        dateFilter = "AND created_at >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND created_at >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      case 'year':
        dateFilter = "AND created_at >= CURRENT_DATE - INTERVAL '365 days'";
        break;
    }
    
    const result = await query(
      `SELECT 
              COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_rides,
              COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_rides,
              SUM(CASE WHEN status = 'completed' THEN fare ELSE 0 END) as total_earnings,
              AVG(CASE WHEN status = 'completed' THEN fare END) as average_fare,
              SUM(CASE WHEN status = 'completed' THEN distance ELSE 0 END) as total_distance,
              AVG(CASE WHEN status = 'completed' THEN duration END) as average_duration
       FROM rides 
       WHERE driver_id = $1 ${dateFilter}`,
      [req.user.id]
    );
    
    res.json({
      success: true,
      data: {
        statistics: result.rows[0] || {
          completed_rides: 0,
          cancelled_rides: 0,
          total_earnings: 0,
          average_fare: 0,
          total_distance: 0,
          average_duration: 0,
        },
        period,
      },
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
    });
  }
}));

module.exports = router;