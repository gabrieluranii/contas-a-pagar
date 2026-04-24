-- Substitua '<SEU-UUID-AQUI>' pelo seu ID de usuário no Supabase (auth.users)
-- DICA: Você pode pegar seu UUID na aba Authentication do projeto no Supabase.
-- IMPORTANTE: Este arquivo é um template. Substitua '<SEU-UUID-AQUI>' pelo UUID real antes de executar, e NUNCA commite o UUID real.

-- 1. ADICIONAR COLUNA user_id ÀS 9 TABELAS E CONFIGURAR FK
ALTER TABLE bills ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE tvo_bills ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE tvo_registros ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE bases ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE gestores ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE cat_despesas ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- =======================================================================================
-- ATENÇÃO CRÍTICA: ATUALIZAÇÃO DOS DADOS LEGADOS
-- Execute este bloco DEPOIS de substituir o placeholder e ANTES de ativar RLS
-- =======================================================================================

UPDATE bills SET user_id = '<SEU-UUID-AQUI>' WHERE user_id IS NULL;
UPDATE tvo_bills SET user_id = '<SEU-UUID-AQUI>' WHERE user_id IS NULL;
UPDATE lancamentos SET user_id = '<SEU-UUID-AQUI>' WHERE user_id IS NULL;
UPDATE tvo_registros SET user_id = '<SEU-UUID-AQUI>' WHERE user_id IS NULL;
UPDATE bases SET user_id = '<SEU-UUID-AQUI>' WHERE user_id IS NULL;
UPDATE categories SET user_id = '<SEU-UUID-AQUI>' WHERE user_id IS NULL;
UPDATE gestores SET user_id = '<SEU-UUID-AQUI>' WHERE user_id IS NULL;
UPDATE cat_despesas SET user_id = '<SEU-UUID-AQUI>' WHERE user_id IS NULL;
UPDATE orcamentos SET user_id = '<SEU-UUID-AQUI>' WHERE user_id IS NULL;

-- OPCIONAL (MAS RECOMENDADO): Forçar constraints de NOT NULL agora que tudo tem user_id
ALTER TABLE bills ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE tvo_bills ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE lancamentos ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE tvo_registros ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE bases ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE categories ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE gestores ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE cat_despesas ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE orcamentos ALTER COLUMN user_id SET NOT NULL;

-- =======================================================================================
-- 2. ATIVAR ROW LEVEL SECURITY E CRIAR AS POLÍTICAS
-- =======================================================================================

-- Ativando o RLS para todas as tabelas
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE tvo_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tvo_registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE gestores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso total CRUD (Create, Read, Update, Delete) vinculadas ao uid do usuário

-- bills
CREATE POLICY "Manage own bills" ON bills FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- tvo_bills
CREATE POLICY "Manage own tvo_bills" ON tvo_bills FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- lancamentos
CREATE POLICY "Manage own lancamentos" ON lancamentos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- tvo_registros
CREATE POLICY "Manage own tvo_registros" ON tvo_registros FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- bases
CREATE POLICY "Manage own bases" ON bases FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- categories
CREATE POLICY "Manage own categories" ON categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- gestores
CREATE POLICY "Manage own gestores" ON gestores FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- cat_despesas
CREATE POLICY "Manage own cat_despesas" ON cat_despesas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- orcamentos
CREATE POLICY "Manage own orcamentos" ON orcamentos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Migração Completa.
