import { JoinRequest } from "../models/JoinRequest.js";
import { Event } from "../models/Event.js";
import { EventMember } from "../models/EventMember.js";
import { User } from "../models/User.js";
import { createNotification } from "../services/notification.service.js";

async function updateEventStatus(eventId) {
  try {
    const event = await Event.findById(eventId);
    if (!event) return;

    const now = new Date();
    if (
      event.status === "active" &&
      event.endDateTime &&
      event.endDateTime <= now
    ) {
      event.status = "completed";
      await event.save();
    }
  } catch (error) {
    console.error("Error updating event status:", error);
  }
}

export async function sendJoinRequest(req, res) {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;
    const { message } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    await updateEventStatus(eventId);

    const updatedEvent = await Event.findById(eventId);

    if (updatedEvent.status === "completed") {
      return res.status(400).json({ message: "Cannot join a completed event" });
    }

    if (updatedEvent.status === "cancelled") {
      return res.status(400).json({ message: "Cannot join a cancelled event" });
    }

    if (updatedEvent.hostId.toString() === userId) {
      return res
        .status(400)
        .json({ message: "You cannot join your own event" });
    }

    const alreadyParticipant = (updatedEvent.participants || []).some(
      (pid) => String(pid) === String(userId),
    );
    if (alreadyParticipant) {
      return res
        .status(400)
        .json({ message: "You are already a participant of this event" });
    }

    const existingRequest = await JoinRequest.findOne({ eventId, userId });
    if (existingRequest) {
      return res.status(400).json({
        message: "You have already requested to join this event",
      });
    }

    if (
      updatedEvent.capacity &&
      Array.isArray(updatedEvent.participants) &&
      updatedEvent.participants.length >= updatedEvent.capacity
    ) {
      return res.status(400).json({ message: "Event is at full capacity" });
    }

    const joinRequest = await JoinRequest.create({
      eventId,
      userId,
      message,
      status: "pending",
      requestedAt: new Date(),
    });

    await createNotification(
      updatedEvent.hostId,
      "join-request",
      "New Join Request",
      `Someone requested to join your event: ${updatedEvent.title}`,
      { eventId: updatedEvent._id, requestId: joinRequest._id },
    );

    return res.status(201).json(joinRequest);
  } catch (error) {
    console.error("Error sending join request:", error);
    return res.status(500).json({ message: "Failed to send join request" });
  }
}

export async function getEventJoinRequests(req, res) {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.hostId.toString() !== userId) {
      return res.status(403).json({
        message: "Only the event host can view join requests",
      });
    }

    const joinRequests = await JoinRequest.find({ eventId })
      .populate("userId", "name email avatar")
      .sort({ requestedAt: -1 });

    return res.json(joinRequests);
  } catch (error) {
    console.error("Error getting join requests:", error);
    return res.status(500).json({ message: "Failed to get join requests" });
  }
}

export async function updateJoinRequestStatus(req, res) {
  try {
    const { eventId, requestId } = req.params;
    const userId = req.user.id;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Status must be either approved or rejected" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    await updateEventStatus(eventId);

    const updatedEvent = await Event.findById(eventId);

    if (updatedEvent.status === "completed") {
      return res.status(400).json({ message: "Event has already completed" });
    }

    if (
      updatedEvent.endDateTime &&
      new Date(updatedEvent.endDateTime) < new Date()
    ) {
      return res.status(400).json({ message: "Event has already completed" });
    }

    if (event.hostId.toString() !== userId) {
      return res.status(403).json({
        message: "Only the event host can update join requests",
      });
    }

    const joinRequest = await JoinRequest.findOne({ _id: requestId, eventId });

    if (!joinRequest) {
      return res.status(404).json({ message: "Join request not found" });
    }

    if (joinRequest.status !== "pending") {
      return res.status(400).json({
        message: "This request has already been processed",
      });
    }

    if (status === "approved") {
      if (
        event.capacity &&
        Array.isArray(event.participants) &&
        event.participants.length >= event.capacity
      ) {
        return res.status(400).json({ message: "Event is at full capacity" });
      }

      const alreadyParticipant = (event.participants || []).some(
        (pid) => String(pid) === String(joinRequest.userId),
      );

      if (!alreadyParticipant) {
        event.participants.push(joinRequest.userId);
        await event.save();
      }

      let member = await EventMember.findOne({
        eventId,
        userId: joinRequest.userId,
      });

      if (!member) {
        member = await EventMember.create({
          eventId,
          userId: joinRequest.userId,
          status: "attending",
          role:
            event.hostId.toString() === joinRequest.userId.toString()
              ? "host"
              : "member",
          joinedAt: new Date(),
        });
      } else {
        member.status = "attending";
        member.joinedAt = member.joinedAt || new Date();
        await member.save();
      }
    }

    joinRequest.status = status;
    joinRequest.respondedAt = new Date();
    await joinRequest.save();

    await createNotification(
      joinRequest.userId,
      "join-request-response",
      status === "approved" ? "Join Request Approved" : "Join Request Rejected",
      status === "approved"
        ? `Your request to join ${event.title} has been approved`
        : `Your request to join ${event.title} has been rejected`,
      { eventId: event._id, requestId: joinRequest._id },
    );

    return res.json(joinRequest);
  } catch (error) {
    console.error("Error updating join request:", error);
    return res.status(500).json({ message: "Failed to update join request" });
  }
}

export async function getUserJoinRequests(req, res) {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const query = { userId };

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status;
    }

    const joinRequests = await JoinRequest.find(query)
      .populate(
        "eventId",
        "title description eventDateTime endDateTime location",
      )
      .sort({ requestedAt: -1 });

    return res.json(joinRequests);
  } catch (error) {
    console.error("Error getting user join requests:", error);
    return res.status(500).json({ message: "Failed to get join requests" });
  }
}

export async function leaveEvent(req, res) {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const joinRequest = await JoinRequest.findOne({
      eventId,
      userId,
      status: "approved",
    });

    if (!joinRequest) {
      return res
        .status(400)
        .json({ message: "You are not a member of this event" });
    }

    await JoinRequest.findByIdAndDelete(joinRequest._id);

    await Event.updateOne(
      { _id: eventId },
      { $pull: { participants: userId } },
    );

    await EventMember.deleteOne({ eventId, userId });

    if (event.hostId.toString() !== userId) {
      try {
        const leavingUser = await User.findById(userId)
          .select("username name")
          .lean();
        const displayName =
          leavingUser?.name || leavingUser?.username || "A member";

        await createNotification(
          event.hostId,
          "event-update",
          "Member Left Event",
          `${displayName} has left your event: ${event.title}`,
          { eventId: event._id, userId: userId, action: "member-left-event" },
        );
      } catch (notifyErr) {
        console.warn("Failed to send leave notification:", notifyErr.message);
      }
    }

    return res.status(200).json({ message: "You have left the event" });
  } catch (error) {
    console.error("Error leaving event:", error);
    return res.status(500).json({ message: "Failed to leave event" });
  }
}
