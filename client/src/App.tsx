import { useEffect, useState } from "react";

type Health = { status: string };

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:4000/api/health")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Health>;
      })
      .then(setHealth)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <main>
      <h1>Job Tracker</h1>
      {!health && !error && <p>Checking API…</p>}
      {health && <p>API status: {health.status}</p>}
      {error && <p>API unreachable: {error}</p>}
    </main>
  );
}
