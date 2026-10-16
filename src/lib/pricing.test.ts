import { describe, expect, it } from "vitest";
import { computeOrderTotal } from "./pricing";

const items = [
  { id: "a", price: 110, available: true },
  { id: "b", price: 70, available: true },
  { id: "c", price: 90, available: false },
];

describe("computeOrderTotal", () => {
  it("sums price × quantity from server prices", () => {
    expect(computeOrderTotal([{ id: "a", quantity: 2 }, { id: "b", quantity: 1 }], items)).toBe(290);
  });
  it("rejects an empty cart", () => {
    expect(() => computeOrderTotal([], items)).toThrow("EMPTY_CART");
  });
  it("rejects unavailable items", () => {
    expect(() => computeOrderTotal([{ id: "c", quantity: 1 }], items)).toThrow("ITEM_UNAVAILABLE");
  });
  it("rejects quantity above 50", () => {
    expect(() => computeOrderTotal([{ id: "a", quantity: 51 }], items)).toThrow("INVALID_QUANTITY");
  });
  it("rejects unknown items", () => {
    expect(() => computeOrderTotal([{ id: "zzz", quantity: 1 }], items)).toThrow("UNKNOWN_ITEM");
  });
});
