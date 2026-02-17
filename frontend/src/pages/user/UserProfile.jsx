import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Box,
  Typography,
  Avatar,
  Stack,
  Chip,
  CircularProgress,
  Divider,
  Button,
  useTheme,
} from "@mui/material";

import EventIcon from "@mui/icons-material/Event";
import StarIcon from "@mui/icons-material/Star";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { UserAPI } from "../../api/user.api";
import { ReviewAPI } from "../../api/review.api";

export default function UserProfile() {
  const { userId } = useParams();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [ratingSummary, setRatingSummary] = useState({
    avgRating: null,
    count: 0,
  });
  const [recentReviews, setRecentReviews] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventReviewsMap, setEventReviewsMap] = useState({});

  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const p = await UserAPI.getPublicProfile(userId);

        const reviewsRes = await ReviewAPI.getUserReviews(userId, {
          limit: 3,
        });

        let eventsRes = [];
        try {
          const tmp = await UserAPI.getUserEvents(userId, { status: "all" });
          eventsRes = tmp.events || tmp || [];
        } catch {}

        setProfile(p);
        setRatingSummary({
          avgRating:
            typeof reviewsRes?.avgRating === "number"
              ? reviewsRes.avgRating
              : null,
          count: reviewsRes?.count || reviewsRes?.total || 0,
        });
        setRecentReviews(reviewsRes?.reviews || []);
        setEvents(eventsRes);

        const reviewsMap = {};
        await Promise.all(
          eventsRes.map(async (ev) => {
            try {
              const eventReviewsRes = await ReviewAPI.getEventReviews(ev._id, {
                limit: 10,
              });
              if (eventReviewsRes?.reviews) {
                reviewsMap[ev._id] = eventReviewsRes.reviews.filter(
                  (r) => r.type === "event",
                );
              }
            } catch (err) {
              console.error(
                `Failed to fetch reviews for event ${ev._id}:`,
                err,
              );
            }
          }),
        );
        setEventReviewsMap(reviewsMap);
      } catch (e) {
        console.error("Failed to load user profile:", e);
        setError(e?.message || "Failed to load user profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography variant="h6">{error || "User not found"}</Typography>
        <Button
          variant="outlined"
          component={Link}
          to="/explore"
          startIcon={<ArrowBackIcon />}
        >
          Back to Explore
        </Button>
      </Box>
    );
  }

  const social = profile.socialLinks || {};

  const normalizeUrl = (url) => {
    if (!url) return "";
    const trimmed = url.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        px: { xs: "1.2rem", md: "4rem" },
        py: { xs: "6rem", md: "7rem" },
        display: "flex",
        flexDirection: "column",
        gap: "3.5rem",
        position: "relative",
      }}
    >
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: -10,
          background: isDark
            ? "linear-gradient(135deg,#06050c,#120d1c,#1a1330)"
            : "linear-gradient(135deg,#faf7ff,#f2eaff,#ece3ff)",
        }}
      />

      <Box
        className="blob"
        sx={{
          top: "20%",
          left: "10%",
          background: isDark
            ? "rgba(160,120,255,0.28)"
            : "rgba(130,60,255,0.18)",
        }}
      />
      <Box
        className="blob"
        sx={{
          bottom: "15%",
          right: "12%",
          background: isDark
            ? "rgba(160,120,255,0.28)"
            : "rgba(140,90,255,0.18)",
        }}
      />

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Button
          variant="outlined"
          component={Link}
          to="/explore"
          startIcon={<ArrowBackIcon />}
          sx={{ borderRadius: "999px" }}
        >
          Back
        </Button>
      </Stack>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          alignItems: { xs: "center", lg: "flex-start" },
          gap: { xs: 3, lg: 6 },
        }}
      >
        <Stack
          sx={{
            alignItems: "center",
            minWidth: { lg: "280px" },
            textAlign: { xs: "center", lg: "left" },
          }}
        >
          <Avatar
            sx={{
              width: 140,
              height: 140,
              fontSize: "3.4rem",
              background: profile.avatar?.url
                ? "transparent"
                : "linear-gradient(135deg,#a78bfa,#7c4dff,#5d2eff)",
            }}
            src={profile.avatar?.url || undefined}
          >
            {!profile.avatar?.url && profile.username?.[0]
              ? profile.username[0].toUpperCase()
              : ""}
          </Avatar>

          <Typography variant="h5" fontWeight={900} sx={{ mt: 1 }}>
            {profile.name || profile.username}
          </Typography>

          <Typography sx={{ opacity: 0.6 }}>@{profile.username}</Typography>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            <StarIcon
              sx={{
                fontSize: 20,
                color: ratingSummary.avgRating ? "#facc15" : "#9ca3af",
              }}
            />
            <Typography sx={{ opacity: 0.9 }}>
              {ratingSummary.count > 0 && ratingSummary.avgRating != null ? (
                <>
                  {ratingSummary.avgRating.toFixed(1)}{" "}
                  <Typography
                    component="span"
                    sx={{ opacity: 0.7, ml: 0.5, fontSize: "0.9rem" }}
                  >
                    ({ratingSummary.count} review
                    {ratingSummary.count > 1 ? "s" : ""})
                  </Typography>
                </>
              ) : (
                "No reviews yet"
              )}
            </Typography>
          </Stack>
        </Stack>

        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <SectionTitle title="About" />
          <Typography sx={{ opacity: 0.85 }}>
            {profile.bio || "No bio added yet."}
          </Typography>

          <Divider />

          <SectionTitle title="Hobbies & Interests" />
          {profile.hobbies?.length ? (
            <Stack direction="row" spacing={1.2} flexWrap="wrap">
              {profile.hobbies.map((h, i) => (
                <Chip
                  key={i}
                  label={h}
                  sx={{
                    fontWeight: 600,
                    background: isDark
                      ? "rgba(255,255,255,0.12)"
                      : "rgba(0,0,0,0.08)",
                  }}
                />
              ))}
            </Stack>
          ) : (
            <Typography sx={{ opacity: 0.7 }}>No hobbies added.</Typography>
          )}

          <Divider />

          <SectionTitle title="Social Links" />
          {social.facebook ||
          social.instagram ||
          social.twitter ||
          social.linkedin ||
          social.website ? (
            <Stack direction="row" spacing={1.2} flexWrap="wrap">
              {social.facebook && (
                <Chip
                  label="Facebook"
                  component="a"
                  href={normalizeUrl(social.facebook)}
                  target="_blank"
                  rel="noopener noreferrer"
                  clickable
                />
              )}
              {social.instagram && (
                <Chip
                  label="Instagram"
                  component="a"
                  href={normalizeUrl(social.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  clickable
                />
              )}
              {social.twitter && (
                <Chip
                  label="Twitter"
                  component="a"
                  href={normalizeUrl(social.twitter)}
                  target="_blank"
                  rel="noopener noreferrer"
                  clickable
                />
              )}
              {social.linkedin && (
                <Chip
                  label="LinkedIn"
                  component="a"
                  href={normalizeUrl(social.linkedin)}
                  target="_blank"
                  rel="noopener noreferrer"
                  clickable
                />
              )}
              {social.website && (
                <Chip
                  label="Website"
                  component="a"
                  href={normalizeUrl(social.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  clickable
                />
              )}
            </Stack>
          ) : (
            <Typography sx={{ opacity: 0.7 }}>
              No social links shared.
            </Typography>
          )}

          <Divider />

          <SectionTitle title="Events" />
          {events && events.length > 0 ? (
            <Stack spacing={1.2}>
              {events.slice(0, 5).map((ev) => {
                const evReviews = eventReviewsMap[ev._id] || [];

                return (
                  <Box
                    key={ev._id}
                    sx={{
                      p: 1.5,
                      borderRadius: "0.9rem",
                      background: isDark
                        ? "rgba(255,255,255,0.04)"
                        : "rgba(0,0,0,0.03)",
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: evReviews.length > 0 ? 1.5 : 0 }}
                    >
                      <EventIcon sx={{ fontSize: 18, opacity: 0.8 }} />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {ev.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ opacity: 0.8 }}
                          noWrap
                        >
                          {ev.eventDateTime
                            ? new Date(ev.eventDateTime).toLocaleString()
                            : "Date not set"}
                        </Typography>
                      </Box>
                    </Stack>

                    {evReviews.length > 0 && (
                      <Stack
                        spacing={1}
                        sx={{
                          mt: 1.5,
                          pl: 1.5,
                          borderLeft: "2px solid rgba(124,77,255,0.3)",
                        }}
                      >
                        {evReviews.map((review) => (
                          <Stack
                            key={review._id}
                            direction="row"
                            spacing={1}
                            alignItems="flex-start"
                          >
                            <Avatar
                              src={review.reviewerId?.avatar?.url}
                              sx={{ width: 24, height: 24, mt: 0.1 }}
                              component={Link}
                              to={`/users/${review.reviewerId?._id || review.reviewerId}`}
                            >
                              {review.reviewerId?.username?.[0]?.toUpperCase() ||
                                "?"}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Stack
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                                flexWrap="wrap"
                              >
                                <Typography
                                  variant="caption"
                                  fontWeight={600}
                                  component={Link}
                                  to={`/users/${review.reviewerId?._id || review.reviewerId}`}
                                  sx={{
                                    color: "inherit",
                                    textDecoration: "none",
                                    "&:hover": { textDecoration: "underline" },
                                  }}
                                >
                                  {review.reviewerId?.name ||
                                    review.reviewerId?.username ||
                                    "User"}
                                </Typography>
                                <StarIcon
                                  sx={{ fontSize: 14, color: "#facc15" }}
                                />
                                <Typography
                                  variant="caption"
                                  sx={{ opacity: 0.8, fontWeight: 600 }}
                                >
                                  {review.rating}
                                </Typography>
                              </Stack>
                              {review.comment && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: "block",
                                    opacity: 0.85,
                                    mt: 0.3,
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {review.comment}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        ))}
                      </Stack>
                    )}
                  </Box>
                );
              })}
              {events.length > 5 && (
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  + {events.length - 5} more events
                </Typography>
              )}
            </Stack>
          ) : (
            <Typography sx={{ opacity: 0.7 }}>
              No public events found.
            </Typography>
          )}

          <Divider />

          <SectionTitle title="Recent Reviews" />
          {recentReviews && recentReviews.length > 0 ? (
            <Stack spacing={1.5}>
              {recentReviews.map((r) => (
                <Box
                  key={r._id}
                  sx={{
                    p: 1.4,
                    borderRadius: "1rem",
                    background: isDark
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(0,0,0,0.03)",
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Avatar
                      src={r.reviewerId?.avatar?.url}
                      sx={{ width: 32, height: 32 }}
                      component={Link}
                      to={`/users/${r.reviewerId?._id || r.reviewerId}`}
                    >
                      {r.reviewerId?.username?.[0]?.toUpperCase() || "?"}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flexWrap="wrap"
                        sx={{ mb: 0.5 }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          component={Link}
                          to={`/users/${r.reviewerId?._id || r.reviewerId}`}
                          sx={{
                            color: "inherit",
                            textDecoration: "none",
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          {r.reviewerId?.name ||
                            r.reviewerId?.username ||
                            "User"}
                        </Typography>
                        <StarIcon sx={{ fontSize: 16, color: "#facc15" }} />
                        <Typography variant="body2" fontWeight={600}>
                          {r.rating} / 5
                        </Typography>
                        {r.eventId?.title && (
                          <>
                            <Typography variant="body2" sx={{ opacity: 0.6 }}>
                              ·
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ opacity: 0.8, fontStyle: "italic" }}
                              noWrap
                            >
                              {r.eventId.title}
                            </Typography>
                          </>
                        )}
                      </Stack>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {r.comment || "No comment provided."}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography sx={{ opacity: 0.7 }}>No reviews to show.</Typography>
          )}
        </Box>
      </Box>

      <style>
        {`
        .blob {
          position: fixed;
          width: 260px;
          height: 260px;
          filter: blur(70px);
          border-radius: 50%;
          z-index: -3;
          animation: wave 18s infinite alternate ease-in-out;
        }
        @keyframes wave {
          0% { transform: scale(1); }
          100% { transform: scale(1.2); }
        }
      `}
      </style>
    </Box>
  );
}

function SectionTitle({ title }) {
  return (
    <Typography
      variant="h6"
      fontWeight={900}
      sx={{
        mb: 1,
        fontSize: "1.08rem",
        background: "linear-gradient(90deg,#c7b3ff,#a78bfa,#7c4dff,#5d2eff)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
    >
      {title}
    </Typography>
  );
}
