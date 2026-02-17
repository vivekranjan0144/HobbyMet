import {
  Box,
  Typography,
  Stack,
  Grid,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import hobbyLogo from "../../assets/hobby.png";

export default function Home() {
  const { user } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box sx={{ position: "relative", overflowX: "hidden" }}>
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: -5,
          background: isDark
            ? "linear-gradient(135deg, #0c0818, #1b1230, #0e071e)"
            : "linear-gradient(135deg, #f5efff, #ece3ff, #e6dbff)",
          animation: "bgWave 18s infinite alternate ease-in-out",
        }}
      />
      <Box className="hm-blob" sx={{ top: "12%", left: "10%" }} />
      <Box className="hm-blob" sx={{ bottom: "14%", right: "15%" }} />
      <Box className="hm-blob" sx={{ top: "52%", right: "6%" }} />
      {[...Array(22)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: "fixed",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: isDark ? "#b68cff" : "#7c4dff",
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: 0.25,
            animation: `floatParticle ${3 + Math.random() * 5}s infinite ease-in-out`,
            zIndex: -3,
          }}
        />
      ))}

      <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 12 }, pb: 8 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 6, md: 10 }}
          alignItems="center"
          justifyContent="space-between"
        >
          <Box
            sx={{
              order: { xs: 2, md: 1 },
              maxWidth: 520,
              width: "100%",
              animation: "floatY 5s ease-in-out infinite",
              filter: "drop-shadow(0 18px 40px rgba(0,0,0,0.35))",
            }}
          >
            <img
              src={hobbyLogo}
              alt="HobbyMeet"
              style={{ width: "100%", height: "auto", objectFit: "contain" }}
            />
          </Box>

          <Box
            sx={{
              order: { xs: 1, md: 2 },
              textAlign: { xs: "center", md: "left" },
              maxWidth: 640,
            }}
          >
            <Typography
              variant="h2"
              fontWeight={900}
              sx={{
                mb: 1.5,
                lineHeight: 1.6,
                background:
                  "linear-gradient(90deg,#c7b3ff,#a78bfa,#7c4dff,#5d2eff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "glow 3s infinite ease-in-out",
              }}
            >
              HobbyMeet
            </Typography>

            <Typography
              variant="h6"
              sx={{
                opacity: 0.95,
                mb: 3,
                maxWidth: 560,
                fontSize: { xs: "16px", sm: "18px" },
                lineHeight: 1.6,
              }}
            >
              India’s first hobby-based social platform — where creativity meets
              connection.
              <span className="hm-rotator">
                <span className="hm-line">Create exciting hobby events.</span>
                <span className="hm-line">
                  Discover amazing people near you.
                </span>
                <span className="hm-line">
                  Join communities that match your passion.
                </span>
                <span className="hm-line">
                  Explore trending activities every week.
                </span>
                <span className="hm-line">
                  Level up your hobby achievements.
                </span>
              </span>
            </Typography>

            {!user && (
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                justifyContent={{ xs: "center", md: "flex-start" }}
              >
                <Button
                  component={Link}
                  to="/signup"
                  size="large"
                  variant="contained"
                  sx={{ px: 5 }}
                >
                  Get Started
                </Button>
                <Button
                  component={Link}
                  to="/login"
                  size="large"
                  variant="outlined"
                  sx={{ px: 5 }}
                >
                  Login
                </Button>
              </Stack>
            )}
          </Box>
        </Stack>
      </Container>

      <Container
        maxWidth="lg"
        sx={{
          py: { xs: "4rem", md: "6rem" },
        }}
      >
        <Typography
          variant="h4"
          fontWeight={800}
          textAlign="center"
          sx={{
            mb: "3rem",
            fontSize: { xs: "1.75rem", md: "2.2rem" },
            letterSpacing: "0.02em",
          }}
        >
          Explore HobbyMeet Universe
        </Typography>

        <Grid
          container
          spacing={{ xs: 2, sm: 3, md: 3 }}
          justifyContent="center"
          alignItems="stretch"
        >
          {[
            {
              icon: "🎨",
              title: "Host Hobby Events",
              text: "Art jams, dance sessions, gaming battles, book clubs & more.",
            },
            {
              icon: "📍",
              title: "Meet Nearby Creatives",
              text: "Instantly match with people around you who share your hobbies.",
            },
            {
              icon: "⚡",
              title: "Smart Hobby Profile",
              text: "Auto-manages interests, privacy, location & hobby strengths.",
            },
            {
              icon: "🔥",
              title: "Trending Activities",
              text: "See what’s trending and join exciting hobby meetups.",
            },
            {
              icon: "💬",
              title: "Hobby Chatrooms",
              text: "Join topic-based chats like art, fitness, music, travel & more.",
            },
            {
              icon: "🏆",
              title: "Badges & Achievements",
              text: "Attend events, complete challenges & unlock badges.",
            },
          ].map((f, i) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              key={i}
              sx={{ display: "flex", justifyContent: "center" }}
            >
              <Box className="hm-feature-card">
                <Box className="hm-feature-inner">
                  <Typography className="hm-feature-icon">{f.icon}</Typography>

                  <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{
                      mt: "0.6rem",
                      fontSize: { xs: "1.15rem", md: "1.25rem" },
                    }}
                  >
                    {f.title}
                  </Typography>

                  <Typography
                    sx={{
                      opacity: 0.85,
                      mt: "0.4rem",
                      fontSize: { xs: "0.9rem", md: "1rem" },
                      textAlign: "center",
                      lineHeight: 1.6,
                      px: "0.5rem",
                    }}
                  >
                    {f.text}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

        <style>
          {`
      .hm-feature-card {
        width: 100%;
        max-width: 22rem;
        min-height: 15rem;
        padding: 1.6rem;

        border-radius: 1.2rem;
        background: rgba(255, 255, 255, 0.16);
        backdrop-filter: blur(1.2rem);
        -webkit-backdrop-filter: blur(1.2rem);

        border: 1px solid rgba(255, 255, 255, 0.25);
        box-shadow: 0 0.8rem 2rem rgba(0, 0, 0, 0.12);

        display: flex;
        align-items: center;
        justify-content: center;

        cursor: pointer;
        transition: all 0.35s ease;
      }

      .hm-feature-card:hover {
        transform: translateY(-0.5rem) scale(1.02);
        border-color: rgba(150,110,255,0.6);
        box-shadow: 0 1.4rem 3rem rgba(0,0,0,0.25);
      }

      .hm-feature-inner {
        text-align: center;
        width: 100%;
      }

      .hm-feature-icon {
        font-size: 2.8rem;
        transition: 0.3s;
      }

      .hm-feature-card:hover .hm-feature-icon {
        transform: scale(1.15);
      }

      @media (max-width: 600px) {
        .hm-feature-card {
          min-height: 13.5rem;
          padding: 1.2rem;
        }
      }
    `}
        </style>
      </Container>

      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Typography
          variant="h4"
          fontWeight={800}
          textAlign="center"
          sx={{ mb: 5 }}
        >
          How HobbyMeet Works
        </Typography>

        <Grid container spacing={3} alignItems="stretch">
          {[
            {
              step: 1,
              title: "Create Your Profile",
              text: "Add your hobbies, set privacy, and optionally enable live location for nearby discovery.",
            },
            {
              step: 2,
              title: "Find Your Tribe",
              text: "HobbyMeet suggests people around you with matching interests — follow, chat, and plan.",
            },
            {
              step: 3,
              title: "Host & Join Events",
              text: "Create meetups in seconds or join trending gatherings around your city.",
            },
            {
              step: 4,
              title: "Grow Your Journey",
              text: "Earn badges, track participation, and build a hobby portfolio you’re proud of.",
            },
          ].map((s, idx) => {
            const leftSide = idx % 2 === 0;
            return (
              <Grid
                item
                xs={12}
                key={s.step}
                sx={{
                  display: "flex",
                  justifyContent: leftSide ? "flex-start" : "flex-end",
                }}
              >
                <Box
                  className="hiwStep"
                  sx={{
                    width: { xs: "100%", md: "75%" },
                    borderRadius: 4,
                    p: 2,
                    background: isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(255,255,255,0.35)",
                    backdropFilter: "blur(10px)",
                    transformOrigin: leftSide ? "left center" : "right center",
                    animation: leftSide
                      ? "slideInL 0.7s ease"
                      : "slideInR 0.7s ease",
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Chip
                      label={`Step ${s.step}`}
                      color="primary"
                      sx={{ fontWeight: 800 }}
                    />
                    <Box>
                      <Typography
                        variant="h6"
                        fontWeight={800}
                        sx={{ mb: 0.5 }}
                      >
                        {s.title}
                      </Typography>
                      <Typography sx={{ opacity: 0.9 }}>{s.text}</Typography>
                    </Box>
                  </Stack>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Container>

      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Typography
          variant="h4"
          fontWeight={800}
          textAlign="center"
          sx={{ mb: 3 }}
        >
          Why Choose HobbyMeet?
        </Typography>
        <Typography textAlign="center" sx={{ mb: 4, opacity: 0.9 }}>
          Built for real-world connections, safe discovery, and zero-friction
          events.
        </Typography>

        <Grid container spacing={3}>
          {[
            {
              title: "Privacy First",
              text: "Toggle visibility of email, phone, and location anytime.",
            },
            {
              title: "Hyperlocal Discovery",
              text: "Find hobbyists around you with precise matching.",
            },
            {
              title: "Superfast Events",
              text: "Create & share events in seconds, not hours.",
            },
            {
              title: "Badge System",
              text: "Stay motivated with levels, milestones and badges.",
            },
          ].map((b, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 4,
                  p: 1,
                  background: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(255,255,255,0.35)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                    {b.title}
                  </Typography>
                  <Typography sx={{ opacity: 0.9 }}>{b.text}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          justifyContent="center"
          sx={{ mt: 3 }}
        >
          {[
            "Free to start",
            "No spam, no clutter",
            "Dark Mode Ready",
            "Event reminders",
            "Community powered",
            "Mobile-first design",
          ].map((t) => (
            <Chip
              key={t}
              label={t}
              variant="outlined"
              sx={{ m: 0.5, fontWeight: 600 }}
            />
          ))}
        </Stack>
      </Container>

      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Typography
          variant="h4"
          fontWeight={800}
          textAlign="center"
          sx={{ mb: 5 }}
        >
          Creators & Events Highlights
        </Typography>

        <Grid container spacing={3} justifyContent="center">
          {[
            { big: "120K+", sub: "Creators Onboard" },
            { big: "8K+", sub: "Monthly Events" },
            { big: "220+", sub: "Cities Covered" },
            { big: "∞", sub: "Hobby Possibilities" },
          ].map((m, i) => (
            <Grid item xs={12} sm={6} md={3} key={i} sx={{ display: "flex" }}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 4,
                  textAlign: "center",
                  width: "100%",
                  background: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(255,255,255,0.35)",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                }}
              >
                <Typography
                  variant="h3"
                  fontWeight={900}
                  sx={{
                    background:
                      "linear-gradient(90deg,#c7b3ff,#a78bfa,#7c4dff,#5d2eff)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {m.big}
                </Typography>
                <Typography sx={{ opacity: 0.9, mt: 0.5 }}>{m.sub}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Container maxWidth="md" sx={{ py: { xs: 8, md: 10 } }}>
        <Typography
          variant="h4"
          fontWeight={800}
          textAlign="center"
          sx={{ mb: 4 }}
        >
          Frequently Asked Questions
        </Typography>

        {[
          {
            q: "Is my location visible to everyone?",
            a: "No. You fully control visibility with Privacy settings. You can show/hide email, phone, and live location independently. We never expose exact coordinates to public feeds.",
          },
          {
            q: "Do I need to verify my account?",
            a: "You can start immediately. For hosting large or public events, quick verification may be required to maintain safety and trust.",
          },
          {
            q: "How do I find people with similar hobbies?",
            a: "Turn on live location (optional). HobbyMeet suggests nearby people and events based on your interests, distance, and activity history.",
          },
          {
            q: "Can I delete my account and data?",
            a: "Absolutely. You can export your data and delete your account anytime from settings. We permanently remove your personal data on deletion.",
          },
          {
            q: "Is HobbyMeet free?",
            a: "Yes. Core features are free. We may add optional premium tools later for power users and organizers.",
          },
        ].map((f, i) => (
          <Accordion
            key={i}
            disableGutters
            sx={{
              mb: 1.5,
              borderRadius: 2,
              overflow: "hidden",
              background: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(255,255,255,0.35)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              "&:before": { display: "none" },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={800}>{f.q}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography sx={{ opacity: 0.95 }}>{f.a}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Container>

      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Card
          sx={{
            borderRadius: 4,
            p: { xs: 3, md: 5 },
            textAlign: "center",
            background:
              "linear-gradient(135deg, rgba(124,77,255,0.25), rgba(93,46,255,0.25))",
            backdropFilter: "blur(10px)",
          }}
        >
          <Typography variant="h4" fontWeight={900} sx={{ mb: 1 }}>
            Ready to transform your free time?
          </Typography>
          <Typography sx={{ opacity: 0.9, mb: 3 }}>
            Discover people, host events and grow your passion with HobbyMeet.
          </Typography>
          {!user ? (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="center"
            >
              <Button
                component={Link}
                to="/signup"
                size="large"
                variant="contained"
                sx={{ px: 5 }}
              >
                Create Free Account
              </Button>
              <Button
                component={Link}
                to="/login"
                size="large"
                variant="outlined"
                sx={{ px: 5 }}
              >
                Login
              </Button>
            </Stack>
          ) : (
            <Button
              component={Link}
              to="/me"
              size="large"
              variant="contained"
              sx={{ px: 5 }}
            >
              Go to Dashboard
            </Button>
          )}
        </Card>
      </Container>

      <Box sx={{ py: 6, textAlign: "center", opacity: 0.75 }}>
        <Typography variant="body2">
          © {new Date().getFullYear()} HobbyMeet
        </Typography>
        <Typography variant="body2">
          Made with hobbies, for hobbyists ♥
        </Typography>
      </Box>

      <style>
        {`
          @keyframes floatY {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-18px); }
            100% { transform: translateY(0); }
          }
          @keyframes glow {
            0% { filter: brightness(1); }
            50% { filter: brightness(1.2); }
            100% { filter: brightness(1); }
          }
          @keyframes pulse {
            0% { opacity: 0.72; }
            50% { opacity: 1; }
            100% { opacity: 0.72; }
          }
          @keyframes floatParticle {
            0% { transform: translateY(0px); opacity: 0.25; }
            50% { transform: translateY(-12px); opacity: 0.6; }
            100% { transform: translateY(0px); opacity: 0.25; }
          }
          @keyframes bgWave {
            0% { transform: scale(1); }
            100% { transform: scale(1.16); }
          }
          @keyframes slideInL {
            0% { opacity: 0; transform: translateX(-24px); }
            100% { opacity: 1; transform: translateX(0); }
          }
          @keyframes slideInR {
            0% { opacity: 0; transform: translateX(24px); }
            100% { opacity: 1; transform: translateX(0); }
          }

          .hm-blob {
            position: fixed;
            width: 260px;
            height: 260px;
            background: rgba(160,120,255,0.28);
            filter: blur(70px);
            border-radius: 50%;
            z-index: -2;
            animation: bgWave 11s infinite alternate ease-in-out;
          }

          /* Rotator (no overlap) */
          .hm-rotator {
            display: block;
            margin-top: 6px;
            height: 26px;
            position: relative;
            overflow: hidden;
          }
          .hm-line {
            position: absolute;
            width: 100%;
            opacity: 0;
            left: 0;
            transform: translateY(16px);
            white-space: nowrap;
            color: #a78bfa;
            font-weight: 700;
            animation: hmCycle 12s infinite ease-in-out;
          }
          .hm-line:nth-child(1) { animation-delay: 0s;   }
          .hm-line:nth-child(2) { animation-delay: 2.4s; }
          .hm-line:nth-child(3) { animation-delay: 4.8s; }
          .hm-line:nth-child(4) { animation-delay: 7.2s; }
          .hm-line:nth-child(5) { animation-delay: 9.6s; }
          @keyframes hmCycle {
            0%    { opacity: 0; transform: translateY(16px); }
            5%    { opacity: 1; transform: translateY(0); }
            17%   { opacity: 1; transform: translateY(0); }
            24%   { opacity: 0; transform: translateY(-16px); }
            100%  { opacity: 0; transform: translateY(-16px); }
          }

          /* Glass tile card */
          .tileCard {
            width: 100%;
            max-width: 360px;
            min-height: 220px;
            border-radius: 18px;
            padding: 22px;
            background: rgba(255,255,255,0.18);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255,255,255,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            transition: all 0.35s ease;
            cursor: pointer;
            box-shadow: 0 8px 22px rgba(0,0,0,0.12);
          }
          .tileCard:hover {
            transform: translateY(-10px);
            box-shadow: 0 16px 32px rgba(0,0,0,0.25);
            border-color: rgba(150,110,255,0.5);
          }
          .tileInner {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          @media (max-width: 600px) {
            .tileCard { min-height: 180px; border-radius: 16px; }
          }
        `}
      </style>
    </Box>
  );
}
