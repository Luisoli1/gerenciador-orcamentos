package com.luisoliveira.ger_orcamentos.model;

import jakarta.persistence.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Objects;

@Entity
@Table(name = "tb_item_conversao_unidade")
public class ItemConversaoUnidade implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_canonico_id", nullable = false)
    private ItemCanonico itemCanonico;

    @Column(name = "unidade_origem", nullable = false, length = 20)
    private String unidadeOrigem;

    @Column(name = "unidade_destino", nullable = false, length = 20)
    private String unidadeDestino;

    @Column(name = "fator_multiplicador", nullable = false, precision = 15, scale = 4)
    private BigDecimal fatorMultiplicador;

    public ItemConversaoUnidade() {}

    public ItemConversaoUnidade(ItemCanonico itemCanonico, String unidadeOrigem, String unidadeDestino, BigDecimal fatorMultiplicador) {
        this.itemCanonico = itemCanonico;
        this.unidadeOrigem = unidadeOrigem != null ? unidadeOrigem.trim().toUpperCase() : "";
        this.unidadeDestino = unidadeDestino != null ? unidadeDestino.trim().toUpperCase() : "";
        this.fatorMultiplicador = fatorMultiplicador;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ItemCanonico getItemCanonico() {
        return itemCanonico;
    }

    public void setItemCanonico(ItemCanonico itemCanonico) {
        this.itemCanonico = itemCanonico;
    }

    public String getUnidadeOrigem() {
        return unidadeOrigem;
    }

    public void setUnidadeOrigem(String unidadeOrigem) {
        this.unidadeOrigem = (unidadeOrigem != null) ? unidadeOrigem.trim().toUpperCase() : "";
    }

    public String getUnidadeDestino() {
        return unidadeDestino;
    }

    public void setUnidadeDestino(String unidadeDestino) {
        this.unidadeDestino = (unidadeDestino != null) ? unidadeDestino.trim().toUpperCase() : "";
    }

    public BigDecimal getFatorMultiplicador() {
        return fatorMultiplicador;
    }

    public void setFatorMultiplicador(BigDecimal fatorMultiplicador) {
        this.fatorMultiplicador = fatorMultiplicador;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ItemConversaoUnidade that = (ItemConversaoUnidade) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}

