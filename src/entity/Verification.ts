import { IsAlphanumeric, IsEmail } from "class-validator";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, Check } from "typeorm";

import { User } from './User';

export enum VerificationType {
    CONFIRM_EMAIL = 1,
    RESET_PASS = 2
}

@Entity()
export class Verification {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne((type) => User, { nullable: false, cascade: true })
    @JoinColumn({ name: "userId" })
    userId: User;

    @Column({ nullable: false })
    token: string;

    @Column({ nullable: false })
    type: VerificationType;
}