import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { Game } from "./Game";
import { Visitor } from "./User";

@Entity()
export class GameState {
  @ManyToOne((type) => Game, (game) => game.id, { nullable: false })
  game: Game;

  @ManyToOne((type) => Visitor, (visitor) => visitor.userId, { nullable: false })
  user: Visitor;

  @Column()
  state: string;
}
