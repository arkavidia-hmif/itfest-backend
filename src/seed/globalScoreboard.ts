import { UserSeed } from './user'

export const GlobalScoreboardSeed = [
  {
    userId: UserSeed[2],
    score: 200,
    lastUpdated: new Date()
  },
  {
    userId: UserSeed[3],
    score: 500,
    lastUpdated: new Date()
  }
];