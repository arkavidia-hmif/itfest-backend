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
    isSent: Boolean;

    @Column({ default: "-" })
    address: String;

    @Column({ default: 0 })
    totalPoint: number;
}

@Entity()
export class CheckoutItem {
  @PrimaryColumn({ type: 'int', name: 'checkoutId'})
  @ManyToOne((type) => Checkout)
  @JoinColumn({ name: "checkoutId" })
  checkout: Checkout;

  @PrimaryColumn({ type: 'int', name: 'itemId'})
  @JoinColumn({ name: "itemId" })
  item: Item;

  @Column({nullable: false})
  @IsPositive()
  qty: number;
}
