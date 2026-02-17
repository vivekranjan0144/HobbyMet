import api from "../utils/fetch";

export const UploadAPI = {
  /**
   * Upload a single file to Cloudinary
   * @param {File} file
   * @param {Object} options
   * @param {string} options.folder
   * @param {string} options.resourceType
   * @returns {Promise<{url: string, publicId: string}>}
   */
  uploadFile: async (file, options = {}) => {
    if (!file) throw new Error("File is required");

    const formData = new FormData();
    formData.append("file", file);

    if (options.folder) formData.append("folder", options.folder);
    if (options.resourceType)
      formData.append("resourceType", options.resourceType);
    if (options.publicId) formData.append("publicId", options.publicId);
    if (options.tags) formData.append("tags", options.tags);

    try {
      const res = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return {
        url: res.data.url,
        publicId: res.data.publicId,
      };
    } catch (err) {
      console.error("❌ UploadAPI.uploadFile failed:", err);
      throw err;
    }
  },

  /**
   * Upload multiple files to Cloudinary
   * @param {File[]} files
   * @param {Object} options
   * @returns {Promise<Array<{url: string, publicId: string}>>}
   */
  uploadMultipleFiles: async (files, options = {}) => {
    if (!files || files.length === 0) throw new Error("Files are required");

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    if (options.folder) formData.append("folder", options.folder);
    if (options.resourceType)
      formData.append("resourceType", options.resourceType);
    if (options.tags) formData.append("tags", options.tags);

    try {
      const res = await api.post("/upload/multiple", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data.uploads.map((upload) => ({
        url: upload.url,
        publicId: upload.publicId,
      }));
    } catch (err) {
      console.error("❌ UploadAPI.uploadMultipleFiles failed:", err);
      throw err;
    }
  },

  /**
   * Delete a file from Cloudinary
   * @param {string} publicId
   * @returns {Promise<void>}
   */
  deleteFile: async (publicId) => {
    if (!publicId) throw new Error("Public ID is required");
    try {
      await api.delete(`/upload/${publicId}`);
    } catch (err) {
      console.error("❌ UploadAPI.deleteFile failed:", err);
      throw err;
    }
  },
};
