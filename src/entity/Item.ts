import {
  Check,
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
@Check("(price >= 0)")
export class Item {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "ownerId" })
  owner: User;

  @Column()
  price: number;

  @Column({ default: "-" })
  imageUrl: string;

  @Column({ default: true })
  hasPhysical: boolean;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt: Date;
}
