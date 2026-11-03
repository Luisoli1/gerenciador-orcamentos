package com.luisoliveira.ger_orcamentos.dto;

import com.luisoliveira.ger_orcamentos.model.Role;

public record LoginResponseDto(
    String token,
    Long id,
    String nome,
    String email,
    Role role
) {}
