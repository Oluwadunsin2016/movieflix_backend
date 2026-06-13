const mongoose = require("mongoose");

const curatedMovieSchema = new mongoose.Schema({
  collectionId: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  videoId: {
    type: String,
    required: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
    trim: true,
  },
  thumbnail: {
    type: String,
    required: true,
    trim: true,
  },
  channelTitle: {
    type: String,
    default: "",
    trim: true,
  },
  publishedAt: {
    type: Date,
    default: Date.now,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
}, {
  timestamps: true,
});

curatedMovieSchema.index({ collectionId: 1, videoId: 1 }, { unique: true });
curatedMovieSchema.index({ collectionId: 1, sortOrder: 1, updatedAt: -1 });

module.exports = mongoose.model("CuratedMovie", curatedMovieSchema);
