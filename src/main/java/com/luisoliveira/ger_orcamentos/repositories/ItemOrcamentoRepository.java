package com.luisoliveira.ger_orcamentos.repositories;

import com.luisoliveira.ger_orcamentos.model.ItemOrcamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemOrcamentoRepository extends JpaRepository<ItemOrcamento, Long> {

    @Query("SELECT i FROM ItemOrcamento i JOIN FETCH i.orcamento o JOIN FETCH o.fornecedor f " +
            "WHERE ((:cnpjFornecedor IS NOT NULL AND f.cnpj = :cnpjFornecedor) " +
            "   OR (:nomeFornecedor IS NOT NULL AND LOWER(f.nome) LIKE LOWER(CONCAT('%', :nomeFornecedor, '%')))) " +
            "AND LOWER(i.descricao) LIKE LOWER(CONCAT('%', :descricaoItem, '%')) " +
            "ORDER BY o.dataEmissao DESC")
    List<ItemOrcamento> buscarHistoricoPorFornecedoretem(
            @Param("cnpjFornecedor") String cnpjFornecedor,
            @Param("nomeFornecedor") String nomeFornecedor,
            @Param("descricaoItem") String descricaoItem
    );
}