package com.luisoliveira.ger_orcamentos.service;

import com.luisoliveira.ger_orcamentos.model.AuditoriaLog;
import com.luisoliveira.ger_orcamentos.model.Usuario;
import com.luisoliveira.ger_orcamentos.repositories.AuditoriaLogRepository;
import com.luisoliveira.ger_orcamentos.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AuditoriaService {

    @Autowired
    private AuditoriaLogRepository auditoriaLogRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    public void registrar(String acao, String entidade, String idRegistro, String detalhes) {
        registrar(acao, entidade, idRegistro, detalhes, null);
    }

    public void registrar(String acao, String entidade, String idRegistro, String detalhes, String diffJson) {
        String email = "SISTEMA";
        String nome = "Sistema";

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            email = auth.getName();
            Optional<Usuario> u = usuarioRepository.findByEmail(email);
            nome = u.map(Usuario::getNome).orElse(email);
        }

        AuditoriaLog log = new AuditoriaLog(email, nome, acao, entidade, idRegistro, detalhes, diffJson);
        auditoriaLogRepository.save(log);
    }

    public List<AuditoriaLog> listarLogsRecentes() {
        return auditoriaLogRepository.findTop200ByOrderByDataHoraDesc();
    }

    public List<AuditoriaLog> listarLogsPorEntidade(String entidade) {
        return auditoriaLogRepository.findByEntidadeOrderByDataHoraDesc(entidade);
    }

    public List<AuditoriaLog> buscar(String termo) {
        if (termo == null || termo.isBlank()) {
            return listarLogsRecentes();
        }
        return auditoriaLogRepository.buscarPorTermo(termo.trim());
    }
}
