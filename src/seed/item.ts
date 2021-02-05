import { UserSeed } from "./user";

export const ItemSeed = [
  {
    name: "bawang",
    owner: UserSeed[0],
    price: 5000
  },
  {
    name: "garenaVoucher",
    owner: UserSeed[1],
    price: 15000,
    hasPhysical: false
  },
  {
    name: "kertas",
    owner: UserSeed[1],
    price: 2000
  },
  {
    name: "gofoodVch",
    owner: UserSeed[0],
    price: 4000,
    hasPhysical: false
  }
];