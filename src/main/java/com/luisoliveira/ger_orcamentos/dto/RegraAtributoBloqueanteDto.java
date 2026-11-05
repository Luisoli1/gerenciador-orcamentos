package com.luisoliveira.ger_orcamentos.dto;

import java.util.List;

public record RegraAtributoBloqueanteDto(
        String categoria,
        String descricao,
        List<String> atributosBloqueantes,
        List<String> exemplosValores,
        String impactoBloqueio
) {}

