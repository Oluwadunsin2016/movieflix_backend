const cacheStore = new Map();

const getTtlMs = () => {
  const ttlMinutes = Number(process.env.YOUTUBE_CACHE_TTL_MINUTES || 30);
  return Math.max(ttlMinutes, 1) * 60 * 1000;
};

const getCacheKey = (namespace, params = {}) => {
  const normalizedParams = Object.keys(params)
    .sort()
    .reduce((accumulator, key) => {
      accumulator[key] = params[key];
      return accumulator;
    }, {});

  return `${namespace}:${JSON.stringify(normalizedParams)}`;
};

const getCachedValue = (key) => {
  const cachedItem = cacheStore.get(key);

  if (!cachedItem) {
    return null;
  }

  if (cachedItem.expiresAt <= Date.now()) {
    cacheStore.delete(key);
    return null;
  }

  return cachedItem.value;
};

const setCachedValue = (key, value, ttlMs = getTtlMs()) => {
  cacheStore.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
};

const getCacheStats = () => ({
  entries: cacheStore.size,
  ttlMinutes: Math.max(Number(process.env.YOUTUBE_CACHE_TTL_MINUTES || 30), 1),
});

module.exports = {
  getCacheKey,
  getCachedValue,
  setCachedValue,
  getCacheStats,
};
