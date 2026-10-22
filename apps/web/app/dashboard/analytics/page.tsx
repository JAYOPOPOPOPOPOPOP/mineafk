'use client';

import { useEffect, useState } from 'react';
import { api, getToken } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    api('/api/analytics/overview').then(setData).catch(() => {});
  }, [router]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-6 rounded-xl bg-card border border-border">
          <p className="text-sm text-muted">Total Bots</p>
          <p className="text-3xl font-bold">{data?.totalBots ?? '—'}</p>
        </div>
        <div className="p-6 rounded-xl bg-card border border-border">
          <p className="text-sm text-muted">Currently Online</p>
          <p className="text-3xl font-bold text-success">{data?.online ?? '—'}</p>
        </div>
        <div className="p-6 rounded-xl bg-card border border-border">
          <p className="text-sm text-muted">Total Uptime (hours)</p>
          <p className="text-3xl font-bold">
            {data ? Math.floor(data.totalUptimeSeconds / 3600) : '—'}
          </p>
        </div>
      </div>
      <p className="text-sm text-muted mt-6">
        Stats are calculated from real connection events stored in the database.
      </p>
    </div>
  );
}
