export const intervals = [
  '1m','3m','5m','15m','30m',
  '1h','2h','4h','6h','8h','12h',
  '1d','3d','1w','1M',
] as const;

export type Interval = typeof intervals[number];

// карта порядку для стабільного сортування
export const intervalRank: Record<string, number> =
  Object.fromEntries(intervals.map((iv, i) => [iv, i])) as Record<string, number>;

// хелпер сортування
export const sortIntervals = (arr: string[]) =>
  [...new Set(arr)].sort((a, b) => (intervalRank[a] ?? 999) - (intervalRank[b] ?? 999));
