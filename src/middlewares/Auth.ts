import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { RequestFailed } from "../response/RequestFailedResponse";
import { InternalServerError } from "../response/InternalServerErrorResponse";
import { AuthRequest } from "./AuthRequestContext";

interface JWT_DECODE {
  id: number;
  username: string;
  iat: number;
  exp: number;
}

//Middleware for requests which require token,it checks if provided or not and also verifys it
export const Auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return RequestFailed(
        res,
        401,
        "Unauthorized / no token found",
        req.originalUrl,
        {}
      );
    } else {
      const data = jwt.verify(token, process.env.TOKEN_SECRET!) as JWT_DECODE;
      req.userId = data.id;
      next();
    }
  } catch (error) {
    return InternalServerError(res, error, req.originalUrl);
  }
};
