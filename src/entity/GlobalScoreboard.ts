import { Column, Entity, JoinColumn, PrimaryColumn, UpdateDateColumn, OneToOne } from "typeorm";
import { User } from "./User";

@Entity()
export class GlobalScoreboard {
  // @PrimaryColumn()
  // @OneToOne((type) => User)
  // @JoinColumn({ name: "userId" })
  // userId: number;
  @OneToOne((type) => User, { primary: true })
  @JoinColumn({ name: "userId" })
  userId: User;

  @Column({ default: () => 0 })
  score: number;

  @UpdateDateColumn()
  lastUpdated: Date;
}

