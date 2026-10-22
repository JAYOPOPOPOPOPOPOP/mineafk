import Link from 'next/link';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background text-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-primary text-sm mb-8 inline-block">← Back</Link>
        <h1 className="text-3xl font-bold mb-6">Documentation</h1>
        <div className="prose prose-invert space-y-6 text-muted">
          <section>
            <h2 className="text-xl font-semibold text-white">Getting started</h2>
            <ol className="list-decimal list-inside space-y-2 mt-2">
              <li>Register an account</li>
              <li>Add an Offline Minecraft account (or configure Microsoft OAuth for Premium)</li>
              <li>Add a server that allows offline mode if using offline accounts</li>
              <li>Create a bot and press Start</li>
              <li>Monitor status and logs from the bot page</li>
            </ol>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">Offline vs Premium</h2>
            <p className="mt-2">
              Offline accounts only work on servers with online-mode=false (or similar).
              Premium accounts require real Microsoft authentication — configure Azure credentials.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-white">Railway tips</h2>
            <p className="mt-2">
              Keep the worker service always running. Free credits are limited.
              Use small concurrency (1–2 bots) on free tier.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
