import { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Typography,
  Stack,
  Rating,
  TextField,
  Button,
  Avatar,
  IconButton,
  useTheme,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EventIcon from "@mui/icons-material/Event";
import { ReviewAPI } from "../../api/review.api";

export default function RateEventModal({ open, onClose, event, currentUser }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [view, setView] = useState("list");
  const [ratingType, setRatingType] = useState("event");
  const [targetUser, setTargetUser] = useState(null);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isExisting, setIsExisting] = useState(false);

  const host = event?.hostId;
  const hostId = typeof host === "object" ? host._id : host;
  const currentId = currentUser?.id || currentUser?._id;

  const resetForm = () => {
    setRating(0);
    setComment("");
    setMsg("");
    setSuccessMsg("");
    setLoading(false);
    setIsExisting(false);
  };

  const [myReviews, setMyReviews] = useState([]);

  useEffect(() => {
    if (open && event && currentUser) {
      const fetchMyReviews = async () => {
        try {
          const res = await ReviewAPI.getEventReviews(event._id, {
            reviewerId: currentUser.id || currentUser._id,
            limit: 100,
          });
          if (res?.reviews) {
            setMyReviews(res.reviews);
          }
        } catch (err) {
          console.error("Failed to fetch my reviews:", err);
        }
      };
      fetchMyReviews();
    }
  }, [open, event, currentUser]);

  const getExistingReview = (targetId, type) => {
    return myReviews.find((r) => {
      if (type === "event") {
        return r.type === "event";
      }

      return (
        r.type === "user" &&
        (r.revieweeId._id === targetId || r.revieweeId === targetId)
      );
    });
  };

  const handleEventSelect = () => {
    setRatingType("event");
    setTargetUser(null);
    resetForm();

    const existing = getExistingReview(event._id, "event");
    if (existing) {
      setRating(existing.rating);
      setComment(existing.comment || "");
      setIsExisting(true);
    }

    setView("form");
  };

  const handleUserSelect = (u) => {
    setRatingType("user");
    setTargetUser(u);
    resetForm();

    const existing = getExistingReview(u._id, "user");
    if (existing) {
      setRating(existing.rating);
      setComment(existing.comment || "");
      setIsExisting(true);
    }

    setView("form");
  };

  const handleBack = () => {
    setView("list");
    resetForm();
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setMsg("Please select a star rating");
      return;
    }
    setLoading(true);
    setMsg("");
    setSuccessMsg("");

    try {
      const payload = {
        rating,
        comment,
        type: ratingType,
      };

      if (ratingType === "user" && targetUser) {
        payload.revieweeId = targetUser._id;
      }

      await ReviewAPI.addReview(event._id, payload);

      setSuccessMsg("Review submitted successfully!");
      setTimeout(() => {
        handleBack();
      }, 1500);
    } catch (err) {
      console.error(err);
      setMsg(
        err.response?.data?.message || err.message || "Failed to submit review",
      );
    } finally {
      setLoading(false);
    }
  };

  const getReviewableUsers = () => {
    if (!event || !currentUser) return [];

    const users = [];
    const host = event.hostId;
    const hostId = typeof host === "object" ? host._id : host;
    const currentId = currentUser.id || currentUser._id;

    if (
      hostId &&
      String(hostId) !== String(currentId) &&
      typeof host === "object"
    ) {
      users.push({
        ...host,
        role: "Host",
      });
    }

    if (event.participants) {
      event.participants.forEach((p) => {
        if (typeof p === "object" && p !== null) {
          if (
            String(p._id) !== String(currentId) &&
            String(p._id) !== String(hostId)
          ) {
            users.push({ ...p, role: "Member" });
          }
        }
      });
    }
    return users;
  };

  const reviewableUsers = getReviewableUsers();

  if (!open || !event) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          maxWidth: 480,
          bgcolor: isDark ? "#1e1e1e" : "#fff",
          boxShadow: 24,
          p: 3,
          borderRadius: 3,
          maxHeight: "90vh",
          overflowY: "auto",
          outline: "none",
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6" fontWeight="bold">
            {view === "list" ? "Rate & Review" : "Write Review"}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>

        {view === "list" ? (
          <Stack spacing={2}>
            {String(hostId) !== String(currentId) && (
              <Button
                variant="outlined"
                onClick={handleEventSelect}
                sx={{
                  justifyContent: "flex-start",
                  px: 2,
                  py: 1.5,
                  borderRadius: "1rem",
                  borderColor: isDark
                    ? "rgba(255,255,255,0.2)"
                    : "rgba(0,0,0,0.1)",
                  color: "inherit",
                  textTransform: "none",
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  width="100%"
                >
                  <Avatar
                    variant="rounded"
                    src={event.coverImage}
                    sx={{ bgcolor: "primary.main" }}
                  >
                    <EventIcon />
                  </Avatar>
                  <Box textAlign="left">
                    <Typography fontWeight="bold">
                      Rate Event: {event.title}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      Review the event organization
                    </Typography>
                  </Box>
                </Stack>
              </Button>
            )}

            <Typography
              variant="subtitle2"
              sx={{ mt: 1, opacity: 0.7, fontWeight: 700 }}
            >
              Participants
            </Typography>

            {reviewableUsers.length === 0 ? (
              <Typography
                variant="body2"
                sx={{ opacity: 0.6, fontStyle: "italic" }}
              >
                No other participants to rate.
              </Typography>
            ) : (
              reviewableUsers.map((u) => (
                <Button
                  key={u._id}
                  variant="outlined"
                  onClick={() => handleUserSelect(u)}
                  sx={{
                    justifyContent: "flex-start",
                    px: 2,
                    py: 1.5,
                    borderRadius: "1rem",
                    borderColor: isDark
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(0,0,0,0.1)",
                    color: "inherit",
                    textTransform: "none",
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    width="100%"
                  >
                    <Avatar src={u.avatar?.url}>
                      {u.username?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box textAlign="left">
                      <Typography fontWeight="bold">
                        {u.name || u.username}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {u.role}
                      </Typography>
                    </Box>
                  </Stack>
                </Button>
              ))
            )}
          </Stack>
        ) : (
          <Box>
            <Button
              onClick={handleBack}
              startIcon={<ArrowBackIcon />}
              sx={{ mb: 2, textTransform: "none" }}
            >
              Back to list
            </Button>

            {isExisting ? (
              <Stack alignItems="center" spacing={2} mb={3}>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  Your Review
                </Typography>
                <Avatar
                  src={
                    ratingType === "event"
                      ? event.coverImage
                      : targetUser?.avatar?.url
                  }
                  sx={{ width: 80, height: 80, bgcolor: "primary.main" }}
                  variant={ratingType === "event" ? "rounded" : "circular"}
                >
                  {ratingType === "event" ? (
                    <EventIcon fontSize="large" />
                  ) : (
                    targetUser?.username?.[0]
                  )}
                </Avatar>
                <Box textAlign="center">
                  <Typography variant="h6" fontWeight="bold">
                    {ratingType === "event"
                      ? event.title
                      : targetUser?.name || targetUser?.username}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    {ratingType === "event" ? "Event Review" : "User Review"}
                  </Typography>
                </Box>

                <Rating
                  value={rating}
                  readOnly
                  size="large"
                  sx={{ fontSize: "3rem" }}
                />

                <Typography
                  variant="body1"
                  sx={{
                    fontStyle: "italic",
                    textAlign: "center",
                    opacity: 0.9,
                    maxWidth: "90%",
                  }}
                >
                  {comment ? `“${comment}”` : "No comment provided."}
                </Typography>

                <Alert severity="info" sx={{ width: "100%", mt: 2 }}>
                  You have already submitted your review.
                </Alert>
              </Stack>
            ) : (
              <>
                <Stack alignItems="center" spacing={2} mb={3}>
                  <Avatar
                    src={
                      ratingType === "event"
                        ? event.coverImage
                        : targetUser?.avatar?.url
                    }
                    sx={{ width: 72, height: 72, bgcolor: "primary.main" }}
                    variant={ratingType === "event" ? "rounded" : "circular"}
                  >
                    {ratingType === "event" ? (
                      <EventIcon fontSize="large" />
                    ) : (
                      targetUser?.username?.[0]
                    )}
                  </Avatar>
                  <Box textAlign="center">
                    <Typography variant="h6" fontWeight="bold">
                      {ratingType === "event"
                        ? event.title
                        : targetUser?.name || targetUser?.username}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                      {ratingType === "event"
                        ? "Rate this event"
                        : "Rate this user"}
                    </Typography>
                  </Box>

                  <Rating
                    value={rating}
                    onChange={(_, v) => setRating(v)}
                    size="large"
                    sx={{ fontSize: "3rem" }}
                  />
                </Stack>

                <TextField
                  label="Comment (Optional)"
                  multiline
                  rows={3}
                  fullWidth
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  sx={{ mb: 2 }}
                />

                {msg && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {msg}
                  </Alert>
                )}
                {successMsg && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {successMsg}
                  </Alert>
                )}

                {!successMsg && (
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleSubmit}
                    disabled={loading}
                    sx={{
                      borderRadius: "1rem",
                      textTransform: "none",
                      fontWeight: 700,
                    }}
                  >
                    {loading ? "Submitting..." : "Submit Review"}
                  </Button>
                )}
              </>
            )}
          </Box>
        )}
      </Box>
    </Modal>
  );
}
