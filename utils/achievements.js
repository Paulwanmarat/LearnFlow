function checkAchievements(user) {
  const unlocked = [];

  if (user.history.length === 1)
    unlocked.push("First Quiz");

  if (user.streak >= 7)
    unlocked.push("7 Day Streak");

  if (user.xp >= 1000)
    unlocked.push("1000 XP");

  const lastQuiz = user.history[user.history.length - 1];
  if (lastQuiz?.percent === 100)
    unlocked.push("Perfect Score");

  return unlocked;
}

module.exports = { checkAchievements };