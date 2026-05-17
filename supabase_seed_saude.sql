-- ============================================================
-- SICM-Saude: Dados de exemplo para Londrina/PR
-- Usa o mesmo municipio_id do seed de educacao
-- Mes: Marco/2026
-- ============================================================

-- Usa municipio existente
INSERT INTO municipios (id, nome, estado, habitantes)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Londrina', 'PR', 580870)
ON CONFLICT (id) DO NOTHING;

-- Limpa dados anteriores (caso re-execute)
DELETE FROM itens_custo WHERE ubs_id IN ('a0b10000-0000-0000-0000-000000000001','a0b10000-0000-0000-0000-000000000002','a0b10000-0000-0000-0000-000000000003');
DELETE FROM producao_eventos WHERE ubs_id IN ('a0b10000-0000-0000-0000-000000000001','a0b10000-0000-0000-0000-000000000002','a0b10000-0000-0000-0000-000000000003');
DELETE FROM funcionarios WHERE ubs_id IN ('a0b10000-0000-0000-0000-000000000001','a0b10000-0000-0000-0000-000000000002','a0b10000-0000-0000-0000-000000000003');
DELETE FROM ubs WHERE id IN ('a0b10000-0000-0000-0000-000000000001','a0b10000-0000-0000-0000-000000000002','a0b10000-0000-0000-0000-000000000003');

