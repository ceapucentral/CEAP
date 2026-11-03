-- TABLA DE CONFIGURACIÓN DE ACCESO INSTITUCIONAL
create table if not exists public.system_settings (
  key text primary key,
  value text not null
);
insert into public.system_settings (key, value) 
values ('institutional_domain', '@ucen.cl')
on conflict (key) do nothing;

-- TABLA DE CONVOCATORIAS
create table if not exists public.convocatorias (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  organization text not null,
  type text not null check (type in ('Becas', 'Prácticas', 'Fondos', 'Voluntariado')),
  deadline date not null,
  description text not null,
  link text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- TABLA DE TALLERES Y HORARIOS
create table if not exists public.workshops (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  instructor text not null,
  day_of_week text not null,
  start_time time not null,
  end_time time not null,
  room text not null,
  slots integer default 25,
  enrolled integer default 0
);

-- SEGURIDAD ROW LEVEL SECURITY (RLS)
alter table public.convocatorias enable row level security;
alter table public.workshops enable row level security;

-- Cualquier persona puede leer las convocatorias y talleres
create policy "Lectura pública de convocatorias" on public.convocatorias for select using (true);
create policy "Lectura pública de talleres" on public.workshops for select using (true);

-- Solo administradores autenticados pueden insertar o modificar
create policy "Admin insertar convocatorias" on public.convocatorias for insert 
with check (auth.jwt() ->> 'email' like '%@ucen.cl');
