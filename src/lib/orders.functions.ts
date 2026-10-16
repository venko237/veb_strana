import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { computeOrderTotal } from "./pricing";

const orderInput = z.object({
  customerName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(6).max(30).regex(/^[0-9+\s()-]+$/),
  tableNumber: z.string().trim().max(10).optional().or(z.literal("")),
  note: z.string().trim().max(500).optional().or(z.literal("")),
  lines: z.array(z.object({ id: z.string().uuid(), quantity: z.number().int() })).min(1).max(50),
});

/** Public: creates an order. Prices are always re-read from the database. */
export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => orderInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ids = data.lines.map((l) => l.id);
    const { data: items, error } = await supabaseAdmin
      .from("menu_items")
      .select("id, name_mk, name_en, price, available")
      .in("id", ids);
    if (error) throw new Error("DB_ERROR");
    const total = computeOrderTotal(
      data.lines,
      (items ?? []).map((i) => ({ id: i.id, price: Number(i.price), available: i.available })),
    );
    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: data.customerName,
        phone: data.phone,
        table_number: data.tableNumber || null,
        note: data.note || null,
        total,
      })
      .select("id")
      .single();
    if (oErr || !order) throw new Error("DB_ERROR");
    const byId = new Map((items ?? []).map((i) => [i.id, i]));
    const { error: iErr } = await supabaseAdmin.from("order_items").insert(
      data.lines.map((l) => {
        const it = byId.get(l.id)!;
        return {
          order_id: order.id,
          menu_item_id: it.id,
          name_mk: it.name_mk,
          name_en: it.name_en,
          unit_price: Number(it.price),
          quantity: l.quantity,
        };
      }),
    );
    if (iErr) {
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      throw new Error("DB_ERROR");
    }
    return { id: order.id };
  });

/** Public: order status lookup by its unguessable id (no phone/name returned). */
export const getOrderStatus = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, status, total, created_at, table_number, order_items(name_mk, name_en, unit_price, quantity)")
      .eq("id", data.id)
      .maybeSingle();
    return order;
  });
