import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  Stack,
  Divider,
  Button,
  CircularProgress,
  useTheme,
  Chip,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EventIcon from "@mui/icons-material/Event";
import ChatIcon from "@mui/icons-material/Chat";
import StarIcon from "@mui/icons-material/Star";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { NotificationAPI } from "../../api/notification.api";
import { getSocket } from "../../utils/socket";

export default function NotificationDropdown() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const notificationsLoadedRef = useRef(false);
  const unreadInflightRef = useRef(false);

  const open = Boolean(anchorEl);

  const fetchNotifications = async () => {
    if (notificationsLoadedRef.current) return;

    setLoading(true);
    try {
      const notificationsRes = await NotificationAPI.getNotifications({
        limit: 20,
      });
      setNotifications(notificationsRes?.notifications || []);
      notificationsLoadedRef.current = true;
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && !notificationsLoadedRef.current) {
      fetchNotifications();
    }
  }, [open]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewNotification = (notification) => {
      const activeChatEventId = localStorage.getItem("activeChatEventId");

      const notifEventId =
        typeof notification?.data?.eventId === "object"
          ? notification.data.eventId._id
          : notification?.data?.eventId;

      if (
        activeChatEventId &&
        notifEventId &&
        String(notifEventId) === String(activeChatEventId)
      ) {
        return;
      }

      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      const interval = setInterval(async () => {
        if (unreadInflightRef.current) return;
        unreadInflightRef.current = true;

        try {
          const activeChatEventId = localStorage.getItem("activeChatEventId");
          if (activeChatEventId) return;

          const count = await NotificationAPI.getUnreadCount();
          setUnreadCount(count);
        } catch (_) {
        } finally {
          unreadInflightRef.current = false;
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [open]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.readAt) {
      try {
        await NotificationAPI.markAsRead(notification._id);
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, readAt: new Date() } : n,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }

    handleClose();

    const { type, data } = notification;

    if (type === "join-request-response") {
      navigate(`/my-requests?requestId=${data?.requestId || ""}`);
    } else if (type === "join-request") {
      if (data?.eventId) {
        navigate(`/explore?eventId=${data.eventId}&showRequests=true`);
      }
    } else if (type === "message") {
      if (data?.eventId) {
        navigate(`/explore?eventId=${data.eventId}&showChat=true`);
      }
    } else if (type === "rating") {
      if (data?.eventId) {
        navigate(`/explore?eventId=${data.eventId}&showReviews=true`);
      }
    } else if (type === "event-update") {
      if (data?.action === "removed-from-event") {
        if (data?.eventId) {
          navigate(`/explore?eventId=${data.eventId}&viewOnly=true`);
        }
      } else if (data?.action === "member-left-event") {
        if (data?.userId) {
          navigate(`/users/${data.userId}`);
        }
      } else if (data?.eventId) {
        navigate(`/explore?eventId=${data.eventId}`);
      }
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAllRead(true);
    try {
      await NotificationAPI.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt || new Date() })),
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setMarkingAllRead(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "join-request":
        return <PersonAddIcon fontSize="small" />;
      case "join-request-response":
        return <EventIcon fontSize="small" />;
      case "message":
        return <ChatIcon fontSize="small" />;
      case "rating":
        return <StarIcon fontSize="small" />;
      default:
        return <NotificationsIcon fontSize="small" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "join-request":
        return "primary";
      case "join-request-response":
        return "success";
      case "message":
        return "info";
      case "rating":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <>
      <IconButton onClick={handleClick} sx={{ color: "inherit" }}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 360,
            maxWidth: 420,
            maxHeight: 500,
            borderRadius: "1rem",
            background: isDark
              ? "rgba(25,20,40,0.95)"
              : "rgba(255,255,255,0.95)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            overflow: "hidden",
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1 }}
          >
            <Typography variant="h6" fontWeight={700}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={handleMarkAllRead}
                disabled={markingAllRead}
                startIcon={
                  markingAllRead ? (
                    <CircularProgress size={14} />
                  ) : (
                    <CheckCircleIcon fontSize="small" />
                  )
                }
                sx={{ textTransform: "none" }}
              >
                Mark all read
              </Button>
            )}
          </Stack>
        </Box>

        <Divider />

        <Box
          sx={{
            maxHeight: 400,
            overflowY: "auto",
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.05)",
            },
            "&::-webkit-scrollbar-thumb": {
              background: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
              borderRadius: "4px",
            },
          }}
        >
          {loading ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <CircularProgress size={24} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                No notifications yet
              </Typography>
            </Box>
          ) : (
            notifications.map((notification) => (
              <Box
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  p: 2,
                  cursor: "pointer",
                  borderBottom: `1px solid ${
                    isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
                  }`,
                  background: notification.readAt
                    ? "transparent"
                    : isDark
                      ? "rgba(124,77,255,0.1)"
                      : "rgba(124,77,255,0.05)",
                  "&:hover": {
                    background: isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.05)",
                  },
                  transition: "background 0.2s",
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Box
                    sx={{
                      mt: 0.5,
                      color: `${getNotificationColor(notification.type)}.main`,
                    }}
                  >
                    {getNotificationIcon(notification.type)}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={1}
                      sx={{ mb: 0.5 }}
                    >
                      <Typography
                        variant="subtitle2"
                        fontWeight={notification.readAt ? 500 : 700}
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {notification.title}
                      </Typography>
                      {!notification.readAt && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "primary.main",
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </Stack>
                    <Typography
                      variant="body2"
                      sx={{
                        opacity: 0.8,
                        mb: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {notification.message}
                    </Typography>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Chip
                        label={notification.type.replace(/-/g, " ")}
                        size="small"
                        color={getNotificationColor(notification.type)}
                        sx={{
                          height: 20,
                          fontSize: "0.7rem",
                          textTransform: "capitalize",
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ opacity: 0.6, fontSize: "0.7rem" }}
                      >
                        {new Date(notification.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          },
                        )}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            ))
          )}
        </Box>
      </Popover>
    </>
  );
}