-- 3 UBS
INSERT INTO ubs (id, nome, endereco, cnes, populacao_referencia, num_equipes_esf, servicos, municipio_id) VALUES
('a0b10000-0000-0000-0000-000000000001', 'UBS Vila Casoni', 'Rua Belo Horizonte, 900 - Vila Casoni', '2764012', 12000, 3, ARRAY['Consulta Medica','Enfermagem','Vacinacao','Odontologia','Coleta de Exames'], 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('a0b10000-0000-0000-0000-000000000002', 'UBS Jardim do Sol', 'Rua Maringa, 450 - Jd. do Sol', '2764013', 9500, 2, ARRAY['Consulta Medica','Enfermagem','Vacinacao','Coleta de Exames'], 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('a0b10000-0000-0000-0000-000000000003', 'UBS Centro', 'Av. Parana, 1200 - Centro', '2764014', 15000, 4, ARRAY['Consulta Medica','Enfermagem','Vacinacao','Odontologia','Coleta de Exames','Saude Mental','Fisioterapia'], 'a1b2c3d4-e5f6-7890-abcd-ef1234567890');

-- Funcionarios UBS 1 - Vila Casoni (mes 3/2026)
INSERT INTO funcionarios (ubs_id, nome, cargo, vinculo, salario, equipe, mes, ano) VALUES
('a0b10000-0000-0000-0000-000000000001', 'Dr. Carlos Mendes', 'Medico', 'concursado', 14500.00, 1, 3, 2026),
('a0b10000-0000-0000-0000-000000000001', 'Dra. Fernanda Lima', 'Medico', 'concursado', 14500.00, 2, 3, 2026),
('a0b10000-0000-0000-0000-000000000001', 'Dr. Roberto Alves', 'Medico', 'clt', 12800.00, 3, 3, 2026),
('a0b10000-0000-0000-0000-000000000001', 'Enf. Maria Santos', 'Enfermeiro', 'concursado', 7200.00, 1, 3, 2026),
('a0b10000-0000-0000-0000-000000000001', 'Enf. Juliana Costa', 'Enfermeiro', 'concursado', 7200.00, 2, 3, 2026),
('a0b10000-0000-0000-0000-000000000001', 'Enf. Patricia Rocha', 'Enfermeiro', 'clt', 6500.00, 3, 3, 2026),
('a0b10000-0000-0000-0000-000000000001', 'Tec. Ana Oliveira', 'Tecnico Enfermagem', 'concursado', 3800.00, 1, 3, 2026),
('a0b10000-0000-0000-0000-000000000001', 'Tec. Lucia Ferreira', 'Tecnico Enfermagem', 'concursado', 3800.00, 2, 3, 2026),
('a0b10000-0000-0000-0000-000000000001', 'Tec. Marcos Silva', 'Tecnico Enfermagem', 'clt', 3400.00, 3, 3, 2026),
('a0b10000-0000-0000-0000-000000000001', 'Dr. Paulo Dentista', 'Dentista', 'concursado', 9800.00, 1, 3, 2026),
('a0b10000-0000-0000-0000-000000000001', 'Sandra Recepcionista', 'Recepcionista', 'concursado', 2800.00, NULL, 3, 2026),
('a0b10000-0000-0000-0000-000000000001', 'Jose Zelador', 'Zelador', 'terceirizado', 2100.00, NULL, 3, 2026);

-- Funcionarios UBS 2 - Jardim do Sol
INSERT INTO funcionarios (ubs_id, nome, cargo, vinculo, salario, equipe, mes, ano) VALUES
('a0b10000-0000-0000-0000-000000000002', 'Dra. Camila Souza', 'Medico', 'concursado', 14500.00, 1, 3, 2026),
('a0b10000-0000-0000-0000-000000000002', 'Dr. Thiago Barros', 'Medico', 'clt', 12800.00, 2, 3, 2026),
('a0b10000-0000-0000-0000-000000000002', 'Enf. Renata Dias', 'Enfermeiro', 'concursado', 7200.00, 1, 3, 2026),
('a0b10000-0000-0000-0000-000000000002', 'Enf. Diego Martins', 'Enfermeiro', 'clt', 6500.00, 2, 3, 2026),
('a0b10000-0000-0000-0000-000000000002', 'Tec. Carla Nunes', 'Tecnico Enfermagem', 'concursado', 3800.00, 1, 3, 2026),
('a0b10000-0000-0000-0000-000000000002', 'Tec. Fabio Lopes', 'Tecnico Enfermagem', 'clt', 3400.00, 2, 3, 2026),
('a0b10000-0000-0000-0000-000000000002', 'Marta Recepcionista', 'Recepcionista', 'concursado', 2800.00, NULL, 3, 2026),
('a0b10000-0000-0000-0000-000000000002', 'Antonio Zelador', 'Zelador', 'terceirizado', 2100.00, NULL, 3, 2026);

-- Funcionarios UBS 3 - Centro
INSERT INTO funcionarios (ubs_id, nome, cargo, vinculo, salario, equipe, mes, ano) VALUES
('a0b10000-0000-0000-0000-000000000003', 'Dr. Alexandre Vieira', 'Medico', 'concursado', 14500.00, 1, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'Dra. Isabela Moreira', 'Medico', 'concursado', 14500.00, 2, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'Dr. Henrique Dias', 'Medico', 'concursado', 14500.00, 3, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'Dra. Natalia Campos', 'Medico', 'clt', 12800.00, 4, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'Enf. Beatriz Alves', 'Enfermeiro', 'concursado', 7200.00, 1, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'Enf. Gabriel Pacheco', 'Enfermeiro', 'concursado', 7200.00, 2, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'Enf. Leticia Amaral', 'Enfermeiro', 'clt', 6500.00, 3, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'Enf. Rafael Guimaraes', 'Enfermeiro', 'clt', 6500.00, 4, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'Tec. Simone Teixeira', 'Tecnico Enfermagem', 'concursado', 3800.00, 1, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'Tec. Elaine Rocha', 'Tecnico Enfermagem', 'concursado', 3800.00, 2, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'Tec. Marcelo Pinto', 'Tecnico Enfermagem', 'clt', 3400.00, 3, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'Tec. Debora Reis', 'Tecnico Enfermagem', 'clt', 3400.00, 4, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'Dra. Viviane Dentista', 'Dentista', 'concursado', 9800.00, 1, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'Psi. Andrea Fonseca', 'Psicologo', 'concursado', 7500.00, NULL, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'Fisio. Bruno Costa', 'Fisioterapeuta', 'clt', 6800.00, NULL, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'Claudia Recepcionista', 'Recepcionista', 'concursado', 2800.00, NULL, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'Vera Recepcionista', 'Recepcionista', 'concursado', 2800.00, NULL, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'Geraldo Zelador', 'Zelador', 'terceirizado', 2100.00, NULL, 3, 2026);

-- Producao UBS 1
INSERT INTO producao_eventos (ubs_id, evento, quantidade_atendimentos, mes, ano) VALUES
('a0b10000-0000-0000-0000-000000000001', 'Consulta Medica', 1850, 3, 2026),
('a0b10000-0000-0000-0000-000000000001', 'Consulta Enfermagem', 920, 3, 2026),
('a0b10000-0000-0000-0000-000000000001', 'Vacinacao', 480, 3, 2026),
('a0b10000-0000-0000-0000-000000000001', 'Consulta Odontologica', 320, 3, 2026),
('a0b10000-0000-0000-0000-000000000001', 'Coleta de Exames', 650, 3, 2026),
('a0b10000-0000-0000-0000-000000000001', 'Visita Domiciliar', 180, 3, 2026);

-- Producao UBS 2
INSERT INTO producao_eventos (ubs_id, evento, quantidade_atendimentos, mes, ano) VALUES
('a0b10000-0000-0000-0000-000000000002', 'Consulta Medica', 1200, 3, 2026),
('a0b10000-0000-0000-0000-000000000002', 'Consulta Enfermagem', 680, 3, 2026),
('a0b10000-0000-0000-0000-000000000002', 'Vacinacao', 350, 3, 2026),
('a0b10000-0000-0000-0000-000000000002', 'Coleta de Exames', 420, 3, 2026),
('a0b10000-0000-0000-0000-000000000002', 'Visita Domiciliar', 120, 3, 2026);

-- Producao UBS 3
INSERT INTO producao_eventos (ubs_id, evento, quantidade_atendimentos, mes, ano) VALUES
('a0b10000-0000-0000-0000-000000000003', 'Consulta Medica', 2800, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'Consulta Enfermagem', 1400, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'Vacinacao', 720, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'Consulta Odontologica', 450, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'Coleta de Exames', 980, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'Visita Domiciliar', 280, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'Atendimento Psicologico', 160, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'Sessao Fisioterapia', 240, 3, 2026);

-- Itens de Custo UBS 1
INSERT INTO itens_custo (ubs_id, categoria, nome, valor, mes, ano) VALUES
('a0b10000-0000-0000-0000-000000000001', 'material_consumo', 'Luvas descartaveis', 1200.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000001', 'material_consumo', 'Seringas e agulhas', 850.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000001', 'material_consumo', 'Algodao e gaze', 420.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000001', 'material_consumo', 'Material de escritorio', 380.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000001', 'insumo', 'Medicamentos basicos', 4500.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000001', 'insumo', 'Vacinas', 3200.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000001', 'insumo', 'Reagentes laboratorio', 1800.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000001', 'administrativo', 'Energia eletrica', 2800.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000001', 'administrativo', 'Agua e esgoto', 750.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000001', 'administrativo', 'Internet e telefone', 650.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000001', 'terceirizado', 'Limpeza', 4200.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000001', 'terceirizado', 'Vigilancia', 3800.00, 3, 2026);

-- Itens de Custo UBS 2
INSERT INTO itens_custo (ubs_id, categoria, nome, valor, mes, ano) VALUES
('a0b10000-0000-0000-0000-000000000002', 'material_consumo', 'Luvas descartaveis', 900.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000002', 'material_consumo', 'Seringas e agulhas', 620.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000002', 'material_consumo', 'Algodao e gaze', 310.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000002', 'insumo', 'Medicamentos basicos', 3200.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000002', 'insumo', 'Vacinas', 2400.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000002', 'administrativo', 'Energia eletrica', 2100.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000002', 'administrativo', 'Agua e esgoto', 580.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000002', 'administrativo', 'Internet e telefone', 550.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000002', 'terceirizado', 'Limpeza', 3500.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000002', 'terceirizado', 'Vigilancia', 3200.00, 3, 2026);

-- Itens de Custo UBS 3
INSERT INTO itens_custo (ubs_id, categoria, nome, valor, mes, ano) VALUES
('a0b10000-0000-0000-0000-000000000003', 'material_consumo', 'Luvas descartaveis', 1800.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'material_consumo', 'Seringas e agulhas', 1200.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'material_consumo', 'Algodao e gaze', 650.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'material_consumo', 'Material de escritorio', 520.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'material_consumo', 'Material odontologico', 980.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'insumo', 'Medicamentos basicos', 6800.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'insumo', 'Vacinas', 4500.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'insumo', 'Reagentes laboratorio', 2800.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'insumo', 'Medicamentos saude mental', 1500.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'administrativo', 'Energia eletrica', 4200.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'administrativo', 'Agua e esgoto', 1100.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'administrativo', 'Internet e telefone', 850.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'administrativo', 'Manutencao predial', 1500.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'terceirizado', 'Limpeza', 5800.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'terceirizado', 'Vigilancia 24h', 5200.00, 3, 2026),
('a0b10000-0000-0000-0000-000000000003', 'terceirizado', 'Manutencao equipamentos', 2200.00, 3, 2026);
