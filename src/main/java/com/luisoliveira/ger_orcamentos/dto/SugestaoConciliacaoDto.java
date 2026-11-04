package com.luisoliveira.ger_orcamentos.dto;

import java.math.BigDecimal;

public record SugestaoConciliacaoDto(
        String itemDescricaoOriginal,
        String fornecedorNome,
        Long fornecedorId,
        Long itemCanonicoSugeridoId,
        String itemCanonicoSugeridoDescricao,
        int confianca,
        String justificativa,
        String origemSugestao,
        String unidadeOriginal,
        String unidadeCanonico,
        BigDecimal fatorConversao,
        BigDecimal quantidadeOriginal,
        BigDecimal quantidadeConvertida,
        BigDecimal precoUnitarioOriginal,
        BigDecimal precoUnitarioConvertido
) {}
