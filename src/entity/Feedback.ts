import { IsPositive } from "class-validator";
import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { Tenant, Visitor } from "./User";

@Entity()
@Check(`(rating >= 0)`)
export class Feedback {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Visitor, { nullable: false })
  @JoinColumn({ name: "fromVisitor" })
  from: Visitor;

  @ManyToOne(() => Tenant, { nullable: false })
  @JoinColumn({ name: "tenantReviewed" })
  to: Tenant;

  @Column({ nullable: false, default: 0 })
  @IsPositive()
  rating: number;

  @Column({ nullable: false, default: "" })
  remark: string;

  @Column({ nullable: false, default: "" })
  comment: string;

  @Column({ nullable: false, default: false })
  rated: boolean;
}
