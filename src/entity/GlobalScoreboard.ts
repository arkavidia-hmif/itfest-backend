import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

import { User } from "./User";

@Entity()
export class GlobalScoreboard {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne((type) => User, (user) => user.id, { nullable: false, onDelete: "CASCADE" })
  user: User;

  @Column({ default: () => 0 })
  score: number;

  @UpdateDateColumn()
  lastUpdated: Date;
}

