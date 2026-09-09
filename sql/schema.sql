-- Esquema inicial para Supabase/PostgreSQL.
-- Todavía no incluye autenticación ni políticas RLS definitivas.

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'STARTED',
  result text,
  template text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists applicants (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  first_name text,
  last_name text,
  document_number text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists application_answers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  question_id text not null,
  answer_text text,
  answer_number numeric,
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  zapsign_document_id text,
  template text,
  status text,
  sign_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id) on delete set null,
  event_type text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);
