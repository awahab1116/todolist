
import {
    BaseEntity,
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
   
} from "typeorm";
// import { Role } from "./Role";
import { List } from "./List";


@Entity()
export class Task extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: number;

    @ManyToOne(() => List, (list) => list.tasks)
    list: List

    @Column({ type: "timestamp" })
    creationDateTime: Date;

    @Column()
    title: string;

    @Column()
    description: string;

    @Column()
    fileAttachments: string;

    @Column({default: false})
    completionStatus: Boolean;

    @Column({ type: "timestamp", nullable: true })
    completionDateTime: Date;
}
