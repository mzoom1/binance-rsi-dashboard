/**
 * Wilder's RSI. Повертає number[]; на перших (period) індексах — NaN.
 */
export function rsi(closes: number[], period = 14): number[] {
  const n = closes.length;
  const out = new Array<number>(n).fill(NaN);
  if (n < period + 1) return out;

  let gainSum = 0;
  let lossSum = 0;

  // Початкове вікно
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gainSum += d;
    else lossSum -= d;
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;

  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  // Подальші значення (метод Вайлдера)
  for (let i = period + 1; i < n; i++) {
    const d = closes[i] - closes[i - 1];
    const gain = d > 0 ? d : 0;
    const loss = d < 0 ? -d : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return out;
}
