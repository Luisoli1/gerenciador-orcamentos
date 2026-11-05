package com.luisoliveira.ger_orcamentos.repositories;

import com.luisoliveira.ger_orcamentos.model.ItemCatalogoFabricante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemCatalogoFabricanteRepository extends JpaRepository<ItemCatalogoFabricante, Long> {
    Optional<ItemCatalogoFabricante> findByFabricanteIdAndCodigoFabricante(Long fabricanteId, String codigoFabricante);
    List<ItemCatalogoFabricante> findByFabricanteId(Long fabricanteId);
    List<ItemCatalogoFabricante> findByItemCanonicoId(Long itemCanonicoId);
}

