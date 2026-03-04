const User = require("../models/user");

exports.getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user)
      return res.status(404).json({ error: "User not found" });

    const formattedHistory = user.history.map((item) => ({
      percent:
        item.percent ?? Math.round((item.score / item.total) * 100),
      date: new Date(item.date).toLocaleDateString(),
    }));

    res.json({
      username: user.username,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      history: formattedHistory,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};