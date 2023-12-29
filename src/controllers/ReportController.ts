import { Task } from "../entity/Task";
import { User } from "../entity/User";
import { InternalServerError } from "../response/InternalServerErrorResponse";
import { RequestFailed } from "../response/RequestFailedResponse";
import { Response } from "express";
import { AuthRequest } from "../middlewares/AuthRequestContext";
import { getConnection } from "typeorm";
import logger from "../Logger";

export const taskSummary = async (req: AuthRequest, res: Response) => {
  try {
    logger!.info(req.originalUrl, {
      userId: req.userId,
    });
    const userId = req.userId;

    //to get count of user tasks
    const totalTasks = await getConnection()
      .getRepository(Task)
      .createQueryBuilder("task")
      .where("task.userId = :userId", { userId })
      .getCount();

    //to get count of user completed tasks
    const completedTasks = await getConnection()
      .getRepository(Task)
      .createQueryBuilder("task")
      .where(
        "task.userId = :userId AND task.completionStatus = :completionStatus",
        {
          completionStatus: true,
          userId,
        }
      )
      .getCount();

    //to get count of user not completed tasks
    const remainingTasks = await getConnection()
      .getRepository(Task)
      .createQueryBuilder("task")
      .where(
        "task.userId = :userId AND task.completionStatus = :completionStatus",
        {
          completionStatus: false,
          userId,
        }
      )
      .getCount();

    return res.status(200).send({
      success: true,
      totalTasks,
      completedTasks,
      remainingTasks,
    });
  } catch (error) {
    return InternalServerError(res, error, req.originalUrl);
  }
};

export const userCompletedTasksAvg = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    logger!.info(req.originalUrl, {
      userId: req.userId,
    });
    const userId = req.userId;
    const todayDate = new Date();

    const user = await User.findOne({
      where: {
        id: userId,
      },
    });

    if (user) {
      //calculating how many days passed since user created the account
      const timeDifference: number =
        todayDate.getTime() - user.createdAt.getTime();
      const noDays: number = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

      const completedTasks = await getConnection()
        .getRepository(Task)
        .createQueryBuilder("task")
        .where(
          "task.userId = :userId AND task.completionStatus = :completionStatus",
          {
            completionStatus: true,
            userId,
          }
        )
        .getCount();

      //Calculting average of completed tasks
      const avgTasksCompleted = completedTasks
        ? (completedTasks / noDays).toFixed(2)
        : 0;

      return res.status(200).send({
        success: true,
        avgTasksCompleted,
      });
    } else {
      return RequestFailed(res, 404, "User not found ", req.originalUrl, {
        userId: req.userId,
      });
    }
  } catch (error) {
    return InternalServerError(res, error, req.originalUrl);
  }
};

export const countUncompletedTasksOnTime = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    logger!.info(req.originalUrl, {
      userId: req.userId,
    });
    const userId = req.userId;
    let record = await getConnection()
      .getRepository(Task)
      .createQueryBuilder("task")
      .where("task.userId = :userId", { userId })
      .andWhere("DATE(task.completionDateTime) > DATE(task.dueDateTime)")
      .getCount();

    return res.status(200).send({
      success: true,
      record,
    });
  } catch (error) {
    return InternalServerError(res, error, req.originalUrl);
  }
};

export const maxTasksCompletedDayCount = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    logger!.info(req.originalUrl, {
      userId: req.userId,
    });
    const userId = req.userId;
    const result = await getConnection()
      .getRepository(Task)
      .createQueryBuilder("task")
      .where("task.userId = :userId", {
        userId,
      })
      .select("MAX(task.completionDateTime)", "maximumCompletedTasksDate")
      .getRawOne();

    return res.status(200).send({
      success: true,
      result,
    });
  } catch (error) {
    return InternalServerError(res, error, req.originalUrl);
  }
};

export const countTasksEachDayWeek = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    logger!.info(req.originalUrl, {
      userId: req.userId,
    });
    const userId = req.userId;

    //dayName gives us name of day like mon,tues
    const taskData = await getConnection()
      .getRepository(Task)
      .createQueryBuilder("task")
      .select([
        "DAYNAME(task.creationDateTime) AS dayOfWeek",
        "DATE(task.creationDateTime) AS creationDate",
        "COUNT(*) AS openedTasks",
      ])
      .where("task.userId = :userId", { userId })
      .groupBy("dayOfWeek,creationDate")
      .getRawMany();

    return res.status(200).send({
      success: true,
      taskData,
    });
  } catch (error) {
    return InternalServerError(res, error, req.originalUrl);
  }
};
