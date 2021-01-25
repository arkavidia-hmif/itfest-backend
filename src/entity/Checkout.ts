import { IsPositive } from "class-validator";
import {
  Check,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  PrimaryColumn,
  ManyToOne,
  OneToMany,
  JoinColumn
} from "typeorm";
import { Item } from "./Item";

@Entity()
export class Checkout{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: "-" })
    lineContact: string;

    @Column({ default: "-" })
    waContact: string;

    @Column({ default: false })
    isSent: boolean;

    @Column({ default: "-" })
    address: string;

    @Column({ default: 0 })
    totalPrice: number;

    @OneToMany(() => CheckoutItem, checkoutItem => checkoutItem.checkoutId)
    @JoinColumn({ name: "items" })
    items: CheckoutItem[];
}

@Entity()
@Check(`(quantity >= 0)`)
export class CheckoutItem {
  @PrimaryGeneratedColumn()
  id: number;

  @PrimaryColumn({ type: "int", name: "checkout"})
  @ManyToOne((type) => Checkout)
  checkoutId: number;

  @ManyToOne((type) => Item, { nullable: false })
  item: Item;

  @Column({nullable: false})
  @IsPositive()
  quantity: number;
}
