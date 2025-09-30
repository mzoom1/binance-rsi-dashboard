/**
 * Обчислення RSI (Relative Strength Index, Wilder’s method).
 * @param closes масив цін закриття
 * @param period період RSI (звичайно 14)
 */
export function rsi(closes: number[], period = 14): number[] {
  const out: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return out;

  let gains = 0;
  let losses = 0;

  // перший період
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  out[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));

  // далі по методу Вайлдера
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    out[i] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
  }

  return out as number[];
}