'use client';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useEffect, useState } from 'react';

export default function Page() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div>
      <h1 style={{ margin: 0 }}>Binance RSI Dashboard — minimal test</h1>
      <p style={{ opacity: 0.7 }}>Сторінка живе. tick = {tick}</p>
    </div>
  );
}
