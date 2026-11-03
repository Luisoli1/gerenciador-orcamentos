package com.luisoliveira.ger_orcamentos.model;

import jakarta.persistence.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "tb_orcamento")
public class Orcamento implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String numeroOrcamento;
    private LocalDate dataEmissao;
    private LocalDate dataValidade;

    private BigDecimal valorTotal;
    private BigDecimal valorTotalMercadoria;
    private BigDecimal valorTotalIpi;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "qc_id")
    private Qc qc;

    @OneToMany(mappedBy = "orcamento", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItemOrcamento> itens = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "fornecedor_id")
    private Fornecedor fornecedor;

    public Fornecedor getFornecedor() {
        return fornecedor;
    }

    public void setFornecedor(Fornecedor fornecedor) {
        this.fornecedor = fornecedor;
    }


    public Orcamento() {
    }

    public Orcamento(String numeroOrcamento,  LocalDate dataEmissao, LocalDate dataValidade, BigDecimal valorTotal, BigDecimal valorTotalMercadoria, BigDecimal valorTotalIpi, Fornecedor fornecedor, List<ItemOrcamento> itens) {
        this.numeroOrcamento = numeroOrcamento;
        this.dataEmissao = dataEmissao;
        this.dataValidade = dataValidade;
        this.valorTotal = valorTotal;
        this.valorTotalMercadoria = valorTotalMercadoria;
        this.valorTotalIpi = valorTotalIpi;
        this.fornecedor = fornecedor;
        this.itens = itens;
    }

    public BigDecimal getValorTotalMercadoria() {
        return valorTotalMercadoria;
    }

    public void setValorTotalMercadoria(BigDecimal valorTotalMercadoria) {
        this.valorTotalMercadoria = valorTotalMercadoria;
    }

    public Long getId() {
        return id;
    }

    public BigDecimal getValorTotalIpi() {
        return valorTotalIpi;
    }

    public void setValorTotalIpi(BigDecimal valorTotalIpi) {
        this.valorTotalIpi = valorTotalIpi;
    }

    public String getNumeroOrcamento() {
        return numeroOrcamento;
    }

    public void setNumeroOrcamento(String numeroOrcamento) {
        this.numeroOrcamento = numeroOrcamento;
    }

    public LocalDate getDataEmissao() {
        return dataEmissao;
    }

    public void setDataEmissao(LocalDate dataEmissao) {
        this.dataEmissao = dataEmissao;
    }

    public LocalDate getDataValidade() {
        return dataValidade;
    }

    public void setDataValidade(LocalDate dataValidade) {
        this.dataValidade = dataValidade;
    }

    public BigDecimal getValorTotal() {
        return valorTotal;
    }

    public void setValorTotal(BigDecimal valorTotal) {
        this.valorTotal = valorTotal;
    }


    public List<ItemOrcamento> getItens() {
        return itens;
    }

    public void setItens(List<ItemOrcamento> itens) {
        this.itens = itens;
    }

    public Qc getQc() {
        return qc;
    }

    public void setQc(Qc qc) {
        this.qc = qc;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        Orcamento orcamento = (Orcamento) o;
        return Objects.equals(id, orcamento.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}
