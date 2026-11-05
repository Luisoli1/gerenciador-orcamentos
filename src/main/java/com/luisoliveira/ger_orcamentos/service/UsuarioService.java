package com.luisoliveira.ger_orcamentos.service;

import com.luisoliveira.ger_orcamentos.dto.UsuarioRequestDto;
import com.luisoliveira.ger_orcamentos.dto.UsuarioResponseDto;
import com.luisoliveira.ger_orcamentos.model.Role;
import com.luisoliveira.ger_orcamentos.model.Usuario;
import com.luisoliveira.ger_orcamentos.repositories.UsuarioRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuditoriaService auditoriaService;

    @PostConstruct
    public void inicializarDonoPadrao() {
        resetarSenhaDonoPadrao();
    }

    public void resetarSenhaDonoPadrao() {
        List<Usuario> todos = usuarioRepository.findAll();
        boolean resetou = false;
        for (Usuario u : todos) {
            if (u.getRole() == Role.DONO || "admin@makinsthal.com.br".equalsIgnoreCase(u.getEmail())) {
                u.setSenha(passwordEncoder.encode("Makinsthal@2026!"));
                u.setAtivo(true);
                usuarioRepository.save(u);
                resetou = true;
                System.out.println("SENHA DO DONO MASTER RESETADA COM SUCESSO: " + u.getEmail() + " -> Makinsthal@2026!");
            }
        }
        if (!resetou) {
            Usuario dono = new Usuario();
            dono.setNome("Administrador Dono");
            dono.setEmail("admin@makinsthal.com.br");
            dono.setSenha(passwordEncoder.encode("Makinsthal@2026!"));
            dono.setRole(Role.DONO);
            dono.setAtivo(true);
            usuarioRepository.save(dono);
            System.out.println("NOVO USUÁRIO DONO CRIADO: admin@makinsthal.com.br -> Makinsthal@2026!");
        }
    }

    public List<UsuarioResponseDto> listarTodos() {
        return usuarioRepository.findAll().stream()
                .map(UsuarioResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    public Optional<Usuario> buscarPorEmail(String email) {
        return usuarioRepository.findByEmail(email);
    }

    public Optional<Usuario> buscarPorId(Long id) {
        return usuarioRepository.findById(id);
    }

    public UsuarioResponseDto criarUsuario(UsuarioRequestDto dto) {
        if (usuarioRepository.existsByEmail(dto.email())) {
            throw new IllegalArgumentException("Já existe um usuário com o e-mail informado: " + dto.email());
        }

        Usuario u = new Usuario();
        u.setNome(dto.nome());
        u.setEmail(dto.email());
        u.setSenha(passwordEncoder.encode(dto.senha()));
        u.setRole(dto.role() != null ? dto.role() : Role.OPERADOR);
        u.setAtivo(true);

        Usuario salvo = usuarioRepository.save(u);
        auditoriaService.registrar("CRIACAO", "USUARIO", salvo.getId().toString(), 
                "Criou usuário: " + salvo.getNome() + " (" + salvo.getEmail() + ") com perfil " + salvo.getRole());
        return UsuarioResponseDto.fromEntity(salvo);
    }

    public Optional<UsuarioResponseDto> atualizarUsuario(Long id, UsuarioRequestDto dto) {
        return usuarioRepository.findById(id).map(u -> {
            u.setNome(dto.nome());
            if (dto.senha() != null && !dto.senha().isBlank()) {
                u.setSenha(passwordEncoder.encode(dto.senha()));
            }
            if (dto.role() != null) {
                u.setRole(dto.role());
            }
            Usuario atualizado = usuarioRepository.save(u);
            auditoriaService.registrar("ATUALIZACAO", "USUARIO", atualizado.getId().toString(),
                    "Atualizou usuário: " + atualizado.getNome() + " (" + atualizado.getEmail() + ")");
            return UsuarioResponseDto.fromEntity(atualizado);
        });
    }

    public Optional<UsuarioResponseDto> alternarStatus(Long id) {
        return usuarioRepository.findById(id).map(u -> {
            u.setAtivo(!u.isAtivo());
            Usuario atualizado = usuarioRepository.save(u);
            String status = atualizado.isAtivo() ? "Ativado" : "Desativado";
            auditoriaService.registrar("ATUALIZACAO", "USUARIO", atualizado.getId().toString(),
                    status + " o usuário " + atualizado.getNome());
            return UsuarioResponseDto.fromEntity(atualizado);
        });
    }

    public boolean deletarUsuario(Long id) {
        return usuarioRepository.findById(id).map(u -> {
            if (u.getRole() == Role.DONO) {
                long totalDonos = usuarioRepository.findAll().stream().filter(user -> user.getRole() == Role.DONO).count();
                if (totalDonos <= 1) {
                    throw new IllegalStateException("Não é permitido excluir o único Dono do sistema.");
                }
            }
            usuarioRepository.delete(u);
            auditoriaService.registrar("EXCLUSAO", "USUARIO", id.toString(), "Excluiu o usuário " + u.getNome() + " (" + u.getEmail() + ")");
            return true;
        }).orElse(false);
    }
}
