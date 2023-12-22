import { getConnection } from "typeorm";
import { Task } from "../entity/Task";
import sendEmail from "./nodemailer";

const myTask = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

    const uniqueUserIds = Array.from(
      new Set(tasks.map((item) => String(item.user.email)))
    );

    console.log("user Ids are ", uniqueUserIds);
    await sendEmail({
      to: uniqueUserIds,
      subject: "Due Tasks today",
      text: "You have some task due today",
    });
  } catch (error) {
    console.log("Error handling is ", error);
  }
};

export default myTask;

/*
ER_WRONG_FIELD_WITH_GROUP: Expression #1 of SELECT list is not in GROUP BY clause and contains nonaggregated
 column 'todolist.task.id' which is not functionally dependent on columns in GROUP BY clause; this is incompatible
  with sql_mode=only_full_group_by
*/
