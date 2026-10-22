'use client';

import { useEffect, useState } from 'react';
import { api, getToken } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Server, Plus, Trash2, Wifi } from 'lucide-react';

export default function ServersPage() {
  const router = useRouter();
  const [servers, setServers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    host: '',
    port: 25565,
    version: '1.20.4',
    authMode: 'offline' as 'online' | 'offline',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    api('/api/servers')
      .then((d) => setServers(d.servers || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    load();
  }, [router]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/api/servers', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setShowForm(false);
      setForm({ displayName: '', host: '', port: 25565, version: '1.20.4', authMode: 'offline' });
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function test(id: string) {
    try {
      const res = await api(`/api/servers/${id}/test`, { method: 'POST' });
      alert(res.success ? 'Connection successful' : `Failed: ${res.error}`);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this server?')) return;
    await api(`/api/servers/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Servers</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Server
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={create}
          className="p-6 rounded-2xl bg-card border border-border mb-6 space-y-4"
        >
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted">Display name</label>
              <input
                required
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-surface border border-border outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm text-muted">Host / IP</label>
              <input
                required
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
                placeholder="play.example.com"
                className="w-full mt-1 px-3 py-2 rounded-lg bg-surface border border-border outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm text-muted">Port</label>
              <input
                type="number"
                value={form.port}
                onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-surface border border-border outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm text-muted">Version</label>
              <input
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-surface border border-border outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm text-muted">Auth mode</label>
              <select
                value={form.authMode}
                onChange={(e) =>
                  setForm({ ...form, authMode: e.target.value as 'online' | 'offline' })
                }
                className="w-full mt-1 px-3 py-2 rounded-lg bg-surface border border-border outline-none focus:border-primary"
              >
                <option value="offline">Offline (cracked servers)</option>
                <option value="online">Online (premium required)</option>
              </select>
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-primary rounded-lg text-sm font-medium">
            Save Server
          </button>
        </form>
      )}

      {loading ? (
        <div className="h-32 bg-card rounded-xl animate-pulse" />
      ) : servers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-border">
          <Server className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-muted">No servers configured</p>
        </div>
      ) : (
        <div className="space-y-3">
          {servers.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between p-4 rounded-xl bg-card border border-border"
            >
              <div>
                <p className="font-medium">{s.displayName}</p>
                <p className="text-sm text-muted">
                  {s.host}:{s.port} · {s.version} · {s.authMode}
                </p>
                {s.lastTestAt && (
                  <p className="text-xs mt-1">
                    Last test:{' '}
                    <span className={s.lastTestSuccess ? 'text-success' : 'text-danger'}>
                      {s.lastTestSuccess ? 'OK' : s.lastTestError}
                    </span>
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => test(s.id)}
                  className="p-2 text-muted hover:text-accent transition"
                  title="Test connection"
                >
                  <Wifi className="w-4 h-4" />
                </button>
                <button
                  onClick={() => remove(s.id)}
                  className="p-2 text-muted hover:text-danger transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
