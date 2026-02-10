import "dotenv/config";
import app from "./app";
import connectDB from "./config/db";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

const startServer = async () => {
  await connectDB();

  const QuizType = (await import("./modules/quiz/quizType.model")).default;
  const count = await QuizType.countDocuments();
  if (count === 0) {
    await QuizType.insertMany([
      { name: "Monthly Quiz", description: "Monthly quiz" },
      { name: "Special Quiz", description: "Special themed quiz" },
      { name: "Weekly Quiz", description: "Weekly quiz" },
    ]);
    console.log("Default quiz types seeded");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
