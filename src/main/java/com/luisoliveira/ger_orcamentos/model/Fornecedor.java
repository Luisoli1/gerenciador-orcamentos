package com.luisoliveira.ger_orcamentos.model;

import jakarta.persistence.*;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "tb_fornecedor")
public class Fornecedor implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String cnpj;
    private String nomeContato;
    private String emailContato;
    private String telefoneContato;
    private String localCidade;

    @OneToMany(mappedBy = "fornecedor", cascade = CascadeType.ALL)
    private List<Orcamento> orcamentos = new ArrayList<>();

    public Fornecedor(String nome, String cnpj, String nomeContato, String emailContato, String telefoneContato, String localCidade) {
        this.nome = nome;
        this.cnpj = cnpj;
        this.nomeContato = nomeContato;
        this.emailContato = emailContato;
        this.telefoneContato = telefoneContato;
        this.localCidade = localCidade;
    }

    public Fornecedor() {
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getCnpj() {
        return cnpj;
    }

    public void setCnpj(String cnpj) {
        this.cnpj = cnpj;
    }

    public String getNomeContato() {
        return nomeContato;
    }

    public void setNomeContato(String nomeContato) {
        this.nomeContato = nomeContato;
    }

    public String getEmailContato() {
        return emailContato;
    }

    public void setEmailContato(String emailContato) {
        this.emailContato = emailContato;
    }

    public String getTelefoneContato() {
        return telefoneContato;
    }

    public void setTelefoneContato(String telefoneContato) {
        this.telefoneContato = telefoneContato;
    }

    public String getLocalCidade() {
        return localCidade;
    }

    public void setLocalCidade(String localCidade) {
        this.localCidade = localCidade;
    }

    public List<Orcamento> getOrcamentos() {
        return orcamentos;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        Fornecedor that = (Fornecedor) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}
