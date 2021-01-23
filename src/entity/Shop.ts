import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { User } from "./User";

@Entity()
export class Shop {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    name: String;

    @ManyToOne((type) => User, (user) => user.id, { nullable: false, onDelete: "CASCADE" })
    owner: User;

    @CreateDateColumn()
    createdAt: Date;
}
