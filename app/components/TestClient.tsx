'use client';
import { useState } from 'react';

export default function TestClient() {
  const [count, setCount] = useState(0);
  return (
    <div style={{ marginTop: 20 }}>
      <p>Client component працює. Count = {count}</p>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </div>
  );
}
