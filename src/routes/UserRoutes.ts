import * as express from "express";
import {
  createUser,
  getUserById,
  login,
  forgotPassword,
  resetPassword,
} from "../controllers/UserController";
import { Auth } from "./../middlewares/Auth";

let router = express.Router();

router.get(``, Auth, getUserById);
router.post(`/create`, createUser);
router.post(`/login`, login);
router.post(`/forgot-password`, forgotPassword);
router.post(`/reset-password`, resetPassword);

export = router;
