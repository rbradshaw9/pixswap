import { v2 as cloudinary } from 'cloudinary';

/**
 * Extract Cloudinary public_id from a Cloudinary URL
 * Example URL: https://res.cloudinary.com/da9hriihq/image/upload/v1234567890/PixSwap/1234567890-123456789.jpg
 * Returns: PixSwap/1234567890-123456789
 */
export function extractPublicId(cloudinaryUrl: string): string | null {
  try {
    // Match pattern: /upload/v{version}/{folder}/{publicId}.{extension}
    // or: /upload/{folder}/{publicId}.{extension}
    const match = cloudinaryUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch (error) {
    console.error('Error extracting public_id from URL:', error);
    return null;
  }
}

/**
 * Delete a media file from Cloudinary
 * @param publicId The Cloudinary public_id (e.g., "PixSwap/1234567890-123456789")
 * @param resourceType The type of resource ('image' or 'video')
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<boolean> {
  try {
    console.log(`🗑️ Deleting from Cloudinary: ${publicId} (${resourceType})`);
    
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result === 'ok' || result.result === 'not found') {
      console.log(`✅ Cloudinary deletion successful: ${publicId}`);
      return true;
    } else {
      console.warn(`⚠️ Cloudinary deletion returned: ${result.result} for ${publicId}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Failed to delete from Cloudinary (${publicId}):`, error);
    return false;
  }
}
