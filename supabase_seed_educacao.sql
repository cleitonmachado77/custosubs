-- SICM-Educacao: Seed simplificado
-- Execute APOS o supabase_schema_educacao.sql
-- IMPORTANTE: Substitua o municipio_id abaixo pelo UUID real do seu municipio no Supabase
-- Para descobrir: SELECT id, nome FROM municipios;

-- Se Londrina nao existe ainda, crie:
INSERT INTO municipios (id, nome, estado, habitantes)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Londrina', 'PR', 580870)
ON CONFLICT (id) DO NOTHING;

-- Limpa dados anteriores (caso re-execute)
DELETE FROM edu_itens_custo WHERE escola_id IN ('e001a000-0000-0000-0000-000000000001','e001a000-0000-0000-0000-000000000002','e001a000-0000-0000-0000-000000000003');
DELETE FROM edu_funcionarios WHERE escola_id IN ('e001a000-0000-0000-0000-000000000001','e001a000-0000-0000-0000-000000000002','e001a000-0000-0000-0000-000000000003');
DELETE FROM edu_desempenho WHERE escola_id IN ('e001a000-0000-0000-0000-000000000001','e001a000-0000-0000-0000-000000000002','e001a000-0000-0000-0000-000000000003');
DELETE FROM edu_infraestrutura WHERE escola_id IN ('e001a000-0000-0000-0000-000000000001','e001a000-0000-0000-0000-000000000002','e001a000-0000-0000-0000-000000000003');
DELETE FROM escolas WHERE id IN ('e001a000-0000-0000-0000-000000000001','e001a000-0000-0000-0000-000000000002','e001a000-0000-0000-0000-000000000003');

