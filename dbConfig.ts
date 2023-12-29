// dbconfig.ts
import { User } from "./src/entity/User";
import { Task } from "./src/entity/Task";
import { MYFile } from "./src/entity/MyFile";

export const dbConfig = {
  type: process.env.NODE_DB_TYPE,
  host: process.env.NODE_DB_HOST,
  port: process.env.NODE_DB_PORT,
  username: process.env.NODE_DB_USERNAME,
  password: process.env.NODE_DB_PASSWORD,
  database: process.env.NODE_DB_TEST,
  synchronize: true,
  logging: false,
  ssl: {
    rejectUnauthorized: false,
  },
  entities: [User, Task, MYFile],
};
