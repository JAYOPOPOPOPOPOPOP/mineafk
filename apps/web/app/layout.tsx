import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MineAFK Cloud',
  description: 'Your Minecraft. Always Online. Cloud AFK bot hosting platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background">{children}</body>
    </html>
  );
}
