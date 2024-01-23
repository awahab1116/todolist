import { Task } from "../entity/Task";
import { User } from "../entity/User";
import { MYFile } from "../entity/MyFile";
import { InternalServerError } from "../response/InternalServerErrorResponse";
import { RequestFailed } from "../response/RequestFailedResponse";
import { classToPlain } from "class-transformer";
import { Response } from "express";
import { AuthRequest } from "../middlewares/AuthRequestContext";
import { getConnection } from "typeorm";
import { IsDateValid } from "../helper/isDateValid";
import archiver from "archiver";
import logger from "../Logger";
import { getCache, setCache, removeCache } from "../helper/redis";
import { REDIS_VIEW_TASKS_KEY } from "../helper/constants";

interface FileData {
  name: string;
  data: Buffer;
  mimetype: string;
}

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    //request body and which user call this endpoint userId
    //will use this for loggin that data to file
    let loggerData = {
      userId: req.userId,
      requestBody: req.body,
    };
    logger!.info(req.originalUrl, loggerData);

    //Data provided from user
    const title: string = req.body.title;
    const description: string = req.body.description || "";
    const completionStatus: boolean =
      req.body.completionStatus === "true" ? true : false;
    const dueDateTime = req.body.dueDateTime;
    const creationDateTime = new Date();
    let fileAttachments = req?.files?.fileAttachments;

    //If title provided or not
    if (!title || !title.length) {
      return RequestFailed(
        res,
        400,
        "title cannot be empty/null",
        req.originalUrl,
        loggerData
      );
    }

    //if due Date provided or not
    if (!dueDateTime || !dueDateTime.length || !IsDateValid(dueDateTime)) {
      return RequestFailed(
        res,
        400,
        "dueDate cannot be Invalid/null",
        req.originalUrl,
        loggerData
      );
    }

    const user = await User.findOne({
      where: { id: req.userId },
    });

    if (user) {
      const task = new Task();
      task.title = title;
      task.description = description;
      task.dueDateTime = dueDateTime;
      task.creationDateTime = creationDateTime;
      task.completionStatus = completionStatus ? completionStatus : false;
      task.user = user;

      //if completion status is true then adding the creation Date
      if (completionStatus) {
        task.completionDateTime = new Date();
      }

      await task.save();

      const taskResponse = classToPlain(task);

      //If user provided files with its task
      if (fileAttachments) {
        //checking if one file provided make an array which has one element
        //because req.file gives object when one file added and array if more than one file
        fileAttachments = Array.isArray(fileAttachments)
          ? fileAttachments
          : [fileAttachments];
        const repo = getConnection().getRepository(MYFile);

        //Storing multiple files in a database
        const filePromises = fileAttachments.map(async (file: FileData) => {
          var newFile = new MYFile();
          newFile.name = file.name;
          newFile.data = file.data.toString("base64");
          newFile.mimeType = file.mimetype;
          newFile.task = task;

          await repo.save(newFile);
        });

        await Promise.all(filePromises);
      }

      removeCache(REDIS_VIEW_TASKS_KEY);

      return res.status(200).json({
        success: true,
        task: taskResponse,
      });
    } else {
      return RequestFailed(
        res,
        400,
        "UserId not found/invalid",
        req.originalUrl,
        loggerData
      );
    }
  } catch (error) {
    return InternalServerError(res, error, req.originalUrl);
  }
};

