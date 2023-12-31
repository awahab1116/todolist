//Main index of logger which selects which logger to use based on environment
import * as dotenv from "dotenv";
import devLogger from "./devLogger";
import prodLogger from "./prodLogger";
import { Logger } from "winston";
dotenv.config();

let logger: Logger =
  process.env.NODE_ENV === "production" ? prodLogger : devLogger;

export default logger;
