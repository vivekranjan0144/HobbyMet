import Category from "../models/Category.js";
import Hobby from "../models/Hobby.js";

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({
      name: 1,
    });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

export const getHobbiesByCategory = async (req, res) => {
  try {
    const { category } = req.query;

    if (!category) {
      return res.status(400).json({ message: "category is required" });
    }

    const hobbies = await Hobby.find({
      categorySlug: category,
      isActive: true,
    }).sort({ name: 1 });

    res.json(hobbies);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch hobbies" });
  }
};
