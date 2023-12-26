import { createLogger, transports, format } from "winston";
const { timestamp, combine, printf, errors, json } = format;

// const myFormat = printf(({ level, message }) => {
//   return ` ${level} ${message} `;
// });

const customFormat = printf(({ level, message, timestamp, ...metaData }) => {
  const formattedMeta =
    Object.keys(metaData).length > 0 ? ` ${JSON.stringify(metaData)}` : "";
  return `${timestamp} [${level}]: ${message} ${formattedMeta}`;
});

const devLogger = createLogger({
  level: "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    // colorize(),
    // simple(),
    json(),
    errors({ stack: true }),
    customFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "errorDev.log", level: "error" }),
    new transports.File({ filename: "combinedDev.log" }),
  ],
});

export default devLogger;
