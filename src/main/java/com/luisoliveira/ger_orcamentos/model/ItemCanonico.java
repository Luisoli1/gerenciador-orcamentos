package com.luisoliveira.ger_orcamentos.model;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "tb_item_canonico")
public class ItemCanonico implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo_referencia", unique = true, length = 50)
    private String codigoReferencia;

    @Column(name = "codigo_ncm", length = 10)
    private String codigoNcm;

    @Column(name = "descricao_padrao", nullable = false, length = 255)
    private String descricaoPadrao;

    @Column(name = "descricao_normalizada", nullable = false, unique = true, length = 255)
    private String descricaoNormalizada;

    @Column(name = "unidade_padrao", nullable = false, length = 20)
    private String unidadePadrao = "UN";

    @Column(name = "categoria", length = 100)
    private String categoria;

    @Column(name = "ativo", nullable = false)
    private boolean ativo = true;

    @Column(name = "data_criacao", nullable = false)
    private LocalDateTime dataCriacao = LocalDateTime.now();

    @Column(name = "criado_por", length = 100)
    private String criadoPor;

    public ItemCanonico() {}

    public ItemCanonico(String descricaoPadrao, String descricaoNormalizada, String unidadePadrao, String categoria, String criadoPor) {
        this.descricaoPadrao = descricaoPadrao;
        this.descricaoNormalizada = descricaoNormalizada;
        this.unidadePadrao = (unidadePadrao != null && !unidadePadrao.isBlank()) ? unidadePadrao.trim().toUpperCase() : "UN";
        this.categoria = categoria;
        this.criadoPor = criadoPor;
        this.dataCriacao = LocalDateTime.now();
        this.ativo = true;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCodigoReferencia() {
        return codigoReferencia;
    }

    public void setCodigoReferencia(String codigoReferencia) {
        this.codigoReferencia = codigoReferencia;
    }

    public String getCodigoNcm() {
        return codigoNcm;
    }

    public void setCodigoNcm(String codigoNcm) {
        this.codigoNcm = codigoNcm;
    }

    public String getDescricaoPadrao() {
        return descricaoPadrao;
    }

    public void setDescricaoPadrao(String descricaoPadrao) {
        this.descricaoPadrao = descricaoPadrao;
    }

    public String getDescricaoNormalizada() {
        return descricaoNormalizada;
    }

    public void setDescricaoNormalizada(String descricaoNormalizada) {
        this.descricaoNormalizada = descricaoNormalizada;
    }

    public String getUnidadePadrao() {
        return unidadePadrao;
    }

    public void setUnidadePadrao(String unidadePadrao) {
        this.unidadePadrao = unidadePadrao;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public void setAtivo(boolean ativo) {
        this.ativo = ativo;
    }

    public LocalDateTime getDataCriacao() {
        return dataCriacao;
    }

    public void setDataCriacao(LocalDateTime dataCriacao) {
        this.dataCriacao = dataCriacao;
    }

    public String getCriadoPor() {
        return criadoPor;
    }

    public void setCriadoPor(String criadoPor) {
        this.criadoPor = criadoPor;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ItemCanonico that = (ItemCanonico) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}
