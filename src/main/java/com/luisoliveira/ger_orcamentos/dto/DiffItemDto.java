package com.luisoliveira.ger_orcamentos.dto;

public record DiffItemDto(
    String item,
    String fornecedor,
    String campo,
    String antes,
    String depois
) {}
