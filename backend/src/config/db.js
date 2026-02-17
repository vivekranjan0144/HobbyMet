import mongoose from "mongoose";
import { env } from "./env.js";

mongoose.set("strictQuery", true);

export async function connectToDatabase() {
  try {
    await mongoose.connect(env.mongoUri, {
      dbName: env.dbName,
      autoIndex: env.nodeEnv !== "production",
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`MongoDB connected to db: ${env.dbName}`);
  } catch (error) {
    console.error("MongoDB connection error", error);
    process.exit(1);
  }
}
