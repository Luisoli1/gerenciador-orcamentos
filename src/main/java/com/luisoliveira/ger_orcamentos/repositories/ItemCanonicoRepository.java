package com.luisoliveira.ger_orcamentos.repositories;

import com.luisoliveira.ger_orcamentos.model.ItemCanonico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemCanonicoRepository extends JpaRepository<ItemCanonico, Long> {

    Optional<ItemCanonico> findByDescricaoNormalizada(String descricaoNormalizada);

    Optional<ItemCanonico> findByCodigoReferencia(String codigoReferencia);

    List<ItemCanonico> findByAtivoTrueOrderByDescricaoPadraoAsc();

    @Query("SELECT c FROM ItemCanonico c WHERE c.ativo = true AND (LOWER(c.descricaoPadrao) LIKE LOWER(CONCAT('%', :termo, '%')) OR LOWER(c.descricaoNormalizada) LIKE LOWER(CONCAT('%', :termo, '%')))")
    List<ItemCanonico> buscarPorTermo(@Param("termo") String termo);
}
