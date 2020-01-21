import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

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

  @ManyToOne((type) => Tenant, { nullable: false })
  @JoinColumn()
  tenant: Tenant;

  @Column({
    enum: GameDifficulty,
    type: "enum",
    nullable: false,
  })
  difficulty: GameDifficulty;
}
