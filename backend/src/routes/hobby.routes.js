import express from "express";
import {
  getCategories,
  getHobbiesByCategory,
} from "../controllers/hobby.controller.js";

const router = express.Router();

router.get("/categories", getCategories);
router.get("/hobbies", getHobbiesByCategory);

export default router;
