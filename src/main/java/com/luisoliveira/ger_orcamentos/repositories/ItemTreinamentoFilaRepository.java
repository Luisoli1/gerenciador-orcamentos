package com.luisoliveira.ger_orcamentos.repositories;

import com.luisoliveira.ger_orcamentos.model.ItemTreinamentoFila;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemTreinamentoFilaRepository extends JpaRepository<ItemTreinamentoFila, Long> {

    List<ItemTreinamentoFila> findByStatusOrderByIdAsc(String status, Pageable pageable);

    Optional<ItemTreinamentoFila> findFirstByStatusOrderByIdAsc(String status);

    long countByStatus(String status);

    @Query("SELECT COUNT(f) > 0 FROM ItemTreinamentoFila f WHERE f.descricaoNormalizada = :norm AND (:fornecedor IS NULL OR f.fornecedorOrigem = :fornecedor)")
    boolean existsByDescricaoNormalizadaAndFornecedor(@Param("norm") String norm, @Param("fornecedor") String fornecedor);
}

