import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

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
  isSubmit: boolean;

  @Column({ type: 'timestamp', default: () => "CURRENT_TIMESTAMP"})
  // @CreateDateColumn()
  startTime: Date;

  @Column({ type: 'timestamp'})
  // @CreateDateColumn()
  submitTime: Date;
}