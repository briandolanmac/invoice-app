-- Tour Invoices App initial schema.
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  customer_code text,
  billing_address text,
  contact_name text,
  contact_email text,
  payment_terms text default 'Due on receipt',
  default_invoice_prefix text default 'RD',
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists agencies_name_unique
on public.agencies (lower(name));

create table if not exists public.rate_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'service',
  default_rate numeric(10, 2),
  unit text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists rate_settings_name_unique
on public.rate_settings (lower(name));

create table if not exists public.tour_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  description text,
  default_rate numeric(10, 2),
  default_unit text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tour_templates_name_unique
on public.tour_templates (lower(name));

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid references public.agencies(id) on delete set null,
  invoice_number text not null unique,
  invoice_date date not null default current_date,
  due_date date,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'void')),
  customer_reference text,
  tour_group_name text,
  notes text,
  payment_instructions text,
  subtotal_amount numeric(10, 2) not null default 0,
  expense_amount numeric(10, 2) not null default 0,
  total_amount numeric(10, 2) not null default 0,
  pdf_storage_path text,
  copied_from_invoice_id uuid references public.invoices(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  line_date date,
  item_type text not null default 'service' check (item_type in ('service', 'expense', 'tip', 'adjustment')),
  description text not null,
  quantity numeric(10, 2) not null default 1,
  unit text,
  unit_price numeric(10, 2) not null default 0,
  line_total numeric(10, 2) generated always as (quantity * unit_price) stored,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_files (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices(id) on delete cascade,
  storage_bucket text not null default 'invoice-application',
  storage_path text not null,
  file_name text not null,
  file_type text not null default 'application/pdf',
  file_role text not null default 'generated_pdf' check (file_role in ('generated_pdf', 'uploaded_archive')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.agencies enable row level security;
alter table public.rate_settings enable row level security;
alter table public.tour_templates enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_line_items enable row level security;
alter table public.invoice_files enable row level security;

drop policy if exists "Authenticated users can read profiles" on public.profiles;
create policy "Authenticated users can read profiles"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can manage agencies" on public.agencies;
create policy "Authenticated users can manage agencies"
  on public.agencies for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can manage rates" on public.rate_settings;
create policy "Authenticated users can manage rates"
  on public.rate_settings for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can manage tour templates" on public.tour_templates;
create policy "Authenticated users can manage tour templates"
  on public.tour_templates for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can manage invoices" on public.invoices;
create policy "Authenticated users can manage invoices"
  on public.invoices for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can manage invoice line items" on public.invoice_line_items;
create policy "Authenticated users can manage invoice line items"
  on public.invoice_line_items for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can manage invoice files" on public.invoice_files;
create policy "Authenticated users can manage invoice files"
  on public.invoice_files for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can manage invoice PDFs" on storage.objects;
create policy "Authenticated users can manage invoice PDFs"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'invoice-application')
  with check (bucket_id = 'invoice-application');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email),
    'user'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists create_profile_on_signup on auth.users;
create trigger create_profile_on_signup
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists agencies_set_updated_at on public.agencies;
create trigger agencies_set_updated_at
before update on public.agencies
for each row execute function public.set_updated_at();

drop trigger if exists invoices_set_updated_at on public.invoices;
create trigger invoices_set_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

drop trigger if exists invoice_line_items_set_updated_at on public.invoice_line_items;
create trigger invoice_line_items_set_updated_at
before update on public.invoice_line_items
for each row execute function public.set_updated_at();

-- Standard/reusable line-item descriptions per agency (e.g. JTB's tour
-- codes), added 2026-08-13. Offered as a datalist dropdown on the
-- description field when creating/editing an invoice for that agency.
create table if not exists public.agency_line_item_presets (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  description text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.agency_line_item_presets enable row level security;

drop policy if exists "Authenticated users can manage agency presets" on public.agency_line_item_presets;
create policy "Authenticated users can manage agency presets"
  on public.agency_line_item_presets for all
  to authenticated
  using (true)
  with check (true);

drop trigger if exists agency_line_item_presets_set_updated_at on public.agency_line_item_presets;
create trigger agency_line_item_presets_set_updated_at
before update on public.agency_line_item_presets
for each row execute function public.set_updated_at();

insert into public.agencies (name, customer_code, billing_address, payment_terms, default_invoice_prefix)
values
  ('JTB USA Inc.', 'JTB', '3625 Del Amo Blvd., Ste 260, Torrance, CA 90503', 'Due on receipt', 'RD'),
  ('NY VIP Insight LLC', 'NYVIP', '447 Broadway, 2nd Floor Suite 394, New York, NY 10013', 'Due on receipt', 'RD'),
  ('Aquestro Inc.', 'AQUESTRO', '168 Bowers St, Jersey City, NJ 07307', 'Due on receipt', 'RDAQ')
on conflict do nothing;

insert into public.rate_settings (name, category, default_rate, unit, notes)
values
  ('Standard guide hourly rate', 'service', 40.00, 'hour', 'JSG tariff hourly rate.'),
  ('Museum tour hourly rate', 'service', 50.00, 'hour', 'Special museum tour rate.'),
  ('Tip hourly rate', 'tip', 5.00, 'hour', 'Suggested hourly tip line.'),
  ('Subway / MTA ticket', 'expense', 3.00, 'ticket', 'Typical subway fare.'),
  ('AirTrain JFK', 'expense', 8.50, 'ticket', 'Typical AirTrain fare.')
on conflict do nothing;
