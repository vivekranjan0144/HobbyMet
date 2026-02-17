import { useState, useEffect } from "react";
import {
  Stack,
  Typography,
  Box,
  CircularProgress,
  Avatar,
} from "@mui/material";
import { Link } from "react-router-dom";
import StarIcon from "@mui/icons-material/Star";
import { ReviewAPI } from "../../api/review.api";

export default function EventReviews({ eventId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    let isMounted = true;

    (async () => {
      try {
        const res = await ReviewAPI.getEventReviews(eventId, { limit: 5 });
        if (isMounted) {
          setReviews(res.reviews || []);
        }
      } catch (err) {
        console.error("Failed to load event reviews", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [eventId]);

  if (loading)
    return <CircularProgress size={16} sx={{ mt: 1, opacity: 0.5 }} />;
  if (!reviews.length) return null;

  return (
    <Stack
      spacing={1}
      sx={{ mt: 1.5, pl: 1, borderLeft: "2px solid rgba(120,120,120,0.2)" }}
    >
      {reviews.map((r) => (
        <Stack key={r._id} direction="row" spacing={1} alignItems="center">
          <StarIcon sx={{ fontSize: 14, color: "#facc15" }} />
          <Typography variant="caption" fontWeight={600}>
            {r.rating}
          </Typography>

          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            by{" "}
            <Link
              to={`/user/${r.reviewerId?._id || r.reviewerId}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                fontWeight: "bold",
              }}
            >
              @{r.reviewerId?.username || "unknown"}
            </Link>
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
