package com.luisoliveira.ger_orcamentos.dto;

import com.luisoliveira.ger_orcamentos.model.Role;
import com.luisoliveira.ger_orcamentos.model.Usuario;
import java.time.LocalDateTime;

public record UsuarioResponseDto(
    Long id,
    String nome,
    String email,
    Role role,
    boolean ativo,
    LocalDateTime dataCriacao
) {
    public static UsuarioResponseDto fromEntity(Usuario u) {
        return new UsuarioResponseDto(
            u.getId(),
            u.getNome(),
            u.getEmail(),
            u.getRole(),
            u.isAtivo(),
            u.getDataCriacao()
        );
    }
}
