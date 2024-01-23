//Starting point of application

import { AppDataSource } from "./dataSource";
import logger from "./Logger";
import app from "./app";
import { connectRedis } from "./helper/redis";

const PORT = process.env.PORT || 9000;
//creating the connection with database and using logger to log the data
AppDataSource.initialize()
  .then(async () => {
    app.listen(PORT, () => {
      logger!.info(`CONNECTED TO DB AND SERVER STARTED ON PORT  ${PORT}`);
    });
    connectRedis();
  })
  .catch((error) => logger!.error("Cannot connect", error));
