const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/user");

const router = express.Router();

/* ===================================================== */
/* 🔐 GENERATE JWT                                       */
/* ===================================================== */

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

/* ===================================================== */
/* 📧 MAILER                                             */
/* ===================================================== */

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // 16-char Google App Password
  },
});

// Verify transporter on startup
transporter.verify((err) => {
  if (err) {
    console.error("❌ Mail transporter error:", err.message);
  } else {
    console.log("✅ Mail transporter ready");
  }
});

/* ===================================================== */
/* 📝 REGISTER                                           */
/* ===================================================== */

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, country } = req.body;

    if (!username || !email || !password || !country) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const userExists = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      country: country.toUpperCase(),
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
/* 🔓 LOGIN                                              */
/* ===================================================== */

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

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

/* ===================================================== */
/* 📬 FORGOT PASSWORD                                    */
/* ===================================================== */

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    // Always return success — never reveal if email exists
    if (!user) {
      return res.json({
        success: true,
        message: "If that email exists, a reset link has been sent",
      });
    }

    // Generate a secure random token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

    await transporter.sendMail({
      from: `"Cognivra" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Reset your Cognivra password",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0a0f1c;color:#fff;border-radius:16px;">
          <h2 style="color:#6366f1;margin-bottom:8px;">Reset your password</h2>
          <p style="color:rgba(255,255,255,0.6);margin-bottom:24px;">
            Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
          </p>
          <a href="${resetUrl}"
             style="display:inline-block;background:linear-gradient(to right,#06b6d4,#6366f1);color:#fff;font-weight:700;padding:14px 28px;border-radius:12px;text-decoration:none;">
            Reset Password
          </a>
          <p style="color:rgba(255,255,255,0.3);font-size:12px;margin-top:24px;">
            If you didn't request this, you can safely ignore this email.
          </p>
          <p style="color:rgba(255,255,255,0.2);font-size:11px;margin-top:8px;">
            This link expires in 1 hour and can only be used once.
          </p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: "If that email exists, a reset link has been sent",
    });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to send reset email",
    });
  }
});

/* ===================================================== */
/* 🔑 RESET PASSWORD                                     */
/* ===================================================== */

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // Hash the incoming raw token to compare with stored hash
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordExpires +password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Reset link is invalid or has expired",
      });
    }

    // Set new password — pre-save hook will hash it
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send confirmation email
    await transporter.sendMail({
      from: `"Cognivra" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Your Cognivra password has been changed",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0a0f1c;color:#fff;border-radius:16px;">
          <h2 style="color:#10b981;margin-bottom:8px;">Password changed ✓</h2>
          <p style="color:rgba(255,255,255,0.6);margin-bottom:24px;">
            Your Cognivra password was successfully reset. You can now sign in with your new password.
          </p>
          <p style="color:rgba(255,255,255,0.3);font-size:12px;">
            If you did not make this change, please contact us immediately and secure your account.
          </p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: "Password reset successful",
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("Reset password error:", err.message);
    res.status(500).json({
      success: false,
      message: "Password reset failed",
    });
  }
});

module.exports = router;