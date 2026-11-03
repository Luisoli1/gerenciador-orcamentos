package com.luisoliveira.ger_orcamentos.dto;

public record RestaurarItemDto(
    String item,
    String fornecedor,
    String campo,
    String valorAntigo,
    String valorAtual
) {}
