import mongoose from "mongoose";
import { Event } from "../models/Event.js";
import { User } from "../models/User.js";
import { JoinRequest } from "../models/JoinRequest.js";
import { createNotification } from "../services/notification.service.js";

function handleError(res, error, customMsg = "Something went wrong") {
  console.error("EventController Error:", error);

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

  if (error.code === 11000) {
    return res.status(409).json({ message: "Duplicate entry" });
  }

  return res.status(500).json({ message: customMsg });
}

export async function createEvent(req, res) {
  try {
    const body = req.body;

    if (!body.title || !body.eventDateTime) {
      return res
        .status(400)
        .json({ message: "Title and eventDateTime are required" });
    }

    if (!body.location || !body.location.coordinates) {
      return res.status(400).json({ message: "Event location is required" });
    }

    const event = await Event.create({
      title: body.title,
      description: body.description,
      category: body.category,
      hobbyTags: body.hobbyTags || [],
      rules: body.rules,
      coverImage: body.coverImage,
      gallery: body.gallery || [],
      eventDateTime: body.eventDateTime,
      endDateTime: body.endDateTime,
      hostId: req.user.id,
      location: body.location,
      capacity: body.capacity,
      visibility: body.visibility || "public",
      status: body.status || "active",
      participants: [],
    });

    return res.status(201).json(event);
  } catch (error) {
    return handleError(res, error, "Failed to create event");
  }
}

async function updateEventStatuses() {
  try {
    const now = new Date();
    const result = await Event.updateMany(
      {
        status: "active",
        endDateTime: { $exists: true, $lte: now },
      },
      {
        $set: { status: "completed" },
      },
    );
    if (result.modifiedCount > 0) {
      console.log(`Auto-updated ${result.modifiedCount} events to completed`);
    }
  } catch (error) {
    console.error("Error auto-updating event statuses:", error);
  }
}

