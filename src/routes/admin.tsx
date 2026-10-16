import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type DictKey } from "@/lib/i18n";
import { menuQuery, type MenuItem } from "@/lib/menu";
import { formatMKD } from "@/lib/pricing";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Админ панел — Кафич Зрно" },
      { name: "description", content: "Управување со нарачки и мени на кафич Зрно." },
      { property: "og:title", content: "Админ панел — Кафич Зрно" },
      { property: "og:description", content: "Управување со нарачки и мени." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const field = "mt-1 h-10 w-full rounded-xl border bg-card px-3 outline-none focus:ring-2 focus:ring-ring";
const btn = "rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50";

function AdminPage() {
  const { t } = useI18n();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  if (!ready) return null;
  if (!session) return <AuthForm />;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-semibold">{t("admin")}</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{session.user.email}</span>
          <button className={`${btn} border`} onClick={() => supabase.auth.signOut()}>{t("signOut")}</button>
        </div>
      </div>
      {isAdmin === false && <p className="mt-8 rounded-xl bg-destructive/10 p-4 text-destructive">{t("notAdmin")}</p>}
      {isAdmin && <Dashboard />}
    </div>
  );
}

function AuthForm() {
  const { t } = useI18n();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
    setBusy(false);
    if (res.error) { toast.error(res.error.message); return; }
    if (mode === "up" && !res.data.session) toast.success(t("checkEmail"));
  }
  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <form onSubmit={submit} className="rounded-2xl border bg-card p-6 shadow-warm">
        <h1 className="text-2xl font-semibold">{mode === "in" ? t("signIn") : t("signUp")}</h1>
        <label className="mt-4 block text-sm font-medium">{t("email")}
          <input type="email" required className={field} value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="mt-3 block text-sm font-medium">{t("password")}
          <input type="password" required minLength={6} className={field} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button disabled={busy} className={`${btn} mt-5 w-full bg-primary text-primary-foreground`}>{mode === "in" ? t("signIn") : t("signUp")}</button>
        <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-3 w-full text-sm text-primary">
          {mode === "in" ? t("signUp") : t("signIn")}
        </button>
      </form>
    </div>
  );
}

function Dashboard() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"orders" | "menu">("orders");
  const tabCls = (a: boolean) => `${btn} ${a ? "bg-espresso text-espresso-foreground" : "bg-secondary"}`;
  return (
    <>
      <div className="mt-6 flex gap-2">
        <button className={tabCls(tab === "orders")} onClick={() => setTab("orders")}>{t("orders")}</button>
        <button className={tabCls(tab === "menu")} onClick={() => setTab("menu")}>{t("menuMgmt")}</button>
      </div>
      {tab === "orders" ? <OrdersPanel /> : <MenuPanel />}
    </>
  );
}

const statuses = ["pending", "preparing", "ready", "completed", "cancelled"] as const;

function OrdersPanel() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => {
    const ch = supabase.channel("orders-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => qc.invalidateQueries({ queryKey: ["admin-orders"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  async function setStatus(id: string, status: (typeof statuses)[number]) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  }

  if (orders.length === 0) return <p className="mt-8 text-muted-foreground">{t("noOrders")}</p>;
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {orders.map((o) => (
        <div key={o.id} className="rounded-2xl border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold">#{o.id.slice(0, 8).toUpperCase()} · {o.customer_name}</p>
              <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()} · {o.phone}{o.table_number ? ` · ${t("table").split(" (")[0]} ${o.table_number}` : ""}</p>
            </div>
            <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value as (typeof statuses)[number])} className="rounded-full border bg-background px-3 py-1 text-sm">
              {statuses.map((s) => <option key={s} value={s}>{t(s as DictKey)}</option>)}
            </select>
          </div>
          <ul className="mt-3 text-sm">
            {o.order_items.map((it) => <li key={it.id}>{it.quantity} × {lang === "mk" ? it.name_mk : it.name_en}</li>)}
          </ul>
          {o.note && <p className="mt-2 rounded-lg bg-muted p-2 text-sm italic">{o.note}</p>}
          <p className="mt-2 text-right font-semibold text-primary">{formatMKD(Number(o.total))}</p>
        </div>
      ))}
    </div>
  );
}

