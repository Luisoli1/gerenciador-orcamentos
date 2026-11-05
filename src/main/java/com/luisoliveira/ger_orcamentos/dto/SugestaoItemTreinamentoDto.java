package com.luisoliveira.ger_orcamentos.dto;

import java.util.List;

public record SugestaoItemTreinamentoDto(
        Long itemCanonicoId,
        String descricaoPadrao,
        String unidadePadrao,
        String categoria,
        String subcategoria,
        List<String> aplicacoes,
        List<String> caracteristicas,
        int confianca,
        String justificativa,
        String avisoDivergenciaTecnica,
        List<String> motivos,
        List<EvidenciaSinalDto> evidencias,
        String origem
) {
    public SugestaoItemTreinamentoDto(
            Long itemCanonicoId, String descricaoPadrao, String unidadePadrao,
            String categoria, String subcategoria, List<String> aplicacoes,
            List<String> caracteristicas, int confianca, String justificativa,
            String avisoDivergenciaTecnica, List<String> motivos, List<EvidenciaSinalDto> evidencias
    ) {
        this(itemCanonicoId, descricaoPadrao, unidadePadrao, categoria, subcategoria,
                aplicacoes, caracteristicas, confianca, justificativa,
                avisoDivergenciaTecnica, motivos, evidencias, "Catálogo Mestre");
    }

    public SugestaoItemTreinamentoDto(
            Long itemCanonicoId, String descricaoPadrao, String unidadePadrao,
            String categoria, String subcategoria, List<String> aplicacoes,
            List<String> caracteristicas, int confianca, String justificativa,
            String avisoDivergenciaTecnica
    ) {
        this(itemCanonicoId, descricaoPadrao, unidadePadrao, categoria, subcategoria,
                aplicacoes, caracteristicas, confianca, justificativa,
                avisoDivergenciaTecnica, List.of(justificativa), List.of(), "Catálogo Mestre");
    }
}
