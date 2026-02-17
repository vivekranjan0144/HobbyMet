import mongoose from "mongoose";

const privacySchema = new mongoose.Schema(
  {
    showEmail: { type: Boolean, default: false },
    showPhone: { type: Boolean, default: false },
    showLocation: { type: Boolean, default: false },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: [true, "Username is required"],
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ],
    },

    name: {
      type: String,
      trim: true,
      maxlength: 60,
    },

    email: {
      type: String,
      unique: true,
      required: [true, "Email is required"],
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },

    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, "Invalid phone number"],
      required: false,
    },

    passwordHash: {
      type: String,
      required: [true, "Password is required"],
    },

    dob: {
      type: Date,
      validate: {
        validator: (v) => !v || v < new Date(),
        message: "DOB cannot be in the future",
      },
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },

    hobbies: [
      {
        type: String,
        maxlength: 40,
        trim: true,
      },
    ],

    bio: {
      type: String,
      maxlength: 500,
    },

    avatar: {
      url: { type: String, trim: true },
      publicId: { type: String, trim: true },
    },

    socialLinks: {
      facebook: { type: String, trim: true },
      instagram: { type: String, trim: true },
      twitter: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      website: { type: String, trim: true },
    },

    privacy: { type: privacySchema, default: {} },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        index: "2dsphere",
        validate: {
          validator: (v) => !v || v.length === 2,
          message: "Coordinates must be [longitude, latitude]",
        },
      },
      address: { type: String },
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastLoginAt: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    collection: "users",
  },
);

userSchema.index({ location: "2dsphere" });
userSchema.index({ username: "text", name: "text" });

export const User = mongoose.models.User || mongoose.model("User", userSchema);
