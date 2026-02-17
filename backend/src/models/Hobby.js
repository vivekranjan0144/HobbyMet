import mongoose from "mongoose";

const hobbySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    categorySlug: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("Hobby", hobbySchema);
