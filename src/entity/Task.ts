import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  //   OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";
// import { MYFile } from "./MyFile";

@Entity()
export class Task extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: number;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  //   @OneToMany(() => MYFile, (file) => file.task)
  //   files: MYFile[];

  @Column()
  creationDateTime: Date;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ default: false })
  completionStatus: Boolean;

  @Column()
  dueDateTime: Date;

  @Column({ nullable: true })
  completionDateTime: Date;
}
