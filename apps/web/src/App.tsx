import { useQuery } from '@tanstack/react-query';
import { getHealth } from './api.ts';

export default function App() {
  const health = useQuery({ queryKey: ['health'], queryFn: getHealth });

  return (
    <main>
      <h1>Aitrainer</h1>
      <p>
        Backend:{' '}
        {health.isPending ? 'checking…' : health.isError ? `unreachable (${health.error.message})` : health.data.status}
      </p>
    </main>
  );
}
