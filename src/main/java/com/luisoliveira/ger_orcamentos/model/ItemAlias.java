package com.luisoliveira.ger_orcamentos.model;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "tb_item_alias")
public class ItemAlias implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_canonico_id", nullable = false)
    private ItemCanonico itemCanonico;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "fornecedor_id")
    private Fornecedor fornecedor;

    @Column(name = "descricao_original", nullable = false, length = 255)
    private String descricaoOriginal;

    @Column(name = "descricao_normalizada", nullable = false, length = 255)
    private String descricaoNormalizada;

    @Column(name = "origem", nullable = false, length = 50)
    private String origem = "MANUAL";

    @Column(name = "vezes_utilizado", nullable = false)
    private int vezesUtilizado = 1;

    @Column(name = "ativo", nullable = false)
    private boolean ativo = true;

    @Column(name = "criado_por_usuario_id")
    private Long criadoPorUsuarioId;

    @Column(name = "criado_por_nome", length = 100)
    private String criadoPorNome;

    @Column(name = "data_criacao", nullable = false)
    private LocalDateTime dataCriacao = LocalDateTime.now();

    @Column(name = "alterado_por_usuario_id")
    private Long alteradoPorUsuarioId;

    @Column(name = "alterado_por_nome", length = 100)
    private String alteradoPorNome;

    @Column(name = "data_atualizacao", nullable = false)
    private LocalDateTime dataAtualizacao = LocalDateTime.now();

    public ItemAlias() {}

    public ItemAlias(ItemCanonico itemCanonico, Fornecedor fornecedor, String descricaoOriginal, String descricaoNormalizada, String origem, Long usuarioId, String usuarioNome) {
        this.itemCanonico = itemCanonico;
        this.fornecedor = fornecedor;
        this.descricaoOriginal = descricaoOriginal;
        this.descricaoNormalizada = descricaoNormalizada;
        this.origem = (origem != null && !origem.isBlank()) ? origem : "MANUAL";
        this.vezesUtilizado = 1;
        this.ativo = true;
        this.criadoPorUsuarioId = usuarioId;
        this.criadoPorNome = usuarioNome;
        this.dataCriacao = LocalDateTime.now();
        this.dataAtualizacao = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ItemCanonico getItemCanonico() {
        return itemCanonico;
    }

    public void setItemCanonico(ItemCanonico itemCanonico) {
        this.itemCanonico = itemCanonico;
    }

    public Fornecedor getFornecedor() {
        return fornecedor;
    }

    public void setFornecedor(Fornecedor fornecedor) {
        this.fornecedor = fornecedor;
    }

    public String getDescricaoOriginal() {
        return descricaoOriginal;
    }

    public void setDescricaoOriginal(String descricaoOriginal) {
        this.descricaoOriginal = descricaoOriginal;
    }

    public String getDescricaoNormalizada() {
        return descricaoNormalizada;
    }

    public void setDescricaoNormalizada(String descricaoNormalizada) {
        this.descricaoNormalizada = descricaoNormalizada;
    }

    public String getOrigem() {
        return origem;
    }

    public void setOrigem(String origem) {
        this.origem = origem;
    }

    public int getVezesUtilizado() {
        return vezesUtilizado;
    }

    public void setVezesUtilizado(int vezesUtilizado) {
        this.vezesUtilizado = vezesUtilizado;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public void setAtivo(boolean ativo) {
        this.ativo = ativo;
    }

    public Long getCriadoPorUsuarioId() {
        return criadoPorUsuarioId;
    }

    public void setCriadoPorUsuarioId(Long criadoPorUsuarioId) {
        this.criadoPorUsuarioId = criadoPorUsuarioId;
    }

    public String getCriadoPorNome() {
        return criadoPorNome;
    }

    public void setCriadoPorNome(String criadoPorNome) {
        this.criadoPorNome = criadoPorNome;
    }

    public LocalDateTime getDataCriacao() {
        return dataCriacao;
    }

    public void setDataCriacao(LocalDateTime dataCriacao) {
        this.dataCriacao = dataCriacao;
    }

    public Long getAlteradoPorUsuarioId() {
        return alteradoPorUsuarioId;
    }

    public void setAlteradoPorUsuarioId(Long alteradoPorUsuarioId) {
        this.alteradoPorUsuarioId = alteradoPorUsuarioId;
    }

    public String getAlteradoPorNome() {
        return alteradoPorNome;
    }

    public void setAlteradoPorNome(String alteradoPorNome) {
        this.alteradoPorNome = alteradoPorNome;
    }

    public LocalDateTime getDataAtualizacao() {
        return dataAtualizacao;
    }

    public void setDataAtualizacao(LocalDateTime dataAtualizacao) {
        this.dataAtualizacao = dataAtualizacao;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ItemAlias itemAlias = (ItemAlias) o;
        return Objects.equals(id, itemAlias.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}
