import {
  Box,
  Typography,
  Avatar,
  Stack,
  Chip,
  Divider,
  Button,
  useTheme,
  Rating,
  Paper,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";
import DeleteIcon from "@mui/icons-material/Delete";

import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import ChangePasswordPopup from "../../components/user/ChangePasswordPopup";
import DeleteAccountPopup from "../../components/user/DeleteAccountPopup";
import api from "../../utils/fetch";
import { EventAPI } from "../../api/event.api";
import { ReviewAPI } from "../../api/review.api";
import EventIcon from "@mui/icons-material/Event";
import StarIcon from "@mui/icons-material/Star";

export default function Me() {
  const { user } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [locationText, setLocationText] = useState("Loading...");
  const [openPasswordPopup, setOpenPasswordPopup] = useState(false);
  const [openDeletePopup, setOpenDeletePopup] = useState(false);

  const [rating, setRating] = useState({ avgRating: null, count: 0 });
  const [myEvents, setMyEvents] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [eventReviewsMap, setEventReviewsMap] = useState({});

  if (!user) return null;

  useEffect(() => {
    const coords = user.location?.coordinates;
    if (!coords) return;

    const [lng, lat] = coords;

    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    )
      .then((res) => res.json())
      .then((data) => {
        const { city, town, suburb, state, country } = data.address || {};
        setLocationText(
          city || town || suburb || state || country || "Unknown",
        );
      })
      .catch(() => setLocationText("Unknown"));
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;

    (async () => {
      try {
        const [reviewsRes, eventsRes] = await Promise.all([
          api.get(`/users/${user.id}/reviews?limit=50`),
          EventAPI.getMyCreatedEvents({ limit: 5 }),
        ]);

        if (!isMounted) return;

        const { avgRating, count, reviews } = reviewsRes.data || {};
        setRating({
          avgRating: typeof avgRating === "number" ? avgRating : null,
          count: count || 0,
        });
        setMyReviews(reviews || []);

        const events = Array.isArray(eventsRes)
          ? eventsRes
          : eventsRes.events || [];
        setMyEvents(events);

        const reviewsMap = {};
        await Promise.all(
          events.map(async (ev) => {
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
        if (isMounted) {
          setEventReviewsMap(reviewsMap);
        }
      } catch (e) {
        console.error("Failed to load user data:", e);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const social = user.socialLinks || {};

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

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          alignItems: { lg: "flex-start" },
          gap: { xs: 4, lg: 6 },
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
              background: user.avatar?.url
                ? "transparent"
                : "linear-gradient(135deg,#a78bfa,#7c4dff,#5d2eff)",
            }}
            src={user.avatar?.url || undefined}
          >
            {!user.avatar?.url && user.username?.[0]
              ? user.username[0].toUpperCase()
              : ""}
          </Avatar>

          <Typography variant="h5" fontWeight={900} sx={{ mt: 1 }}>
            {user.name}
          </Typography>

          <Typography sx={{ opacity: 0.6 }}>@{user.username}</Typography>

          <Typography sx={{ opacity: 0.85, mt: 1 }}>
            📍 {locationText}
          </Typography>

          <Stack spacing={1.2} sx={{ width: "100%", maxWidth: "260px", mt: 3 }}>
            <Button
              component={Link}
              to="/update-profile"
              variant="outlined"
              startIcon={<EditIcon />}
              sx={{ py: 1.1, borderRadius: "8rem" }}
            >
              Edit Profile
            </Button>

            <Button
              variant="contained"
              onClick={() => setOpenPasswordPopup(true)}
              startIcon={<LockIcon />}
              sx={{
                py: 1.1,
                borderRadius: "8rem",
                background: "linear-gradient(90deg,#a78bfa,#7c4dff,#5d2eff)",
              }}
            >
              Change Password
            </Button>

            <Button
              variant="outlined"
              onClick={() => setOpenDeletePopup(true)}
              color="error"
              startIcon={<DeleteIcon />}
              sx={{
                py: 1.1,
                borderRadius: "8rem",
              }}
            >
              Delete Account
            </Button>
          </Stack>
        </Stack>

        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: { xs: 3, md: 4 },
            background: "rgba(255,255,255,0.04)",
            borderRadius: "1.5rem",
            padding: { xs: 2, md: 4 },
          }}
        >
          <SectionTitle title="Personal Details" />
          <DetailRow label="Full Name" value={user.name} />
          <DetailRow label="Email" value={user.email} />
          <DetailRow label="Phone" value={user.phone} />
          <DetailRow label="Gender" value={user.gender} />
          <DetailRow
            label="Date of Birth"
            value={
              user.dob ? new Date(user.dob).toLocaleDateString() : "Not set"
            }
          />

          <Divider />

          <SectionTitle title="Bio" />
          <Typography sx={{ opacity: 0.85 }}>
            {user.bio || "No bio added."}
          </Typography>

          <Divider />

          <SectionTitle title="Hobbies" />
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ rowGap: 1 }}>
            {user.hobbies?.length ? (
              user.hobbies.map((h, i) => (
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
              ))
            ) : (
              <Typography sx={{ opacity: 0.7 }}>No hobbies added.</Typography>
            )}
          </Stack>

          <Divider />

          <SectionTitle title="My Events" />
          {myEvents && myEvents.length > 0 ? (
            <Stack spacing={1.2}>
              {myEvents.map((ev) => {
                const evReviews = eventReviewsMap[ev._id] || [];

                return (
                  <Box
                    key={ev._id}
                    sx={{
                      p: 1.5,
                      borderRadius: "1rem",
                      background: isDark
                        ? "rgba(255,255,255,0.04)"
                        : "rgba(0,0,0,0.03)",
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                      sx={{ mb: evReviews.length > 0 ? 1.5 : 0 }}
                    >
                      <EventIcon sx={{ fontSize: 20, opacity: 0.8 }} />
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
              <Button
                component={Link}
                to="/my-events"
                size="small"
                sx={{
                  alignSelf: "flex-start",
                  textTransform: "none",
                  mt: 0.5,
                  borderRadius: "8rem",
                }}
              >
                View All Events
              </Button>
            </Stack>
          ) : (
            <Typography sx={{ opacity: 0.7 }}>
              You haven't created any events yet.
            </Typography>
          )}

          <Divider />

          <SectionTitle title="Rating & Reviews" />
          <Typography sx={{ opacity: 0.9 }}>
            {rating.count > 0 && rating.avgRating != null ? (
              <>
                ⭐ {rating.avgRating.toFixed(1)}{" "}
                <Typography
                  component="span"
                  sx={{ opacity: 0.7, ml: 0.5, fontSize: "0.95rem" }}
                >
                  ({rating.count} review{rating.count > 1 ? "s" : ""})
                </Typography>
              </>
            ) : (
              "No reviews yet."
            )}
          </Typography>

          {myReviews.length > 0 && (
            <Stack spacing={2} sx={{ mt: 3 }}>
              {myReviews.map((review) => (
                <Paper
                  key={review._id}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: "1rem",
                    bgcolor: isDark ? "rgba(255,255,255,0.03)" : "grey.50",
                    border: "1px solid",
                    borderColor: isDark ? "rgba(255,255,255,0.05)" : "grey.200",
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Avatar
                      src={review.reviewerId?.avatar?.url}
                      component={Link}
                      to={`/users/${review.reviewerId?._id || review.reviewerId}`}
                      sx={{ cursor: "pointer" }}
                    >
                      {review.reviewerId?.username?.[0]?.toUpperCase() || "?"}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        flexWrap="wrap"
                        sx={{ mb: 0.5, gap: 1 }}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          flexWrap="wrap"
                        >
                          <Typography
                            variant="subtitle2"
                            fontWeight={700}
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
                          {review.eventId && (
                            <>
                              <Typography
                                variant="caption"
                                sx={{ opacity: 0.6 }}
                              >
                                ·
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  opacity: 0.8,
                                  fontStyle: "italic",
                                  fontWeight: 500,
                                }}
                              >
                                {review.eventId.title || "Event"}
                              </Typography>
                            </>
                          )}
                        </Stack>
                        <Typography variant="caption" sx={{ opacity: 0.6 }}>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </Typography>
                      </Stack>

                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ mb: 1 }}
                      >
                        <Rating value={review.rating} readOnly size="small" />
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          {review.rating} / 5
                        </Typography>
                      </Stack>

                      {review.comment && (
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          {review.comment}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}

          <Divider />

          <SectionTitle title="Social Links" />
          {social.facebook ||
          social.instagram ||
          social.twitter ||
          social.linkedin ||
          social.website ? (
            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              sx={{ rowGap: 1 }}
            >
              {social.facebook && (
                <Chip
                  label="Facebook"
                  component="a"
                  href={social.facebook}
                  target="_blank"
                  clickable
                />
              )}
              {social.instagram && (
                <Chip
                  label="Instagram"
                  component="a"
                  href={social.instagram}
                  target="_blank"
                  clickable
                />
              )}
              {social.twitter && (
                <Chip
                  label="Twitter"
                  component="a"
                  href={social.twitter}
                  target="_blank"
                  clickable
                />
              )}
              {social.linkedin && (
                <Chip
                  label="LinkedIn"
                  component="a"
                  href={social.linkedin}
                  target="_blank"
                  clickable
                />
              )}
              {social.website && (
                <Chip
                  label="Website"
                  component="a"
                  href={social.website}
                  target="_blank"
                  clickable
                />
              )}
            </Stack>
          ) : (
            <Typography sx={{ opacity: 0.7 }}>
              No social links added.
            </Typography>
          )}

          <Divider />

          <SectionTitle title="Account Information" />
          <DetailRow
            label="Created"
            value={
              user.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "—"
            }
          />
          <DetailRow
            label="Last Login"
            value={
              user.lastLoginAt
                ? new Date(user.lastLoginAt).toLocaleDateString()
                : "—"
            }
          />
        </Box>
      </Box>

      {openPasswordPopup && (
        <PopupWrapper onClose={() => setOpenPasswordPopup(false)}>
          <ChangePasswordPopup onClose={() => setOpenPasswordPopup(false)} />
        </PopupWrapper>
      )}

      {openDeletePopup && (
        <PopupWrapper onClose={() => setOpenDeletePopup(false)}>
          <DeleteAccountPopup onClose={() => setOpenDeletePopup(false)} />
        </PopupWrapper>
      )}

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

function PopupWrapper({ children, onClose }) {
  return (
    <Box
      onClick={onClose}
      sx={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 2000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 2,
      }}
    >
      <Box onClick={(e) => e.stopPropagation()}>{children}</Box>
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
        fontSize: { xs: "1rem", md: "1.08rem" },

        background: "linear-gradient(90deg,#c7b3ff,#a78bfa,#7c4dff,#5d2eff)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
    >
      {title}
    </Typography>
  );
}

function DetailRow({ label, value }) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={{ xs: 0.4, sm: 0 }}
      justifyContent="space-between"
      sx={{
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        paddingBottom: 1,
      }}
    >
      <Typography fontWeight={700} sx={{ fontSize: "0.85rem", opacity: 0.65 }}>
        {label}
      </Typography>

      <Typography sx={{ fontSize: "0.95rem" }}>{value || "—"}</Typography>
    </Stack>
  );
}
