import IORedis from "ioredis";

let redisConnection: IORedis | null = null;

export function getRedisConnection() {
  if (redisConnection) {
    return redisConnection;
  }

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("Missing REDIS_URL");
  }

  redisConnection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });

  return redisConnection;
}
