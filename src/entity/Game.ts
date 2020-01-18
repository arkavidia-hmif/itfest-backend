import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from "typeorm";
import { Tenant } from "./User";

export enum GameDifficulty {
  EASY = 1,
  MEDIUM = 2,
  HARD = 3,
}

@Entity()
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    nullable: false,
  })
  name: string;

  @ManyToOne((type) => Tenant)
  @JoinColumn()
  tenant: Tenant;

  @Column({
    enum: GameDifficulty,
    type: "enum",
    nullable: false,
  })
  difficulty: GameDifficulty;
}