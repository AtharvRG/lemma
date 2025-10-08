type CacheKey = string;

const cache = new Map<CacheKey, any>();

export function makeKey(language: string, code: string) {
  return `${language}::${code}`;
}

export function getCached(language: string, code: string) {
  return cache.get(makeKey(language, code));
}

export function setCached(language: string, code: string, value: any) {
  try {
    cache.set(makeKey(language, code), value);
  } catch (e) {
    // ignore
  }
}

export function clearCache() {
  cache.clear();
}
