// dbconfig.ts
import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entity/User";
import { Task } from "./entity/Task";
import { MYFile } from "./entity/MyFile";
import { DB_TYPE } from "./helper/constants";
import * as dotenv from "dotenv";
dotenv.config();

export const AppDataSource = new DataSource({
  type: DB_TYPE,
  host: process.env.NODE_DB_HOST,
  port: process.env.NODE_DB_PORT
    ? parseInt(process.env.NODE_DB_PORT, 10)
    : undefined,
  username: process.env.NODE_DB_USERNAME,
  password: process.env.NODE_DB_PASSWORD,
  database:
    process.env.NODE_ENV === "development"
      ? process.env.NODE_DB_DEV
      : process.env.NODE_DB_TEST,
  synchronize: true,
  logging: false,
  ssl: {
    rejectUnauthorized: false,
  },
  entities: [User, Task, MYFile],
});
