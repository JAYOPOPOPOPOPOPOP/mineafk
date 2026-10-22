'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bot, Server, User, Activity } from 'lucide-react';
import { api, getToken } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function DashboardOverview() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [bots, setBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    Promise.all([
      api('/api/analytics/overview').catch(() => ({})),
      api('/api/bots').catch(() => ({ bots: [] })),
    ]).then(([overview, botsRes]) => {
      setData(overview);
      setBots(botsRes.bots || []);
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-card rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-card rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    ONLINE: 'text-success',
    STOPPED: 'text-muted',
    FAILED: 'text-danger',
    CONNECTING: 'text-warning',
    RECONNECTING: 'text-warning',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Overview</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Bots', value: data?.totalBots ?? bots.length, icon: Bot },
          { label: 'Online', value: data?.online ?? 0, icon: Activity },
          { label: 'Failed', value: data?.failed ?? 0, icon: Server },
          {
            label: 'Uptime (hrs)',
            value: Math.floor((data?.totalUptimeSeconds || 0) / 3600),
            icon: User,
          },
        ].map((c) => (
          <div key={c.label} className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted">{c.label}</span>
              <c.icon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Recent Bots</h2>
        <Link href="/dashboard/bots/create" className="text-sm text-primary hover:underline">
          + Create Bot
        </Link>
      </div>

      {bots.length === 0 ? (
        <div className="p-12 rounded-2xl bg-card border border-border text-center">
          <Bot className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-muted mb-4">No bots yet</p>
          <Link
            href="/dashboard/bots/create"
            className="inline-block px-4 py-2 bg-primary rounded-lg text-sm font-medium"
          >
            Create your first bot
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bots.slice(0, 5).map((bot) => (
            <Link
              key={bot.id}
              href={`/dashboard/bots/${bot.id}`}
              className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/40 transition"
            >
              <div>
                <p className="font-medium">{bot.name}</p>
                <p className="text-sm text-muted">
                  {bot.account?.username} → {bot.server?.host}
                </p>
              </div>
              <span className={`text-sm font-medium ${statusColor[bot.status] || 'text-muted'}`}>
                {bot.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
