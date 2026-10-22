export type BotStatus =
  | 'CREATED'
  | 'QUEUED'
  | 'STARTING'
  | 'CONNECTING'
  | 'ONLINE'
  | 'RECONNECTING'
  | 'STOPPING'
  | 'STOPPED'
  | 'FAILED'
  | 'AUTH_REQUIRED';

export type AccountType = 'PREMIUM' | 'OFFLINE';

export interface BotConfigPayload {
  name: string;
  accountId: string;
  serverId: string;
  afkProfileId?: string;
  autoReconnect?: boolean;
  autoStart?: boolean;
  reconnectDelayMs?: number;
  maxReconnects?: number;
}

export interface ServerConfigPayload {
  displayName: string;
  host: string;
  port?: number;
  version?: string;
  authMode?: 'online' | 'offline';
  description?: string;
}

export interface OfflineAccountPayload {
  username: string;
  label?: string;
  description?: string;
}

export interface AFKAction {
  type: 'jump' | 'sneak' | 'look' | 'move' | 'stand';
  intervalMs: number;
  enabled: boolean;
}

export interface WorkerCommand {
  type: 'start' | 'stop' | 'restart' | 'chat' | 'update_afk';
  botId: string;
  payload?: Record<string, unknown>;
}

export interface WorkerEvent {
  type: 'status' | 'log' | 'ping' | 'chat' | 'error';
  botId: string;
  data: Record<string, unknown>;
  timestamp: string;
}
