const jwt = require("jsonwebtoken");
const User = require("../models/user");

const auth = async (req, res, next) => {
  try {
    /* ========================= */
    /* Ensure JWT Secret Exists */
    /* ========================= */
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not defined");
      return res.status(500).json({
        error: "Server configuration error",
      });
    }

    /* ========================= */
    /* Extract Token */
    /* ========================= */
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Not authorized, no token",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "Not authorized, invalid token format",
      });
    }

    /* ========================= */
    /* Verify Token */
    /* ========================= */
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Token expired" });
      }
      return res.status(401).json({ error: "Not authorized, token invalid" });
    }

    /* ========================= */
    /* Validate Payload */
    /* ========================= */
    if (!decoded?.id) {
      return res.status(401).json({
        error: "Invalid token payload",
      });
    }

    /* ========================= */
    /* Check If User Still Exists */
    /* ========================= */
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        error: "User no longer exists",
      });
    }

    /* ========================= */
    /* Attach User To Request */
    /* ========================= */
    req.user = user;
    req.userId = user._id;

    next();

  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({
      error: "Authentication failed",
    });
  }
};

module.exports = auth;