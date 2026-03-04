const User = require("../models/user");

const recalculateRanks = async () => {
  try {
    const users = await User.find().sort({ xp: -1 });

    for (let i = 0; i < users.length; i++) {
      const newRank = i + 1;

      users[i].previousRank = users[i].rank || newRank;
      users[i].rank = newRank;

      await users[i].save();
    }

    console.log("✅ Rank recalculation complete");
  } catch (err) {
    console.error("Rank recalculation failed:", err.message);
  }
};

module.exports = recalculateRanks;