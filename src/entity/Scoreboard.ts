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
import { User } from "./User";

@Entity()
export class Scoreboard {
    @PrimaryColumn()
    @OneToOne(type => User)
    @JoinColumn({ name : 'userId' })
    userId : number;

    @Column({ default : () => 0 })
    score : number;

    @Column({type: "datetime", default: () => "CURRENT_TIMESTAMP"})
    lastUpdated: Date;
}

