import Link from 'next/link';
import { Server, Shield, Clock, Terminal, Users, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-sm">
              M
            </div>
            <span className="font-semibold text-lg">MineAFK Cloud</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm text-muted hover:text-white transition"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm bg-primary hover:bg-primary/90 rounded-lg font-medium transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 py-24 md:py-32 text-center relative">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Your Minecraft.
            <br />
            <span className="bg-gradient-to-r from-primary via-accent-blue to-accent bg-clip-text text-transparent">
              Always Online.
            </span>
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto mb-10">
            Keep your Minecraft bots connected 24/7 from the cloud. Premium Microsoft
            accounts and offline-mode support. Manage everything from a modern dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-3 bg-primary hover:bg-primary/90 rounded-xl font-semibold transition shadow-lg shadow-primary/25"
            >
              Start Free
            </Link>
            <Link
              href="/docs"
              className="px-8 py-3 border border-border hover:border-primary/50 rounded-xl font-semibold transition"
            >
              Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-2xl font-bold text-center mb-12">Everything you need</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Clock,
              title: '24/7 Hosting',
              desc: 'Bots stay connected even when your PC is off. Persistent workers on Railway.',
            },
            {
              icon: Shield,
              title: 'Premium & Offline',
              desc: 'Microsoft authenticated accounts and offline-mode profiles for compatible servers.',
            },
            {
              icon: Terminal,
              title: 'Live Console',
              desc: 'Real-time logs, status, and optional chat control via WebSocket.',
            },
            {
              icon: Zap,
              title: 'Auto Reconnect',
              desc: 'Configurable backoff, retry limits, and automatic recovery after disconnects.',
            },
            {
              icon: Users,
              title: 'Multi-Bot',
              desc: 'Manage multiple bots, accounts, and servers from one dashboard.',
            },
            {
              icon: Server,
              title: 'AFK Profiles',
              desc: 'Jump, sneak, look around, or custom movement patterns while connected.',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition"
            >
              <f.icon className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-surface border-y border-border py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">How it works</h2>
          <ol className="space-y-6">
            {[
              'Create a free account',
              'Add a Minecraft identity (Premium or Offline)',
              'Configure a supported server',
              'Set AFK behavior and reconnect options',
              'Start the bot — it runs in the cloud',
              'Monitor status and logs from anywhere',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </span>
                <span className="pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Warning */}
      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="p-6 rounded-2xl border border-warning/30 bg-warning/5">
          <p className="text-sm text-muted">
            <strong className="text-warning">Important:</strong> AFK bots may violate some
            server rules. Only use on servers that explicitly allow automated clients.
            Offline-mode accounts only work on servers that permit offline authentication.
            We do not bypass anti-cheat, CAPTCHAs, or access controls.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted">
          <span>© {new Date().getFullYear()} MineAFK Cloud</span>
          <div className="flex gap-6">
            <Link href="/docs" className="hover:text-white">
              Docs
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
