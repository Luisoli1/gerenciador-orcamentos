package com.luisoliveira.ger_orcamentos.dto;

import java.time.LocalDateTime;

public record ItemAliasResponseDto(
        Long id,
        String descricaoOriginal,
        String descricaoNormalizada,
        String origem,
        int vezesUtilizado,
        Long fornecedorId,
        String fornecedorNome,
        Long itemCanonicoId,
        String itemCanonicoDescricao,
        String itemCanonicoUnidade,
        String criadoPorNome,
        LocalDateTime dataCriacao,
        String alteradoPorNome,
        LocalDateTime dataAtualizacao
) {}
