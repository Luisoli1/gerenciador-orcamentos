package com.luisoliveira.ger_orcamentos.model;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_item_treinamento_fila")
public class ItemTreinamentoFila implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "descricao_bruta", nullable = false, length = 255)
    private String descricaoBruta;

    @Column(name = "descricao_normalizada", nullable = false, length = 255)
    private String descricaoNormalizada;

    @Column(name = "unidade_bruta", length = 20)
    private String unidadeBruta;

    @Column(name = "fornecedor_origem", length = 100)
    private String fornecedorOrigem;

    @Column(name = "documento_origem", length = 255)
    private String documentoOrigem;

    @Column(name = "tipo_fonte", nullable = false, length = 50)
    private String tipoFonte = "ORCAMENTO_HISTORICO";

    @Column(name = "status", nullable = false, length = 30)
    private String status = "PENDENTE"; // PENDENTE, VALIDADO, IGNORADO

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_canonico_escolhido_id")
    private ItemCanonico itemCanonicoEscolhido;

    @Column(name = "confianca_sugerida")
    private Integer confiancaSugerida;

    @Column(name = "data_extracao", nullable = false)
    private LocalDateTime dataExtracao = LocalDateTime.now();

    @Column(name = "validado_por", length = 100)
    private String validadoPor;

    @Column(name = "data_validacao")
    private LocalDateTime dataValidacao;

    public ItemTreinamentoFila() {}

    public ItemTreinamentoFila(String descricaoBruta, String descricaoNormalizada, String unidadeBruta, String fornecedorOrigem, String documentoOrigem, String tipoFonte) {
        this.descricaoBruta = descricaoBruta;
        this.descricaoNormalizada = descricaoNormalizada;
        this.unidadeBruta = unidadeBruta;
        this.fornecedorOrigem = fornecedorOrigem;
        this.documentoOrigem = documentoOrigem;
        this.tipoFonte = (tipoFonte != null && !tipoFonte.isBlank()) ? tipoFonte : "ORCAMENTO_HISTORICO";
        this.status = "PENDENTE";
        this.dataExtracao = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDescricaoBruta() {
        return descricaoBruta;
    }

    public void setDescricaoBruta(String descricaoBruta) {
        this.descricaoBruta = descricaoBruta;
    }

    public String getDescricaoNormalizada() {
        return descricaoNormalizada;
    }

    public void setDescricaoNormalizada(String descricaoNormalizada) {
        this.descricaoNormalizada = descricaoNormalizada;
    }

    public String getUnidadeBruta() {
        return unidadeBruta;
    }

    public void setUnidadeBruta(String unidadeBruta) {
        this.unidadeBruta = unidadeBruta;
    }

    public String getFornecedorOrigem() {
        return fornecedorOrigem;
    }

    public void setFornecedorOrigem(String fornecedorOrigem) {
        this.fornecedorOrigem = fornecedorOrigem;
    }

    public String getDocumentoOrigem() {
        return documentoOrigem;
    }

    public void setDocumentoOrigem(String documentoOrigem) {
        this.documentoOrigem = documentoOrigem;
    }

    public String getTipoFonte() {
        return tipoFonte;
    }

    public void setTipoFonte(String tipoFonte) {
        this.tipoFonte = tipoFonte;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public ItemCanonico getItemCanonicoEscolhido() {
        return itemCanonicoEscolhido;
    }

    public void setItemCanonicoEscolhido(ItemCanonico itemCanonicoEscolhido) {
        this.itemCanonicoEscolhido = itemCanonicoEscolhido;
    }

    public Integer getConfiancaSugerida() {
        return confiancaSugerida;
    }

    public void setConfiancaSugerida(Integer confiancaSugerida) {
        this.confiancaSugerida = confiancaSugerida;
    }

    public LocalDateTime getDataExtracao() {
        return dataExtracao;
    }

    public void setDataExtracao(LocalDateTime dataExtracao) {
        this.dataExtracao = dataExtracao;
    }

    public String getValidadoPor() {
        return validadoPor;
    }

    public void setValidadoPor(String validadoPor) {
        this.validadoPor = validadoPor;
    }

    public LocalDateTime getDataValidacao() {
        return dataValidacao;
    }

    public void setDataValidacao(LocalDateTime dataValidacao) {
        this.dataValidacao = dataValidacao;
    }
}
