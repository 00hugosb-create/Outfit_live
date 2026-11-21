-- Pega esto en Supabase > SQL Editor > Run
create table items (
  id bigint generated always as identity primary key,
  category text not null, color text not null,
  name text default '', photo text not null,
  created timestamptz default now()
);
create table week_plan (day int primary key, item_ids text not null);
create table favorites (
  id bigint generated always as identity primary key,
  name text not null, item_ids text not null,
  created timestamptz default now()
);
alter table items enable row level security;
alter table week_plan enable row level security;
alter table favorites enable row level security;
create policy "solo logueados" on items for all to authenticated using (true) with check (true);
create policy "solo logueados" on week_plan for all to authenticated using (true) with check (true);
create policy "solo logueados" on favorites for all to authenticated using (true) with check (true);

-- Bucket de fotos (público para mostrar las imágenes; solo logueados pueden subir/borrar)
insert into storage.buckets (id, name, public) values ('prendas', 'prendas', true);
create policy "subir y borrar logueados" on storage.objects for all to authenticated
  using (bucket_id = 'prendas') with check (bucket_id = 'prendas');
