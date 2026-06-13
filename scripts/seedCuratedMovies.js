require("dotenv").config();
const mongoose = require("mongoose");
const CuratedMovie = require("../models/CuratedMovie");
const { curateMovieResults } = require("../utils/movieFilters");

const shouldApply = process.argv.includes("--apply");
const requestedCollectionsArg = process.argv.find((arg) => arg.startsWith("--collections="));
const requestedLimitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limitPerCollection = Math.max(Number(requestedLimitArg?.split("=")[1] || 6), 1);

const seedCollections = [
  {
    id: "nollywood",
    title: "Nollywood Premieres",
    query: '"full movie" nollywood nigerian movie 2025',
  },
  {
    id: "bollywood",
    title: "Bollywood Full Features",
    query: '"full movie" bollywood hindi movie 2025',
  },
  {
    id: "hollywood",
    title: "Hollywood Action Features",
    query: '"full movie" hollywood english movie 2025',
  },
  {
    id: "ghallywood",
    title: "Ghallywood Stories",
    query: '"full movie" ghana ghallywood movie 2025',
  },
  {
    id: "telugu",
    title: "Telugu Cinema",
    query: '"full movie" telugu movie 2025',
  },
  {
    id: "tamil",
    title: "Tamil Cinema",
    query: '"full movie" tamil movie 2025',
  },
  {
    id: "pakistani",
    title: "Pakistani Features",
    query: '"full movie" pakistani lollywood movie 2025',
  },
  {
    id: "korean",
    title: "Korean Drama Films",
    query: '"full movie" korean movie 2025',
  },
  {
    id: "chinese",
    title: "Chinese Cinema",
    query: '"full movie" chinese movie 2025',
  },
  {
    id: "japanese",
    title: "Japanese Features",
    query: '"full movie" japanese movie 2025',
  },
  {
    id: "thai",
    title: "Thai Movie Picks",
    query: '"full movie" thai movie 2025',
  },
  {
    id: "pinoy",
    title: "Pinoy Full Movies",
    query: '"full movie" filipino pinoy movie 2025',
  },
  {
    id: "indonesian",
    title: "Indonesian Cinema",
    query: '"full movie" indonesian movie 2025',
  },
  {
    id: "french",
    title: "French Language Films",
    query: '"full movie" french movie 2025',
  },
  {
    id: "spanish",
    title: "Spanish Language Films",
    query: '"full movie" spanish movie 2025',
  },
  {
    id: "turkish",
    title: "Turkish Drama Films",
    query: '"full movie" turkish movie 2025',
  },
];

