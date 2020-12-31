import { IsPositive } from "class-validator";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { User } from "./User";

@Entity()
export class Item {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne((type) => User)
  @JoinColumn({ name: "ownerId" })
  owner: User;

  // @Column({ nullable: false })
  // ownerId: number;

  @Column()
  @IsPositive()
  price: number;

  @Column({ default: true })
  hasPhysical: boolean;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
