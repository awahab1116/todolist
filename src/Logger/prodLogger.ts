// prodLogger.ts
import { createLogger, transports, format } from "winston";
const { timestamp, combine, errors, json, printf } = format;

//format in which we write logs to a file
//@ts-ignore
const customFormat = printf(({ level, message, timestamp, ...metaData }) => {
  return JSON.stringify({ timestamp, level, message, metaData });
});

//prod logger initializing for level above than debug
const prodLogger = createLogger({
  level: "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    json(),
    errors({ stack: true }),
    customFormat
  ),
  //tranport for getting logs in terminal and in files.
  transports: [
    new transports.Console(),
    new transports.File({ filename: "errorProd.log", level: "error" }),
    new transports.File({ filename: "combinedProd.log" }),
  ],
});

export default prodLogger;
