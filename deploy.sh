#!/bin/bash

# Morgus Platform Deployment Script
# This script automates the deployment process for both backend and frontend

set -e  # Exit on error

echo "🚀 Morgus Platform Deployment Script"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if required tools are installed
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    if ! command -v fly &> /dev/null; then
        print_error "Fly CLI not found. Please install it first."
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Please install it first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm not found. Please install it first."
        exit 1
    fi
    
    print_success "All prerequisites met"
}

# Deploy backend to Fly.io
deploy_backend() {
    print_info "Deploying backend to Fly.io..."
    
    cd dppm-service
    
    # Check if fly.toml exists
    if [ ! -f "fly.toml" ]; then
        print_error "fly.toml not found in dppm-service directory"
        exit 1
    fi
    
    # Deploy to Fly.io
    if fly deploy; then
        print_success "Backend deployed successfully"
    else
        print_error "Backend deployment failed"
        exit 1
    fi
    
    cd ..
}

# Build and deploy frontend
deploy_frontend() {
    print_info "Building frontend..."
    
    cd console
    
    # Install dependencies
    print_info "Installing dependencies..."
    npm install
    
    # Build the project
    print_info "Building project..."
    if npx vite build; then
        print_success "Frontend built successfully"
    else
        print_error "Frontend build failed"
        exit 1
    fi
    
    # Deploy to Cloudflare Pages (if wrangler is available)
    if command -v wrangler &> /dev/null; then
        print_info "Deploying to Cloudflare Pages..."
        if wrangler pages deploy dist --project-name=morgus-console; then
            print_success "Frontend deployed successfully"
        else
            print_error "Frontend deployment failed"
            exit 1
        fi
    else
        print_info "Wrangler not found. Please deploy manually via Cloudflare dashboard."
        print_info "Build output is in: console/dist"
    fi
    
    cd ..
}

# Verify deployment
verify_deployment() {
    print_info "Verifying deployment..."
    
    # Check backend health
    print_info "Checking backend health..."
    if curl -f https://morgus-deploy.fly.dev/health > /dev/null 2>&1; then
        print_success "Backend is healthy"
    else
        print_error "Backend health check failed"
    fi
    
    print_success "Deployment verification complete"
}

# Main deployment flow
main() {
    echo ""
    print_info "Starting deployment process..."
    echo ""
    
    check_prerequisites
    echo ""
    
    # Ask what to deploy
    echo "What would you like to deploy?"
    echo "1) Backend only"
    echo "2) Frontend only"
    echo "3) Both backend and frontend"
    read -p "Enter your choice (1-3): " choice
    
    case $choice in
        1)
            deploy_backend
            ;;
        2)
            deploy_frontend
            ;;
        3)
            deploy_backend
            echo ""
            deploy_frontend
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
    
    echo ""
    verify_deployment
    echo ""
    print_success "🎉 Deployment complete!"
    echo ""
    print_info "Backend URL: https://morgus-deploy.fly.dev"
    print_info "Frontend URL: Check Cloudflare Pages dashboard"
    echo ""
}

# Run main function
main
