import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters long"],
      maxlength: [120, "Title cannot exceed 120 characters"],
    },

    description: {
      type: String,
      required: [true, "Event description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters long"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    category: {
      type: String,
      required: [true, "Event category is required"],
      trim: true,
    },

    hobbyTags: {
      type: [{ type: String, trim: true, maxlength: 40 }],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "At least one hobby tag is required",
      },
      required: true,
    },

    rules: { type: String, trim: true, maxlength: 2000 },

    coverImage: { type: String },
    gallery: { type: [String], default: [] },

    eventDateTime: {
      type: Date,
      required: true,
    },

    endDateTime: {
      type: Date,
      validate: {
        validator: function (v) {
          if (!v || !this.eventDateTime) return true;
          return v >= this.eventDateTime;
        },
        message: "endDateTime must be after eventDateTime",
      },
    },

    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (v) =>
            Array.isArray(v) &&
            v.length === 2 &&
            v.every((n) => typeof n === "number" && !isNaN(n)),
          message: "Coordinates must be [lng, lat]",
        },
      },

      address: { type: String, trim: true },
    },

    capacity: {
      type: Number,
      default: 0,
      min: 0,
      max: 5000,
    },

    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "cancelled", "completed"],
      default: "active",
      required: true,
    },
  },
  { timestamps: true, collection: "events" },
);

eventSchema.index({ "location.coordinates": "2dsphere" });
eventSchema.index({ title: "text", description: "text", hobbyTags: "text" });

export const Event =
  mongoose.models.Event || mongoose.model("Event", eventSchema);
