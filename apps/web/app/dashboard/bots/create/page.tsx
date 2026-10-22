'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';

export default function CreateBotPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [servers, setServers] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '',
    accountId: '',
    serverId: '',
    autoReconnect: true,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    Promise.all([api('/api/minecraft/accounts'), api('/api/servers')]).then(
      ([a, s]) => {
        setAccounts(a.accounts || []);
        setServers(s.servers || []);
      }
    );
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api('/api/bots', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      router.push(`/dashboard/bots/${data.bot.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Create Bot</h1>

      <form onSubmit={submit} className="space-y-4 p-6 rounded-2xl bg-card border border-border">
        {error && (
          <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="text-sm text-muted">Bot name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-surface border border-border outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="text-sm text-muted">Minecraft Account</label>
          <select
            required
            value={form.accountId}
            onChange={(e) => setForm({ ...form, accountId: e.target.value })}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-surface border border-border outline-none focus:border-primary"
          >
            <option value="">Select account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.username} ({a.type})
              </option>
            ))}
          </select>
          {accounts.length === 0 && (
            <p className="text-xs text-warning mt-1">
              No accounts. <a href="/dashboard/accounts" className="underline">Add one first</a>.
            </p>
          )}
        </div>

        <div>
          <label className="text-sm text-muted">Server</label>
          <select
            required
            value={form.serverId}
            onChange={(e) => setForm({ ...form, serverId: e.target.value })}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-surface border border-border outline-none focus:border-primary"
          >
            <option value="">Select server</option>
            {servers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.displayName} ({s.host}:{s.port})
              </option>
            ))}
          </select>
          {servers.length === 0 && (
            <p className="text-xs text-warning mt-1">
              No servers. <a href="/dashboard/servers" className="underline">Add one first</a>.
            </p>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.autoReconnect}
            onChange={(e) => setForm({ ...form, autoReconnect: e.target.checked })}
          />
          Auto-reconnect on disconnect
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-primary rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Bot'}
        </button>
      </form>
    </div>
  );
}
