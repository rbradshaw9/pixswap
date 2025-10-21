# Storage Issue - 404 Errors for Uploaded Files

## Problem
Railway's filesystem is **ephemeral** - files uploaded to the `/uploads` directory are lost when the container restarts or redeploys. This causes 404 errors for previously uploaded content.

### Evidence from Logs
```
GET /uploads/1761082279356-16139424-blob HTTP/1.1" 404
GET /uploads/1761082293461-326849748-blob HTTP/1.1" 404
GET /uploads/1761082262887-438367408-blob HTTP/1.1" 404
```

## Solutions

### Option 1: Cloud Storage (Recommended for Production)
Use cloud storage service like AWS S3, Cloudinary, or UploadCare.

#### AWS S3 Implementation:
```bash
npm install aws-sdk multer-s3
```

```typescript
// server/src/middleware/upload.ts
import AWS from 'aws-sdk';
import multerS3 from 'multer-s3';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const storage = multerS3({
  s3: s3,
  bucket: process.env.S3_BUCKET_NAME!,
  acl: 'public-read',
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});
```

#### Cloudinary Implementation (Simpler):
```bash
npm install cloudinary multer-storage-cloudinary
```

```typescript
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'pixswap',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm'],
    resource_type: 'auto', // Handles both images and videos
  } as any,
});
```

### Option 2: Railway Volume (Persistent Storage)
Railway offers persistent volumes that survive container restarts.

```bash
# Add volume in Railway dashboard:
# - Mount path: /app/uploads
# - This creates persistent storage for the uploads directory
```

Update `railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  },
  "volumes": [
    {
      "mountPath": "/app/uploads"
    }
  ]
}
```

### Option 3: Database Storage (Not Recommended for Large Files)
Store small images as Base64 in MongoDB. Not suitable for videos or high-res images.

## Recommended Approach
1. **For MVP/Development**: Use Railway volumes (quick fix)
2. **For Production**: Use Cloudinary (easiest) or AWS S3 (most scalable)

## Implementation Priority
1. Add Cloudinary support to upload middleware
2. Migrate existing uploads to Cloudinary
3. Update content URLs in database
4. Remove local file storage dependency

## Environment Variables Needed
```env
# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# OR AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=pixswap-uploads
```