export const editTask = async (req: AuthRequest, res: Response) => {
  try {
    //request body and which user call this endpoint userId
    //will use this for loggin that data to file
    let loggerData = {
      userId: req.userId,
      taskId: req.query.taskId,
      requestBody: req.body,
    };
    logger!.info(req.originalUrl, loggerData);

    const taskId = req?.query?.taskId;

    //if TaskId not provided
    if (!taskId) {
      return RequestFailed(
        res,
        404,
        "TaskId not provided",
        req.originalUrl,
        loggerData
      );
    }

    //If due Date provided is valid or not
    if (!IsDateValid(req.body.dueDateTime) && req?.body?.dueDateTime) {
      return RequestFailed(
        res,
        400,
        "dueDate cannot be Invalid",
        req.originalUrl,
        loggerData
      );
    }

    const title = req.body.title;
    const description = req.body.description;
    const completionStatus = req.body.completionStatus;
    const dueDateTime = req.body.dueDateTime;

    const task = await Task.findOne({
      where: {
        id: taskId,
        user: {
          id: req.userId,
        },
      },
    });

    if (task) {
      //If taskId valid now updating the task on the basis of parameters provided by user
      const updatedTask = await getConnection()
        .createQueryBuilder()
        .update(Task)
        .set({
          title: title ? title : task?.title,
          description: description ? description : task?.description,
          completionStatus:
            completionStatus !== undefined
              ? completionStatus
              : task?.completionStatus,
          completionDateTime:
            completionStatus === false ? undefined : new Date(),
          dueDateTime: dueDateTime ? dueDateTime : task.dueDateTime,
        })
        .where("id = :id", { id: taskId })
        .execute();

      if (updatedTask?.affected) {
        removeCache(REDIS_VIEW_TASKS_KEY);

        return res.status(200).send({
          success: true,
          message: "Task updated successfully",
        });
      } else {
        return RequestFailed(
          res,
          200,
          "Cannot update task",
          req.originalUrl,
          loggerData
        );
      }
    } else {
      return RequestFailed(
        res,
        400,
        "Task not found/Invalid TaskId",
        req.originalUrl,
        loggerData
      );
    }
  } catch (error) {
    return InternalServerError(res, error, req.originalUrl);
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    //request body and which user call this endpoint userId
    //will use this for loggin that data to file
    let loggedData = {
      userId: req.userId,
      taskId: req.query.taskId,
    };
    logger!.info(req.originalUrl, loggedData);
    const taskId = req.query.taskId;
    if (!taskId) {
      return RequestFailed(
        res,
        404,
        "TaskId not provided",
        req.originalUrl,
        loggedData
      );
    }

    const task = await Task.findOne({
      where: {
        id: taskId,
        user: {
          id: req.userId,
        },
      },
    });

    if (task) {
      //if task found firstly we are deleting all its files and then task itself
      await getConnection()
        .createQueryBuilder()
        .delete()
        .from(MYFile)
        .where("taskId = :taskId", {
          taskId,
        })
        .execute();

      const isTaskDeleted = await getConnection()
        .createQueryBuilder()
        .delete()
        .from(Task)
        .where("id = :id AND userId = :userId", {
          id: taskId,
          userId: req.userId,
        })
        .execute();

      if (isTaskDeleted?.affected) {
        removeCache(REDIS_VIEW_TASKS_KEY);
        return res.status(200).send({
          success: true,
          message: "Task successfully deleted",
        });
      } else {
        return RequestFailed(
          res,
          400,
          "Cannot delete task and its files",
          req.originalUrl,
          loggedData
        );
      }
    } else {
      return RequestFailed(
        res,
        400,
        "Task not found/Invalid TaskId",
        req.originalUrl,
        loggedData
      );
    }
  } catch (error) {
    return InternalServerError(res, error, req.originalUrl);
  }
};

export const viewTasks = async (req: AuthRequest, res: Response) => {
  try {
    let loggedData = {
      userId: req.userId,
    };
    logger!.info(req.originalUrl, loggedData);

    let tasks;
    tasks = await getCache(REDIS_VIEW_TASKS_KEY);

    if (!tasks) {
      //getting data from database of tasks
      tasks = await getConnection()
        .getRepository(Task)
        .createQueryBuilder("task")
        .leftJoinAndSelect(MYFile, "file", "file.taskId = task.id")
        .where("userId = :userId", {
          userId: req.userId,
        })
        .getMany();

      setCache(REDIS_VIEW_TASKS_KEY, tasks);
    }

    return res.status(200).send({
      success: true,
      tasks,
    });
  } catch (error) {
    return InternalServerError(res, error, req.originalUrl);
  }
};

