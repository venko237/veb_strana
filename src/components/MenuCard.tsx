import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { formatMKD } from "@/lib/pricing";
import type { MenuItem } from "@/lib/menu";

export function MenuCard({ item }: { item: MenuItem }) {
  const { lang, t } = useI18n();
  const { add } = useCart();
  const name = lang === "mk" ? item.name_mk : item.name_en;
  const desc = lang === "mk" ? item.description_mk : item.description_en;
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-warm">
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        {item.image_url && (
          <img src={item.image_url} alt={name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold">{name}</h3>
          <span className="shrink-0 font-semibold text-primary">{formatMKD(Number(item.price))}</span>
        </div>
        <p className="mt-1 flex-1 text-sm text-muted-foreground">{desc}</p>
        <button
          disabled={!item.available}
          onClick={() => {
            add({ id: item.id, name_mk: item.name_mk, name_en: item.name_en, price: Number(item.price) });
            toast.success(`${name} +1`);
          }}
          className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full bg-espresso px-4 py-2 text-sm font-semibold text-espresso-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {item.available ? <><Plus className="h-4 w-4" /> {t("addToCart")}</> : t("unavailable")}
        </button>
      </div>
    </article>
  );
}
