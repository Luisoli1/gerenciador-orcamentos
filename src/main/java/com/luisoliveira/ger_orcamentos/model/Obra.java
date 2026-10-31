package com.luisoliveira.ger_orcamentos.model;

import jakarta.persistence.*;

@Entity
@Table(name = "tb_obra")
public class Obra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nomeObra;
    private String nomeCliente;
    private String cnpjCliente;

    @Column(nullable = false)
    private Long proximoNumeroQc = 1L; // Controla o sequencial do QC começando em 1

    public Obra() {}

    public Obra(String nomeObra, String nomeCliente, String cnpjCliente) {
        this.nomeObra = nomeObra;
        this.nomeCliente = nomeCliente;
        this.cnpjCliente = cnpjCliente;
        this.proximoNumeroQc = 1L;
    }

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNomeObra() { return nomeObra; }
    public void setNomeObra(String nomeObra) { this.nomeObra = nomeObra; }

    public String getNomeCliente() { return nomeCliente; }
    public void setNomeCliente(String nomeCliente) { this.nomeCliente = nomeCliente; }

    public String getCnpjCliente() { return cnpjCliente; }
    public void setCnpjCliente(String cnpjCliente) { this.cnpjCliente = cnpjCliente; }

    public Long getProximoNumeroQc() { return proximoNumeroQc; }
    public void setProximoNumeroQc(Long proximoNumeroQc) { this.proximoNumeroQc = proximoNumeroQc; }
}
