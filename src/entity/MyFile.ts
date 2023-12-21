import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { Task } from "./Task";
@Entity()
export class MYFile {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column({
    type: "longblob",
  })
  data: string;

  @Column()
  mimeType: string;

  @ManyToOne(() => Task, (task) => task.id)
  task: Task;
}
