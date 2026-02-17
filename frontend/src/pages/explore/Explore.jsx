import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Button,
  useTheme,
  Chip,
  IconButton,
  CircularProgress,
  Snackbar,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  TextField,
  InputAdornment,
} from "@mui/material";

import MuiAlert from "@mui/material/Alert";

import AddIcon from "@mui/icons-material/Add";
import EventIcon from "@mui/icons-material/Event";
import InterestsIcon from "@mui/icons-material/Interests";

import PlaceIcon from "@mui/icons-material/Place";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useAuth } from "../../context/AuthContext";

import { EventAPI } from "../../api/event.api";
import { UserAPI } from "../../api/user.api";
import CreateEventPopup from "../../components/events/CreateEventPopup";
import ViewEventPopup from "../../components/events/ViewEventPopup";

export default function Explore() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [hobbies, setHobbies] = useState([]);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [activeHobby, setActiveHobby] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [joinReqLoadingId, setJoinReqLoadingId] = useState(null);
  const [sentRequests, setSentRequests] = useState({});
  const [reqStatusByEvent, setReqStatusByEvent] = useState({});

  const [openView, setOpenView] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [initialTab, setInitialTab] = useState(null);
  const [viewOnly, setViewOnly] = useState(false);

  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const { user } = useAuth();
  const [showNearby, setShowNearby] = useState(false);

  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  const [userCoords, setUserCoords] = useState(null);

  const distanceOptions = [5, 10, 15, 20, 25, 50, 80];

  const [eventDistanceKm, setEventDistanceKm] = useState(10);
  const [userDistanceKm, setUserDistanceKm] = useState(10);

  const [showAllEvents, setShowAllEvents] = useState(false);
  useEffect(() => {
    if (!userCoords || !currentUserId) return;

    if (showAllEvents) {
      loadAllEvents(currentUserId);
    } else {
      loadNearbyEvents({
        coords: userCoords,
        userId: currentUserId,
        km: eventDistanceKm,
      });
    }
  }, [eventDistanceKm, showAllEvents]);

  const [searchQuery, setSearchQuery] = useState("");

  const showSnack = (message, severity = "info") => {
    setSnack({ open: true, message, severity });
  };

  const handleSnackClose = (_, reason) => {
    if (reason === "clickaway") return;
    setSnack((s) => ({ ...s, open: false }));
  };

  const applyHobbyFilter = (eventsArr, hobbyName) => {
    if (!hobbyName) return eventsArr;
    return eventsArr.filter((e) =>
      e.hobbyTags?.some((tag) =>
        tag.toLowerCase().includes(hobbyName.toLowerCase()),
      ),
    );
  };

  const applySearchFilter = (eventsArr, query) => {
    if (!query || !query.trim()) return eventsArr;
    const lowerQuery = query.toLowerCase().trim();
    return eventsArr.filter((e) => {
      if (e.category?.toLowerCase().includes(lowerQuery)) return true;

      if (e.hobbyTags?.some((tag) => tag.toLowerCase().includes(lowerQuery)))
        return true;

      if (e.title?.toLowerCase().includes(lowerQuery)) return true;

      if (e.description?.toLowerCase().includes(lowerQuery)) return true;
      return false;
    });
  };

  const loadAllEvents = async (userId) => {
    try {
      const eventsArr = await EventAPI.listEvents({
        status: "active",
        populateHost: "true",
      });

      const visibleEvents = eventsArr.filter((e) => {
        const host = e.hostId;
        const hostId =
          typeof host === "object" && host !== null ? host._id : host;
        return String(hostId) !== String(userId);
      });

      setEvents(visibleEvents);
      let filtered = applyHobbyFilter(visibleEvents, activeHobby);
      filtered = applySearchFilter(filtered, searchQuery);
      setFilteredEvents(filtered);
    } catch (err) {
      console.error("Failed to load all events:", err);
      showSnack(err?.message || "⚠️ Failed to load events", "error");
    }
  };

  const loadNearbyEvents = async ({ coords, userId, km }) => {
    console.log("📡 loadNearbyEvents called with:", { coords, userId, km });

    if (!Array.isArray(coords) || coords.length !== 2) {
      console.warn("⚠️ Invalid coordinates:", coords);
      setEvents([]);
      setFilteredEvents([]);
      return;
    }

    try {
      const [lng, lat] = coords;

      console.log("🌍 Fetching events near:", {
        lng,
        lat,
        maxDistance: km * 1000,
      });

      const eventsArr = await EventAPI.getNearbyEvents({
        longitude: lng,
        latitude: lat,
        maxDistance: km * 1000,
      });

      console.log("📦 Received events from API:", eventsArr?.length || 0);

      const visibleEvents = eventsArr.filter((e) => {
        const host = typeof e.hostId === "object" ? e.hostId._id : e.hostId;
        return String(host) !== String(userId);
      });

      console.log(
        "👁️ Visible events after filtering host:",
        visibleEvents.length,
      );

      setEvents(visibleEvents);

      let filtered = applyHobbyFilter(visibleEvents, activeHobby);
      filtered = applySearchFilter(filtered, searchQuery);

      console.log("🎯 Final filtered events:", filtered.length);

      setFilteredEvents(filtered);
    } catch (e) {
      console.error("❌ Error in loadNearbyEvents:", e);
      setEvents([]);
      setFilteredEvents([]);
    }
  };

  const loadNearbyUsers = async ({ coords, km }) => {
    if (!Array.isArray(coords) || coords.length !== 2) {
      setNearbyUsers([]);
      return;
    }

    try {
      setNearbyLoading(true);
      const users = await UserAPI.getNearbyUsers(coords, {
        maxDistance: km * 1000,
      });
      setNearbyUsers(users || []);
    } catch (e) {
      setNearbyUsers([]);
    } finally {
      setNearbyLoading(false);
    }
  };

  const fetchExploreData = async () => {
    setLoading(true);
    try {
      if (!user) return;
      const userId = user._id || user.id;
      setCurrentUserId(userId);

      const userHobbies = user.hobbies || [];
      const coords = user.location?.coordinates;

      setHobbies(userHobbies);
      setUserCoords(Array.isArray(coords) ? coords : null);

      if (Array.isArray(coords) && coords.length === 2) {
        setShowAllEvents(false);

        await loadNearbyEvents({
          coords,
          userId,
          km: eventDistanceKm,
        });

        await loadNearbyUsers({
          coords,
          km: userDistanceKm,
        });
      } else {
        setShowAllEvents(true);
        await loadAllEvents(userId);
      }

      try {
        const res = await EventAPI.getMyJoinRequests();
        const list = Array.isArray(res) ? res : res.requests || [];
        const map = {};
        list.forEach((r) => {
          if (r?.eventId) map[r.eventId] = r.status || "pending";
        });
        setReqStatusByEvent(map);
      } catch (e) {}
    } catch (e) {
      console.error("Failed to load explore data:", e);
      showSnack(e?.message || "⚠️ Failed to load explore events", "error");
      setEvents([]);
      setFilteredEvents([]);
      setNearbyUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filterByHobby = (hobbyName) => {
    setActiveHobby(hobbyName);
    let filtered = applyHobbyFilter(events, hobbyName);
    filtered = applySearchFilter(filtered, searchQuery);
    setFilteredEvents(filtered);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    let filtered = applyHobbyFilter(events, activeHobby);
    filtered = applySearchFilter(filtered, query);
    setFilteredEvents(filtered);
  };

  const handleEventDistanceChange = (value) => {
    setEventDistanceKm(value);

    if (value === "all") {
      setShowAllEvents(true);
    } else {
      setShowAllEvents(false);
    }
  };

  const handleUserDistanceChange = (km) => {
    setUserDistanceKm(km);
  };

  useEffect(() => {
    if (!userCoords) return;

    loadNearbyUsers({
      coords: userCoords,
      km: userDistanceKm,
    });
  }, [userDistanceKm]);

  useEffect(() => {
    if (user) {
      fetchExploreData();
    }
  }, [user]);

  useEffect(() => {
    const eventId = searchParams.get("eventId");
    const showRequests = searchParams.get("showRequests");
    const showChat = searchParams.get("showChat");
    const showReviews = searchParams.get("showReviews");
    const viewOnlyParam = searchParams.get("viewOnly");

    if (eventId) {
      setSelectedEventId(eventId);
      setOpenView(true);
      setViewOnly(viewOnlyParam === "true");

      if (showRequests === "true") {
        setInitialTab("requests");
      } else if (showChat === "true") {
        setInitialTab("chat");
      } else if (showReviews === "true") {
        setInitialTab("reviews");
      } else {
        setInitialTab(null);
      }

      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handleJoinRequest = async (eventObj) => {
    const eventId = eventObj._id;
    if (!eventId) return;

    const capacity = eventObj.capacity || 0;
    const participantsCount = eventObj.participants?.length || 0;
    const isFull = capacity > 0 && participantsCount >= capacity;
    const isAlreadySent = !!sentRequests[eventId];

    if (isFull) {
      showSnack("This event is already at full capacity.", "warning");
      return;
    }
    if (isAlreadySent) {
      showSnack("You already sent a join request for this event.", "info");
      return;
    }

    setJoinReqLoadingId(eventId);
    try {
      const res = await EventAPI.sendJoinRequest(
        eventId,
        "Hey! I’d love to join this event.",
      );
      showSnack(
        res?.message || "✅ Join request sent successfully!",
        "success",
      );
      setSentRequests((prev) => ({ ...prev, [eventId]: true }));
    } catch (e) {
      console.error("Join request failed:", e);
      if (e.status === 409) {
        setSentRequests((prev) => ({ ...prev, [eventId]: true }));
        showSnack(
          e.message || "You have already requested to join this event.",
          "info",
        );
      } else if (
        e.status === 400 &&
        (e.message || "").toLowerCase().includes("full capacity")
      ) {
        showSnack(e.message || "This event is already full.", "warning");
      } else {
        showSnack(e.message || "❌ Failed to send join request", "error");
      }
    } finally {
      setJoinReqLoadingId(null);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          minHeight: "100vh",
          px: { xs: "1rem", md: "2rem" },
          py: "5rem",
          animation: "fadeIn 0.6s ease",
        }}
      >
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: -5,
            background: isDark
              ? "linear-gradient(135deg,#090616,#1a112c,#0d0820)"
              : "linear-gradient(135deg,#faf7ff,#f1eaff,#e8e1ff)",
          }}
        />

        <Typography
          variant="h4"
          fontWeight={900}
          sx={{
            textAlign: "center",
            mb: "2.5rem",
            background:
              "linear-gradient(90deg,#c7b3ff,#a78bfa,#7c4dff,#5d2eff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Explore Events
        </Typography>

        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}
        >
          <InterestsIcon color="primary" /> Your Hobbies
        </Typography>

        <Stack direction="row" spacing={2} sx={{ overflowX: "auto", pb: 2 }}>
          <Chip
            label="All"
            onClick={() => filterByHobby(null)}
            clickable
            color={!activeHobby ? "primary" : "default"}
            sx={{
              fontWeight: 700,
              borderRadius: "2rem",
              px: 2.5,
              py: 1,
              background: !activeHobby
                ? "linear-gradient(90deg,#a78bfa,#7c4dff,#5d2eff)"
                : isDark
                  ? "rgba(255,255,255,0.07)"
                  : "rgba(0,0,0,0.05)",
              color: !activeHobby ? "#fff" : "inherit",
            }}
          />
          {hobbies.length > 0 ? (
            hobbies.map((h, i) => (
              <Chip
                key={i}
                label={h.name || h}
                clickable
                onClick={() => filterByHobby(h.name || h)}
                color={activeHobby === (h.name || h) ? "primary" : "default"}
                sx={{
                  fontWeight: 700,
                  borderRadius: "2rem",
                  px: 2.5,
                  py: 1,
                  background:
                    activeHobby === (h.name || h)
                      ? "linear-gradient(90deg,#a78bfa,#7c4dff,#5d2eff)"
                      : isDark
                        ? "rgba(255,255,255,0.07)"
                        : "rgba(0,0,0,0.05)",
                  color: activeHobby === (h.name || h) ? "#fff" : "inherit",
                  transition: "transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)",
                  "&:hover": {
                    transform: "scale(1.08)",
                  },
                }}
              />
            ))
          ) : (
            <Typography sx={{ opacity: 0.6 }}>
              No hobbies yet. Add hobbies in your profile.
            </Typography>
          )}
        </Stack>

        <Typography
          variant="h6"
          fontWeight={700}
          sx={{
            mt: "2.5rem",
            mb: "0.6rem",
            display: "flex",
            gap: 1,
            alignItems: "center",
          }}
        >
          <EventIcon color="secondary" /> Discover Events
        </Typography>

        <Stack spacing={2} sx={{ mb: "1.2rem" }}>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent={{ xs: "flex-start", md: "center" }}
            sx={{ flexWrap: "wrap" }}
          >
            <TextField
              placeholder="Search by category, hobby tags, title..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              size="small"
              sx={{
                width: {
                  xs: "100%",
                  sm: "100%",
                  md: 420,
                  lg: 480,
                },
                flexShrink: 0,
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography variant="body2" sx={{ opacity: 0.6 }}>
                      🔍
                    </Typography>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ flexWrap: "wrap" }}
          >
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Events range:
            </Typography>

            {userCoords && (
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={eventDistanceKm}
                  onChange={(e) => handleEventDistanceChange(e.target.value)}
                  displayEmpty
                  sx={{ borderRadius: "999px" }}
                >
                  <MenuItem value="all">All events</MenuItem>
                  {distanceOptions.map((km) => (
                    <MenuItem key={km} value={km}>
                      {km} km
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {!userCoords && !showAllEvents && (
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Turn on location in your profile to see nearby events & people.
              </Typography>
            )}
          </Stack>
        </Stack>

        <Grid container spacing={4} alignItems="flex-start">
          <Grid item xs={12} md={8}>
            {filteredEvents.length === 0 ? (
              <Typography sx={{ opacity: 0.7 }}>
                {showAllEvents
                  ? "No events available."
                  : "No nearby events found for this range / hobby."}
              </Typography>
            ) : (
              <Grid container spacing={4}>
                {filteredEvents.map((e) => {
                  const capacity = e.capacity || 0;
                  const participantsCount = e.participants?.length || 0;
                  const isFull = capacity > 0 && participantsCount >= capacity;
                  const isSent =
                    !!sentRequests[e._id] ||
                    reqStatusByEvent[e._id] === "pending";
                  const isApproved = reqStatusByEvent[e._id] === "approved";
                  const isLoading = joinReqLoadingId === e._id;
                  const isParticipant =
                    Array.isArray(e.participants) &&
                    e.participants.some(
                      (pid) => String(pid) === String(currentUserId),
                    );

                  let buttonLabel = "Join Request";
                  if (isFull) buttonLabel = "Full";
                  else if (isParticipant || isApproved) buttonLabel = "Joined";
                  else if (isSent) buttonLabel = "Request Sent";
                  else if (isLoading) buttonLabel = "Sending...";

                  const firstLetter = e.title?.charAt(0)?.toUpperCase() || "E";

                  return (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={6}
                      lg={6}
                      key={e._id}
                      sx={{
                        pl: { xs: 0, sm: 1, md: 3 },
                      }}
                    >
                      <Card
                        sx={{
                          height: "100%",
                          minHeight: { xs: 380, sm: 400, md: 430 },
                          transition:
                            "transform 0.35s ease, box-shadow 0.35s ease",
                          "&:hover": {
                            transform: { md: "translateY(-6px)" },
                            boxShadow: isDark
                              ? "0 20px 40px rgba(0,0,0,0.45)"
                              : "0 20px 40px rgba(0,0,0,0.15)",
                          },

                          display: "flex",
                          flexDirection: "column",
                          borderRadius: "1.6rem",
                          overflow: "hidden",
                          background: isDark
                            ? "rgba(255,255,255,0.04)"
                            : "rgba(255,255,255,0.75)",
                          backdropFilter: "blur(10px)",
                        }}
                      >
                        <Box
                          sx={{
                            height: { xs: 150, sm: 170, md: 180 },
                            borderRadius: "1rem",
                            overflow: "hidden",
                            position: "relative",
                            "& img": {
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              transition:
                                "transform 1s cubic-bezier(0.25, 1, 0.5, 1)",
                            },
                            "&:hover img": {
                              transform: e.coverImage ? "scale(1.05)" : "none",
                            },
                          }}
                        >
                          {e.coverImage ? (
                            <img src={e.coverImage} alt={e.title} />
                          ) : (
                            <Box
                              sx={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: isDark
                                  ? "linear-gradient(135deg,#1e1635,#36235f)"
                                  : "linear-gradient(135deg,#e0d4ff,#bfa7ff)",
                                fontSize: "3rem",
                                fontWeight: 800,
                                color: isDark ? "#f9f5ff" : "#3b0764",
                              }}
                            >
                              {firstLetter}
                            </Box>
                          )}
                        </Box>

                        <CardContent sx={{ p: 2.5 }}>
                          <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {e.title}
                          </Typography>

                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                            mt={1}
                          >
                            <ScheduleIcon fontSize="small" opacity={0.7} />
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                              {e.eventDateTime &&
                                new Date(e.eventDateTime).toLocaleString()}
                            </Typography>
                          </Stack>

                          {e.location?.address && (
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              mt={0.5}
                            >
                              <PlaceIcon fontSize="small" opacity={0.7} />
                              <Typography
                                variant="body2"
                                sx={{
                                  opacity: 0.8,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  maxWidth: "100%",
                                }}
                              >
                                {e.location.address}
                              </Typography>
                            </Stack>
                          )}

                          <Typography
                            sx={{
                              mt: 1.2,
                              fontSize: "0.9rem",
                              opacity: 0.8,
                              lineHeight: 1.4,
                            }}
                          >
                            {e.description
                              ? `${e.description.slice(
                                  0,
                                  window.innerWidth < 600 ? 65 : 90,
                                )}${e.description.length > 90 ? "..." : ""}`
                              : ""}
                          </Typography>

                          <Stack direction="row" spacing={1} mt={1}>
                            {e.visibility && (
                              <Chip
                                label={e.visibility}
                                color="secondary"
                                size="small"
                              />
                            )}
                            <Chip
                              label={e.category || "General"}
                              color="primary"
                              size="small"
                            />
                            {capacity > 0 && (
                              <Chip
                                size="small"
                                label={`${participantsCount}/${capacity}`}
                              />
                            )}
                          </Stack>

                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={{ xs: 1.2, sm: 0 }}
                            justifyContent="space-between"
                            alignItems="center"
                            mt={2.5}
                          >
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<PeopleAltIcon />}
                              onClick={() => handleJoinRequest(e)}
                              disabled={
                                isFull ||
                                isSent ||
                                isLoading ||
                                isParticipant ||
                                isApproved
                              }
                              sx={{
                                width: { xs: "100%", sm: "auto" },

                                borderRadius: "2rem",
                                textTransform: "none",
                                px: 2.5,
                                py: 0.8,
                                fontWeight: 600,
                                fontSize: "0.85rem",
                                background:
                                  "linear-gradient(90deg,#a78bfa,#7c4dff,#5d2eff)",
                                opacity: isFull ? 0.7 : 1,
                                transition:
                                  "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)",
                                "&:hover": {
                                  transform:
                                    isFull || isSent ? "none" : "scale(1.06)",
                                },
                              }}
                            >
                              {buttonLabel}
                            </Button>

                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<VisibilityIcon />}
                              onClick={() => {
                                setSelectedEventId(e._id);
                                setOpenView(true);
                              }}
                              sx={{
                                width: { xs: "100%", sm: "auto" },

                                borderRadius: "2rem",
                                textTransform: "none",
                                px: 2.2,
                                py: 0.7,
                                fontWeight: 500,
                              }}
                            >
                              View
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Grid>

          {showNearby && (
            <Grid
              item
              xs={12}
              md={3}
              sx={{
                position: { xs: "static", md: "relative" },
                mt: { xs: 3, md: 0 },
              }}
            >
              <Box
                sx={{
                  position: { xs: "static", md: "fixed" },
                  top: { xs: "auto", md: "6rem" },
                  right: { xs: "auto", md: "2rem" },
                  width: { xs: "100%", md: 320 },
                  zIndex: 50,
                }}
              >
                <Card
                  sx={{
                    borderRadius: "1.6rem",
                    overflow: "hidden",
                    background: isDark
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(10px)",
                    maxHeight: { md: "calc(100vh - 8rem)" },
                    overflowY: "auto",
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      mb={1.5}
                    >
                      <Typography
                        variant="subtitle1"
                        fontWeight={800}
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <PeopleAltIcon fontSize="small" /> Nearby People
                      </Typography>
                    </Stack>

                    <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>
                      Based on people who share their location.
                    </Typography>

                    {userCoords && (
                      <Stack spacing={1} sx={{ mb: 1.2 }}>
                        <Typography
                          variant="caption"
                          sx={{ opacity: 0.8, display: "block" }}
                        >
                          Showing users within:
                        </Typography>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={userDistanceKm}
                            onChange={(e) =>
                              handleUserDistanceChange(e.target.value)
                            }
                            displayEmpty
                          >
                            {distanceOptions.map((km) => (
                              <MenuItem
                                key={km}
                                value={km}
                                sx={{
                                  borderRadius: "999px",
                                  mx: 0.5,
                                  my: 0.3,
                                }}
                              >
                                {km} km radius
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Stack>
                    )}

                    {nearbyLoading ? (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          py: 2,
                        }}
                      >
                        <CircularProgress size={22} />
                      </Box>
                    ) : nearbyUsers && nearbyUsers.length ? (
                      <Stack
                        spacing={1.2}
                        sx={{
                          maxHeight: 320,
                          overflowY: "auto",
                          pr: 0.5,
                        }}
                      >
                        {nearbyUsers.map((u) => {
                          const initial = u.name?.[0] || u.username?.[0] || "U";

                          return (
                            <Stack
                              key={u._id}
                              component={Link}
                              to={`/users/${u._id}`}
                              direction="row"
                              spacing={1.5}
                              alignItems="center"
                              sx={{
                                p: 1,
                                borderRadius: "1rem",
                                background: isDark
                                  ? "rgba(255,255,255,0.03)"
                                  : "rgba(0,0,0,0.03)",
                                textDecoration: "none",
                                color: "inherit",
                                cursor: "pointer",
                                "&:hover": {
                                  background: isDark
                                    ? "rgba(255,255,255,0.06)"
                                    : "rgba(0,0,0,0.06)",
                                  transform: "translateY(-1px)",
                                  transition: "all 0.2s ease",
                                },
                              }}
                            >
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  fontSize: "0.9rem",
                                  fontWeight: 700,
                                  background:
                                    "linear-gradient(135deg,#a78bfa,#7c4dff,#5d2eff)",
                                }}
                              >
                                {String(initial).toUpperCase()}
                              </Avatar>

                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  variant="body2"
                                  fontWeight={700}
                                  noWrap
                                >
                                  {u.name || u.username}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ opacity: 0.7 }}
                                  noWrap
                                >
                                  @{u.username}
                                </Typography>

                                {u.hobbies?.length ? (
                                  <Stack
                                    direction="row"
                                    spacing={0.5}
                                    flexWrap="wrap"
                                    sx={{ mt: 0.4 }}
                                  >
                                    {u.hobbies.slice(0, 2).map((h, idx) => (
                                      <Chip
                                        key={idx}
                                        label={h}
                                        size="small"
                                        sx={{
                                          fontSize: "0.65rem",
                                          height: 20,
                                          borderRadius: "999px",
                                        }}
                                      />
                                    ))}
                                  </Stack>
                                ) : null}
                              </Box>
                            </Stack>
                          );
                        })}
                      </Stack>
                    ) : (
                      <Typography variant="body2" sx={{ opacity: 0.7 }}>
                        No nearby users visible right now.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Box>
            </Grid>
          )}
        </Grid>

        <IconButton
          onClick={() => setOpenCreate(true)}
          sx={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            zIndex: 200,
            background: "linear-gradient(135deg,#a78bfa,#7c4dff,#5d2eff)",
            color: "#fff",
            width: 60,
            height: 60,
            "&:hover": { transform: "scale(1.1)" },
          }}
        >
          <AddIcon sx={{ fontSize: "2rem" }} />
        </IconButton>

        <IconButton
          onClick={() => setShowNearby((v) => !v)}
          sx={{
            position: "fixed",
            bottom: "6.5rem",
            right: "2.2rem",
            zIndex: 210,
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: showNearby
              ? "linear-gradient(135deg,#ef4444,#dc2626)"
              : "linear-gradient(135deg,#a78bfa,#7c4dff,#5d2eff)",
            color: "#fff",
            boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
            "&:hover": {
              transform: "scale(1.08)",
            },
          }}
        >
          {showNearby ? "✕" : "👥"}
        </IconButton>

        <CreateEventPopup
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          onCreated={fetchExploreData}
        />

        <ViewEventPopup
          open={openView}
          onClose={() => {
            setOpenView(false);
            setInitialTab(null);
            setViewOnly(false);
          }}
          eventId={selectedEventId}
          onUpdated={fetchExploreData}
          initialTab={initialTab}
          viewOnly={viewOnly}
        />

        <style>
          {`
          @keyframes fadeIn {
            0% { opacity: 0; transform: translateY(8px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          `}
        </style>
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={handleSnackClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert
          onClose={handleSnackClose}
          severity={snack.severity}
          elevation={6}
          variant="filled"
          sx={{ borderRadius: "999px" }}
        >
          {snack.message}
        </MuiAlert>
      </Snackbar>

      <Box
        sx={{
          mt: "4rem",
          py: 3,
          textAlign: "center",
          borderTop: isDark
            ? "1px solid rgba(255,255,255,0.08)"
            : "1px solid rgba(0,0,0,0.08)",
          background: isDark ? "rgba(10,6,22,0.6)" : "rgba(250,247,255,0.9)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Typography
          variant="caption"
          sx={{ display: "block", opacity: 0.75, mt: 0.5 }}
        >
          Discover events • Meet people • Share hobbies
        </Typography>

        <Typography
          variant="caption"
          sx={{ display: "block", opacity: 0.6, mt: 0.8 }}
        >
          © {new Date().getFullYear()} HobbyMet. All rights reserved.
        </Typography>
      </Box>
    </>
  );
}
