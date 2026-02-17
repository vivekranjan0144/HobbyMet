import { User } from "../models/User.js";
import { Event } from "../models/Event.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

function handleError(res, error, message = "Something went wrong") {
  console.error("Error:", error);

  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      message: "Validation error",
      details: Object.keys(error.errors).map((key) => ({
        field: key,
        error: error.errors[key].message,
      })),
    });
  }

  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  return res.status(500).json({ message });
}

export async function getPublicProfile(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const { privacy } = user || {};

    return res.json({
      id: user._id,
      username: user.username,
      name: user.name,
      email: privacy?.showEmail ? user.email : undefined,
      phone: privacy?.showPhone ? user.phone : undefined,
      location: privacy?.showLocation ? user.location : undefined,
      hobbies: user.hobbies,
      bio: user.bio,
      gender: user.gender,
      dob: user.dob,
      avatar: user.avatar,
      socialLinks: user.socialLinks,
    });
  } catch (err) {
    return handleError(res, err, "Failed to fetch public profile");
  }
}

export async function updateMe(req, res) {
  try {
    const allowed = [
      "name",
      "phone",
      "hobbies",
      "bio",
      "privacy",
      "gender",
      "dob",
      "avatar",
      "socialLinks",
    ];

    const updates = {};

    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).lean();

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.location,
      hobbies: user.hobbies,
      bio: user.bio,
      privacy: user.privacy,
      gender: user.gender,
      dob: user.dob,
      avatar: user.avatar,
      socialLinks: user.socialLinks,
    });
  } catch (err) {
    return handleError(res, err, "Failed to update profile");
  }
}

export async function updateMyLocation(req, res) {
  try {
    const { coordinates, address } = req.body;

    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      return res
        .status(400)
        .json({ message: "coordinates must be [lng, lat]" });
    }

    const [lngRaw, latRaw] = coordinates;
    const lng = Number(lngRaw);
    const lat = Number(latRaw);

    if (Number.isNaN(lng) || Number.isNaN(lat)) {
      return res.status(400).json({ message: "Coordinates must be numbers" });
    }

    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return res.status(400).json({ message: "Invalid coordinates range" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,

      { location: { type: "Point", coordinates: [lng, lat], address } },
      { new: true },
    ).lean();

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ id: user._id, location: user.location });
  } catch (err) {
    return handleError(res, err, "Failed to update location");
  }
}

export async function deleteMe(req, res) {
  try {
    const { password } = req.body;
    if (!password) {
      return res
        .status(400)
        .json({ message: "Password is required to delete account" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    await User.findByIdAndDelete(req.user.id);

    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    return handleError(res, err, "Failed to delete account");
  }
}

export async function getMyEvents(req, res) {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(Number(page) || 1, 1);
    const perPage = Math.min(Number(limit) || 20, 100);
    const skip = (pageNum - 1) * perPage;

    const filter = { hostId: req.user.id };
    if (status && status !== "all") {
      filter.status = String(status).toLowerCase();
    }

    const [events, total] = await Promise.all([
      Event.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),
      Event.countDocuments(filter),
    ]);

    return res.json({
      total,
      page: pageNum,
      limit: perPage,
      events,
    });
  } catch (err) {
    return handleError(res, err, "Failed to fetch your events");
  }
}

export async function getUserEvents(req, res) {
  try {
    const { id } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const pageNum = Math.max(Number(page) || 1, 1);
    const perPage = Math.min(Number(limit) || 20, 100);
    const skip = (pageNum - 1) * perPage;

    const filter = { hostId: id };

    if (status && status !== "all") {
      filter.status = String(status).toLowerCase();
    }

    const [events, total] = await Promise.all([
      Event.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),
      Event.countDocuments(filter),
    ]);

    return res.json({
      total,
      page: pageNum,
      limit: perPage,
      events,
    });
  } catch (err) {
    return handleError(res, err, "Failed to fetch user events");
  }
}
// 🔍 Get nearby users based on location
export async function getNearbyUsers(req, res) {
  try {
    const { longitude, latitude, maxDistance = 10000 } = req.query;

    if (longitude == null || latitude == null) {
      return res
        .status(400)
        .json({ message: "longitude and latitude are required" });
    }

    const lng = Number(longitude);
    const lat = Number(latitude);
    const distance = Number(maxDistance);

    if (Number.isNaN(lng) || Number.isNaN(lat) || Number.isNaN(distance)) {
      return res
        .status(400)
        .json({ message: "Invalid longitude, latitude or maxDistance" });
    }

    const users = await User.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: distance,
        },
      },
      _id: { $ne: req.user.id },
    })
      .select("username name hobbies avatar bio location")
      .limit(20)
      .lean();

    return res.json(users);
  } catch (err) {
    return handleError(res, err, "Failed to fetch nearby users");
  }
}
