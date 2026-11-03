package com.luisoliveira.ger_orcamentos.controller;

import com.luisoliveira.ger_orcamentos.dto.LoginRequestDto;
import com.luisoliveira.ger_orcamentos.dto.LoginResponseDto;
import com.luisoliveira.ger_orcamentos.dto.UsuarioResponseDto;
import com.luisoliveira.ger_orcamentos.model.Usuario;
import com.luisoliveira.ger_orcamentos.service.AuthService;
import com.luisoliveira.ger_orcamentos.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private UsuarioService usuarioService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDto req) {
        try {
            Optional<LoginResponseDto> res = authService.autenticar(req);
            if (res.isPresent()) {
                return ResponseEntity.ok(res.get());
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "E-mail ou senha incorretos."));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Optional<Usuario> u = usuarioService.buscarPorEmail(auth.getName());
        return u.map(usuario -> ResponseEntity.ok(UsuarioResponseDto.fromEntity(usuario)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }
}
