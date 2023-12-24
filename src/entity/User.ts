import { Exclude } from "class-transformer";
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export interface UserEntity {
  id: number;
  username: string;
  email: string;
  // ... other properties
}

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true, unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ nullable: true })
  profileImage: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  otp: number;

  @Column({ nullable: true })
  otpExpirationTime: Date;
  // @Column({ nullable: true })
  // fcmToken: string;

  @Column()
  updatedAt: Date;

  @Column()
  createdAt: Date;
}
