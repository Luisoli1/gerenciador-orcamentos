package com.luisoliveira.ger_orcamentos.dto;

import java.util.List;

public class QuadroComparativoDto {

    private QuadroMetaDadosDto metadados;
    private List<QuadroConcorrenciaDto> orcamentos;
    private String fornecedorVencedor;
    private String observacao;

    public QuadroComparativoDto() {}

    public QuadroComparativoDto(QuadroMetaDadosDto metadados, List<QuadroConcorrenciaDto> orcamentos, String fornecedorVencedor, String observacao) {
        this.metadados = metadados;
        this.orcamentos = orcamentos;
        this.fornecedorVencedor = fornecedorVencedor;
        this.observacao = observacao;
    }
    // Construtor antigo para manter compatibilidade com o service atual
    public QuadroComparativoDto(List<QuadroConcorrenciaDto> orcamentos, String fornecedorVencedor, String observacao) {
        this.orcamentos = orcamentos;
        this.fornecedorVencedor = fornecedorVencedor;
        this.observacao = observacao;
    }

    // Getters e Setters
    public QuadroMetaDadosDto getMetadados() {
        return metadados;
    }

    public void setMetadados(QuadroMetaDadosDto metadados) {
        this.metadados = metadados;
    }

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
