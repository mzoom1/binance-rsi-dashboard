\

Архітектура (коротко)
	•	Stack: Next.js 14 (App Router) + TypeScript + React 18 + React Query v5 + Tailwind.
	•	Режим рендеру: сторінка клієнтська ('use client') із SSR-фолбеком; рефреш даних робить React Query.
	•	Джерело даних: офіційні REST-ендпоїнти Binance (spot & futures).
	•	Логіка індикаторів: свій rsi() (14 період, перші 14 значень null).
	•	Кеш клієнта: React Query (налаштовані staleTime ≈ 60s, gcTime ≈ 60m, refetchOnMount: false).
	•	Деплой: Vercel (білд next build, рантайм Node.js).

⸻

Дерево та ключові файли

app/
  layout.tsx         — базовий layout (шапка, шрифт, tailwind)
  page.tsx           — головна сторінка з Dashboard (client component)
components/
  Dashboard.tsx      — вся сторінка-дашборд: «контроли» + таблиця
  Controls.tsx       — селект ринку (Spot/Futures), інтервали, пошук, фільтри
  SymbolTable.tsx    — таблиця з колонками (Symbol | Price | RSI(...) | 24h %)
  SortArrow.tsx      — маленька стрілка ↑/↓ біля заголовків
lib/
  binance.ts         — робота з API Binance (listSymbols, getKlines, get24hTicker)
  intervals.ts       — список інтервалів і `sortIntervals()` (1m..1M)
  rsi.ts             — розрахунок RSI
  reactQuery.ts      — створення QueryClient (сталі таймінги, v5)
  types.ts           — типи: Row, Market, Interval, т.д.
pages/api/           — (якщо залишилися в репо) допоміжні API (старі)
app/api/             — (якщо є) нові маршрути App Router, наприклад /api/summary
public/              — іконки/фавікон (може бути порожній)
tailwind.config.ts
tsconfig.json
package.json

Примітка: після «відкату» ми повернулися до стабільної гілки довкола коміту fe5bda3. Там головна різниця — дрібне виправлення в lib/reactQuery.ts (прибраний keepPreviousData під v5).

⸻

Головні сутності даних

// lib/types.ts (концепт)
export type Market = 'spot' | 'futures';

export type Interval =
  | '1m'|'3m'|'5m'|'15m'|'30m'
  | '1h'|'2h'|'4h'|'6h'|'8h'|'12h'
  | '1d'|'3d'|'1w'|'1M';

export type Row = {
  symbol: string;                // "BTCUSDT"
  price: number | null;          // остання ціна
  rsiByIv: Record<Interval, number | null>; // RSI по вибраних інтервалах
  change24h: number | null;      // % за 24h
};


⸻

Дані: звідки й як

1) Binance API (через lib/binance.ts)
	•	listSymbols(market, quote) → масив символів, що торгуються:
	•	market: 'spot' | 'futures'
	•	quote: 'USDT' | 'USDC' | 'BUSD' | 'ALL' (у Spot — фільтруємо; у Futures — USDT-маржинальні контракти).
	•	getKlines(market, symbol, interval, limit) → OHLC масив (Close беремо для RSI).
	•	get24hTicker(market, symbol) → остання ціна та % за 24h.

Є захист/перемикання між декількома хостами Binance (якщо один гальмує).

2) Розрахунок RSI

lib/rsi.ts:

export function rsi(closes: number[], period = 14): (number|null)[] { ... }

	•	Повертає масив довжиною closes.length. Перші period значень — null.
	•	На фронті беремо arr.at(-1) як актуальне значення для інтервалу.

3) Отримання таблиці на фронті
	•	React Query в Dashboard.tsx піднімає по одному запиту на кожен вибраний інтервал.
	•	Кожен запит тягне «порцію» символів (limit, offset) і повертає Row[].
	•	Дані по інтервалах змерджуються в один словник symbol -> Row, щоб у таблиці був один рядок на символ і кілька колонок RSI.

⸻

UI/поведінка

Controls
	•	Market: Spot / Futures.
	•	Interval chips: можна вмикати/вимикати кілька інтервалів (завжди відсортовано sortIntervals() як 1m → 1M).
	•	Search: фільтр по символу (BTC, ETH…).
	•	Фільтри: чекбокси RSI < 30 (oversold) та RSI > 70 (overbought) щодо головного інтервалу (звичайно першого вибраного).
	•	Refresh: форс-перезапит всіх запитів React Query для актуального стану.

Таблиця

Колонки:
	•	Symbol
	•	Price
	•	RSI(…): для кожного вибраного інтервалу своя колонка.
	•	24h %

Сортування:
	•	По кожній колонці: клікабельний заголовок + стрілка ↑/↓ (компонент SortArrow).
	•	За замовчуванням — Symbol A→Z.
	•	Під капотом — sortKey: 'symbol' | 'price' | 'rsi-<interval>' | 'change24h' + sortDir: 'asc'|'desc'.

