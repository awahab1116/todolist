import * as express from "express";
import { createUser, getUserById, login } from "../controllers/UserController";
import { Auth } from "./../middlewares/Auth";

let router = express.Router();

router.get(``, Auth, getUserById);
router.post(`/create`, createUser);
router.post(`/login`, login);

export = router;
