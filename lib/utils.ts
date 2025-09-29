export function assertSymbol(sym: string) {
  if (!/^[A-Z0-9]{5,20}$/.test(sym)) throw new Error('Invalid symbol');
}
export function assertInterval(iv: string) {
  const allowed = new Set(['1m','3m','5m','15m','30m','1h','2h','4h','6h','8h','12h','1d','3d','1w','1M']);
  if (!allowed.has(iv)) throw new Error('Invalid interval');
}
export function toNum(x: any, def = 0) {
  const n = Number(x); return Number.isFinite(n) ? n : def;
}
export function delay(ms: number) { return new Promise(res => setTimeout(res, ms)); }
