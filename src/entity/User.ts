import { IsAlphanumeric, IsEmail } from "class-validator";
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
  @IsAlphanumeric()
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

  // set this to true in the prod
  // @Column({ default: false })
  @Column({ default: true })
  isVerified: boolean;
}

@Entity()
@Check(`(point >= 0)`)
export class Visitor {
  @OneToOne((type) => User, { primary: true })
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
@Check(`(point >= 0)`)
export class Tenant {
  @OneToOne((type) => User, { primary: true })
  @JoinColumn({ name: "userId" })
  userId: User;

  @Column({ nullable: false })
  point: number;
}
