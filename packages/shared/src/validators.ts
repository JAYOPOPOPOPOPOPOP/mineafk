import { z } from 'zod';
import { USERNAME_REGEX, PRIVATE_IP_RANGES } from './constants';

export const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number'),
  displayName: z.string().min(2).max(50).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const offlineAccountSchema = z.object({
  username: z
    .string()
    .regex(USERNAME_REGEX, 'Minecraft username must be 3-16 chars (a-z, 0-9, _)'),
  label: z.string().max(50).optional(),
  description: z.string().max(200).optional(),
});

export const serverSchema = z.object({
  displayName: z.string().min(1).max(50),
  host: z
    .string()
    .min(1)
    .max(255)
    .refine(
      (host) => {
        // Block private/internal IPs
        if (PRIVATE_IP_RANGES.some((r) => r.test(host))) return false;
        // Basic hostname / IP validation
        return /^[a-zA-Z0-9.-]+$/.test(host) || /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
      },
      { message: 'Invalid or private host address not allowed' }
    ),
  port: z.number().int().min(1).max(65535).default(25565),
  version: z.string().default('1.20.4'),
  authMode: z.enum(['online', 'offline']).default('online'),
  description: z.string().max(300).optional(),
});

export const botSchema = z.object({
  name: z.string().min(1).max(50),
  accountId: z.string().cuid(),
  serverId: z.string().cuid(),
  afkProfileId: z.string().cuid().optional(),
  autoReconnect: z.boolean().default(true),
  autoStart: z.boolean().default(false),
  reconnectDelayMs: z.number().int().min(1000).max(600000).default(5000),
  maxReconnects: z.number().int().min(0).max(100).default(20),
});

export const afkProfileSchema = z.object({
  name: z.string().min(1).max(50),
  actions: z
    .array(
      z.object({
        type: z.enum(['jump', 'sneak', 'look', 'move', 'stand']),
        intervalMs: z.number().int().min(5000).max(300000),
        enabled: z.boolean(),
      })
    )
    .min(1),
  intervalMs: z.number().int().min(5000).max(300000).default(30000),
  durationMs: z.number().int().positive().optional(),
  isDefault: z.boolean().default(false),
});

export const scheduleSchema = z.object({
  botId: z.string().cuid(),
  action: z.enum(['start', 'stop', 'restart']),
  cron: z.string().min(1),
  timezone: z.string().default('UTC'),
  enabled: z.boolean().default(true),
});
