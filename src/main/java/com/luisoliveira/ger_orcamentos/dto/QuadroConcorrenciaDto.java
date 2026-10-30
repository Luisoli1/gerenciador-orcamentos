package com.luisoliveira.ger_orcamentos.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class QuadroConcorrenciaDto {

    private String nomeFornecedor;
    private String cnpjFornecedor; // Novo campo extraído pela IA
    private String numeroOrcamento;
    private LocalDate dataEmissao;
    private LocalDate dataValidade;
    private BigDecimal valorTotalGeral;
    private BigDecimal valorTotalMercadoria;
    private BigDecimal valorTotalIpi;


    private List<ItemQuadroDTO> itens = new ArrayList<>();

    public QuadroConcorrenciaDto() {
    }

    public QuadroConcorrenciaDto(String nomeFornecedor, String cnpjFornecedor, String numeroOrcamento, LocalDate dataEmissao, BigDecimal valorTotalGeral, LocalDate dataValidade, BigDecimal valorTotalMercadoria, BigDecimal valorTotalIpi, List<ItemQuadroDTO> itens) {
        this.nomeFornecedor = nomeFornecedor;
        this.cnpjFornecedor = cnpjFornecedor;
        this.numeroOrcamento = numeroOrcamento;
        this.dataEmissao = dataEmissao;
        this.valorTotalGeral = valorTotalGeral;
        this.dataValidade = dataValidade;
        this.valorTotalMercadoria = valorTotalMercadoria;
        this.valorTotalIpi = valorTotalIpi;
        this.itens = itens;
    }

    public String getNomeFornecedor() {
        return nomeFornecedor;
    }

    public void setNomeFornecedor(String nomeFornecedor) {
        this.nomeFornecedor = nomeFornecedor;
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

    public BigDecimal getValorTotalGeral() {
        return valorTotalGeral;
    }

    public void setValorTotalGeral(BigDecimal valorTotalGeral) {
        this.valorTotalGeral = valorTotalGeral;
    }

    public String getCnpjFornecedor() {
        return cnpjFornecedor;
    }

    public void setCnpjFornecedor(String cnpjFornecedor) {
        this.cnpjFornecedor = cnpjFornecedor;
    }

    public List<ItemQuadroDTO> getItens() {
        return itens;
    }

    public BigDecimal getValorTotalMercadoria() {
        return valorTotalMercadoria;
    }

    public void setValorTotalMercadoria(BigDecimal valorTotalMercadoria) {
        this.valorTotalMercadoria = valorTotalMercadoria;
    }

    public BigDecimal getValorTotalIpi() {
        return valorTotalIpi;
    }

    public void setValorTotalIpi(BigDecimal valorTotalIpi) {
        this.valorTotalIpi = valorTotalIpi;
    }

    public void setItens(List<ItemQuadroDTO> itens) {
        this.itens = itens;
    }
    public void addItens(ItemQuadroDTO itemQuadroDTO){
        this.itens.add(itemQuadroDTO);
    }
}
