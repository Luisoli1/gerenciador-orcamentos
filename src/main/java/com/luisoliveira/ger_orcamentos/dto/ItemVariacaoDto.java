package com.luisoliveira.ger_orcamentos.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ItemVariacaoDto {

    private String nomeFornecedor;
    private String descricaoItem;
    private BigDecimal precoAtual;
    private BigDecimal precoAnterior;
    private String numeroOrcamentoAnterior;
    private LocalDate dataEmissaoAnterior;
    private BigDecimal percentualVariacao;

    public ItemVariacaoDto(String nomeFornecedor, String descricaoItem, BigDecimal precoAtual,
                           BigDecimal precoAnterior, String numeroOrcamentoAnterior, LocalDate dataEmissaoAnterior) {
        this.nomeFornecedor = nomeFornecedor;
        this.descricaoItem = descricaoItem;
        this.precoAtual = precoAtual;
        this.precoAnterior = precoAnterior;
        this.numeroOrcamentoAnterior = numeroOrcamentoAnterior;
        this.dataEmissaoAnterior = dataEmissaoAnterior;

        if (precoAnterior != null && precoAnterior.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal diferenca = precoAtual.subtract(precoAnterior);
            this.percentualVariacao = diferenca.multiply(new BigDecimal("100"))
                    .divide(precoAnterior, 2, java.math.RoundingMode.HALF_UP);
        } else {
            this.percentualVariacao = BigDecimal.ZERO;
        }
    }

    // Getters
    public String getNomeFornecedor() { return nomeFornecedor; }
    public String getDescricaoItem() { return descricaoItem; }
    public BigDecimal getPrecoAtual() { return precoAtual; }
    public BigDecimal getPrecoAnterior() { return precoAnterior; }
    public String getNumeroOrcamentoAnterior() { return numeroOrcamentoAnterior; }
    public LocalDate getDataEmissaoAnterior() { return dataEmissaoAnterior; }
    public BigDecimal getPercentualVariacao() { return percentualVariacao; }
}

