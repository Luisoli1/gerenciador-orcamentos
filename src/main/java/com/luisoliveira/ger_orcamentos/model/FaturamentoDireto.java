package com.luisoliveira.ger_orcamentos.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tb_faturamento_direto")
public class FaturamentoDireto implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String numeroControle; // ex: 001, 002

    private String dataElaboracao; // ex: 04/2024
    private String revisao = "00";
    private String contratoDe = "Instalações Elétrica / hidráulica";
    private String numeroContrato;

    @Column(length = 1000)
    private String observacoes = "Na nota fiscal deverá conter o número do pedido, acompanhado do boleto bancário e cópia deste formulário no momento da entrega dos materiais.";

    private Boolean fornecedorCadastrado = true;
    private Boolean fornecedorVinculado = true;
    private Boolean saldoOk = true;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "obra_id")
    private Obra obra;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "fornecedor_id")
    private Fornecedor fornecedor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "qc_id")
    private Qc qc;

    // DADOS DO FORNECEDOR TERCEIRO (FATURAMENTO DIRETO)
    private String fornecedorNome;
    private String fornecedorEndereco;
    private String fornecedorCep;
    private String fornecedorCnpj;
    private String fornecedorTelefone;
    private String fornecedorEmail;
    private String fornecedorContato;

    // DADOS DE FATURAMENTO (EMPRESA CONTRATANTE)
    private String clienteEmpresa;
    private String clienteEndereco;
    private String clienteCep;
    private String clienteCnpj;
    private String clienteTelefone;
    private String clienteEmail;
    private String clienteContato;

    // DADOS DA EMPRESA CONTRATADA (FORNECEDOR PRINCIPAL)
    private String contratadaEmpresa = "MAKINSTHAL INSTALADORA E ENGENHARIA LTDA";
    private String contratadaEndereco = "R. HELENA BARBOSA MARCONDES, 80 - OSASCO - SÃO PAULO";
    private String contratadaCep = "06060-150";
    private String contratadaCnpj = "29.080.978/0001-92";
    private String contratadaTelefone = "11 5881-2881";
    private String contratadaEmail = "adm@makinsthal.com.br";
    private String contratadaContato = "Engenharia";

    // DADOS PARA ENTREGA DO MATERIAL
    private String entregaObra;
    private String entregaEndereco;
    private String entregaCep;
    private String entregaCnpj;
    private String entregaTelefone;
    private String entregaEmail;
    private String entregaContato;

    private BigDecimal valorTotalGeral;

    @OneToMany(mappedBy = "faturamentoDireto", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItemFaturamentoDireto> itens = new ArrayList<>();

    public FaturamentoDireto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNumeroControle() { return numeroControle; }
    public void setNumeroControle(String numeroControle) { this.numeroControle = numeroControle; }

    public String getDataElaboracao() { return dataElaboracao; }
    public void setDataElaboracao(String dataElaboracao) { this.dataElaboracao = dataElaboracao; }

    public String getRevisao() { return revisao; }
    public void setRevisao(String revisao) { this.revisao = revisao; }

    public String getContratoDe() { return contratoDe; }
    public void setContratoDe(String contratoDe) { this.contratoDe = contratoDe; }

    public String getNumeroContrato() { return numeroContrato; }
    public void setNumeroContrato(String numeroContrato) { this.numeroContrato = numeroContrato; }

    public String getObservacoes() { return observacoes; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }

    public Boolean getFornecedorCadastrado() { return fornecedorCadastrado; }
    public void setFornecedorCadastrado(Boolean fornecedorCadastrado) { this.fornecedorCadastrado = fornecedorCadastrado; }

    public Boolean getFornecedorVinculado() { return fornecedorVinculado; }
    public void setFornecedorVinculado(Boolean fornecedorVinculado) { this.fornecedorVinculado = fornecedorVinculado; }

    public Boolean getSaldoOk() { return saldoOk; }
    public void setSaldoOk(Boolean saldoOk) { this.saldoOk = saldoOk; }

    public Obra getObra() { return obra; }
    public void setObra(Obra obra) { this.obra = obra; }

    public Fornecedor getFornecedor() { return fornecedor; }
    public void setFornecedor(Fornecedor fornecedor) { this.fornecedor = fornecedor; }

    public Qc getQc() { return qc; }
    public void setQc(Qc qc) { this.qc = qc; }

    public String getFornecedorNome() { return fornecedorNome; }
    public void setFornecedorNome(String fornecedorNome) { this.fornecedorNome = fornecedorNome; }

    public String getFornecedorEndereco() { return fornecedorEndereco; }
    public void setFornecedorEndereco(String fornecedorEndereco) { this.fornecedorEndereco = fornecedorEndereco; }

    public String getFornecedorCep() { return fornecedorCep; }
    public void setFornecedorCep(String fornecedorCep) { this.fornecedorCep = fornecedorCep; }

    public String getFornecedorCnpj() { return fornecedorCnpj; }
    public void setFornecedorCnpj(String fornecedorCnpj) { this.fornecedorCnpj = fornecedorCnpj; }

    public String getFornecedorTelefone() { return fornecedorTelefone; }
    public void setFornecedorTelefone(String fornecedorTelefone) { this.fornecedorTelefone = fornecedorTelefone; }

    public String getFornecedorEmail() { return fornecedorEmail; }
    public void setFornecedorEmail(String fornecedorEmail) { this.fornecedorEmail = fornecedorEmail; }

    public String getFornecedorContato() { return fornecedorContato; }
    public void setFornecedorContato(String fornecedorContato) { this.fornecedorContato = fornecedorContato; }

    public String getClienteEmpresa() { return clienteEmpresa; }
    public void setClienteEmpresa(String clienteEmpresa) { this.clienteEmpresa = clienteEmpresa; }

    public String getClienteEndereco() { return clienteEndereco; }
    public void setClienteEndereco(String clienteEndereco) { this.clienteEndereco = clienteEndereco; }

    public String getClienteCep() { return clienteCep; }
    public void setClienteCep(String clienteCep) { this.clienteCep = clienteCep; }

    public String getClienteCnpj() { return clienteCnpj; }
    public void setClienteCnpj(String clienteCnpj) { this.clienteCnpj = clienteCnpj; }

    public String getClienteTelefone() { return clienteTelefone; }
    public void setClienteTelefone(String clienteTelefone) { this.clienteTelefone = clienteTelefone; }

    public String getClienteEmail() { return clienteEmail; }
    public void setClienteEmail(String clienteEmail) { this.clienteEmail = clienteEmail; }

    public String getClienteContato() { return clienteContato; }
    public void setClienteContato(String clienteContato) { this.clienteContato = clienteContato; }

    public String getContratadaEmpresa() { return contratadaEmpresa; }
    public void setContratadaEmpresa(String contratadaEmpresa) { this.contratadaEmpresa = contratadaEmpresa; }

    public String getContratadaEndereco() { return contratadaEndereco; }
    public void setContratadaEndereco(String contratadaEndereco) { this.contratadaEndereco = contratadaEndereco; }

    public String getContratadaCep() { return contratadaCep; }
    public void setContratadaCep(String contratadaCep) { this.contratadaCep = contratadaCep; }

    public String getContratadaCnpj() { return contratadaCnpj; }
    public void setContratadaCnpj(String contratadaCnpj) { this.contratadaCnpj = contratadaCnpj; }

    public String getContratadaTelefone() { return contratadaTelefone; }
    public void setContratadaTelefone(String contratadaTelefone) { this.contratadaTelefone = contratadaTelefone; }

    public String getContratadaEmail() { return contratadaEmail; }
    public void setContratadaEmail(String contratadaEmail) { this.contratadaEmail = contratadaEmail; }

    public String getContratadaContato() { return contratadaContato; }
    public void setContratadaContato(String contratadaContato) { this.contratadaContato = contratadaContato; }

    public String getEntregaObra() { return entregaObra; }
    public void setEntregaObra(String entregaObra) { this.entregaObra = entregaObra; }

    public String getEntregaEndereco() { return entregaEndereco; }
    public void setEntregaEndereco(String entregaEndereco) { this.entregaEndereco = entregaEndereco; }

    public String getEntregaCep() { return entregaCep; }
    public void setEntregaCep(String entregaCep) { this.entregaCep = entregaCep; }

    public String getEntregaCnpj() { return entregaCnpj; }
    public void setEntregaCnpj(String entregaCnpj) { this.entregaCnpj = entregaCnpj; }

    public String getEntregaTelefone() { return entregaTelefone; }
    public void setEntregaTelefone(String entregaTelefone) { this.entregaTelefone = entregaTelefone; }

    public String getEntregaEmail() { return entregaEmail; }
    public void setEntregaEmail(String entregaEmail) { this.entregaEmail = entregaEmail; }

    public String getEntregaContato() { return entregaContato; }
    public void setEntregaContato(String entregaContato) { this.entregaContato = entregaContato; }

    public BigDecimal getValorTotalGeral() { return valorTotalGeral; }
    public void setValorTotalGeral(BigDecimal valorTotalGeral) { this.valorTotalGeral = valorTotalGeral; }

    public List<ItemFaturamentoDireto> getItens() { return itens; }
    public void setItens(List<ItemFaturamentoDireto> itens) { this.itens = itens; }

    public void addItem(ItemFaturamentoDireto item) {
        itens.add(item);
        item.setFaturamentoDireto(this);
    }
}
