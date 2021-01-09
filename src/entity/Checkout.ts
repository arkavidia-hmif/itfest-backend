import { IsPositive } from "class-validator";
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  PrimaryColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { Item } from "./Item";

@Entity()
export class Checkout{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: "-" })
    lineContact: String;

    @Column({ default: "-" })
    waContact: String;

    @Column({ default: false })
    isSent: boolean;

    @Column({ default: "-" })
    address: String;

    @Column({ default: 0 })
    totalPrice: number;
}

@Entity()
export class CheckoutItem {
  @PrimaryGeneratedColumn()
  id: number;

  @PrimaryColumn({ type: 'int', name: 'checkoutId'})
  @ManyToOne((type) => Checkout)
  checkoutId: number;

  @ManyToOne((type) => Item, { nullable: false })
  item: Item;

  @Column({nullable: false})
  @IsPositive()
  quantity: number;
}