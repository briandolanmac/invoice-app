alter table public.agency_line_item_presets
  add column if not exists item_type text not null default 'service' check (item_type in ('service', 'expense'));