-- 3 Escolas
INSERT INTO escolas (id, nome, endereco, codigo_inep, nivel_ensino, zona, num_alunos, num_professores, num_funcionarios, nse_nivel, nse_valor, infraestrutura_indice, municipio_id) VALUES
('e001a000-0000-0000-0000-000000000001', 'E.M. Carlos Drummond de Andrade', 'Rua das Acacias, 150', '41012345', 'fundamental_ai', 'urbana', 420, 22, 12, 'IV', 55.2, 7.8, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('e001a000-0000-0000-0000-000000000002', 'E.M. Monteiro Lobato', 'Av. Brasil, 2200', '41012346', 'fundamental_ai', 'urbana', 380, 20, 10, 'V', 62.5, 8.5, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('e001a000-0000-0000-0000-000000000003', 'E.M. Darcy Ribeiro', 'Estrada Rural km 12', '41012352', 'fundamental_ai', 'rural', 85, 6, 4, 'II', 35.8, 5.0, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');

-- Funcionarios Escola 1 (mes 3, ano 2026)
INSERT INTO edu_funcionarios (escola_id, nome, cargo, tipo_custo, vinculo, salario, mes, ano) VALUES
('e001a000-0000-0000-0000-000000000001', 'Maria Silva', 'Professor', 'pedagogico', 'concursado', 4850.00, 3, 2026),
('e001a000-0000-0000-0000-000000000001', 'Joao Oliveira', 'Professor', 'pedagogico', 'concursado', 4850.00, 3, 2026),
('e001a000-0000-0000-0000-000000000001', 'Ana Ferreira', 'Professor', 'pedagogico', 'clt', 4200.00, 3, 2026),
('e001a000-0000-0000-0000-000000000001', 'Rosana Costa', 'Cozinheira', 'social', 'concursado', 2100.00, 3, 2026),
('e001a000-0000-0000-0000-000000000001', 'Sandra Melo', 'Secretaria', 'administrativo', 'concursado', 3200.00, 3, 2026),
('e001a000-0000-0000-0000-000000000001', 'Jose Antonio', 'Zelador', 'administrativo', 'concursado', 2100.00, 3, 2026);

-- Funcionarios Escola 2
INSERT INTO edu_funcionarios (escola_id, nome, cargo, tipo_custo, vinculo, salario, mes, ano) VALUES
('e001a000-0000-0000-0000-000000000002', 'Patricia Gomes', 'Professor', 'pedagogico', 'concursado', 5200.00, 3, 2026),
('e001a000-0000-0000-0000-000000000002', 'Ricardo Souza', 'Professor', 'pedagogico', 'concursado', 4850.00, 3, 2026),
('e001a000-0000-0000-0000-000000000002', 'Camila Araujo', 'Professor', 'pedagogico', 'clt', 4200.00, 3, 2026),
('e001a000-0000-0000-0000-000000000002', 'Vanessa Dias', 'Cozinheira', 'social', 'concursado', 2100.00, 3, 2026),
('e001a000-0000-0000-0000-000000000002', 'Claudia Ramos', 'Secretaria', 'administrativo', 'concursado', 3200.00, 3, 2026);

-- Funcionarios Escola 3 (rural, menor)
INSERT INTO edu_funcionarios (escola_id, nome, cargo, tipo_custo, vinculo, salario, mes, ano) VALUES
('e001a000-0000-0000-0000-000000000003', 'Solange Bonfim', 'Professor', 'pedagogico', 'concursado', 4850.00, 3, 2026),
('e001a000-0000-0000-0000-000000000003', 'Valdomiro Leal', 'Professor', 'pedagogico', 'concursado', 4850.00, 3, 2026),
('e001a000-0000-0000-0000-000000000003', 'Iracema Borges', 'Cozinheira', 'social', 'concursado', 2100.00, 3, 2026),
('e001a000-0000-0000-0000-000000000003', 'Benedito Souza', 'Zelador', 'administrativo', 'concursado', 2100.00, 3, 2026);

-- Itens de Custo Escola 1
INSERT INTO edu_itens_custo (escola_id, categoria, nome, valor, mes, ano) VALUES
('e001a000-0000-0000-0000-000000000001', 'material_pedagogico', 'Material escolar', 1200.00, 3, 2026),
('e001a000-0000-0000-0000-000000000001', 'material_pedagogico', 'Livros didaticos', 850.00, 3, 2026),
('e001a000-0000-0000-0000-000000000001', 'merenda', 'Generos alimenticios', 9300.00, 3, 2026),
('e001a000-0000-0000-0000-000000000001', 'despesa_fixa', 'Energia eletrica', 2100.00, 3, 2026),
('e001a000-0000-0000-0000-000000000001', 'despesa_fixa', 'Agua e esgoto', 680.00, 3, 2026),
('e001a000-0000-0000-0000-000000000001', 'despesa_fixa', 'Internet', 450.00, 3, 2026),
('e001a000-0000-0000-0000-000000000001', 'terceirizado', 'Vigilancia noturna', 3500.00, 3, 2026);

-- Itens de Custo Escola 2
INSERT INTO edu_itens_custo (escola_id, categoria, nome, valor, mes, ano) VALUES
('e001a000-0000-0000-0000-000000000002', 'material_pedagogico', 'Material escolar', 1100.00, 3, 2026),
('e001a000-0000-0000-0000-000000000002', 'merenda', 'Generos alimenticios', 8300.00, 3, 2026),
('e001a000-0000-0000-0000-000000000002', 'despesa_fixa', 'Energia eletrica', 1900.00, 3, 2026),
('e001a000-0000-0000-0000-000000000002', 'despesa_fixa', 'Agua', 580.00, 3, 2026),
('e001a000-0000-0000-0000-000000000002', 'despesa_fixa', 'Internet', 450.00, 3, 2026),
('e001a000-0000-0000-0000-000000000002', 'terceirizado', 'Vigilancia', 3500.00, 3, 2026);

-- Itens de Custo Escola 3 (rural)
INSERT INTO edu_itens_custo (escola_id, categoria, nome, valor, mes, ano) VALUES
('e001a000-0000-0000-0000-000000000003', 'material_pedagogico', 'Material escolar', 350.00, 3, 2026),
('e001a000-0000-0000-0000-000000000003', 'merenda', 'Generos alimenticios', 1800.00, 3, 2026),
('e001a000-0000-0000-0000-000000000003', 'despesa_fixa', 'Energia eletrica', 650.00, 3, 2026),
('e001a000-0000-0000-0000-000000000003', 'despesa_fixa', 'Agua (poco artesiano)', 180.00, 3, 2026);

-- Desempenho (IDEB 2023)
INSERT INTO edu_desempenho (escola_id, ano_referencia, ideb, nota_portugues, nota_matematica, taxa_aprovacao, taxa_reprovacao, taxa_abandono) VALUES
('e001a000-0000-0000-0000-000000000001', 2023, 6.2, 215.4, 228.7, 95.2, 3.8, 1.0),
('e001a000-0000-0000-0000-000000000002', 2023, 7.1, 232.8, 245.3, 97.5, 2.0, 0.5),
('e001a000-0000-0000-0000-000000000003', 2023, 5.0, 190.2, 202.8, 90.0, 7.0, 3.0);
