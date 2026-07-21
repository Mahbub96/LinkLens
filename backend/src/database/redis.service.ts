import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  public readonly client: Redis;

  constructor(private config: ConfigService) {
    this.client = new Redis(this.config.get<string>('REDIS_URL', 'redis://localhost:6379'));
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  // ─── Link Cache (Hot Path) ───

  /** Cache a link's routing data in Redis for ultra-fast lookups. */
  async cacheLink(domain: string, slug: string, data: Record<string, any>): Promise<void> {
    const key = `link:${domain}:${slug}`;
    await this.client.set(key, JSON.stringify(data), 'EX', 3600); // 1 hour TTL
  }

  /** Retrieve cached link data. Returns null on miss. */
  async getCachedLink(domain: string, slug: string): Promise<Record<string, any> | null> {
    const key = `link:${domain}:${slug}`;
    const raw = await this.client.get(key);
    return raw ? JSON.parse(raw) : null;
  }

  /** Invalidate a link's cache entry. */
  async invalidateLink(domain: string, slug: string): Promise<void> {
    await this.client.del(`link:${domain}:${slug}`);
  }

  // ─── Rate Limiting (Token Bucket) ───

  /** Simple sliding-window rate limiter. Returns remaining requests. */
  async checkRateLimit(key: string, limit: number, windowSec: number): Promise<{ allowed: boolean; remaining: number }> {
    const redisKey = `rl:${key}`;
    const current = await this.client.incr(redisKey);
    if (current === 1) {
      await this.client.expire(redisKey, windowSec);
    }
    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
    };
  }

  // ─── Generic Helpers ───

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /** Publish to a Redis pub/sub channel (for real-time feeds). */
  async publish(channel: string, message: string): Promise<void> {
    await this.client.publish(channel, message);
  }
}
