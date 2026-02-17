import mongoose from "mongoose";

const eventMemberSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ["attending", "maybe", "not_attending"],
      default: "attending",
    },
    role: {
      type: String,
      enum: ["host", "member"],
      default: "member",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    checkedInAt: {
      type: Date,
    },
  },
  { timestamps: true, collection: "eventMembers" },
);

eventMemberSchema.index({ eventId: 1, userId: 1 }, { unique: true });

eventMemberSchema.index({ eventId: 1, status: 1 });

eventMemberSchema.index({ userId: 1, status: 1 });

export const EventMember =
  mongoose.models.EventMember ||
  mongoose.model("EventMember", eventMemberSchema);
