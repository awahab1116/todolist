import * as express from "express";
import {
  taskSummary,
  countUncompletedTasksOnTime,
  userCompletedTasksAvg,
  maxTasksCompletedDayCount,
  countTasksEachDayWeek,
} from "../controllers/ReportController";
import { Auth } from "./../middlewares/Auth";

//Initializing Express router
let router = express.Router();

//routes for report operations
router.get(`/tasks-summary`, Auth, taskSummary);
router.get(`/not-completed-task-on-time`, Auth, countUncompletedTasksOnTime);
router.get("/user-completed-tasks-avg", Auth, userCompletedTasksAvg);
router.get("/max-tasks-completed", Auth, maxTasksCompletedDayCount);
router.get("/count-task-week", Auth, countTasksEachDayWeek);

export = router;
