require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const compression = require("compression");
const cron = require("node-cron");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const recalculateRanks = require("./services/rankService");

const authRoutes = require("./routes/auth");
const quizRoutes = require("./routes/quiz");
const dashboardRoutes = require("./routes/dashboard");
const leaderboardRoutes = require("./routes/leaderboard");

const User = require("./models/user");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://learn-flow-wheat-theta.vercel.app",
      "https://learn-flow-a7rpjdraa-paulpywts-projects.vercel.app"
    ],
    credentials: true,
  },
});

app.set("io", io);

connectDB();

app.set("trust proxy", 1);

app.use(helmet());

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://learn-flow-wheat-theta.vercel.app",
    "https://learn-flow-a7rpjdraa-paulpywts-projects.vercel.app"
  ],
  credentials: true,
}));

app.use(express.json({ limit: "10kb" }));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
}));

app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(compression());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    time: new Date(),
  });
});

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

cron.schedule("*/1 * * * *", async () => {
  try {
    await recalculateRanks();
    io.emit("leaderboardUpdated");
    console.log("📈 Ranks recalculated + live update sent");
  } catch (err) {
    console.error("Rank recalculation failed:", err.message);
  }
});

cron.schedule("0 0 * * 0", async () => {
  try {
    await User.updateMany({}, { weeklyXp: 0 });
    io.emit("leaderboardUpdated");
    console.log("🏆 Weekly XP reset");
  } catch (err) {
    console.error("Weekly reset failed:", err.message);
  }
});

app.use((req, res, next) => {
  res.status(404);
  next(new Error("Route not found"));
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});