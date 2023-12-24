import { Task } from "../entity/Task";
import { User } from "../entity/User";
import { InternalServerError } from "../response/InternalServerErrorResponse";
import { RequestFailed } from "../response/RequestFailedResponse";
import { Response } from "express";
import { AuthRequest } from "../middlewares/AuthRequestContext";
import { getConnection } from "typeorm";

export const taskSummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    console.log("req is ", req.userId);

    const totalTasks = await getConnection()
      .getRepository(Task)
      .createQueryBuilder("task")
      .where("task.userId = :userId", { userId })
      .getCount();

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

    res.status(202).send({
      success: true,
      totalTasks,
      completedTasks,
      remainingTasks,
    });
  } catch (error) {
    return InternalServerError(res, error);
  }
};

export const userComplatedTasksAvg = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.userId;
    const todayDate = new Date();

    const user = await User.findOne({
      where: {
        id: userId,
      },
    });

    if (user) {
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

      const avgTasksCompleted = completedTasks
        ? (completedTasks / noDays).toFixed(2)
        : 0;

      return res.status(202).send({
        success: true,
        avgTasksCompleted,
      });
    } else {
      return RequestFailed(res, 404, "user");
    }
  } catch (error) {
    return InternalServerError(res, error);
  }
};

export const countUncompletedTasksOnTime = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.userId;
    let record = await getConnection()
      .getRepository(Task)
      .createQueryBuilder("task")
      .where("task.userId = :userId", { userId })
      .andWhere("DATE(task.completionDateTime) > DATE(task.dueDateTime)")
      .getCount();

    console.log("DueDate Time is ", record);

    res.status(202).send({
      success: true,
      record,
    });
  } catch (error) {
    return InternalServerError(res, error);
  }
};

export const maxTasksCompletedDayCount = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.userId;
    const result = await getConnection()
      .getRepository(Task)
      .createQueryBuilder("task")
      .where("task.userId = :userId", {
        userId,
      })
      .select("MAX(task.completionDateTime)", "maximumCompletedTasksDate")
      .getRawOne();

    return res.status(202).send({
      success: true,
      result,
    });
  } catch (error) {
    return InternalServerError(res, error);
  }
};

export const countTasksEachDayWeek = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.userId;
    const results = await getConnection()
      .getRepository(Task)
      .createQueryBuilder("task")
      .select("DATE(task.creationDateTime) as creationDate")
      .addSelect("COUNT(task.id) as taskCount")
      .where("task.userId = :userId", { userId })
      .groupBy("creationDate")
      .getRawMany();

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

    return res.status(202).send({
      success: true,
      results,
      taskData,
    });
  } catch (error) {
    return InternalServerError(res, error);
  }
};
