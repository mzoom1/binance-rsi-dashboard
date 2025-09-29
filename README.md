# Binance RSI Dashboard

Next.js 14 (App Router) + TypeScript + React Query + lightweight-charts + Tailwind. Shows RSI(14) for **all Binance spot pairs** across multiple intervals. Local Wilder RSI calculation by default.

## Features
- Symbols from `/api/v3/exchangeInfo` (spot, TRADING, filterable by quote)
- Local RSI(14) computed from klines `/api/v3/klines`
- Server caching: ISR headers + in-memory LRU, TTL by interval
- Parallel batched requests (10–15) with retry & exponential backoff, 429-aware
- API layer:
  - `GET /api/symbols?quote=USDT|USDC|BUSD|ALL`
  - `GET /api/rsx?symbol=BTCUSDT&interval=1h&limit=500&period=14`
  - `GET /api/summary?interval=1h&quote=USDT`
- UI: interval selector, search, RSI filters, virtualized table, per-symbol page with price + RSI charts, 30/70 levels, RSI period switch
- Reliability: graceful rate-limit banner (surfaced error), input validation
- Tests: unit test for RSI util (Vitest)

## Quickstart

```bash
pnpm i
cp .env.example .env.local
pnpm dev
```
Open http://localhost:3000

### Environment
- `NEXT_PUBLIC_BINANCE_BASE` – REST host (default official)
- `RSI_SOURCE` – `local` (default) or `binance` (if you wire up external indicator API)
- `MOCK` – `true` to use seed data for BTCUSDT & mocked exchangeInfo (offline dev)

### Deployment
- Deploy to Vercel (set env vars in project settings).

### Caching & Limits
- In-memory LRU wraps fetches; TTL depends on interval (shorter for lower timeframes)
- ISR via `Cache-Control: s-maxage` and `export const revalidate` on `/api/symbols`
- Requests batched in chunks of ~12–15; 429 responses respect `Retry-After` when present

### API Examples
- `/api/symbols?quote=USDT` →
```json
[
  {"symbol":"BTCUSDT","baseAsset":"BTC","quoteAsset":"USDT"},
  {"symbol":"ETHUSDT","baseAsset":"ETH","quoteAsset":"USDT"}
]
```
- `/api/rsx?symbol=BTCUSDT&interval=1h&limit=200` →
```json
[{"time":1700000000000,"close":35050,"rsi":null},{"time":1700003600000,"close":35150,"rsi":null}]
```
- `/api/summary?interval=1h` →
```json
[{"symbol":"BTCUSDT","price":35200.12,"rsi":48.32,"change24h":1.25}]
```

### Notes
- If Binance modifies endpoints, adjust `lib/binance.ts` fetchers and update README accordingly.
- Extend `/api/summary` to top-200 by volume if needed (sort by quoteVolume).
