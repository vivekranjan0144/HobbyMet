import {
  Box,
  Typography,
  Modal,
  Stack,
  Button,
  IconButton,
  TextField,
  Chip,
  CircularProgress,
  useTheme,
  Divider,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import UploadIcon from "@mui/icons-material/Upload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import GroupIcon from "@mui/icons-material/Group";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import SendIcon from "@mui/icons-material/Send";
import StarIcon from "@mui/icons-material/Star";
import { useAuth } from "../../context/AuthContext";

import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { EventAPI } from "../../api/event.api";

import { getSocket } from "../../utils/socket";

import MenuItem from "@mui/material/MenuItem";

import RateEventModal from "./RateEventModal";
import { useHobbies } from "../../context/HobbyContext";
import { getHobbiesByCategory } from "../../api/hobby.api";
import MapPicker from "../../components/map/MapPicker";
import AddLocationAltIcon from "@mui/icons-material/AddLocationAlt";
import MyLocationIcon from "@mui/icons-material/MyLocation";

import { useRef } from "react";

const Section = ({ title, children }) => (
  <Box
    sx={{
      p: 2,
      borderRadius: "1rem",
      bgcolor: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.12)",
      mb: 2,
    }}
  >
    <Typography fontWeight={700} mb={1}>
      {title}
    </Typography>
    {children}
  </Box>
);

const InfoRow = ({ icon, label, value }) => (
  <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
    <span>{icon}</span>
    <Typography fontWeight={600}>{label}:</Typography>
    <Typography sx={{ opacity: 0.85 }}>{value}</Typography>
  </Stack>
);

const primaryBtn = {
  borderRadius: "999px",
  textTransform: "none",
  fontWeight: 600,
};

