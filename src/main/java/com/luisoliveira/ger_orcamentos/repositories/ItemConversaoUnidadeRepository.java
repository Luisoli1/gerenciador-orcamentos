package com.luisoliveira.ger_orcamentos.repositories;

import com.luisoliveira.ger_orcamentos.model.ItemConversaoUnidade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemConversaoUnidadeRepository extends JpaRepository<ItemConversaoUnidade, Long> {
    Optional<ItemConversaoUnidade> findByItemCanonicoIdAndUnidadeOrigemAndUnidadeDestino(Long itemCanonicoId, String unidadeOrigem, String unidadeDestino);
    List<ItemConversaoUnidade> findByItemCanonicoId(Long itemCanonicoId);
}
