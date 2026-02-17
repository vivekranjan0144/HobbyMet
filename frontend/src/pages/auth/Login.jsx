import { useState } from "react";
import { Card, CardContent, Typography, Box, useTheme } from "@mui/material";

import Button from "../../components/form/Button";
import TextInput from "../../components/form/TextInput";
import PasswordInput from "../../components/form/PasswordInput";

import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [form, setForm] = useState({ emailOrUsername: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(form);
      const back = loc.state?.from?.pathname || "/explore";
      nav(back, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: isDark
          ? "linear-gradient(135deg, #0d0918 0%, #1d1533 40%, #0f081e 100%)"
          : "linear-gradient(135deg, #f8f5ff 0%, #eae3ff 40%, #e2daff 100%)",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        px: { xs: "1.4rem", md: "3rem", lg: "6rem" },
        py: "2rem",
        transition: "0.3s ease",
      }}
    >
      <Box
        sx={{
          display: "flex",
          width: "100%",
          maxWidth: "1400px",
          mx: "auto",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          justifyContent: "space-between",
          gap: "2rem",
          mt: { xs: "2rem", md: "8rem" },
        }}
      >
        <Box
          sx={{
            flex: 1,
            textAlign: { xs: "center", md: "left" },
          }}
        >
          <Typography
            onClick={() => nav("/")}
            sx={{
              fontSize: { xs: "2.4rem", md: "3rem" },
              fontWeight: 900,
              mb: "1rem",
              cursor: "pointer",
              background:
                "linear-gradient(90deg,#c7b3ff,#a78bfa,#7c4dff,#5d2eff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              "&:hover": {
                opacity: 0.85,
              },
            }}
          >
            HobbyMeet
          </Typography>

          <Typography
            sx={{
              fontSize: "1.35rem",
              maxWidth: "420px",
              opacity: isDark ? 0.85 : 0.8,
              lineHeight: 1.45,
              mx: { xs: "auto", md: "0" },
            }}
          >
            Connect, explore & grow your hobbies with creators across the world.
          </Typography>

          <Box sx={{ mt: 3 }}>
            <Typography sx={{ opacity: 0.75, mb: 1 }}>
              Explore events & activities
            </Typography>
            <Typography sx={{ opacity: 0.75, mb: 1 }}>
              Meet hobby creators like you
            </Typography>
            <Typography sx={{ opacity: 0.75 }}>
              Share your passion & learn new skills
            </Typography>
          </Box>
        </Box>

        <Card
          elevation={6}
          sx={{
            width: "100%",
            maxWidth: "380px",
            borderRadius: "1rem",
            background: isDark
              ? "rgba(24,22,38,0.88)"
              : "rgba(255,255,255,0.96)",
            backdropFilter: "blur(18px)",
            border: isDark
              ? "1px solid rgba(255,255,255,0.12)"
              : "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <CardContent component="form" onSubmit={submit} sx={{ p: "2rem" }}>
            <Typography
              variant="h5"
              fontWeight={700}
              textAlign="center"
              sx={{ mb: "1.2rem" }}
            >
              Login to your account
            </Typography>

            <Box sx={{ minHeight: "1.6rem", mb: "1rem" }}>
              <Typography
                color="error"
                sx={{
                  textAlign: "center",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  opacity: error ? 1 : 0,
                  transition: "opacity 0.25s ease",
                }}
              >
                {error || " "}
              </Typography>
            </Box>

            <TextInput
              label="Email or Username"
              name="emailOrUsername"
              value={form.emailOrUsername}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />

            <PasswordInput
              label="Password"
              name="password"
              value={form.password}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 1,
                py: "0.75rem",
                borderRadius: "0.6rem",
                fontSize: "1rem",
                background: "linear-gradient(90deg,#a78bfa,#7c4dff,#5d2eff)",
                "&:hover": {
                  background: "linear-gradient(90deg,#bea8ff,#8c65ff,#6e34ff)",
                },
              }}
            >
              Login
            </Button>

            <Typography
              sx={{
                mt: 3,
                textAlign: "center",
                fontSize: "0.95rem",
                opacity: isDark ? 0.85 : 0.75,
              }}
            >
              New here?{" "}
              <Link
                to="/signup"
                style={{
                  color: "#7c4dff",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Create an account
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Typography
        sx={{
          mt: "3rem",
          mb: "0.5rem",
          textAlign: "center",
          fontSize: "0.85rem",
          opacity: isDark ? 0.65 : 0.6,
          color: isDark ? "#bbb" : "#444",
        }}
      >
        © {new Date().getFullYear()} HobbyMeet — All Rights Reserved.
      </Typography>
    </Box>
  );
}
