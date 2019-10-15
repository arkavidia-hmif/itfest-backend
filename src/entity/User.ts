import { IsAlphanumeric, IsEmail } from "class-validator";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum UserRole {
  ADMIN = "admin",
  TENANT = "tenant",
  VISITOR = "visitor",
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

  @Column()
  name: string;

  @Column({
    default: UserRole.VISITOR,
    enum: UserRole,
    type: "enum",
  })
  role: UserRole;

  @Column({
    nullable: true,
  })
  salt: string;

  @Column({
    nullable: true,
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
export class Visitor {
  @OneToOne((type) => User, { primary: true })
  @JoinColumn({ name: "userId" })
  userId: User;

  @Column()
  point: number;
}

@Entity()
export class Tenant {
  @OneToOne((type) => User, { primary: true })
  @JoinColumn({ name: "userId" })
  userId: User;

  @Column()
  point: number;

  @Column()
  emailVerified: boolean;

  @Column()
  emailKey: string;
}
