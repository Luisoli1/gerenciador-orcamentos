package com.luisoliveira.ger_orcamentos.dto;

import java.math.BigDecimal;

public record ItemQuadroDTO(
        String marca,
        String descricao,
        String unidadeMedida,
        BigDecimal quantidade,
        BigDecimal valorUnitario,
        BigDecimal valorTotal,
        BigDecimal aliquotaIpi
) {}