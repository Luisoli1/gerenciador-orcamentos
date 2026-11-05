package com.luisoliveira.ger_orcamentos.dto;

import java.util.List;

public record ItemTreinamentoDto(
        Long id,
        String descricaoBruta,
        String unidadeBruta,
        String fornecedorOrigem,
        String documentoOrigem,
        String tipoFonte,
        String status,
        List<SugestaoItemTreinamentoDto> sugestoes
) {}