export async function listEvents(req, res) {
  console.log("EVENT LIST QUERY:", req.query);

  try {
    await updateEventStatuses();

    const {
      category,
      tags,
      q,
      near,
      maxDistance,
      start,
      end,
      page = 1,
      limit = 20,
      status,
    } = req.query;

    const filter = {};

    if (category) filter.category = new RegExp(`^${category}$`, "i");

    if (tags) {
      const tagArray = Array.isArray(tags)
        ? tags
        : String(tags)
            .split(",")
            .map((t) => t.trim().toLowerCase());
      filter.hobbyTags = { $in: tagArray };
    }

    if (q) filter.$text = { $search: String(q) };

    if (start || end) {
      filter.eventDateTime = {};
      if (start) filter.eventDateTime.$gte = new Date(start);
      if (end) filter.eventDateTime.$lte = new Date(end);
    }

    if (status) {
      filter.status = String(status).toLowerCase();
    }

    if (near) {
      const { longitude, latitude, maxDistance } = req.query;

      if (longitude && latitude) {
        filter.location = {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [Number(longitude), Number(latitude)],
            },
            $maxDistance: Number(maxDistance) || 20000,
          },
        };
      }
    } else if (maxDistance) {
      if (req.user?.id) {
        const user = await User.findById(req.user.id).select("location").lean();
        const coords = user?.location?.coordinates;
        if (Array.isArray(coords) && coords.length === 2) {
          filter.location = {
            $near: {
              $geometry: { type: "Point", coordinates: coords },
              $maxDistance: Number(maxDistance),
            },
          };
        }
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const events = await Event.find(filter)
      .populate("hostId", "username name")
      .sort({ eventDateTime: 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    return res.json({
      total: events.length,
      events,
    });
  } catch (error) {
    return handleError(res, error, "Failed to fetch events");
  }
}

export async function getEvent(req, res) {
  try {
    await updateEventStatuses();

    const event = await Event.findById(req.params.id)
      .populate("hostId", "username name")
      .populate("participants", "username name")
      .lean();

    if (!event) return res.status(404).json({ message: "Not found" });

    return res.json(event);
  } catch (error) {
    return handleError(res, error, "Failed to fetch event details");
  }
}

export async function getMyCreatedEvents(req, res) {
  try {
    await updateEventStatuses();

    const { status } = req.query;
    const filter = { hostId: req.user.id };
    if (status && status !== "all") {
      filter.status = status.toLowerCase();
    }

    const events = await Event.find(filter).sort({ createdAt: -1 }).lean();

    return res.json({
      total: events.length,
      events,
    });
  } catch (error) {
    return handleError(res, error, "Failed to fetch your events");
  }
}

export async function getMyJoinedEvents(req, res) {
  try {
    const events = await Event.find({
      participants: new mongoose.Types.ObjectId(req.user.id),
    })
      .sort({ eventDateTime: 1 })
      .lean();

    return res.json({
      total: events.length,
      events,
    });
  } catch (error) {
    return handleError(res, error, "Failed to fetch joined events");
  }
}

export async function getEventMembers(req, res) {
  try {
    const { id } = req.params;
    const event = await Event.findById(id)
      .populate("participants", "username name email")
      .lean();

    if (!event) return res.status(404).json({ message: "Event not found" });

    return res.json({
      eventId: event._id,
      participants: event.participants || [],
      capacity: event.capacity,
    });
  } catch (error) {
    return handleError(res, error, "Failed to fetch event members");
  }
}

export async function updateEvent(req, res) {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Not found" });

    if (String(event.hostId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const editable = [
      "title",
      "description",
      "category",
      "hobbyTags",
      "rules",
      "coverImage",
      "gallery",
      "eventDateTime",
      "endDateTime",
      "location",
      "capacity",
      "visibility",
      "status",
    ];

    for (const key of editable) {
      if (key in req.body) {
        event[key] = req.body[key];
      }
    }

    await event.save();
    return res.json(event);
  } catch (error) {
    return handleError(res, error, "Failed to update event");
  }
}

export async function deleteEvent(req, res) {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Not found" });

    if (String(event.hostId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await event.deleteOne();

    return res.status(204).send();
  } catch (error) {
    return handleError(res, error, "Failed to delete event");
  }
}

export async function joinEvent(req, res) {
  try {
    await updateEventStatuses();

    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.status === "completed") {
      return res.status(400).json({ message: "Cannot join a completed event" });
    }

    if (event.status === "cancelled") {
      return res.status(400).json({ message: "Cannot join a cancelled event" });
    }

    if (event.capacity && event.participants.length >= event.capacity) {
      return res.status(400).json({ message: "Event is at full capacity" });
    }

    const alreadyJoined = event.participants.some(
      (pid) => String(pid) === String(req.user.id),
    );
    if (alreadyJoined) {
      return res.status(409).json({ message: "Already joined this event" });
    }

    event.participants.push(req.user.id);
    await event.save();

    await createNotification(
      event.hostId,
      "event-update",
      "New Participant",
      `${req.user.name || req.user.username} has joined your event: ${
        event.title
      }`,
      { eventId: id, userId: req.user.id },
    );

    return res.status(200).json({ message: "Successfully joined event" });
  } catch (error) {
    return handleError(res, error, "Failed to join event");
  }
}

export async function removeParticipant(req, res) {
  try {
    const { id, userId } = req.params;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (String(event.hostId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (String(userId) === String(event.hostId)) {
      return res
        .status(400)
        .json({ message: "Host cannot be removed from their own event" });
    }

    const targetId = new mongoose.Types.ObjectId(userId);
    const beforeCount = event.participants.length;

    event.participants = event.participants.filter((pid) => {
      const pidId =
        pid instanceof mongoose.Types.ObjectId
          ? pid
          : new mongoose.Types.ObjectId(pid);
      return !pidId.equals(targetId);
    });

    if (event.participants.length === beforeCount) {
      return res
        .status(404)
        .json({ message: "User is not a participant of this event" });
    }

    await event.save();

    await JoinRequest.deleteMany({ eventId: id, userId });

    await createNotification(
      userId,
      "event-update",
      "Removed from event",
      `You have been removed from the event: ${event.title}`,
      { eventId: id, hostId: event.hostId },
    );

    return res.json({
      message: "Participant removed successfully",
      participants: event.participants,
    });
  } catch (error) {
    return handleError(res, error, "Failed to remove participant");
  }
}

export async function getNearbyEvents(req, res) {
  try {
    console.log("Nearby events query:", req.query);

    await updateEventStatuses();

    const { longitude, latitude, maxDistance } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        message: "longitude and latitude are required",
      });
    }

    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);
    const distance = parseInt(maxDistance) || 10000;

    if (isNaN(lng) || isNaN(lat)) {
      return res.status(400).json({
        message: "Invalid coordinates",
      });
    }

    console.log("Searching for events near:", { lng, lat, distance });

    const filter = {
      status: "active",
      "location.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: distance,
        },
      },
    };

    const events = await Event.find(filter)
      .populate("hostId", "username name avatar")
      .populate("participants", "username name")
      .sort({ eventDateTime: 1 })
      .limit(100)
      .lean();

    console.log("Found nearby events:", events.length);

    return res.json(events);
  } catch (error) {
    console.error("getNearbyEvents error:", error);

    if (error.message?.includes("2dsphere") || error.code === 27) {
      return res.status(500).json({
        message:
          'Geospatial index not found. Please run: db.events.createIndex({ "location.coordinates": "2dsphere" })',
      });
    }

    return handleError(res, error, "Failed to fetch nearby events");
  }
}
