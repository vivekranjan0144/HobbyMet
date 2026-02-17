import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },

    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    revieweeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    rating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
      required: true,
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    type: {
      type: String,
      enum: ["event", "user"],
      default: "event",
    },
  },
  { timestamps: true, collection: "reviews" },
);

reviewSchema.index(
  { eventId: 1, reviewerId: 1, revieweeId: 1, type: 1 },
  { unique: true },
);

export const Review =
  mongoose.models.Review || mongoose.model("Review", reviewSchema);
