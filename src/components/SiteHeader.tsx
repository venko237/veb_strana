import { Link } from "@tanstack/react-router";
import { Coffee, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";

export function SiteHeader() {
  const { t, lang, setLang } = useI18n();
  const { count } = useCart();
  const link = "rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";
  const active = { className: "bg-secondary text-foreground" };
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold">
          <Coffee className="h-6 w-6 text-primary" /> Зрно
        </Link>
        <nav className="flex items-center gap-1">
          <Link to="/" className={`${link} hidden sm:inline-flex`} activeProps={active} activeOptions={{ exact: true }}>{t("home")}</Link>
          <Link to="/menu" className={link} activeProps={active}>{t("menu")}</Link>
          <Link to="/admin" className={link} activeProps={active}>{t("admin")}</Link>
          <button
            onClick={() => setLang(lang === "mk" ? "en" : "mk")}
            className="rounded-full border px-2.5 py-1 text-xs font-semibold uppercase"
            aria-label="Change language"
          >
            {lang === "mk" ? "EN" : "МК"}
          </button>
          <Link to="/cart" className="relative ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-espresso text-espresso-foreground" aria-label={t("cart")}>
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">{count}</span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="mt-20 bg-espresso text-espresso-foreground">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="font-display text-2xl">Зрно</p>
          <p className="mt-1 text-sm opacity-70">Specialty coffee · Skopje</p>
        </div>
        <div><p className="text-sm font-semibold">{t("hours")}</p><p className="text-sm opacity-70">{t("hoursText")}</p></div>
        <div><p className="text-sm font-semibold">{t("address")}</p><p className="text-sm opacity-70">{t("addressText")}</p></div>
      </div>
    </footer>
  );
}
