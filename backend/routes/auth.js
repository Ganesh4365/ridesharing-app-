const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { query, generateTokens, authenticate, validateInput, asyncHandler } = require('../middleware/auth');

const router = express.Router();

// Input validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('rider', 'driver').required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Register new user
router.post('/register', validateInput(registerSchema), asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  try {
    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1 OR phone = $2',
      [email, phone]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email or phone already exists',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await query(
      `INSERT INTO users (name, email, phone, password_hash, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, name, email, phone, role, created_at`,
      [name, email, phone, passwordHash, role]
    );

    const user = result.rows[0];

    // If registering as driver, create driver record
    if (role === 'driver') {
      await query(
        `INSERT INTO drivers (id, vehicle_type, vehicle_number, license_number) 
         VALUES ($1, $2, $3, $4)`,
        [user.id, 'sedan', 'TEMP123', 'LIC123456']
      );
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          createdAt: user.created_at,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
    });
  }
}));

// Login user
router.post('/login', validateInput(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user
    const result = await query(
      `SELECT id, name, email, phone, password_hash, role, is_active 
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    // Get driver info if applicable
    let driverInfo = null;
    if (user.role === 'driver') {
      const driverResult = await query(
        `SELECT vehicle_type, vehicle_number, license_number, is_online, 
                earnings, total_rides, rating 
         FROM drivers WHERE id = $1`,
        [user.id]
      );
      if (driverResult.rows.length > 0) {
        driverInfo = driverResult.rows[0];
      }
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          ...(driverInfo && { driverInfo }),
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  }
}));

// Get current user profile
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, email, phone, role, avatar_url, rating, created_at 
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = result.rows[0];

    // Get driver info if applicable
    let driverInfo = null;
    if (user.role === 'driver') {
      const driverResult = await query(
        `SELECT vehicle_type, vehicle_number, license_number, is_online, 
                earnings, total_rides, rating, current_latitude, current_longitude 
         FROM drivers WHERE id = $1`,
        [user.id]
      );
      if (driverResult.rows.length > 0) {
        driverInfo = driverResult.rows[0];
      }
    }

    res.json({
      success: true,
      data: {
        user: {
          ...user,
          ...(driverInfo && { driverInfo }),
        },
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
    });
  }
}));

// Update user profile
router.put('/profile', authenticate, asyncHandler(async (req, res) => {
  const { name, avatar_url } = req.body;

  try {
    const result = await query(
      `UPDATE users 
       SET name = $1, avatar_url = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING id, name, email, phone, role, avatar_url, updated_at`,
      [name, avatar_url, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: result.rows[0] },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
}));

// Logout user
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  try {
    // In a real implementation, you would blacklist the token
    // For now, we'll just return success
    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
}));

module.exports = router;