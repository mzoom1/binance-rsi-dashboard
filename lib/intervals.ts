export const intervals = ['1m','3m','5m','15m','30m','1h','2h','4h','6h','8h','12h','1d','3d','1w','1M'] as const;
export type Interval = typeof intervals[number];

export function intervalTtl(i: Interval): number {
  if (['1m','3m','5m'].includes(i)) return 30_000;
  if (['15m','30m','1h'].includes(i)) return 60_000;
  if (['2h','4h','6h','8h','12h'].includes(i)) return 120_000;
  return 300_000;
}
