package com.luisoliveira.ger_orcamentos.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_auditoria")
public class AuditoriaLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime dataHora = LocalDateTime.now();

    @Column(nullable = false)
    private String usuarioEmail;

    @Column(nullable = false)
    private String usuarioNome;

    @Column(nullable = false)
    private String acao; // CRIACAO, ATUALIZACAO, EXCLUSAO, LOGIN

    @Column(nullable = false)
    private String entidade; // FORNECEDOR, QC, FATURAMENTO_DIRETO, OBRA, USUARIO

    private String idRegistro;

    @Column(columnDefinition = "TEXT")
    private String detalhes;

    @Column(columnDefinition = "LONGTEXT")
    private String diffJson;

    public AuditoriaLog() {}

    public AuditoriaLog(String usuarioEmail, String usuarioNome, String acao, String entidade, String idRegistro, String detalhes, String diffJson) {
        this.dataHora = LocalDateTime.now();
        this.usuarioEmail = usuarioEmail != null ? usuarioEmail : "SISTEMA";
        this.usuarioNome = usuarioNome != null ? usuarioNome : "Sistema";
        this.acao = acao;
        this.entidade = entidade;
        this.idRegistro = idRegistro;
        this.detalhes = detalhes;
        this.diffJson = diffJson;
    }

    public AuditoriaLog(String usuarioEmail, String usuarioNome, String acao, String entidade, String idRegistro, String detalhes) {
        this.dataHora = LocalDateTime.now();
        this.usuarioEmail = usuarioEmail != null ? usuarioEmail : "SISTEMA";
        this.usuarioNome = usuarioNome != null ? usuarioNome : "Sistema";
        this.acao = acao;
        this.entidade = entidade;
        this.idRegistro = idRegistro;
        this.detalhes = detalhes;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getDataHora() { return dataHora; }
    public void setDataHora(LocalDateTime dataHora) { this.dataHora = dataHora; }

    public String getUsuarioEmail() { return usuarioEmail; }
    public void setUsuarioEmail(String usuarioEmail) { this.usuarioEmail = usuarioEmail; }

    public String getUsuarioNome() { return usuarioNome; }
    public void setUsuarioNome(String usuarioNome) { this.usuarioNome = usuarioNome; }

    public String getAcao() { return acao; }
    public void setAcao(String acao) { this.acao = acao; }

    public String getEntidade() { return entidade; }
    public void setEntidade(String entidade) { this.entidade = entidade; }

    public String getIdRegistro() { return idRegistro; }
    public void setIdRegistro(String idRegistro) { this.idRegistro = idRegistro; }

    public String getDetalhes() { return detalhes; }
    public void setDetalhes(String detalhes) { this.detalhes = detalhes; }

    public String getDiffJson() { return diffJson; }
    public void setDiffJson(String diffJson) { this.diffJson = diffJson; }
}