Пагінація/підвантаження:
	•	(Опційно) «Показати ще» — збільшення limit або наступний offset.

⸻

React Query (клієнтський кеш)

Файл lib/reactQuery.ts (v5):

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: false,
      staleTime: 60 * 1000,    // "свіжі" 60 с
      gcTime:    60 * 60 * 1000, // тримаємо в кеші до 60 хв
      // keepPreviousData: НЕ потрібен у v5
      throwOnError: false,
      networkMode: 'always',
    },
  },
});

Використання у app/layout.tsx:

<QueryClientProvider client={queryClient}>
  {/* ... */}
</QueryClientProvider>


⸻

API в App Router (коли потрібно бек кешувати/агрегувати)

У твоїй стабільній версії ми в основному тягнемо напряму Binance з фронта. Якщо захочеш агрегувати/кешувати на сервері, орієнтир — /app/api/summary/route.ts (версія, яку ми колись додавали):

	•	Параметри: market, interval, quote, limit, offset.
	•	Повертає { rows: Row[], total, nextOffset, meta }.
	•	Може використовувати Redis/Upstash (було в експериментальній гілці), але у «чистій» стабільній версії від цього відмовились.

Контракти для фронта:

type SummaryResponse = {
  rows: Row[];
  total: number;
  nextOffset: number | null;
  meta: {
    ok: number; fail: number;
    offset: number; limit: number; total: number;
    cached?: boolean; revalidated?: boolean;
  };
};


⸻

Скрипти та запуск

package.json (актуальне):
	•	pnpm dev — локально (http://localhost:3000)
	•	pnpm build — білд
	•	pnpm start — прод-сервер
	•	pnpm test:watch — якщо є тести

Локально:

pnpm i
pnpm dev

Деплой (Vercel):
	•	Прив’язка репо → автоматичні білди з main.
	•	Нічого особливого з env не потрібно для нинішнього режиму (тільки якщо додаватимеш Redis або власні API-ключі).

⸻

Типові задачі для Windsurf (копіпасти як промпти)
	1.	«Додай колонку RSI(30m) до таблиці, якщо обрана відповідна «чипса» в Controls»
	•	Дивись components/Controls.tsx (масив вибраних інтервалів)
	•	components/Dashboard.tsx — мердж даних по інтервалах
	•	components/SymbolTable.tsx — відмалювання колонок за selectedIntervals.
	2.	«Зроби серверний роут /api/summary, що повертає Page (limit/offset) і кешує на 60с»
	•	app/api/summary/route.ts + lib/binance.ts для викликів
	•	поверни SummaryResponse (див. контракт вище).
	3.	«Додай сортування по «24h %» (заголовок клікабельний, стрілка, зберігати стан)»
	•	SymbolTable.tsx: обробник onSort, стани sortKey/sortDir в Dashboard.tsx.
	4.	«Додай фільтр «Only symbols with RSI(1h) available»»
	•	у селекторі, при фільтрації: row.rsiByIv['1h'] != null.
	5.	«Прискорити первинне завантаження»
Варіанти:
	•	Зменш limit та додай «Показати ще».
	•	Увімкни «паралельні запити» по інтервалах (вже є) і по сторінках списку символів.
	•	Якщо треба — зроби бек-«prewarm» у CRON (Vercel Scheduled Functions) й читай із кеша.

⸻

Що важливо пам’ятати
	•	Сортування інтервалів: завжди через sortIntervals(next) — щоб «1m…1M».
	•	RSI: перші 14 значень null — це очікувано. На UI показуй – для null.
	•	Futures vs Spot: на ф’ючах беремо USDT-маржинальні пари; на споті — фільтр по quote.
	•	React Query v5: без keepPreviousData; якщо бачитимеш старі гіди — вони під v4.
	•	Стрілки сортування: маленький ізольований компонент, щоб не засмічувати заголовки.
	•	Пам’ять/Rate Limits Binance: при масивних запитах — роби «пулу» (concurrency) і «порції» по символах.

⸻

Якщо захочеш «заморозити» саме той старий хеш

Зараз main у стані як fe5bda3, але хеш — новий (04a96aa) через revert.
Якщо хочеш історично повернутись точно на fe5bda3 (прибравши всі нові коміти з історії main):

⚠️ Це перепише історію main. Робити тільки якщо розумієш наслідки.

# збережи резервну гілку
git checkout -b freeze/fe5bda3
git push -u origin freeze/fe5bda3

# силовий reset main і force-push
git checkout main
git reset --hard fe5bda3
git push -f origin main

(Можна не робити — поточний стан уже стабільний і еквівалентний за кодом.)
