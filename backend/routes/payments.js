const express = require('express');
const { authenticate, asyncHandler } = require('../middleware/auth');

const router = express.Router();

// Process payment
router.post('/process', authenticate, asyncHandler(async (req, res) => {
  try {
    const { rideId, amount, method, paymentDetails } = req.body;
    
    if (!rideId || !amount || !method) {
      return res.status(400).json({
        success: false,
        message: 'Ride ID, amount, and payment method are required',
      });
    }
    
    // Verify ride belongs to user
    const rideCheck = await query(
      `SELECT id, rider_id, status, fare FROM rides 
       WHERE id = $1 AND rider_id = $2`,
      [rideId, req.user.id]
    );
    
    if (rideCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found',
      });
    }
    
    const ride = rideCheck.rows[0];
    
    if (ride.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Ride must be completed to process payment',
      });
    }
    
    // Check if payment already exists
    const existingPayment = await query(
      'SELECT id FROM payments WHERE ride_id = $1',
      [rideId]
    );
    
    if (existingPayment.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Payment already processed for this ride',
      });
    }
    
    // Process payment based on method
    let paymentResult;
    try {
      switch (method) {
        case 'card':
          paymentResult = await processCardPayment(amount, paymentDetails);
          break;
        case 'wallet':
          paymentResult = await processWalletPayment(req.user.id, amount);
          break;
        case 'upi':
          paymentResult = await processUPIPayment(amount, paymentDetails);
          break;
        case 'cash':
          paymentResult = { success: true, transactionId: 'cash_' + Date.now() };
          break;
        default:
          throw new Error('Invalid payment method');
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    
    // Create payment record
    const paymentInsert = await query(
      `INSERT INTO payments 
       (ride_id, amount, method, status, transaction_id, gateway_response)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        rideId,
        amount,
        method,
        paymentResult.success ? 'completed' : 'failed',
        paymentResult.transactionId,
        JSON.stringify(paymentResult),
      ]
    );
    
    // Update ride payment status
    await query(
      `UPDATE rides 
       SET payment_status = $1, payment_method = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [
        paymentResult.success ? 'paid' : 'pending',
        method,
        rideId,
      ]
    );
    
    // Update driver earnings if payment successful
    if (paymentResult.success && method !== 'cash') {
      await query(
        `UPDATE drivers 
         SET earnings = earnings + $1, total_rides = total_rides + 1
         WHERE id = (SELECT driver_id FROM rides WHERE id = $1)`,
        [rideId, amount * 0.8] // Assuming 80% goes to driver
      );
    }
    
    res.json({
      success: paymentResult.success,
      message: paymentResult.success 
        ? 'Payment processed successfully' 
        : 'Payment failed',
      data: { payment: paymentInsert.rows[0] },
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
    });
  }
}));

