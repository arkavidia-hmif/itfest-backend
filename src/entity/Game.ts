import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import game from "../routes/game";

import { Tenant } from "./User";

export enum GameDifficulty {
  EASY = 1,
  MEDIUM = 2,
  HARD = 3,
}

export enum GameType {
  QUIZ = 1,
  CROSSWORD = 2
}

@Entity()
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    nullable: false,
  })
  name: string;

  @ManyToOne((type) => Tenant, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn()
  tenant: Tenant;

  @Column({
    enum: GameDifficulty,
    type: "enum",
    nullable: false,
  })
  difficulty: GameDifficulty;

  @Column({
    enum: GameType,
    type: "enum",
    nullable: false,
  })
  type: GameType;

  @Column()
  problem: string;

  @Column()
  answer: string;
}

export interface GameSystem {
  game: Game;
  evaluateScore(): number;
}

export class GameFactory {
  static createGame(game: Game, userAnswer: object): GameSystem {
    switch (game.type) {
      case GameType.QUIZ:
        return new GameQuiz(game, userAnswer);        
      case GameType.CROSSWORD:
        return new GameCrossword(game, userAnswer);
      default:
        return null;
    }
  }
}

export class GameQuiz implements GameSystem {
  game: Game;
  userAnswer: Object;

  constructor(game: Game, userAnswer: Object) {
    this.game = game;
    this.userAnswer = userAnswer;
  }

  // TODO: Fill
  evaluateScore() {
    let point = 0;
    Object.keys(this.userAnswer).forEach((key) => {
      if (this.userAnswer[key] == this.game.answer[key]) {
        point += 1
      }
    });
    return point;
  }
}

export class GameCrossword implements GameSystem {
  game: Game;
  userAnswer: Object;

  constructor(game: Game, userAnswer: Object) {
    this.game = game;
    this.userAnswer = userAnswer;
  }

  // TODO: Fill
  evaluateScore() {
    return 0;
  }
}
