import { IsPositive } from "class-validator";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { Game } from "./Game";
import { Visitor } from "./User";

@Entity()
export class Feedback {

  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne((type) => Visitor)
  from: Visitor;

  @ManyToOne((type) => Game)
  to: Game;

  @Column()
  @IsPositive()
  rating: number;

  @Column()
  remark: string;
}
