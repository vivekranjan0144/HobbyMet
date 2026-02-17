import { EventMember } from "../models/EventMember.js";
import { Event } from "../models/Event.js";
import { User } from "../models/User.js";
import { createNotification } from "../services/notification.service.js";
import mongoose from "mongoose";

const VALID_STATUSES = ["attending", "maybe", "not_attending"];

export const getEventMembers = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.query;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    const query = { eventId };
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ message: "Invalid status filter" });
      }
      query.status = status;
    }

    const members = await EventMember.find(query)
      .populate("userId", "username name bio")
      .sort({ joinedAt: -1 });

    return res.json(members);
  } catch (error) {
    console.error("Error getting event members:", error);
    return res
      .status(500)
      .json({ message: "Failed to get event members", error: error.message });
  }
};

export const updateMemberStatus = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event id" });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    let member = await EventMember.findOne({ eventId, userId });

    if (!member) {
      member = await EventMember.create({
        eventId,
        userId,
        status,
        role: event.hostId.toString() === userId ? "host" : "member",
        joinedAt: new Date(),
      });

      if (status === "attending" && event.hostId.toString() !== userId) {
        try {
          const actor = await User.findById(userId).select("username name");
          const displayName = actor?.username || actor?.name || "Someone";

          await createNotification(
            event.hostId,
            "event-update",
            "New Event Attendee",
            `${displayName} is now attending your event: ${event.title}`,
            { eventId: event._id },
          );
        } catch (notifyErr) {
          console.warn(
            "Failed to send new attendee notification:",
            notifyErr.message,
          );
        }
      }
    } else {
      member.status = status;
      await member.save();
    }

    if (status === "attending") {
      await Event.updateOne(
        { _id: eventId },
        { $addToSet: { participants: userId } },
      );
    } else {
      await Event.updateOne(
        { _id: eventId },
        { $pull: { participants: userId } },
      );
    }

    return res.json(member);
  } catch (error) {
    console.error("Error updating member status:", error);
    return res
      .status(500)
      .json({ message: "Failed to update status", error: error.message });
  }
};

export const checkInMember = async (req, res) => {
  try {
    const { eventId, userId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(eventId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ message: "Invalid eventId or userId" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.hostId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only the host can check in members" });
    }

    const member = await EventMember.findOneAndUpdate(
      { eventId, userId, status: "attending" },
      { checkedInAt: new Date() },
      { new: true },
    );

    if (!member) {
      return res
        .status(404)
        .json({ message: "Member not found or not attending" });
    }

    return res.json(member);
  } catch (error) {
    console.error("Error checking in member:", error);
    return res
      .status(500)
      .json({ message: "Failed to check in member", error: error.message });
  }
};

export const getUserEvents = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { status } = req.query;

    const query = { userId };
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ message: "Invalid status filter" });
      }
      query.status = status;
    }

    const memberships = await EventMember.find(query)
      .populate({
        path: "eventId",
        select:
          "title description category eventDateTime location status hostId",
        populate: {
          path: "hostId",
          select: "username name",
        },
      })
      .sort({ "eventId.eventDateTime": 1 });

    const events = memberships
      .filter((m) => m.eventId)
      .map((membership) => ({
        ...membership.eventId.toObject(),
        memberStatus: membership.status,
        memberRole: membership.role,
        joinedAt: membership.joinedAt,
        checkedInAt: membership.checkedInAt,
      }));

    return res.json(events);
  } catch (error) {
    console.error("Error getting user events:", error);
    return res.status(500).json({
      message: "Failed to get user events",
      error: error.message,
    });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { eventId, userId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(eventId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ message: "Invalid eventId or userId" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.hostId.toString() !== req.user.id && userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Unauthorized to remove this member" });
    }

    const member = await EventMember.findOne({ eventId, userId });
    if (member && member.role === "host") {
      return res
        .status(400)
        .json({ message: "Cannot remove the host from the event" });
    }

    const result = await EventMember.deleteOne({ eventId, userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Member not found" });
    }

    await Event.updateOne(
      { _id: eventId },
      { $pull: { participants: userId } },
    );

    if (event.hostId.toString() === req.user.id && userId !== req.user.id) {
      try {
        const user = await User.findById(userId).select("username name");
        if (user) {
          await createNotification(
            userId,
            "event-update",
            "Removed from Event",
            `You have been removed from the event: ${event.title}`,
            { eventId: event._id, action: "removed-from-event" },
          );
        }
      } catch (notifyErr) {
        console.warn("Failed to send removal notification:", notifyErr.message);
      }
    }

    return res.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing member:", error);
    return res.status(500).json({
      message: "Failed to remove member",
      error: error.message,
    });
  }
};
