import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    icon: { type: String }, // optional
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("Category", categorySchema);
