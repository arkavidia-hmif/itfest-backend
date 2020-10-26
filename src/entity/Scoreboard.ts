import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryColumn,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    OneToOne,
} from "typeorm";
import { Game } from "./Game";
import { User } from "./User";
// import { Scoreboard } from "./Scoreboard";

@Entity()
export class Scoreboard {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne((type) => Game, (game) => game.id, { nullable: false })
    game: Game;

    @ManyToOne((type) => User, (user) => user.id, { nullable: false })
    user: User;

    @Column({ default : () => 0 })
    score : number;

    @Column({type: "timestamp", default: () => "CURRENT_TIMESTAMP"})
    playedAt: Date;
}

