import { Column, Entity, JoinColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class GlobalScoreboard {
  @PrimaryGeneratedColumn()
  @JoinColumn({ name: "userId" })
  userId: number;

  @Column({ default: () => 0 })
  score: number;

  @UpdateDateColumn()
  lastUpdated: Date;
}

