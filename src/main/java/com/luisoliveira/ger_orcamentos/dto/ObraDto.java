package com.luisoliveira.ger_orcamentos.dto;

public record ObraDto(
        Long id,
        String nomeObra,
        String nomeCliente,
        String cnpjCliente
) {}