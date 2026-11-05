package com.luisoliveira.ger_orcamentos.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSchemaInitializer {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void garantirColunasEvolutivas() {
        executarSqlSilencioso("ALTER TABLE tb_item_canonico ADD COLUMN subcategoria VARCHAR(100) NULL");
        executarSqlSilencioso("ALTER TABLE tb_item_canonico ADD COLUMN aplicacoes VARCHAR(500) NULL");
        executarSqlSilencioso("ALTER TABLE tb_item_canonico ADD COLUMN caracteristicas VARCHAR(1000) NULL");
        executarSqlSilencioso("ALTER TABLE tb_item_canonico ADD COLUMN origem VARCHAR(50) NULL");

        executarSqlSilencioso("ALTER TABLE tb_item_treinamento_fila ADD COLUMN categoria_sugerida VARCHAR(100) NULL");
        executarSqlSilencioso("ALTER TABLE tb_item_treinamento_fila ADD COLUMN subcategoria_sugerida VARCHAR(100) NULL");
        executarSqlSilencioso("ALTER TABLE tb_item_treinamento_fila ADD COLUMN aplicacoes_sugeridas VARCHAR(500) NULL");
        executarSqlSilencioso("ALTER TABLE tb_item_treinamento_fila ADD COLUMN caracteristicas_sugeridas VARCHAR(1000) NULL");
        executarSqlSilencioso("ALTER TABLE tb_item_treinamento_fila ADD COLUMN fabricante_sugerido VARCHAR(100) NULL");
        executarSqlSilencioso("ALTER TABLE tb_item_treinamento_fila ADD COLUMN codigo_fabricante_sugerido VARCHAR(100) NULL");

        executarSqlSilencioso("ALTER TABLE tb_item_orcamento ADD COLUMN item_canonico_id BIGINT NULL");
        executarSqlSilencioso("ALTER TABLE tb_item_faturamento_direto ADD COLUMN item_canonico_id BIGINT NULL");
    }

    private void executarSqlSilencioso(String sql) {
        try {
            jdbcTemplate.execute(sql);
            System.out.println("Schema check executado com sucesso: " + sql);
        } catch (Exception e) {
            // Ignora se coluna já existir (Duplicate column name)
            if (e.getMessage() != null && e.getMessage().toLowerCase().contains("duplicate column")) {
                // Coluna já existe perfeitamente
                return;
            }
            System.out.println("Aviso schema check (" + sql + "): " + e.getMessage());
        }
    }
}

