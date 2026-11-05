package com.luisoliveira.ger_orcamentos.dto;

public record EvidenciaSinalDto(
        String tipo,
        String titulo,
        String detalhe,
        int peso,
        boolean favoravel
) {}

