# 📸 PixSwap

**A privacy-first creative media sharing platform**

PixSwap is a full-stack social media application that lets users easily share, chat, and interact with short-lived photos and videos in a fun and safe way. Built with modern technologies and privacy-first principles.

[![CI/CD Pipeline](https://github.com/yourusername/pixswap/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/yourusername/pixswap/actions/workflows/ci-cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](https://www.typescriptlang.org/)

## 🌟 Features

### Core Features
- **🔐 User Authentication**: Secure JWT-based auth with signup/login
- **📱 Responsive Design**: Mobile-first UI with TailwindCSS
- **🖼️ Media Upload**: Photo and video sharing with metadata
- **🔄 Random Swap**: Photo roulette system for random exchanges
- **💬 Real-time Chat**: Socket.IO powered messaging system
- **📰 Social Feed**: Public feed with likes, comments, and interactions
- **⏰ Disappearing Content**: Automatic content expiration
- **🛡️ Privacy & Safety**: Built-in moderation and reporting system

### Technical Features
- **🏗️ Full-Stack TypeScript**: Type-safe development across frontend and backend
- **🚀 Modern Stack**: React 18, Node.js, MongoDB, Socket.IO
- **🐳 Docker Ready**: Complete containerization with Docker Compose
- **🔄 CI/CD Pipeline**: Automated testing and deployment with GitHub Actions
- **📊 Monitoring**: Health checks and error handling
- **🔒 Security**: Helmet, CORS, rate limiting, and input validation

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   React Client  │◄──►│  Express Server │◄──►│    MongoDB      │
│   (Port 5173)   │    │   (Port 3000)   │    │   (Port 27017)  │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │                 │              │
         └──────────────►│   Socket.IO     │◄─────────────┘
                        │  (WebSocket)    │
                        │                 │
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │                 │
                        │     Redis       │
                        │   (Port 6379)   │
                        │                 │
                        └─────────────────┘
```

## 🧱 Tech Stack

### Frontend
- **React 18+** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **React Router** for navigation
- **Zustand** for state management
- **React Hook Form** with Zod validation
- **Socket.IO Client** for real-time features
- **Axios** for API communication

### Backend
- **Node.js** with Express and TypeScript
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **JWT** authentication with bcrypt
- **Cloudinary** for media storage
- **Redis** for Socket.IO scaling (optional)
- **Helmet, CORS, Rate Limiting** for security

### DevOps & Tools
- **Docker & Docker Compose** for containerization
- **GitHub Actions** for CI/CD
- **ESLint & Prettier** for code quality
- **Jest** for testing
- **TypeScript** strict mode

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (for local development)
- Vercel account (for frontend deployment)
- Railway account (for backend deployment)

### 1. Clone the Repository
```bash
git clone https://github.com/rbradshaw9/pixswap.git
cd pixswap
```

### 2. Environment Setup
```bash
# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 3. Local Development (Recommended)
```bash
# Start development databases
docker-compose -f docker-compose.dev.yml up -d

# Install dependencies
cd server && npm install
cd ../client && npm install

# Start development servers
cd ../server && npm run dev    # Terminal 1
cd ../client && npm run dev    # Terminal 2
```

### 4. Deploy to Production

**Backend → Railway:**
1. Push code to GitHub
2. Connect Railway to your repository
3. Add MongoDB + Redis services
4. Configure environment variables
5. Deploy automatically on push

**Frontend → Vercel:**
```bash
cd client
vercel --prod
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 🛠️ Development

### Project Structure
```
pixswap/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route components
│   │   ├── stores/         # Zustand state management
│   │   ├── services/       # API service layer
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── Dockerfile
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── services/       # Business logic
│   │   ├── socket/         # Socket.IO handlers
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript interfaces
│   └── Dockerfile
├── docs/                   # Documentation
├── .github/                # GitHub Actions workflows
├── docker-compose.yml      # Production Docker setup
└── docker-compose.dev.yml  # Development Docker setup
```

### Available Scripts

#### Server (cd server)
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run type-check   # TypeScript type checking
```

#### Client (cd client)
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Environment Variables

#### Server (.env)
```bash
# Server Configuration
NODE_ENV=development
PORT=3000
API_BASE_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/pixswap

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Frontend
CLIENT_URL=http://localhost:5173
```

#### Client (.env)
```bash
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

## 📡 API Documentation

### Authentication Endpoints
```
POST /api/auth/signup      # Create new account
POST /api/auth/login       # User login
POST /api/auth/logout      # User logout
GET  /api/auth/me          # Get current user
```

### User Endpoints
```
GET    /api/users/profile/:id    # Get user profile
PUT    /api/users/profile        # Update profile
GET    /api/users/search         # Search users
POST   /api/users/block/:id      # Block user
DELETE /api/users/block/:id      # Unblock user
```

### Media Endpoints
```
POST   /api/media/upload         # Upload media
GET    /api/media/:id            # Get media
DELETE /api/media/:id            # Delete media
POST   /api/media/:id/like       # Like media
DELETE /api/media/:id/like       # Unlike media
POST   /api/media/:id/comment    # Add comment
```

### Feed Endpoints
```
GET /api/feed                    # Get public feed
GET /api/feed/trending           # Get trending content
GET /api/feed/search             # Search content
```

### Chat Endpoints
```
GET  /api/chat/rooms             # Get chat rooms
POST /api/chat/rooms             # Create chat room
GET  /api/chat/rooms/:id/messages # Get messages
POST /api/chat/rooms/:id/messages # Send message
```

### Swap Endpoints
```
POST /api/swap/join              # Join swap queue
GET  /api/swap/active            # Get active swaps
POST /api/swap/:id/submit        # Submit media for swap
POST /api/swap/:id/reveal        # Reveal swap
```

## 🔌 Socket.IO Events

### Client to Server
```javascript
// Chat Events
socket.emit('chat:join', roomId)
socket.emit('chat:leave', roomId)
socket.emit('chat:message', { roomId, message })
socket.emit('chat:typing:start', roomId)
socket.emit('chat:typing:stop', roomId)

// Swap Events
socket.emit('swap:join', { category, theme })
socket.emit('swap:leave')
socket.emit('swap:submit', { swapId, mediaId })
socket.emit('swap:reveal', { swapId })

// User Events
socket.emit('user:status', status)
```

### Server to Client
```javascript
// Chat Events
socket.on('chat:message', message)
socket.on('chat:typing:start', { userId, username, roomId })
socket.on('chat:typing:stop', { userId, username, roomId })

// Swap Events
socket.on('swap:matched', { swapId, participants })
socket.on('swap:partner:submitted', { swapId })
socket.on('swap:reveal', { swapId, revealTime })

// User Events
socket.on('user:online', { userId, isOnline, lastSeen })
socket.on('user:offline', { userId, isOnline, lastSeen })
```

## 🧪 Testing

### Backend Testing
```bash
cd server
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

### Frontend Testing
```bash
cd client
npm test                 # Run all tests
npm run test:watch      # Watch mode
```

### Docker Testing
```bash
# Test the complete application
docker-compose up --build
curl http://localhost/health
curl http://localhost:3000/health
```

## 🚢 Deployment

### Recommended: Vercel + Railway (Hybrid)

**Perfect for production with minimal cost (~$5/month)**

```bash
# 1. Deploy Backend to Railway
# - Push to GitHub
# - Connect Railway to repo
# - Add MongoDB service
# - Configure environment variables
# - Auto-deploys on push

# 2. Deploy Frontend to Vercel
cd client
vercel --prod

# 3. Update environment variables
# Railway: CLIENT_URL=https://your-app.vercel.app
# Vercel: VITE_API_URL=https://your-app.up.railway.app/api
```

**See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete step-by-step guide**

### Alternative: Docker Production

```bash
# Build and deploy with Docker
docker-compose up --build -d

# Scale backend services
docker-compose up --scale server=3 -d

# View logs
docker-compose logs -f server
```

### Other Cloud Platforms

- **AWS/DigitalOcean**: Full control, ~$10-20/month
- **Heroku**: Easy deployment, ~$7-14/month
- **Render**: Free tier available, similar to Railway

See [docs/deployment.md](./docs/deployment.md) for platform-specific guides

## 🔒 Security Considerations

- **Environment Variables**: Never commit `.env` files
- **JWT Secrets**: Use strong, random secrets in production
- **Database**: Enable authentication and use connection strings with credentials
- **HTTPS**: Always use HTTPS in production
- **CORS**: Configure CORS properly for your domain
- **Rate Limiting**: Adjust rate limits based on your needs
- **File Uploads**: Validate file types and sizes
- **Content Moderation**: Implement content moderation for user safety

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Use async/await (no callbacks)
- Write tests for new features
- Follow the existing code style
- Update documentation for API changes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/pixswap/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/pixswap/discussions)
- **Email**: support@pixswap.com

## 🗺️ Roadmap

### Phase 1 (MVP) ✅
- [x] User authentication
- [x] Basic media upload
- [x] Simple chat system
- [x] Public feed
- [x] Random swap prototype

### Phase 2 (Extended Features)
- [ ] Group chats with moderator roles
- [ ] Stories that expire after 24h
- [ ] AI auto-tags and caption suggestions
- [ ] Personalized feed ranking
- [ ] Gamification (badges, streaks, XP)
- [ ] Two-factor authentication

### Phase 3 (Advanced Features)
- [ ] Video calling integration
- [ ] Advanced content moderation
- [ ] Mobile apps (React Native)
- [ ] Push notifications
- [ ] Analytics dashboard
- [ ] Premium features

## 🙏 Acknowledgments

- React and Node.js communities
- Open source contributors
- TypeScript team for amazing tooling
- MongoDB team for excellent documentation
- Socket.IO team for real-time capabilities

---

**Made with ❤️ by the PixSwap Team**