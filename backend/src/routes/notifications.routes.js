import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  listNotifications,
  markRead,
  markAllRead,
  getUnreadNotificationsCount,
  deleteNotification,
} from "../controllers/notifications.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", listNotifications);

router.get("/unread/count", getUnreadNotificationsCount);

router.patch("/:id/read", markRead);

router.patch("/read-all", markAllRead);

router.delete("/:id", deleteNotification);

export default router;
