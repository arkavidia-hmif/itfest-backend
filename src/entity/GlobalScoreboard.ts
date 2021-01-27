import { Column, Entity, JoinColumn, UpdateDateColumn, PrimaryGeneratedColumn, OneToOne } from "typeorm";
import { User } from "./User";

@Entity()
export class GlobalScoreboard {
  @PrimaryGeneratedColumn()
  @OneToOne((type) => User, { primary: true })
  @JoinColumn({ name: "userId" })
  userId: number;

  @Column({ default: () => 0 })
  score: number;

  @UpdateDateColumn()
  lastUpdated: Date;
}

