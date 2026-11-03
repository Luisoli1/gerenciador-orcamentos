package com.luisoliveira.ger_orcamentos.repositories;

import com.luisoliveira.ger_orcamentos.model.Obra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ObraRepository extends JpaRepository<Obra, Long> {

    // Verificações isoladas para criação
    boolean existsByNomeObraIgnoreCase(String nomeObra);
    boolean existsByCnpjCliente(String cnpjCliente);

    // Verificações isoladas para atualização (ignorando o próprio ID)
    boolean existsByNomeObraIgnoreCaseAndIdNot(String nomeObra, Long id);
    boolean existsByCnpjClienteAndIdNot(String cnpjCliente, Long id);
}