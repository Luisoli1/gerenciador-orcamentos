package com.luisoliveira.ger_orcamentos.dto;

import com.luisoliveira.ger_orcamentos.model.Fornecedor;

public record FornecedorResponseDto(
        Long id,
        String nome,
        String cnpj,
        String nomeContato,
        String emailContato,
        String telefoneContato,
        String celularContato,
        String localCidade
) {

    // Método auxiliar para converter a Entidade JPA num DTO de resposta limpo
    public static FornecedorResponseDto fromEntity(Fornecedor fornecedor) {
        return new FornecedorResponseDto(
                fornecedor.getId(),
                fornecedor.getNome(),
                fornecedor.getCnpj(),
                fornecedor.getNomeContato(),
                fornecedor.getEmailContato(),
                fornecedor.getTelefoneContato(),
                fornecedor.getCelularContato(),
                fornecedor.getLocalCidade()
        );
    }
}