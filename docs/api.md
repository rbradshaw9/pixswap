# API Documentation

This document provides comprehensive documentation for the PixSwap REST API and Socket.IO events.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

Get your JWT token from the login endpoint and include it in subsequent requests.

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": <response-data>,
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Optional error details"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [<items>],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

## Authentication Endpoints

### POST /auth/signup
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "email": "user@example.com",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe",
      "createdAt": "2021-07-21T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /auth/login
Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "email": "user@example.com",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /auth/logout
Logout user (client-side token removal).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### GET /auth/me
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "email": "user@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://cloudinary.com/image.jpg",
    "bio": "Photography enthusiast",
    "createdAt": "2021-07-21T10:30:00.000Z",
    "lastActive": "2021-07-21T15:45:00.000Z"
  }
}
```

## User Endpoints

### GET /users/profile/:id
Get user profile by ID.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://cloudinary.com/image.jpg",
    "bio": "Photography enthusiast",
    "mediaCount": 25,
    "followersCount": 150,
    "followingCount": 200,
    "isFollowing": false,
    "isBlocked": false
  }
}
```

### PUT /users/profile
Update current user profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Updated bio",
  "isPrivate": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "email": "user@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "bio": "Updated bio",
    "isPrivate": false
  }
}
```

### GET /users/search
Search users by username or name.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `q` (string): Search query
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe",
      "avatar": "https://cloudinary.com/image.jpg"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

## Media Endpoints

### POST /media/upload
Upload media (photo or video).

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request Body (multipart/form-data):**
- `file`: Media file (required)
- `caption`: Caption text (optional)
- `category`: Media category (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "userId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "type": "image",
    "url": "https://cloudinary.com/image.jpg",
    "thumbnailUrl": "https://cloudinary.com/thumb.jpg",
    "caption": "Beautiful sunset",
    "metadata": {
      "width": 1920,
      "height": 1080,
      "size": 2048000
    },
    "createdAt": "2021-07-21T10:30:00.000Z",
    "expiresAt": "2021-07-22T10:30:00.000Z"
  }
}
```

### GET /media/:id
Get media by ID.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "userId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "user": {
      "username": "johndoe",
      "avatar": "https://cloudinary.com/avatar.jpg"
    },
    "type": "image",
    "url": "https://cloudinary.com/image.jpg",
    "caption": "Beautiful sunset",
    "likes": 25,
    "views": 150,
    "isLiked": false,
    "comments": [
      {
        "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
        "userId": "60f7b3b3b3b3b3b3b3b3b3b5",
        "user": {
          "username": "janedoe",
          "avatar": "https://cloudinary.com/jane.jpg"
        },
        "content": "Amazing photo!",
        "createdAt": "2021-07-21T11:00:00.000Z"
      }
    ],
    "createdAt": "2021-07-21T10:30:00.000Z"
  }
}
```

### DELETE /media/:id
Delete media by ID.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Media deleted successfully"
}
```

### POST /media/:id/like
Like media.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "isLiked": true,
    "likesCount": 26
  }
}
```

### DELETE /media/:id/like
Unlike media.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "isLiked": false,
    "likesCount": 25
  }
}
```

### POST /media/:id/comment
Add comment to media.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "Great photo!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
    "mediaId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "userId": "60f7b3b3b3b3b3b3b3b3b3b5",
    "user": {
      "username": "janedoe",
      "avatar": "https://cloudinary.com/jane.jpg"
    },
    "content": "Great photo!",
    "createdAt": "2021-07-21T11:00:00.000Z"
  }
}
```

## Feed Endpoints

### GET /feed
Get public feed.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `category` (string): Filter by category (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "userId": "60f7b3b3b3b3b3b3b3b3b3b3",
      "user": {
        "username": "johndoe",
        "avatar": "https://cloudinary.com/avatar.jpg"
      },
      "type": "image",
      "url": "https://cloudinary.com/image.jpg",
      "thumbnailUrl": "https://cloudinary.com/thumb.jpg",
      "caption": "Beautiful sunset",
      "likes": 25,
      "views": 150,
      "isLiked": false,
      "createdAt": "2021-07-21T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### GET /feed/trending
Get trending content.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `timeframe` (string): 'day', 'week', 'month' (default: 'day')
- `limit` (number): Items to return (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "user": {
        "username": "johndoe",
        "avatar": "https://cloudinary.com/avatar.jpg"
      },
      "url": "https://cloudinary.com/image.jpg",
      "caption": "Viral photo",
      "likes": 1000,
      "views": 5000,
      "trendingScore": 95
    }
  ]
}
```

## Chat Endpoints

### GET /chat/rooms
Get user's chat rooms.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "type": "direct",
      "name": "Chat with johndoe",
      "participants": [
        {
          "_id": "60f7b3b3b3b3b3b3b3b3b3b4",
          "username": "johndoe",
          "avatar": "https://cloudinary.com/avatar.jpg",
          "isOnline": true
        }
      ],
      "lastMessage": {
        "content": "Hey there!",
        "createdAt": "2021-07-21T15:30:00.000Z",
        "senderId": "60f7b3b3b3b3b3b3b3b3b3b4"
      },
      "unreadCount": 2,
      "updatedAt": "2021-07-21T15:30:00.000Z"
    }
  ]
}
```

### POST /chat/rooms
Create a new chat room.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "type": "direct",
  "participantIds": ["60f7b3b3b3b3b3b3b3b3b3b4"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "type": "direct",
    "participants": [
      "60f7b3b3b3b3b3b3b3b3b3b4",
      "60f7b3b3b3b3b3b3b3b3b3b5"
    ],
    "createdAt": "2021-07-21T15:30:00.000Z"
  }
}
```

