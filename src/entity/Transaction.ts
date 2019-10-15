import { IsPositive } from "class-validator";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Tree, RelationId } from "typeorm";
import { User } from "./User";
import { Item } from "./Item";

@Entity()
export class Transaction {

  @PrimaryGeneratedColumn()
  id: number;

  @RelationId((transaction: Transaction) => transaction.from)
  fromId: number;

  @RelationId((transaction: Transaction) => transaction.to)
  toId: number;

  @ManyToOne((type) => User, (user) => user.id, { nullable: false })
  from: User;

  @ManyToOne((type) => User, (user) => user.id, { nullable: false })
  to: User;

  @Column()
  @IsPositive()
  amount: number;

  @Column()
  transfer: boolean;

  @RelationId((transaction: Transaction) => transaction.item)
  itemId: number;

  @ManyToOne((type) => Item, (item) => item.id)
  item: Item;
}
