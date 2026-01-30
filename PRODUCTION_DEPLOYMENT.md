# SwiftRide Production Deployment Guide

## 🚀 Automated Deployment Script

This script will deploy SwiftRide to production with proper configuration, security, and monitoring.

### Prerequisites
- Ubuntu 20.04+ server
- Node.js 18+ installed
- PostgreSQL 13+ installed
- Redis 6+ installed
- Nginx installed
- Domain name pointed to server IP
- SSL certificate (Let's Encrypt recommended)

### Quick Start
```bash
chmod +x deploy-production.sh
./deploy-production.sh --domain yourdomain.com
```

## Manual Setup Steps

### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install dependencies
sudo apt-get install -y postgresql postgresql-contrib redis-server nginx ufw certbot python3-certbot-nginx -y

# Install PM2 for process management
npm install -g pm2
```

### 2. Database Setup
```bash
# Create database user and database
sudo -u postgres createuser --interactive swiftride
sudo -u postgres createdb -O swiftride swiftride_ridesharing

# Enable required extensions
sudo -u postgres psql -d swiftride_ridesharing -c "
  CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";
  CREATE EXTENSION IF NOT EXISTS \"pg_trgm\";
"

# Import database schema
psql -h localhost -U swiftride -d swiftride_ridesharing -f backend/database.sql
```

### 3. Application Setup
```bash
# Clone and build
git clone https://github.com/your-repo/swiftride-app.git
cd swiftride-app

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with production values

# Build frontend
cd /path/to/swiftride-app
npm run build

# Install backend dependencies
cd backend
npm ci --production
```

### 4. Nginx Configuration
```nginx
# Create Nginx config
sudo tee /etc/nginx/sites-available/swiftride > /etc/nginx/sites-available/swiftride << 'EOF'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    include /etc/nginx/snippets/ssl-params.conf;
    include /etc/nginx/snippets/ssl-ciphers.conf;

    # Frontend
    location / {
        root /var/www/swiftride/frontend;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control \"no-store\";
        add_header X-Frame-Options \"SAMEORIGIN\";
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:7005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:7005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security headers
    add_header X-Frame-Options \"SAMEORIGIN\";
    add_header X-Content-Type-Options \"nosniff\";
    add_header X-XSS-Protection \"1; mode=block\";
    add_header Referrer-Policy \"no-referrer-when-downgrade\";
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/swiftride /etc/nginx/sites-enabled/
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 5. SSL Certificate Setup
```bash
# Install SSL certificate
sudo certbot --nginx -d yourdomain.com

# Test SSL
curl -I https://yourdomain.com
```

### 6. PM2 Configuration
```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'swiftride-backend',
    script: './backend/simple-server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 7005,
      DB_HOST: 'localhost',
      DB_PORT: 5432,
      DB_NAME: 'swiftride_ridesharing',
      DB_USER: 'swiftride',
      DB_PASSWORD: 'your_secure_password',
      JWT_SECRET: 'your_jwt_secret',
      GOOGLE_MAPS_API_KEY: 'your_google_maps_api_key'
    }
  }]
};
EOF

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save
```

### 7. Firewall Configuration
```bash
# Configure firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 7005/tcp

# Restart firewall
sudo ufw reload

# Check status
sudo ufw status
```

### 8. Monitoring Setup
```bash
# Create log directory
sudo mkdir -p /var/log/swiftride
sudo chown www-data:www-data /var/log/swiftride

# Configure log rotation
sudo tee /etc/logrotate.d/swiftride > /etc/logrotate.d/swiftride << 'EOF'
/var/log/swiftride/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload swiftride-backend
    endscript
        pm2 reload swiftride-backend
}
EOF
```

### 9. Testing Deployment
```bash
# Test frontend
curl -I https://yourdomain.com

# Test backend API
curl -s https://yourdomain.com/api/health

# Test WebSocket
curl -I https://yourdomain.com/socket.io/

# Test authentication
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@yourdomain.com","password":"test123"}'
```

## Environment Variables

### Production .env.example
```env
NODE_ENV=production
PORT=7005
DB_HOST=localhost
DB_PORT=5432
DB_NAME=swiftride_ridesharing
DB_USER=swiftride
DB_PASSWORD=your_secure_db_password

JWT_SECRET=your_super_secure_jwt_secret_at_least_32_characters_long
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_at_least_32_characters_long
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your_app_password

CLIENT_URL=https://yourdomain.com
SERVER_URL=https://yourdomain.com

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Database Migration Script

```bash
#!/bin/bash
# migration.sh

DB_USER="swiftride"
DB_NAME="swiftride_ridesharing"

echo "Creating database schema..."

psql -h localhost -U $DB_USER -d $DB_NAME << 'EOF'
-- Users table
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
);

-- Drivers table
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
);

