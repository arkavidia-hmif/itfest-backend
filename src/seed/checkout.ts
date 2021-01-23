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
    itemId: 1, 
    quantity: 100
  },
  {
    checkoutId: 1,
    itemId: 2, 
    quantity: 20
  },
  {
    checkoutId: 1,
    itemId: 3, 
    quantity: 300
  },
  {
    checkoutId: 4,
    itemId: 2, 
    quantity: 20
  },
  {
    checkoutId: 4,
    itemId: 4, 
    quantity: 100
  },
  {
    checkoutId: 3,
    itemId: 2, 
    quantity: 20
  },
];