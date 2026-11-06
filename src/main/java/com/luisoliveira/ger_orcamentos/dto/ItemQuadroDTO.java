package com.luisoliveira.ger_orcamentos.dto;

import java.math.BigDecimal;

public record ItemQuadroDTO(
        String marca,
        String descricao,
        String unidadeMedida,
        BigDecimal quantidade,
        BigDecimal valorUnitario,
        BigDecimal valorTotal,
        BigDecimal aliquotaIpi,
        Long itemCanonicoId,
        String nomeCanonico
) {
    public ItemQuadroDTO(String marca, String descricao, String unidadeMedida, BigDecimal quantidade, BigDecimal valorUnitario, BigDecimal valorTotal, BigDecimal aliquotaIpi) {
        this(marca, descricao, unidadeMedida, quantidade, valorUnitario, valorTotal, aliquotaIpi, null, null);
    }
}
