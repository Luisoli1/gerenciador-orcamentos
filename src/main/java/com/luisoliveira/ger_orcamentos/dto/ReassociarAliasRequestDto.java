package com.luisoliveira.ger_orcamentos.dto;

public record ReassociarAliasRequestDto(
        Long novoItemCanonicoId,
        String novaDescricaoCanonico,
        String unidadePadrao,
        String categoria
) {}

