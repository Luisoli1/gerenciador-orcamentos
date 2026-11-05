package com.luisoliveira.ger_orcamentos.dto;

public record EstatisticasTreinamentoDto(
        long totalPendentes,
        long totalValidados,
        long totalIgnorados,
        long totalGeral,
        double percentualConcluido
) {}

