package com.luisoliveira.ger_orcamentos.dto;

import java.math.BigDecimal;

public record ValidarItemTreinamentoRequestDto(
        Long itemTreinamentoId,
        String acao, // 'VINCULAR_EXISTENTE' | 'CRIAR_NOVO' | 'IGNORAR'
        Long itemCanonicoId,
        String novaDescricaoCanonico,
        String unidadePadrao,
        String categoria,
        String codigoNcm,
        boolean cadastrarConversao,
        BigDecimal fatorConversao
) {}
