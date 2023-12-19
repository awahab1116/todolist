
import {
    BaseEntity,
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
   
} from "typeorm";
// import { Role } from "./Role";
import { User } from "./User";


@Entity()
export class Task extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: number;

    @ManyToOne(() => User, (user) => user.id)
    user: User;

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
