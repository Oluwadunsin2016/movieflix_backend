const Movie = require("../models/Movie");

const VALID_CATEGORIES = ["watchLater", "loved", "watching"];

const isValidCategory = (category) => VALID_CATEGORIES.includes(category);

const normalizeMoviePayload = (payload) => ({
  videoId: String(payload.videoId || "").trim(),
  title: String(payload.title || "").trim(),
  description: String(payload.description || "").trim(),
  thumbnail: String(payload.thumbnail || "").trim(),
  channelTitle: String(payload.channelTitle || "").trim(),
  publishedAt: payload.publishedAt ? new Date(payload.publishedAt) : new Date(),
  category: payload.category,
});

const validateMoviePayload = (movie) => {
  if (!isValidCategory(movie.category)) return "Invalid movie category";
  if (!movie.videoId) return "Video ID is required";
  if (!movie.title) return "Movie title is required";
  if (!movie.thumbnail) return "Movie thumbnail is required";
  if (Number.isNaN(movie.publishedAt.getTime())) return "Invalid published date";
  return null;
};

const toYouTubeSearchResult = (movie) => {
  const publishedAt = movie.publishedAt || movie.createdAt || new Date();

  return {
    kind: "youtube#searchResult",
    etag: movie._id.toString(),
    id: {
      kind: "youtube#video",
      videoId: movie.videoId,
    },
    snippet: {
      publishedAt: publishedAt.toISOString(),
      publishTime: publishedAt.toISOString(),
      title: movie.title,
      description: movie.description,
      channelTitle: movie.channelTitle,
      channelId: "",
      liveBroadcastContent: "none",
      thumbnails: {
        default: {
          url: `https://i.ytimg.com/vi/${movie.videoId}/default.jpg`,
          width: 120,
          height: 90,
        },
        medium: {
          url: `https://i.ytimg.com/vi/${movie.videoId}/mqdefault.jpg`,
          width: 320,
          height: 180,
        },
        high: {
          url: movie.thumbnail,
          width: 480,
          height: 360,
        },
      },
    },
  };
};

exports.saveMovie = async (req, res) => {
  const moviePayload = normalizeMoviePayload(req.body);
  const validationError = validateMoviePayload(moviePayload);

  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const query = {
      userId: req.user._id,
      videoId: moviePayload.videoId,
      category: moviePayload.category,
    };

    if (moviePayload.category === "watching") {
      const movie = await Movie.findOneAndUpdate(
        query,
        { ...moviePayload, userId: req.user._id },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
      );

      return res.status(200).json({
        success: true,
        message: "Continue Watching updated",
        movie,
      });
    }

    const existingMovie = await Movie.findOne(query);
    if (existingMovie) {
      return res.status(200).json({
        success: true,
        message: "Already saved",
        movie: existingMovie,
      });
    }

    const newMovie = await Movie.create({
      ...moviePayload,
      userId: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Saved successfully",
      movie: newMovie,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(200).json({ success: true, message: "Already saved" });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to save movie",
      error: err.message,
    });
  }
};

exports.getSavedMovies = async (req, res) => {
  const { category } = req.params;

  if (!isValidCategory(category)) {
    return res.status(400).json({ success: false, message: "Invalid movie category" });
  }

  try {
    const savedMovies = await Movie.find({ userId: req.user._id, category }).sort({ updatedAt: -1 });
    return res.json(savedMovies.map(toYouTubeSearchResult));
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch movies",
      error: err.message,
    });
  }
};

exports.removeMovie = async (req, res) => {
  const { videoId, category } = req.params;

  if (!isValidCategory(category)) {
    return res.status(400).json({ success: false, message: "Invalid movie category" });
  }

  if (!videoId) {
    return res.status(400).json({ success: false, message: "Video ID is required" });
  }

  try {
    const result = await Movie.deleteOne({ userId: req.user._id, videoId, category });
    return res.json({
      success: true,
      deleted: result.deletedCount > 0,
      message: result.deletedCount > 0 ? "Movie removed" : "Movie was not in this list",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to remove movie",
      error: err.message,
    });
  }
};
