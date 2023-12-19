import * as express from "express";
import {createTask} from "../controllers/TaskController"
import { Auth } from "./../middlewares/Auth";

let router = express.Router();

router.post("/create", Auth,createTask);


export = router;
