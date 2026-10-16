import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartEntry = { id: string; name_mk: string; name_en: string; price: number; quantity: number };

type CartCtx = {
  items: CartEntry[];
  add: (item: Omit<CartEntry, "quantity">) => void;
  setQty: (id: string, q: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
  total: number;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem("cart") || "[]")); } catch { /* ignore */ }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem("cart", JSON.stringify(items)); }, [items, loaded]);

  const add: CartCtx["add"] = (item) =>
    setItems((prev) => {
      const ex = prev.find((p) => p.id === item.id);
      if (ex) return prev.map((p) => (p.id === item.id ? { ...p, quantity: Math.min(50, p.quantity + 1) } : p));
      return [...prev, { ...item, quantity: 1 }];
    });
  const setQty = (id: string, q: number) =>
    setItems((prev) => (q <= 0 ? prev.filter((p) => p.id !== id) : prev.map((p) => (p.id === id ? { ...p, quantity: Math.min(50, q) } : p))));
  const remove = (id: string) => setItems((prev) => prev.filter((p) => p.id !== id));
  const clear = () => setItems([]);
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.quantity * i.price, 0);
  return <Ctx.Provider value={{ items, add, setQty, remove, clear, count, total }}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}
