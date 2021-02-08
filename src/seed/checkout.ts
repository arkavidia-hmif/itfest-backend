import { ItemSeed } from "./item";

export const CheckoutSeed = [
  {
    lineContact: "a.s",
    waContact: "0121",
    isSent: true,
    address: "jl. Tn. A",
    totalPrice: 4000
  },
  {
    lineContact: "ads",
    totalPrice: 40000
  },
  {
    waContact: "01291229",
    totalPrice: 40000
  },
  {
    totalPrice: 200000
  }
];

export const CheckoutItemSeed = [
  {
    checkoutId: 1,
    item: { id: 1 }, 
    quantity: 100
  },
  {
    checkoutId: 1,
    item: { id: 2 }, 
    quantity: 20
  },
  {
    checkoutId: 1,
    item: { id: 3 },
    quantity: 300
  },
  {
    checkoutId: 4,
    item: { id: 2 },
    quantity: 20
  },
  {
    checkoutId: 4,
    item: { id: 4 }, 
    quantity: 100
  },
  {
    checkoutId: 3,
    item: { id: 2 }, 
    quantity: 20
  },
];