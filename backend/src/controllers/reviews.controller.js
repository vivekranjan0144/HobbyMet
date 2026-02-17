import mongoose from "mongoose";
import { Review } from "../models/Review.js";
import { Event } from "../models/Event.js";
import { createNotification } from "../services/notification.service.js";
import { User } from "../models/User.js";

const VALID_REVIEW_TYPES = ["event", "user"];

export const addEventReview = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating, comment, revieweeId, type = "event" } = req.body;
    const reviewerId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const numericRating = Number(rating);
    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    const reviewType = VALID_REVIEW_TYPES.includes(type) ? type : "event";

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const now = new Date();
    const eventEnd = event.endDateTime
      ? new Date(event.endDateTime)
      : new Date(event.eventDateTime);

    if (event.status !== "completed" && now < eventEnd) {
      return res
        .status(400)
        .json({ message: "You can only review after the event ends" });
    }

    const isParticipant = (event.participants || []).some(
      (pid) => String(pid) === String(reviewerId),
    );
    const isHost = String(event.hostId) === String(reviewerId);

    if (!isParticipant && !isHost) {
      return res.status(403).json({
        message: "Only participants or the host can review this event",
      });
    }

    const targetRevieweeId = revieweeId || event.hostId;

    const existing = await Review.findOne({
      eventId,
      reviewerId,
      revieweeId: targetRevieweeId,
      type: reviewType,
    });

    if (existing) {
      return res
        .status(409)
        .json({ message: "Review already submitted for this target" });
    }

    const review = await Review.create({
      eventId,
      reviewerId,
      revieweeId: targetRevieweeId,
      rating: numericRating,
      comment: comment?.trim(),
      type: reviewType,
    });

    const reviewer = await User.findById(reviewerId)
      .select("name username")
      .lean();

    if (String(targetRevieweeId) !== String(reviewerId)) {
      const revieweeName = reviewer?.name || reviewer?.username || "Someone";
      const reviewTypeText = reviewType === "event" ? "event" : "you";

      await createNotification(
        targetRevieweeId,
        "rating",
        "New Rating Received",
        `${revieweeName} rated ${reviewTypeText} with ${numericRating} star${numericRating > 1 ? "s" : ""}`,
        {
          eventId: event._id,
          reviewId: review._id,
          reviewerId: reviewerId,
          rating: numericRating,
          type: reviewType,
        },
      );
    }

    if (
      reviewType === "event" &&
      String(event.hostId) !== String(targetRevieweeId) &&
      String(event.hostId) !== String(reviewerId)
    ) {
      const revieweeName = reviewer?.name || reviewer?.username || "Someone";
      await createNotification(
        event.hostId,
        "rating",
        "Event Received Rating",
        `${revieweeName} rated your event "${event.title}" with ${numericRating} star${numericRating > 1 ? "s" : ""}`,
        {
          eventId: event._id,
          reviewId: review._id,
          reviewerId: reviewerId,
          rating: numericRating,
        },
      );
    }

    return res.status(201).json(review);
  } catch (err) {
    console.error("addEventReview error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

export const getEventReviews = async (req, res) => {
  try {
    const { eventId } = req.params;
    let { page = 1, limit = 20, reviewerId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const query = { eventId };
    if (reviewerId) {
      query.reviewerId = reviewerId;
    } else {
      query.type = "event";
    }

    const pageNum = Math.max(Number(page) || 1, 1);
    const perPage = Math.min(Number(limit) || 20, 100);
    const skip = (pageNum - 1) * perPage;

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate("reviewerId", "username name avatar")
        .populate("revieweeId", "username name avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),
      Review.countDocuments(query),
    ]);

    return res.json({
      total,
      page: pageNum,
      limit: perPage,
      reviews,
    });
  } catch (err) {
    console.error("getEventReviews error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

export const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    let { page = 1, limit = 20 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const pageNum = Math.max(Number(page) || 1, 1);
    const perPage = Math.min(Number(limit) || 20, 100);
    const skip = (pageNum - 1) * perPage;

    const [reviews, total, stats] = await Promise.all([
      Review.find({ revieweeId: userId })
        .populate("reviewerId", "username name avatar")
        .populate("eventId", "title eventDateTime")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),
      Review.countDocuments({ revieweeId: userId }),
      Review.aggregate([
        { $match: { revieweeId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$rating" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const avgRating = stats[0]?.avgRating || 0;
    const count = stats[0]?.count || 0;

    return res.json({
      total,
      page: pageNum,
      limit: perPage,
      avgRating,
      count,
      reviews,
    });
  } catch (err) {
    console.error("getUserReviews error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};
