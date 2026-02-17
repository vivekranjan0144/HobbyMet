import express from "express";
import multer from "multer";
import {
  uploadFile,
  uploadMultipleFiles,
  deleteUploadedFile,
} from "../controllers/upload.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.use(requireAuth);

router.post("/upload", upload.single("file"), uploadFile);

router.post("/upload/multiple", upload.array("files", 10), uploadMultipleFiles);

router.delete("/upload/:publicId", deleteUploadedFile);

export default router;
