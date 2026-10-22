'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, getToken } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Bot, Play, Square, RotateCcw, Trash2 } from 'lucide-react';

export default function BotsPage() {
  const router = useRouter();
  const [bots, setBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api('/api/bots')
      .then((d) => setBots(d.bots || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [router]);

  async function action(id: string, act: 'start' | 'stop' | 'restart') {
    try {
      await api(`/api/bots/${id}/${act}`, { method: 'POST' });
      load();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this bot?')) return;
    await api(`/api/bots/${id}`, { method: 'DELETE' });
    load();
  }

  const statusColor: Record<string, string> = {
    ONLINE: 'bg-success/20 text-success',
    STOPPED: 'bg-muted/20 text-muted',
    FAILED: 'bg-danger/20 text-danger',
    CONNECTING: 'bg-warning/20 text-warning',
    QUEUED: 'bg-accent/20 text-accent',
    STARTING: 'bg-warning/20 text-warning',
    RECONNECTING: 'bg-warning/20 text-warning',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Bots</h1>
        <Link
          href="/dashboard/bots/create"
          className="px-4 py-2 bg-primary rounded-lg text-sm font-medium"
        >
          + Create Bot
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-card rounded-xl animate-pulse" />
          ))}
        </div>
      ) : bots.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-border">
          <Bot className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-muted mb-4">No bots yet</p>
          <Link
            href="/dashboard/bots/create"
            className="inline-block px-4 py-2 bg-primary rounded-lg text-sm"
          >
            Create Bot
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bots.map((bot) => (
            <div
              key={bot.id}
              className="p-4 rounded-xl bg-card border border-border flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <Link href={`/dashboard/bots/${bot.id}`} className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{bot.name}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${statusColor[bot.status] || ''}`}
                  >
                    {bot.status}
                  </span>
                </div>
                <p className="text-sm text-muted mt-1">
                  {bot.account?.username} ({bot.account?.type}) → {bot.server?.host}:
                  {bot.server?.port}
                </p>
              </Link>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => action(bot.id, 'start')}
                  className="p-2 rounded-lg bg-success/10 text-success hover:bg-success/20"
                  title="Start"
                >
                  <Play className="w-4 h-4" />
                </button>
                <button
                  onClick={() => action(bot.id, 'stop')}
                  className="p-2 rounded-lg bg-muted/10 text-muted hover:bg-muted/20"
                  title="Stop"
                >
                  <Square className="w-4 h-4" />
                </button>
                <button
                  onClick={() => action(bot.id, 'restart')}
                  className="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20"
                  title="Restart"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => remove(bot.id)}
                  className="p-2 rounded-lg text-muted hover:text-danger"
                  title="Delete"
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
