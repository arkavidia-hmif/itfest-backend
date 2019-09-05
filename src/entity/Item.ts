import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn, OneToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { IsPositive, Length } from "class-validator";

@Entity()
export class Item {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToOne(type => User)
  @JoinColumn()
  owner: User;

  @Column()
  @IsPositive()
  price: number;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
