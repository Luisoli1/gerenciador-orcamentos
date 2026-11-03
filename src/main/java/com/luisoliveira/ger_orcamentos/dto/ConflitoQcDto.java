package com.luisoliveira.ger_orcamentos.dto;

import java.time.LocalDate;

public class ConflitoQcDto {
    private boolean duplicado;
    private Long qcId;
    private String numeroQuadro;
    private LocalDate dataQc;
    private String numeroOrcamento;
    private String nomeFornecedor;
    private String mensagem;

    public ConflitoQcDto() {}

    public ConflitoQcDto(boolean duplicado, Long qcId, String numeroQuadro, LocalDate dataQc, String numeroOrcamento, String nomeFornecedor, String mensagem) {
        this.duplicado = duplicado;
        this.qcId = qcId;
        this.numeroQuadro = numeroQuadro;
        this.dataQc = dataQc;
        this.numeroOrcamento = numeroOrcamento;
        this.nomeFornecedor = nomeFornecedor;
        this.mensagem = mensagem;
    }

    public boolean isDuplicado() { return duplicado; }
    public void setDuplicado(boolean duplicado) { this.duplicado = duplicado; }
    public Long getQcId() { return qcId; }
    public void setQcId(Long qcId) { this.qcId = qcId; }
    public String getNumeroQuadro() { return numeroQuadro; }
    public void setNumeroQuadro(String numeroQuadro) { this.numeroQuadro = numeroQuadro; }
    public LocalDate getDataQc() { return dataQc; }
    public void setDataQc(LocalDate dataQc) { this.dataQc = dataQc; }
    public String getNumeroOrcamento() { return numeroOrcamento; }
    public void setNumeroOrcamento(String numeroOrcamento) { this.numeroOrcamento = numeroOrcamento; }
    public String getNomeFornecedor() { return nomeFornecedor; }
    public void setNomeFornecedor(String nomeFornecedor) { this.nomeFornecedor = nomeFornecedor; }
    public String getMensagem() { return mensagem; }
    public void setMensagem(String mensagem) { this.mensagem = mensagem; }
}