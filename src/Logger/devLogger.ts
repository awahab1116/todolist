import { createLogger, transports, format } from "winston";
const { timestamp, combine, colorize, printf, errors, simple } = format;

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
    colorize(),
    simple(),
    errors({ stack: true }),
    customFormat
  ),
  transports: [new transports.Console()],
});

export default devLogger;
