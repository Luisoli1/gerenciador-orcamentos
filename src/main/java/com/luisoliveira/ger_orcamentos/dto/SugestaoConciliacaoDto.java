package com.luisoliveira.ger_orcamentos.dto;

import java.math.BigDecimal;
import java.util.List;

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
        BigDecimal precoUnitarioConvertido,
        String alertaEspecificacao,
        List<String> motivos,
        List<EvidenciaSinalDto> evidencias
) {
    public SugestaoConciliacaoDto(
            String itemDescricaoOriginal, String fornecedorNome, Long fornecedorId,
            Long itemCanonicoSugeridoId, String itemCanonicoSugeridoDescricao,
            int confianca, String justificativa, String origemSugestao,
            String unidadeOriginal, String unidadeCanonico,
            BigDecimal fatorConversao, BigDecimal quantidadeOriginal, BigDecimal quantidadeConvertida,
            BigDecimal precoUnitarioOriginal, BigDecimal precoUnitarioConvertido
    ) {
        this(itemDescricaoOriginal, fornecedorNome, fornecedorId, itemCanonicoSugeridoId,
                itemCanonicoSugeridoDescricao, confianca, justificativa, origemSugestao,
                unidadeOriginal, unidadeCanonico, fatorConversao, quantidadeOriginal,
                quantidadeConvertida, precoUnitarioOriginal, precoUnitarioConvertido, null,
                List.of(justificativa), List.of());
    }

    public SugestaoConciliacaoDto(
            String itemDescricaoOriginal, String fornecedorNome, Long fornecedorId,
            Long itemCanonicoSugeridoId, String itemCanonicoSugeridoDescricao,
            int confianca, String justificativa, String origemSugestao,
            String unidadeOriginal, String unidadeCanonico,
            BigDecimal fatorConversao, BigDecimal quantidadeOriginal, BigDecimal quantidadeConvertida,
            BigDecimal precoUnitarioOriginal, BigDecimal precoUnitarioConvertido,
            String alertaEspecificacao
    ) {
        this(itemDescricaoOriginal, fornecedorNome, fornecedorId, itemCanonicoSugeridoId,
                itemCanonicoSugeridoDescricao, confianca, justificativa, origemSugestao,
                unidadeOriginal, unidadeCanonico, fatorConversao, quantidadeOriginal,
                quantidadeConvertida, precoUnitarioOriginal, precoUnitarioConvertido, alertaEspecificacao,
                List.of(justificativa), List.of());
    }
}
