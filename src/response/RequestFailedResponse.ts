import { Response } from "express";
import logger from "../Logger/index";

//Function to send response to user if request failed while logging the error in file
export const RequestFailed = (
  res: Response,
  code: number,
  errorMsg: string,
  endpoint?: string,
  reqData?: object
) => {
  /*
 Previous approach but changed it due to logging the errors in file
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
  */
  logger.error(`${endpoint}: ${errorMsg}`, reqData);
  res.status(code).json({
    success: false,
    message: errorMsg,
  });
};
