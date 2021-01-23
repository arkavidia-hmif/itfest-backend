import { UserSeed } from "./user";

export const ItemSeed = [
  {
    id: 1,
    name: "bawang",
    owner: UserSeed[0],
    price: 5000
  },
  {
    id: 2,
    name: "garenaVoucher",
    owner: UserSeed[1],
    price: 15000,
    hasPhysical: false
  },
  {
    id: 3,
    name: "kertas",
    owner: UserSeed[1],
    price: 2000
  },
  {
    id: 4,
    name: "gofoodVch",
    owner: UserSeed[0],
    price: 4000,
    hasPhysical: false
  }
];