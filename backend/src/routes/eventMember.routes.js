import express from "express";
import {
  getEventMembers,
  updateMemberStatus,
  checkInMember,
  getUserEvents,
  removeMember,
} from "../controllers/eventMember.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

router.get("/events/:eventId/members", getEventMembers);

router.post("/events/:eventId/status", updateMemberStatus);

router.post("/events/:eventId/checkin/:userId", checkInMember);

router.get("/me/events", getUserEvents);
router.get("/users/:userId/events", getUserEvents);

router.delete("/events/:eventId/members/:userId", removeMember);

export default router;
