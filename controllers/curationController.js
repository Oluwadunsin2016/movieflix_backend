const CuratedMovie = require("../models/CuratedMovie");

const normalizeCollectionId = (collectionId = "") => String(collectionId).trim().toLowerCase();

const normalizeMoviePayload = (payload) => ({
  collectionId: normalizeCollectionId(payload.collectionId),
  videoId: String(payload.videoId || "").trim(),
  title: String(payload.title || "").trim(),
  description: String(payload.description || "").trim(),
  thumbnail: String(payload.thumbnail || "").trim(),
  channelTitle: String(payload.channelTitle || "").trim(),
  publishedAt: payload.publishedAt ? new Date(payload.publishedAt) : new Date(),
  sortOrder: Number(payload.sortOrder || 0),
});

const validateMoviePayload = (movie) => {
  if (!movie.collectionId) return "Collection ID is required";
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

exports.getCuratedMovies = async (req, res) => {
  const collectionId = normalizeCollectionId(req.params.collectionId);

  if (!collectionId) {
    return res.status(400).json({ success: false, message: "Collection ID is required" });
  }

  try {
    const movies = await CuratedMovie.find({ collectionId }).sort({ sortOrder: 1, updatedAt: -1 });

    return res.json({
      success: true,
      collectionId,
      items: movies.map(toYouTubeSearchResult),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load curated movies",
      error: error.message,
    });
  }
};

exports.upsertCuratedMovie = async (req, res) => {
  const moviePayload = normalizeMoviePayload(req.body);
  const validationError = validateMoviePayload(moviePayload);

  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const movie = await CuratedMovie.findOneAndUpdate(
      {
        collectionId: moviePayload.collectionId,
        videoId: moviePayload.videoId,
      },
      {
        ...moviePayload,
        addedBy: req.user._id,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Curated movie saved",
      movie,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to save curated movie",
      error: error.message,
    });
  }
};

exports.removeCuratedMovie = async (req, res) => {
  const collectionId = normalizeCollectionId(req.params.collectionId);
  const { videoId } = req.params;

  if (!collectionId || !videoId) {
    return res.status(400).json({ success: false, message: "Collection ID and video ID are required" });
  }

  try {
    const result = await CuratedMovie.deleteOne({ collectionId, videoId });

    return res.json({
      success: true,
      deleted: result.deletedCount > 0,
      message: result.deletedCount > 0 ? "Curated movie removed" : "Movie was not curated",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to remove curated movie",
      error: error.message,
    });
  }
};

exports.reorderCuratedMovies = async (req, res) => {
  const collectionId = normalizeCollectionId(req.params.collectionId);
  const orderedVideoIds = Array.isArray(req.body.videoIds)
    ? req.body.videoIds.map((videoId) => String(videoId || "").trim()).filter(Boolean)
    : [];

  if (!collectionId) {
    return res.status(400).json({ success: false, message: "Collection ID is required" });
  }

  if (orderedVideoIds.length === 0) {
    return res.status(400).json({ success: false, message: "At least one video ID is required" });
  }

  try {
    await Promise.all(
      orderedVideoIds.map((videoId, index) =>
        CuratedMovie.updateOne(
          { collectionId, videoId },
          { $set: { sortOrder: index + 1 } }
        )
      )
    );

    const movies = await CuratedMovie.find({ collectionId }).sort({ sortOrder: 1, updatedAt: -1 });

    return res.json({
      success: true,
      message: "Curated shelf order updated",
      collectionId,
      items: movies.map(toYouTubeSearchResult),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to reorder curated shelf",
      error: error.message,
    });
  }
};
