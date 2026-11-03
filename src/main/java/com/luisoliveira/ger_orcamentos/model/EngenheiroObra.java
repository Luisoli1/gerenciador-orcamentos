package com.luisoliveira.ger_orcamentos.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "tb_engenheiro_obra")
public class EngenheiroObra implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String email;
    private Boolean principal = false;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "obra_id")
    private Obra obra;

    public EngenheiroObra() {}

    public EngenheiroObra(String nome, String email, Boolean principal) {
        this.nome = nome;
        this.email = email;
        this.principal = principal != null ? principal : false;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Boolean getPrincipal() { return principal != null ? principal : false; }
    public void setPrincipal(Boolean principal) { this.principal = principal; }

    public Obra getObra() { return obra; }
    public void setObra(Obra obra) { this.obra = obra; }
}

