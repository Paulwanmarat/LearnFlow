const jwt = require("jsonwebtoken");
const geoip = require("geoip-lite");
const User = require("../models/user");

/* ===================================================== */
/* 🔐 GENERATE JWT TOKEN */
/* ===================================================== */

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not defined");
  }

  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
      issuer: "neuro-app",
      audience: "neuro-users",
    }
  );
};

/* ===================================================== */
/* 🏆 LEAGUE CALCULATION */
/* ===================================================== */

const calculateLeague = (xp = 0) => {
  if (xp >= 10000) return "Diamond";
  if (xp >= 7000) return "Platinum";
  if (xp >= 4000) return "Gold";
  if (xp >= 2000) return "Silver";
  return "Bronze";
};

/* ===================================================== */
/* 🌍 GET COUNTRY FROM IP */
/* ===================================================== */

const detectCountry = (req) => {
  try {
    const ip =
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      "";

    const geo = geoip.lookup(ip);
    return geo?.country || "US";
  } catch {
    return "US";
  }
};

/* ===================================================== */
/* 📝 REGISTER */
/* ===================================================== */

exports.register = async (req, res, next) => {
  try {
    let { username, email, password } = req.body;

    /* ================= VALIDATION ================= */

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    username = username.trim();
    email = email.trim().toLowerCase();

    const usernameRegex = /^[a-zA-Z0-9._]{4,20}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        error:
          "Username must be 4-20 characters, no spaces, only letters, numbers, . and _ allowed",
      });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email format",
      });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_\-+=]).{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error:
          "Password must be ≥8 characters and include uppercase, lowercase, number, and special symbol",
      });
    }

    /* ================= DUPLICATE CHECK ================= */

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({
        error: "Email already registered",
      });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      const random = Math.floor(1000 + Math.random() * 9000);
      const suggestion = `${username}_${random}`.slice(0, 20);

      return res.status(409).json({
        error: "Username already taken",
        suggestion,
      });
    }

    /* ================= AUTO COUNTRY ================= */

    const country = detectCountry(req);

    /* ================= CREATE USER ================= */

    const user = await User.create({
      username,
      email,
      password,
      country,
      league: "Bronze",
      xp: 0,
    });

    /* ================= RESPONSE ================= */

    const token = generateToken(user._id);

    const safeUser = {
      id: user._id,
      username: user.username,
      email: user.email,
      country: user.country,
      league: user.league,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
    };

    res.status(201).json({
      token,
      user: safeUser,
    });

  } catch (err) {
    next(err);
  }
};

/* ===================================================== */
/* 🔓 LOGIN */
/* ===================================================== */

exports.login = async (req, res, next) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password required",
      });
    }

    email = email.trim().toLowerCase();

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const isValid = await user.matchPassword(password);

    if (!isValid) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    /* ================= UPDATE LEAGUE ================= */

    user.league = calculateLeague(user.xp);

    user.lastLogin = new Date();

    await user.save();

    const token = generateToken(user._id);

    const safeUser = {
      id: user._id,
      username: user.username,
      email: user.email,
      country: user.country,
      league: user.league,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
    };

    res.json({
      token,
      user: safeUser,
    });

  } catch (err) {
    next(err);
  }
};