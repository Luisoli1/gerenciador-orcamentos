package com.luisoliveira.ger_orcamentos.model;

import jakarta.persistence.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Objects;

@Entity
@Table(name = "tb_conversao_padrao")
public class ConversaoPadrao implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "unidade_origem", nullable = false, length = 20)
    private String unidadeOrigem;

    @Column(name = "unidade_destino", nullable = false, length = 20)
    private String unidadeDestino;

    @Column(name = "fator_multiplicador", nullable = false, precision = 15, scale = 4)
    private BigDecimal fatorMultiplicador;

    @Column(name = "descricao_regra", length = 255)
    private String descricaoRegra;

    @Column(nullable = false)
    private boolean ativo = true;

    public ConversaoPadrao() {}

    public ConversaoPadrao(String unidadeOrigem, String unidadeDestino, BigDecimal fatorMultiplicador, String descricaoRegra) {
        this.unidadeOrigem = unidadeOrigem != null ? unidadeOrigem.trim().toUpperCase() : "";
        this.unidadeDestino = unidadeDestino != null ? unidadeDestino.trim().toUpperCase() : "";
        this.fatorMultiplicador = fatorMultiplicador;
        this.descricaoRegra = descricaoRegra;
        this.ativo = true;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUnidadeOrigem() {
        return unidadeOrigem;
    }

    public void setUnidadeOrigem(String unidadeOrigem) {
        this.unidadeOrigem = (unidadeOrigem != null) ? unidadeOrigem.trim().toUpperCase() : "";
    }

    public String getUnidadeDestino() {
        return unidadeDestino;
    }

    public void setUnidadeDestino(String unidadeDestino) {
        this.unidadeDestino = (unidadeDestino != null) ? unidadeDestino.trim().toUpperCase() : "";
    }

    public BigDecimal getFatorMultiplicador() {
        return fatorMultiplicador;
    }

    public void setFatorMultiplicador(BigDecimal fatorMultiplicador) {
        this.fatorMultiplicador = fatorMultiplicador;
    }

    public String getDescricaoRegra() {
        return descricaoRegra;
    }

    public void setDescricaoRegra(String descricaoRegra) {
        this.descricaoRegra = descricaoRegra;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public void setAtivo(boolean ativo) {
        this.ativo = ativo;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ConversaoPadrao that = (ConversaoPadrao) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}

