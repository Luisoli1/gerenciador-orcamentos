package com.luisoliveira.ger_orcamentos.service;

import com.luisoliveira.ger_orcamentos.model.*;
import com.luisoliveira.ger_orcamentos.repositories.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class FaturamentoDiretoService {

    @Autowired
    private FaturamentoDiretoRepository faturamentoDiretoRepository;

    @Autowired
    private QcRepository qcRepository;

    @Autowired
    private OrcamentoRepository orcamentoRepository;

    @Autowired
    private ObraRepository obraRepository;

    @Autowired
    private FornecedorRepository fornecedorRepository;

    public List<FaturamentoDireto> listarTodos() {
        return faturamentoDiretoRepository.findAll();
    }

    public List<FaturamentoDireto> listarPorObra(Long obraId) {
        return faturamentoDiretoRepository.findByObraIdOrderByIdDesc(obraId);
    }

    public Optional<FaturamentoDireto> buscarPorId(Long id) {
        return faturamentoDiretoRepository.findById(id);
    }

    @Transactional
    public FaturamentoDireto salvar(FaturamentoDireto fd) {
        if (fd.getItens() != null) {
            BigDecimal total = BigDecimal.ZERO;
            for (ItemFaturamentoDireto item : fd.getItens()) {
                item.setFaturamentoDireto(fd);
                if (item.getQuantidade() != null && item.getPrecoUnitario() != null) {
                    item.setValorTotal(item.getQuantidade().multiply(item.getPrecoUnitario()));
                }
                if (item.getValorTotal() != null) {
                    total = total.add(item.getValorTotal());
                }
            }
            fd.setValorTotalGeral(total);
        }
        return faturamentoDiretoRepository.save(fd);
    }

    @Transactional
    public FaturamentoDireto criarAPartirDeQc(
            Long qcId,
            String fornecedorNome,
            String numeroControlePersonalizado,
            FaturamentoDireto dadosComplementares
    ) {
        Qc qc = qcRepository.findById(qcId)
                .orElseThrow(() -> new RuntimeException("QC não encontrado com ID: " + qcId));

        Obra obra = qc.getObra();

        // 1. Localiza orçamento correspondente dentro do QC
        List<Orcamento> orcamentos = orcamentoRepository.findByQcId(qcId);
        Orcamento orcamentoAlvo = orcamentos.stream()
                .filter(o -> o.getFornecedor() != null && o.getFornecedor().getNome().equalsIgnoreCase(fornecedorNome))
                .findFirst()
                .orElse(orcamentos.isEmpty() ? null : orcamentos.get(0));

        Fornecedor fornecedor = orcamentoAlvo != null ? orcamentoAlvo.getFornecedor() : null;

        // 2. Define número de controle (sequencial ou personalizado)
        String numeroControle = numeroControlePersonalizado;
        if (numeroControle == null || numeroControle.isBlank()) {
            List<FaturamentoDireto> existentes = obra != null 
                    ? faturamentoDiretoRepository.findByObraIdOrderByIdDesc(obra.getId())
                    : faturamentoDiretoRepository.findAll();
            int maxNum = 0;
            for (FaturamentoDireto f : existentes) {
                if (f.getNumeroControle() != null) {
                    try {
                        String digitos = f.getNumeroControle().replaceAll("[^0-9]", "");
                        if (!digitos.isEmpty()) {
                            int v = Integer.parseInt(digitos);
                            if (v > maxNum) maxNum = v;
                        }
                    } catch (Exception ignored) {}
                }
            }
            numeroControle = String.format("%03d", maxNum + 1);
        }

        // 3. Monta o Faturamento Direto
        FaturamentoDireto fd = new FaturamentoDireto();
        fd.setNumeroControle(numeroControle.trim().toUpperCase());
        fd.setDataElaboracao(LocalDate.now().format(DateTimeFormatter.ofPattern("MM/yyyy")));
        fd.setRevisao("00");
        fd.setContratoDe(dadosComplementares != null && dadosComplementares.getContratoDe() != null 
                ? dadosComplementares.getContratoDe() : "Instalações Elétrica / hidráulica");
        fd.setNumeroContrato(dadosComplementares != null && dadosComplementares.getNumeroContrato() != null
                ? dadosComplementares.getNumeroContrato() : (obra != null ? obra.getNumeroContrato() : ""));
        fd.setObservacoes("Na nota fiscal deverá conter o número do pedido, acompanhado do boleto bancário e cópia deste formulário no momento da entrega dos materiais.");
        fd.setFornecedorCadastrado(true);
        fd.setFornecedorVinculado(true);
        fd.setSaldoOk(true);

        fd.setQc(qc);
        fd.setObra(obra);
        fd.setFornecedor(fornecedor);

        // Preenche dados do Fornecedor Terceiro
        fd.setFornecedorNome(fornecedor != null ? fornecedor.getNome() : fornecedorNome);
        fd.setFornecedorEndereco(fornecedor != null && fornecedor.getEndereco() != null ? fornecedor.getEndereco() : (dadosComplementares != null ? dadosComplementares.getFornecedorEndereco() : ""));
        fd.setFornecedorCep(fornecedor != null && fornecedor.getCep() != null ? fornecedor.getCep() : (dadosComplementares != null ? dadosComplementares.getFornecedorCep() : ""));
        fd.setFornecedorCnpj(fornecedor != null && fornecedor.getCnpj() != null ? fornecedor.getCnpj() : (dadosComplementares != null ? dadosComplementares.getFornecedorCnpj() : ""));
        fd.setFornecedorTelefone(fornecedor != null && (fornecedor.getCelularContato() != null || fornecedor.getTelefoneContato() != null) 
                ? (fornecedor.getCelularContato() != null ? fornecedor.getCelularContato() : fornecedor.getTelefoneContato())
                : (dadosComplementares != null ? dadosComplementares.getFornecedorTelefone() : ""));
        fd.setFornecedorEmail(fornecedor != null && fornecedor.getEmailContato() != null ? fornecedor.getEmailContato() : (dadosComplementares != null ? dadosComplementares.getFornecedorEmail() : ""));
        fd.setFornecedorContato(fornecedor != null && fornecedor.getNomeContato() != null ? fornecedor.getNomeContato() : (dadosComplementares != null ? dadosComplementares.getFornecedorContato() : ""));

        // Preenche dados de Faturamento (Cliente / Contratante)
        fd.setClienteEmpresa(obra != null && obra.getNomeCliente() != null ? obra.getNomeCliente() : (dadosComplementares != null ? dadosComplementares.getClienteEmpresa() : ""));
        fd.setClienteEndereco(obra != null && obra.getEnderecoObra() != null ? obra.getEnderecoObra() : (dadosComplementares != null ? dadosComplementares.getClienteEndereco() : ""));
        fd.setClienteCep(obra != null && obra.getCepObra() != null ? obra.getCepObra() : (dadosComplementares != null ? dadosComplementares.getClienteCep() : ""));
        fd.setClienteCnpj(obra != null && obra.getCnpjCliente() != null ? obra.getCnpjCliente() : (dadosComplementares != null ? dadosComplementares.getClienteCnpj() : ""));
        fd.setClienteTelefone(obra != null && obra.getTelefoneCliente() != null ? obra.getTelefoneCliente() : (dadosComplementares != null ? dadosComplementares.getClienteTelefone() : ""));
        fd.setClienteEmail(obra != null && obra.getEmailCliente() != null ? obra.getEmailCliente() : (dadosComplementares != null ? dadosComplementares.getClienteEmail() : ""));
        fd.setClienteContato(obra != null && obra.getContatoCliente() != null ? obra.getContatoCliente() : (dadosComplementares != null ? dadosComplementares.getClienteContato() : ""));

        // Preenche dados para Entrega do Material
        fd.setEntregaObra(obra != null ? obra.getNomeObra() : (dadosComplementares != null ? dadosComplementares.getEntregaObra() : ""));
        fd.setEntregaEndereco(obra != null && obra.getEnderecoEntrega() != null ? obra.getEnderecoEntrega() : (dadosComplementares != null ? dadosComplementares.getEntregaEndereco() : (obra != null ? obra.getEnderecoObra() : "")));
        fd.setEntregaCep(obra != null && obra.getCepEntrega() != null ? obra.getCepEntrega() : (dadosComplementares != null ? dadosComplementares.getEntregaCep() : (obra != null ? obra.getCepObra() : "")));
        fd.setEntregaCnpj(obra != null && obra.getCnpjCliente() != null ? obra.getCnpjCliente() : (dadosComplementares != null ? dadosComplementares.getEntregaCnpj() : ""));
        fd.setEntregaTelefone(obra != null && obra.getTelefoneEntrega() != null ? obra.getTelefoneEntrega() : (dadosComplementares != null ? dadosComplementares.getEntregaTelefone() : (obra != null ? obra.getTelefoneCliente() : "")));
        fd.setEntregaEmail(obra != null && obra.getEmailEntrega() != null ? obra.getEmailEntrega() : (dadosComplementares != null ? dadosComplementares.getEntregaEmail() : (obra != null ? obra.getEmailCliente() : "")));
        fd.setEntregaContato(obra != null && obra.getContatoEntrega() != null ? obra.getContatoEntrega() : (dadosComplementares != null ? dadosComplementares.getEntregaContato() : ""));

        // 4. Se o usuário informou campos adicionais na hora da criação, salva no banco pro próximo!
        if (dadosComplementares != null) {
            if (fornecedor != null) {
                boolean alterouFornecedor = false;
                if (dadosComplementares.getFornecedorEndereco() != null && !dadosComplementares.getFornecedorEndereco().isBlank()) {
                    fornecedor.setEndereco(dadosComplementares.getFornecedorEndereco().trim());
                    alterouFornecedor = true;
                }
                if (dadosComplementares.getFornecedorCep() != null && !dadosComplementares.getFornecedorCep().isBlank()) {
                    fornecedor.setCep(dadosComplementares.getFornecedorCep().trim());
                    alterouFornecedor = true;
                }
                if (alterouFornecedor) fornecedorRepository.save(fornecedor);
            }

            if (obra != null) {
                boolean alterouObra = false;
                if (dadosComplementares.getClienteEndereco() != null && !dadosComplementares.getClienteEndereco().isBlank()) {
                    obra.setEnderecoObra(dadosComplementares.getClienteEndereco().trim());
                    alterouObra = true;
                }
                if (dadosComplementares.getClienteCep() != null && !dadosComplementares.getClienteCep().isBlank()) {
                    obra.setCepObra(dadosComplementares.getClienteCep().trim());
                    alterouObra = true;
                }
                if (dadosComplementares.getClienteTelefone() != null && !dadosComplementares.getClienteTelefone().isBlank()) {
                    obra.setTelefoneCliente(dadosComplementares.getClienteTelefone().trim());
                    alterouObra = true;
                }
                if (dadosComplementares.getClienteEmail() != null && !dadosComplementares.getClienteEmail().isBlank()) {
                    obra.setEmailCliente(dadosComplementares.getClienteEmail().trim());
                    alterouObra = true;
                }
                if (dadosComplementares.getClienteContato() != null && !dadosComplementares.getClienteContato().isBlank()) {
                    obra.setContatoCliente(dadosComplementares.getClienteContato().trim());
                    alterouObra = true;
                }
                if (dadosComplementares.getEntregaEndereco() != null && !dadosComplementares.getEntregaEndereco().isBlank()) {
                    obra.setEnderecoEntrega(dadosComplementares.getEntregaEndereco().trim());
                    alterouObra = true;
                }
                if (dadosComplementares.getEntregaCep() != null && !dadosComplementares.getEntregaCep().isBlank()) {
                    obra.setCepEntrega(dadosComplementares.getEntregaCep().trim());
                    alterouObra = true;
                }
                if (dadosComplementares.getNumeroContrato() != null && !dadosComplementares.getNumeroContrato().isBlank()) {
                    obra.setNumeroContrato(dadosComplementares.getNumeroContrato().trim());
                    alterouObra = true;
                }
                if (alterouObra) obraRepository.save(obra);
            }
        }

        // 5. Copia todos os itens cotados do orçamento para o Faturamento Direto
        BigDecimal totalGeral = BigDecimal.ZERO;
        if (orcamentoAlvo != null && orcamentoAlvo.getItens() != null) {
            int seq = 1;
            for (ItemOrcamento it : orcamentoAlvo.getItens()) {
                ItemFaturamentoDireto itemFd = new ItemFaturamentoDireto();
                itemFd.setItemSeq(seq++);
                itemFd.setDescricao(it.getDescricao());
                itemFd.setUnidade(it.getUnidadeDeMedida() != null ? it.getUnidadeDeMedida() : "PÇ");
                itemFd.setQuantidade(it.getQuantidade() != null ? it.getQuantidade() : BigDecimal.ONE);
                itemFd.setPrecoUnitario(it.getValorUnitario() != null ? it.getValorUnitario() : BigDecimal.ZERO);
                
                BigDecimal itemTot = itemFd.getQuantidade().multiply(itemFd.getPrecoUnitario());
                itemFd.setValorTotal(itemTot);
                totalGeral = totalGeral.add(itemTot);

                fd.addItem(itemFd);
            }
        }
        fd.setValorTotalGeral(totalGeral);

        return faturamentoDiretoRepository.save(fd);
    }

    @Transactional
    public Optional<FaturamentoDireto> atualizar(Long id, FaturamentoDireto atualizado) {
        return faturamentoDiretoRepository.findById(id).map(existente -> {
            if (atualizado.getNumeroControle() != null) existente.setNumeroControle(atualizado.getNumeroControle());
            if (atualizado.getDataElaboracao() != null) existente.setDataElaboracao(atualizado.getDataElaboracao());
            if (atualizado.getRevisao() != null) existente.setRevisao(atualizado.getRevisao());
            if (atualizado.getContratoDe() != null) existente.setContratoDe(atualizado.getContratoDe());
            if (atualizado.getNumeroContrato() != null) existente.setNumeroContrato(atualizado.getNumeroContrato());
            if (atualizado.getObservacoes() != null) existente.setObservacoes(atualizado.getObservacoes());
            if (atualizado.getFornecedorCadastrado() != null) existente.setFornecedorCadastrado(atualizado.getFornecedorCadastrado());
            if (atualizado.getFornecedorVinculado() != null) existente.setFornecedorVinculado(atualizado.getFornecedorVinculado());
            if (atualizado.getSaldoOk() != null) existente.setSaldoOk(atualizado.getSaldoOk());

            // Fornecedor
            if (atualizado.getFornecedorNome() != null) existente.setFornecedorNome(atualizado.getFornecedorNome());
            if (atualizado.getFornecedorEndereco() != null) existente.setFornecedorEndereco(atualizado.getFornecedorEndereco());
            if (atualizado.getFornecedorCep() != null) existente.setFornecedorCep(atualizado.getFornecedorCep());
            if (atualizado.getFornecedorCnpj() != null) existente.setFornecedorCnpj(atualizado.getFornecedorCnpj());
            if (atualizado.getFornecedorTelefone() != null) existente.setFornecedorTelefone(atualizado.getFornecedorTelefone());
            if (atualizado.getFornecedorEmail() != null) existente.setFornecedorEmail(atualizado.getFornecedorEmail());
            if (atualizado.getFornecedorContato() != null) existente.setFornecedorContato(atualizado.getFornecedorContato());

            // Cliente
            if (atualizado.getClienteEmpresa() != null) existente.setClienteEmpresa(atualizado.getClienteEmpresa());
            if (atualizado.getClienteEndereco() != null) existente.setClienteEndereco(atualizado.getClienteEndereco());
            if (atualizado.getClienteCep() != null) existente.setClienteCep(atualizado.getClienteCep());
            if (atualizado.getClienteCnpj() != null) existente.setClienteCnpj(atualizado.getClienteCnpj());
            if (atualizado.getClienteTelefone() != null) existente.setClienteTelefone(atualizado.getClienteTelefone());
            if (atualizado.getClienteEmail() != null) existente.setClienteEmail(atualizado.getClienteEmail());
            if (atualizado.getClienteContato() != null) existente.setClienteContato(atualizado.getClienteContato());

            // Entrega
            if (atualizado.getEntregaObra() != null) existente.setEntregaObra(atualizado.getEntregaObra());
            if (atualizado.getEntregaEndereco() != null) existente.setEntregaEndereco(atualizado.getEntregaEndereco());
            if (atualizado.getEntregaCep() != null) existente.setEntregaCep(atualizado.getEntregaCep());
            if (atualizado.getEntregaCnpj() != null) existente.setEntregaCnpj(atualizado.getEntregaCnpj());
            if (atualizado.getEntregaTelefone() != null) existente.setEntregaTelefone(atualizado.getEntregaTelefone());
            if (atualizado.getEntregaEmail() != null) existente.setEntregaEmail(atualizado.getEntregaEmail());
            if (atualizado.getEntregaContato() != null) existente.setEntregaContato(atualizado.getEntregaContato());

            // Itens
            if (atualizado.getItens() != null) {
                existente.getItens().clear();
                BigDecimal total = BigDecimal.ZERO;
                int seq = 1;
                for (ItemFaturamentoDireto item : atualizado.getItens()) {
                    ItemFaturamentoDireto novoItem = new ItemFaturamentoDireto();
                    novoItem.setItemSeq(seq++);
                    novoItem.setDescricao(item.getDescricao());
                    novoItem.setUnidade(item.getUnidade());
                    novoItem.setQuantidade(item.getQuantidade());
                    novoItem.setPrecoUnitario(item.getPrecoUnitario());
                    if (item.getQuantidade() != null && item.getPrecoUnitario() != null) {
                        novoItem.setValorTotal(item.getQuantidade().multiply(item.getPrecoUnitario()));
                    } else {
                        novoItem.setValorTotal(item.getValorTotal());
                    }
                    if (novoItem.getValorTotal() != null) {
                        total = total.add(novoItem.getValorTotal());
                    }
                    existente.addItem(novoItem);
                }
                existente.setValorTotalGeral(total);
            }

            return faturamentoDiretoRepository.save(existente);
        });
    }

    public boolean deletar(Long id) {
        if (faturamentoDiretoRepository.existsById(id)) {
            faturamentoDiretoRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // --- GERADOR EXCEL (.xlsx) IDÊNTICO À PLANILHA FORNECIDA ---
    public ByteArrayInputStream gerarExcelFaturamentoDireto(Long id) {
        FaturamentoDireto fd = faturamentoDiretoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Faturamento Direto não encontrado: " + id));

        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Faturamento Direto");
            sheet.setDisplayGridlines(true);

            // Largura das Colunas
            sheet.setColumnWidth(0, 10000); // Descrição
            sheet.setColumnWidth(1, 2500);  // Unid
            sheet.setColumnWidth(2, 2500);  // Qtde
            sheet.setColumnWidth(3, 4000);  // Preço Unit
            sheet.setColumnWidth(4, 4500);  // Total

            // Fontes
            Font fTitle = wb.createFont();
            fTitle.setFontName("Arial");
            fTitle.setBold(true);
            fTitle.setFontHeightInPoints((short) 11);

            Font fBold = wb.createFont();
            fBold.setFontName("Arial");
            fBold.setBold(true);
            fBold.setFontHeightInPoints((short) 9);

            Font fNormal = wb.createFont();
            fNormal.setFontName("Arial");
            fNormal.setFontHeightInPoints((short) 8);

            Font fControle = wb.createFont();
            fControle.setFontName("Arial");
            fControle.setBold(true);
            fControle.setFontHeightInPoints((short) 14);

            Font fRed = wb.createFont();
            fRed.setFontName("Arial");
            fRed.setColor(IndexedColors.RED.getIndex());
            fRed.setFontHeightInPoints((short) 8);

            // Estilos
            CellStyle styleTitle = wb.createCellStyle();
            styleTitle.setFont(fTitle);
            styleTitle.setAlignment(HorizontalAlignment.CENTER);
            styleTitle.setVerticalAlignment(VerticalAlignment.CENTER);
            setBorders(styleTitle);

            CellStyle styleControleBox = wb.createCellStyle();
            styleControleBox.setFillForegroundColor(IndexedColors.YELLOW.getIndex());
            styleControleBox.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            styleControleBox.setFont(fControle);
            styleControleBox.setAlignment(HorizontalAlignment.CENTER);
            styleControleBox.setVerticalAlignment(VerticalAlignment.CENTER);
            setBorders(styleControleBox);

            CellStyle styleGrayHeader = wb.createCellStyle();
            styleGrayHeader.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            styleGrayHeader.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            styleGrayHeader.setFont(fBold);
            styleGrayHeader.setAlignment(HorizontalAlignment.CENTER);
            styleGrayHeader.setVerticalAlignment(VerticalAlignment.CENTER);
            setBorders(styleGrayHeader);

            CellStyle styleCellBold = wb.createCellStyle();
            styleCellBold.setFont(fBold);
            styleCellBold.setVerticalAlignment(VerticalAlignment.CENTER);
            setBorders(styleCellBold);

            CellStyle styleCellNormal = wb.createCellStyle();
            styleCellNormal.setFont(fNormal);
            styleCellNormal.setVerticalAlignment(VerticalAlignment.CENTER);
            setBorders(styleCellNormal);

            CellStyle styleCurrency = wb.createCellStyle();
            styleCurrency.setFont(fNormal);
            styleCurrency.setDataFormat(wb.createDataFormat().getFormat("R$ #,##0.00"));
            styleCurrency.setAlignment(HorizontalAlignment.RIGHT);
            styleCurrency.setVerticalAlignment(VerticalAlignment.CENTER);
            setBorders(styleCurrency);

            CellStyle styleCurrencyBold = wb.createCellStyle();
            styleCurrencyBold.setFont(fBold);
            styleCurrencyBold.setDataFormat(wb.createDataFormat().getFormat("R$ #,##0.00"));
            styleCurrencyBold.setAlignment(HorizontalAlignment.RIGHT);
            styleCurrencyBold.setVerticalAlignment(VerticalAlignment.CENTER);
            setBorders(styleCurrencyBold);

            int rowIdx = 0;

            // Linha 0: Título Principal
            Row r0 = sheet.createRow(rowIdx++);
            r0.setHeightInPoints(24);
            createMergedCell(sheet, r0, 0, 4, "FATURAMENTO DIRETO  -  PEDIDO DE COMPRA VINCULADA", styleTitle);

            // Linha 1: Cliente e Caixa Amarela CONTROLE
            Row r1 = sheet.createRow(rowIdx++);
            r1.setHeightInPoints(28);
            String logoCliente = fd.getClienteEmpresa() != null ? fd.getClienteEmpresa() : "CLIENTE CONTRATANTE";
            createMergedCell(sheet, r1, 0, 2, "🏢 " + logoCliente, styleCellBold);
            createMergedCell(sheet, r1, 3, 4, "CONTROLE  " + fd.getNumeroControle(), styleControleBox);

            // Linha 2: Data e Revisão
            Row r2 = sheet.createRow(rowIdx++);
            createMergedCell(sheet, r2, 0, 2, "Makinsthal Engenharia • Sistema de Gestão", styleCellNormal);
            createMergedCell(sheet, r2, 3, 4, "Data Elaboração: " + fd.getDataElaboracao() + " | Revisão: " + fd.getRevisao(), styleCellNormal);

            // Linha 3: Contrato e Checkboxes
            Row r3 = sheet.createRow(rowIdx++);
            createCell(r3, 0, "Contrato de: " + fd.getContratoDe(), styleCellNormal);
            createMergedCell(sheet, r3, 1, 2, "Nº do contrato: " + (fd.getNumeroContrato() != null ? fd.getNumeroContrato() : "-"), styleCellNormal);
            createMergedCell(sheet, r3, 3, 4, "[X] Fornecedor cadastrado", styleCellNormal);

            // Linha 4: Observações em vermelho
            Row r4 = sheet.createRow(rowIdx++);
            r4.setHeightInPoints(28);
            CellStyle styleRed = wb.createCellStyle();
            styleRed.setFont(fRed);
            styleRed.setWrapText(true);
            setBorders(styleRed);
            createMergedCell(sheet, r4, 0, 4, "Observações: " + fd.getObservacoes(), styleRed);

            // --- BLOCO 1: DADOS DO FORNECEDOR TERCEIRO ---
            Row rSec1 = sheet.createRow(rowIdx++);
            rSec1.setHeightInPoints(18);
            createMergedCell(sheet, rSec1, 0, 4, "DADOS DO FORNECEDOR TERCEIRO (FATURAMENTO DIRETO)", styleGrayHeader);

            Row rForn1 = sheet.createRow(rowIdx++);
            createCell(rForn1, 0, "Empresa: " + safe(fd.getFornecedorNome()), styleCellNormal);
            createMergedCell(sheet, rForn1, 1, 3, "Endereço: " + safe(fd.getFornecedorEndereco()), styleCellNormal);
            createCell(rForn1, 4, "CEP: " + safe(fd.getFornecedorCep()), styleCellNormal);

            Row rForn2 = sheet.createRow(rowIdx++);
            createCell(rForn2, 0, "CNPJ: " + safe(fd.getFornecedorCnpj()), styleCellNormal);
            createMergedCell(sheet, rForn2, 1, 2, "e-mail: " + safe(fd.getFornecedorEmail()), styleCellNormal);
            createCell(rForn2, 3, "Telefone: " + safe(fd.getFornecedorTelefone()), styleCellNormal);
            createCell(rForn2, 4, "Contato: " + safe(fd.getFornecedorContato()), styleCellNormal);

            // --- BLOCO 2: DADOS DE FATURAMENTO (EMPRESA CONTRATANTE) ---
            Row rSec2 = sheet.createRow(rowIdx++);
            rSec2.setHeightInPoints(18);
            createMergedCell(sheet, rSec2, 0, 4, "DADOS DE FATURAMENTO (EMPRESA CONTRATANTE)", styleGrayHeader);

            Row rCli1 = sheet.createRow(rowIdx++);
            createCell(rCli1, 0, "Empresa: " + safe(fd.getClienteEmpresa()), styleCellNormal);
            createMergedCell(sheet, rCli1, 1, 3, "Endereço Obra: " + safe(fd.getClienteEndereco()), styleCellNormal);
            createCell(rCli1, 4, "CEP: " + safe(fd.getClienteCep()), styleCellNormal);

            Row rCli2 = sheet.createRow(rowIdx++);
            createCell(rCli2, 0, "CNPJ: " + safe(fd.getClienteCnpj()), styleCellNormal);
            createMergedCell(sheet, rCli2, 1, 2, "e-mail: " + safe(fd.getClienteEmail()), styleCellNormal);
            createCell(rCli2, 3, "Telefone: " + safe(fd.getClienteTelefone()), styleCellNormal);
            createCell(rCli2, 4, "Contato: " + safe(fd.getClienteContato()), styleCellNormal);

            // --- BLOCO 3: DADOS DA EMPRESA CONTRATADA (FORNECEDOR PRINCIPAL) ---
            Row rSec3 = sheet.createRow(rowIdx++);
            rSec3.setHeightInPoints(18);
            createMergedCell(sheet, rSec3, 0, 4, "DADOS DA EMPRESA CONTRATADA (FORNECEDOR PRINCIPAL)", styleGrayHeader);

            Row rMak1 = sheet.createRow(rowIdx++);
            createCell(rMak1, 0, "Empresa: " + safe(fd.getContratadaEmpresa()), styleCellNormal);
            createMergedCell(sheet, rMak1, 1, 3, "Endereço: " + safe(fd.getContratadaEndereco()), styleCellNormal);
            createCell(rMak1, 4, "CEP: " + safe(fd.getContratadaCep()), styleCellNormal);

            Row rMak2 = sheet.createRow(rowIdx++);
            createCell(rMak2, 0, "CNPJ: " + safe(fd.getContratadaCnpj()), styleCellNormal);
            createMergedCell(sheet, rMak2, 1, 2, "e-mail: " + safe(fd.getContratadaEmail()), styleCellNormal);
            createCell(rMak2, 3, "Telefone: " + safe(fd.getContratadaTelefone()), styleCellNormal);
            createCell(rMak2, 4, "Contato: " + safe(fd.getContratadaContato()), styleCellNormal);

            // --- BLOCO 4: DADOS PARA ENTREGA DO MATERIAL ---
            Row rSec4 = sheet.createRow(rowIdx++);
            rSec4.setHeightInPoints(18);
            createMergedCell(sheet, rSec4, 0, 4, "DADOS PARA ENTREGA DO MATERIAL", styleGrayHeader);

            Row rEnt1 = sheet.createRow(rowIdx++);
            createCell(rEnt1, 0, "Obra: " + safe(fd.getEntregaObra()), styleCellNormal);
            createMergedCell(sheet, rEnt1, 1, 3, "Endereço: " + safe(fd.getEntregaEndereco()), styleCellNormal);
            createCell(rEnt1, 4, "CEP: " + safe(fd.getEntregaCep()), styleCellNormal);

            Row rEnt2 = sheet.createRow(rowIdx++);
            createCell(rEnt2, 0, "CNPJ: " + safe(fd.getEntregaCnpj()), styleCellNormal);
            createMergedCell(sheet, rEnt2, 1, 2, "e-mail: " + safe(fd.getEntregaEmail()), styleCellNormal);
            createCell(rEnt2, 3, "Telefone: " + safe(fd.getEntregaTelefone()), styleCellNormal);
            createCell(rEnt2, 4, "Contato: " + safe(fd.getEntregaContato()), styleCellNormal);

            // --- TABELA DE ITENS ---
            Row rHeaderItens = sheet.createRow(rowIdx++);
            rHeaderItens.setHeightInPoints(20);
            createCell(rHeaderItens, 0, "Descrição - Materiais", styleGrayHeader);
            createCell(rHeaderItens, 1, "Unid.", styleGrayHeader);
            createCell(rHeaderItens, 2, "Qtde.", styleGrayHeader);
            createCell(rHeaderItens, 3, "Preço Unit. R$", styleGrayHeader);
            createCell(rHeaderItens, 4, "Total R$", styleGrayHeader);

            if (fd.getItens() != null && !fd.getItens().isEmpty()) {
                for (ItemFaturamentoDireto item : fd.getItens()) {
                    Row rItem = sheet.createRow(rowIdx++);
                    createCell(rItem, 0, item.getDescricao(), styleCellNormal);
                    createCell(rItem, 1, item.getUnidade(), styleCellNormal);
                    createCell(rItem, 2, item.getQuantidade() != null ? item.getQuantidade().toString() : "1", styleCellNormal);

                    Cell cUnit = rItem.createCell(3);
                    cUnit.setCellValue(item.getPrecoUnitario() != null ? item.getPrecoUnitario().doubleValue() : 0.0);
                    cUnit.setCellStyle(styleCurrency);

                    Cell cTot = rItem.createCell(4);
                    cTot.setCellValue(item.getValorTotal() != null ? item.getValorTotal().doubleValue() : 0.0);
                    cTot.setCellStyle(styleCurrency);
                }
            } else {
                Row rVazio = sheet.createRow(rowIdx++);
                createMergedCell(sheet, rVazio, 0, 4, "Nenhum item listado", styleCellNormal);
            }

            // Linha Total Geral
            Row rTotal = sheet.createRow(rowIdx++);
            rTotal.setHeightInPoints(22);
            createMergedCell(sheet, rTotal, 0, 3, "TOTAL GERAL:", styleCellBold);
            Cell cGeral = rTotal.createCell(4);
            cGeral.setCellValue(fd.getValorTotalGeral() != null ? fd.getValorTotalGeral().doubleValue() : 0.0);
            cGeral.setCellStyle(styleCurrencyBold);

            wb.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar Excel de Faturamento Direto: " + e.getMessage(), e);
        }
    }

    private void createCell(Row row, int col, String val, CellStyle style) {
        Cell c = row.createCell(col);
        c.setCellValue(val != null ? val : "");
        c.setCellStyle(style);
    }

    private void createMergedCell(Sheet sheet, Row row, int fromCol, int toCol, String val, CellStyle style) {
        for (int c = fromCol; c <= toCol; c++) {
            Cell cell = row.createCell(c);
            cell.setCellStyle(style);
        }
        Cell first = row.getCell(fromCol);
        first.setCellValue(val != null ? val : "");
        sheet.addMergedRegion(new CellRangeAddress(row.getRowNum(), row.getRowNum(), fromCol, toCol));
    }

    private void setBorders(CellStyle style) {
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
    }

    private String safe(String s) {
        return s != null ? s : "";
    }
}
