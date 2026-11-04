package com.luisoliveira.ger_orcamentos.dto;

import java.util.List;

public record ConfirmarConciliacaoRequestDto(
        Long qcId,
        List<ItemAssociacaoConfirmadaDto> associacoes
) {
    public record ItemAssociacaoConfirmadaDto(
            String descricaoOriginal,
            Long fornecedorId,
            Long itemCanonicoId,
            boolean criarNovoCanonico,
            String novaDescricaoCanonico,
            String unidadePadrao,
            String categoria,
            boolean lembrarPermanente
    ) {}
}
