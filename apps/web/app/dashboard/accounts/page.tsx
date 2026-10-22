'use client';

import { useEffect, useState } from 'react';
import { api, getToken } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { User, Plus, Trash2 } from 'lucide-react';

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    api('/api/minecraft/accounts')
      .then((d) => setAccounts(d.accounts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    load();
  }, [router]);

  async function createOffline(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/api/minecraft/accounts/offline', {
        method: 'POST',
        body: JSON.stringify({ username, label }),
      });
      setUsername('');
      setLabel('');
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this account?')) return;
    await api(`/api/minecraft/accounts/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Minecraft Accounts</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Account
        </button>
      </div>

      {/* Selection cards */}
      {showForm && (
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="p-6 rounded-2xl bg-card border border-border opacity-60">
            <h3 className="font-semibold mb-2">Premium (Microsoft)</h3>
            <p className="text-sm text-muted mb-4">
              Official Microsoft authentication. Requires Azure App Registration credentials.
            </p>
            <button
              disabled
              className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-muted cursor-not-allowed"
            >
              Configure Microsoft OAuth first
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-primary/40">
            <h3 className="font-semibold mb-2">Cracked / Offline Mode</h3>
            <p className="text-sm text-muted mb-4">
              Custom username. Only works on servers that allow offline authentication.
            </p>
            <form onSubmit={createOffline} className="space-y-3">
              {error && <p className="text-sm text-danger">{error}</p>}
              <input
                placeholder="Minecraft username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                pattern="[a-zA-Z0-9_]{3,16}"
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border outline-none focus:border-primary text-sm"
              />
              <input
                placeholder="Label (optional)"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border outline-none focus:border-primary text-sm"
              />
              <button type="submit" className="w-full py-2 bg-primary rounded-lg text-sm font-medium">
                Create Offline Account
              </button>
            </form>
            <p className="text-xs text-warning mt-3">
              Offline username does not prove ownership of that Minecraft identity.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="h-32 bg-card rounded-xl animate-pulse" />
      ) : accounts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-border">
          <User className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-muted">No accounts yet. Add an offline or premium account.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between p-4 rounded-xl bg-card border border-border"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{a.username}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      a.type === 'PREMIUM'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-warning/20 text-warning'
                    }`}
                  >
                    {a.type}
                  </span>
                </div>
                {a.label && a.label !== a.username && (
                  <p className="text-sm text-muted">{a.label}</p>
                )}
              </div>
              <button
                onClick={() => remove(a.id)}
                className="p-2 text-muted hover:text-danger transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
