import { Response } from "express";
import logger from "../Logger/index";

export const InternalServerError = (res: Response, error: any) => {
  if (error.code === "ER_DUP_ENTRY") {
    logger.error("Duplicate Entry in Database ", error);
    res.status(409).json({
      success: false,
      message: error.sqlMessage,
    });
  } else {
    logger.error("Server error ", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
