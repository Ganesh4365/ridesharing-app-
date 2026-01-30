#!/bin/bash

# SwiftRide Installation Script
echo "🚗 Welcome to SwiftRide Installation!"
echo "This script will set up your development environment..."

# Check prerequisites
check_prerequisites() {
    echo "🔍 Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js 16+ first."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is not installed."
        exit 1
    fi
    
    # Check Expo CLI
    if ! command -v expo &> /dev/null; then
        echo "📦 Installing Expo CLI..."
        npm install -g @expo/cli
    fi
    
    echo "✅ Prerequisites check completed!"
}

# Install frontend dependencies
install_frontend() {
    echo "📱 Installing frontend dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        echo "✅ Frontend dependencies installed successfully!"
    else
        echo "❌ Failed to install frontend dependencies."
        exit 1
    fi
}

# Install backend dependencies
install_backend() {
    echo "🔧 Installing backend dependencies..."
    cd backend
    npm install
    if [ $? -eq 0 ]; then
        echo "✅ Backend dependencies installed successfully!"
    else
        echo "❌ Failed to install backend dependencies."
        exit 1
    fi
    cd ..
}

# Setup environment files
setup_env() {
    echo "⚙️ Setting up environment files..."
    
    # Backend environment
    if [ ! -f backend/.env ]; then
        cp backend/.env.example backend/.env
        echo "📝 Created backend/.env - please update with your configuration"
    fi
    
    echo "✅ Environment files setup completed!"
}

# Setup database (PostgreSQL)
setup_database() {
    echo "🗄️ Setting up database..."
    echo "Please ensure PostgreSQL is running and you have created a database named 'swiftride'"
    echo "You can create it with: createdb swiftride"
    
    read -p "Have you created the database? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Please create the database and run this script again."
        exit 1
    fi
    
    echo "✅ Database setup instructions provided!"
}

# Setup Redis
setup_redis() {
    echo "🔴 Setting up Redis..."
    echo "Please ensure Redis is running on localhost:6379"
    echo "You can start it with: redis-server"
    
    echo "✅ Redis setup instructions provided!"
}

# Start development servers
start_dev() {
    echo "🚀 Starting development servers..."
    
    # Start backend in background
    echo "Starting backend server..."
    cd backend && npm start &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    sleep 5
    
    # Start frontend
    echo "Starting frontend app..."
    expo start &
    FRONTEND_PID=$!
    
    echo "🎉 SwiftRide is now running!"
    echo "📱 Frontend: http://localhost:19006"
    echo "🔧 Backend: http://localhost:3000"
    echo "📚 API Docs: http://localhost:3000/api"
    
    echo "Press Ctrl+C to stop all servers"
    
    # Trap Ctrl+C to kill background processes
    trap 'echo "Stopping servers..."; kill $BACKEND_PID $FRONTEND_PID; exit' INT
    
    # Wait for background processes
    wait
}

# Main installation flow
main() {
    check_prerequisites
    install_frontend
    install_backend
    setup_env
    setup_database
    setup_redis
    
    echo ""
    echo "🎊 Installation completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Update backend/.env with your database credentials"
    echo "2. Update GOOGLE_MAPS_API_KEY in src/constants/index.ts"
    echo "3. Ensure PostgreSQL and Redis are running"
    echo "4. Run: npm run dev"
    echo ""
    
    read -p "Would you like to start the development servers now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_dev
    fi
}

# Run main function
main