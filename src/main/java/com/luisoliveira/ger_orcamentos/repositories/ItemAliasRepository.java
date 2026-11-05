package com.luisoliveira.ger_orcamentos.repositories;

import com.luisoliveira.ger_orcamentos.model.ItemAlias;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemAliasRepository extends JpaRepository<ItemAlias, Long> {

    @Query("SELECT a FROM ItemAlias a WHERE a.ativo = true AND a.descricaoNormalizada = :norm AND (a.fornecedor.id = :fornecedorId OR a.fornecedor IS NULL) ORDER BY a.fornecedor.id DESC")
    List<ItemAlias> buscarMelhorMatchAlias(@Param("norm") String norm, @Param("fornecedorId") Long fornecedorId);

    Optional<ItemAlias> findFirstByDescricaoNormalizadaAndFornecedorIdAndAtivoTrue(String norm, Long fornecedorId);

    Optional<ItemAlias> findFirstByDescricaoNormalizadaAndFornecedorIsNullAndAtivoTrue(String norm);

    List<ItemAlias> findByAtivoTrueOrderByDataAtualizacaoDesc();

    List<ItemAlias> findByItemCanonicoIdAndAtivoTrue(Long itemCanonicoId);

    @Query("SELECT a FROM ItemAlias a WHERE a.ativo = true AND (" +
            "LOWER(a.descricaoOriginal) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "LOWER(a.itemCanonico.descricaoPadrao) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
            "LOWER(a.fornecedor.nome) LIKE LOWER(CONCAT('%', :termo, '%'))" +
            ") ORDER BY a.dataAtualizacao DESC")
    List<ItemAlias> buscarAliasesPorFiltro(@Param("termo") String termo);
}

