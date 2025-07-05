const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  videoId: {
    type: String,
    required: true,
  },
  title: String,
  description: String,
  thumbnail: String,
  channelTitle: String,
  publishedAt: Date,
  category: {
    type: String,
    enum: ["watchLater", "loved", "watching"],
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("Movie", movieSchema);
