package com.luisoliveira.ger_orcamentos.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "tb_qc")
public class Qc implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String numeroQuadro; // Ex: QC-001, QC-002

    @Column(nullable = false)
    private LocalDate dataCriacao;

    @ManyToOne
    @JoinColumn(name = "obra_id")
    private Obra obra;

    @JsonIgnore
    @OneToMany(mappedBy = "qc", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Orcamento> orcamentos = new ArrayList<>();

    public Qc() {}

    public Qc(String numeroQuadro, LocalDate dataCriacao, Obra obra) {
        this.numeroQuadro = numeroQuadro;
        this.dataCriacao = dataCriacao;
        this.obra = obra;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNumeroQuadro() {
        return numeroQuadro;
    }

    public void setNumeroQuadro(String numeroQuadro) {
        this.numeroQuadro = numeroQuadro;
    }

    public LocalDate getDataCriacao() {
        return dataCriacao;
    }

    public void setDataCriacao(LocalDate dataCriacao) {
        this.dataCriacao = dataCriacao;
    }

    public Obra getObra() {
        return obra;
    }

    public void setObra(Obra obra) {
        this.obra = obra;
    }

    public List<Orcamento> getOrcamentos() {
        return orcamentos;
    }

    public void setOrcamentos(List<Orcamento> orcamentos) {
        this.orcamentos = orcamentos;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Qc qc)) return false;
        return Objects.equals(id, qc.id) && Objects.equals(numeroQuadro, qc.numeroQuadro);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, numeroQuadro);
    }
}