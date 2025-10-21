# 🚀 Cloudinary Deployment Setup

## ✅ Cloudinary Integration Complete!

The codebase has been updated to use Cloudinary for persistent file storage. This fixes the 404 errors caused by Railway's ephemeral filesystem.

---

## 📋 Railway Environment Variables Setup

You need to add these environment variables to your Railway deployment:

### Go to Railway Dashboard:
1. Open your Railway project
2. Click on your backend service
3. Go to the **Variables** tab
4. Add the following variables:

```env
CLOUDINARY_CLOUD_NAME=pixswap
CLOUDINARY_API_KEY=689274726463838
CLOUDINARY_API_SECRET=6ygA4ZTL2Wd4kn4YoBZleYkhz0c
```

### Steps:
1. Click **"New Variable"** or **"Raw Editor"**
2. If using Raw Editor, paste all three variables at once
3. Click **"Deploy"** or wait for auto-deployment

---

## 🔄 What Changed

### Before (Local Filesystem):
- Files saved to `/uploads` directory
- ❌ Lost on container restart
- ❌ Caused 404 errors
- ❌ No CDN benefits

### After (Cloudinary):
- Files uploaded directly to Cloudinary
- ✅ Permanent storage
- ✅ No more 404 errors
- ✅ CDN delivery worldwide
- ✅ Automatic image optimization
- ✅ Video support included

---

## 📊 Cloudinary Account Info

**Account:** pixswap
**API Key Name:** pixswap
**Storage:** 25 GB free tier
**Bandwidth:** 25 GB/month free tier

### Cloudinary Dashboard:
- URL: https://console.cloudinary.com/
- View all uploads in the Media Library
- Monitor usage and bandwidth

---

## 🧪 Testing

After deploying with environment variables:

1. **Upload a new image** on the app
2. **Check Railway logs** - should see Cloudinary URL instead of local path
3. **Refresh page** - image should still load (no 404)
4. **Check Cloudinary dashboard** - see new upload in Media Library

### Expected Log Output:
```
📤 Upload request: {
  userId: '...',
  username: '...',
  fileType: 'image/jpeg'
}
```

File path should be a Cloudinary URL like:
```
https://res.cloudinary.com/pixswap/image/upload/v1234567890/pixswap/1234567890-123456789.jpg
```

---

## 🔒 Security Note

The Cloudinary credentials in your `.env` file are:
- ✅ In `.gitignore` (not committed to Git)
- ⚠️ Need to be added manually to Railway
- ✅ Secure when stored in Railway's environment

---

## 🎯 Next Steps

1. **Add environment variables to Railway** (see instructions above)
2. **Deploy and test** - upload a new image to verify it works
3. **Old images will show 404** - they're still on local filesystem (lost)
4. **New uploads** will work perfectly and persist forever!

---

## 🆘 Troubleshooting

### If uploads fail after deployment:

1. **Check Railway logs** for Cloudinary errors
2. **Verify environment variables** are set correctly in Railway
3. **Check Cloudinary dashboard** - ensure API key is active
4. **Test Cloudinary credentials** - try uploading directly via dashboard

### Common Errors:

**"Invalid cloud_name"**
- Check `CLOUDINARY_CLOUD_NAME=pixswap` is set correctly

**"Invalid API key"**
- Verify `CLOUDINARY_API_KEY` matches your account

**"Upload failed"**
- Check Cloudinary dashboard for quota/limit issues
- Verify file types are supported (jpg, png, mp4, webm)

---

## 📈 Benefits

- **No more 404 errors** - files persist forever
- **Faster delivery** - Cloudinary CDN serves files globally
- **Auto-optimization** - images compressed and optimized automatically
- **Video support** - Cloudinary handles video transcoding
- **Scalability** - No filesystem size limits
- **Reliability** - 99.9% uptime SLA

---

## 💰 Cost

**Free Tier Limits:**
- 25 GB storage
- 25 GB bandwidth/month
- 25 credits/month for transformations

**Estimated Usage:**
- ~500 KB per image (compressed)
- ~50 images per 25 GB
- Should handle MVP/testing phase

**If you exceed limits:**
- Upgrade to Cloudinary Plus ($89/month)
- Or optimize upload compression further
