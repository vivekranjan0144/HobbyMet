import express from "express";
import {
  sendJoinRequest,
  getEventJoinRequests,
  updateJoinRequestStatus,
  getUserJoinRequests,
  leaveEvent,
} from "../controllers/joinRequest.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

router.post("/events/:eventId/requests", sendJoinRequest);

router.get("/events/:eventId/requests", getEventJoinRequests);

router.patch("/events/:eventId/requests/:requestId", updateJoinRequestStatus);

router.get("/me/requests", getUserJoinRequests);

router.delete("/events/:eventId/leave", leaveEvent);

export default router;
