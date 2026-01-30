# SwiftRide - Next Generation Ride-Sharing App

A comprehensive ride-sharing application built with React Native and Node.js, featuring real-time tracking, enhanced UI/UX, and advanced features that surpass existing platforms like Rapido and Ola.

## 🚀 Features

### For Riders
- **Smart Booking**: AI-powered destination suggestions and predictive search
- **Multiple Vehicle Types**: Bike, Auto, Sedan, SUV, Premium
- **Real-time Tracking**: Live driver location with 2-second updates
- **Driver Favorites**: Save preferred drivers for future rides
- **Multi-stop Rides**: Add multiple destinations in a single trip
- **Scheduled Rides**: Book rides in advance
- **Secure Payments**: Multiple payment options with transparent pricing
- **In-app Chat**: Seamless communication with drivers
- **Emergency Features**: SOS button and ride sharing with contacts

### For Drivers
- **Flexible Scheduling**: Go online/offline anytime
- **Smart Ride Matching**: Optimized assignment based on location and ratings
- **Real-time Navigation**: Integrated GPS with turn-by-turn directions
- **Earnings Dashboard**: Detailed analytics and payout management
- **Performance Analytics**: Ride history and rating insights
- **Multi-vehicle Support**: Switch between different vehicle types

### Advanced Features
- **AI Route Optimization**: Smart routing for faster trips
- **Surge Pricing**: Dynamic pricing based on demand
- **Voice Commands**: Hands-free operation
- **Accessibility**: Screen reader support and voice navigation
- **Dark Mode**: System-wide theme support
- **Corporate Accounts**: Business travel management

## 🛠 Technology Stack

### Frontend
- **React Native** with Expo for cross-platform development
- **TypeScript** for type safety
- **React Navigation** for seamless navigation
- **React Native Paper** for Material Design components
- **React Native Maps** for mapping functionality
- **Socket.IO Client** for real-time communication

### Backend
- **Node.js** with Express.js
- **Socket.IO** for real-time features
- **PostgreSQL** for database management
- **Redis** for caching and session management
- **JWT** for secure authentication
- **Helmet** for security headers

### Real-time Features
- **GPS Tracking**: Update driver location every 2 seconds
- **Live Ride Status**: Instant updates for ride states
- **Real-time Chat**: In-app messaging
- **Driver Assignment**: Smart matching algorithm
- **Location Broadcasting**: Efficient location sharing

## 📱 Installation

### Prerequisites
- Node.js 16+ and npm
- React Native development environment
- PostgreSQL database
- Redis server
- Google Maps API key

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/swiftride-app.git
   cd swiftride-app
   ```

2. **Install dependencies**
   ```bash
   # Frontend dependencies
   npm install
   
   # Backend dependencies
   cd backend
   npm install
   cd ..
   ```

3. **Setup environment variables**
   ```bash
   # Backend
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   
   # Frontend (create constants.ts)
   # Update API_BASE_URL and other constants
   ```

4. **Setup database**
   ```bash
   # Create PostgreSQL database
   createdb swiftride
   
   # The app will auto-create tables on first run
   ```

5. **Start the application**
   ```bash
   # Start both frontend and backend concurrently
   npm run dev
   
   # Or start individually
   npm start              # Frontend
   npm run server          # Backend
   ```

## 🏗 Architecture

```
┌─────────────────┐ ┌─────────────────┐
│   User App      │ │   Driver App    │
│  (React Native) │ │  (React Native) │
└─────────┬───────┘ └─────────┬───────┘
          │                   │
          └──────────┬──────────┘
                     │
          ┌────────▼────────┐
          │  Socket Server   │
          │  (Real-time)     │
          └────────┬────────┘
                     │
          ┌────────▼────────┐
          │  API Server      │
          │  (Node.js)       │
          └────────┬────────┘
                     │
          ┌────────▼────────┐
          │  PostgreSQL     │
          │  + Redis        │
          └─────────────────┘
```

## 🔧 Configuration

### Environment Variables (Backend)
```env
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:19006

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=swiftride
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Google Maps
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Payment Gateway
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
```

### Google Maps Setup
1. Enable Google Maps JavaScript API
2. Enable Places API
3. Enable Directions API
4. Add API key to environment variables

## 📊 Database Schema

### Core Tables
- **users**: User profiles and authentication
- **drivers**: Driver-specific information and vehicle details
- **rides**: Ride records with status tracking
- **payments**: Payment transactions and methods
- **reviews**: Ratings and feedback system
- **location_tracking**: Real-time location data

## 🚀 Deployment

### Production Deployment

1. **Build the app**
   ```bash
   # Expo build
   expo build:android
   expo build:ios
   
   # Or EAS build
   eas build --platform android
   eas build --platform ios
   ```

2. **Backend deployment**
   ```bash
   # PM2 for process management
   npm install -g pm2
   pm2 start server.js --name swiftride
   
   # Environment variables for production
   NODE_ENV=production
   ```

3. **Database setup**
   - Configure PostgreSQL with proper indexes
   - Setup Redis for production caching
   - Configure database backups

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Comprehensive input sanitization
- **HTTPS**: Encrypted communication
- **Helmet.js**: Security headers
- **SQL Injection Protection**: Parameterized queries

## 📈 Performance Optimizations

- **Database Indexing**: Optimized queries
- **Redis Caching**: Fast data retrieval
- **WebSocket Compression**: Reduced bandwidth
- **Image Optimization**: Compressed assets
- **Lazy Loading**: Improved app startup

## 🧪 Testing

```bash
# Run tests
npm test

# Test coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Ride Endpoints
- `POST /api/rides/request` - Request ride
- `GET /api/rides/history` - Ride history
- `GET /api/rides/:id` - Ride details
- `POST /api/rides/:id/cancel` - Cancel ride

### Payment Endpoints
- `POST /api/payments/process` - Process payment
- `GET /api/payments/history` - Payment history
- `POST /api/payments/:id/refund` - Refund payment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Email: support@swiftride.com
- Documentation: [docs.swiftride.com](https://docs.swiftride.com)
- Issues: [GitHub Issues](https://github.com/your-repo/swiftride-app/issues)

---

**SwiftRide** - Your journey, our priority! 🚗💨