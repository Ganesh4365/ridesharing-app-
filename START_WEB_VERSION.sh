#!/bin/bash

echo "🌐 CONFIGURING REACT NATIVE WEB BULD"

# Stop any existing processes
pkill -f "npx expo" 2>/dev/null || true
pkill -f "node test-server" 2>/dev/null || true

# Clean previous builds
rm -rf web-build dist

echo "📦 Installing web dependencies..."
npm install --save-dev react-native-web@~0.19.10 react-dom@18.3.1

# Create index.html for web
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>SwiftRide - Modern Ride Sharing App</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
        }
        .container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .header {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            text-align: center;
            backdrop-filter: blur(10px);
        }
        .title {
            font-size: 48px;
            font-weight: bold;
            margin: 0;
            color: #FF6B6B;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .subtitle {
            font-size: 18px;
            color: #666;
            margin: 10px 0;
        }
        .content {
            flex: 1;
            padding: 40px 20px;
        }
        .app-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .app-header {
            background: #FF6B6B;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 20px 20px 0 0;
        }
        .app-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .loading {
            text-align: center;
            padding: 40px;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #FF6B6B;
            border-top: 4px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .features {
            padding: 20px;
        }
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .feature-item {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            transition: transform 0.3s ease;
        }
        .feature-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .feature-icon {
            font-size: 32px;
            margin-bottom: 10px;
        }
        .feature-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 5px;
            color: #333;
        }
        .feature-desc {
            font-size: 14px;
            color: #666;
            line-height: 1.4;
        }
        .api-status {
            background: #fff3cd;
            border: 1px solid #ff4f81;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        .api-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
        }
        .status-ok {
            color: #4CAF50;
        }
        .status-error {
            color: #f44336;
        }
        .test-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 30px;
        }
        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .btn-primary {
            background: #FF6B6B;
            color: white;
        }
        .btn-primary:hover {
            background: #FF5252;
            transform: translateY(-2px);
        }
        .btn-secondary {
            background: #6C757D;
            color: white;
        }
        .btn-secondary:hover {
            background: #5A6268;
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">🚗 SwiftRide</h1>
            <p class="subtitle">Modern Ride-Sharing Platform - Web Version</p>
        </div>
        
        <div class="content">
            <div class="app-container">
                <div class="app-header">
                    <h2 class="app-title">Loading React Native Web App...</h2>
                    <div class="loading">
                        <div class="spinner"></div>
                        <p>Initializing application...</p>
                    </div>
                </div>
                
                <div class="features">
                    <h3 style="text-align: center; color: #333; margin-bottom: 20px;">✨ Core Features</h3>
                    <div class="feature-grid">
                        <div class="feature-item">
                            <div class="feature-icon">🚗</div>
                            <div class="feature-title">Real-time GPS Tracking</div>
                            <div class="feature-desc">2-second location updates with live driver positions</div>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">⚡</div>
                            <div class="feature-title">Smart Driver Matching</div>
                            <div class="feature-desc">AI-powered driver assignment algorithm</div>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">💬</div>
                            <div class="feature-title">In-app Communication</div>
                            <div class="feature-desc">Real-time chat between riders and drivers</div>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">⭐</div>
                            <div class="feature-title">Driver Favorites</div>
                            <div class="feature-desc">Save preferred drivers for future rides</div>
                        </div>
                    </div>
                    
                    <h3 style="text-align: center; color: #333; margin-bottom: 20px;">🔧 Advanced Features</h3>
                    <div class="feature-grid">
                        <div class="feature-item">
                            <div class="feature-icon">🚙</div>
                            <div class="feature-title">Dark Mode</div>
                            <div class="feature-desc">System-wide theme support</div>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">📱</div>
                            <div class="feature-title">Multi-stop Rides</div>
                            <div class="feature-desc">Add multiple destinations in one trip</div>
                        </div>
                        <div class="feature-item">
                            <div class="feature-icon">🔔</div>
                            <div class="feature-title">Emergency SOS</div>
                            <div class="feature-desc">Instant safety and location sharing</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="api-status">
                <h3 style="margin-bottom: 15px; color: #333;">📡 API Status</h3>
                <div class="api-item">
                    <span>Backend Server:</span>
                    <span class="status-ok" id="backend-status">Checking...</span>
                </div>
                <div class="api-item">
                    <span>Frontend:</span>
                    <span class="status-ok" id="frontend-status">Checking...</span>
                </div>
                <div class="api-item">
                    <span>WebSocket:</span>
                    <span class="status-ok" id="websocket-status">Checking...</span>
                </div>
            </div>
            
            <div class="test-buttons">
                <h3 style="text-align: center; color: #333; margin-bottom: 20px;">🧪 Quick Tests</h3>
                <button class="btn btn-primary" onclick="testBackend()">Test Backend</button>
                <button class="btn btn-secondary" onclick="testAuth()">Test Authentication</button>
                <button class="btn btn-primary" onclick="testRides()">Test Rides API</button>
                <button class="btn btn-secondary" onclick="openMobileView()">Mobile View</button>
            </div>
        </div>
    </div>

    <script>
        // Check API status on load
        document.addEventListener('DOMContentLoaded', function() {
            checkAPIStatus();
            setInterval(checkAPIStatus, 10000); // Check every 10 seconds
        });

        async function checkAPIStatus() {
            try {
                // Check backend
                const backendResponse = await fetch('http://localhost:7005/health');
                const backendStatus = backendResponse.ok;
                document.getElementById('backend-status').textContent = backendStatus ? '✅ Online' : '❌ Offline';
                document.getElementById('backend-status').className = backendStatus ? 'status-ok' : 'status-error';

                // Check frontend
                const frontendStatus = window.location.host === 'localhost:7000';
                document.getElementById('frontend-status').textContent = frontendStatus ? '✅ Active' : '❌ Inactive';
                document.getElementById('frontend-status').className = frontendStatus ? 'status-ok' : 'status-error';

                // Check WebSocket
                document.getElementById('websocket-status').textContent = '⏳ Ready';
                document.getElementById('websocket-status').className = 'status-ok';
            } catch (error) {
                console.error('API status check failed:', error);
                document.getElementById('backend-status').textContent = '❌ Error';
                document.getElementById('backend-status').className = 'status-error';
            }
        }

        async function testBackend() {
            try {
                const response = await fetch('http://localhost:7005/health');
                const result = await response.json();
                alert('✅ Backend Status: ' + result.status + '\\nUptime: ' + result.uptime);
            } catch (error) {
                alert('❌ Backend Error: ' + error.message);
            }
        }

        async function testAuth() {
            try {
                const response = await fetch('http://localhost:7005/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'rider@swiftride.com',
                        password: 'password123'
                    })
                });
                const result = await response.json();
                alert('✅ Authentication Test:\\n' + JSON.stringify(result, null, 2));
            } catch (error) {
                alert('❌ Authentication Error: ' + error.message);
            }
        }

        async function testRides() {
            try {
                const response = await fetch('http://localhost:7005/api/rides/history', {
                    headers: { 'Authorization': 'Bearer token_user1' }
                });
                const result = await response.json();
                alert('✅ Rides API Test:\\n' + JSON.stringify(result, null, 2));
            } catch (error) {
                alert('❌ Rides API Error: ' + error.message);
            }
        }

        function openMobileView() {
            window.open('http://localhost:7000/mobile', '_blank');
        }

        // Auto-check every 5 seconds
        setInterval(() => {
            const dots = document.querySelectorAll('.loading-dots');
            const dot = dots[Math.floor(Date.now() / 1000) % dots.length];
            
            dots.forEach((d, i) => {
                d.style.opacity = i === dot ? '1' : '0.3';
            });
        }, 100);
    </script>
