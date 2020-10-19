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
import { Scoreboard } from "./Scoreboard";
import { User } from "./User";

@Entity()
export class GameScoreboard {
    @PrimaryColumn()
    @ManyToOne(() => Scoreboard, scoreboard => scoreboard.playerId )
    @JoinColumn({ name : 'playerId' })
    playerId : number;

    @PrimaryColumn()
    @ManyToOne(() => Game, game => game.id )
    @JoinColumn({ name : 'gameId' })
    gameId : number;

    @Column({ default : () => 0 })
    score : number;

    @Column({type: "datetime", default: () => "CURRENT_TIMESTAMP"})
    lastUpdated: Date;
}

