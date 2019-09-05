import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, OneToOne, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./User";
import { IsPositive, Length } from "class-validator";

@Entity()
export class Transaction {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => User, user => user.id)
  from: User;

  @ManyToOne(type => User, user => user.id)
  to: User;

  @Column()
  @IsPositive()
  price: number;

  @Column()
  description: string;
}
