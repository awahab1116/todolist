//Starting point of application
import { createConnection } from "typeorm";
import logger from "./Logger";
import app from "./app";
import { connectRedis } from "./helper/redis";

const PORT = process.env.PORT || 9000;
//creating the connection with database and using logger to log the data
createConnection()
  .then(async () => {
    app.listen(PORT, () => {
      logger!.info(`CONNECTED TO DB AND SERVER STARTED ON PORT  ${PORT}`);
    });
    connectRedis();
  })
  .catch((error) => logger!.error("Cannot connect", error));
