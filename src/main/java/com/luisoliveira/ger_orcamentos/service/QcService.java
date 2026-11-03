package com.luisoliveira.ger_orcamentos.service;

import com.luisoliveira.ger_orcamentos.dto.ItemQuadroDTO;
import com.luisoliveira.ger_orcamentos.dto.GerarQcVencedorRequestDto;
import com.luisoliveira.ger_orcamentos.dto.RestaurarItemDto;
import java.time.LocalDate;
import com.luisoliveira.ger_orcamentos.dto.DiffItemDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import com.luisoliveira.ger_orcamentos.dto.QuadroComparativoDto;
import com.luisoliveira.ger_orcamentos.dto.QuadroConcorrenciaDto;
import com.luisoliveira.ger_orcamentos.dto.QuadroMetaDadosDto;
import com.luisoliveira.ger_orcamentos.model.Fornecedor;
import com.luisoliveira.ger_orcamentos.model.ItemOrcamento;
import com.luisoliveira.ger_orcamentos.model.Obra;
import com.luisoliveira.ger_orcamentos.model.Orcamento;
import com.luisoliveira.ger_orcamentos.model.Qc;
import com.luisoliveira.ger_orcamentos.model.FaturamentoDireto;
import com.luisoliveira.ger_orcamentos.repositories.OrcamentoRepository;
import com.luisoliveira.ger_orcamentos.repositories.QcRepository;
import com.luisoliveira.ger_orcamentos.repositories.FaturamentoDiretoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class QcService {

    @Autowired
    private QcRepository qcRepository;

    @Autowired
    private OrcamentoRepository orcamentoRepository;

    @Autowired
    private AuditoriaService auditoriaService;

    @Autowired
    private FaturamentoDiretoRepository faturamentoDiretoRepository;

    public List<Qc> listarTodos() {
        return qcRepository.findAll();
    }

    public List<Qc> listarPorObra(Long obraId) {
        return qcRepository.findByObraId(obraId);
    }

    public Optional<Qc> buscarPorId(Long id) {
        return qcRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public QuadroComparativoDto montarQuadroComparativo(Long qcId) {
        Qc qc = qcRepository.findById(qcId)
                .orElseThrow(() -> new RuntimeException("QC não encontrado com ID: " + qcId));

        Obra obra = qc.getObra();
        QuadroMetaDadosDto metadados = new QuadroMetaDadosDto(
                obra != null ? obra.getNomeObra() : "",
                qc.getNumeroQuadro(),
                obra != null ? obra.getNomeCliente() : "",
                obra != null ? obra.getCnpjCliente() : "",
                qc.getDataCriacao()
        );

        List<Orcamento> orcamentos = orcamentoRepository.findByQcId(qcId);
        List<QuadroConcorrenciaDto> listaOrcamentosDto = new ArrayList<>();

        for (Orcamento orc : orcamentos) {
            Fornecedor forn = orc.getFornecedor();
            List<ItemQuadroDTO> itensDto = new ArrayList<>();

            if (orc.getItens() != null) {
                for (ItemOrcamento item : orc.getItens()) {
                    itensDto.add(new ItemQuadroDTO(
                            item.getMarca(),
                            item.getDescricao(),
                            item.getUnidadeDeMedida(),
                            item.getQuantidade(),
                            item.getValorUnitario(),
                            item.getValorTotal(),
                            item.getAliquotaIpi()
                    ));
                }
            }

            QuadroConcorrenciaDto orcDto = new QuadroConcorrenciaDto(
                    forn != null ? forn.getNome() : "Fornecedor",
                    forn != null ? forn.getCnpj() : "",
                    forn != null ? forn.getNomeContato() : "",
                    forn != null ? forn.getTelefoneContato() : "",
                    forn != null ? forn.getCelularContato() : "",
                    forn != null ? forn.getEmailContato() : "",
                    orc.getNumeroOrcamento(),
                    forn != null ? forn.getLocalCidade() : "",
                    orc.getDataEmissao(),
                    orc.getValorTotal(),
                    orc.getDataValidade(),
                    orc.getValorTotalMercadoria(),
                    orc.getValorTotalIpi(),
                    itensDto
            );
            listaOrcamentosDto.add(orcDto);
        }

        QuadroConcorrenciaDto vencedor = listaOrcamentosDto.stream()
                .filter(o -> o.getValorTotalGeral() != null)
                .min(Comparator.comparing(QuadroConcorrenciaDto::getValorTotalGeral))
                .orElse(null);

        String nomeVencedor = (vencedor != null && vencedor.getNomeFornecedor() != null)
                ? vencedor.getNomeFornecedor()
                : "Não identificado";

        String observacao = "Quadro Comparativo montado do banco de dados";

        return new QuadroComparativoDto(metadados, listaOrcamentosDto, nomeVencedor, observacao);
    }

    public Qc salvar(Qc qc) {
        return qcRepository.save(qc);
    }

    public Optional<Qc> atualizar(Long id, Qc qcAtualizado) {
        return qcRepository.findById(id).map(qcExistente -> {
            qcExistente.setNumeroQuadro(qcAtualizado.getNumeroQuadro());
            qcExistente.setDataCriacao(qcAtualizado.getDataCriacao());
            return qcRepository.save(qcExistente);
        });
    }

    @Transactional
    public boolean deletar(Long id) {
        Qc qc = qcRepository.findById(id).orElse(null);
        if (qc == null) {
            return false;
        }

        String num = qc.getNumeroQuadro();
        // Se for um QC principal (ex: QC-001), exclui primeiro todos os QCs filhos/derivados (ex: QC-001-ELECON)
        if (num != null && (!num.contains("-") || num.matches("^QC-\\d+$"))) {
            List<Qc> todosDaObra = qc.getObra() != null ? qcRepository.findAllByObraId(qc.getObra().getId()) : List.of();
            for (Qc outro : todosDaObra) {
                if (outro.getId() != null && !outro.getId().equals(id) && outro.getNumeroQuadro() != null && outro.getNumeroQuadro().startsWith(num + "-")) {
                    excluirQcEAssociacoes(outro.getId());
                }
            }
        }

        excluirQcEAssociacoes(id);
        return true;
    }

    private void excluirQcEAssociacoes(Long qcId) {
        // 1. Desvincula todos os Faturamentos Diretos apontando para este QC
        List<FaturamentoDireto> fds = faturamentoDiretoRepository.findByQcId(qcId);
        if (fds != null && !fds.isEmpty()) {
            for (FaturamentoDireto fd : fds) {
                fd.setQc(null);
                faturamentoDiretoRepository.save(fd);
            }
            faturamentoDiretoRepository.flush();
        }

        // 2. Remove os orçamentos e itens vinculados a este QC
        List<Orcamento> orcs = orcamentoRepository.findByQcId(qcId);
        if (orcs != null && !orcs.isEmpty()) {
            orcamentoRepository.deleteAll(orcs);
            orcamentoRepository.flush();
        }

        // 3. Remove o QC
        qcRepository.deleteById(qcId);
        qcRepository.flush();
    }

    @Transactional
    public QuadroComparativoDto atualizarComparativoCompleto(Long qcId, QuadroComparativoDto dto) {
        Qc qc = qcRepository.findById(qcId)
                .orElseThrow(() -> new RuntimeException("QC não encontrado com ID: " + qcId));

        List<DiffItemDto> diffs = new ArrayList<>();
        String numQcAtual = qc.getNumeroQuadro() != null ? qc.getNumeroQuadro() : ("ID " + qcId);

        // 1. Verifica alterações de metadados
        if (dto.getMetadados() != null) {
            if (dto.getMetadados().numeroQuadro() != null && !dto.getMetadados().numeroQuadro().isBlank()) {
                String novoNum = dto.getMetadados().numeroQuadro().trim().toUpperCase();
                if (!novoNum.equalsIgnoreCase(qc.getNumeroQuadro())) {
                    diffs.add(new DiffItemDto("Metadados do QC", "Geral", "Número do QC", qc.getNumeroQuadro(), novoNum));
                    qc.setNumeroQuadro(novoNum);
                }
            }
            if (dto.getMetadados().dataElaboracao() != null && !dto.getMetadados().dataElaboracao().equals(qc.getDataCriacao())) {
                diffs.add(new DiffItemDto("Metadados do QC", "Geral", "Data de Elaboração", 
                        String.valueOf(qc.getDataCriacao()), String.valueOf(dto.getMetadados().dataElaboracao())));
                qc.setDataCriacao(dto.getMetadados().dataElaboracao());
            }
            qcRepository.save(qc);
        }

        List<Orcamento> orcamentosExistentes = orcamentoRepository.findByQcId(qcId);

        // 2. Compara cada orçamento e cada item existente antes de atualizar
        if (dto.getOrcamentos() != null) {
            for (QuadroConcorrenciaDto orcDto : dto.getOrcamentos()) {
                Orcamento orcExistente = orcamentosExistentes.stream()
                        .filter(o -> {
                            if (o.getFornecedor() != null && orcDto.getNomeFornecedor() != null) {
                                String f1 = o.getFornecedor().getNome().trim().toLowerCase();
                                String f2 = orcDto.getNomeFornecedor().trim().toLowerCase();
                                if (f1.equals(f2) || f1.contains(f2) || f2.contains(f1)) return true;
                            }
                            if (o.getNumeroOrcamento() != null && orcDto.getNumeroOrcamento() != null) {
                                if (o.getNumeroOrcamento().trim().equalsIgnoreCase(orcDto.getNumeroOrcamento().trim())) return true;
                            }
                            return false;
                        })
                        .findFirst()
                        .orElse(null);

                if (orcExistente == null && orcamentosExistentes.size() == 1 && dto.getOrcamentos().size() == 1) {
                    orcExistente = orcamentosExistentes.get(0);
                }

                if (orcExistente != null) {
                    String fornNome = (orcExistente.getFornecedor() != null) ? orcExistente.getFornecedor().getNome() : "Fornecedor";

                    // Comparação de Número do Orçamento
                    if (orcDto.getNumeroOrcamento() != null && !orcDto.getNumeroOrcamento().equalsIgnoreCase(orcExistente.getNumeroOrcamento())) {
                        diffs.add(new DiffItemDto("Identificação do Orçamento", fornNome, "Número do Orçamento", 
                                orcExistente.getNumeroOrcamento(), orcDto.getNumeroOrcamento()));
                        orcExistente.setNumeroOrcamento(orcDto.getNumeroOrcamento());
                    }

                    // Comparação item por item antes de sobrescrever
                    if (orcDto.getItens() != null) {
                        List<ItemOrcamento> itensAntigos = new ArrayList<>(orcExistente.getItens());

                        for (int i = 0; i < orcDto.getItens().size(); i++) {
                            ItemQuadroDTO itemNovo = orcDto.getItens().get(i);
                            final int idx = i;

                            // Busca o item correspondente pelo texto da descrição ou pelo índice
                            ItemOrcamento itemAntigo = itensAntigos.stream()
                                    .filter(it -> it.getDescricao() != null && itemNovo.descricao() != null &&
                                            it.getDescricao().trim().equalsIgnoreCase(itemNovo.descricao().trim()))
                                    .findFirst()
                                    .orElse((idx < itensAntigos.size()) ? itensAntigos.get(idx) : null);

                            if (itemAntigo != null) {
                                String itemNome = itemNovo.descricao() != null ? itemNovo.descricao().trim() : ("Item " + (i + 1));

                                // 1. Mudança na Quantidade
                                if (itemAntigo.getQuantidade() != null && itemNovo.quantidade() != null &&
                                        itemAntigo.getQuantidade().compareTo(itemNovo.quantidade()) != 0) {
                                    diffs.add(new DiffItemDto(
                                            itemNome,
                                            fornNome,
                                            "Quantidade",
                                            formatQtd(itemAntigo.getQuantidade()) + (itemAntigo.getUnidadeDeMedida() != null ? (" " + itemAntigo.getUnidadeDeMedida()) : ""),
                                            formatQtd(itemNovo.quantidade()) + (itemNovo.unidadeMedida() != null ? (" " + itemNovo.unidadeMedida()) : "")
                                    ));
                                }

                                // 2. Mudança na Descrição
                                if (itemAntigo.getDescricao() != null && itemNovo.descricao() != null &&
                                        !itemAntigo.getDescricao().trim().equalsIgnoreCase(itemNovo.descricao().trim())) {
                                    diffs.add(new DiffItemDto(
                                            itemAntigo.getDescricao().trim(),
                                            fornNome,
                                            "Descrição do Material",
                                            itemAntigo.getDescricao().trim(),
                                            itemNovo.descricao().trim()
                                    ));
                                }

                                // 3. Mudança no Preço Unitário
                                if (itemAntigo.getValorUnitario() != null && itemNovo.valorUnitario() != null &&
                                        itemAntigo.getValorUnitario().compareTo(itemNovo.valorUnitario()) != 0) {
                                    diffs.add(new DiffItemDto(
                                            itemNome,
                                            fornNome,
                                            "Preço Unitário",
                                            "R$ " + formatMoney(itemAntigo.getValorUnitario()),
                                            "R$ " + formatMoney(itemNovo.valorUnitario())
                                    ));
                                }

                                // 4. Mudança na Unidade
                                if (itemAntigo.getUnidadeDeMedida() != null && itemNovo.unidadeMedida() != null &&
                                        !itemAntigo.getUnidadeDeMedida().trim().equalsIgnoreCase(itemNovo.unidadeMedida().trim())) {
                                    diffs.add(new DiffItemDto(
                                            itemNome,
                                            fornNome,
                                            "Unidade de Medida",
                                            itemAntigo.getUnidadeDeMedida().trim(),
                                            itemNovo.unidadeMedida().trim()
                                    ));
                                }

                                // 5. Mudança na Marca
                                if (itemAntigo.getMarca() != null && itemNovo.marca() != null &&
                                        !itemAntigo.getMarca().trim().equalsIgnoreCase(itemNovo.marca().trim())) {
                                    diffs.add(new DiffItemDto(
                                            itemNome,
                                            fornNome,
                                            "Marca",
                                            itemAntigo.getMarca().trim(),
                                            itemNovo.marca().trim()
                                    ));
                                }
                            } else {
                                diffs.add(new DiffItemDto(
                                        itemNovo.descricao(),
                                        fornNome,
                                        "Item Adicionado",
                                        "Não existia",
                                        "Qtd: " + formatQtd(itemNovo.quantidade()) + " | Unit: R$ " + formatMoney(itemNovo.valorUnitario())
                                ));
                            }
                        }

                        // Atualiza os totais do orçamento
                        if (orcDto.getValorTotalGeral() != null) orcExistente.setValorTotal(orcDto.getValorTotalGeral());
                        if (orcDto.getValorTotalMercadoria() != null) orcExistente.setValorTotalMercadoria(orcDto.getValorTotalMercadoria());
                        if (orcDto.getValorTotalIpi() != null) orcExistente.setValorTotalIpi(orcDto.getValorTotalIpi());

                        // Substitui a lista de itens
                        orcExistente.getItens().clear();
                        for (ItemQuadroDTO itemDto : orcDto.getItens()) {
                            ItemOrcamento novoItem = new ItemOrcamento();
                            novoItem.setOrcamento(orcExistente);
                            novoItem.setDescricao(itemDto.descricao());
                            novoItem.setUnidadeDeMedida(itemDto.unidadeMedida());
                            novoItem.setQuantidade(itemDto.quantidade());
                            novoItem.setValorUnitario(itemDto.valorUnitario());
                            novoItem.setValorTotal(itemDto.valorTotal());
                            novoItem.setMarca(itemDto.marca());
                            novoItem.setAliquotaIpi(itemDto.aliquotaIpi());
                            orcExistente.getItens().add(novoItem);
                        }
                    }

                    orcamentoRepository.save(orcExistente);
                }
            }
        }

        // 3. Serializa as alterações para JSON e registra na auditoria
        String diffJson = null;
        try {
            ObjectMapper mapper = new ObjectMapper();
            diffJson = mapper.writeValueAsString(diffs);
        } catch (Exception e) {
            System.err.println("Erro ao serializar diff: " + e.getMessage());
        }

        String detalhesLog;
        if (!diffs.isEmpty()) {
            List<String> sumario = new ArrayList<>();
            for (DiffItemDto d : diffs) {
                sumario.add(d.item() + " [" + d.campo() + "]: " + d.antes() + " ➔ " + d.depois());
            }
            detalhesLog = "QC " + numQcAtual + ": " + String.join(" | ", sumario);
        } else {
            detalhesLog = "QC " + numQcAtual + ": Alterações salvas (sem alterações nos valores dos itens).";
        }

        auditoriaService.registrar("ATUALIZACAO", "QC", qcId.toString(), detalhesLog, diffJson);

        return montarQuadroComparativo(qcId);
    }
    @Transactional
    public Qc gerarQcVencedor(GerarQcVencedorRequestDto dto) {
        Qc qcOriginal = qcRepository.findById(dto.qcOriginalId())
                .orElseThrow(() -> new RuntimeException("QC Original não encontrado com ID: " + dto.qcOriginalId()));

        Obra obra = qcOriginal.getObra();
        String numVencedor = dto.numeroQuadroVencedor().trim().toUpperCase();

        // Verifica se já existe um QC com este nome na mesma obra ou cria novo
        Qc novoQc = qcRepository.findByObraId(obra.getId()).stream()
                .filter(q -> q.getNumeroQuadro() != null && q.getNumeroQuadro().equalsIgnoreCase(numVencedor))
                .findFirst()
                .orElse(new Qc());

        novoQc.setObra(obra);
        novoQc.setNumeroQuadro(numVencedor);
        novoQc.setDataCriacao(LocalDate.now());
        novoQc = qcRepository.save(novoQc);

        // Busca o orçamento original do fornecedor para herdar contatos, CNPJ, etc.
        List<Orcamento> orcsOriginais = orcamentoRepository.findByQcId(qcOriginal.getId());
        Orcamento orcOriginalForn = orcsOriginais.stream()
                .filter(o -> o.getFornecedor() != null && dto.fornecedorNome() != null &&
                        (o.getFornecedor().getNome().equalsIgnoreCase(dto.fornecedorNome()) ||
                         o.getFornecedor().getNome().toLowerCase().contains(dto.fornecedorNome().toLowerCase()) ||
                         dto.fornecedorNome().toLowerCase().contains(o.getFornecedor().getNome().toLowerCase())))
                .findFirst()
                .orElse(orcsOriginais.isEmpty() ? null : orcsOriginais.get(0));

        // Busca ou cria o orçamento no novo QC
        List<Orcamento> orcsNovo = orcamentoRepository.findByQcId(novoQc.getId());
        Orcamento orcDestino = orcsNovo.isEmpty() ? new Orcamento() : orcsNovo.get(0);

        orcDestino.setQc(novoQc);
        if (orcOriginalForn != null) {
            orcDestino.setFornecedor(orcOriginalForn.getFornecedor());
            orcDestino.setNumeroOrcamento(orcOriginalForn.getNumeroOrcamento());
            orcDestino.setDataEmissao(orcOriginalForn.getDataEmissao());
            orcDestino.setDataValidade(orcOriginalForn.getDataValidade());
        }

        orcDestino.getItens().clear();
        BigDecimal totalMercadoria = BigDecimal.ZERO;

        if (dto.itensVencedores() != null) {
            for (ItemQuadroDTO itemDto : dto.itensVencedores()) {
                ItemOrcamento item = new ItemOrcamento();
                item.setOrcamento(orcDestino);
                item.setDescricao(itemDto.descricao());
                item.setQuantidade(itemDto.quantidade());
                item.setUnidadeDeMedida(itemDto.unidadeMedida());
                item.setValorUnitario(itemDto.valorUnitario());
                item.setValorTotal(itemDto.valorTotal());
                item.setMarca(itemDto.marca());
                item.setAliquotaIpi(itemDto.aliquotaIpi());
                orcDestino.getItens().add(item);

                if (itemDto.valorTotal() != null) {
                    totalMercadoria = totalMercadoria.add(itemDto.valorTotal());
                }
            }
        }

        orcDestino.setValorTotalMercadoria(totalMercadoria);
        orcDestino.setValorTotalIpi(BigDecimal.ZERO);
        orcDestino.setValorTotal(totalMercadoria);

        orcamentoRepository.save(orcDestino);

        auditoriaService.registrar("CRIACAO", "QC", novoQc.getId().toString(),
                "Gerou QC exclusivo de itens vencedores " + numVencedor + " para " + dto.fornecedorNome() +
                " (" + (dto.itensVencedores() != null ? dto.itensVencedores().size() : 0) + " itens - Total: R$ " + formatMoney(totalMercadoria) + ")");

        return novoQc;
    }


    private String formatQtd(BigDecimal qtd) {
        if (qtd == null) return "0";
        if (qtd.stripTrailingZeros().scale() <= 0) {
            return qtd.toBigInteger().toString();
        }
        return qtd.stripTrailingZeros().toPlainString();
    }

    private String formatMoney(BigDecimal val) {
        if (val == null) return "0,00";
        return String.format(java.util.Locale.forLanguageTag("pt-BR"), "%,.2f", val);
    }

    @Transactional
    public boolean restaurarItem(Long qcId, RestaurarItemDto dto) {
        Qc qc = qcRepository.findById(qcId).orElse(null);
        if (qc == null) return false;

        List<Orcamento> orcamentos = orcamentoRepository.findByQcId(qcId);
        if (orcamentos == null || orcamentos.isEmpty()) return false;

        String itemBuscado = dto.item() != null ? dto.item().trim() : "";
        String campo = dto.campo() != null ? dto.campo().trim() : "";
        String fornecedorBuscado = dto.fornecedor() != null ? dto.fornecedor().trim() : null;
        String valorAntigo = dto.valorAntigo() != null ? dto.valorAntigo().trim() : "";
        String valorAtual = dto.valorAtual() != null ? dto.valorAtual().trim() : "";

        boolean alterou = false;

        for (Orcamento orc : orcamentos) {
            if (fornecedorBuscado != null && !fornecedorBuscado.isEmpty() && orc.getFornecedor() != null) {
                String nomeForn = orc.getFornecedor().getNome();
                if (nomeForn != null && !nomeForn.equalsIgnoreCase(fornecedorBuscado)) {
                    // Para preço unitário, marca ou IPI, altera apenas no fornecedor especificado
                    if (!campo.equalsIgnoreCase("Quantidade") && !campo.toLowerCase().contains("descri")) {
                        continue;
                    }
                }
            }

            for (ItemOrcamento item : orc.getItens()) {
                if (item.getDescricao() != null && item.getDescricao().trim().equalsIgnoreCase(itemBuscado)) {
                    if (campo.equalsIgnoreCase("Quantidade")) {
                        BigDecimal novaQtd = extrairNumero(valorAntigo);
                        if (novaQtd != null) {
                            item.setQuantidade(novaQtd);
                            if (item.getValorUnitario() != null) {
                                item.setValorTotal(novaQtd.multiply(item.getValorUnitario()));
                            }
                            alterou = true;
                        }
                    } else if (campo.toLowerCase().contains("preço") || campo.toLowerCase().contains("preco") || campo.toLowerCase().contains("unitário") || campo.toLowerCase().contains("unitario")) {
                        BigDecimal novoPreco = extrairNumero(valorAntigo);
                        if (novoPreco != null) {
                            item.setValorUnitario(novoPreco);
                            if (item.getQuantidade() != null) {
                                item.setValorTotal(item.getQuantidade().multiply(novoPreco));
                            }
                            alterou = true;
                        }
                    } else if (campo.toLowerCase().contains("marca")) {
                        item.setMarca(valorAntigo);
                        alterou = true;
                    } else if (campo.toLowerCase().contains("unidade")) {
                        item.setUnidadeDeMedida(valorAntigo);
                        alterou = true;
                    } else if (campo.toLowerCase().contains("descri")) {
                        item.setDescricao(valorAntigo);
                        alterou = true;
                    } else if (campo.toLowerCase().contains("ipi")) {
                        BigDecimal novoIpi = extrairNumero(valorAntigo);
                        if (novoIpi != null) {
                            item.setAliquotaIpi(novoIpi);
                            alterou = true;
                        }
                    }
                }
            }

            if (alterou) {
                BigDecimal totalMercadoria = BigDecimal.ZERO;
                BigDecimal totalIpi = BigDecimal.ZERO;
                for (ItemOrcamento it : orc.getItens()) {
                    if (it.getValorTotal() != null) {
                        totalMercadoria = totalMercadoria.add(it.getValorTotal());
                        if (it.getAliquotaIpi() != null && it.getAliquotaIpi().compareTo(BigDecimal.ZERO) > 0) {
                            BigDecimal ipiItem = it.getValorTotal().multiply(it.getAliquotaIpi()).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
                            totalIpi = totalIpi.add(ipiItem);
                        }
                    }
                }
                orc.setValorTotalMercadoria(totalMercadoria);
                orc.setValorTotalIpi(totalIpi);
                orc.setValorTotal(totalMercadoria.add(totalIpi));
                orcamentoRepository.save(orc);
            }
        }

        if (alterou) {
            orcamentoRepository.flush();
            String numQc = qc.getNumeroQuadro() != null ? qc.getNumeroQuadro() : ("#" + qcId);
            String fornInfo = (fornecedorBuscado != null && !fornecedorBuscado.isEmpty()) ? (" (" + fornecedorBuscado + ")") : "";
            String detalhes = "QC " + numQc + ": Reverteu " + itemBuscado + fornInfo + " [" + campo + "] de '" + valorAtual + "' para '" + valorAntigo + "'";

            List<DiffItemDto> restorationDiff = List.of(new DiffItemDto(
                    itemBuscado,
                    fornecedorBuscado,
                    campo,
                    valorAtual,
                    valorAntigo
            ));
            String diffJson = null;
            try {
                ObjectMapper mapper = new ObjectMapper();
                diffJson = mapper.writeValueAsString(restorationDiff);
            } catch (Exception e) {
                System.err.println("Erro ao serializar diff de restauração: " + e.getMessage());
            }

            auditoriaService.registrar("RESTAURACAO", "QC", qcId.toString(), detalhes, diffJson);
            return true;
        }

        return false;
    }

    private BigDecimal extrairNumero(String texto) {
        if (texto == null || texto.isBlank()) return null;
        String limpo = texto.replaceAll("[^0-9,\\.]", "").trim();
        if (limpo.isEmpty()) return null;

        try {
            if (limpo.contains(",") && limpo.contains(".")) {
                if (limpo.lastIndexOf(",") > limpo.lastIndexOf(".")) {
                    limpo = limpo.replace(".", "").replace(",", ".");
                } else {
                    limpo = limpo.replace(",", "");
                }
            } else if (limpo.contains(",")) {
                limpo = limpo.replace(",", ".");
            }
            return new BigDecimal(limpo);
        } catch (Exception e) {
            return null;
        }
    }

}
