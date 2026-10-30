package com.luisoliveira.ger_orcamentos.dto;

import java.util.List;

public class QuadroComparativoDto {

    private List<QuadroConcorrenciaDto> orcamentos;
    private String fornecedorVencedor;
    private String observacao;

    public QuadroComparativoDto() {
    }

    public QuadroComparativoDto(List<QuadroConcorrenciaDto> orcamentos, String fornecedorVencedor, String observacao) {
        this.orcamentos = orcamentos;
        this.fornecedorVencedor = fornecedorVencedor;
        this.observacao = observacao;
    }

    // Getters e Setters
    public List<QuadroConcorrenciaDto> getOrcamentos() {
        return orcamentos;
    }

    public void setOrcamentos(List<QuadroConcorrenciaDto> orcamentos) {
        this.orcamentos = orcamentos;
    }

    public String getFornecedorVencedor() {
        return fornecedorVencedor;
    }

    public void setFornecedorVencedor(String fornecedorVencedor) {
        this.fornecedorVencedor = fornecedorVencedor;
    }

    public String getObservacao() {
        return observacao;
    }

    public void setObservacao(String observacao) {
        this.observacao = observacao;
    }
}

