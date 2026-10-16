import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import hero from "@/assets/hero.jpg";
import { MenuCard } from "@/components/MenuCard";
import { useI18n } from "@/lib/i18n";
import { menuQuery } from "@/lib/menu";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Зрно — кафич во Скопје | Specialty coffee" },
      { name: "description", content: "Специјално кафе, десерти и онлајн нарачки во кафич Зрно, Скопје." },
      { property: "og:title", content: "Зрно — кафич во Скопје" },
      { property: "og:description", content: "Специјално кафе, десерти и онлајн нарачки." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(menuQuery),
  component: Index,
});

function Index() {
  const { t } = useI18n();
  const { data } = useSuspenseQuery(menuQuery);
  const featured = data.items.filter((i) => i.available).slice(0, 3);
  return (
    <>
      <section className="relative overflow-hidden">
        <img src={hero} alt="" width={1600} height={1008} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-espresso via-espresso/80 to-espresso/10" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:py-36">
          <h1 className="max-w-xl text-4xl font-semibold leading-tight text-espresso-foreground sm:text-6xl">{t("heroTitle")}</h1>
          <p className="mt-5 max-w-md text-espresso-foreground/80">{t("heroSub")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/menu" className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">{t("orderNow")}</Link>
            <Link to="/menu" className="rounded-full border border-espresso-foreground/40 px-6 py-3 font-semibold text-espresso-foreground">{t("seeMenu")}</Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 pt-16">
        <h2 className="text-3xl font-semibold">{t("featured")}</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((i) => <MenuCard key={i.id} item={i} />)}
        </div>
      </section>
    </>
  );
}
