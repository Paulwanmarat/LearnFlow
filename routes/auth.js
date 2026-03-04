const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const router = express.Router();

/* ===================================================== */
/* 🔐 GENERATE JWT */
/* ===================================================== */

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

/* ===================================================== */
/* 📝 REGISTER */
/* ===================================================== */

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, country } = req.body;

    /* ===== VALIDATION ===== */

    if (!username || !email || !password || !country) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    /* ===== CHECK EXISTING USER ===== */

    const userExists = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    /* ===== CREATE USER ===== */

    const user = await User.create({
      username,
      email,
      password,
      country: country.toUpperCase(), // ensure uppercase like US, IN
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user,
    });
  } catch (err) {
    console.error("Register error:", err.message);

    res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
});

/* ===================================================== */
/* 🔓 LOGIN */
/* ===================================================== */

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    /* ===== VALIDATION ===== */

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    /* ===== FIND USER ===== */

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    /* ===== CHECK PASSWORD ===== */

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user,
    });
  } catch (err) {
    console.error("Login error:", err.message);

    res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
});

module.exports = router;