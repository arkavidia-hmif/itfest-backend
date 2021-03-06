import { IsEmail } from "class-validator";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn, Check } from "typeorm";

export enum UserRole {
  ADMIN = "admin",
  TENANT = "tenant",
  VISITOR = "visitor",
}

export enum Gender {
  MALE = 1,
  FEMALE = 2,
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    nullable: true,
    unique: true,
  })
  @IsEmail()
  email: string;

  @Column({
    unique: true,
  })
  username: string;

  @Column({ default: "anonymous" })
  name: string;

  @Column({
    default: UserRole.VISITOR,
    enum: UserRole,
    type: "enum",
  })
  role: UserRole;

  @Column({
    nullable: true,
    select: false,
  })
  salt: string;

  @Column({
    nullable: true,
    select: false,
  })
  password: string;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: false })
  isVerified: boolean;
}

@Entity()
@Check("(point >= 0)")
export class Visitor {
  @OneToOne(() => User, { primary: true })
  @JoinColumn({ name: "userId" })
  userId: User;

  @Column({ nullable: true })
  dob: Date;

  @Column({ nullable: true })
  gender: Gender;

  @Column("simple-array", { nullable: true })
  interest: string[];

  @Column({ nullable: false, default: 0 })
  point: number;

  @Column({ nullable: false, default: false })
  filled: boolean;

  @Column({ nullable: true })
  telp: string;

  @Column({ nullable: true })
  institute: string;
}

@Entity()
@Check("(point >= 0)")
export class Tenant {
  @OneToOne(() => User, { primary: true })
  @JoinColumn({ name: "userId" })
  userId: User;

  @Column({ nullable: false })
  point: number;

  @Column({ default: false })
  isLive: boolean;

  @Column({ default: "-" })
  liveURL: string;
}
