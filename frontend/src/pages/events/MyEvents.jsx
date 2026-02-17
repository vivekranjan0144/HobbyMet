import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Grid,
  Chip,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Fade,
} from "@mui/material";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import EventIcon from "@mui/icons-material/Event";
import PlaceIcon from "@mui/icons-material/Place";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { EventAPI } from "../../api/event.api";
import CreateEventPopup from "../../components/events/CreateEventPopup";
import ViewEventPopup from "../../components/events/ViewEventPopup";
import { useMemo } from "react";

export default function MyEvents() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [openCreate, setOpenCreate] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [msg, setMsg] = useState("");

  const fetchEvents = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await EventAPI.getMyCreatedEvents();
      const list = Array.isArray(res) ? res : res.events || [];
      setEvents(list);
    } catch (err) {
      console.error("Failed to load my events:", err);
      setMsg(err?.message || "⚠️ Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    if (filter === "all") return events;
    return events.filter((ev) => (ev.status || "active") === filter);
  }, [events, filter]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    try {
      setLoading(true);
      await EventAPI.deleteEvent(deleteDialog.id);
      setMsg("✅ Event deleted successfully");
      setDeleteDialog({ open: false, id: null });
      await fetchEvents();
    } catch (err) {
      console.error("Delete failed:", err);
      setMsg(err?.message || "❌ Failed to delete event");
    } finally {
      setLoading(false);
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
            ? "linear-gradient(135deg, #080613, #130a23, #0b0618)"
            : "linear-gradient(135deg, #faf8ff, #f4eeff, #ebe4ff)",
          transition: "background 0.6s ease",
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
        My Hosted Events
      </Typography>

      <Stack direction="row" justifyContent="center" spacing={2} mb={3}>
        {["all", "active", "completed", "cancelled"].map((status) => (
          <Chip
            key={status}
            label={status.charAt(0).toUpperCase() + status.slice(1)}
            color={filter === status ? "primary" : "default"}
            onClick={() => setFilter(status)}
            clickable
            sx={{
              fontWeight: 600,
              px: 2.5,
              borderRadius: "2rem",
              background:
                filter === status
                  ? "linear-gradient(90deg,#a78bfa,#7c4dff,#5d2eff)"
                  : isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.04)",
              color: filter === status ? "#fff" : "inherit",
              transition: "transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)",
              "&:hover": {
                transform: "scale(1.08)",
                background: "linear-gradient(90deg,#b999ff,#8c5cff,#5d2eff)",
              },
            }}
          />
        ))}
      </Stack>

      {msg && (
        <Typography
          textAlign="center"
          sx={{
            mb: 2,
            opacity: 0.8,
            color: msg.startsWith("✅") ? "green" : "inherit",
          }}
        >
          {msg}
        </Typography>
      )}

      {filteredEvents.length > 0 ? (
        <Grid container spacing={{ xs: 2.5, sm: 3, md: 4 }}>
          {filteredEvents.map((ev, idx) => {
            const firstLetter = ev.title?.charAt(0)?.toUpperCase() || "E";

            return (
              <Fade in timeout={350 + idx * 100} key={ev._id}>
                <Grid item xs={12} sm={6} md={4}>
                  <Card
                    sx={{
                      borderRadius: "1.6rem",
                      overflow: "hidden",
                      background: isDark
                        ? "rgba(255,255,255,0.04)"
                        : "rgba(255,255,255,0.75)",
                      backdropFilter: "blur(10px)",

                      minHeight: { xs: 360, sm: 390, md: 420 },

                      transition:
                        "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), filter 0.5s ease, box-shadow 0.5s ease",

                      "&:hover": {
                        transform: { md: "translateY(-6px) scale(1.03)" },
                        filter: "brightness(1.08)",
                        boxShadow: isDark
                          ? "0 20px 40px rgba(0,0,0,0.45)"
                          : "0 20px 40px rgba(0,0,0,0.18)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        height: { xs: 150, sm: 165, md: 180 },

                        overflow: "hidden",
                        position: "relative",
                        "& img": {
                          borderRadius: "1rem",
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          transition:
                            "transform 1s cubic-bezier(0.25, 1, 0.5, 1)",
                        },
                        "&:hover img": {
                          transform: ev.coverImage ? "scale(1.05)" : "none",
                        },
                      }}
                    >
                      {ev.coverImage ? (
                        <img src={ev.coverImage} alt={ev.title} />
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
                          mb: 1,
                          color: isDark ? "#fff" : "#1a1a1a",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {ev.title}
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        mb={0.5}
                      >
                        <EventIcon fontSize="small" opacity={0.7} />
                        <Typography
                          variant="body2"
                          sx={{
                            opacity: 0.8,
                            fontSize: "0.9rem",
                            maxWidth: "100%",
                          }}
                        >
                          {ev.eventDateTime &&
                            new Date(
                              ev.eventDateTime,
                            ).toLocaleDateString()}{" "}
                          •{" "}
                          {ev.eventDateTime &&
                            new Date(ev.eventDateTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                        </Typography>
                      </Stack>

                      {ev.location?.address && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <PlaceIcon fontSize="small" opacity={0.7} />
                          <Typography
                            variant="body2"
                            sx={{
                              opacity: 0.8,
                              fontSize: "0.9rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "100%",
                            }}
                          >
                            {ev.location.address}
                          </Typography>
                        </Stack>
                      )}

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
                          startIcon={<VisibilityIcon />}
                          onClick={() => {
                            setOpenView(true);
                            setSelectedEvent(ev._id);
                          }}
                          sx={{
                            borderRadius: "2rem",
                            textTransform: "none",
                            px: 2.5,
                            py: 0.8,
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            width: { xs: "100%", sm: "auto" },
                            background:
                              "linear-gradient(90deg,#a78bfa,#7c4dff,#5d2eff)",
                            transition:
                              "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)",
                            "&:hover": {
                              transform: "scale(1.06)",
                            },
                          }}
                        >
                          View
                        </Button>

                        <IconButton
                          color="error"
                          sx={{ alignSelf: { xs: "flex-end", sm: "center" } }}
                          onClick={() =>
                            setDeleteDialog({ open: true, id: ev._id })
                          }
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Fade>
            );
          })}
        </Grid>
      ) : (
        <Typography textAlign="center" sx={{ opacity: 0.75, mt: 4 }}>
          {filter === "all" ? "No events created yet." : `No ${filter} events.`}
        </Typography>
      )}

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpenCreate(true)}
        sx={{
          position: "fixed",
          bottom: 30,
          right: 30,
          py: 1.5,
          px: 3,
          borderRadius: "2rem",
          background: "linear-gradient(90deg,#a78bfa,#7c4dff,#5d2eff)",
          transition: "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)",
          "&:hover": { transform: "scale(1.1)" },
        }}
      >
        Create Event
      </Button>

      <CreateEventPopup
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={fetchEvents}
      />

      <ViewEventPopup
        open={openView}
        onClose={() => {
          setOpenView(false);
          setSelectedEvent(null);
        }}
        eventId={selectedEvent}
        onUpdated={fetchEvents}
      />

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this event? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ open: false, id: null })}
            color="inherit"
          >
            Cancel
          </Button>
          <Button color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <style>
        {`
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        `}
      </style>
    </Box>
  );
}
