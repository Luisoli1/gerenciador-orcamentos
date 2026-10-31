package com.luisoliveira.ger_orcamentos.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class QuadroConcorrenciaDto {

    private String nomeFornecedor;
    private String cnpjFornecedor;// Novo campo extraído pela IA
    private String nomeContato;
    private String telefoneContato;
    private String emailContato;
    private String numeroOrcamento;
    private String localCidade;
    private LocalDate dataEmissao;
    private LocalDate dataValidade;
    private BigDecimal valorTotalGeral;
    private BigDecimal valorTotalMercadoria;
    private BigDecimal valorTotalIpi;


    private List<ItemQuadroDTO> itens = new ArrayList<>();

    public QuadroConcorrenciaDto() {
    }

    public QuadroConcorrenciaDto(String nomeFornecedor, String cnpjFornecedor, String nomeContato, String telefoneContato , String emailContato ,String numeroOrcamento, String localCidade, LocalDate dataEmissao, BigDecimal valorTotalGeral, LocalDate dataValidade, BigDecimal valorTotalMercadoria, BigDecimal valorTotalIpi, List<ItemQuadroDTO> itens) {
        this.nomeFornecedor = nomeFornecedor;
        this.cnpjFornecedor = cnpjFornecedor;
        this.nomeContato = nomeContato;
        this.telefoneContato = telefoneContato;
        this.emailContato = emailContato;
        this.numeroOrcamento = numeroOrcamento;
        this.localCidade = localCidade;
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

    public String getLocalCidade() {
        return localCidade;
    }

    public void setLocalCidade(String localCidade) {
        this.localCidade = localCidade;
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

    public String getEmailContato() {
        return emailContato;
    }

    public void setEmailContato(String emailContato) {
        this.emailContato = emailContato;
    }

    public String getTelefoneContato() {
        return telefoneContato;
    }

    public void setTelefoneContato(String telefoneContato) {
        this.telefoneContato = telefoneContato;
    }

    public String getNomeContato() {
        return nomeContato;
    }

    public void setNomeContato(String nomeContato) {
        this.nomeContato = nomeContato;
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
