const blockedTitlePatterns = [
  /\btrailer\b/i,
  /\bteaser\b/i,
  /\bsong(s)?\b/i,
  /\bmusic video\b/i,
  /\bscene(s)?\b/i,
  /\breview\b/i,
  /\breaction\b/i,
  /\bbehind the scenes\b/i,
  /\bshorts?\b/i,
  /\bclip(s)?\b/i,
  /\binterview\b/i,
  /\bmaking of\b/i,
  /\brecap\b/i,
  /\bexplained\b/i,
  /\bpreview\b/i,
  /\bpromo\b/i,
  /\bost\b/i,
  /\blyric(s)?\b/i,
  /\bepisode\b/i,
  /\bpart\s?\d+\b/i,
];

const positiveMoviePatterns = [
  /\bfull movie\b/i,
  /\bcomplete movie\b/i,
  /\bfull length\b/i,
  /\benglish movie\b/i,
  /\bnigerian movie\b/i,
  /\bhollywood movie\b/i,
  /\bbollywood movie\b/i,
  /\baction movie\b/i,
  /\bdrama movie\b/i,
  /\bromance movie\b/i,
  /\bthriller movie\b/i,
  /\bmovie 20\d{2}\b/i,
  /\b20\d{2} movie\b/i,
];

const normalizeMovieText = (value = "") =>
  String(value)
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

const getMovieQualityScore = (movie) => {
  const title = normalizeMovieText(movie?.snippet?.title || "");
  const description = normalizeMovieText(movie?.snippet?.description || "");
  const combinedText = `${title} ${description}`;

  if (blockedTitlePatterns.some((pattern) => pattern.test(combinedText))) return -100;

  let score = 0;
  positiveMoviePatterns.forEach((pattern) => {
    if (pattern.test(combinedText)) score += 10;
  });

  if (title.length > 16) score += 2;
  if (movie?.snippet?.thumbnails?.high?.url) score += 2;
  if (movie?.snippet?.channelTitle) score += 1;

  return score;
};

const curateMovieResults = (movies = []) => {
  const seenVideoIds = new Set();

  return movies
    .map((movie) => ({ movie, score: getMovieQualityScore(movie) }))
    .filter(({ movie, score }) => {
      const videoId = movie?.id?.videoId || movie?.id;
      if (!videoId || seenVideoIds.has(videoId) || score < 0) return false;
      seenVideoIds.add(videoId);
      return true;
    })
    .sort((a, b) => b.score - a.score)
    .map(({ movie }) => movie);
};

module.exports = {
  curateMovieResults,
};
