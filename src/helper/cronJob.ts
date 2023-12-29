import { getConnection } from "typeorm";
import { Task } from "../entity/Task";
import sendEmail from "./nodemailer";
import logger from "../Logger/index";

//cron job function to send email notifications for users which tasks are due today
const sendEmailToUsersTasksDueTodayJob = async () => {
  try {
    //set the today time at 12AM which is used for getting all today tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    //using a and conition between 12Am and 12Am of next day and completion status false
    const tasks = await getConnection()
      .getRepository(Task)
      .createQueryBuilder("task")
      .leftJoinAndSelect("task.user", "user")
      .addSelect(["user.id"])
      .where("task.dueDateTime >= :startDate", { startDate: today })
      .andWhere("task.dueDateTime < :endDate", {
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      })
      .andWhere("task.completionStatus = :completionStatus", {
        completionStatus: false,
      })
      .getMany();

    //using set to get unique userids tried to use group by in above query but gets sql error which is at last of file
    const uniqueUserIds = Array.from(
      new Set(tasks.map((item) => String(item.user.email)))
    );

    //Nodemailer function to send emails to users
    await sendEmail({
      to: uniqueUserIds,
      subject: "Due Tasks today",
      text: "You have some task due today",
    });
  } catch (error) {
    logger.error("Error:send email to user due tasks today ", error);
  }
};

export default sendEmailToUsersTasksDueTodayJob;

/*
Group by error
ER_WRONG_FIELD_WITH_GROUP: Expression #1 of SELECT list is not in GROUP BY clause and contains nonaggregated
 column 'todolist.task.id' which is not functionally dependent on columns in GROUP BY clause; this is incompatible
  with sql_mode=only_full_group_by
*/
