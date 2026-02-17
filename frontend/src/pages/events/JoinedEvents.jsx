import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  Button,
  CircularProgress,
  useTheme,
} from "@mui/material";

import PlaceIcon from "@mui/icons-material/Place";
import ScheduleIcon from "@mui/icons-material/Schedule";
import LogoutIcon from "@mui/icons-material/Logout";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { EventAPI } from "../../api/event.api";
import ViewEventPopup from "../../components/events/ViewEventPopup";

export default function JoinedEvents() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [openView, setOpenView] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);

  const fetchJoined = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await EventAPI.getMyJoinedEvents();
      const list = Array.isArray(res) ? res : res.events || [];
      setEvents(list);
      if (!list.length) setMsg("You haven't joined any events yet.");
    } catch (err) {
      console.error("Failed to load joined events:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "⚠️ Failed to fetch joined events";
      setMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async (id) => {
    if (!window.confirm("Leave this event?")) return;
    try {
      const res = await EventAPI.leaveEvent(id);
      alert(res?.message || "Left event successfully");
      fetchJoined();
    } catch (err) {
      console.error("Failed to leave event:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "❌ Failed to leave event";
      alert(message);
    }
  };

  useEffect(() => {
    fetchJoined();
  }, []);

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
    <Box
      sx={{
        minHeight: "100vh",
        px: { xs: 2, md: 4 },
        py: "5rem",
        animation: "fadeIn 0.5s ease",
      }}
    >
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: -5,
          background: isDark
            ? "linear-gradient(135deg,#080613,#130a23,#0b0618)"
            : "linear-gradient(135deg,#faf8ff,#f4eeff,#ebe4ff)",
        }}
      />

      <Typography
        variant="h4"
        fontWeight={900}
        sx={{
          textAlign: "center",
          mb: "2.5rem",
          background: "linear-gradient(90deg,#c7b3ff,#a78bfa,#7c4dff,#5d2eff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Events I've Joined
      </Typography>

      {msg && (
        <Typography textAlign="center" sx={{ mb: 2, opacity: 0.85 }}>
          {msg}
        </Typography>
      )}

      {events.length === 0 ? (
        !msg && (
          <Typography textAlign="center" sx={{ opacity: 0.75 }}>
            No joined events to show.
          </Typography>
        )
      ) : (
        <Grid container spacing={3}>
          {events.map((e) => {
            const host = e.hostId;
            const hostId =
              typeof host === "object" && host !== null ? host._id : host;
            const hostName =
              typeof host === "object" && host !== null
                ? host.name || host.username || "Host"
                : "Host";

            return (
              <Grid item xs={12} sm={6} md={4} key={e._id}>
                <Card
                  sx={{
                    borderRadius: "1.6rem",
                    overflow: "hidden",
                    background: isDark
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(255,255,255,0.8)",
                    backdropFilter: "blur(10px)",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
                    },
                  }}
                >
                  {e.coverImage && (
                    <Box
                      sx={{
                        height: 160,
                        overflow: "hidden",
                        "& img": {
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        },
                      }}
                    >
                      <img src={e.coverImage} alt={e.title} />
                    </Box>
                  )}

                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="h6" fontWeight={700}>
                      {e.title}
                    </Typography>

                    {hostId && (
                      <Typography
                        variant="body2"
                        component={Link}
                        to={`/users/${hostId}`}
                        sx={{
                          mt: 0.3,
                          mb: 0.5,
                          fontSize: "0.85rem",
                          opacity: 0.8,
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

                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      mt={0.5}
                    >
                      <ScheduleIcon fontSize="small" sx={{ opacity: 0.7 }} />
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
                        <PlaceIcon fontSize="small" sx={{ opacity: 0.7 }} />
                        <Typography
                          variant="body2"
                          sx={{
                            opacity: 0.8,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {e.location.address}
                        </Typography>
                      </Stack>
                    )}

                    <Stack direction="row" spacing={1} mt={1}>
                      {e.category && (
                        <Chip
                          label={e.category}
                          size="small"
                          color="secondary"
                        />
                      )}
                      {e.status && (
                        <Chip label={e.status} size="small" color="success" />
                      )}
                    </Stack>

                    <Stack
                      direction="row"
                      spacing={1}
                      mt={2.5}
                      justifyContent="space-between"
                    >
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<LogoutIcon />}
                        onClick={() => handleLeave(e._id)}
                        sx={{
                          borderRadius: "999px",
                          textTransform: "none",
                          px: 2.5,
                        }}
                      >
                        Leave
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
                          borderRadius: "999px",
                          textTransform: "none",
                          px: 2.5,
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

      <ViewEventPopup
        open={openView}
        onClose={() => setOpenView(false)}
        eventId={selectedEventId}
        onUpdated={fetchJoined}
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
  );
}
