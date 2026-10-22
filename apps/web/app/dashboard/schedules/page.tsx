'use client';

export default function SchedulesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Schedules</h1>
      <div className="p-8 rounded-2xl bg-card border border-border text-center text-muted">
        <p>Scheduling is available on paid plans.</p>
        <p className="text-sm mt-2">
          Use BullMQ + Redis cron jobs. Free plan has scheduling disabled by default.
        </p>
      </div>
    </div>
  );
}
