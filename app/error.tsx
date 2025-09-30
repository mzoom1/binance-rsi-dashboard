'use client';
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body style={{ fontFamily: 'system-ui', padding: 20 }}>
        <h2>Application error</h2>
        <pre style={{ whiteSpace: 'pre-wrap', background: '#f6f6f6', padding: 12, borderRadius: 8 }}>
{String(error?.message || error)}
        </pre>
        <button onClick={() => reset()} style={{ marginTop: 12, padding: '8px 12px' }}>Retry</button>
      </body>
    </html>
  );
}
