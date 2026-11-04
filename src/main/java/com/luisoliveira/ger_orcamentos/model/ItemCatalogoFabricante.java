package com.luisoliveira.ger_orcamentos.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_item_catalogo_fabricante")
public class ItemCatalogoFabricante implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "fabricante_id", nullable = false)
    private Fabricante fabricante;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_canonico_id")
    private ItemCanonico itemCanonico;

    @Column(name = "codigo_fabricante", length = 100)
    private String codigoFabricante;

    @Column(name = "descricao_catalogo", nullable = false, length = 255)
    private String descricaoCatalogo;

    @Column(name = "unidade_catalogo", length = 20)
    private String unidadeCatalogo;

    @Column(name = "data_importacao", nullable = false)
    private LocalDateTime dataImportacao = LocalDateTime.now();

    public ItemCatalogoFabricante() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Fabricante getFabricante() {
        return fabricante;
    }

    public void setFabricante(Fabricante fabricante) {
        this.fabricante = fabricante;
    }

    public ItemCanonico getItemCanonico() {
        return itemCanonico;
    }

    public void setItemCanonico(ItemCanonico itemCanonico) {
        this.itemCanonico = itemCanonico;
    }

    public String getCodigoFabricante() {
        return codigoFabricante;
    }

    public void setCodigoFabricante(String codigoFabricante) {
        this.codigoFabricante = codigoFabricante;
    }

    public String getDescricaoCatalogo() {
        return descricaoCatalogo;
    }

    public void setDescricaoCatalogo(String descricaoCatalogo) {
        this.descricaoCatalogo = descricaoCatalogo;
    }

    public String getUnidadeCatalogo() {
        return unidadeCatalogo;
    }

    public void setUnidadeCatalogo(String unidadeCatalogo) {
        this.unidadeCatalogo = unidadeCatalogo;
    }

    public LocalDateTime getDataImportacao() {
        return dataImportacao;
    }

    public void setDataImportacao(LocalDateTime dataImportacao) {
        this.dataImportacao = dataImportacao;
    }
}
