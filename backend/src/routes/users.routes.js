import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getPublicProfile,
  updateMe,
  updateMyLocation,
  deleteMe,
  getUserEvents,
  getNearbyUsers,
} from "../controllers/users.controller.js";

const router = Router();

router.get("/nearby", requireAuth, getNearbyUsers);
router.get("/:id", getPublicProfile);
router.get("/:id/events", getUserEvents);
router.patch("/me", requireAuth, updateMe);
router.patch("/me/location", requireAuth, updateMyLocation);
router.delete("/me", requireAuth, deleteMe);

export default router;
