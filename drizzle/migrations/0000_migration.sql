create type public.app_role as enum ('admin');
create type public.order_status as enum ('pending','preparing','ready','completed','cancelled');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- first registered user becomes admin (demo convenience)
create or replace function public.handle_first_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users
for each row execute function public.handle_first_admin();

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_mk text not null,
  name_en text not null,
  sort_order int not null default 0
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "categories public read" on public.categories for select to anon, authenticated using (true);
create policy "categories admin write" on public.categories for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name_mk text not null,
  name_en text not null,
  description_mk text not null default '',
  description_en text not null default '',
  price numeric(10,2) not null check (price >= 0),
  image_url text,
  available boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.menu_items to anon, authenticated;
grant insert, update, delete on public.menu_items to authenticated;
grant all on public.menu_items to service_role;
alter table public.menu_items enable row level security;
create policy "menu public read" on public.menu_items for select to anon, authenticated using (true);
create policy "menu admin write" on public.menu_items for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (char_length(customer_name) between 2 and 100),
  phone text not null check (char_length(phone) between 6 and 30),
  table_number text,
  note text check (note is null or char_length(note) <= 500),
  total numeric(10,2) not null,
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now()
);
grant select, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "orders admin read" on public.orders for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "orders admin update" on public.orders for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "orders admin delete" on public.orders for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name_mk text not null,
  name_en text not null,
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity between 1 and 50)
);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "order items admin read" on public.order_items for select to authenticated using (public.has_role(auth.uid(),'admin'));

alter publication supabase_realtime add table public.orders;

insert into public.categories (slug,name_mk,name_en,sort_order) values
('coffee','Кафе','Coffee',1),('tea','Чај','Tea',2),('cold','Ладни пијалаци','Cold drinks',3),('desserts','Десерти','Desserts',4),('breakfast','Појадок','Breakfast',5);

insert into public.menu_items (category_id,name_mk,name_en,description_mk,description_en,price,image_url) values
((select id from public.categories where slug='coffee'),'Еспресо','Espresso','Краток и интензивен, од 100% арабика.','Short and intense, 100% arabica.',70,'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=800'),
((select id from public.categories where slug='coffee'),'Макијато','Macchiato','Еспресо со малку млечна пена.','Espresso with a dash of milk foam.',80,'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=800'),
((select id from public.categories where slug='coffee'),'Капучино','Cappuccino','Еспресо, топло млеко и густа пена.','Espresso, steamed milk and rich foam.',110,'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800'),
((select id from public.categories where slug='coffee'),'Лате','Latte','Нежно кафе со многу млеко.','Smooth coffee with plenty of milk.',120,'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=800'),
((select id from public.categories where slug='coffee'),'Флет вајт','Flat white','Двоен ристрето со свилено млеко.','Double ristretto with silky milk.',130,'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=800'),
((select id from public.categories where slug='tea'),'Зелен чај','Green tea','Јапонска сенча.','Japanese sencha.',90,'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800'),
((select id from public.categories where slug='tea'),'Планински чај','Mountain tea','Домашен чај од Шар Планина.','Local mountain tea from Shar Planina.',80,'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800'),
((select id from public.categories where slug='cold'),'Ледено кафе','Iced coffee','Ладно кафе со сладолед од ванила.','Cold coffee with vanilla ice cream.',150,'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800'),
((select id from public.categories where slug='cold'),'Домашна лимонада','Homemade lemonade','Свежо цедени лимони и нане.','Fresh lemons and mint.',120,'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=800'),
((select id from public.categories where slug='desserts'),'Чизкејк','Cheesecake','Со прелив од шумско овошје.','With forest fruit topping.',180,'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800'),
((select id from public.categories where slug='desserts'),'Кроасан со чоколадо','Chocolate croissant','Свежо печен секое утро.','Freshly baked every morning.',90,'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800'),
((select id from public.categories where slug='breakfast'),'Тост со авокадо','Avocado toast','Киселo тесто, авокадо, јајце.','Sourdough, avocado, egg.',220,'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=800'),
((select id from public.categories where slug='breakfast'),'Гранола со јогурт','Granola & yogurt','Домашна гранола, мед и овошје.','Homemade granola, honey and fruit.',190,'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800');