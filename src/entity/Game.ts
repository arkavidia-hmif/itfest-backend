import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { Tenant } from "./User";

export enum GameDifficulty {
  EASY = 1,
  MEDIUM = 2,
  HARD = 3,
}

export enum GameType {
  QUIZ = 1,
  CROSSWORD = 2
}

@Entity()
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    nullable: false,
  })
  name: string;

  @ManyToOne((type) => Tenant, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn()
  tenant: Tenant;

  @Column({
    enum: GameDifficulty,
    type: "enum",
    nullable: false,
  })
  difficulty: GameDifficulty;

  @Column({
    enum: GameType,
    type: "enum",
    nullable: false,
  })
  type: GameType;

  @Column()
  problem: string;

  @Column()
  answer: string;
}