// Get payment history
router.get('/history', authenticate, asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE r.rider_id = $1';
    const queryParams = [req.user.id];
    
    if (status) {
      whereClause += ' AND p.status = $2';
      queryParams.push(status);
    }
    
    const result = await query(
      `SELECT p.id, p.amount, p.method, p.status, p.transaction_id, p.created_at,
              r.id as ride_id, r.pickup_latitude, r.pickup_longitude,
              r.dropoff_latitude, r.dropoff_longitude, r.fare, r.status as ride_status
       FROM payments p
       JOIN rides r ON p.ride_id = r.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
      [...queryParams, limit, offset]
    );
    
    res.json({
      success: true,
      data: {
        payments: result.rows,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment history',
    });
  }
}));

// Get payment details
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  try {
    const paymentId = req.params.id;
    
    const result = await query(
      `SELECT p.*, 
              r.id as ride_id, r.rider_id, r.driver_id, r.pickup_latitude, 
              r.pickup_longitude, r.dropoff_latitude, r.dropoff_longitude,
              u.name as rider_name, d.vehicle_number
       FROM payments p
       JOIN rides r ON p.ride_id = r.id
       LEFT JOIN users u ON r.rider_id = u.id
       LEFT JOIN drivers d ON r.driver_id = d.id
       WHERE p.id = $1 AND (r.rider_id = $2 OR r.driver_id = $2)`,
      [paymentId, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }
    
    res.json({
      success: true,
      data: { payment: result.rows[0] },
    });
  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment details',
    });
  }
}));

// Refund payment
router.post('/:id/refund', authenticate, asyncHandler(async (req, res) => {
  try {
    const paymentId = req.params.id;
    const { reason } = req.body;
    
    // Get payment details
    const paymentCheck = await query(
      `SELECT p.*, r.rider_id, r.driver_id
       FROM payments p
       JOIN rides r ON p.ride_id = r.id
       WHERE p.id = $1 AND (r.rider_id = $2 OR r.driver_id = $2)`,
      [paymentId, req.user.id]
    );
    
    if (paymentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }
    
    const payment = paymentCheck.rows[0];
    
    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Only completed payments can be refunded',
      });
    }
    
    // Process refund based on payment method
    let refundResult;
    try {
      switch (payment.method) {
        case 'card':
          refundResult = await processCardRefund(payment.transaction_id, payment.amount);
          break;
        case 'wallet':
          refundResult = await processWalletRefund(req.user.id, payment.amount);
          break;
        case 'upi':
          refundResult = await processUPIRefund(payment.transaction_id, payment.amount);
          break;
        case 'cash':
          refundResult = { success: true, refundId: 'cash_refund_' + Date.now() };
          break;
        default:
          throw new Error('Refund not supported for this payment method');
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    
    // Update payment status
    const updateResult = await query(
      `UPDATE payments 
       SET status = 'refunded', 
           gateway_response = gateway_response || '{}'::jsonb || $1::jsonb,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [
        JSON.stringify({
          refundId: refundResult.refundId,
          refundAmount: payment.amount,
          refundReason: reason,
          refundedAt: new Date().toISOString(),
        }),
        paymentId,
      ]
    );
    
    // Update ride payment status
    await query(
      `UPDATE rides 
       SET payment_status = 'refunded', updated_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT ride_id FROM payments WHERE id = $1)`,
      [paymentId]
    );
    
    // Update driver earnings (subtract refunded amount)
    if (payment.method !== 'cash') {
      await query(
        `UPDATE drivers 
         SET earnings = earnings - $1
         WHERE id = $2`,
        [payment.amount * 0.8, payment.driver_id]
      );
    }
    
    res.json({
      success: refundResult.success,
      message: refundResult.success 
        ? 'Payment refunded successfully' 
        : 'Refund failed',
      data: { payment: updateResult.rows[0] },
    });
  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
    });
  }
}));

// Payment processing functions (mock implementations)
async function processCardPayment(amount, details) {
  // Integrate with Stripe/Razorpay here
  console.log('Processing card payment:', amount, details);
  return {
    success: true,
    transactionId: 'card_' + Date.now(),
  };
}

async function processWalletPayment(userId, amount) {
  // Check user wallet balance and deduct
  console.log('Processing wallet payment:', userId, amount);
  return {
    success: true,
    transactionId: 'wallet_' + Date.now(),
  };
}

async function processUPIPayment(amount, details) {
  // Integrate with UPI gateway
  console.log('Processing UPI payment:', amount, details);
  return {
    success: true,
    transactionId: 'upi_' + Date.now(),
  };
}

async function processCardRefund(transactionId, amount) {
  // Process card refund
  console.log('Processing card refund:', transactionId, amount);
  return {
    success: true,
    refundId: 'refund_' + Date.now(),
  };
}

async function processWalletRefund(userId, amount) {
  // Add amount back to wallet
  console.log('Processing wallet refund:', userId, amount);
  return {
    success: true,
    refundId: 'wallet_refund_' + Date.now(),
  };
}

async function processUPIRefund(transactionId, amount) {
  // Process UPI refund
  console.log('Processing UPI refund:', transactionId, amount);
  return {
    success: true,
    refundId: 'upi_refund_' + Date.now(),
  };
}

module.exports = router;