const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { Resend } = require("resend");
const User = require("../models/user");

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

/* ===================================================== */
/* 🔐 GENERATE JWT                                       */
/* ===================================================== */

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Short-lived token to carry Google profile data to the complete-profile page
const generateSetupToken = (data) => {
  return jwt.sign({ ...data, _setup: true }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

/* ===================================================== */
/* 🔑 GOOGLE OAUTH STRATEGY                              */
/* ===================================================== */

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Must exactly match the Authorised redirect URI in Google Cloud Console:
      // https://learnflow-3rig.onrender.com/auth/google/callback
      callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error("No email returned from Google"), null);
        }

        // Find existing user — match by googleId first, then by email
        const user = await User.findOne({
          $or: [{ googleId: profile.id }, { email }],
        });

        if (user) {
          // Existing user — link googleId if they signed up via email/password before
          if (!user.googleId) {
            user.googleId = profile.id;
            if (!user.avatar || user.avatar === "https://i.imgur.com/6VBx3io.png") {
              user.avatar = profile.photos?.[0]?.value || user.avatar;
            }
            await user.save({ validateBeforeSave: false });
          }
          // Return the real DB user — they go straight to the dashboard
          return done(null, { _type: "existing", user });
        }

        // Brand-new Google user — don't create yet, carry profile data to setup page
        return done(null, {
          _type: "pending",
          googleId: profile.id,
          email,
          avatar: profile.photos?.[0]?.value || "",
          displayName: profile.displayName || "",
        });

      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Passport serialize/deserialize — only used for the OAuth handshake, not for sessions
passport.serializeUser((payload, done) => {
  if (payload._type === "existing") return done(null, { _type: "existing", id: payload.user._id });
  done(null, payload); // pending — serialize the whole object
});

passport.deserializeUser(async (payload, done) => {
  if (payload._type === "existing") {
    try {
      const user = await User.findById(payload.id);
      return done(null, { _type: "existing", user });
    } catch (err) {
      return done(err, null);
    }
  }
  done(null, payload); // pending — pass through
});

/* ===================================================== */
/* 🌐 GOOGLE OAUTH — INITIATE                           */
/* GET /auth/google                                      */
/* ===================================================== */

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account", // always show the account picker
  })
);

/* ===================================================== */
/* 🌐 GOOGLE OAUTH — CALLBACK                           */
/* GET /auth/google/callback                             */
/* ===================================================== */

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}?error=oauth_failed`,
  }),
  (req, res) => {
    try {
      const payload = req.user;

      if (payload._type === "existing") {
        // Known user — issue full JWT, send straight to dashboard
        const token = generateToken(payload.user._id);
        return res.redirect(`${process.env.FRONTEND_URL}?token=${token}`);
      }

      // New user — issue a 15-min setup token, send to profile completion page
      const setupToken = generateSetupToken({
        googleId: payload.googleId,
        email: payload.email,
        avatar: payload.avatar,
        displayName: payload.displayName,
      });
      return res.redirect(
        `${process.env.FRONTEND_URL}/complete-profile?setup=${setupToken}`
      );
    } catch {
      res.redirect(`${process.env.FRONTEND_URL}?error=token_failed`);
    }
  }
);

/* ===================================================== */
/* ✅ COMPLETE GOOGLE PROFILE                            */
/* POST /auth/google/complete                            */
/* Body: { setupToken, username, country, password,      */
/*         confirmPassword }                             */
/* ===================================================== */

router.post("/google/complete", async (req, res) => {
  try {
    const { setupToken, username, country, password, confirmPassword } = req.body;

    if (!setupToken || !username || !country || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Verify the setup token
    let decoded;
    try {
      decoded = jwt.verify(setupToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: "Setup session expired. Please sign in with Google again." });
    }

    if (!decoded._setup) {
      return res.status(401).json({ success: false, message: "Invalid setup token" });
    }

    // Validate username
    const usernameRegex = /^[a-zA-Z0-9._]{4,20}$/;
    if (!usernameRegex.test(username.trim())) {
      return res.status(400).json({
        success: false,
        message: "Username must be 4–20 characters, letters/numbers/._  only",
      });
    }

    // Validate password
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    // Check username & email aren't already taken
    const existing = await User.findOne({
      $or: [{ username: username.trim() }, { email: decoded.email }, { googleId: decoded.googleId }],
    });

    if (existing) {
      if (existing.username === username.trim()) {
        return res.status(409).json({ success: false, message: "Username already taken" });
      }
      // Email or googleId already registered — they should just log in
      return res.status(409).json({ success: false, message: "An account with this Google email already exists. Please sign in." });
    }

    // Create the user
    const user = await User.create({
      username: username.trim(),
      email: decoded.email,
      password,
      googleId: decoded.googleId,
      avatar: decoded.avatar || "https://i.imgur.com/6VBx3io.png",
      country: country.toUpperCase(),
      league: "Bronze",
      xp: 0,
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user,
    });
  } catch (err) {
    console.error("Google complete error:", err.message);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/* ===================================================== */
/* 📝 REGISTER                                           */
/* ===================================================== */

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, country } = req.body;

    if (!username || !email || !password || !country) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ success: false, message: "Username or email already exists" });
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
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/* ===================================================== */
/* 🔓 LOGIN                                              */
/* ===================================================== */

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // Google-only accounts have no password
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "This account uses Google sign-in. Please continue with Google.",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    res.json({ success: true, token: generateToken(user._id), user });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/* ===================================================== */
/* 📬 FORGOT PASSWORD                                    */
/* ===================================================== */

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });
    // Always return success — never reveal if email exists
    if (!user || (!user.password && user.googleId)) {
      return res.json({ success: true, message: "If that email exists, a reset link has been sent" });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

    await resend.emails.send({
      from: "Cognivra <onboarding@resend.dev>",
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
        </div>
      `,
    });

    res.json({ success: true, message: "If that email exists, a reset link has been sent" });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    res.status(500).json({ success: false, message: "Failed to send reset email" });
  }
});

/* ===================================================== */
/* 🔑 RESET PASSWORD                                     */
/* ===================================================== */

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: "Token and new password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordExpires +password");

    if (!user) {
      return res.status(400).json({ success: false, message: "Reset link is invalid or has expired" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    await resend.emails.send({
      from: "Cognivra <onboarding@resend.dev>",
      to: user.email,
      subject: "Your Cognivra password has been changed",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0a0f1c;color:#fff;border-radius:16px;">
          <h2 style="color:#10b981;margin-bottom:8px;">Password changed ✓</h2>
          <p style="color:rgba(255,255,255,0.6);">
            Your Cognivra password was successfully reset. You can now sign in with your new password.
          </p>
        </div>
      `,
    });

    res.json({ success: true, message: "Password reset successful", token: generateToken(user._id) });
  } catch (err) {
    console.error("Reset password error:", err.message);
    res.status(500).json({ success: false, message: "Password reset failed" });
  }
});

module.exports = router;