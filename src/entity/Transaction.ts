import { IsPositive } from "class-validator";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";

@Entity()
export class Transaction {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne((type) => User, (user) => user.id)
  from: User;

  @ManyToOne((type) => User, (user) => user.id)
  to: User;

  @Column()
  @IsPositive()
  price: number;

  @Column()
  description: string;
}
