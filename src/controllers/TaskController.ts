import { Task } from "../entity/Task";
import { User } from "../entity/User";
import { MYFile } from "../entity/MyFile";
import { InternalServerError } from "../response/InternalServerErrorResponse";
import { RequestFailed } from "../response/RequestFailedResponse";
import { classToPlain } from "class-transformer";
import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/AuthRequestContext";
import { getConnection } from "typeorm";
import archiver from "archiver";

interface FileData {
  name: string;
  data: Buffer;
  mimetype: string;
}

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    console.log("req body ", req.body);
    const title: string = req.body.title;
    const description: string = req.body.description;
    const completionStatus: boolean = !!req.body.completionStatus;
    const dueDateTime = req.body.dueDateTime;
    const creationDateTime = new Date();
    let fileAttachments = req?.files?.fileAttachments;

    if (!title || !title.length) {
      return RequestFailed(res, 400, "title");
    }
    if (!description || !description.length) {
      return RequestFailed(res, 400, "description");
    }
    if (!dueDateTime || !dueDateTime.length) {
      return RequestFailed(res, 400, "dueDate");
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

      if (completionStatus) {
        console.log("Here ", typeof completionStatus);
        task.completionDateTime = new Date();
      }

      await task.save();

      const taskResponse = classToPlain(task);

      if (fileAttachments) {
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
          //console.log("result file ", result_File);
        });

        await Promise.all(filePromises);
      }

      return res.status(200).json({
        success: true,
        task: taskResponse,
      });
    } else {
      return RequestFailed(res, 400, "User Id invalid,user");
    }
  } catch (error) {
    return InternalServerError(res, error);
  }
};

export const editTask = async (req: AuthRequest, res: Response) => {
  try {
    console.log("body ", req.body, req.query.taskId, req.userId);
    const taskId = req?.query?.taskId;

    const title = req.body.title;
    const description = req.body.description;
    const completionStatus = req.body.completionStatus;

    const task = await Task.findOne({
      where: {
        id: taskId,
        user: {
          id: req.userId,
        },
      },
    });

    if (task) {
      const updatedTask = await getConnection()
        .createQueryBuilder()
        .update(Task)
        .set({
          title: title ? title : task?.title,
          description: description ? description : task?.description,
          completionStatus: completionStatus
            ? completionStatus
            : task?.completionStatus,
        })
        .where("id = :id", { id: taskId })
        .execute();

      console.log("Updated Task is ", updatedTask);

      if (updatedTask?.affected) {
        return res.status(202).send({
          success: true,
          message: "Task updated successfully",
        });
      } else {
        return res.status(202).send({
          success: false,
          message: "Cannot update task",
        });
      }
    } else {
      return res.status(202).send({
        success: false,
        message: "Cannot update task",
      });
    }
  } catch (error) {
    return InternalServerError(res, error);
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const taskId = req.query.taskId;

    const isTaskFilesDeleted = await getConnection()
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

    console.log("task deleted ", isTaskDeleted, isTaskFilesDeleted);

    if (isTaskDeleted?.affected) {
      return res.status(200).send({
        success: true,
        message: "Task successfully deleted",
      });
    } else {
      return res.status(404).send({
        success: false,
        message: "Cannot delete task",
      });
    }
  } catch (error) {
    return InternalServerError(res, error);
  }
};

export const viewTasks = async (req: AuthRequest, res: Response) => {
  try {
    console.log("user ", req.userId);
    // const tasks = await Task.find({
    //   where: {
    //     user: {
    //       id: req.userId,
    //     },
    //   },
    //   relations: ["MYFile"],
    // });

    const tasks = await getConnection()
      .getRepository(Task)
      .createQueryBuilder("task")
      .leftJoinAndSelect(MYFile, "file", "file.taskId = task.id")
      .where("userId = :userId", {
        userId: req.userId,
      })
      .getMany();

    // const tasks = await getConnection()
    //   .getRepository(Task)
    //   .createQueryBuilder("task")
    //   .leftJoinAndSelect("task.files", "files")
    //   .getMany();

    if (tasks.length) {
      return res.status(200).send({
        success: true,
        tasks,
      });
    } else {
      return res.status(200).send({
        success: false,
        message: "This user has no tasks",
      });
    }
  } catch (error) {
    return InternalServerError(res, error);
  }
};

export const attachFilesToExistingTask = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    console.log("Attached Files are ", req?.query?.taskId);
    let fileAttachments = req?.files?.fileAttachments;
    const taskId = req?.query?.taskId;

    if (!fileAttachments) {
      console.log("no files attached");

      return res.status(200).send({
        success: false,
        message: "No file was uploaded",
      });
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
        //console.log("result file ", result_File);

        return res.status(200).send({
          success: true,
          message: "Files attached to a existing task",
        });
      });

      await Promise.all(filePromises);
    } else {
      return res.status(400).send({
        success: false,
        message: "Cannot attach files to this task",
      });
    }
  } catch (error) {
    return InternalServerError(res, error);
  }
};

export const fileDownload = async (req: Request, res: Response) => {
  try {
    const taskId = req.query.taskId as string;

    if (!taskId) {
      return res.status(400).send("Task ID is required in query parameters");
    }

    const files = await getConnection()
      .getRepository(MYFile)
      .createQueryBuilder("MYFile")
      .where("taskId = :taskId", {
        taskId,
      })
      .getMany();

    console.log("Files are ", files);
    if (files.length === 0) {
      return res.status(404).send("No files found for the specified Task ID");
    }

    const archive = archiver("zip");

    // Set the response headers for a zip file
    res.writeHead(200, {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename=files_${taskId}.zip`,
    });

    // Pipe the zip file to the response
    archive.pipe(res);

    // Add each file to the zip archive
    files.forEach((file) => {
      archive.append(Buffer.from(file.data, "base64"), { name: file.name });
    });

    // Finalize the zip file
    archive.finalize();

    // Wait for the 'finish' event before ending the response
    archive.on("finish", () => {
      res.end();
    });
  } catch (error) {
    console.error("Error downloading files:", error);
    res.status(500).send("Internal Server Error");
    // Ensure to end the response in case of an error
    res.end();
  }
};
