import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  //   OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";

@Entity()
export class Task extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  //Need to define relation here as well if we need files along with tasks
  //Rightnow, our relation is one sided one task has many files taskID is in Myfile as foreign key right now
  //   @OneToMany(() => MYFile, (file) => file.task)
  //   files: MYFile[];

  @Column()
  creationDateTime: Date;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: false })
  completionStatus: Boolean;

  @Column()
  dueDateTime: Date;

  @Column({ nullable: true })
  completionDateTime: Date;
}
