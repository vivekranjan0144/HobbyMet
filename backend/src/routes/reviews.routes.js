import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  addEventReview,
  getEventReviews,
  getUserReviews,
} from "../controllers/reviews.controller.js";

const router = express.Router();

router.post("/events/:eventId/reviews", requireAuth, addEventReview);

router.get("/events/:eventId/reviews", getEventReviews);

router.get("/users/:userId/reviews", getUserReviews);

export default router;
