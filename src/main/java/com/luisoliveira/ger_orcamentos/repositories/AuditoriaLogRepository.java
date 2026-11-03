package com.luisoliveira.ger_orcamentos.repositories;

import com.luisoliveira.ger_orcamentos.model.AuditoriaLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditoriaLogRepository extends JpaRepository<AuditoriaLog, Long> {
    List<AuditoriaLog> findAllByOrderByDataHoraDesc();
    List<AuditoriaLog> findTop200ByOrderByDataHoraDesc();
    List<AuditoriaLog> findByEntidadeOrderByDataHoraDesc(String entidade);

    @Query("SELECT a FROM AuditoriaLog a WHERE " +
           "LOWER(a.detalhes) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
           "LOWER(a.usuarioNome) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
           "LOWER(a.usuarioEmail) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
           "LOWER(a.idRegistro) LIKE LOWER(CONCAT('%', :termo, '%')) OR " +
           "LOWER(a.entidade) LIKE LOWER(CONCAT('%', :termo, '%')) " +
           "ORDER BY a.dataHora DESC")
    List<AuditoriaLog> buscarPorTermo(@Param("termo") String termo);
}
