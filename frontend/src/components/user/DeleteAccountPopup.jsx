import { useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import Button from "../form/Button";
import PasswordInput from "../form/PasswordInput";
import { UserAPI } from "../../api/user.api";
import { useAuth } from "../../context/AuthContext";

export default function DeleteAccountPopup({ onClose }) {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { logout } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");

    try {
      await UserAPI.deleteAccount(password);
      setMsg("Account deleted successfully ✅");
      logout();

      setTimeout(() => onClose(), 900);
    } catch (e) {
      setErr(e.message || "Failed to delete account");
    }
  };

  return (
    <Box
      component="form"
      onSubmit={submit}
      sx={{
        width: "100%",
        maxWidth: "420px",
        p: 3,
        borderRadius: "1.6rem",

        background: isDark
          ? "rgba(255,255,255,0.08)"
          : "rgba(255,255,255,0.45)",
        backdropFilter: "blur(16px) saturate(160%)",
        WebkitBackdropFilter: "blur(16px) saturate(160%)",
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow: "0 12px 50px rgba(0,0,0,0.35)",

        display: "flex",
        flexDirection: "column",
        gap: 2,
        animation: "fadeIn 0.35s ease",
      }}
    >
      <Typography
        variant="h6"
        fontWeight={900}
        sx={{
          textAlign: "center",
          fontSize: "1.35rem",
          mb: 1,
          background: "linear-gradient(90deg,#ff7b7b,#ff4d4d,#d92222)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Delete Account
      </Typography>

      <Box
        sx={{
          background: isDark ? "rgba(255,0,0,0.15)" : "rgba(255,0,0,0.12)",
          border: "1px solid rgba(255,0,0,0.35)",
          borderRadius: "12px",
          p: 2,
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            color: "#ff4d4d",
            fontSize: "1rem",
          }}
        >
          ⚠️ Warning: This action is permanent.
        </Typography>

        <Typography
          sx={{
            opacity: 0.9,
            mt: 1,
            fontSize: "0.92rem",
            color: isDark ? "#f5f5f5" : "#333",
            lineHeight: 1.4,
          }}
        >
          All your data, posts, hobbies, and preferences will be deleted
          permanently. This cannot be undone.
        </Typography>
      </Box>

      {msg && (
        <Typography
          sx={{
            textAlign: "center",
            fontWeight: 600,
            color: "#00e676",
          }}
        >
          {msg}
        </Typography>
      )}

      {err && (
        <Typography
          sx={{
            textAlign: "center",
            fontWeight: 600,
            color: "#ff5252",
          }}
        >
          {err}
        </Typography>
      )}

      <PasswordInput
        label="Confirm Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        color="error"
        sx={{
          mt: 2,
          py: 1.2,
          borderRadius: "10rem",
          fontSize: "1rem",
          background: "linear-gradient(90deg,#ff4d4d,#e63939,#c91a1a)",
          "&:hover": {
            background: "linear-gradient(90deg,#ff6b6b,#ff4d4d,#d63030)",
          },
        }}
      >
        Delete My Account
      </Button>

      <Button
        fullWidth
        onClick={onClose}
        sx={{
          py: 1.1,
          borderRadius: "10rem",
          opacity: 0.8,
          "&:hover": { opacity: 1 },
          color: isDark ? "#fff" : "#333",
        }}
      >
        Cancel
      </Button>

      <style>
        {`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(.96) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}
      </style>
    </Box>
  );
}
