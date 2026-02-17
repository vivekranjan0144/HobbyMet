import { uploadBuffer, deleteFile } from "../services/upload.service.js";

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const folder =
      typeof req.body.folder === "string" && req.body.folder.trim()
        ? req.body.folder.trim()
        : "hobbymet";

    const resourceType =
      typeof req.body.resourceType === "string" && req.body.resourceType.trim()
        ? req.body.resourceType.trim()
        : "auto";

    const tags =
      typeof req.body.tags === "string"
        ? req.body.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined;

    const result = await uploadBuffer(req.file.buffer, {
      folder,
      resource_type: resourceType,
      public_id: req.body.publicId,
      tags,
    });

    return res.status(201).json({
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      resourceType: result.resource_type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      message: "Failed to upload file",
      error: error.message,
    });
  }
};

export const uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const folder =
      typeof req.body.folder === "string" && req.body.folder.trim()
        ? req.body.folder.trim()
        : "hobbymet";

    const resourceType =
      typeof req.body.resourceType === "string" && req.body.resourceType.trim()
        ? req.body.resourceType.trim()
        : "auto";

    const tags =
      typeof req.body.tags === "string"
        ? req.body.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined;

    const uploadPromises = req.files.map((file) =>
      uploadBuffer(file.buffer, {
        folder,
        resource_type: resourceType,
        tags,
      }),
    );

    const results = await Promise.all(uploadPromises);

    const uploads = results.map((result) => ({
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      resourceType: result.resource_type,
    }));

    return res.status(201).json({ uploads });
  } catch (error) {
    console.error("Multiple upload error:", error);
    return res.status(500).json({
      message: "Failed to upload files",
      error: error.message,
    });
  }
};

export const deleteUploadedFile = async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({ message: "Public ID is required" });
    }

    const result = await deleteFile(publicId);

    if (result.result === "ok") {
      return res.json({ message: "File deleted successfully", result });
    }

    if (result.result === "not found") {
      return res
        .status(404)
        .json({ message: "File not found on Cloudinary", result });
    }

    return res.status(400).json({ message: "Failed to delete file", result });
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({
      message: "Failed to delete file",
      error: error.message,
    });
  }
};
