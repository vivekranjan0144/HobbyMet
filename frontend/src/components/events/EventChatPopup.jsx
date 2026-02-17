import { useEffect, useRef, useState } from "react";
import {
  Box,
  Modal,
  Stack,
  Typography,
  IconButton,
  TextField,
  Button,
  CircularProgress,
  useTheme,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";

import { EventAPI } from "../../api/event.api";
import { AuthAPI } from "../../api/auth.api";

export default function EventChatPopup({ open, onClose, eventId, eventTitle }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const bottomRef = useRef(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChat = async () => {
    if (!eventId) return;
    setLoading(true);
    setMsg("");
    try {
      const [me, data] = await Promise.all([
        AuthAPI.me(),
        EventAPI.getEventChat(eventId),
      ]);
      setCurrentUserId(me.id || me._id);
      const list = Array.isArray(data) ? data : data.messages || [];
      setMessages(list);
      if (!list.length) {
        setMsg("No messages yet. Start the conversation!");
      }
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error("Failed to load chat:", err);
      const m =
        err?.message ||
        err?.response?.data?.message ||
        "❌ Failed to load chat";
      setMsg(m);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const newMsg = await EventAPI.sendEventMessage(eventId, input.trim());
      setMessages((prev) => [...prev, newMsg]);
      setInput("");
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error("Failed to send message:", err);
      const m =
        err?.message ||
        err?.response?.data?.message ||
        "❌ Failed to send message";
      setMsg(m);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (open && eventId) {
      fetchChat();
    } else if (!open) {
      setMessages([]);
      setMsg("");
      setInput("");
    }
  }, [open, eventId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "92%",
          maxWidth: 650,
          borderRadius: "1.4rem",
          overflow: "hidden",
          boxShadow: "0 10px 35px rgba(0,0,0,0.45)",
          background: isDark
            ? "linear-gradient(135deg, rgba(12,10,25,0.98), rgba(20,16,40,0.98))"
            : "#ffffff",
          display: "flex",
          flexDirection: "column",
          maxHeight: "82vh",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 3,
            py: 1.8,
            borderBottom: isDark
              ? "1px solid rgba(255,255,255,0.12)"
              : "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ opacity: 0.8, fontSize: "0.8rem" }}
            >
              Event Chat
            </Typography>
            <Typography
              variant="h6"
              fontWeight={800}
              sx={{
                background:
                  "linear-gradient(90deg,#c7b3ff,#a78bfa,#7c4dff,#5d2eff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                maxWidth: "360px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {eventTitle || "Event Room"}
            </Typography>
          </Box>

          <IconButton type="button" onClick={onClose} color="inherit">
            <CloseIcon />
          </IconButton>
        </Stack>

        <Box
          sx={{
            flex: 1,
            p: 2,
            overflowY: "auto",
            bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
          }}
        >
          {loading ? (
            <Box
              sx={{
                minHeight: 240,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <>
              {messages.map((m) => {
                const uid =
                  typeof m.userId === "object" && m.userId !== null
                    ? m.userId._id
                    : m.userId;
                const isMe =
                  currentUserId && String(uid) === String(currentUserId);

                const name =
                  typeof m.userId === "object" && m.userId !== null
                    ? m.userId.name || m.userId.username || "User"
                    : "User";

                return (
                  <Stack
                    key={m._id}
                    direction="row"
                    justifyContent={isMe ? "flex-end" : "flex-start"}
                    sx={{ mb: 1 }}
                  >
                    <Box
                      sx={{
                        maxWidth: "75%",
                        px: 1.4,
                        py: 0.8,
                        borderRadius: "1.1rem",
                        borderBottomRightRadius: isMe ? "0.3rem" : "1.1rem",
                        borderBottomLeftRadius: isMe ? "1.1rem" : "0.3rem",
                        background: isMe
                          ? "linear-gradient(135deg,#a78bfa,#7c4dff,#5d2eff)"
                          : isDark
                            ? "rgba(255,255,255,0.05)"
                            : "rgba(0,0,0,0.03)",
                      }}
                    >
                      {!isMe && (
                        <Typography
                          variant="caption"
                          sx={{ opacity: 0.8, fontSize: "0.7rem" }}
                        >
                          {name}
                        </Typography>
                      )}
                      <Typography
                        variant="body2"
                        sx={{ color: isMe ? "#fff" : "inherit" }}
                      >
                        {m.text}
                      </Typography>
                      {m.sentAt && (
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            mt: 0.3,
                            fontSize: "0.7rem",
                            opacity: isMe ? 0.85 : 0.6,
                          }}
                        >
                          {new Date(m.sentAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                );
              })}

              {msg && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    textAlign: "center",
                    mt: 1,
                    opacity: 0.7,
                  }}
                >
                  {msg}
                </Typography>
              )}

              <div ref={bottomRef} />
            </>
          )}
        </Box>

        <Box
          sx={{
            borderTop: isDark
              ? "1px solid rgba(255,255,255,0.12)"
              : "1px solid rgba(0,0,0,0.08)",
            p: 1.3,
          }}
        >
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              size="small"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              type="button"
              variant="contained"
              startIcon={<SendIcon />}
              disabled={sending || !input.trim()}
              onClick={handleSend}
              sx={{
                borderRadius: "999px",
                px: 2.2,
                textTransform: "none",
                background: "linear-gradient(135deg,#a78bfa,#7c4dff,#5d2eff)",
              }}
            >
              {sending ? "Sending..." : "Send"}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Modal>
  );
}
