import { IsPositive } from "class-validator";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { Tenant, Visitor } from "./User";

@Entity()
export class Feedback {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne((type) => Visitor, { nullable: false })
  @JoinColumn({ name: "fromVisitor" })
  from: Visitor;

  @ManyToOne((type) => Tenant, { nullable: false })
  @JoinColumn({ name: "tenantReviewed" })
  to: Tenant;

  @Column()
  @IsPositive()
  rating: number;

  @Column({ nullable: false })
  remark: string;

  @Column({ nullable: false })
  rated: boolean;
}
