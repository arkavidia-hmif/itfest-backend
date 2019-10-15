import { IsPositive } from "class-validator";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { Item } from "./Item";

@Entity()
export class Transaction {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne((type) => User, (user) => user.id, { nullable: false })
  from: User;

  @ManyToOne((type) => User, (user) => user.id, { nullable: false })
  to: User;

  @Column()
  @IsPositive()
  amount: number;

  @Column()
  transfer: boolean;

  @ManyToOne((type) => Item, (item) => item.id)
  item: Item;
}
