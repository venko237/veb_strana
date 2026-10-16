import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type MenuItem = Tables<"menu_items">;
export type Category = Tables<"categories">;

export const menuQuery = queryOptions({
  queryKey: ["menu"],
  queryFn: async (): Promise<{ categories: Category[]; items: MenuItem[] }> => {
    const [cats, items] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("menu_items").select("*").order("created_at"),
    ]);
    if (cats.error) throw cats.error;
    if (items.error) throw items.error;
    return { categories: cats.data, items: items.data };
  },
});
