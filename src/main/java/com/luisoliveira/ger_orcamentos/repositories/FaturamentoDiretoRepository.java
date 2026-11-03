package com.luisoliveira.ger_orcamentos.repositories;

import com.luisoliveira.ger_orcamentos.model.FaturamentoDireto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FaturamentoDiretoRepository extends JpaRepository<FaturamentoDireto, Long> {
    List<FaturamentoDireto> findByObraIdOrderByIdDesc(Long obraId);
    Optional<FaturamentoDireto> findByNumeroControle(String numeroControle);
    List<FaturamentoDireto> findByQcId(Long qcId);
}
