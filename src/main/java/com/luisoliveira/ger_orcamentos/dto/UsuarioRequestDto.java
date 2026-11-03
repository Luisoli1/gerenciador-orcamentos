package com.luisoliveira.ger_orcamentos.dto;

import com.luisoliveira.ger_orcamentos.model.Role;

public record UsuarioRequestDto(
    String nome,
    String email,
    String senha,
    Role role
) {}
