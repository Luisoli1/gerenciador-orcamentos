package com.luisoliveira.ger_orcamentos.dto;

import java.util.List;

public record VerificacaoConciliacaoResponseDto(
        boolean possuiDiscrepancia,
        int totalLinhasQc,
        int maiorOrcamentoLinhas,
        int menorOrcamentoLinhas,
        String mensagemAlerta,
        List<SugestaoConciliacaoDto> sugestoes,
        List<DiscrepanciaItemDto> discrepancias
) {}

