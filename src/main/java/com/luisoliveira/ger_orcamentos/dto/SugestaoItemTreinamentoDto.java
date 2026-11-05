package com.luisoliveira.ger_orcamentos.dto;

public record SugestaoItemTreinamentoDto(
        Long itemCanonicoId,
        String descricaoPadrao,
        String unidadePadrao,
        String categoria,
        int confianca,
        String justificativa
) {}
