import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { createOrder } from "@/lib/orders.functions";
import { formatMKD } from "@/lib/pricing";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Кошничка — Кафич Зрно" },
      { name: "description", content: "Прегледај ја кошничката и испрати нарачка до кафич Зрно." },
      { property: "og:title", content: "Кошничка — Кафич Зрно" },
      { property: "og:description", content: "Онлајн нарачка во кафич Зрно." },
    ],
  }),
  component: CartPage,
});

const field = "mt-1 h-11 w-full rounded-xl border bg-card px-3 outline-none focus:ring-2 focus:ring-ring";

function CartPage() {
  const { t, lang } = useI18n();
  const cart = useCart();
  const navigate = useNavigate();
  const submit = useServerFn(createOrder);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ customerName: "", phone: "", tableNumber: "", note: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await submit({
        data: { ...form, lines: cart.items.map((i) => ({ id: i.id, quantity: i.quantity })) },
      });
      cart.clear();
      toast.success(t("orderPlaced"));
      navigate({ to: "/order/$id", params: { id: res.id } });
    } catch {
      toast.error(t("orderError"));
    } finally {
      setBusy(false);
    }
  }

  if (cart.items.length === 0)
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-semibold">{t("cart")}</h1>
        <p className="mt-4 text-muted-foreground">{t("emptyCart")}</p>
        <Link to="/menu" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">{t("seeMenu")}</Link>
      </div>
    );

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_380px]">
      <section>
        <h1 className="text-4xl font-semibold">{t("cart")}</h1>
        <ul className="mt-6 divide-y rounded-2xl border bg-card">
          {cart.items.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">{lang === "mk" ? i.name_mk : i.name_en}</p>
                <p className="text-sm text-muted-foreground">{formatMKD(i.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button aria-label="-" onClick={() => cart.setQty(i.id, i.quantity - 1)} className="rounded-full border p-2"><Minus className="h-4 w-4" /></button>
                <span className="w-6 text-center font-semibold">{i.quantity}</span>
                <button aria-label="+" onClick={() => cart.setQty(i.id, i.quantity + 1)} className="rounded-full border p-2"><Plus className="h-4 w-4" /></button>
                <span className="w-24 text-right font-semibold">{formatMKD(i.price * i.quantity)}</span>
                <button aria-label={t("remove")} onClick={() => cart.remove(i.id)} className="rounded-full p-2 text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <form onSubmit={onSubmit} className="h-fit rounded-2xl border bg-card p-6 shadow-warm">
        <div className="flex justify-between text-lg font-semibold">
          <span>{t("total")}</span><span className="text-primary">{formatMKD(cart.total)}</span>
        </div>
        <label className="mt-5 block text-sm font-medium">{t("name")}
          <input required minLength={2} maxLength={100} className={field} value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
        </label>
        <label className="mt-3 block text-sm font-medium">{t("phone")}
          <input required type="tel" pattern="[0-9+\s()\-]{6,30}" className={field} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="070 123 456" />
        </label>
        <label className="mt-3 block text-sm font-medium">{t("table")}
          <input maxLength={10} className={field} value={form.tableNumber} onChange={(e) => setForm({ ...form, tableNumber: e.target.value })} />
        </label>
        <label className="mt-3 block text-sm font-medium">{t("note")}
          <textarea maxLength={500} rows={3} className="mt-1 w-full rounded-xl border bg-card p-3 outline-none focus:ring-2 focus:ring-ring" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </label>
        <button disabled={busy} className="mt-5 w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-60">
          {busy ? t("placing") : t("checkout")}
        </button>
      </form>
    </div>
  );
}
