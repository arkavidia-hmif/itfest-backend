import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { Game } from "./Game";
import { User } from "./User";

@Entity()
export class GameState {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne((type) => Game, (game) => game.id, { nullable: false })
  game: Game;

  @ManyToOne((type) => User, (user) => user.id, { nullable: false })
  user: User;

  @Column()
  state: string;
}
