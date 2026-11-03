package com.luisoliveira.ger_orcamentos.service;

import com.luisoliveira.ger_orcamentos.dto.LoginRequestDto;
import com.luisoliveira.ger_orcamentos.dto.LoginResponseDto;
import com.luisoliveira.ger_orcamentos.model.Usuario;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuditoriaService auditoriaService;

    public Optional<LoginResponseDto> autenticar(LoginRequestDto req) {
        Optional<Usuario> usuarioOpt = usuarioService.buscarPorEmail(req.email());
        if (usuarioOpt.isEmpty()) {
            return Optional.empty();
        }

        Usuario usuario = usuarioOpt.get();
        if (!usuario.isAtivo()) {
            throw new IllegalStateException("Conta de usuário desativada. Entre em contato com o Dono da aplicação.");
        }

        if (!passwordEncoder.matches(req.senha(), usuario.getSenha())) {
            return Optional.empty();
        }

        String token = jwtService.gerarToken(usuario);
        auditoriaService.registrar("LOGIN", "USUARIO", usuario.getId().toString(), 
                "Login efetuado por " + usuario.getNome() + " (" + usuario.getEmail() + ")");

        return Optional.of(new LoginResponseDto(
                token,
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getRole()
        ));
    }
}
