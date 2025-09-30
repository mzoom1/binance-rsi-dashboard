export const intervals = [
  '1m','3m','5m','15m','30m',
  '1h','2h','4h','6h','8h','12h',
  '1d','3d','1w','1M',
] as const;

// Корисно мати точний тип, якщо знадобиться далі
export type Interval = typeof intervals[number];

// Робимо мапу з ключем string, щоб не сварився TS при sort порівнянні
const rank = new Map<string, number>(intervals.map((iv, i) => [iv, i]));

/** Повертає список інтервалів, відсортований у "порядку зростання" та без дублікатів */
export function sortIntervals(list: readonly string[]): string[] {
  return [...new Set(list)].sort(
    (a, b) => (rank.get(a) ?? 999) - (rank.get(b) ?? 999)
  );
}

/** Тогл інтервалу з обов'язковим впорядкуванням */
export function toggleInterval(current: readonly string[], iv: string): string[] {
  return current.includes(iv)
    ? sortIntervals(current.filter(x => x !== iv))
    : sortIntervals([...current, iv]);
}
