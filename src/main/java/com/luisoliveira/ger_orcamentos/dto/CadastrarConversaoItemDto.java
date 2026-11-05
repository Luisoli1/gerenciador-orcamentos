package com.luisoliveira.ger_orcamentos.dto;

import java.math.BigDecimal;

public record CadastrarConversaoItemDto(
        Long itemCanonicoId,
        String unidadeOrigem,
        String unidadeDestino,
        BigDecimal fatorMultiplicador
) {}
