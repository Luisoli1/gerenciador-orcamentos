package com.luisoliveira.ger_orcamentos.dto;

import java.util.List;

public record GerarQcVencedorRequestDto(
    Long qcOriginalId,
    String numeroQuadroVencedor,
    String fornecedorNome,
    List<ItemQuadroDTO> itensVencedores
) {}
