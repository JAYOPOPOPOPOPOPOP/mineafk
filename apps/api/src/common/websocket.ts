import { SocketStream } from '@fastify/websocket';
import { FastifyRequest } from 'fastify';
import { verifyToken } from './auth';

// Simple in-memory map of botId -> set of sockets (for Railway single instance)
// For multi-instance use Redis pub/sub
const botSubscribers = new Map<string, Set<any>>();

export function broadcastToBot(botId: string, data: any) {
  const subs = botSubscribers.get(botId);
  if (!subs) return;
  const msg = JSON.stringify(data);
  for (const ws of subs) {
    try {
      ws.send(msg);
    } catch {}
  }
}

export async function wsHandler(connection: SocketStream, req: FastifyRequest) {
  const ws = connection.socket;

  // Auth via query token
  const url = new URL(req.url, 'http://localhost');
  const token = url.searchParams.get('token');
  const botId = url.searchParams.get('botId');

  if (!token || !botId) {
    ws.close(4001, 'Missing token or botId');
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    ws.close(4001, 'Invalid token');
    return;
  }

  // Subscribe
  if (!botSubscribers.has(botId)) {
    botSubscribers.set(botId, new Set());
  }
  botSubscribers.get(botId)!.add(ws);

  ws.send(JSON.stringify({ type: 'connected', botId }));

  ws.on('close', () => {
    botSubscribers.get(botId)?.delete(ws);
  });

  ws.on('message', (raw) => {
    // Optional: handle chat commands from client (rate-limited in real impl)
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch {}
  });
}
