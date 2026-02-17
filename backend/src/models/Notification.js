import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "join-request",
        "join-request-response",
        "event-update",
        "message",
        "rating",
        "system",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      maxlength: 200,
    },

    message: {
      type: String,
      maxlength: 2000,
    },

    data: { type: Object },

    createdAt: { type: Date, default: Date.now },

    readAt: { type: Date },
    deliveredAt: { type: Date },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
    collection: "notifications",
  },
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
