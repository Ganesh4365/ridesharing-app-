# SwiftRide API Documentation

## Overview

SwiftRide provides a comprehensive RESTful API for ride-sharing functionality with real-time capabilities through WebSocket connections.

## Base URL

```
Development: http://localhost:3000/api
Production: https://api.swiftride.com/api
```

## Authentication

### JWT Token Authentication
All protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <access_token>
```

### Token Generation
Tokens are generated during login/registration and include:
- `userId`: User ID
- `role`: User role (rider/driver)

## Endpoints

### Authentication

#### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "password123",
  "role": "rider"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "rider"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

#### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /auth/profile
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Doe",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

### Rides

#### Get Ride History
```http
GET /rides/history?page=1&limit=10&status=completed
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rides": [
      {
        "id": "uuid",
        "pickup_latitude": 12.9716,
        "pickup_longitude": 77.5946,
        "dropoff_latitude": 12.9352,
        "dropoff_longitude": 77.6245,
        "vehicle_type": "sedan",
        "status": "completed",
        "fare": 150.00,
        "distance": 8.5,
        "created_at": "2024-01-28T10:30:00Z"
      }
    ],
    "page": 1,
    "limit": 10
  }
}
```

#### Get Ride Details
```http
GET /rides/:id
Authorization: Bearer <token>
```

#### Cancel Ride
```http
POST /rides/:id/cancel
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "reason": "Change of plans"
}
```

#### Get Ride Estimate
```http
POST /rides/estimate
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "pickup": {
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "dropoff": {
    "latitude": 12.9352,
    "longitude": 77.6245
  },
  "vehicleType": "sedan"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "distance": 8500,
    "fare": 150,
    "estimatedTime": 15,
    "vehicleType": "sedan"
  }
}
```

#### Submit Review
```http
POST /rides/:id/review
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Great ride!",
  "targetUserId": "driver_uuid"
}
```

### Drivers

#### Get Driver Profile
```http
GET /drivers/profile
Authorization: Bearer <token>
```

#### Update Driver Status
```http
PUT /drivers/status
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "isOnline": true,
  "vehicleType": "sedan",
  "vehicleNumber": "KA01AB1234",
  "licenseNumber": "DL123456"
}
```

#### Get Driver Earnings
```http
GET /drivers/earnings?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_rides": 42,
      "total_earnings": 2850.00,
      "average_fare": 67.86,
      "total_distance": 357.5,
      "average_rating": 4.8
    },
    "rides": [...]
  }
}
```

#### Update Driver Location
```http
POST /drivers/location
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "latitude": 12.9716,
  "longitude": 77.5946
}
```

#### Get Nearby Drivers
```http
GET /drivers/nearby?latitude=12.9716&longitude=77.5946&radius=5000
Authorization: Bearer <token>
```

### Payments

#### Process Payment
```http
POST /payments/process
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "rideId": "uuid",
  "amount": 150.00,
  "method": "card",
  "paymentDetails": {
    "cardNumber": "4111111111111111",
    "expiry": "12/24",
    "cvv": "123"
  }
}
```

#### Get Payment History
```http
GET /payments/history?page=1&limit=10&status=completed
Authorization: Bearer <token>
```

#### Get Payment Details
```http
GET /payments/:id
Authorization: Bearer <token>
```

#### Refund Payment
```http
POST /payments/:id/refund
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "reason": "Customer request"
}
```

## WebSocket Events

### Connection
Connect to WebSocket server with authentication:

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'Bearer <jwt_token>',
    userId: 'user_id',
    role: 'rider' // or 'driver'
  }
});
```

### Client to Server Events

#### Request Ride
```javascript
socket.emit('request_ride', {
  pickup: { latitude: 12.9716, longitude: 77.5946 },
  dropoff: { latitude: 12.9352, longitude: 77.6245 },
  vehicleType: 'sedan',
  fare: 150
});
```

#### Accept Ride (Driver)
```javascript
socket.emit('accept_ride', {
  rideId: 'uuid',
  driverId: 'driver_uuid'
});
```

#### Update Location
```javascript
socket.emit('update_location', {
  location: { latitude: 12.9716, longitude: 77.5946 },
  userId: 'user_id'
});
```

#### Update Ride Status
```javascript
socket.emit('update_ride_status', {
  rideId: 'uuid',
  status: 'accepted' // accepted, arrived, in_progress, completed
});
```

#### Send Message
```javascript
socket.emit('send_message', {
  rideId: 'uuid',
  message: 'I'm on my way!',
  senderId: 'user_id'
});
```

### Server to Client Events

#### Driver Assigned (Rider)
```javascript
socket.on('driver_assigned', (data) => {
  // data: { driverId, rideId, status, estimatedTime }
});
```

#### New Ride Request (Driver)
```javascript
socket.on('new_ride_request', (data) => {
  // data: { rideId, pickup, dropoff, vehicleType, fare, riderId }
});
```

#### Location Update
```javascript
socket.on('location_update', (data) => {
  // data: { userId, location, timestamp }
});
```

#### Ride Status Change
```javascript
socket.on('ride_status_change', (data) => {
  // data: { rideId, status, timestamp }
});
```

#### Message Received
```javascript
socket.on('message_received', (data) => {
  // data: { rideId, message, senderId, timestamp }
});
```

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per minute per IP
- **Payment**: 10 requests per minute per user

## Data Types

### User Object
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "role": "rider",
  "avatar_url": "https://example.com/avatar.jpg",
  "rating": 4.8,
  "created_at": "2024-01-28T10:30:00Z"
}
```

### Ride Object
```json
{
  "id": "uuid",
  "rider_id": "uuid",
  "driver_id": "uuid",
  "pickup_latitude": 12.9716,
  "pickup_longitude": 77.5946,
  "dropoff_latitude": 12.9352,
  "dropoff_longitude": 77.6245,
  "vehicle_type": "sedan",
  "status": "completed",
  "fare": 150.00,
  "distance": 8.5,
  "duration": 15,
  "estimated_time": 15,
  "payment_method": "card",
  "payment_status": "paid",
  "created_at": "2024-01-28T10:30:00Z",
  "completed_at": "2024-01-28T10:45:00Z"
}
```

### Payment Object
```json
{
  "id": "uuid",
  "ride_id": "uuid",
  "amount": 150.00,
  "method": "card",
  "status": "completed",
  "transaction_id": "txn_123456789",
  "created_at": "2024-01-28T10:45:00Z"
}
```

## SDK Examples

### JavaScript/React Native
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.swiftride.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Example: Get ride history
const getRideHistory = async () => {
  try {
    const response = await api.get('/rides/history');
    return response.data;
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};
```

## Support

For API support:
- Email: api-support@swiftride.com
- Documentation: [docs.swiftride.com](https://docs.swiftride.com)
- Status Page: [status.swiftride.com](https://status.swiftride.com)