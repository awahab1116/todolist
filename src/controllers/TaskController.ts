import { Task } from "../entity/Task";
import { User } from "../entity/User";
import { InternalServerError } from "../response/InternalServerErrorResponse";
import { RequestFailed } from "../response/RequestFailedResponse";
import { classToPlain } from "class-transformer";
import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/AuthRequestContext";

export const createTask = async (req: AuthRequest, res: Response) => {
    try {
     console.log("In create Task ",req.userId)
      const title: string = req.body.title;
      const description: string = req.body.description;
      const fileAttachments: string = req.body.fileAttachments;
      const completionStatus: boolean = req.body.completionStatus;
      const creationDateTime = new Date();
      
  
      if (!title || !title.length) {
        return RequestFailed(res, 400, "title");
      }
      if (!description || !description.length) {
        return RequestFailed(res, 400, "description");
      }
      if (!fileAttachments || !fileAttachments.length) {
        return RequestFailed(res, 400, "fileAttachments");
      }

      const user = await User.findOne({
        where: { id: req.userId },
      });

      if(user){
        const task = new Task();
        task.title = title;
        task.description = description;
        task.fileAttachments = fileAttachments;
        task.creationDateTime = creationDateTime;
        task.completionStatus = completionStatus ? completionStatus : false;
        task.user = user
      
        if(completionStatus){
            task.completionDateTime = new Date()
        }

        await task.save();
  
        const taskResponse = classToPlain(task);
        res.status(200).json({
          success: true,
          task: taskResponse,
        });
    }
      
    } catch (error) {
      return InternalServerError(res, error);
    }
  };