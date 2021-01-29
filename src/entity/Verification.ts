import { IsAlphanumeric, IsEmail } from "class-validator";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn, Check } from "typeorm";

class Verification {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    userId: number;

    @Column({ nullable: false })
    token: String;
}