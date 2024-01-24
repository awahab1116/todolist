// dbconfig.ts
import "reflect-metadata";
import { DataSource } from "typeorm";
import { DB_TYPE } from "./helper/constants";
import * as dotenv from "dotenv";
dotenv.config();

const AppDataSource = new DataSource({
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
  synchronize: false,
  entities: ["src/entity/**/*.ts"],
  migrations: ["src/migration/**/*.ts"],
  logging: false,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default AppDataSource;
