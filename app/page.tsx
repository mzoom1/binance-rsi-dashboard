export const revalidate = 0;

import TestClient from './components/TestClient';

export default function Page() {
  return (
    <div>
      <h1>Ping / (server + client)</h1>
      <p>SSR працює, нижче client component:</p>
      <TestClient />
    </div>
  );
}
