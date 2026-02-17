import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getChatHistory,
  postMessage,
  markMessageRead,
  pinMessage,
  unpinMessage,
  listUserChats,
} from "../controllers/chat.controller.js";

const router = Router({ mergeParams: true });

router.get("/chats", requireAuth, listUserChats);

router.get("/:id/chat", requireAuth, getChatHistory);
router.post("/:id/chat", requireAuth, postMessage);

router.patch("/:eventId/chat/:id/read", requireAuth, markMessageRead);
router.patch("/:eventId/chat/:id/pin", requireAuth, pinMessage);
router.patch("/:eventId/chat/:id/unpin", requireAuth, unpinMessage);

export default router;
