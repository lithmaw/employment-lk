create table if not exists public.orders (
  order_id text primary key,
  name text not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  status text not null,
  created_at timestamptz,
  paid_at timestamptz,
  ref_number text
);

create table if not exists public.applications (
  order_id text primary key references public.orders(order_id) on delete cascade,
  ref_number text not null,
  first_name text not null,
  last_name text not null,
  address text not null,
  city text not null,
  province text not null,
  postal text default '',
  dob text default '',
  gender text default '',
  nic text not null,
  phone text not null,
  passport_number text not null,
  passport_country text default 'Sri Lanka',
  passport_issue text default '',
  passport_expiry text not null,
  job_category text not null,
  passport_url text not null,
  birth_cert_url text not null,
  nic_url text not null,
  photo_url text not null,
  extra_urls jsonb not null default '[]'::jsonb,
  submitted_at timestamptz not null,
  status text not null
);

create index if not exists orders_email_idx on public.orders (email);
create index if not exists applications_ref_number_idx on public.applications (ref_number);
create index if not exists applications_nic_idx on public.applications (nic);

insert into storage.buckets (id, name, public)
values ('applications', 'applications', false)
on conflict (id) do nothing;
