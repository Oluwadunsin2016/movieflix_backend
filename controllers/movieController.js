const Movie = require("../models/Movie");

// ✅ Save a movie
exports.saveMovie = async (req, res) => {
    const { videoId, title, description, thumbnail, channelTitle, publishedAt, category } = req.body;
  
    try {
      const existingMovie = await Movie.findOne({ userId: req.user._id, videoId, category });
  
      if (existingMovie) {
        if (category === "watching") {
          // Remove the old "watching" entry
          await Movie.deleteOne({ _id: existingMovie._id });
        } else {
          // If it's not "watching", don't allow duplicates
          return res.status(409).json({ message: "Already saved" });
        }
      }
  
      const newMovie = new Movie({
        userId: req.user._id,
        videoId,
        title,
        description,
        thumbnail,
        channelTitle,
        publishedAt,
        category,
      });
  
      await newMovie.save();
  
      res.status(201).json({ message: "Saved successfully", movie: newMovie });
    } catch (err) {
      res.status(500).json({ message: "Failed to save movie", error: err.message });
    }
  };
  

// ✅ Get saved movies by category
exports.getSavedMovies = async (req, res) => {
  const { category } = req.params;

  try {
    const savedMovies = await Movie.find({ userId: req.user._id, category }).sort({ createdAt: -1 });

    const movies = savedMovies.map((movie) => ({
        kind: "youtube#searchResult",
        etag: movie._id.toString(), // you can use _id as a unique etag
        id: {
          kind: "youtube#video",
          videoId: movie.videoId,
        },
        snippet: {
          publishedAt: new Date(movie.publishedAt).toISOString(),
          publishTime: new Date(movie.publishedAt).toISOString(),
          title: movie.title,
          description: movie.description,
          channelTitle: movie.channelTitle,
          channelId: "", // optional: store it when saving if you want it accurate
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
              url: movie.thumbnail, // already high res
              width: 480,
              height: 360,
            },
          },
        },
      }));
  
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch movies", error: err.message });
  }
};

// ✅ Remove a movie from list
exports.removeMovie = async (req, res) => {
  const { videoId, category } = req.params;

  try {
    await Movie.deleteOne({ userId: req.user._id, videoId, category });
    res.json({ message: "Movie removed" });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove movie", error: err.message });
  }
};
