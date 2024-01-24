import { Exclude } from "class-transformer";
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { loginType } from "../types/loginType";

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
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

  @Column({ type: "enum", enum: loginType, default: loginType.simple })
  loginType: loginType;

  @Column()
  updatedAt: Date;

  @Column()
  createdAt: Date;

  @Column({ type: "bool" })
  active: Boolean;
}
