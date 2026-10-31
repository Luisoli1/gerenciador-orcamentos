package com.luisoliveira.ger_orcamentos.dto;

import java.time.LocalDate;

public record QuadroMetaDadosDto(
        String nomeObra,
        String numeroQuadro,
        String nomeCliente,
        String cnpjCliente,
        LocalDate dataElaboracao
) {
}
