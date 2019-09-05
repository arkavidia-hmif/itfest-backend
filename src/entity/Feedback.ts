import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn, ManyToOne } from "typeorm";
import { User, Tenant, Customer } from "./User";
import { IsPositive } from "class-validator";

@Entity()
export class Feedback {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(type => Customer)
  from: Customer;

  @ManyToOne(type => Tenant)
  to: Tenant;

  @Column()
  @IsPositive()
  rating: number;

  @Column()
  remark: string;
}
