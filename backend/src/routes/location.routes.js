import express from "express";
import {
  updateUserLocation,
  findNearbyUsers,
  findNearbyEvents,
  updateLocationPrivacy,
  searchLocation,
} from "../controllers/location.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/search", searchLocation);

router.use(requireAuth);

router.put("/location", updateUserLocation);

router.put("/location/privacy", updateLocationPrivacy);

router.get("/nearby/users", findNearbyUsers);

router.get("/nearby/events", findNearbyEvents);

export default router;
