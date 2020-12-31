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
export class Shop {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    name: String;

    @ManyToOne((type) => User, (user) => user.id, { nullable: false, onDelete: 'CASCADE' })
    owner: User;
    
    @Column({type: "timestamp", default: () => "CURRENT_TIMESTAMP"})
    createdAt: Date;
}

