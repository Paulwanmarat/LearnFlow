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
const passport = require("passport");

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const recalculateRanks = require("./services/rankService");

const authRoutes        = require("./routes/auth");
const quizRoutes        = require("./routes/quiz");
const dashboardRoutes   = require("./routes/dashboard");
const leaderboardRoutes = require("./routes/leaderboard");
const userRoutes        = require("./routes/user");       // ← new

const User = require("./models/user");

const app    = express();
const server = http.createServer(app);

/* ===================================================== */
/* 🌐 ALLOWED ORIGINS HELPER                             */
/* ===================================================== */

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  return (
    origin === "http://localhost:3000" ||
    origin.endsWith(".vercel.app")
  );
};

/* ===================================================== */
/* 🔌 SOCKET.IO                                          */
/* ===================================================== */

const io = new Server(server, {
  cors: {
    origin: (origin, cb) =>
      isAllowedOrigin(origin) ? cb(null, true) : cb(new Error("Not allowed by CORS")),
    credentials: true,
  },
});

app.set("io", io);

/* ===================================================== */
/* 🗄 DATABASE                                           */
/* ===================================================== */

connectDB();

/* ===================================================== */
/* ⚙️  EXPRESS CONFIG                                    */
/* ===================================================== */

app.set("trust proxy", 1);

app.use(helmet({
  contentSecurityPolicy: false,   // allow Google OAuth redirect pages
}));

app.use(cors({
  origin: (origin, cb) =>
    isAllowedOrigin(origin) ? cb(null, true) : cb(new Error("Not allowed by CORS")),
  credentials: true,
}));

app.use(express.json({ limit: "10kb" }));

/* ===================================================== */
/* 🛡 SECURITY MIDDLEWARE                                */
/* ===================================================== */

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(compression());
app.use(morgan("dev"));

/* ===================================================== */
/* 🔑 PASSPORT — stateless JWT, no sessions needed       */
/* ===================================================== */

app.use(passport.initialize());

/* ===================================================== */
/* 🏥 HEALTH CHECK                                       */
/* ===================================================== */

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", time: new Date() });
});

/* ===================================================== */
/* 🔌 SOCKET.IO EVENTS                                   */
/* ===================================================== */

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

/* ===================================================== */
/* 🛣  ROUTES                                            */
/* ===================================================== */

app.use("/api/auth", authRoutes);
// Google redirects to /auth/google/callback (no /api prefix) — must match
// the Authorised redirect URI in Google Cloud Console exactly
app.use("/auth",            authRoutes);
app.use("/api/quiz",        quizRoutes);
app.use("/api/dashboard",   dashboardRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/users",       userRoutes);            // ← new: search + public profiles

/* ===================================================== */
/* ⏰ CRON JOBS                                          */
/* ===================================================== */

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

/* ===================================================== */
/* ❌ 404 + ERROR HANDLER                                */
/* ===================================================== */

app.use((req, res, next) => {
  res.status(404);
  next(new Error("Route not found"));
});

app.use(errorHandler);

/* ===================================================== */
/* 🚀 START                                              */
/* ===================================================== */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});