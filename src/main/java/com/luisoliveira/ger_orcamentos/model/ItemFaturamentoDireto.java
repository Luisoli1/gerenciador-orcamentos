package com.luisoliveira.ger_orcamentos.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.io.Serializable;
import java.math.BigDecimal;

@Entity
@Table(name = "tb_item_faturamento_direto")
public class ItemFaturamentoDireto implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer itemSeq;
    private String descricao;
    private String unidade;
    private BigDecimal quantidade;
    private BigDecimal precoUnitario;
    private BigDecimal valorTotal;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faturamento_direto_id", nullable = false)
    private FaturamentoDireto faturamentoDireto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_canonico_id")
    private ItemCanonico itemCanonico;

    public ItemCanonico getItemCanonico() { return itemCanonico; }
    public void setItemCanonico(ItemCanonico itemCanonico) { this.itemCanonico = itemCanonico; }

    public ItemFaturamentoDireto() {}

    public ItemFaturamentoDireto(Integer itemSeq, String descricao, String unidade, BigDecimal quantidade, BigDecimal precoUnitario, BigDecimal valorTotal) {
        this.itemSeq = itemSeq;
        this.descricao = descricao;
        this.unidade = unidade;
        this.quantidade = quantidade;
        this.precoUnitario = precoUnitario;
        this.valorTotal = valorTotal;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getItemSeq() { return itemSeq; }
    public void setItemSeq(Integer itemSeq) { this.itemSeq = itemSeq; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public String getUnidade() { return unidade; }
    public void setUnidade(String unidade) { this.unidade = unidade; }

    public BigDecimal getQuantidade() { return quantidade; }
    public void setQuantidade(BigDecimal quantidade) { this.quantidade = quantidade; }

    public BigDecimal getPrecoUnitario() { return precoUnitario; }
    public void setPrecoUnitario(BigDecimal precoUnitario) { this.precoUnitario = precoUnitario; }

    public BigDecimal getValorTotal() { return valorTotal; }
    public void setValorTotal(BigDecimal valorTotal) { this.valorTotal = valorTotal; }

    public FaturamentoDireto getFaturamentoDireto() { return faturamentoDireto; }
    public void setFaturamentoDireto(FaturamentoDireto faturamentoDireto) { this.faturamentoDireto = faturamentoDireto; }
}
