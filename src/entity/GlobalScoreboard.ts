import { Column, Entity, JoinColumn, UpdateDateColumn, OneToOne } from "typeorm";
import { User } from "./User";

@Entity()
export class GlobalScoreboard {
  @OneToOne((type) => User, { primary: true })
  @JoinColumn({ name: "userId" })
  userId: User;

  @Column({ default: () => 0 })
  score: number;

  @UpdateDateColumn()
  lastUpdated: Date;
}

