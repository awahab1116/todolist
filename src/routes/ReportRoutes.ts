import * as express from "express";
import {
  taskSummary,
  countUncompletedTasksOnTime,
  userComplatedTasksAvg,
  maxTasksCompletedDayCount,
  countTasksEachDayWeek,
} from "../controllers/ReportController";
import { Auth } from "./../middlewares/Auth";

let router = express.Router();

router.get(`/tasks-summary`, Auth, taskSummary);
router.get(`/not-completed-task-on-time`, Auth, countUncompletedTasksOnTime);
router.get("/user-completed-tasks-avg", Auth, userComplatedTasksAvg);
router.get("/max-tasks-completed", Auth, maxTasksCompletedDayCount);
router.get("/count-task-week", Auth, countTasksEachDayWeek);

export = router;
