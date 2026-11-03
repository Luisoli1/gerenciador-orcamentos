package com.luisoliveira.ger_orcamentos.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ItemVariacaoDto {

    private String nomeFornecedor;
    private String nomeContato;
    private String emailContato;
    private String telefoneContato;
    private String descricaoItem;
    private BigDecimal precoAtual;
    private BigDecimal precoAnterior;
    private String numeroOrcamentoAtual;
    private String numeroOrcamentoAnterior;
    private LocalDate dataEmissaoAnterior;
    private BigDecimal percentualVariacao;

    public ItemVariacaoDto(String nomeFornecedor, String nomeContato, String descricaoItem, BigDecimal precoAtual,
                           BigDecimal precoAnterior, String numeroOrcamentoAnterior, LocalDate dataEmissaoAnterior) {
        this(nomeFornecedor, nomeContato, null, null, descricaoItem, precoAtual, precoAnterior, null, numeroOrcamentoAnterior, dataEmissaoAnterior);
    }

    public ItemVariacaoDto(String nomeFornecedor, String nomeContato, String emailContato, String telefoneContato,
                           String descricaoItem, BigDecimal precoAtual, BigDecimal precoAnterior,
                           String numeroOrcamentoAtual, String numeroOrcamentoAnterior, LocalDate dataEmissaoAnterior) {
        this.nomeFornecedor = nomeFornecedor;
        this.nomeContato = nomeContato;
        this.emailContato = emailContato;
        this.telefoneContato = telefoneContato;
        this.descricaoItem = descricaoItem;
        this.precoAtual = precoAtual;
        this.precoAnterior = precoAnterior;
        this.numeroOrcamentoAtual = numeroOrcamentoAtual;
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
    public String getNomeContato() { return nomeContato; }
    public String getEmailContato() { return emailContato; }
    public String getTelefoneContato() { return telefoneContato; }
    public String getDescricaoItem() { return descricaoItem; }
    public BigDecimal getPrecoAtual() { return precoAtual; }
    public BigDecimal getPrecoAnterior() { return precoAnterior; }
    public String getNumeroOrcamentoAtual() { return numeroOrcamentoAtual; }
    public String getNumeroOrcamentoAnterior() { return numeroOrcamentoAnterior; }
    public LocalDate getDataEmissaoAnterior() { return dataEmissaoAnterior; }
    public BigDecimal getPercentualVariacao() { return percentualVariacao; }
}
