import { IsPositive } from "class-validator";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { Game } from "./Game";
import { Visitor } from "./User";

@Entity()
export class Feedback {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne((type) => Visitor, { nullable: false })
  @JoinColumn({ name: "fromVisitor" })
  from: Visitor;

  @ManyToOne((type) => Game, { nullable: false })
  @JoinColumn({ name: "gamePlayed" })
  to: Game;

  @Column()
  @IsPositive()
  rating: number;

  @Column({ nullable: false })
  remark: string;

  @Column({ nullable: false })
  rated: boolean;
}
