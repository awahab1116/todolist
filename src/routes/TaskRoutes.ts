import * as express from "express";
import {
  createTask,
  editTask,
  deleteTask,
  viewTasks,
  attachFilesToExistingTask,
  fileDownload,
} from "../controllers/TaskController";
import { Auth } from "./../middlewares/Auth";

let router = express.Router();

router.post("/create", Auth, createTask);
router.put(`/edit`, Auth, editTask);
router.delete(`/delete`, Auth, deleteTask);
router.get(`/view`, Auth, viewTasks);
router.post(`/attach-file-to-task`, Auth, attachFilesToExistingTask);
router.get(`/download-file`, Auth, fileDownload);

export = router;
