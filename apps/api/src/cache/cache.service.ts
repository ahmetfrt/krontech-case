import { Injectable } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class CacheService {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    });

    this.client.connect().catch(() => {
      // ignore startup connection race
    });
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  async set(key: string, value: unknown, ttlSeconds = 300) {
    await this.client.set(key, JSON.stringify(value), {
      EX: ttlSeconds,
    });
  }

  async del(key: string) {
    await this.client.del(key);
  }

  async delByPrefix(prefix: string) {
    const keys: string[] = [];

    for await (const key of this.client.scanIterator({
      MATCH: `${prefix}*`,
      COUNT: 100,
    })) {
      if (Array.isArray(key)) {
        keys.push(...key.map(String));
      } else {
        keys.push(String(key));
      }
    }

    if (keys.length) {
      await this.client.del(keys);
    }
  }
}