export default function ViewEventPopup({
  open,
  onClose,
  eventId,
  onUpdated,
  initialTab = null,
  viewOnly = false,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState("");
  const [tag, setTag] = useState("");
  const { categories } = useHobbies();

  const [hobbies, setHobbies] = useState([]);
  const { user } = useAuth();

  const [uploading, setUploading] = useState(false);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [requestsLoaded, setRequestsLoaded] = useState(false);

  const [joinReqLoading, setJoinReqLoading] = useState(false);
  const [joinReqSent, setJoinReqSent] = useState(false);

  const [openRateModal, setOpenRateModal] = useState(false);
  const [loadingHobbies, setLoadingHobbies] = useState(false);

  const [decidingId, setDecidingId] = useState(null);
  const [removingUserId, setRemovingUserId] = useState(null);

  const [chatMessages, setChatMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoaded, setChatLoaded] = useState(false);
  const [chatError, setChatError] = useState("");
  const typingTimeoutRef = useRef(null);

  const [unreadCount, setUnreadCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const joinedRoomRef = useRef(null);
  const chatFetchRef = useRef(false);
  const [showMap, setShowMap] = useState(false);
  const [addressQuery, setAddressQuery] = useState("");

  const [addressResults, setAddressResults] = useState([]);
  const [loadingAddress, setLoadingAddress] = useState(false);

  const computeRoleFlags = (userId, ev) => {
    if (!userId || !ev) {
      setIsHost(false);
      setIsParticipant(false);
      return;
    }

    const host = ev.hostId;
    const hostId = typeof host === "object" && host !== null ? host._id : host;
    setIsHost(hostId && String(hostId) === String(userId));

    const participants = ev.participants || [];
    const joined = participants.some((p) => {
      if (typeof p === "string") return String(p) === String(userId);
      if (typeof p === "object" && p !== null)
        return String(p._id) === String(userId);
      return false;
    });
    setIsParticipant(joined);
  };
  const chatContainerRef = useRef(null);

  const resetState = () => {
    setEvent(null);
    setForm({});
    setMsg("");
    setTag("");
    setUploading(false);
    setIsHost(false);
    setIsParticipant(false);

    setRequests([]);
    setLoadingRequests(false);
    setShowRequests(false);
    setRequestsLoaded(false);

    setJoinReqLoading(false);

    setDecidingId(null);
    setRemovingUserId(null);
    setEditing(false);

    setChatMessages([]);
    setChatLoading(false);
    setChatSending(false);
    setChatInput("");
    setChatLoaded(false);
    setChatError("");
    chatFetchRef.current = false;
    joinedRoomRef.current = null;
  };

  const handleClose = useCallback(() => {
    resetState();
    if (typeof onClose === "function") {
      onClose();
    }
  }, [onClose]);

  const init = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setMsg("");
    try {
      if (!user) return;
      const data = await EventAPI.getEvent(eventId);
      const uid = user.id || user._id;

      setCurrentUserId(uid);

      if (data && data._id) {
        setEvent(data);
        setForm(data);
        setAddressQuery(data.location?.address || "");

        computeRoleFlags(uid, data);

        const myPendingRequest = data.joinRequests?.find(
          (r) =>
            String(typeof r.userId === "object" ? r.userId._id : r.userId) ===
              String(uid) && r.status === "pending",
        );

        setJoinReqSent(!!myPendingRequest);

        setJoinReqLoading(false);

        setChatMessages([]);
        setChatLoaded(false);
        setChatError("");
      } else {
        throw new Error("Invalid event data received");
      }
    } catch (err) {
      console.error("Failed to load event:", err);
      const errorMsg = err?.message || "❌ Failed to load event";
      setMsg(errorMsg);

      if (err?.status === 404) {
        setMsg("❌ Event not found. It may have been deleted.");
      } else if (err?.status === 403) {
        setMsg("❌ You don't have permission to view this event.");
      }
    } finally {
      setLoading(false);
    }
  }, [eventId, onClose]);

  const fetchRequests = useCallback(async () => {
    if (!eventId || !isHost) return;
    setLoadingRequests(true);
    try {
      const res = await EventAPI.listJoinRequests(eventId);
      const list = Array.isArray(res) ? res : res.requests || [];
      setRequests(list);
      setRequestsLoaded(true);
    } catch (err) {
      console.error("Failed to fetch join requests:", err);
      setMsg(err?.message || "❌ Failed to load join requests");
    } finally {
      setLoadingRequests(false);
    }
  }, [eventId, isHost]);

  const loadChat = useCallback(async () => {
    if (!eventId) return;
    if (chatFetchRef.current) return;

    chatFetchRef.current = true;
    setChatLoading(true);
    setChatError("");
    try {
      const res = await EventAPI.getEventChat(eventId);
      const list = Array.isArray(res) ? res : res.messages || [];
      setChatMessages(list);
      setChatLoaded(true);
    } catch (err) {
      console.error("Failed to load chat:", err);
      setChatError(err?.message || "❌ Failed to load chat");
    } finally {
      setChatLoading(false);
    }
  }, [eventId]);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const addTag = () => {
    if (tag.trim() && !form.hobbyTags?.includes(tag.trim())) {
      setForm((f) => ({
        ...f,
        hobbyTags: [...(f.hobbyTags || []), tag.trim()],
      }));
      setTag("");
    }
  };
  const removeTag = (i) =>
    setForm((f) => ({
      ...f,
      hobbyTags: f.hobbyTags.filter((_, j) => j !== i),
    }));

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setMsg("");
    try {
      const { UploadAPI } = await import("../../api/upload.api");

      if (form.coverImage && form.coverImage.includes("cloudinary")) {
        const urlParts = form.coverImage.split("/");
        const publicIdWithExt = urlParts.slice(-2).join("/").split(".")[0];
        try {
          await UploadAPI.deleteFile(publicIdWithExt);
        } catch (delErr) {
          console.warn("Failed to delete old image:", delErr);
        }
      }
      const result = await UploadAPI.uploadFile(file, {
        folder: "hobbymet/events",
        resourceType: "image",
      });
      setForm((f) => ({ ...f, coverImage: result.url }));
      setMsg("✅ Image uploaded successfully");
    } catch (err) {
      console.error("Failed to upload image:", err);
      setMsg(err?.message || "❌ Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      await EventAPI.updateEvent(eventId, form);
      setMsg("✅ Event updated successfully!");
      setEditing(false);

      try {
        await init();
      } catch (refreshErr) {
        console.warn("Failed to refresh event after update:", refreshErr);
      }

      onUpdated?.();
    } catch (err) {
      console.error("Failed to update event:", err);
      setMsg(err?.message || "❌ Failed to update event");
    }
  };

  const handleLeave = async () => {
    try {
      const res = await EventAPI.leaveEvent(eventId);
      setMsg(res?.message || "✅ Left event successfully");
      await init();
      onUpdated?.();
    } catch (err) {
      console.error("Leave failed:", err);
      setMsg(err?.message || "❌ Failed to leave event");
    }
  };

  const handleSendJoinRequest = async () => {
    if (joinReqLoading || joinReqSent) return;
    const capacity = event?.capacity || 0;
    const participantsCount = event?.participants?.length || 0;
    const isFull = capacity > 0 && participantsCount >= capacity;
    if (isFull) {
      setMsg("⚠️ Event is already full. You cannot request to join.");
      return;
    }

    setJoinReqLoading(true);
    try {
      const res = await EventAPI.sendJoinRequest(
        eventId,
        "Hey! I’d love to join this event.",
      );
    } catch (err) {
      console.error("Join request failed:", err);
      if (err.status === 409) {
        setJoinReqSent(true);
        setMsg(err.message || "You already requested to join this event.");
      } else {
        setMsg(err?.message || "❌ Failed to send join request");
      }
    } finally {
      setJoinReqLoading(false);
    }
  };

  const handleCancelJoinRequest = async () => {
    if (joinReqLoading) return;

    setJoinReqLoading(true);
    try {
      const res = await EventAPI.cancelJoinRequest(eventId);
      setJoinReqSent(false);
      setMsg(res?.message || "Join request cancelled");
    } catch (err) {
      setMsg(err?.message || "Failed to cancel request");
    } finally {
      setJoinReqLoading(false);
    }
  };

  const handleDecideRequest = async (reqId, status) => {
    if (decidingId) return;
    setDecidingId(reqId);
    try {
      await EventAPI.decideJoinRequest(eventId, reqId, status);
      await fetchRequests();
      await init();
      onUpdated?.();
      setMsg(`✅ Request ${status} successfully`);
    } catch (err) {
      console.error("Failed to update join request:", err);
      setMsg(err?.message || "❌ Failed to update join request");
    } finally {
      setDecidingId(null);
    }
  };

  const searchAddress = async (query) => {
    if (!query || query.length < 3) {
      setAddressResults([]);
      return;
    }

    try {
      setLoadingAddress(true);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query,
        )}&format=json&addressdetails=1&limit=8`,
      );

      const data = await res.json();
      setAddressResults(data || []);
    } catch (err) {
      console.error("Address search failed", err);
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleRemoveParticipant = async (userId) => {
    if (!userId || removingUserId) return;
    setRemovingUserId(userId);
    try {
      const res = await EventAPI.removeParticipant(eventId, userId);
      setMsg(res?.message || "✅ Participant removed");
      await init();
      onUpdated?.();
    } catch (err) {
      console.error("Failed to remove participant:", err);
      setMsg(err?.message || "❌ Failed to remove participant");
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleSendMessage = () => {
    const socket = getSocket();
    if (!socket || !socket.connected) return;
    if (!chatInput.trim()) return;

    socket.emit(
      "message:send",
      {
        eventId,
        text: chatInput.trim(),
        attachments: [],
      },
      (res) => {
        if (!res?.ok) {
          console.error(res?.message);
        }
      },
    );

    setChatInput("");

    socket.emit("typing:stop", { eventId });
  };

  useEffect(() => {
    if (open && eventId) {
      resetState();
      init();
    }
  }, [open, eventId]);

  useEffect(() => {
    if (showRequests && isHost && !requestsLoaded) {
      fetchRequests();
    }
  }, [showRequests, isHost]);

  useEffect(() => {
    if (!form.category) {
      setHobbies([]);
      return;
    }

    let cancelled = false;
    setLoadingHobbies(true);

    getHobbiesByCategory(form.category)
      .then((list) => {
        if (!cancelled) {
          setHobbies(Array.isArray(list) ? list : []);
        }
      })
      .catch(() => {
        if (!cancelled) setHobbies([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingHobbies(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.category]);

  useEffect(() => {
    if (open && initialTab) {
      if (initialTab === "requests" && isHost) {
        setShowRequests(true);
      } else if (initialTab === "chat" || initialTab === "reviews") {
        setTimeout(() => {
          const elementId =
            initialTab === "chat"
              ? "event-chat-section"
              : "event-reviews-section";
          const element = document.getElementById(elementId);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 300);
      }
    }
  }, [open, initialTab, isHost]);

  useEffect(() => {
    if (!open || !eventId || !(isHost || isParticipant)) return;

    if (!chatLoaded) {
      loadChat();
    }

    const socket = getSocket();
    if (!socket) return;

    socket.emit(
      "message:send",
      {
        eventId,

        attachments: [],
      },
      (res) => {
        if (!res?.ok) {
          console.error(res?.message);
        }
      },
    );

    const joinRoom = () => {
      if (!socket.connected) return;
      if (joinedRoomRef.current !== eventId) {
        socket.emit("join", eventId);
        joinedRoomRef.current = eventId;
      }
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.once("connect", joinRoom);
      socket.connect();
    }

    const handleNewMessage = (msg) => {
      const msgEventId =
        typeof msg.eventId === "object" ? msg.eventId._id : msg.eventId;

      if (String(msgEventId) !== String(eventId)) return;

      setChatMessages((prev) =>
        prev.some((m) => m._id === msg._id) ? prev : [...prev, msg],
      );

      if (!isAtBottom) {
        setUnreadCount((c) => c + 1);
      } else {
        setTimeout(() => {
          const el = chatContainerRef.current;
          if (el) {
            el.scrollTop = el.scrollHeight;
          }
        }, 50);
      }
    };

    const handleTypingStart = ({ userId, eventId: eid }) => {
      if (String(eid) !== String(eventId)) return;
      if (!userId || userId === currentUserId) return;

      setTypingUsers((prev) =>
        prev.includes(userId) ? prev : [...prev, userId],
      );
    };

    const handleTypingStop = ({ userId, eventId: eid }) => {
      if (String(eid) !== String(eventId)) return;
      setTypingUsers((prev) => prev.filter((id) => id !== userId));
    };

    socket.on("message:new", handleNewMessage);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);

      if (socket.connected) {
        socket.emit("leave", eventId);
      }
    };
  }, [open, eventId, currentUserId]);

  const capacity = event?.capacity || 0;
  const participantsCount = event?.participants?.length || 0;
  const isFull = capacity > 0 && participantsCount >= capacity;

  const host = event?.hostId;
  const hostId = typeof host === "object" && host !== null ? host._id : host;
  const hostName =
    typeof host === "object" && host !== null
      ? host.name || host.username || "Host"
      : "Host";

  if (!open || !eventId) return null;
  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        keepMounted={false}
        disableRestoreFocus
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "92%",
            maxWidth: 750,
            p: 0,
            borderRadius: "1.6rem",
            overflow: "hidden",
            background: isDark
              ? "linear-gradient(135deg, rgba(30,25,50,0.95), rgba(10,5,20,0.9))"
              : "#fff",
            maxHeight: "92vh",
            overflowY: "auto",
            boxShadow: "0 25px 60px rgba(0,0,0,0.45)",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              px: 3,
              py: 2,
              borderBottom: isDark
                ? "1px solid rgba(255,255,255,0.1)"
                : "1px solid rgba(0,0,0,0.1)",
            }}
          >
            <Typography
              variant="h6"
              fontWeight={800}
              sx={{
                background:
                  "linear-gradient(90deg,#c7b3ff,#a78bfa,#7c4dff,#5d2eff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {editing ? "Edit Event" : "Event Details"}
            </Typography>

            <Stack direction="row" spacing={1}>
              {editing && (
                <IconButton
                  type="button"
                  onClick={() => setEditing(false)}
                  color="inherit"
                >
                  <ArrowBackIcon />
                </IconButton>
              )}
              <IconButton type="button" onClick={handleClose} color="inherit">
                <CloseIcon />
              </IconButton>
            </Stack>
          </Stack>

          <Box
            sx={{
              p: 3,
              maxHeight: "80vh",
              overflowY: "auto",
              bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": {
                display: "none",
              },
              WebkitOverflowScrolling: "touch",
            }}
          >
            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: 250,
                }}
              >
                <CircularProgress />
              </Box>
            ) : event ? (
              <Stack spacing={2}>
                {form.coverImage && (
                  <Box sx={{ position: "relative", height: 260 }}>
                    <img
                      src={form.coverImage}
                      alt="cover"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />

                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.75), transparent)",
                        display: "flex",
                        alignItems: "flex-end",
                        p: 2,
                      }}
                    >
                      <Typography variant="h5" fontWeight={800} color="#fff">
                        {event.title}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {msg && (
                  <Typography
                    textAlign="center"
                    fontWeight={600}
                    sx={{
                      color: msg.startsWith("✅") ? "green" : "red",
                    }}
                  >
                    {msg}
                  </Typography>
                )}

                {editing ? (
                  <>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Button
                        type="button"
                        variant="outlined"
                        component="label"
                        startIcon={<UploadIcon />}
                      >
                        {uploading ? "Uploading..." : "Change Cover"}
                        <input
                          hidden
                          accept="image/*"
                          type="file"
                          onChange={handleCoverUpload}
                        />
                      </Button>
                      {form.coverImage && (
                        <IconButton
                          type="button"
                          color="error"
                          onClick={() =>
                            setForm((f) => ({ ...f, coverImage: "" }))
                          }
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      )}
                    </Stack>

                    <TextField
                      label="Title"
                      name="title"
                      value={form.title || ""}
                      onChange={handleChange}
                      fullWidth
                    />
                    <TextField
                      label="Description"
                      name="description"
                      multiline
                      rows={3}
                      value={form.description || ""}
                      onChange={handleChange}
                      fullWidth
                    />
                    <TextField
                      label="Event Rules"
                      name="rules"
                      multiline
                      rows={3}
                      value={form.rules || ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          rules: e.target.value,
                        }))
                      }
                      fullWidth
                    />
                    <TextField
                      select
                      label="Category *"
                      value={form.category || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((f) => ({
                          ...f,
                          category: val,
                          hobbyTags: [],
                        }));
                        setHobbies([]);
                      }}
                      fullWidth
                      SelectProps={{
                        MenuProps: {
                          PaperProps: {
                            sx: {
                              mt: 0.5,
                              borderRadius: 2,
                              maxHeight: 280,
                              overflowY: "auto",
                            },
                          },
                        },
                      }}
                    >
                      {categories.map((c) => (
                        <MenuItem key={c.slug} value={c.slug}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </TextField>

                    <Stack spacing={1}>
                      <TextField
                        select
                        label="Hobby Tags *"
                        value=""
                        fullWidth
                        InputLabelProps={{
                          shrink: true,
                        }}
                        SelectProps={{
                          displayEmpty: true,
                          renderValue: () => "Select hobbies",
                          MenuProps: {
                            PaperProps: {
                              sx: {
                                mt: 0.5,
                                borderRadius: 2,
                                maxHeight: 280,
                                overflowY: "auto",
                              },
                            },
                          },
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!form.hobbyTags.includes(val)) {
                            setForm((f) => ({
                              ...f,
                              hobbyTags: [...f.hobbyTags, val],
                            }));
                          }
                        }}
                      >
                        {hobbies.map((h) => (
                          <MenuItem key={h._id} value={h.name}>
                            {h.name}
                          </MenuItem>
                        ))}
                      </TextField>

                      {form.hobbyTags.length > 0 && (
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ flexWrap: "wrap" }}
                        >
                          {form.hobbyTags.map((tag, i) => (
                            <Chip
                              key={i}
                              label={tag}
                              onDelete={() =>
                                setForm((f) => ({
                                  ...f,
                                  hobbyTags: f.hobbyTags.filter(
                                    (_, idx) => idx !== i,
                                  ),
                                }))
                              }
                            />
                          ))}
                        </Stack>
                      )}
                    </Stack>

                    <Divider />

                    <Stack direction="row" spacing={2}>
                      <TextField
                        label="Start Time"
                        type="datetime-local"
                        name="eventDateTime"
                        value={form.eventDateTime?.slice(0, 16) || ""}
                        onChange={handleChange}
                        fullWidth
                      />
                      <TextField
                        label="End Time"
                        type="datetime-local"
                        name="endDateTime"
                        value={form.endDateTime?.slice(0, 16) || ""}
                        onChange={handleChange}
                        fullWidth
                      />
                    </Stack>
                    <TextField
                      label="Address *"
                      value={addressQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAddressQuery(val);
                        searchAddress(val);

                        setForm((f) => ({
                          ...f,
                          location: {
                            ...(f.location || {}),
                            address: val,
                          },
                        }));
                      }}
                      InputProps={{
                        endAdornment: loadingAddress ? (
                          <CircularProgress size={18} />
                        ) : null,
                      }}
                    />
                    {addressResults.length > 0 && (
                      <Paper sx={{ mt: 1, maxHeight: 220, overflow: "auto" }}>
                        {addressResults.map((item) => (
                          <Box
                            key={item.place_id}
                            sx={{
                              px: 2,
                              py: 1,
                              cursor: "pointer",
                              "&:hover": { background: "rgba(0,0,0,0.05)" },
                            }}
                            onClick={() => {
                              setAddressQuery(item.display_name);
                              setAddressResults([]);

                              setForm((f) => ({
                                ...f,
                                location: {
                                  type: "Point",
                                  coordinates: [
                                    Number(item.lon),
                                    Number(item.lat),
                                  ],
                                  address: item.display_name,
                                },
                              }));
                            }}
                          >
                            {item.display_name}
                          </Box>
                        ))}
                      </Paper>
                    )}

                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        startIcon={<AddLocationAltIcon />}
                        onClick={() => setShowMap(true)}
                      >
                        Select on Map
                      </Button>

                      <Button
                        variant="outlined"
                        startIcon={<MyLocationIcon />}
                        onClick={() =>
                          navigator.geolocation.getCurrentPosition(
                            async (pos) => {
                              const { latitude, longitude } = pos.coords;

                              let fullAddress = "Current Location";

                              try {
                                const res = await fetch(
                                  `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                                );
                                const data = await res.json();
                                fullAddress = data?.display_name || fullAddress;
                              } catch (err) {
                                console.warn("Reverse geocoding failed");
                              }

                              setForm((f) => ({
                                ...f,
                                location: {
                                  type: "Point",
                                  coordinates: [longitude, latitude],
                                  address: fullAddress,
                                },
                              }));

                              setAddressQuery(fullAddress);
                            },
                          )
                        }
                      >
                        Use Current
                      </Button>
                    </Stack>

                    <TextField
                      label="Max Capacity"
                      value={form.capacity || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setForm((f) => ({ ...f, capacity: "" }));
                          return;
                        }
                        const num = Number(val);
                        if (!Number.isInteger(num) || num < 1) return;
                        setForm((f) => ({ ...f, capacity: num }));
                      }}
                      onWheel={(e) => e.target.blur()}
                      type="text"
                      inputProps={{
                        inputMode: "numeric",
                        pattern: "[0-9]*",
                      }}
                      fullWidth
                    />

                    <TextField
                      label="Visibility"
                      name="visibility"
                      value={form.visibility || "public"}
                      onChange={handleChange}
                      select
                      SelectProps={{ native: true }}
                      fullWidth
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </TextField>
                    <TextField
                      label="Status"
                      name="status"
                      value={form.status || "active"}
                      onChange={handleChange}
                      select
                      SelectProps={{ native: true }}
                      fullWidth
                    >
                      <option value="active">Active</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                    </TextField>

                    <Button
                      type="button"
                      fullWidth
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      sx={{
                        mt: 2,
                        py: 1.2,
                        borderRadius: "8rem",
                        background:
                          "linear-gradient(90deg,#a78bfa,#7c4dff,#5d2eff)",
                      }}
                    >
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <>
                    <Typography variant="h5" fontWeight={700}>
                      {event.title}
                    </Typography>

                    {hostId && (
                      <Typography
                        variant="body2"
                        component={Link}
                        to={`/users/${hostId}`}
                        sx={{
                          mb: 0.5,
                          fontSize: "0.9rem",
                          opacity: 0.85,
                          textDecoration: "none",
                          color: "inherit",
                          "&:hover": {
                            textDecoration: "underline",
                          },
                        }}
                      >
                        by {hostName}
                      </Typography>
                    )}

                    <Section title="📄 Event Info">
                      <Typography sx={{ opacity: 0.85 }}>
                        {event.description}
                      </Typography>

                      <Box sx={{ mt: 2 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700 }}
                        >
                          📜 Event Rules
                        </Typography>

                        <Typography
                          sx={{ opacity: 0.85, whiteSpace: "pre-line" }}
                        >
                          {event.rules}
                        </Typography>
                      </Box>
                    </Section>

                    <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                      {event.category && (
                        <Chip label={event.category} color="secondary" />
                      )}
                      {event.visibility && <Chip label={event.visibility} />}
                      {event.status && (
                        <Chip label={event.status} color="success" />
                      )}
                    </Stack>

                    <Typography sx={{ mt: 1.5 }}>
                      <strong>🕒 Start:</strong>{" "}
                      {event.eventDateTime &&
                        new Date(event.eventDateTime).toLocaleString()}
                    </Typography>
                    {event.endDateTime && (
                      <Typography>
                        <strong>🕓 End:</strong>{" "}
                        {new Date(event.endDateTime).toLocaleString()}
                      </Typography>
                    )}

                    <Section title="📍 Location & Time">
                      <InfoRow
                        icon="🕒"
                        label="Start"
                        value={new Date(event.eventDateTime).toLocaleString()}
                      />

                      {event.endDateTime && (
                        <InfoRow
                          icon="🕓"
                          label="End"
                          value={new Date(event.endDateTime).toLocaleString()}
                        />
                      )}

                      <InfoRow
                        icon="📍"
                        label="Address"
                        value={event.location?.address || "Not provided"}
                      />
                    </Section>

                    <Typography>
                      <strong>👥 Capacity:</strong>{" "}
                      {capacity
                        ? `${participantsCount}/${capacity}`
                        : "Not set"}
                    </Typography>

                    <Typography>
                      <strong>🎯 Tags:</strong>{" "}
                      {event.hobbyTags?.map((t, i) => (
                        <Chip
                          key={i}
                          label={t}
                          size="small"
                          sx={{ mr: 0.5, mt: 0.5 }}
                        />
                      ))}
                    </Typography>

                    <Stack
                      id="event-reviews-section"
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1.5}
                      mt={2.5}
                    >
                      {(isHost || isParticipant) &&
                        (event?.status === "completed" ||
                          (event?.endDateTime &&
                            new Date(event.endDateTime) < new Date())) && (
                          <Button
                            variant="contained"
                            color="warning"
                            startIcon={<StarIcon />}
                            onClick={() => setOpenRateModal(true)}
                            sx={{
                              borderRadius: "2rem",
                              textTransform: "none",
                              background:
                                "linear-gradient(90deg, #FFC107, #FF9800)",
                              color: "#000",
                              fontWeight: "bold",
                            }}
                          >
                            Rate
                          </Button>
                        )}

                      {isHost && !viewOnly && (
                        <>
                          <Button
                            type="button"
                            fullWidth
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => setEditing(true)}
                            sx={{
                              py: 1.1,
                              borderRadius: "8rem",
                              color: "#fff",
                              background:
                                "linear-gradient(90deg,#a78bfa,#7c4dff,#5d2eff)",
                            }}
                          >
                            Edit Event
                          </Button>

                          <Button
                            type="button"
                            fullWidth
                            variant="contained"
                            startIcon={<GroupIcon />}
                            onClick={() => setShowRequests((prev) => !prev)}
                            sx={{
                              py: 1.1,
                              borderRadius: "8rem",
                              textTransform: "none",
                            }}
                          >
                            {showRequests
                              ? "Hide Join Requests"
                              : "Manage Join Requests"}
                          </Button>
                        </>
                      )}

                      {!isHost && currentUserId && !viewOnly && (
                        <>
                          {isParticipant ? (
                            <Button
                              type="button"
                              fullWidth
                              variant="contained"
                              startIcon={<LogoutIcon />}
                              onClick={handleLeave}
                              sx={{
                                py: 1.1,
                                borderRadius: "8rem",
                                textTransform: "none",
                                background:
                                  "linear-gradient(90deg,#f97373,#ef4444,#b91c1c)",
                              }}
                            >
                              Leave Event
                            </Button>
                          ) : joinReqSent ? (
                            <Button
                              fullWidth
                              startIcon={<PersonRemoveIcon />}
                              onClick={handleCancelJoinRequest}
                              disabled={joinReqLoading}
                              sx={{
                                py: 1.2,
                                borderRadius: "999px",
                                textTransform: "none",
                                fontWeight: 700,
                                background:
                                  "linear-gradient(90deg,#f97373,#ef4444,#b91c1c)",
                                color: "#fff",
                                boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                              }}
                            >
                              {joinReqLoading
                                ? "Cancelling..."
                                : "Cancel Request"}
                            </Button>
                          ) : (
                            <Button
                              fullWidth
                              startIcon={<PersonAddAlt1Icon />}
                              onClick={handleSendJoinRequest}
                              disabled={joinReqLoading || isFull}
                              sx={{
                                py: 1.2,
                                borderRadius: "999px",
                                textTransform: "none",
                                fontWeight: 700,
                                background:
                                  "linear-gradient(90deg,#38bdf8,#6366f1)",
                                color: "#fff",
                                boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                              }}
                            >
                              {isFull
                                ? "Event Full"
                                : joinReqLoading
                                  ? "Sending..."
                                  : "Request to Join"}
                            </Button>
                          )}
                        </>
                      )}

                      {viewOnly && !isHost && (
                        <Box
                          sx={{
                            mt: 2,
                            p: 2,
                            borderRadius: "1rem",
                            bgcolor: isDark
                              ? "rgba(255,0,0,0.1)"
                              : "rgba(255,0,0,0.05)",
                            border: "1px solid",
                            borderColor: "error.main",
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ color: "error.main", fontWeight: 500 }}
                          >
                            ⚠️ You are no longer a member of this event. You can
                            view event details but cannot access member-only
                            features.
                          </Typography>
                        </Box>
                      )}
                    </Stack>

                    {isHost && showRequests && !viewOnly && (
                      <Box
                        id="event-requests-section"
                        sx={{
                          mt: 3,
                          p: 2,
                          borderRadius: "1rem",
                          border: "1px solid rgba(255,255,255,0.15)",
                          bgcolor: isDark
                            ? "rgba(0,0,0,0.35)"
                            : "rgba(255,255,255,0.9)",
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          sx={{ mb: 1.5, display: "flex", gap: 1 }}
                        >
                          <GroupIcon fontSize="small" /> Join Requests
                        </Typography>

                        {loadingRequests ? (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "center",
                              py: 2,
                            }}
                          >
                            <CircularProgress size={24} />
                          </Box>
                        ) : requests.length === 0 ? (
                          <Typography sx={{ opacity: 0.8 }}>
                            No join requests yet.
                          </Typography>
                        ) : (
                          <Stack spacing={1.5}>
                            {requests.map((r) => {
                              const requestUserId = r.userId?._id;

                              return (
                                <Box
                                  key={r._id}
                                  sx={{
                                    p: 1.3,
                                    borderRadius: "0.75rem",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    bgcolor: isDark
                                      ? "rgba(255,255,255,0.04)"
                                      : "rgba(0,0,0,0.02)",
                                  }}
                                >
                                  <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    mb={0.5}
                                  >
                                    <Stack
                                      direction="row"
                                      spacing={1}
                                      alignItems="center"
                                    >
                                      <Chip
                                        size="small"
                                        label={(r.userId?.name || "U")[0]}
                                        color="primary"
                                      />

                                      <Typography
                                        component={Link}
                                        to={`/users/${r.userId?._id}`}
                                        sx={{
                                          fontWeight: 700,
                                          textDecoration: "none",
                                          color: "inherit",
                                        }}
                                      >
                                        {r.userId?.name || r.userId?.username}
                                      </Typography>
                                    </Stack>

                                    <Chip
                                      size="small"
                                      label={
                                        r.status
                                          ? r.status.toUpperCase()
                                          : "PENDING"
                                      }
                                      color={
                                        r.status === "approved"
                                          ? "success"
                                          : r.status === "rejected"
                                            ? "error"
                                            : "warning"
                                      }
                                    />
                                  </Stack>

                                  {r.message && (
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        opacity: 0.85,
                                        mb: 0.5,
                                      }}
                                    >
                                      “{r.message}”
                                    </Typography>
                                  )}

                                  <Typography
                                    variant="caption"
                                    sx={{ opacity: 0.7 }}
                                  >
                                    Requested at:{" "}
                                    {r.requestedAt &&
                                      new Date(r.requestedAt).toLocaleString()}
                                  </Typography>

                                  {r.status === "pending" && (
                                    <Stack direction="row" spacing={1} mt={1}>
                                      <Button
                                        type="button"
                                        size="small"
                                        variant="contained"
                                        startIcon={<CheckIcon />}
                                        onClick={() =>
                                          handleDecideRequest(r._id, "approved")
                                        }
                                        disabled={
                                          decidingId === r._id || isFull
                                        }
                                        sx={{
                                          borderRadius: "999px",
                                          textTransform: "none",
                                          px: 2,
                                          py: 0.4,
                                        }}
                                      >
                                        {isFull
                                          ? "Event Full"
                                          : decidingId === r._id
                                            ? "Saving..."
                                            : "Approve"}
                                      </Button>
                                      <Button
                                        type="button"
                                        size="small"
                                        variant="outlined"
                                        color="error"
                                        startIcon={<ClearIcon />}
                                        onClick={() =>
                                          handleDecideRequest(r._id, "rejected")
                                        }
                                        disabled={decidingId === r._id}
                                        sx={{
                                          borderRadius: "999px",
                                          textTransform: "none",
                                          px: 2,
                                          py: 0.4,
                                        }}
                                      >
                                        {decidingId === r._id
                                          ? "Saving..."
                                          : "Reject"}
                                      </Button>
                                    </Stack>
                                  )}
                                </Box>
                              );
                            })}
                          </Stack>
                        )}
                      </Box>
                    )}

                    {(isHost || isParticipant) && (
                      <Box
                        sx={{
                          mt: 3,
                          p: 2,
                          borderRadius: "1rem",
                          border: "1px solid rgba(255,255,255,0.15)",
                          bgcolor: isDark
                            ? "rgba(0,0,0,0.35)"
                            : "rgba(255,255,255,0.9)",
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          sx={{ mb: 1.5, display: "flex", gap: 1 }}
                        >
                          <GroupIcon fontSize="small" /> Participants (
                          {participantsCount})
                        </Typography>

                        {participantsCount === 0 ? (
                          <Typography sx={{ opacity: 0.8 }}>
                            No participants yet.
                          </Typography>
                        ) : (
                          <Stack spacing={1}>
                            {event.participants.map((p) => {
                              const uid =
                                typeof p === "object" && p !== null ? p._id : p;
                              const label =
                                typeof p === "object" && p !== null
                                  ? p.name || p.username || "User"
                                  : "User";

                              const rawHostId = event.hostId;
                              const hostIdForCompare =
                                typeof rawHostId === "object" &&
                                rawHostId !== null
                                  ? rawHostId._id
                                  : rawHostId;

                              const canRemove =
                                isHost &&
                                String(uid) !== String(hostIdForCompare);

                              return (
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  justifyContent="space-between"
                                  sx={{
                                    p: 1.2,
                                    borderRadius: "1rem",
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    bgcolor: "rgba(255,255,255,0.04)",
                                    mb: 1,
                                    transition: "0.2s",
                                    "&:hover": {
                                      transform: "scale(1.01)",
                                      boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                                    },
                                  }}
                                >
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                  >
                                    <Box
                                      sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: "50%",
                                        bgcolor: "primary.main",
                                        color: "#fff",
                                        fontWeight: 700,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      {label.charAt(0).toUpperCase()}
                                    </Box>

                                    <Stack spacing={0}>
                                      <Typography
                                        component={Link}
                                        to={`/users/${uid}`}
                                        sx={{
                                          fontWeight: 700,
                                          textDecoration: "none",
                                          color: "inherit",
                                          "&:hover": {
                                            textDecoration: "underline",
                                          },
                                        }}
                                      >
                                        {label}
                                      </Typography>

                                      {String(uid) === String(hostId) && (
                                        <Typography
                                          variant="caption"
                                          color="warning.main"
                                        >
                                          Host
                                        </Typography>
                                      )}
                                    </Stack>
                                  </Stack>

                                  {canRemove && (
                                    <Button
                                      type="button"
                                      size="small"
                                      variant="outlined"
                                      color="error"
                                      startIcon={<PersonRemoveIcon />}
                                      onClick={() =>
                                        handleRemoveParticipant(uid)
                                      }
                                      disabled={removingUserId === uid}
                                      sx={{
                                        borderRadius: "999px",
                                        textTransform: "none",
                                        px: 2,
                                        py: 0.3,
                                      }}
                                    >
                                      {removingUserId === uid
                                        ? "Removing..."
                                        : "Remove"}
                                    </Button>
                                  )}
                                </Stack>
                              );
                            })}
                          </Stack>
                        )}
                      </Box>
                    )}

                    {(isHost || isParticipant) && !viewOnly && (
                      <Box
                        id="event-chat-section"
                        sx={{
                          mt: 3,
                          p: 2,
                          borderRadius: "1rem",
                          border: "1px solid rgba(255,255,255,0.15)",
                          bgcolor: isDark
                            ? "rgba(0,0,0,0.5)"
                            : "rgba(255,255,255,0.95)",
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          sx={{ mb: 1.5, display: "flex", gap: 1 }}
                        >
                          💬 Event Chat
                        </Typography>

                        {chatError && (
                          <Typography
                            variant="body2"
                            sx={{ mb: 1, color: "red" }}
                          >
                            {chatError}
                          </Typography>
                        )}

                        <Box
                          ref={chatContainerRef}
                          sx={{
                            maxHeight: 240,
                            minHeight: 140,
                            overflowY: "auto",
                            mb: 1.5,
                            pr: 1,
                            position: "relative",
                          }}
                          onScroll={() => {
                            const el = chatContainerRef.current;
                            if (!el) return;

                            const nearBottom =
                              el.scrollHeight - el.scrollTop - el.clientHeight <
                              50;

                            setIsAtBottom(nearBottom);

                            if (nearBottom) {
                              setUnreadCount(0);
                            }
                          }}
                        >
                          {chatLoading ? (
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "center",
                                py: 2,
                              }}
                            >
                              <CircularProgress size={22} />
                            </Box>
                          ) : chatMessages.length === 0 ? (
                            <Typography variant="body2" sx={{ opacity: 0.75 }}>
                              No messages yet. Start the conversation!
                            </Typography>
                          ) : (
                            <Stack spacing={1}>
                              {chatMessages.map((m) => {
                                const senderId =
                                  typeof m.userId === "object" &&
                                  m.userId !== null
                                    ? m.userId._id
                                    : m.userId;
                                const isMine =
                                  currentUserId &&
                                  senderId &&
                                  String(senderId) === String(currentUserId);

                                const rawName =
                                  (m.userId &&
                                    (m.userId.name || m.userId.username)) ||
                                  "User";

                                const displayName = isMine ? "You" : rawName;

                                const isHostUser =
                                  hostId &&
                                  senderId &&
                                  String(senderId) === String(hostId);

                                const time = m.sentAt || m.createdAt || null;

                                const isDeleted = !!m.deletedAt;

                                return (
                                  <Stack
                                    key={m._id}
                                    direction="column"
                                    alignItems={
                                      isMine ? "flex-end" : "flex-start"
                                    }
                                  >
                                    <Stack
                                      direction="row"
                                      spacing={0.5}
                                      alignItems="center"
                                      justifyContent={
                                        isMine ? "flex-end" : "flex-start"
                                      }
                                      sx={{ mb: 0.2, px: 0.6 }}
                                    >
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontWeight: 800,
                                          letterSpacing: "0.3px",
                                          color: isMine
                                            ? "primary.main"
                                            : isHostUser
                                              ? "warning.main"
                                              : "text.secondary",
                                        }}
                                      >
                                        {displayName}
                                      </Typography>

                                      {isHostUser && !isMine && (
                                        <Chip
                                          size="small"
                                          label="HOST"
                                          color="warning"
                                          sx={{
                                            height: 16,
                                            fontSize: "0.6rem",
                                          }}
                                        />
                                      )}
                                    </Stack>

                                    <Box
                                      sx={{
                                        maxWidth: "80%",
                                        px: 1.6,
                                        py: 1,
                                        lineHeight: 1.4,
                                        borderRadius: isMine
                                          ? "1rem 1rem 0.25rem 1rem"
                                          : "1rem 1rem 1rem 0.25rem",
                                        bgcolor: isMine
                                          ? isDark
                                            ? "rgba(129,140,248,0.35)"
                                            : "rgba(129,140,248,0.15)"
                                          : isDark
                                            ? "rgba(15,23,42,0.8)"
                                            : "rgba(0,0,0,0.03)",
                                        opacity: isDeleted ? 0.6 : 1,
                                        boxShadow:
                                          "0 4px 14px rgba(0,0,0,0.25)",
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-word",
                                        overflowWrap: "anywhere",
                                      }}
                                    >
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          mt: 0.3,
                                          fontStyle: isDeleted
                                            ? "italic"
                                            : "normal",
                                        }}
                                      >
                                        {isDeleted ? "Message deleted" : m.text}
                                      </Typography>
                                      {time && (
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            display: "block",
                                            mt: 0.4,
                                            textAlign: isMine
                                              ? "right"
                                              : "left",
                                            opacity: 0.6,
                                            fontSize: "0.65rem",
                                          }}
                                        >
                                          {new Date(time).toLocaleTimeString(
                                            [],
                                            {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            },
                                          )}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Stack>
                                );
                              })}
                            </Stack>
                          )}
                        </Box>

                        {unreadCount > 0 && !isAtBottom && (
                          <Box
                            sx={{
                              position: "sticky",
                              bottom: 60,
                              display: "flex",
                              justifyContent: "center",
                              zIndex: 10,
                              mb: 0.5,
                            }}
                          >
                            <Box
                              sx={{
                                px: 2,
                                py: 0.6,
                                borderRadius: "999px",
                                bgcolor: "primary.main",
                                color: "#fff",
                                fontSize: "0.75rem",
                                cursor: "pointer",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                              }}
                              onClick={() => {
                                const el = chatContainerRef.current;
                                if (el) {
                                  el.scrollTop = el.scrollHeight;
                                }
                                setUnreadCount(0);
                                setIsAtBottom(true);
                              }}
                            >
                              ⬇ {unreadCount} new message
                              {unreadCount > 1 ? "s" : ""}
                            </Box>
                          </Box>
                        )}

                        {typingUsers.length > 0 && (
                          <Typography
                            variant="caption"
                            sx={{
                              ml: 1,
                              mb: 0.5,
                              fontStyle: "italic",
                              opacity: 0.7,
                            }}
                          >
                            Someone is typing...
                          </Typography>
                        )}

                        <Stack direction="row" spacing={1} alignItems="center">
                          <TextField
                            size="small"
                            placeholder="Type a message..."
                            value={chatInput}
                            onChange={(e) => {
                              setChatInput(e.target.value);

                              const socket = getSocket();
                              if (!socket || !socket.connected) return;

                              socket.emit("typing:start", { eventId });

                              if (typingTimeoutRef.current) {
                                clearTimeout(typingTimeoutRef.current);
                              }

                              typingTimeoutRef.current = setTimeout(() => {
                                socket.emit("typing:stop", { eventId });
                              }, 2000);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            sx={{ flex: 1 }}
                          />
                          <Button
                            type="button"
                            variant="contained"
                            onClick={handleSendMessage}
                            disabled={chatSending || !chatInput.trim()}
                            startIcon={<SendIcon />}
                            sx={{
                              borderRadius: "999px",
                              textTransform: "none",
                              px: 2.4,
                              py: 0.7,
                              background:
                                "linear-gradient(90deg,#a78bfa,#7c4dff,#5d2eff)",
                            }}
                          >
                            {chatSending ? "Sending..." : "Send"}
                          </Button>
                        </Stack>
                      </Box>
                    )}
                  </>
                )}
              </Stack>
            ) : (
              <Typography textAlign="center">No event found.</Typography>
            )}
          </Box>

          <RateEventModal
            open={openRateModal}
            onClose={() => setOpenRateModal(false)}
            event={event}
            currentUser={{ _id: currentUserId }}
          />
        </Box>
      </Modal>

      {showMap && (
        <MapPicker
          open={showMap}
          onClose={() => setShowMap(false)}
          onSelect={(coords, address) => {
            setForm((f) => ({
              ...f,
              location: {
                type: "Point",
                coordinates: coords,
                address,
              },
            }));
            setAddressQuery(address);
            setShowMap(false);
          }}
        />
      )}
    </>
  );
}
