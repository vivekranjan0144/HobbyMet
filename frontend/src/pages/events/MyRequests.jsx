import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  Grid,
  CircularProgress,
  Button,
  useTheme,
  IconButton,
} from "@mui/material";

import EventIcon from "@mui/icons-material/Event";
import PlaceIcon from "@mui/icons-material/Place";
import ScheduleIcon from "@mui/icons-material/Schedule";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";

import { EventAPI } from "../../api/event.api";
import ViewEventPopup from "../../components/events/ViewEventPopup";

export default function MyRequests() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightedRequestRef = useRef(null);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [openView, setOpenView] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [highlightedRequestId, setHighlightedRequestId] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await EventAPI.getMyJoinRequests();
      const list = Array.isArray(res) ? res : res.requests || [];
      setRequests(list);
      if (!list.length) setMsg("");
    } catch (err) {
      console.error("Failed to fetch my join requests:", err);
      setMsg(err?.message || "⚠️ Failed to load your join requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    const requestId = searchParams.get("requestId");
    if (requestId) {
      setHighlightedRequestId(requestId);

      setTimeout(() => {
        if (highlightedRequestRef.current) {
          highlightedRequestRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          setTimeout(() => {
            setHighlightedRequestId(null);
            setSearchParams({});
          }, 3000);
        }
      }, 300);
    }
  }, [searchParams, setSearchParams]);

  const statusChipProps = (status = "") => {
    const s = status.toLowerCase();
    if (s === "approved") return { color: "success", label: "Approved" };
    if (s === "rejected") return { color: "error", label: "Rejected" };
    return { color: "warning", label: "Pending" };
  };

  const filteredRequests = useMemo(() => {
    if (statusFilter === "all") return requests;
    return requests.filter(
      (r) => (r.status || "pending").toLowerCase() === statusFilter,
    );
  }, [requests, statusFilter]);

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

      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{
          mb: "2rem",
          justifyContent: "center",
        }}
      >
        <Typography
          variant="h4"
          fontWeight={900}
          sx={{
            background:
              "linear-gradient(90deg,#c7b3ff,#a78bfa,#7c4dff,#5d2eff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Requested Events
        </Typography>

        <IconButton
          onClick={fetchRequests}
          sx={{
            borderRadius: "999px",
            border: isDark
              ? "1px solid rgba(255,255,255,0.2)"
              : "1px solid rgba(0,0,0,0.08)",
          }}
          title="Refresh"
        >
          <RefreshIcon />
        </IconButton>
      </Stack>

      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
        <Stack
          direction="row"
          spacing={1.5}
          flexWrap="wrap"
          alignItems="center"
          justifyContent="center"
        >
          {[
            { key: "all", label: "All" },
            { key: "pending", label: "Pending" },
            { key: "approved", label: "Approved" },
            { key: "rejected", label: "Rejected" },
          ].map((f) => (
            <Chip
              key={f.key}
              label={f.label}
              clickable
              onClick={() => setStatusFilter(f.key)}
              color={statusFilter === f.key ? "primary" : "default"}
              sx={{
                fontWeight: 600,
                borderRadius: "2rem",
                px: 2.2,
                py: 0.5,
                background:
                  statusFilter === f.key
                    ? "linear-gradient(90deg,#a78bfa,#7c4dff,#5d2eff)"
                    : isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)",
                color: statusFilter === f.key ? "#fff" : "inherit",
              }}
            />
          ))}
        </Stack>
      </Box>

      {msg && (
        <Typography textAlign="center" sx={{ mb: 2, opacity: 0.85 }}>
          {msg}
        </Typography>
      )}

      {filteredRequests.length === 0 ? (
        <Typography textAlign="center" sx={{ opacity: 0.75, mt: 4 }}>
          {statusFilter === "all"
            ? "No join requests yet."
            : `No ${statusFilter} requests.`}
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {filteredRequests.map((r) => {
            const event = r.eventId || {};
            const statusProps = statusChipProps(r.status);

            const host = event.hostId;
            const hostId =
              typeof host === "object" && host !== null ? host._id : host;
            const hostName =
              typeof host === "object" && host !== null
                ? host.name || host.username || "Host"
                : "Host";

            const isHighlighted = highlightedRequestId === r._id;
            return (
              <Grid item xs={12} sm={6} md={4} key={r._id}>
                <Card
                  ref={isHighlighted ? highlightedRequestRef : null}
                  sx={{
                    borderRadius: "1.6rem",
                    overflow: "hidden",
                    background: isDark
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(255,255,255,0.75)",
                    backdropFilter: "blur(12px)",
                    minHeight: { xs: 320, sm: 350, md: 380 },

                    transition:
                      "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.5s ease, filter 0.5s ease",

                    border: isHighlighted ? "2px solid" : "none",
                    borderColor: isHighlighted ? "primary.main" : "transparent",

                    boxShadow: isHighlighted
                      ? "0 0 22px rgba(124,77,255,0.55)"
                      : isDark
                        ? "0 10px 30px rgba(0,0,0,0.4)"
                        : "0 10px 25px rgba(0,0,0,0.18)",

                    "&:hover": {
                      transform: { md: "translateY(-6px) scale(1.03)" },
                      filter: "brightness(1.08)",
                      boxShadow: isHighlighted
                        ? "0 0 28px rgba(124,77,255,0.65)"
                        : isDark
                          ? "0 18px 40px rgba(0,0,0,0.55)"
                          : "0 18px 40px rgba(0,0,0,0.25)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={1}
                    >
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          maxWidth: "70%",
                        }}
                      >
                        {event.title || "Event"}
                      </Typography>
                      <Chip size="small" {...statusProps} />
                    </Stack>

                    {hostId && (
                      <Typography
                        variant="body2"
                        component={Link}
                        to={`/users/${hostId}`}
                        sx={{
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

                    <Typography
                      variant="body2"
                      sx={{
                        opacity: 0.8,
                        mb: 1,
                        minHeight: 44,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {event.description
                        ? `${event.description.slice(0, 80)}${
                            event.description.length > 80 ? "..." : ""
                          }`
                        : "No description"}
                    </Typography>

                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      mb={0.5}
                    >
                      <ScheduleIcon fontSize="small" sx={{ opacity: 0.7 }} />
                      <Typography variant="body2" sx={{ opacity: 0.85 }}>
                        Requested:{" "}
                        {r.requestedAt
                          ? new Date(r.requestedAt).toLocaleString()
                          : "N/A"}
                      </Typography>
                    </Stack>

                    {r.respondedAt && (
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        mb={0.5}
                      >
                        <EventIcon fontSize="small" sx={{ opacity: 0.7 }} />
                        <Typography variant="body2" sx={{ opacity: 0.85 }}>
                          Responded: {new Date(r.respondedAt).toLocaleString()}
                        </Typography>
                      </Stack>
                    )}

                    {event.location?.address && (
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        mb={0.5}
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
                          {event.location.address}
                        </Typography>
                      </Stack>
                    )}

                    {r.message && (
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 1,
                          fontStyle: "italic",
                          opacity: 0.8,
                          maxWidth: "100%",
                        }}
                      >
                        “{r.message}”
                      </Typography>
                    )}

                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="flex-end"
                      spacing={1}
                      mt={2}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => {
                          if (event._id) {
                            setSelectedEventId(event._id);
                            setOpenView(true);
                          }
                        }}
                        disabled={!event._id}
                        sx={{
                          borderRadius: "2rem",
                          textTransform: "none",
                          px: 2.5,
                          width: { xs: "100%", sm: "auto" },
                          fontWeight: 600,
                          transition:
                            "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)",
                          "&:hover": {
                            transform: "scale(1.06)",
                          },
                        }}
                      >
                        View Event
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
        onUpdated={fetchRequests}
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
