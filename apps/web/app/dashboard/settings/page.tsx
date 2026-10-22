'use client';

import { useEffect, useState } from 'react';
import { api, getToken } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    api('/api/auth/me').then((d) => setUser(d.user)).catch(() => {});
  }, [router]);

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      {user && (
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <div>
            <p className="text-sm text-muted">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Display name</p>
            <p className="font-medium">{user.displayName || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Plan</p>
            <p className="font-medium">{user.plan?.name || 'Free'}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Role</p>
            <p className="font-medium">{user.role}</p>
          </div>
        </div>
      )}
    </div>
  );
}
