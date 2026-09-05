import type { Server } from 'node:http';

interface RateLimit {
  limit: number;
  windowMs: number;
}

interface RealtimeServer {
  http: Server;
  rooms: Map<string, unknown>;
  listen: () => Promise<void>;
  close: () => Promise<void>;
}

export const RATE_LIMIT_POLICY: {
  health: RateLimit;
  websocket: RateLimit;
};

export function createRealtimeServer(options?: {
  port?: number;
  buildId?: string;
  limits?: { health: RateLimit; websocket: RateLimit };
  isOriginAllowed?: (origin?: string) => boolean;
  now?: () => number;
}): RealtimeServer;
