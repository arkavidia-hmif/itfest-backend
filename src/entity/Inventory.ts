import { IsPositive } from "class-validator";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Item } from "./Item";

@Entity()
export class Inventory {

  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne((type) => Item)
  @JoinColumn()
  item: Item;

  @Column()
  @IsPositive()
  qty: number;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
