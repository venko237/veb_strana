import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { MenuCard } from "@/components/MenuCard";
import { useI18n } from "@/lib/i18n";
import { menuQuery } from "@/lib/menu";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Мени — Кафич Зрно" },
      { name: "description", content: "Целото мени на кафич Зрно: кафе, чај, ладни пијалаци, десерти и појадок." },
      { property: "og:title", content: "Мени — Кафич Зрно" },
      { property: "og:description", content: "Пребарај и нарачај од нашето мени." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(menuQuery),
  component: MenuPage,
});

function MenuPage() {
  const { t, lang } = useI18n();
  const { data } = useSuspenseQuery(menuQuery);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return data.items.filter((i) => {
      if (cat && i.category_id !== cat) return false;
      if (!s) return true;
      return [i.name_mk, i.name_en, i.description_mk, i.description_en].some((f) => f.toLowerCase().includes(s));
    });
  }, [data.items, q, cat]);

  const pill = (activeP: boolean) =>
    `whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${activeP ? "bg-espresso text-espresso-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl font-semibold">{t("menu")}</h1>
      <div className="relative mt-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("search")}
          className="h-12 w-full rounded-full border bg-card pl-11 pr-4 outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        <button className={pill(cat === null)} onClick={() => setCat(null)}>{t("all")}</button>
        {data.categories.map((c) => (
          <button key={c.id} className={pill(cat === c.id)} onClick={() => setCat(c.id)}>
            {lang === "mk" ? c.name_mk : c.name_en}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="mt-12 text-center text-muted-foreground">{t("noResults")}</p>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((i) => <MenuCard key={i.id} item={i} />)}
        </div>
      )}
    </div>
  );
}
