package com.luisoliveira.ger_orcamentos.repositories;

import com.luisoliveira.ger_orcamentos.model.Orcamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrcamentoRepository extends JpaRepository<Orcamento, Long> {

    Orcamento findByNumeroOrcamento(String numeroOrcamento);

    List<Orcamento> findByQcId(Long qcId);

    @Query("SELECT o FROM Orcamento o WHERE o.qc.obra.id = :obraId")
    List<Orcamento> findByQcObraId(@Param("obraId") Long obraId);

    @Query("SELECT o FROM Orcamento o WHERE o.qc IS NOT NULL ORDER BY o.id DESC")
    List<Orcamento> findAllWithQc();
}
