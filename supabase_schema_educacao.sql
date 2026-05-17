-- ============================================================
-- SICM-Educação: Sistema de Custos Municipais - Educação
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- ─── Escolas ─────────────────────────────────────────────────
create table if not exists escolas (
  id                    uuid primary key default gen_random_uuid(),
  nome                  text not null,
  endereco              text not null,
  codigo_inep           varchar(8),
  nivel_ensino          text not null default 'fundamental_ai' check (
    nivel_ensino in ('infantil','fundamental_ai','fundamental_af','medio')
  ),
  zona                  text not null default 'urbana' check (zona in ('urbana','rural')),
  num_alunos            integer not null check (num_alunos >= 0),
  num_professores       integer not null check (num_professores >= 0),
  num_funcionarios      integer not null check (num_funcionarios >= 0),
  nse_nivel             text check (nse_nivel in ('I','II','III','IV','V','VI','VII')),
  nse_valor             numeric(5,2),
  infraestrutura_indice numeric(5,2) check (infraestrutura_indice between 0 and 10),
  municipio_id          uuid not null references municipios(id) on delete cascade,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- ─── Funcionários da Educação ────────────────────────────────
create table if not exists edu_funcionarios (
  id         uuid primary key default gen_random_uuid(),
  escola_id  uuid not null references escolas(id) on delete cascade,
  nome       text not null,
  cargo      text not null,
  tipo_custo text not null default 'pedagogico' check (
    tipo_custo in ('pedagogico','social','administrativo')
  ),
  vinculo    text not null default 'concursado' check (
    vinculo in ('concursado','clt','terceirizado')
  ),
  salario    numeric(12,2) not null check (salario >= 0),
  mes        integer not null check (mes between 1 and 12),
  ano        integer not null check (ano >= 2000),
  created_at timestamptz default now()
);

-- ─── Itens de Custo da Educação ──────────────────────────────
-- Categorias: material_pedagogico, merenda, despesa_fixa, terceirizado
create table if not exists edu_itens_custo (
  id         uuid primary key default gen_random_uuid(),
  escola_id  uuid not null references escolas(id) on delete cascade,
  categoria  text not null check (
    categoria in ('material_pedagogico','merenda','despesa_fixa','terceirizado')
  ),
  nome       text not null,
  valor      numeric(12,2) not null check (valor >= 0),
  mes        integer not null check (mes between 1 and 12),
  ano        integer not null check (ano >= 2000),
  created_at timestamptz default now()
);

-- ─── Desempenho Educacional ──────────────────────────────────
create table if not exists edu_desempenho (
  id                    uuid primary key default gen_random_uuid(),
  escola_id             uuid not null references escolas(id) on delete cascade,
  ano_referencia        integer not null check (ano_referencia >= 2005),
  ideb                  numeric(4,2) check (ideb between 0 and 10),
  nota_portugues        numeric(5,2),
  nota_matematica       numeric(5,2),
  taxa_aprovacao        numeric(5,2) check (taxa_aprovacao between 0 and 100),
  taxa_reprovacao       numeric(5,2) check (taxa_reprovacao between 0 and 100),
  taxa_abandono         numeric(5,2) check (taxa_abandono between 0 and 100),
  aprendizado_adequado_port numeric(5,2) check (aprendizado_adequado_port between 0 and 100),
  aprendizado_adequado_mat  numeric(5,2) check (aprendizado_adequado_mat between 0 and 100),
  created_at            timestamptz default now()
);

-- ─── Infraestrutura Escolar (detalhamento) ───────────────────
create table if not exists edu_infraestrutura (
  id                    uuid primary key default gen_random_uuid(),
  escola_id             uuid not null references escolas(id) on delete cascade,
  -- Acesso a Serviços
  agua_rede_publica     boolean default false,
  energia_eletrica      boolean default false,
  esgoto_rede_publica   boolean default false,
  coleta_lixo           boolean default false,
  -- Instalações
  agua_filtrada         boolean default false,
  sala_diretoria        boolean default false,
  sala_professores      boolean default false,
  secretaria            boolean default false,
  refeitorio            boolean default false,
  cozinha               boolean default false,
  biblioteca            boolean default false,
  lab_informatica       boolean default false,
  lab_ciencias          boolean default false,
  quadra_esportes       boolean default false,
  parque_infantil       boolean default false,
  -- Equipamentos
  computadores          boolean default false,
  internet              boolean default false,
  tv_dvd                boolean default false,
  projetor              boolean default false,
  -- Acessibilidade
  acessibilidade        boolean default false,
  sala_atendimento_especial boolean default false,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- ─── Índices ──────────────────────────────────────────────────
create index if not exists idx_escolas_municipio         on escolas(municipio_id);
create index if not exists idx_edu_funcionarios_escola   on edu_funcionarios(escola_id);
create index if not exists idx_edu_funcionarios_periodo  on edu_funcionarios(ano, mes);
create index if not exists idx_edu_funcionarios_tipo     on edu_funcionarios(tipo_custo);
create index if not exists idx_edu_itens_custo_escola    on edu_itens_custo(escola_id);
create index if not exists idx_edu_itens_custo_cat       on edu_itens_custo(categoria);
create index if not exists idx_edu_itens_custo_periodo   on edu_itens_custo(ano, mes);
create index if not exists idx_edu_desempenho_escola     on edu_desempenho(escola_id);
create index if not exists idx_edu_desempenho_ano        on edu_desempenho(ano_referencia);
create index if not exists idx_edu_infraestrutura_escola on edu_infraestrutura(escola_id);

-- ─── Row Level Security ───────────────────────────────────────
alter table escolas             enable row level security;
alter table edu_funcionarios    enable row level security;
alter table edu_itens_custo     enable row level security;
alter table edu_desempenho      enable row level security;
alter table edu_infraestrutura  enable row level security;

create policy "allow_all_escolas"          on escolas            for all using (true) with check (true);
create policy "allow_all_edu_funcionarios" on edu_funcionarios   for all using (true) with check (true);
create policy "allow_all_edu_itens_custo"  on edu_itens_custo    for all using (true) with check (true);
create policy "allow_all_edu_desempenho"   on edu_desempenho     for all using (true) with check (true);
create policy "allow_all_edu_infraestrutura" on edu_infraestrutura for all using (true) with check (true);
