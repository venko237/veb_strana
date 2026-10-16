export type CartLine = { id: string; quantity: number };
export type PricedItem = { id: string; price: number; available: boolean };

export const MAX_QTY_PER_ITEM = 50;

/** Validates cart lines against current menu prices and returns the total in MKD. */
export function computeOrderTotal(lines: CartLine[], items: PricedItem[]): number {
  if (lines.length === 0) throw new Error("EMPTY_CART");
  const byId = new Map(items.map((i) => [i.id, i]));
  let total = 0;
  for (const line of lines) {
    const item = byId.get(line.id);
    if (!item) throw new Error("UNKNOWN_ITEM");
    if (!item.available) throw new Error("ITEM_UNAVAILABLE");
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_QTY_PER_ITEM)
      throw new Error("INVALID_QUANTITY");
    total += Number(item.price) * line.quantity;
  }
  return Math.round(total * 100) / 100;
}

export function formatMKD(value: number): string {
  return `${Number(value).toLocaleString("mk-MK", { maximumFractionDigits: 2 })} ден.`;
}
