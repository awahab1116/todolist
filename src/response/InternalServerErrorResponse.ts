import { Response } from "express";
import logger from "../Logger/index";

export const InternalServerError = (
  res: Response,
  error: any,
  endpoint?: string
) => {
  //If there is duplicate entry like creating account with email of already created account
  if (error.code === "ER_DUP_ENTRY") {
    logger.error(`${endpoint} Duplicate Entry in Database `, error);
    res.status(409).send({
      success: false,
      message: error.sqlMessage,
    });
  } else {
    //Response for Internal Server Error
    logger.error(`${endpoint} Server error `, error);
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};
