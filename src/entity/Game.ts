import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import config from "../config";
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

  @ManyToOne((type) => Tenant, { nullable: false, onDelete: "CASCADE" })
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

  @Column("text")
  problem: string;

  @Column("text")
  answer: string;
}

export interface GameSystem {
  game: Game;
  evaluateScore(): number;
}

export class GameFactory {
  static createGame(game: Game, userAnswer: Record<string, string>): GameSystem {
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
  userAnswer: Record<string, string>;

  constructor(game: Game, userAnswer: Record<string, string>) {
    this.game = game;
    this.userAnswer = userAnswer;
  }

  evaluateScore(): number {
    return getScore(this.userAnswer, JSON.parse(this.game.answer));
  }
}

export class GameCrossword implements GameSystem {
  game: Game;
  userAnswer: Record<string, string>;

  constructor(game: Game, userAnswer: Record<string, string>) {
    this.game = game;
    this.userAnswer = userAnswer;
  }

  evaluateScore(): number {
    return getScore(this.userAnswer, JSON.parse(this.game.answer));
  }
}

const getScore = (userAnswer: Record<string, string>, answer: Record<string, string>) => {
  const maxPoinCrossword = config.maxScore;
  const lengthQuestion = Object.keys(answer).length;
  let point = 0;

  Object.keys(userAnswer).forEach((key) => {
    if (userAnswer[key] === answer[key]) {
      point += 1;
    }
  });

  return Math.ceil(point / lengthQuestion * maxPoinCrossword);
};
