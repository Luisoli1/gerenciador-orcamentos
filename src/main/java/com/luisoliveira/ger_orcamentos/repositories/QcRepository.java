package com.luisoliveira.ger_orcamentos.repositories;

import com.luisoliveira.ger_orcamentos.model.Qc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QcRepository extends JpaRepository<Qc, Long> {

    long countByObraId(Long obraId);

    List<Qc> findAllByObraId(Long obraId);

    // Retorna apenas QCs que realmente possuem orçamentos associados, ordenados do mais recente para o mais antigo
    @Query("SELECT q FROM Qc q WHERE q.obra.id = :obraId AND EXISTS (SELECT o FROM Orcamento o WHERE o.qc = q) ORDER BY q.id DESC")
    List<Qc> findByObraId(@Param("obraId") Long obraId);
}