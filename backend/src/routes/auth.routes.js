import { Router } from "express";
import {
  signup,
  login,
  me,
  logout,
  updatePassword,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);
router.patch("/update-password", requireAuth, updatePassword);

export default router;
