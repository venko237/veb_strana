import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useI18n, type DictKey } from "@/lib/i18n";
import { getOrderStatus } from "@/lib/orders.functions";
import { formatMKD } from "@/lib/pricing";

const orderQuery = (id: string) =>
  queryOptions({ queryKey: ["order", id], queryFn: () => getOrderStatus({ data: { id } }), refetchInterval: 5000 });

export const Route = createFileRoute("/order/$id")({
  head: () => ({
    meta: [
      { title: "Статус на нарачка — Кафич Зрно" },
      { name: "description", content: "Следете го статусот на вашата нарачка во реално време." },
      { property: "og:title", content: "Статус на нарачка — Кафич Зрно" },
      { property: "og:description", content: "Следете ја вашата нарачка." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderPage,
});

const steps = ["pending", "preparing", "ready", "completed"] as const;

function OrderPage() {
  const { id } = Route.useParams();
  const { t, lang } = useI18n();
  const { data: order, isLoading, isError } = useQuery(orderQuery(id));

  if (isLoading) return <p className="py-24 text-center text-muted-foreground">…</p>;
  if (isError || !order)
    return (
      <div className="py-24 text-center">
        <p>{t("notFound")}</p>
        <Link to="/menu" className="mt-4 inline-block text-primary underline">{t("backToMenu")}</Link>
      </div>
    );

  const idx = steps.indexOf(order.status as (typeof steps)[number]);
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-2xl border bg-card p-6 shadow-warm sm:p-8">
        <CheckCircle2 className="h-10 w-10 text-success" />
        <h1 className="mt-3 text-3xl font-semibold">{t("orderPlaced")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("orderNo")} #{order.id.slice(0, 8).toUpperCase()}</p>

        {order.status === "cancelled" ? (
          <p className="mt-6 rounded-xl bg-destructive/10 p-3 font-semibold text-destructive">{t("cancelled")}</p>
        ) : (
          <ol className="mt-6 grid grid-cols-4 gap-2">
            {steps.map((s, i) => (
              <li key={s} className="text-center">
                <div className={`h-2 rounded-full ${i <= idx ? "bg-primary" : "bg-muted"}`} />
                <span className={`mt-2 block text-xs ${i === idx ? "font-bold" : "text-muted-foreground"}`}>{t(s as DictKey)}</span>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-2 text-xs text-muted-foreground">{t("autoRefresh")}</p>

        <ul className="mt-6 divide-y border-t">
          {order.order_items.map((it, i) => (
            <li key={i} className="flex justify-between py-2 text-sm">
              <span>{it.quantity} × {lang === "mk" ? it.name_mk : it.name_en}</span>
              <span>{formatMKD(Number(it.unit_price) * it.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t pt-3 font-semibold">
          <span>{t("total")}</span><span className="text-primary">{formatMKD(Number(order.total))}</span>
        </div>
        <Link to="/menu" className="mt-6 inline-block text-sm font-semibold text-primary">← {t("backToMenu")}</Link>
      </div>
    </div>
  );
}
