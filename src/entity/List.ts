
import {
    BaseEntity,
    Entity,
    OneToOne,
    OneToMany,
    JoinColumn,
    PrimaryGeneratedColumn,
   
} from "typeorm";
// import { Role } from "./Role";
import { User } from "./User";
import {Task } from "./Task";


@Entity()
export class List extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: number;

    @OneToOne(() => User)
    @JoinColumn()
    user: User

    @OneToMany(() => Task, (task) => task.list) 
    tasks: Task[]

}
