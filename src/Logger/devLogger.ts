import { createLogger, transports, format } from "winston";
const { timestamp, combine, printf, errors, json } = format;

//format in which we write logs to a file
//@ts-ignore
const customFormat = printf(({ level, message, timestamp, ...metaData }) => {
  const formattedMeta =
    Object.keys(metaData).length > 0 ? ` ${JSON.stringify(metaData)}` : "";
  return `${timestamp} [${level}]: ${message} ${formattedMeta}`;
});

//dev logger initializing for level above than debug
const devLogger = createLogger({
  level: "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    //logger extra features
    // colorize(),
    // simple(),
    json(),
    errors({ stack: true }),
    customFormat
  ),
  //tranport for getting logs in terminal and in files.
  transports: [
    new transports.Console(),
    new transports.File({ filename: "errorDev.log", level: "error" }),
    new transports.File({ filename: "combinedDev.log" }),
  ],
});

export default devLogger;