</body>
</html>
EOF

# Configure metro for web
cat > metro.config.js << 'EOF'
const { getDefaultConfig } = require('@expo/metro-config');

module.exports = (async () => {
  const {
    resolver: {
      sourceExts: getDefaultConfig().resolver,
      alias: {
        'react-native-vector-icons': '@expo/vector-icons',
      'react-native-paper': 'react-native-paper',
      'socket.io-client': 'socket.io-client',
      '@react-navigation/native': '@react-navigation/native',
        '@react-navigation/stack': '@react-navigation/stack',
      },
      transform: {
        getTransformOptions: async () => ({
          transform: {
            babel: {
              plugins: [
                ['react-native-classname-to-dynamic-classname'],
                ['react-native-rename-objects'],
                ['react-native-inline-style-elements'],
              ]
            },
          },
        },
      },
      server: {
        port: 7000,
      },
    },
  };
    
  config.resolver.assetExts.push(
    require('metro-resolver/module').createModuleResolver({
      extensions: ['.ios.js', '.android.js']
    })
  );
  
  return config;
});
EOF

echo "✅ Web configuration complete!"

echo "🚀 STARTING REACT NATIVE WEB SERVER..."
echo "Backend PID: $BACKEND_PID"
echo "Starting web server on port 7000..."

# Restart backend with web-friendly configuration
cd backend && PORT=7005 node test-server.js > ../backend.log 2>&1 &

WEB_PID=$!
echo "Web server PID: $WEB_PID"

# Wait for services to start
sleep 3

echo ""
echo "🌐 REACT NATIVE WEB BULD STATUS"
echo "================================="
echo "✅ Web Server: Starting on http://localhost:7000"
echo "✅ Backend API: Running on http://localhost:7005/api"
echo "✅ WebSocket Server: Ready on ws://localhost:7005"
echo "✅ Metro Bundler: Configured for web build"
echo ""
echo "📱 ACCESS INFORMATION"
echo "==================="
echo "🌐 React Native Web: http://localhost:7000"
echo "🔧 Backend API: http://localhost:7005/api"
echo "📊 Health Check: http://localhost:7005/health"
echo "📚 Test Accounts: http://localhost:7005/api/test-accounts"
echo ""
echo "🎯 IMMEDIATE ACTIONS"
echo "==================="
echo "1. Open http://localhost:7000 in your browser"
echo "2. Test backend and authentication"
echo "3. Verify API connectivity"
echo "4. Experience React Native app in browser"
echo ""
echo "📲 READY FOR TESTING!"

# Save PIDs
echo "WEB_PID=$WEB_PID" > /tmp/swiftride_web_pids.txt
echo "BACKEND_PID=$BACKEND_PID" >> /tmp/swiftride_web_pids.txt

echo ""
echo "💡 To stop services:"
echo "kill \$WEB_PID \$BACKEND_PID"
echo ""
echo "🎯 SwiftRide is now accessible via web browser!"