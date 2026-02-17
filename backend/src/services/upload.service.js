import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

/**
 * Upload a file to Cloudinary
 * @param {Buffer} buffer 
 * @param {Object} options 
 * @returns {Promise<Object>} 
 */
export const uploadBuffer = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || "hobbymet",
      resource_type: options.resourceType || "auto",
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId 
 * @returns {Promise<Object>} 
 */
export const deleteFile = async (publicId) => {
  return await cloudinary.uploader.destroy(publicId);
};

/**
 * Generate a signed URL for a file
 * @param {string} publicId 
 * @param {Object} options 
 * @returns {string} 
 */
export const getSignedUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    sign_url: true,
    ...options,
  });
};
