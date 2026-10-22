export const BOT_STATUSES = [
  'CREATED',
  'QUEUED',
  'STARTING',
  'CONNECTING',
  'ONLINE',
  'RECONNECTING',
  'STOPPING',
  'STOPPED',
  'FAILED',
  'AUTH_REQUIRED',
] as const;

export const AFK_ACTIONS = [
  'stand_still',
  'jump',
  'sneak',
  'look_around',
  'slow_rotation',
  'small_move',
] as const;

export const DEFAULT_RECONNECT = {
  initialDelayMs: 5000,
  maxDelayMs: 300000,
  maxRetries: 20,
  backoffMultiplier: 1.5,
};

export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,16}$/;

export const PRIVATE_IP_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^127\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];
