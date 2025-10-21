# Deployment Guide

This guide covers deploying PixSwap to various platforms and environments.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Cloud Platforms](#cloud-platforms)
- [Production Checklist](#production-checklist)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- Docker and Docker Compose (20.10+)
- Node.js (18+)
- MongoDB (6+)
- Git

### Required Accounts
- **Cloudinary**: For media storage
- **MongoDB Atlas** (optional): For managed database
- **GitHub**: For CI/CD and container registry
- **Domain provider**: For custom domain

## Local Development

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/pixswap.git
cd pixswap
```

### 2. Environment Setup
```bash
# Copy environment variables
cp .env.example .env

# Edit with your credentials
nano .env
```

### 3. Install Dependencies
```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 4. Start Development Servers

#### Option A: Docker Compose (Recommended)
```bash
# Start MongoDB and Redis
docker-compose -f docker-compose.dev.yml up -d

# Start backend (Terminal 1)
cd server && npm run dev

# Start frontend (Terminal 2)
cd client && npm run dev
```

#### Option B: Manual Setup
```bash
# Start MongoDB
mongod --dbpath /path/to/data

# Start Redis (optional)
redis-server

# Start backend
cd server && npm run dev

# Start frontend
cd client && npm run dev
```

### 5. Verify Setup
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/health
- MongoDB: mongodb://localhost:27017

## Docker Deployment

### Development Environment

**docker-compose.dev.yml**
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down

# Rebuild after code changes
docker-compose -f docker-compose.dev.yml up -d --build
```

### Production Environment

**docker-compose.yml**
```bash
# Build and start production services
docker-compose up -d --build

# Scale backend servers
docker-compose up -d --scale server=3

# View logs
docker-compose logs -f server

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Docker Commands

```bash
# Build specific service
docker-compose build server

# Run commands in container
docker-compose exec server npm run type-check

# Access container shell
docker-compose exec server sh

# View resource usage
docker stats

# Clean up unused resources
docker system prune -a
```

## Cloud Platforms

### AWS Deployment

#### EC2 Deployment

**1. Launch EC2 Instance**
```bash
# Amazon Linux 2 or Ubuntu 20.04 LTS
# t3.medium or larger recommended
```

**2. Install Dependencies**
```bash
# Update system
sudo yum update -y  # Amazon Linux
sudo apt update && sudo apt upgrade -y  # Ubuntu

# Install Docker
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

**3. Deploy Application**
```bash
# Clone repository
git clone https://github.com/yourusername/pixswap.git
cd pixswap

# Set up environment
cp .env.example .env
nano .env  # Edit with production values

# Start services
docker-compose up -d --build
```

**4. Configure Security Groups**
- HTTP (80): 0.0.0.0/0
- HTTPS (443): 0.0.0.0/0
- SSH (22): Your IP only
- MongoDB (27017): Internal only

#### ECS Deployment

**1. Create ECR Repositories**
```bash
aws ecr create-repository --repository-name pixswap-server
aws ecr create-repository --repository-name pixswap-client
```

**2. Build and Push Images**
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push server
cd server
docker build -t pixswap-server .
docker tag pixswap-server:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/pixswap-server:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/pixswap-server:latest

# Build and push client
cd ../client
docker build -t pixswap-client .
docker tag pixswap-client:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/pixswap-client:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/pixswap-client:latest
```

**3. Create ECS Task Definition**
- Use Fargate launch type
- Configure environment variables
- Set up load balancer
- Configure auto-scaling

### Heroku Deployment

**1. Create Heroku Apps**
```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create apps
heroku create pixswap-api
heroku create pixswap-web
```

**2. Deploy Backend**
```bash
cd server

# Set environment variables
heroku config:set NODE_ENV=production --app pixswap-api
heroku config:set MONGODB_URI=<your-mongodb-uri> --app pixswap-api
heroku config:set JWT_SECRET=<your-jwt-secret> --app pixswap-api

# Deploy
git subtree push --prefix server heroku main
```

**3. Deploy Frontend**
```bash
cd client

# Set environment variables
heroku config:set VITE_API_URL=https://pixswap-api.herokuapp.com/api --app pixswap-web

# Deploy
git subtree push --prefix client heroku main
```

### DigitalOcean Deployment

**1. Create Droplet**
- Ubuntu 20.04 LTS
- 2GB RAM minimum
- Enable backups

**2. Initial Server Setup**
```bash
# SSH into droplet
ssh root@your-droplet-ip

# Create non-root user
adduser pixswap
usermod -aG sudo pixswap
su - pixswap

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker pixswap
```

**3. Deploy Application**
```bash
# Clone and deploy
git clone https://github.com/yourusername/pixswap.git
cd pixswap
cp .env.example .env
nano .env  # Configure production values
docker-compose up -d --build
```

**4. Set Up nginx**
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/pixswap
```

nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/pixswap /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Vercel (Frontend Only)

**1. Install Vercel CLI**
```bash
npm i -g vercel
```

**2. Deploy Frontend**
```bash
cd client
vercel --prod
```

**3. Configure Environment**
```bash
vercel env add VITE_API_URL production
vercel env add VITE_SOCKET_URL production
```

### Railway

**1. Create Railway Project**
- Visit railway.app
- Connect GitHub repository

**2. Deploy Services**
- Add MongoDB service
- Add Redis service
- Add server service (from /server)
- Add client service (from /client)

**3. Configure Environment Variables**
Set environment variables in Railway dashboard for each service.

## Production Checklist

### Security
- [ ] Change all default passwords
- [ ] Use strong JWT secret (32+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS for production domain only
- [ ] Set up firewall rules
- [ ] Enable MongoDB authentication
- [ ] Use environment variables for secrets
- [ ] Implement rate limiting
- [ ] Set up security headers (Helmet)
- [ ] Disable debug mode

### Performance
- [ ] Enable CDN for static assets
- [ ] Configure caching headers
- [ ] Optimize images in Cloudinary
- [ ] Enable gzip compression
- [ ] Set up database indexes
- [ ] Configure connection pooling
- [ ] Enable Redis for sessions (if scaling)

### Monitoring
- [ ] Set up health check endpoints
- [ ] Configure logging (Winston/Bunyan)
- [ ] Set up error tracking (Sentry)
- [ ] Monitor server metrics
- [ ] Set up uptime monitoring
- [ ] Configure alerts
- [ ] Enable database backups

### Deployment
- [ ] Test all endpoints
- [ ] Run production build locally
- [ ] Verify environment variables
- [ ] Set up CI/CD pipeline
- [ ] Configure auto-deployment
- [ ] Set up staging environment
- [ ] Document rollback procedure

## SSL/HTTPS Setup

### Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Cloudflare SSL

1. Add domain to Cloudflare
2. Update nameservers
3. Enable "Full (strict)" SSL mode
4. Enable "Always Use HTTPS"

## Database Setup

### MongoDB Atlas

**1. Create Cluster**
- Visit cloud.mongodb.com
- Create free M0 cluster
- Select region close to your app

**2. Configure Access**
- Add IP whitelist (0.0.0.0/0 for development)
- Create database user

**3. Get Connection String**
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/pixswap?retryWrites=true&w=majority
```

**4. Update Environment**
```bash
MONGODB_URI=mongodb+srv://...
```

### Self-Hosted MongoDB

**Docker Setup:**
```yaml
mongodb:
  image: mongo:6
  restart: always
  environment:
    MONGO_INITDB_ROOT_USERNAME: admin
    MONGO_INITDB_ROOT_PASSWORD: secure_password
  volumes:
    - mongodb_data:/data/db
  ports:
    - "27017:27017"
```

## Monitoring

### Health Checks

```bash
# Backend health
curl https://your-domain.com/health

# Expected response
{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}

# Database connectivity
curl https://your-domain.com/health/db
```

### Logging

**Production Logging:**
```javascript
// server/src/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Monitoring Tools

- **Uptime**: UptimeRobot, Pingdom
- **APM**: New Relic, DataDog
- **Errors**: Sentry
- **Logs**: Papertrail, Loggly

## Troubleshooting

### Common Issues

**1. Port Already in Use**
```bash
# Find process using port
lsof -i :3000
kill -9 <PID>
```

**2. MongoDB Connection Failed**
```bash
# Check MongoDB status
docker-compose ps mongodb

# View logs
docker-compose logs mongodb

# Verify connection string
echo $MONGODB_URI
```

**3. CORS Errors**
```javascript
// server/src/index.ts
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
```

**4. Socket.IO Connection Issues**
```javascript
// Enable transports
const socket = io({
  transports: ['websocket', 'polling']
});
```

**5. Build Failures**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node version
node -v  # Should be 18+
```

### Log Analysis

```bash
# Docker logs
docker-compose logs -f server
docker-compose logs -f mongodb

# Application logs
tail -f server/logs/error.log

# System logs
journalctl -u docker -f
```

## Backup and Recovery

### Database Backup

```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T mongodb mongodump --archive > backup_$DATE.archive

# Upload to S3
aws s3 cp backup_$DATE.archive s3://your-bucket/backups/
```

### Restore Database

```bash
# From archive
docker-compose exec -T mongodb mongorestore --archive < backup_20240101_120000.archive
```

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.yml
services:
  server:
    deploy:
      replicas: 3
    
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

### Load Balancing

nginx configuration for load balancing:
```nginx
upstream backend {
    least_conn;
    server server_1:3000;
    server server_2:3000;
    server server_3:3000;
}

server {
    location /api {
        proxy_pass http://backend;
    }
}
```

## Support

For deployment issues:
- GitHub Issues: https://github.com/yourusername/pixswap/issues
- Documentation: https://docs.pixswap.com
- Email: support@pixswap.com

---

**Last Updated**: January 2024