import { Check, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { Item } from "./Item";
import { User } from "./User";

export enum TransactionType {
  GIVE = "give",
  PLAY = "play",
  REDEEM = "redeem",
}

@Entity()
@Check(`(amount >= 0)`)
export class Transaction {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne((type) => User, (user) => user.id, { nullable: false })
  from: User;

  @ManyToOne((type) => User, (user) => user.id, { nullable: false })
  to: User;

  @Column()
  amount: number;

  @Column({
    default: TransactionType.GIVE,
    enum: TransactionType,
    type: "enum",
  })
  type: TransactionType;

  @ManyToOne((type) => Item, (item) => item.id)
  item: Item;
}
