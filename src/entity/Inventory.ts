import { Check, Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Item } from "./Item";

@Entity()
@Check(`(qty >= 0)`)
export class Inventory {

  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne((type) => Item)
  @JoinColumn()
  item: Item;

  @Column()
  qty: number;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
