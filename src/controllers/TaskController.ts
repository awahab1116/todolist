import { Task } from "../entity/Task";
import { User } from "../entity/User";
import { List } from "../entity/List";
import { InternalServerError } from "../response/InternalServerErrorResponse";
import { RequestFailed } from "../response/RequestFailedResponse";
import { classToPlain } from "class-transformer";
import {  Response } from "express";
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

      const task = new Task();
      task.title = title;
      task.description = description;
      task.fileAttachments = fileAttachments;
      task.creationDateTime = creationDateTime;
      task.completionStatus = completionStatus || false;

      if (completionStatus) {
          task.completionDateTime = new Date();
      }

      const user = await User.findOne({
          where: {
              id: req.userId
          }
      });

      if (user) {
          const list = await List.findOne({
              where: {
                  user: { id: req.userId }
              }
          });

          if (!list) {
              const newList = new List();
              newList.user = user;
              await newList.save();

              task.list = newList;
              await task.save();

              const taskResponse = classToPlain(task);
              console.log("user creating task first time")
              return res.status(200).json({
                  success: true,
                  task: taskResponse,
              });
          }
          console.log("user already created the list now creating another task")
          task.list = list;
          await task.save();

          const taskResponse = classToPlain(task);
          return res.status(200).json({
              success: true,
              task: taskResponse,
          });
        } else {
        return RequestFailed(res, 404, "user", req.userId);
      }

      
    } catch (error) {
      return InternalServerError(res, error);
    }
  };


  /*
        const list = await List.findOne({
        where: { userId: req.userId },
      });
      console.log("here")
      if(list){
        console.log("List found is ",list)
        task.list = list;

        await task.save();
  
        const taskResponse = classToPlain(task);
        res.status(200).json({
          success: true,
          task: taskResponse,
        });
    }else{
      console.log("List created then add task first time user creating task")
      const user = await User.findOne({
        where: { id: req.userId },
      });

      if(user){
      const list = new List();
      list.user = user;

      await list.save();

      task.list = list;

      await task.save();

      const taskResponse = classToPlain(task);
      res.status(200).json({
        success: true,
        task: taskResponse,
      });

      }
    }
  */