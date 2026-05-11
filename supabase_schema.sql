-- ============================================================
-- Sistema de Custos de Saúde por UBS
-- Execute este script no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/ycmeqpshnfumczpjplgc/sql/new
-- ============================================================

-- ─── Municípios ──────────────────────────────────────────────
create table if not exists municipios (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  estado      varchar(2) not null,
  habitantes  integer not null check (habitantes > 0),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─── UBS ─────────────────────────────────────────────────────
create table if not exists ubs (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  endereco     text not null,
  cnes         varchar(7) check (cnes ~ '^\d{7}$'),
  municipio_id uuid not null references municipios(id) on delete cascade,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ─── Funcionários ────────────────────────────────────────────
create table if not exists funcionarios (
  id         uuid primary key default gen_random_uuid(),
  ubs_id     uuid not null references ubs(id) on delete cascade,
  nome       text not null,
  cargo      text not null,
  vinculo    text not null default 'concursado' check (vinculo in ('concursado','clt','terceirizado')),
  salario    numeric(12,2) not null check (salario >= 0),
  mes        integer not null check (mes between 1 and 12),
  ano        integer not null check (ano >= 2000),
  created_at timestamptz default now()
);

-- ─── Produção (Eventos) ───────────────────────────────────────
create table if not exists producao_eventos (
  id                       uuid primary key default gen_random_uuid(),
  ubs_id                   uuid not null references ubs(id) on delete cascade,
  evento                   text not null,
  quantidade_atendimentos  integer not null check (quantidade_atendimentos >= 0),
  responsaveis             text[],   -- nomes dos funcionários vinculados (opcional)
  mes                      integer not null check (mes between 1 and 12),
  ano                      integer not null check (ano >= 2000),
  created_at               timestamptz default now()
);

-- ─── Itens de Custo ───────────────────────────────────────────
-- Cobre: Materiais de Consumo, Insumos, Administrativos, Terceirizados
create table if not exists itens_custo (
  id         uuid primary key default gen_random_uuid(),
  ubs_id     uuid not null references ubs(id) on delete cascade,
  categoria  text not null check (
    categoria in ('material_consumo','insumo','administrativo','terceirizado')
  ),
  nome       text not null,
  valor      numeric(12,2) not null check (valor >= 0),
  mes        integer not null check (mes between 1 and 12),
  ano        integer not null check (ano >= 2000),
  created_at timestamptz default now()
);

-- ─── Migração: adicionar coluna cnes (execute se a tabela já existir) ────────
-- alter table ubs add column if not exists cnes varchar(7) check (cnes ~ '^\d{7}$');

-- ─── Migração: adicionar coluna vinculo em funcionarios ───────────────────────
-- alter table funcionarios add column if not exists vinculo text not null default 'concursado' check (vinculo in ('concursado','clt','terceirizado'));

-- ─── Migração: adicionar coluna responsaveis (execute se a tabela já existir) ─
-- alter table producao_eventos add column if not exists responsaveis text[];

-- ─── Índices ──────────────────────────────────────────────────
create index if not exists idx_ubs_municipio       on ubs(municipio_id);
create index if not exists idx_funcionarios_ubs    on funcionarios(ubs_id);
create index if not exists idx_funcionarios_periodo on funcionarios(ano, mes);
create index if not exists idx_producao_ubs        on producao_eventos(ubs_id);
create index if not exists idx_producao_periodo    on producao_eventos(ano, mes);
create index if not exists idx_itens_custo_ubs     on itens_custo(ubs_id);
create index if not exists idx_itens_custo_cat     on itens_custo(categoria);
create index if not exists idx_itens_custo_periodo on itens_custo(ano, mes);

-- ─── Row Level Security ───────────────────────────────────────
alter table municipios      enable row level security;
alter table ubs             enable row level security;
alter table funcionarios    enable row level security;
alter table producao_eventos enable row level security;
alter table itens_custo     enable row level security;

-- Políticas permissivas (acesso público para leitura e escrita)
-- Ajuste conforme necessidade de autenticação futura
create policy "allow_all_municipios"  on municipios       for all using (true) with check (true);
create policy "allow_all_ubs"         on ubs              for all using (true) with check (true);
create policy "allow_all_funcionarios" on funcionarios     for all using (true) with check (true);
create policy "allow_all_producao"    on producao_eventos for all using (true) with check (true);
create policy "allow_all_itens_custo" on itens_custo      for all using (true) with check (true);
