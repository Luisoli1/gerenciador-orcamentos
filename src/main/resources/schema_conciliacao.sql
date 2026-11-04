-- Script de Criação da Estrutura de Conciliação Inteligente & Cadastro Mestre de Materiais
-- 1. Materiais Mestre / Itens Canônicos
CREATE TABLE IF NOT EXISTS tb_item_canonico (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    codigo_referencia VARCHAR(50) UNIQUE NULL,
    codigo_ncm VARCHAR(10) NULL,
    descricao_padrao VARCHAR(255) NOT NULL,
    descricao_normalizada VARCHAR(255) NOT NULL,
    unidade_padrao VARCHAR(20) NOT NULL DEFAULT 'UN',
    categoria VARCHAR(100) NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    criado_por VARCHAR(100) NULL,
    UNIQUE KEY uk_item_canonico_norm (descricao_normalizada)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Fabricantes / Indústrias
CREATE TABLE IF NOT EXISTS tb_fabricante (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cnpj VARCHAR(20) NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_fabricante_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Catálogo de Fabricantes (SKUs oficiais)
CREATE TABLE IF NOT EXISTS tb_item_catalogo_fabricante (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fabricante_id BIGINT NOT NULL,
    item_canonico_id BIGINT NULL,
    codigo_fabricante VARCHAR(100) NULL,
    descricao_catalogo VARCHAR(255) NOT NULL,
    unidade_catalogo VARCHAR(20) NULL,
    data_importacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cat_fabricante FOREIGN KEY (fabricante_id) REFERENCES tb_fabricante(id) ON DELETE CASCADE,
    CONSTRAINT fk_cat_item_canonico FOREIGN KEY (item_canonico_id) REFERENCES tb_item_canonico(id) ON DELETE SET NULL,
    INDEX idx_cat_cod_fabr (codigo_fabricante)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Aliases / Sinônimos De-Para com Auditoria
CREATE TABLE IF NOT EXISTS tb_item_alias (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_canonico_id BIGINT NOT NULL,
    fornecedor_id BIGINT NULL,
    descricao_original VARCHAR(255) NOT NULL,
    descricao_normalizada VARCHAR(255) NOT NULL,
    origem VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
    vezes_utilizado INT NOT NULL DEFAULT 1,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_por_usuario_id BIGINT NULL,
    criado_por_nome VARCHAR(100) NULL,
    data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    alterado_por_usuario_id BIGINT NULL,
    alterado_por_nome VARCHAR(100) NULL,
    data_atualizacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_alias_item_canonico FOREIGN KEY (item_canonico_id) REFERENCES tb_item_canonico(id) ON DELETE CASCADE,
    CONSTRAINT fk_alias_fornecedor FOREIGN KEY (fornecedor_id) REFERENCES tb_fornecedor(id) ON DELETE SET NULL,
    CONSTRAINT fk_alias_criado_por FOREIGN KEY (criado_por_usuario_id) REFERENCES tb_usuario(id) ON DELETE SET NULL,
    CONSTRAINT fk_alias_alterado_por FOREIGN KEY (alterado_por_usuario_id) REFERENCES tb_usuario(id) ON DELETE SET NULL,
    INDEX idx_alias_norm (descricao_normalizada),
    INDEX idx_alias_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Conversões Globais de Engenharia
CREATE TABLE IF NOT EXISTS tb_conversao_padrao (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    unidade_origem VARCHAR(20) NOT NULL,
    unidade_destino VARCHAR(20) NOT NULL,
    fator_multiplicador DECIMAL(15,4) NOT NULL,
    descricao_regra VARCHAR(255) NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE KEY uk_conv_origem_destino (unidade_origem, unidade_destino)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserção de sementes universais de conversão:
INSERT IGNORE INTO tb_conversao_padrao (unidade_origem, unidade_destino, fator_multiplicador, descricao_regra) VALUES
('BARRA', 'M', 3.0000, 'Barra padrão de eletroduto / tubo PVC / perfil (3 metros)'),
('BR', 'M', 3.0000, 'Abreviação BR para Barra (3 metros)'),
('ROLO', 'M', 100.0000, 'Rolo padrão de cabo flexível elétrico (100 metros)'),
('RL', 'M', 100.0000, 'Abreviação RL para Rolo (100 metros)'),
('CENTO', 'UN', 100.0000, 'Cento comercial (100 unidades)'),
('MILHEIRO', 'UN', 1000.0000, 'Milheiro comercial (1000 unidades)'),
('CX', 'UN', 100.0000, 'Caixa padrão de fixadores (100 unidades)');

-- 6. Conversões Específicas por Material Mestre
CREATE TABLE IF NOT EXISTS tb_item_conversao_unidade (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_canonico_id BIGINT NOT NULL,
    unidade_origem VARCHAR(20) NOT NULL,
    unidade_destino VARCHAR(20) NOT NULL,
    fator_multiplicador DECIMAL(15,4) NOT NULL,
    CONSTRAINT fk_item_conv_canonico FOREIGN KEY (item_canonico_id) REFERENCES tb_item_canonico(id) ON DELETE CASCADE,
    UNIQUE KEY uk_item_conv_origem_dest (item_canonico_id, unidade_origem, unidade_destino)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Inclusão da FK em tb_item_orcamento e tb_item_faturamento_direto
ALTER TABLE tb_item_orcamento ADD COLUMN IF NOT EXISTS item_canonico_id BIGINT NULL;
ALTER TABLE tb_item_faturamento_direto ADD COLUMN IF NOT EXISTS item_canonico_id BIGINT NULL;
