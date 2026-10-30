package com.luisoliveira.ger_orcamentos.repositories;


import com.luisoliveira.ger_orcamentos.model.ItemOrcamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ItemOrcamentoRepository extends JpaRepository<ItemOrcamento, Long> {

}
