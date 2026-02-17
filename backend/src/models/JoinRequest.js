import mongoose from "mongoose";

const joinRequestSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    requestedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date },
  },
  { timestamps: true, collection: "joinRequests" },
);

joinRequestSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export const JoinRequest =
  mongoose.models.JoinRequest ||
  mongoose.model("JoinRequest", joinRequestSchema);