### GET /chat/rooms/:id/messages
Get messages from a chat room.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Messages per page (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "roomId": "60f7b3b3b3b3b3b3b3b3b3b4",
      "senderId": "60f7b3b3b3b3b3b3b3b3b3b5",
      "sender": {
        "username": "johndoe",
        "avatar": "https://cloudinary.com/avatar.jpg"
      },
      "content": "Hello there!",
      "type": "text",
      "createdAt": "2021-07-21T15:30:00.000Z",
      "isRead": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "pages": 1
  }
}
```

## Swap Endpoints

### POST /swap/join
Join swap queue.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "category": "nature",
  "theme": "sunset"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "queuePosition": 3,
    "estimatedWaitTime": 45,
    "category": "nature",
    "theme": "sunset"
  }
}
```

### GET /swap/active
Get user's active swaps.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "status": "matched",
      "category": "nature",
      "theme": "sunset",
      "participants": [
        {
          "userId": "60f7b3b3b3b3b3b3b3b3b3b4",
          "username": "johndoe",
          "hasSubmitted": true
        },
        {
          "userId": "60f7b3b3b3b3b3b3b3b3b3b5",
          "username": "janedoe",
          "hasSubmitted": false
        }
      ],
      "createdAt": "2021-07-21T15:00:00.000Z",
      "revealTime": "2021-07-21T15:30:00.000Z"
    }
  ]
}
```

### POST /swap/:id/submit
Submit media for swap.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "mediaId": "60f7b3b3b3b3b3b3b3b3b3b6"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "swapId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "status": "submitted",
    "waitingForPartner": true
  }
}
```

## Error Codes

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 413 | Payload Too Large | File size exceeds limit |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

## Socket.IO Events

### Connection
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Chat Events

#### Client to Server
```javascript
// Join a chat room
socket.emit('chat:join', roomId);

// Leave a chat room
socket.emit('chat:leave', roomId);

// Send a message
socket.emit('chat:message', {
  roomId: '60f7b3b3b3b3b3b3b3b3b3b3',
  content: 'Hello!',
  type: 'text'
});

// Start typing indicator
socket.emit('chat:typing:start', roomId);

// Stop typing indicator
socket.emit('chat:typing:stop', roomId);
```

#### Server to Client
```javascript
// Receive a message
socket.on('chat:message', (message) => {
  console.log('New message:', message);
  /*
  {
    _id: '60f7b3b3b3b3b3b3b3b3b3b3',
    roomId: '60f7b3b3b3b3b3b3b3b3b3b4',
    senderId: '60f7b3b3b3b3b3b3b3b3b3b5',
    content: 'Hello!',
    createdAt: '2021-07-21T15:30:00.000Z'
  }
  */
});

// Typing indicators
socket.on('chat:typing:start', ({ userId, username, roomId }) => {
  console.log(`${username} is typing...`);
});

socket.on('chat:typing:stop', ({ userId, username, roomId }) => {
  console.log(`${username} stopped typing`);
});
```

### Swap Events

#### Client to Server
```javascript
// Join swap queue
socket.emit('swap:join', {
  category: 'nature',
  theme: 'sunset'
});

// Leave swap queue
socket.emit('swap:leave');

// Submit media for swap
socket.emit('swap:submit', {
  swapId: '60f7b3b3b3b3b3b3b3b3b3b3',
  mediaId: '60f7b3b3b3b3b3b3b3b3b3b4'
});

// Reveal swap
socket.emit('swap:reveal', {
  swapId: '60f7b3b3b3b3b3b3b3b3b3b3'
});
```

#### Server to Client
```javascript
// Swap matched
socket.on('swap:matched', (data) => {
  console.log('Swap matched:', data);
  /*
  {
    swapId: '60f7b3b3b3b3b3b3b3b3b3b3',
    participants: ['60f7b3b3b3b3b3b3b3b3b3b4', '60f7b3b3b3b3b3b3b3b3b3b5'],
    category: 'nature',
    theme: 'sunset'
  }
  */
});

// Partner submitted media
socket.on('swap:partner:submitted', ({ swapId }) => {
  console.log('Partner submitted media for swap:', swapId);
});

// Swap reveal
socket.on('swap:reveal', ({ swapId, media }) => {
  console.log('Swap revealed:', { swapId, media });
});
```

### User Events

#### Client to Server
```javascript
// Update user status
socket.emit('user:status', 'online');
```

#### Server to Client
```javascript
// User online/offline status
socket.on('user:online', ({ userId, isOnline, lastSeen }) => {
  console.log(`User ${userId} is now ${isOnline ? 'online' : 'offline'}`);
});

socket.on('user:offline', ({ userId, isOnline, lastSeen }) => {
  console.log(`User ${userId} went offline at ${lastSeen}`);
});
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **General endpoints**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 5 requests per 15 minutes per IP  
- **Upload endpoints**: 10 requests per hour per user
- **Message endpoints**: 60 requests per minute per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1627819200
```

## Pagination

Most list endpoints support pagination:

**Query Parameters:**
- `page`: Page number (1-based, default: 1)
- `limit`: Items per page (max: 100, default: 20)

**Response includes pagination metadata:**
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

## File Upload Guidelines

### Supported Formats
- **Images**: JPEG, PNG, GIF, WebP
- **Videos**: MP4, MOV, AVI (max 30 seconds)

### Size Limits
- **Images**: 10MB max
- **Videos**: 50MB max

### Upload Process
1. Send multipart/form-data request to `/media/upload`
2. Server validates file type and size
3. File is uploaded to Cloudinary
4. Media record is created in database
5. Optimized URLs are returned

This API documentation provides a comprehensive guide to integrating with the PixSwap platform. For additional support or questions, please refer to the GitHub repository or contact the development team.