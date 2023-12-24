import * as dotenv from "dotenv";
import fileUpload from "express-fileupload";
import express from "express";
import "reflect-metadata";
import { createConnection } from "typeorm";
import { pagination } from "typeorm-pagination";
// import cron from "node-cron";
// import sendEmailToUsersTasksDueTodayJob from "./helper/cronJob";
import usersRouter from "./routes/UserRoutes";
import taskRouter from "./routes/TaskRoutes";
import reportRouter from "./routes/ReportRoutes";
import logger from "./Logger";
import swaggerUI from "swagger-ui-express";
import YAML from "yamljs";
const swaggerJSDocs = YAML.load("./src/swaggerYaml/api.yaml");
// import passport from "passport";
// import strategy from "passport-facebook";
// const FaceBookStrategy = strategy.Strategy;

dotenv.config();

const PORT = process.env.PORT || 9000;

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerJSDocs));
app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
  })
);

app.use(pagination);

app.use("/user", usersRouter);
app.use("/task", taskRouter);
app.use("/report", reportRouter);
app.get("/", (_, res) => {
  res.status(200).json({
    success: true,
    message: "TodoList Application",
  });
});

// cron.schedule("*/15 * * * * *", sendEmailToUsersTasksDueTodayJob, {
//   scheduled: true,
//   timezone: "Asia/Karachi",
// });

createConnection()
  .then(async () => {
    app.listen(PORT, () => {
      console.log(`CONNECTED TO DB AND SERVER STARTED ON PORT  ${PORT}`);
      logger!.info(`CONNECTED TO DB AND SERVER STARTED ON PORT  ${PORT}`, {
        sessionId: "asdas",
      });
    });
  })
  .catch((error) => logger!.error("Cannot connect", error));
