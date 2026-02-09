import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  const MONGO_URI = process.env.MONGO_URI;

  if (!MONGO_URI) {
    console.error("MONGO_URI environment variable is not set");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
