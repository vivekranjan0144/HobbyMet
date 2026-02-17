import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
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
    text: { type: String },
    attachments: [{ type: String }],
    sentAt: { type: Date, default: Date.now },
    editedAt: { type: Date },
    deletedAt: { type: Date },

    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    pinnedAt: { type: Date },
    pinnedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, collection: "chatMessages" },
);

chatMessageSchema.index({ eventId: 1, createdAt: -1 });
chatMessageSchema.index({ eventId: 1, pinnedAt: -1 });

export const ChatMessage =
  mongoose.models.ChatMessage ||
  mongoose.model("ChatMessage", chatMessageSchema);
