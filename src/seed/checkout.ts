import { ItemSeed } from "./item";

export const CheckoutSeed = [
  {
    id: 1,
    lineContact: "a.s",
    waContact: "0121",
    isSent: true,
    address: "jl. Tn. A",
    totalPrice: 4000
  },
  {
    id: 2,
    lineContact: "ads",
    totalPrice: 40000
  },
  {
    id: 3,
    waContact: "01291229",
    totalPrice: 40000
  },
  {
    id: 4,
    totalPrice: 200000
  }
];

export const CheckoutItemSeed = [
  {
    checkoutId: 1,
    item: ItemSeed[0], 
    quantity: 100
  },
  {
    checkoutId: 1,
    item: ItemSeed[1], 
    quantity: 20
  },
  {
    checkoutId: 1,
    item: ItemSeed[2], 
    quantity: 300
  },
  {
    checkoutId: 4,
    item: ItemSeed[1], 
    quantity: 20
  },
  {
    checkoutId: 4,
    item: ItemSeed[3], 
    quantity: 100
  },
  {
    checkoutId: 3,
    item: ItemSeed[1], 
    quantity: 20
  },
];