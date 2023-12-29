import * as express from "express";
import {
  createUser,
  getUserById,
  login,
  forgotPassword,
  resetPassword,
} from "../controllers/UserController";
import { Auth } from "./../middlewares/Auth";

//Initializing Express router
let router = express.Router();

//routes for user operations
router.get(``, Auth, getUserById);
router.post(`/create`, createUser);
router.post(`/login`, login);
router.post(`/forgot-password`, forgotPassword);
router.post(`/reset-password`, resetPassword);

export = router;
