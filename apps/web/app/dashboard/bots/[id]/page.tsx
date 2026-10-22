'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import { Play, Square, RotateCcw } from 'lucide-react';

export default function BotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [bot, setBot] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const consoleRef = useRef<HTMLDivElement>(null);

  function load() {
    api(`/api/bots/${id}`)
      .then((d) => setBot(d.bot))
      .catch(() => router.push('/dashboard/bots'));
    api(`/api/bots/${id}/logs`)
      .then((d) => setLogs(d.logs || []))
      .catch(() => {});
  }

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [id, router]);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  async function action(act: 'start' | 'stop' | 'restart') {
    try {
      await api(`/api/bots/${id}/${act}`, { method: 'POST' });
      load();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (!bot) {
    return <div className="h-40 bg-card rounded-xl animate-pulse" />;
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{bot.name}</h1>
          <p className="text-sm text-muted">
            {bot.account?.username} ({bot.account?.type}) → {bot.server?.host}:
            {bot.server?.port}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => action('start')}
            className="flex items-center gap-2 px-4 py-2 bg-success/20 text-success rounded-lg text-sm"
          >
            <Play className="w-4 h-4" /> Start
          </button>
          <button
            onClick={() => action('stop')}
            className="flex items-center gap-2 px-4 py-2 bg-muted/20 text-muted rounded-lg text-sm"
          >
            <Square className="w-4 h-4" /> Stop
          </button>
          <button
            onClick={() => action('restart')}
            className="flex items-center gap-2 px-4 py-2 bg-accent/20 text-accent rounded-lg text-sm"
          >
            <RotateCcw className="w-4 h-4" /> Restart
          </button>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-xs text-muted">Status</p>
          <p className="font-semibold text-lg">{bot.status}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-xs text-muted">Ping</p>
          <p className="font-semibold text-lg">
            {bot.runtimeState?.lastPingMs != null
              ? `${bot.runtimeState.lastPingMs} ms`
              : '—'}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-xs text-muted">Reconnects</p>
          <p className="font-semibold text-lg">
            {bot.runtimeState?.reconnectCount ?? 0}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-xs text-muted">Uptime</p>
          <p className="font-semibold text-lg">
            {Math.floor(Number(bot.runtimeState?.totalUptimeSeconds || 0) / 60)} m
          </p>
        </div>
      </div>

      {/* Console */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-2 border-b border-border text-sm text-muted flex justify-between">
          <span>Live Console</span>
          <span className="text-xs">Auto-refresh every 5s</span>
        </div>
        <div
          ref={consoleRef}
          className="console h-80 overflow-y-auto p-4 bg-black/40 space-y-0.5"
        >
          {logs.length === 0 ? (
            <p className="text-muted">No logs yet. Start the bot to see activity.</p>
          ) : (
            logs.map((l) => (
              <div key={l.id} className="flex gap-2">
                <span className="text-muted shrink-0">
                  {new Date(l.createdAt).toLocaleTimeString()}
                </span>
                <span
                  className={
                    l.level === 'error'
                      ? 'text-danger'
                      : l.level === 'warn'
                      ? 'text-warning'
                      : 'text-gray-300'
                  }
                >
                  [{l.level}] {l.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
