import * as express from "express";
import {
  createTask,
  editTask,
  deleteTask,
  viewTasks,
  attachFilesToExistingTask,
  fileDownload,
  similarTasks,
} from "../controllers/TaskController";
import { Auth } from "./../middlewares/Auth";

//Initializing Express router
let router = express.Router();

//routes for task operations
router.post("/create", Auth, createTask);
router.put(`/edit`, Auth, editTask);
router.delete(`/delete`, Auth, deleteTask);
router.get(`/view`, Auth, viewTasks);
router.post(`/attach-file-to-task`, Auth, attachFilesToExistingTask);
router.get(`/download-file`, Auth, fileDownload);
router.get(`/similar-tasks`, Auth, similarTasks);

export = router;
