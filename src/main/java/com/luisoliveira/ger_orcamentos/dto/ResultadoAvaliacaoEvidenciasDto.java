package com.luisoliveira.ger_orcamentos.dto;

import java.util.List;

public record ResultadoAvaliacaoEvidenciasDto(
        Long itemCanonicoId,
        String descricaoCanonico,
        String unidadeCanonico,
        int confianca,
        List<EvidenciaSinalDto> evidencias,
        List<String> motivos,
        String alertaConflito
) {}

