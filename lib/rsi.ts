/** Wilder's RSI implementation with EMA of gains/losses */
export function rsi(values: number[], period = 14): (number | null)[] {
  if (period <= 0) throw new Error('period must be > 0');
  const n = values.length;
  const out: (number|null)[] = new Array(n).fill(null);
  if (n < period + 1) return out;

  const gains: number[] = new Array(n).fill(0);
  const losses: number[] = new Array(n).fill(0);

  for (let i = 1; i < n; i++) {
    const delta = values[i] - values[i - 1];
    gains[i] = Math.max(delta, 0);
    losses[i] = Math.max(-delta, 0);
  }

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    avgGain += gains[i];
    avgLoss += losses[i];
  }
  avgGain /= period;
  avgLoss /= period;

  const ema = (prev: number, curr: number) => (prev * (period - 1) + curr) / period;

  for (let i = period + 1; i < n; i++) {
    avgGain = ema(avgGain, gains[i]);
    avgLoss = ema(avgLoss, losses[i]);
    const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    out[i] = 100 - 100 / (1 + rs);
  }
  return out;
}
