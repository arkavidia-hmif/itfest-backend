import { IsPositive } from "class-validator";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, RelationId } from "typeorm";
import { Item } from "./Item";
import { User } from "./User";

export enum TransactionType {
  GIVE = "give",
  PLAY = "play",
  REDEEM = "redeem",
}

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

  @Column({
    default: TransactionType.GIVE,
    enum: TransactionType,
    type: "enum",
  })
  type: TransactionType;

  @ManyToOne((type) => Item, (item) => item.id)
  item: Item;
}
