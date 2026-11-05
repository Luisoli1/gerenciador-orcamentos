package com.luisoliveira.ger_orcamentos.dto;

import java.util.List;

public record DiscrepanciaItemDto(
        String descricaoItem,
        String fornecedorPresente,
        List<String> fornecedoresFaltantes,
        List<SugestaoConciliacaoDto> possiveisEquivalentes
) {}

