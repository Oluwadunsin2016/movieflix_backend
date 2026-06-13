const { curateMovieResults } = require("../utils/movieFilters");
const { getCacheKey, getCachedValue, setCachedValue } = require("../utils/cache");

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";

const getYouTubeApiKey = () => {
  if (!process.env.YOUTUBE_API_KEY) {
    throw new Error("YOUTUBE_API_KEY is required");
  }

  return process.env.YOUTUBE_API_KEY;
};

const requestYouTube = async (path, params) => {
  const url = new URL(`${YOUTUBE_API_BASE_URL}${path}`);
  Object.entries({
    ...params,
    key: getYouTubeApiKey(),
  }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message || "YouTube request failed";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
};

const normalizeVideoDetails = (item) => {
  if (!item) return null;

  return {
    kind: "youtube#searchResult",
    etag: item.etag,
    id: {
      kind: "youtube#video",
      videoId: item.id,
    },
    snippet: item.snippet,
  };
};

exports.searchMovies = async (req, res) => {
  const query = String(req.query.q || "").trim();
  const maxResults = Math.min(Number(req.query.maxResults) || 50, 50);

  if (!query) {
    return res.status(400).json({ success: false, message: "Search query is required" });
  }

  const cacheKey = getCacheKey("youtube:search", { query, maxResults });
  const cachedResult = getCachedValue(cacheKey);

  if (cachedResult) {
    res.set("X-Movieflix-Cache", "HIT");
    return res.json(cachedResult);
  }

  try {
    const data = await requestYouTube("/search", {
      part: "snippet",
      q: query,
      type: "video",
      videoDuration: "long",
      maxResults,
    });

    const payload = {
      success: true,
      items: curateMovieResults(data.items || []),
    };

    setCachedValue(cacheKey, payload);
    res.set("X-Movieflix-Cache", "MISS");
    return res.json(payload);
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to search YouTube movies",
    });
  }
};

exports.getMovieDetails = async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    return res.status(400).json({ success: false, message: "Video ID is required" });
  }

  const cacheKey = getCacheKey("youtube:details", { videoId });
  const cachedResult = getCachedValue(cacheKey);

  if (cachedResult) {
    res.set("X-Movieflix-Cache", "HIT");
    return res.json(cachedResult);
  }

  try {
    const data = await requestYouTube("/videos", {
      part: "snippet",
      id: videoId,
    });

    const payload = {
      success: true,
      movie: normalizeVideoDetails(data.items?.[0]),
    };

    setCachedValue(cacheKey, payload);
    res.set("X-Movieflix-Cache", "MISS");
    return res.json(payload);
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch YouTube movie details",
    });
  }
};
