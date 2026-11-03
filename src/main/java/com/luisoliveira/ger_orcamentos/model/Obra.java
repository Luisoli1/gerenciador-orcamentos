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
    private String enderecoObra;
    private String cepObra;
    private String telefoneCliente;
    private String emailCliente;
    private String contatoCliente;
    private String enderecoEntrega;
    private String cepEntrega;
    private String telefoneEntrega;
    private String emailEntrega;
    private String contatoEntrega;
    private String numeroContrato;

    @OneToMany(mappedBy = "obra", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private java.util.List<EngenheiroObra> engenheiros = new java.util.ArrayList<>();


    public Obra() {}

    public Obra(String nomeObra, String nomeCliente, String cnpjCliente) {
        this.nomeObra = nomeObra;
        this.nomeCliente = nomeCliente;
        this.cnpjCliente = cnpjCliente;
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


    public String getEnderecoObra() { return enderecoObra; }
    public void setEnderecoObra(String enderecoObra) { this.enderecoObra = enderecoObra; }

    public String getCepObra() { return cepObra; }
    public void setCepObra(String cepObra) { this.cepObra = cepObra; }

    public String getTelefoneCliente() { return telefoneCliente; }
    public void setTelefoneCliente(String telefoneCliente) { this.telefoneCliente = telefoneCliente; }

    public String getEmailCliente() { return emailCliente; }
    public void setEmailCliente(String emailCliente) { this.emailCliente = emailCliente; }

    public String getContatoCliente() { return contatoCliente; }
    public void setContatoCliente(String contatoCliente) { this.contatoCliente = contatoCliente; }

    public String getEnderecoEntrega() { return enderecoEntrega; }
    public void setEnderecoEntrega(String enderecoEntrega) { this.enderecoEntrega = enderecoEntrega; }

    public String getCepEntrega() { return cepEntrega; }
    public void setCepEntrega(String cepEntrega) { this.cepEntrega = cepEntrega; }

    public String getTelefoneEntrega() { return telefoneEntrega; }
    public void setTelefoneEntrega(String telefoneEntrega) { this.telefoneEntrega = telefoneEntrega; }

    public String getEmailEntrega() { return emailEntrega; }
    public void setEmailEntrega(String emailEntrega) { this.emailEntrega = emailEntrega; }

    public String getContatoEntrega() { return contatoEntrega; }
    public void setContatoEntrega(String contatoEntrega) { this.contatoEntrega = contatoEntrega; }

    public String getNumeroContrato() { return numeroContrato; }
    public void setNumeroContrato(String numeroContrato) { this.numeroContrato = numeroContrato; }

    public java.util.List<EngenheiroObra> getEngenheiros() {
        return engenheiros;
    }

    public void setEngenheiros(java.util.List<EngenheiroObra> novosEngenheiros) {
        this.engenheiros.clear();
        if (novosEngenheiros != null) {
            for (EngenheiroObra e : novosEngenheiros) {
                e.setObra(this);
                this.engenheiros.add(e);
            }
        }
    }

    public void addEngenheiro(EngenheiroObra engenheiro) {
        if (engenheiro != null) {
            engenheiro.setObra(this);
            this.engenheiros.add(engenheiro);
        }
    }
}
