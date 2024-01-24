import { createClient } from "redis";
import logger from "../Logger";
const redisClient = createClient();

const connectRedis = () => {
  try {
    redisClient.on("error", (err) => console.log("Redis Client Error", err));

    redisClient.connect().then(() => {
      logger!.info(`REDIS CONNECTED`);
    });
  } catch (err) {
    logger!.info(`REDIS NOT CONNECTED`);
  }
};

async function getCache(key: string) {
  try {
    const cacheData = await redisClient.get(key);

    return cacheData ? JSON.parse(cacheData) : cacheData;
  } catch (err) {
    logger!.info(`Cannot get cached data of key:${key}`);
    return null;
  }
}

async function setCache(key: string, data: any) {
  try {
    await redisClient.set(key, JSON.stringify(data), { EX: 60 * 60 * 24 });
  } catch (err) {
    logger!.info(`Cannot set cached data of key:${key}`);
  }
}

async function removeCache(key: string) {
  try {
    await redisClient.del(key);
  } catch (err) {
    logger!.info(`Cannot remove cached data of key:${key}`);
  }
}

export { redisClient, connectRedis, getCache, setCache, removeCache };
