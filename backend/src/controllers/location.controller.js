import axios from "axios";
import { User } from "../models/User.js";
import { Event } from "../models/Event.js";

export const updateUserLocation = async (req, res) => {
  try {
    const { longitude, latitude } = req.body;

    if (longitude === undefined || latitude === undefined) {
      return res
        .status(400)
        .json({ message: "Longitude and latitude are required" });
    }

    const lon = Number(longitude);
    const lat = Number(latitude);

    if (Number.isNaN(lon) || Number.isNaN(lat)) {
      return res.status(400).json({ message: "Coordinates must be numbers" });
    }

    if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        location: {
          type: "Point",
          coordinates: [lon, lat],
        },
      },
      { new: true },
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    console.error("Error updating user location:", error);
    return res.status(500).json({
      message: "Failed to update location",
      error: error.message,
    });
  }
};

export const findNearbyUsers = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 10000 } = req.query;

    if (longitude === undefined || latitude === undefined) {
      return res
        .status(400)
        .json({ message: "Longitude and latitude are required" });
    }

    const lon = Number(longitude);
    const lat = Number(latitude);
    const maxDist = Number(maxDistance) || 10000;

    if (Number.isNaN(lon) || Number.isNaN(lat)) {
      return res.status(400).json({ message: "Coordinates must be numbers" });
    }

    if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    const users = await User.find({
      _id: { $ne: req.user.id },
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lon, lat],
          },
          $maxDistance: maxDist,
        },
      },
      "location.coordinates": { $exists: true, $ne: null },
      $or: [
        { "privacy.showLocation": true },
        { "privacy.showLocation": { $exists: false } },
        { privacy: { $exists: false } },
      ],
    })
      .select("_id username name bio hobbies location")
      .limit(50)
      .lean();

    return res.json(users);
  } catch (error) {
    console.error("Error finding nearby users:", error);
    return res.status(500).json({
      message: "Failed to find nearby users",
      error: error.message,
    });
  }
};

export const findNearbyEvents = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 50000, category } = req.query;

    if (longitude === undefined || latitude === undefined) {
      return res
        .status(400)
        .json({ message: "Longitude and latitude are required" });
    }

    const lon = Number(longitude);
    const lat = Number(latitude);
    const maxDist = Number(maxDistance) || 50000;

    if (Number.isNaN(lon) || Number.isNaN(lat)) {
      return res.status(400).json({ message: "Coordinates must be numbers" });
    }

    if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    const now = new Date();
    await Event.updateMany(
      {
        status: "active",
        endDateTime: { $exists: true, $lte: now },
      },
      { $set: { status: "completed" } },
    );

    const query = {
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lon, lat],
          },
          $maxDistance: maxDist,
        },
      },
      eventDateTime: { $gte: new Date() },
      visibility: "public",
      status: "active",
    };

    if (category) {
      query.category = category;
    }

    const events = await Event.find(query)
      .select(
        "_id title description category location eventDateTime endDateTime",
      )
      .populate("hostId", "username name")
      .limit(50)
      .lean();

    return res.json(events);
  } catch (error) {
    console.error("Error finding nearby events:", error);
    return res.status(500).json({
      message: "Failed to find nearby events",
      error: error.message,
    });
  }
};

export const updateLocationPrivacy = async (req, res) => {
  try {
    const { showLocation } = req.body;

    if (showLocation === undefined) {
      return res
        .status(400)
        .json({ message: "showLocation field is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { "privacy.showLocation": !!showLocation },
      { new: true },
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    console.error("Error updating location privacy:", error);
    return res.status(500).json({
      message: "Failed to update privacy settings",
      error: error.message,
    });
  }
};

export const searchLocation = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Query is required" });
    }

    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q,
          format: "json",
          addressdetails: 1,
          limit: 8,
        },
        headers: {
          "User-Agent": "HobbyMet-App/1.0 (contact@hobbymet.com)",
        },
      },
    );

    return res.json(response.data);
  } catch (error) {
    console.error("Nominatim search error:", error.message);
    return res.status(500).json({
      message: "Location search failed",
    });
  }
};
