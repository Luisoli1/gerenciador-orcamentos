package com.luisoliveira.ger_orcamentos.repositories;

import com.luisoliveira.ger_orcamentos.model.ConversaoPadrao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversaoPadraoRepository extends JpaRepository<ConversaoPadrao, Long> {
    Optional<ConversaoPadrao> findByUnidadeOrigemAndUnidadeDestinoAndAtivoTrue(String unidadeOrigem, String unidadeDestino);
    List<ConversaoPadrao> findByAtivoTrue();
}

