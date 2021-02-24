import { IsPositive } from "class-validator";
import {
  Check,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn
} from "typeorm";
import { Item } from "./Item";

@Entity()
export class Checkout {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  lineContact: string;

  @Column({ nullable: true })
  waContact: string;

  @Column({ nullable: true })
  address: string;

  @Column({ default: 0 })
  totalPrice: number;

  @OneToMany(() => CheckoutItem, checkoutItem => checkoutItem.checkout)
  @JoinColumn({ name: "items" })
  items: CheckoutItem[];
}

@Entity()
@Check("(quantity >= 0)")
export class CheckoutItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Checkout, (checkout) => checkout.id, { nullable: false, onDelete: "CASCADE" })
  checkout: Checkout;

  @ManyToOne(() => Item, { nullable: false })
  item: Item;

  @Column({ nullable: false })
  @IsPositive()
  quantity: number;
}