type Draft = Omit<MenuItem, "id" | "created_at"> & { id?: string };

function MenuPanel() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const { data } = useQuery(menuQuery);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  if (!data) return null;
  const refresh = () => qc.invalidateQueries({ queryKey: ["menu"] });

  const blank = (): Draft => ({
    category_id: data.categories[0]?.id ?? "", name_mk: "", name_en: "", description_mk: "", description_en: "",
    price: 0, image_url: "", available: true,
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    const { id, ...rest } = draft;
    const payload = { ...rest, price: Number(rest.price), image_url: rest.image_url || null };
    const { error } = id
      ? await supabase.from("menu_items").update(payload).eq("id", id)
      : await supabase.from("menu_items").insert(payload);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("save") + " ✓");
    setDraft(null);
    refresh();
  }

  async function del(id: string) {
    if (!confirm(t("delete") + "?")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    refresh();
  }

  async function toggle(i: MenuItem) {
    const { error } = await supabase.from("menu_items").update({ available: !i.available }).eq("id", i.id);
    if (error) { toast.error(error.message); return; }
    refresh();
  }

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));

  return (
    <div className="mt-6">
      <button className={`${btn} bg-primary text-primary-foreground`} onClick={() => setDraft(blank())}>+ {t("newItem")}</button>
      {draft && (
        <form onSubmit={save} className="mt-4 grid gap-3 rounded-2xl border bg-card p-5 sm:grid-cols-2">
          <label className="text-sm font-medium">{t("nameMk")}<input required className={field} value={draft.name_mk} onChange={(e) => set("name_mk", e.target.value)} /></label>
          <label className="text-sm font-medium">{t("nameEn")}<input required className={field} value={draft.name_en} onChange={(e) => set("name_en", e.target.value)} /></label>
          <label className="text-sm font-medium">{t("descMk")}<input className={field} value={draft.description_mk} onChange={(e) => set("description_mk", e.target.value)} /></label>
          <label className="text-sm font-medium">{t("descEn")}<input className={field} value={draft.description_en} onChange={(e) => set("description_en", e.target.value)} /></label>
          <label className="text-sm font-medium">{t("price")}<input required type="number" min={0} step="1" className={field} value={draft.price} onChange={(e) => set("price", Number(e.target.value))} /></label>
          <label className="text-sm font-medium">{t("category")}
            <select className={field} value={draft.category_id} onChange={(e) => set("category_id", e.target.value)}>
              {data.categories.map((c) => <option key={c.id} value={c.id}>{lang === "mk" ? c.name_mk : c.name_en}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium sm:col-span-2">{t("image")}<input type="url" className={field} value={draft.image_url ?? ""} onChange={(e) => set("image_url", e.target.value)} /></label>
          <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={draft.available} onChange={(e) => set("available", e.target.checked)} /> {t("available")}</label>
          <div className="flex gap-2 sm:col-span-2">
            <button disabled={busy} className={`${btn} bg-primary text-primary-foreground`}>{t("save")}</button>
            <button type="button" className={`${btn} border`} onClick={() => setDraft(null)}>{t("cancel")}</button>
          </div>
        </form>
      )}
      <div className="mt-4 overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <tbody className="divide-y">
            {data.items.map((i) => (
              <tr key={i.id}>
                <td className="p-3 font-medium">{lang === "mk" ? i.name_mk : i.name_en}</td>
                <td className="p-3">{formatMKD(Number(i.price))}</td>
                <td className="p-3"><button onClick={() => toggle(i)} className={`rounded-full px-2 py-0.5 text-xs font-semibold ${i.available ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{i.available ? t("available") : t("unavailable")}</button></td>
                <td className="whitespace-nowrap p-3 text-right">
                  <button className="mr-3 text-primary" onClick={() => setDraft({ ...i })}>{t("edit")}</button>
                  <button className="text-destructive" onClick={() => del(i.id)}>{t("delete")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
