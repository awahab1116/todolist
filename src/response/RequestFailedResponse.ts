import { Response } from "express";
import logger from "../Logger/index";

export const RequestFailed = (
  res: Response,
  code: number,
  error: string,
  id?: number | string
) => {
  let composeMessage = "";

  if (code === 400) {
    composeMessage = `${error} cannot be null`;
  } else if (code === 404) {
    if (id) {
      composeMessage = `${error} not found with id ${id}`;
    } else {
      composeMessage = `${error} not found`;
    }
  } else if (code === 401 || code === 403) {
    composeMessage = error;
  }
  logger.error(`${composeMessage}`, error);
  res.status(code).json({
    success: false,
    message: composeMessage,
  });
};
