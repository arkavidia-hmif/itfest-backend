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
    @PrimaryColumn()
    // @ManyToOne(() => Scoreboard, scoreboard => scoreboard.userId )
    // @JoinColumn({ name : 'userId' })
    userId : number;

    @PrimaryColumn()
    @ManyToOne(() => Game, game => game.id )
    @JoinColumn({ name : 'gameId' })
    gameId : number;

    @Column({ default : () => 0 })
    score : number;

    @Column({type: "datetime", default: () => "CURRENT_TIMESTAMP"})
    playedAt: Date;
}