const fallbackSeedMovies = {
  nollywood: [
    {
      videoId: "daxLrGQcJJU",
      title: "DON'T JUDGE ME - MAURICE SAM, SONIA UCHE, Latest 2025 Nigerian Movie",
      description: "A full-length Nigerian drama curated as an initial Movieflix Nollywood pick.",
      channelTitle: "Uchenna Mbunabo Tv",
      publishedAt: "2025-06-30T00:00:00Z",
    },
  ],
  bollywood: [
    {
      videoId: "gNN7B2HIYXc",
      title: "CM VIJAY - Full Movie Hindi Dubbed | Thalapathy Vijay | Pooja Hegde | New South Movie 2026",
      description: "Hindi-dubbed full movie pick for the Bollywood and South Indian cinema shelf.",
      channelTitle: "Hindi Movie Tel",
      publishedAt: "2026-06-07T11:45:19Z",
    },
    {
      videoId: "Ced9UQpXlmI",
      title: "HUNTER Full Movie | Tiger Shroff, Katrina Kaif, Sanjay Dutt | New Hindi Blockbuster Action Movie",
      description: "Hindi action movie pick curated for Movieflix.",
      channelTitle: "21 Pictures",
      publishedAt: "2026-06-07T10:06:00Z",
    },
    {
      videoId: "CC-o3e3Qfio",
      title: "BOAT Full Movie | New Released South Indian Movie Dubbed In Hindi | Thriller South Movie",
      description: "South Indian thriller movie dubbed in Hindi.",
      channelTitle: "Wamindia Movies",
      publishedAt: "2026-06-05T14:30:39Z",
    },
  ],
  hollywood: [
    {
      videoId: "sA19lLFd6w4",
      title: "TIME WAR | Hollywood Sci-fi Action Full Movie In English",
      description: "Hollywood sci-fi action full movie in English.",
      channelTitle: "Hollywood English Collection",
      publishedAt: "2026-06-06T14:30:26Z",
    },
    {
      videoId: "fHNB5eJ_bho",
      title: "The Dragon Hunter - English | Adventure Action Movie, Full Movie HD",
      description: "Adventure action movie curated for Movieflix.",
      channelTitle: "Moxi Movie English Official",
      publishedAt: "2026-05-23T14:00:06Z",
    },
    {
      videoId: "WcHrM6d6vX8",
      title: "Agent of the Future | ACTION, SCI-FI | Full Movie in English",
      description: "Action sci-fi full movie in English.",
      channelTitle: "Boxoffice | 4K Full Movies",
      publishedAt: "2026-06-06T12:00:42Z",
    },
    {
      videoId: "QykG90RCrh0",
      title: "Good Morning Killer | THRILLER, ACTION | Full Movie in English",
      description: "Thriller action full movie in English.",
      channelTitle: "MovieSphere - Action Full Movies",
      publishedAt: "2026-06-02T12:00:04Z",
    },
  ],
  ghallywood: [
    {
      videoId: "3jB_l0pX123",
      title: "THE LEGEND OF GHALLYWOOD - Full Ghana Movie",
      description: "Classic Ghallywood story curated for Movieflix.",
      channelTitle: "Ghana Movies TV",
      publishedAt: "2025-01-01T00:00:00Z",
    }
  ],
  telugu: [
    {
      videoId: "T123_telugu",
      title: "TELUGU HERO - Full Action Movie",
      description: "High octane Telugu action cinema.",
      channelTitle: "Telugu Cinema Hub",
      publishedAt: "2025-01-01T00:00:00Z",
    }
  ],
  tamil: [
    {
      videoId: "Ta456_tamil",
      title: "TAMIL THRILLER - Blockbuster Tamil Movie",
      description: "Gripping Tamil mystery thriller.",
      channelTitle: "Tamil Blockbusters",
      publishedAt: "2025-01-01T00:00:00Z",
    }
  ],
  pakistani: [
    {
      videoId: "P789_pakistani",
      title: "LOLLYWOOD LOVE - Classic Pakistani Drama Movie",
      description: "Moving Lollywood family drama.",
      channelTitle: "Pakistani Drama Gold",
      publishedAt: "2025-01-01T00:00:00Z",
    }
  ],
  korean: [
    {
      videoId: "K012_korean",
      title: "KOREAN DRAMA - Award Winning Korean Feature Film",
      description: "Subtitled Korean feature film curated for Movieflix.",
      channelTitle: "Korean Cinema International",
      publishedAt: "2025-01-01T00:00:00Z",
    }
  ],
  chinese: [
    {
      videoId: "C345_chinese",
      title: "CHINESE DYNASTY - Epic Martial Arts Full Movie",
      description: "Epic Chinese martial arts history feature.",
      channelTitle: "Chinese Film Archives",
      publishedAt: "2025-01-01T00:00:00Z",
    }
  ],
  japanese: [
    {
      videoId: "J678_japanese",
      title: "JAPANESE TALES - Traditional Japanese Feature Film",
      description: "Intimate Japanese cinematic drama.",
      channelTitle: "Japan Cinema",
      publishedAt: "2025-01-01T00:00:00Z",
    }
  ],
  thai: [
    {
      videoId: "Th901_thai",
      title: "THAI ACTION - Muay Thai Warrior Full Movie",
      description: "Thilling Thai martial arts action.",
      channelTitle: "Thai Cinema Classics",
      publishedAt: "2025-01-01T00:00:00Z",
    }
  ],
  pinoy: [
    {
      videoId: "Pi234_pinoy",
      title: "PINOY ROMANCE - Filipino Blockbuster Drama Film",
      description: "Heartwarming Filipino romance movie.",
      channelTitle: "Pinoy Cinema Stars",
      publishedAt: "2025-01-01T00:00:00Z",
    }
  ],
  indonesian: [
    {
      videoId: "In567_indonesian",
      title: "INDONESIAN TERROR - Full Horror Movie",
      description: "Scary Indonesian horror film.",
      channelTitle: "Indonesian Cinema Club",
      publishedAt: "2025-01-01T00:00:00Z",
    }
  ],
  french: [
    {
      videoId: "Fr890_french",
      title: "FRENCH CINEMA - Romantic Drama French Movie",
      description: "Romantic French language cinema with subtitles.",
      channelTitle: "French Film Hub",
      publishedAt: "2025-01-01T00:00:00Z",
    }
  ],
  spanish: [
    {
      videoId: "Sp123_spanish",
      title: "SPANISH THRILLER - Full Action Movie in Spanish",
      description: "High stakes Spanish language action thriller.",
      channelTitle: "Spanish Cinema Gold",
      publishedAt: "2025-01-01T00:00:00Z",
    }
  ],
  turkish: [
    {
      videoId: "Tu456_turkish",
      title: "TURKISH DRAMA - Love and Honor Full Movie",
      description: "Emotional Turkish drama film.",
      channelTitle: "Turkish Drama Worldwide",
      publishedAt: "2025-01-01T00:00:00Z",
    }
  ]
};

