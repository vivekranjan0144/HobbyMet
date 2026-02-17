import { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  Grid,
} from "@mui/material";

import Button from "../../components/form/Button";
import TextInput from "../../components/form/TextInput";
import PasswordInput from "../../components/form/PasswordInput";
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [form, setForm] = useState({
    username: "",
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [err, setErr] = useState("");

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await signup(form);
      nav("/explore");
    } catch (e) {
      setErr(e.message || "Signup failed");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: "1.8rem",
        py: "2rem",

        background: isDark
          ? "linear-gradient(135deg, #0d0918 0%, #1d1533 40%, #0f081e 100%)"
          : "linear-gradient(135deg, #f8f5ff 0%, #eae3ff 40%, #e2daff 100%)",
      }}
    >
      <Grid
        container
        spacing={4}
        alignItems="center"
        justifyContent="center"
        sx={{ maxWidth: "1100px", width: "100%" }}
      >
        <Grid item xs={12} md={6}>
          <Typography
            onClick={() => nav("/")}
            sx={{
              fontSize: "2.8rem",
              fontWeight: 900,
              mb: "1rem",
              textAlign: { xs: "center", md: "left" },
              background:
                "linear-gradient(90deg,#c7b3ff,#a78bfa,#7c4dff,#5d2eff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              "&:hover": {
                opacity: 0.85,
              },
              cursor: "pointer",
            }}
          >
            HobbyMeet
          </Typography>

          <Typography
            sx={{
              fontSize: "1.25rem",
              opacity: isDark ? 0.85 : 0.75,
              lineHeight: "1.7rem",
              maxWidth: "430px",
              textAlign: { xs: "center", md: "left" },
              mx: { xs: "auto", md: 0 },
            }}
          >
            Create your account and start discovering people, events and
            communities that fit your hobbies. Build your profile and grow your
            creative journey with HobbyMeet.
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            elevation={3}
            sx={{
              width: "100%",
              maxWidth: "420px",
              borderRadius: "1rem",
              mx: "auto",
              background: isDark
                ? "rgba(24,22,38,0.88)"
                : "rgba(255,255,255,0.96)",
              backdropFilter: "blur(18px)",
              border: isDark
                ? "1px solid rgba(255,255,255,0.12)"
                : "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <CardContent
              component="form"
              onSubmit={submit}
              sx={{ p: "1.8rem" }}
            >
              <Typography
                variant="h5"
                fontWeight={700}
                textAlign="center"
                sx={{ mb: "1.4rem" }}
              >
                Create Your Account
              </Typography>

              <Box sx={{ minHeight: "1.6rem", mb: "1rem" }}>
                <Typography
                  color="error"
                  sx={{
                    textAlign: "center",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    opacity: err ? 1 : 0,
                    transition: "opacity 0.25s ease",
                  }}
                >
                  {err || " "}
                </Typography>
              </Box>

              <TextInput
                label="Username"
                name="username"
                value={form.username}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />

              <TextInput
                label="Full Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />

              <TextInput
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />

              <TextInput
                label="Phone"
                name="phone"
                value={form.phone}
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
                  fontSize: "1rem",
                  borderRadius: "0.5rem",
                  background: "linear-gradient(90deg,#a78bfa,#7c4dff,#5d2eff)",
                  "&:hover": {
                    background:
                      "linear-gradient(90deg,#b9a2ff,#916aff,#6f38ff)",
                  },
                }}
              >
                Create Account
              </Button>

              <Typography
                sx={{
                  mt: 3,
                  textAlign: "center",
                  fontSize: "0.95rem",
                  opacity: isDark ? 0.85 : 0.75,
                }}
              >
                Already have an account?{" "}
                <Link
                  to="/login"
                  style={{
                    color: "#7c4dff",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Login
                </Link>
              </Typography>
            </CardContent>
          </Card>

          <Typography
            sx={{
              mt: "1.8rem",
              textAlign: "center",
              opacity: isDark ? 0.6 : 0.6,
              fontSize: "0.85rem",
            }}
          >
            © {new Date().getFullYear()} HobbyMeet. All Rights Reserved.
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}
