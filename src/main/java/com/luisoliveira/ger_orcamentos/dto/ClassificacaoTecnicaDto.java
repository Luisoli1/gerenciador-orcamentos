package com.luisoliveira.ger_orcamentos.dto;

import java.util.List;

public record ClassificacaoTecnicaDto(
        String categoria,
        String subcategoria,
        List<String> aplicacoes,
        List<String> caracteristicas,
        String fabricante,
        String codigoFabricante,
        String unidadeSugerida
) {}

