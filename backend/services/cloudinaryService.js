const { cloudinary, isConfigured } = require('../config/cloudinary');
const path = require('path');
const fs = require('fs');

/**
 * Processes uploaded files from multer req.files or req.file
 * Returns an array of { url, publicId } objects
 */
const uploadImages = async (files, folder = 'lost2found/items') => {
  if (!files || files.length === 0) return [];

  const fileArray = Array.isArray(files) ? files : [files];
  const uploadedImages = [];

  for (const file of fileArray) {
    if (isConfigured) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder,
          resource_type: 'image',
        });
        // Clean up temporary local file after Cloudinary upload
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        uploadedImages.push({
          url: result.secure_url,
          publicId: result.public_id,
        });
      } catch (err) {
        console.error('[Cloudinary Upload Error]:', err);
        // Fallback to local URL path
        uploadedImages.push({
          url: `/uploads/${path.basename(file.path)}`,
          publicId: `local_${path.basename(file.path)}`,
        });
      }
    } else {
      // Local storage path fallback
      const relativePath = `/uploads/${path.basename(file.path)}`;
      uploadedImages.push({
        url: relativePath,
        publicId: `local_${path.basename(file.path)}`,
      });
    }
  }

  return uploadedImages;
};

module.exports = { uploadImages };
