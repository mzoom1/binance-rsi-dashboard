export const intervals = [
  '1m','3m','5m','15m','30m',
  '1h','2h','4h','6h','8h','12h',
  '1d','3d','1w','1M',
] as const;

const rank = new Map(intervals.map((iv, i) => [iv, i]));

export function sortIntervals(list: string[]): string[] {
  return [...new Set(list)].sort(
    (a, b) => (rank.get(a) ?? 999) - (rank.get(b) ?? 999)
  );
}

export function toggleInterval(current: string[], iv: string): string[] {
  return current.includes(iv)
    ? sortIntervals(current.filter(x => x !== iv))
    : sortIntervals([...current, iv]);
}
