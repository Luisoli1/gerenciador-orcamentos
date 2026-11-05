package com.luisoliveira.ger_orcamentos.dto;

public record ConflitoBloqueanteDto(
        String categoria,
        String atributo,
        String valorA,
        String valorB,
        String mensagemFormatada
) {}
