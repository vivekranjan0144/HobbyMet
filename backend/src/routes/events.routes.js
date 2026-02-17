import { Router } from "express";
import { requireAuth, attachOptionalUser } from "../middleware/auth.js";

import {
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
  getMyCreatedEvents,
  getMyJoinedEvents,
  getEventMembers,
  removeParticipant,
  getNearbyEvents,
} from "../controllers/events.controller.js";

const router = Router();
router.get("/nearby", attachOptionalUser, getNearbyEvents);

router.get("/me/created", requireAuth, getMyCreatedEvents);
router.get("/me/joined", requireAuth, getMyJoinedEvents);

router.get("/:id/members", requireAuth, getEventMembers);
router.delete("/:id/members/:userId", requireAuth, removeParticipant);

router.post("/", requireAuth, createEvent);
router.get("/", attachOptionalUser, listEvents);
router.get("/:id", attachOptionalUser, getEvent);
router.patch("/:id", requireAuth, updateEvent);
router.delete("/:id", requireAuth, deleteEvent);

router.post("/:id/join", requireAuth, joinEvent);

export default router;