const requestedCollections = requestedCollectionsArg
  ? new Set(
      requestedCollectionsArg
        .split("=")[1]
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
    )
  : null;

const collectionsToSeed = requestedCollections
  ? seedCollections.filter((collection) => requestedCollections.has(collection.id))
  : seedCollections;

const decodeHtml = (value = "") =>
  String(value)
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const toYouTubeSearchResult = (movie) => ({
  id: {
    videoId: movie.videoId,
  },
  snippet: {
    title: movie.title,
    description: movie.description,
    channelTitle: movie.channelTitle,
    publishedAt: movie.publishedAt,
    thumbnails: {
      high: {
        url: `https://i.ytimg.com/vi/${movie.videoId}/hqdefault.jpg`,
      },
      medium: {
        url: `https://i.ytimg.com/vi/${movie.videoId}/mqdefault.jpg`,
      },
    },
  },
});

const searchYouTube = async (query) => {
  const params = new URLSearchParams({
    part: "snippet",
    maxResults: "50",
    q: query,
    type: "video",
    videoDuration: "long",
    videoEmbeddable: "true",
    safeSearch: "moderate",
    key: process.env.YOUTUBE_API_KEY,
  });

  const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "YouTube search failed");
  }

  return data.items || [];
};

const toCuratedDocument = (movie, collectionId, sortOrder) => ({
  collectionId,
  videoId: movie.id.videoId,
  title: decodeHtml(movie.snippet.title),
  description: decodeHtml(movie.snippet.description || ""),
  thumbnail: movie.snippet.thumbnails.high?.url || movie.snippet.thumbnails.medium?.url,
  channelTitle: decodeHtml(movie.snippet.channelTitle || ""),
  publishedAt: movie.snippet.publishedAt ? new Date(movie.snippet.publishedAt) : new Date(),
  sortOrder,
});

const seedCollection = async (collection) => {
  let results = [];
  let source = "YouTube API";

  try {
    results = await searchYouTube(collection.query);
  } catch (error) {
    const fallbackMovies = fallbackSeedMovies[collection.id] || [];
    if (fallbackMovies.length === 0) {
      throw error;
    }
    source = `fallback seed (${error.message})`;
    results = fallbackMovies.map(toYouTubeSearchResult);
  }

  const curatedResults = curateMovieResults(results).slice(0, limitPerCollection);
  const existingCount = await CuratedMovie.countDocuments({ collectionId: collection.id });

  console.log(`\n${collection.title}`);
  console.log(`Query: ${collection.query}`);
  console.log(`Source: ${source}`);
  console.log(`Found: ${results.length}; selected: ${curatedResults.length}; existing: ${existingCount}`);

  if (!shouldApply) {
    curatedResults.forEach((movie, index) => {
      console.log(`${index + 1}. ${decodeHtml(movie.snippet.title)} (${movie.id.videoId})`);
    });
    return { collectionId: collection.id, selected: curatedResults.length, saved: 0 };
  }

  let saved = 0;

  for (const [index, movie] of curatedResults.entries()) {
    const payload = toCuratedDocument(movie, collection.id, index + 1);
    await CuratedMovie.findOneAndUpdate(
      { collectionId: payload.collectionId, videoId: payload.videoId },
      { $set: payload },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );
    saved += 1;
  }

  console.log(`Saved ${saved} curated movies.`);
  return { collectionId: collection.id, selected: curatedResults.length, saved };
};

const seedCuratedMovies = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
  }

  if (!process.env.YOUTUBE_API_KEY) {
    throw new Error("YOUTUBE_API_KEY is required");
  }

  if (collectionsToSeed.length === 0) {
    throw new Error("No matching collections requested.");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  console.log(shouldApply ? "Applying curated seed..." : "Dry run only. Re-run with --apply to save.");
  console.log(`Collections: ${collectionsToSeed.map((collection) => collection.id).join(", ")}`);
  console.log(`Limit per collection: ${limitPerCollection}`);

  const summary = [];
  for (const collection of collectionsToSeed) {
    summary.push(await seedCollection(collection));
  }

  console.log("\nSummary");
  summary.forEach((item) => {
    console.log(`${item.collectionId}: selected ${item.selected}, saved ${item.saved}`);
  });
};

seedCuratedMovies()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