-- Rides table
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
);

-- Payments table
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
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ride_id, user_id)
);

-- Location tracking table
CREATE TABLE IF NOT EXISTS location_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rides_rider_id ON rides(rider_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_drivers_is_online ON drivers(is_online);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_location_tracking_ride_id ON location_tracking(ride_id);
CREATE INDEX IF NOT EXISTS idx_location_tracking_user_id ON location_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_target_user_id ON reviews(target_user_id);

-- Insert admin user
INSERT INTO users (name, email, phone, password_hash, role) 
VALUES ('Admin User', 'admin@swiftride.com', '+1234567890', '$2b$12$Ep1rHdKO3nA0', 'rider');

-- Insert test driver
INSERT INTO users (name, email, phone, password_hash, role) 
VALUES ('Test Driver', 'driver@swiftride.com', '+1234567890', '$2b$12$Ep1rHdKO3nA0', 'driver');

-- Insert test rider
INSERT INTO users (name, email, phone, password_hash, role) 
VALUES ('Test Rider', 'rider@swiftride.com', '+1234567890', '$2b$12$Ep1rHdKO3nA0', 'rider');

-- Add driver record
INSERT INTO drivers (id, vehicle_type, vehicle_number, license_number, is_online, earnings, total_rides)
SELECT id FROM users WHERE email = 'driver@swiftride.com', 'sedan', 'TEST-DRI123', 'LIC123456789', true, 0.00, 0;

EOF

echo "Database schema created successfully!"
EOF

chmod +x migration.sh
./migration.sh
```

## Post-Deployment Checklist

- [ ] Database properly configured and populated
- [ ] SSL certificate installed and valid
- [ ] Nginx configured and proxying correctly
- [ ] Firewall rules in place
- [ ] Application running with PM2
- [ ] All environment variables set
- [ ] Log rotation configured
- [ ] Health checks passing
- [ ] SSL certificate renewed
- [ ] Monitoring and alerts configured

## Troubleshooting

### Common Issues and Solutions

1. **Port Already in Use**
```bash
# Find and kill process
sudo lsof -i :7005
sudo kill -9 PID
```

2. **Database Connection Failed**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U swiftride -d swiftride_ridesharing -c "SELECT 1;"

# Reset password if needed
sudo -u postgres psql -c "ALTER USER swiftride PASSWORD 'newpassword';"
```

3. **SSL Certificate Issues**
```bash
# Check certificate status
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal -d yourdomain.com
```

4. **Nginx Configuration Errors**
```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check logs
sudo journalctl -u nginx -f
```

5. **Application Not Starting**
```bash
# Check PM2 status
pm2 status swiftride-backend

# View logs
pm2 logs swiftride-backend

# Restart application
pm2 restart swiftride-backend
```

## Monitoring Commands

```bash
# System status
sudo systemctl status nginx postgresql redis-server pm2

# Application status
pm2 status
pm2 logs swiftride-backend --lines 100

# Resource usage
htop
df -h
free -h

# Network connections
netstat -tlnp | grep -E ':(7005|7000|443|80)'
```

## Performance Optimization

### Database Optimization
```sql
-- PostgreSQL configuration
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET shared_preload_libraries = 'pg_trgm';

-- Connection pooling in application
max_connections = 20;
shared_buffers = 256MB;
effective_cache_size = 1GB;
```

### Application Scaling
```bash
# PM2 cluster mode
pm2 start ecosystem.config.js

# CPU optimization
pm2 start ecosystem.config.js --node-args="--max-old-space-size=1024"
```

This deployment guide provides everything needed to run SwiftRide in a production environment with proper security, monitoring, and scaling capabilities.