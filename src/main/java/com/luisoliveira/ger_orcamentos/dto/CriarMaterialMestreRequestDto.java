package com.luisoliveira.ger_orcamentos.dto;

public record CriarMaterialMestreRequestDto(
        String descricaoPadrao,
        String unidadePadrao,
        String categoria,
        String subcategoria,
        String aplicacoes,
        String caracteristicas,
        String codigoNcm,
        String codigoReferencia
) {}
