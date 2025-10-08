type Metrics = {
  durations: number[];
};

const store = new Map<string, Metrics>();

export function markStart(key: string) {
  const now = Date.now();
  (store as any).__startTimes = (store as any).__startTimes || new Map<string, number>();
  (store as any).__startTimes.set(key, now);
}

export function markEnd(key: string) {
  const now = Date.now();
  const starts = (store as any).__startTimes as Map<string, number> | undefined;
  if (!starts) return;
  const start = starts.get(key);
  if (typeof start === 'number') {
    const diff = now - start;
    let m = store.get(key);
    if (!m) {
      m = { durations: [] };
      store.set(key, m);
    }
    m.durations.push(diff);
    starts.delete(key);
  }
}

export function recordDuration(key: string, ms: number) {
  let m = store.get(key);
  if (!m) {
    m = { durations: [] };
    store.set(key, m);
  }
  m.durations.push(ms);
}

export function getStats(key: string) {
  const m = store.get(key);
  if (!m || m.durations.length === 0) return null;
  const n = m.durations.length;
  const sum = m.durations.reduce((a, b) => a + b, 0);
  const avg = sum / n;
  const sorted = [...m.durations].sort((a, b) => a - b);
  const median = sorted[Math.floor(n / 2)];
  return { count: n, avg, median, min: sorted[0], max: sorted[sorted.length - 1] };
}

export function clearStats(key?: string) {
  if (key) store.delete(key);
  else store.clear();
}
