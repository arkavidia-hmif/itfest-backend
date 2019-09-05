import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, Unique, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { IsEmail, IsAlphanumeric } from "class-validator";

export enum UserRole {
  ADMIN = "admin",
  TENANT = "tenant",
  VISITOR = "visitor"
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
    nullable: true
  })
  @IsEmail()
  email: string;

  @Column({
    unique: true,
  })
  @IsAlphanumeric()
  username: string;

  @Column()
  name: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.VISITOR
  })
  type: UserRole;

  @Column({
    nullable: true
  })
  salt: string

  @Column({
    nullable: true
  })
  password: string;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
@Entity()
export class Customer {
  @OneToOne(type => User, { primary: true })
  @JoinColumn({ name: 'userId' })
  userId: User;

  @Column()
  point: Number;
}

@Entity()
export class Tenant {
  @OneToOne(type => User, { primary: true })
  @JoinColumn({ name: 'userId' })
  userId: User;

  @Column()
  point: Number;

  @Column()
  emailVerified: boolean;

  @Column()
  emailKey: string;
}
