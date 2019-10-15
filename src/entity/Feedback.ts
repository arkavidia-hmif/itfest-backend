import { IsPositive } from "class-validator";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Visitor, Tenant } from "./User";

@Entity()
export class Feedback {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne((type) => Visitor)
  from: Visitor;

  @ManyToOne((type) => Tenant)
  to: Tenant;

  @Column()
  @IsPositive()
  rating: number;

  @Column()
  remark: string;
}
