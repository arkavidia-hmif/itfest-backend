import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn } from "typeorm";
import { IsEmail } from "class-validator";

export enum UserRole {
    ADMIN = "admin",
    TENANT = "tenant",
    VISITOR = "visitor"
}

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @IsEmail()
    email: string;

    @Column()
    name: string;

    @Column({
        type: "enum",
        enum: UserRole,
        default: UserRole.VISITOR
    })
    type: UserRole;

    @Column()
    @CreateDateColumn()
    createdAt: Date;

    @Column()
    @UpdateDateColumn()
    updatedAt: Date;
}
