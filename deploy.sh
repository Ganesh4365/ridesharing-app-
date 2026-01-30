#!/bin/bash

# SwiftRide Production Deployment Script
echo "🚀 SwiftRide Production Deployment"
echo "================================="

# Configuration
APP_NAME="swiftride"
SERVER_USER="deploy"
SERVER_IP="your-server-ip"
PROJECT_DIR="/var/www/swiftride"
BACKUP_DIR="/var/backups/swiftride"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_info() {
    echo -e "ℹ️ $1"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run from project root."
        exit 1
    fi
    
    # Check if production build exists
    if [ ! -d "dist" ]; then
        print_warning "dist directory not found. Building production version..."
        npm run build
    fi
    
    print_success "Prerequisites check completed"
}

# Backup current deployment
backup_deployment() {
    print_info "Creating backup of current deployment..."
    
    if [ -d "$PROJECT_DIR" ]; then
        ssh $SERVER_USER@$SERVER_IP "sudo mkdir -p $BACKUP_DIR && sudo cp -r $PROJECT_DIR $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S)"
        print_success "Backup created successfully"
    else
        print_warning "No existing deployment found"
    fi
}

# Deploy backend
deploy_backend() {
    print_info "Deploying backend..."
    
    # Create necessary directories
    ssh $SERVER_USER@$SERVER_IP "sudo mkdir -p $PROJECT_DIR/backend"
    
    # Copy backend files
    scp -r backend/ $SERVER_USER@$SERVER_IP:$PROJECT_DIR/
    
    # Install backend dependencies
    ssh $SERVER_USER@$SERVER_IP "cd $PROJECT_DIR/backend && npm ci --production"
    
    # Setup PM2 configuration
    ssh $SERVER_USER@$SERVER_IP "cd $PROJECT_DIR/backend && pm2 start ecosystem.config.js --env production"
    
    print_success "Backend deployed successfully"
}

# Deploy frontend
deploy_frontend() {
    print_info "Deploying frontend..."
    
    # Build for production
    npm run build:web
    
    # Copy frontend build files
    ssh $SERVER_USER@$SERVER_IP "sudo mkdir -p $PROJECT_DIR/frontend"
    scp -r dist/ $SERVER_USER@$SERVER_IP:$PROJECT_DIR/frontend/
    
    # Setup nginx configuration
    scp config/nginx.conf $SERVER_USER@$SERVER_IP:/tmp/swiftride-nginx.conf
    ssh $SERVER_USER@$SERVER_IP "sudo mv /tmp/swiftride-nginx.conf /etc/nginx/sites-available/swiftride"
    ssh $SERVER_USER@$SERVER_IP "sudo ln -sf /etc/nginx/sites-available/swiftride /etc/nginx/sites-enabled/"
    ssh $SERVER_USER@$SERVER_IP "sudo nginx -t && sudo systemctl reload nginx"
    
    print_success "Frontend deployed successfully"
}

# Setup SSL certificates
setup_ssl() {
    print_info "Setting up SSL certificates..."
    
    ssh $SERVER_USER@$SERVER_IP "sudo certbot --nginx -d yourdomain.com --non-interactive --agree-tos --email admin@yourdomain.com"
    
    print_success "SSL certificates configured"
}

# Configure database
setup_database() {
    print_info "Configuring database..."
    
    # Run database migrations
    ssh $SERVER_USER@$SERVER_IP "cd $PROJECT_DIR/backend && npm run migrate"
    
    print_success "Database configured successfully"
}

# Health check
health_check() {
    print_info "Performing health checks..."
    
    # Check backend
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        print_success "Backend health check passed"
    else
        print_error "Backend health check failed"
        return 1
    fi
    
    # Check frontend
    if curl -f https://yourdomain.com > /dev/null 2>&1; then
        print_success "Frontend health check passed"
    else
        print_error "Frontend health check failed"
        return 1
    fi
    
    print_success "All health checks passed"
}

# Setup monitoring
setup_monitoring() {
    print_info "Setting up monitoring..."
    
    # Setup log rotation
    ssh $SERVER_USER@$SERVER_IP "sudo tee /etc/logrotate.d/swiftride << 'EOF'
$PROJECT_DIR/backend/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $SERVER_USER $SERVER_USER
    postrotate
        pm2 reload all
    endscript
}
EOF"
    
    print_success "Monitoring configured"
}

# Main deployment flow
main() {
    echo "Starting production deployment..."
    echo "Server: $SERVER_IP"
    echo "Project: $PROJECT_DIR"
    echo ""
    
    check_prerequisites
    backup_deployment
    deploy_backend
    deploy_frontend
    setup_database
    setup_ssl
    setup_monitoring
    health_check
    
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "Your SwiftRide app is now live at:"
    echo "🌐 https://yourdomain.com"
    echo "📚 API Documentation: https://yourdomain.com/api"
    echo ""
    echo "Next steps:"
    echo "1. Update yourdomain.com in this script"
    echo "2. Configure your domain DNS"
    echo "3. Update environment variables with production values"
    echo "4. Test all functionality"
}

# Execute deployment
main "$@"