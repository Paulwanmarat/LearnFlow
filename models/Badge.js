// models/Badge.js
const badgeSchema = new mongoose.Schema({
  name: String,
  description: String,
  icon: String,
  xpRequired: Number
});