export const attachFilesToExistingTask = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    let loggedData = {
      userId: req.userId,
      taskId: req.query.taskId,
    };
    logger!.info(req.originalUrl, loggedData);

    let fileAttachments = req?.files?.fileAttachments;
    const taskId = req?.query?.taskId;

    if (!fileAttachments) {
      return RequestFailed(
        res,
        400,
        "No file was uploaded",
        req.originalUrl,
        loggedData
      );
    }

    const task = await Task.findOne({
      where: {
        id: taskId,
        user: {
          id: req.userId,
        },
      },
    });

    if (task) {
      fileAttachments = Array.isArray(fileAttachments)
        ? fileAttachments
        : [fileAttachments];
      const repo = getConnection().getRepository(MYFile);

      const filePromises = fileAttachments.map(async (file: FileData) => {
        var newFile = new MYFile();
        newFile.name = file.name;
        newFile.data = file.data.toString("base64");
        newFile.mimeType = file.mimetype;
        newFile.task = task;

        await repo.save(newFile);
      });

      await Promise.all(filePromises);
      return res.status(200).send({
        success: true,
        message: "Files attached to a existing task",
      });
    } else {
      return RequestFailed(
        res,
        400,
        "Cannot attach files to this task/TaskId is invalid",
        req.originalUrl,
        loggedData
      );
    }
  } catch (error) {
    return InternalServerError(res, error, req.originalUrl);
  }
};

//@ts-ignore
export const fileDownload = async (req: AuthRequest, res: Response) => {
  try {
    let loggedData = {
      userId: req.userId,
      taskId: req.query.taskId,
    };
    logger!.info(req.originalUrl, loggedData);
    const taskId = req.query.taskId as string;

    if (!taskId) {
      return RequestFailed(
        res,
        400,
        "Task ID is required in query parameters",
        req.originalUrl,
        loggedData
      );
    }

    const task = await Task.findOne({
      where: {
        id: taskId,
        user: {
          id: req.userId,
        },
      },
    });

    if (task) {
      const files = await getConnection()
        .getRepository(MYFile)
        .createQueryBuilder("MYFile")
        .where("taskId = :taskId", {
          taskId,
        })
        .getMany();

      if (files.length === 0) {
        return RequestFailed(
          res,
          404,
          "No files found for the specified Task",
          req.originalUrl,
          loggedData
        );
      }

      //Initialzing the zrchiever
      const archive = archiver("zip");

      //setting content type to zip file and name of zip file
      res.writeHead(200, {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=files_${taskId}.zip`,
      });

      // Create a zip archive and pipe it to the response object
      archive.pipe(res);

      // Iterate through each file and append its data to the archive
      files.forEach((file) => {
        archive.append(Buffer.from(file.data, "base64"), { name: file.name });
      });

      // Finalize the archive
      archive.finalize();

      // Event handler: when the archive is finished, end the response
      //if not end the response then app crashed gives response header cannot be set
      archive.on("finish", () => {
        res.end();
      });
    } else {
      return RequestFailed(
        res,
        400,
        "Task not found/Invalid TaskId",
        req.originalUrl,
        loggedData
      );
    }
  } catch (error) {
    res.status(500).send("Internal Server Error");
    res.end();
  }
};

export const similarTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    logger!.info(req.originalUrl, {
      userId: req.userId,
    });

    //i have used a subquery which checks if parent query row title exists in all other
    //tasks of that user.I have used a position function which checks if substring exists
    //in a string or not
    const tasks = await getConnection()
      .getRepository(Task)
      .createQueryBuilder("task")
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select("t2.id")
          .from(Task, "t2")
          .where("POSITION(task.title IN t2.title) > 0")
          .andWhere("t2.id != task.id")
          .andWhere("t2.userId = :userId", { userId })
          .getQuery();

        return `EXISTS (${subQuery})`;
      })
      .andWhere("task.userId = :userId", { userId })
      .setParameter("userId", userId)
      .getMany();

    return res.status(200).send({
      success: true,
      tasks,
    });
  } catch (error) {
    return InternalServerError(res, error, req.originalUrl);
  }
};

//It only gives exact match of string
// const tasks = await getConnection()
//   .getRepository(Task)
//   .createQueryBuilder("task")
//   .where((qb) => {
//     const subQuery = qb
//       .subQuery()
//       .select("title")
//       .from(Task, "subTask")
//       .groupBy("title")
//       .having("COUNT(title) > 1")
//       .getQuery();
//     return `task.title IN ${subQuery}`;
//   })
//   .getMany();

//Tried using Like but it doesn't work
// const tasks = await getConnection()
//   .getRepository(Task)
//   .createQueryBuilder("task")
//   .where((qb) => {
//     const subQuery = qb
//       .subQuery()
//       .select("1")
//       .from(Task, "subTask")
//       .where("task.title LIKE CONCAT('%', subTask.title, '%')")
//       .getQuery();

//     return `EXISTS (${subQuery})`;
//   })
//   .getMany();
