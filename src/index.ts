import * as dotenv from "dotenv";
import fileUpload from "express-fileupload";
import express from "express";
import "reflect-metadata";
import { createConnection } from "typeorm";
import { pagination } from "typeorm-pagination";
import usersRouter from "./routes/UserRoutes";
import taskRouter from "./routes/TaskRoutes";
import reportRouter from "./routes/ReportRoutes";

dotenv.config();

const PORT = process.env.PORT || 9000;

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
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
    message:
      "You are on node-typescript-boilderplate. You should not have further access from here.",
  });
});

createConnection()
  .then(async () => {
    app.listen(PORT, () => {
      console.log(`CONNECTED TO DB AND SERVER STARTED ON PORT  ${PORT}`);
    });
  })
  .catch((error) => console.log(error));
