import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Game } from "./Game";
import { User } from "./User";

@Entity()
export class Scoreboard {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne((type) => Game, (game) => game.id, { nullable: false, onDelete: "CASCADE" })
    game: Game;

    @ManyToOne((type) => User, (user) => user.id, { nullable: false, onDelete: "CASCADE" })
    user: User;

    @Column({ default : () => 0 })
    score : number;

    // @Column({type: "timestamp", default: () => "CURRENT_TIMESTAMP"})
    @CreateDateColumn()
    playedAt: Date;
}

