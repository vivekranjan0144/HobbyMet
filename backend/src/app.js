// export default app;
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";

const app = express();

/* =======================
   Global Middlewares
======================= */
app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

/* =======================
   Health Check
======================= */
app.get("/health", (_req, res) => {
  res.json({ status: "ok", env: env.nodeEnv });
});

/* =======================
   Routes
======================= */
import authRouter from "./routes/auth.routes.js";
import hobbyRoutes from "./routes/hobby.routes.js";
import usersRouter from "./routes/users.routes.js";
import eventsRouter from "./routes/events.routes.js";
import chatRouter from "./routes/chat.routes.js";
import notificationsRouter from "./routes/notifications.routes.js";
import joinRequestRouter from "./routes/joinRequest.routes.js";
import uploadRouter from "./routes/upload.routes.js";
import locationRouter from "./routes/location.routes.js";
import eventMemberRouter from "./routes/eventMember.routes.js";
import reviewsRouter from "./routes/reviews.routes.js";

/* Auth & Core */
app.use("/auth", authRouter);
app.use("/hobby", hobbyRoutes);
app.use("/users", usersRouter);

/* Events */
app.use("/events", eventsRouter);
app.use("/events", chatRouter);

/* Notifications */
app.use("/notifications", notificationsRouter);

/* Location */
app.use("/location", locationRouter);

/* Other feature routes */
app.use("/", joinRequestRouter);
app.use("/", uploadRouter);
app.use("/", eventMemberRouter);
app.use("/", reviewsRouter);

export default app;
