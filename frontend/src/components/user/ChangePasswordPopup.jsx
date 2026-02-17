import { useState } from "react";
import { Typography, Box, useTheme } from "@mui/material";
import PasswordInput from "../form/PasswordInput";
import Button from "../form/Button";
import { AuthAPI } from "../../api/auth.api";

export default function ChangePasswordPopup({ onClose }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const change = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");

    try {
      await AuthAPI.updatePassword(form);
      setMsg("Password updated successfully ✅");

      setTimeout(() => onClose(), 900);
    } catch (e) {
      setErr(e.message || "Failed to update password");
    }
  };

  return (
    <Box
      component="form"
      onSubmit={submit}
      sx={{
        width: "100%",
        maxWidth: 420,
        p: 3,
        borderRadius: "1.8rem",

        background: isDark
          ? "rgba(255,255,255,0.08)"
          : "rgba(255,255,255,0.45)",
        backdropFilter: "blur(18px) saturate(160%)",
        WebkitBackdropFilter: "blur(18px) saturate(160%)",
        border: "1px solid rgba(255,255,255,0.2)",
        boxShadow: isDark
          ? "0 10px 45px rgba(0,0,0,0.45)"
          : "0 10px 45px rgba(0,0,0,0.25)",

        display: "flex",
        flexDirection: "column",
        gap: 2,
        animation: "popupFade 0.35s ease",
      }}
    >
      <Typography
        variant="h6"
        fontWeight={900}
        sx={{
          mb: 1,
          textAlign: "center",
          fontSize: "1.35rem",
          letterSpacing: ".6px",
          background: "linear-gradient(90deg,#c7b3ff,#a78bfa,#7c4dff,#5d2eff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Change Password
      </Typography>

      <Box
        sx={{
          p: 2,
          borderRadius: "1rem",
          mb: 1,
          background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
        }}
      >
        <Typography fontWeight={700} sx={{ fontSize: ".95rem", mb: 1 }}>
          ✅ New Password Requirements:
        </Typography>

        <Typography sx={{ opacity: 0.85, fontSize: ".88rem", lineHeight: 1.5 }}>
          • Minimum 6 characters • Must include uppercase & lowercase letters •
          At least one number • Matching confirm password
        </Typography>
      </Box>

      {msg && (
        <Typography
          sx={{
            textAlign: "center",
            color: "#00e676",
            fontWeight: 600,
            mb: 1,
          }}
        >
          {msg}
        </Typography>
      )}

      {err && (
        <Typography
          sx={{
            textAlign: "center",
            color: "#ff5252",
            fontWeight: 600,
            mb: 1,
          }}
        >
          {err}
        </Typography>
      )}

      <PasswordInput
        label="Current Password"
        name="currentPassword"
        value={form.currentPassword}
        onChange={change}
      />

      <PasswordInput
        label="New Password"
        name="newPassword"
        value={form.newPassword}
        onChange={change}
      />

      <PasswordInput
        label="Confirm New Password"
        name="confirmPassword"
        value={form.confirmPassword}
        onChange={change}
      />

      <Button
        fullWidth
        type="submit"
        variant="contained"
        sx={{
          py: 1.2,
          mt: 1,
          borderRadius: "10rem",
          fontSize: "1rem",
          background: "linear-gradient(90deg,#a78bfa,#7c4dff,#5d2eff)",
          "&:hover": {
            background: "linear-gradient(90deg,#c6b3ff,#9871ff,#6b33ff)",
          },
        }}
      >
        Update Password
      </Button>

      <Button
        fullWidth
        onClick={onClose}
        sx={{
          py: 1.1,
          borderRadius: "10rem",
          opacity: 0.8,
          color: isDark ? "#fff" : "#333",
          "&:hover": {
            opacity: 1,
            background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
          },
        }}
      >
        Cancel
      </Button>

      <style>
        {`
        @keyframes popupFade {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}
      </style>
    </Box>
  );
}
