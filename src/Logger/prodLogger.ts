// prodLogger.ts
import { createLogger, transports, format } from "winston";
const { timestamp, combine, errors, json, printf } = format;

const customFormat = printf(({ level, message, timestamp, ...metaData }) => {
  return JSON.stringify({ timestamp, level, message, metaData });
});

const prodLogger = createLogger({
  level: "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    json(),
    errors({ stack: true }),
    customFormat // Use custom format for logs
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "error.log", level: "error" }),
    new transports.File({ filename: "combined.log" }),
  ],
});

export default prodLogger;
