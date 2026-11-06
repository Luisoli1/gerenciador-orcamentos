package com.luisoliveira.ger_orcamentos.service;

import com.luisoliveira.ger_orcamentos.dto.*;
import com.luisoliveira.ger_orcamentos.exceptions.ObraNaoEncontradaException;
import com.luisoliveira.ger_orcamentos.model.*;
import com.luisoliveira.ger_orcamentos.repositories.ObraRepository;
import com.luisoliveira.ger_orcamentos.repositories.OrcamentoRepository;
import com.luisoliveira.ger_orcamentos.repositories.QcRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrcamentoService {

    private final AiExtratorService aiExtratorService;
    private final OrcamentoRepository orcamentoRepository;
    private final FornecedorService fornecedorService;
    private final ObraRepository obraRepository;

    @Autowired
    private QcRepository qcRepository;

    @Autowired
    private QcService qcService;

    public OrcamentoService(AiExtratorService aiExtratorService,
                            OrcamentoRepository orcamentoRepository,
                            FornecedorService fornecedorService,
                            ObraRepository obraRepository) {
        this.aiExtratorService = aiExtratorService;
        this.orcamentoRepository = orcamentoRepository;
        this.fornecedorService = fornecedorService;
        this.obraRepository = obraRepository;
    }

    public QuadroConcorrenciaDto processarUploadOrcamento(MultipartFile file) {
        QuadroConcorrenciaDto dto = aiExtratorService.extrairDados(file);

        Orcamento orcamento = orcamentoRepository.findByNumeroOrcamento(dto.getNumeroOrcamento());
        if (orcamento == null) {
            orcamento = new Orcamento();
        }

        Fornecedor fornecedor = fornecedorService.buscarOuCriarFornecedor(dto);
        orcamento.setFornecedor(fornecedor);
        orcamento.setNumeroOrcamento(dto.getNumeroOrcamento());
        orcamento.setDataEmissao(dto.getDataEmissao());
        orcamento.setDataValidade(dto.getDataValidade());
        orcamento.setValorTotal(dto.getValorTotalGeral());
        orcamento.setValorTotalMercadoria(dto.getValorTotalMercadoria());
        orcamento.setValorTotalIpi(dto.getValorTotalIpi());

        final Orcamento orcamentoFinal = orcamento;

        if (dto.getItens() != null) {
            if (orcamento.getItens() == null) {
                orcamento.setItens(new ArrayList<>());
            } else {
                orcamento.getItens().clear();
            }

            List<ItemOrcamento> itemOrcamentos = dto.getItens().stream().map(itemQuadroDto -> {
                ItemOrcamento itemOrcamento = new ItemOrcamento();
                itemOrcamento.setMarca(itemQuadroDto.marca());
                itemOrcamento.setQuantidade(itemQuadroDto.quantidade());
                itemOrcamento.setValorTotal(itemQuadroDto.valorTotal());
                itemOrcamento.setDescricao(itemQuadroDto.descricao());
                itemOrcamento.setUnidadeDeMedida(itemQuadroDto.unidadeMedida());
                itemOrcamento.setValorUnitario(itemQuadroDto.valorUnitario());
                itemOrcamento.setAliquotaIpi(itemQuadroDto.aliquotaIpi());
                itemOrcamento.setOrcamento(orcamentoFinal);
                return itemOrcamento;
            }).collect(Collectors.toList());

            orcamento.getItens().addAll(itemOrcamentos);
        } else {
            if (orcamento.getItens() != null) {
                orcamento.getItens().clear();
            }
        }

        orcamentoRepository.save(orcamento);
        return dto;
    }

    @Transactional
    public Object processarMultiplosComObra(Long obraId, List<MultipartFile> files, boolean forceNew, String numeroQcPersonalizado) {
        Obra obra = obraRepository.findById(obraId)
                .orElseThrow(() -> new ObraNaoEncontradaException("Obra não encontrada com id: " + obraId));

        // 1. Extrai todos os dados dos arquivos em paralelo (acelera 2x o processamento)
        List<QuadroConcorrenciaDto> listaOrcamentos = files.parallelStream()
                .map(file -> aiExtratorService.extrairDados(file))
                .collect(Collectors.toList());

        // 2. Se forceNew == false, valida se algum orçamento já pertence a outro QC existente
        if (!forceNew) {
            List<Orcamento> todosComQc = orcamentoRepository.findAllWithQc();

            for (QuadroConcorrenciaDto dto : listaOrcamentos) {
                if (dto.getNumeroOrcamento() != null && !dto.getNumeroOrcamento().isBlank()) {
                    String numNovo = dto.getNumeroOrcamento().trim();
                    String numNovoLimpo = numNovo.replaceAll("[^a-zA-Z0-9]", "");

                    for (Orcamento orcExistente : todosComQc) {
                        if (orcExistente.getNumeroOrcamento() == null) continue;
                        String numExistente = orcExistente.getNumeroOrcamento().trim();
                        String numExistenteLimpo = numExistente.replaceAll("[^a-zA-Z0-9]", "");

                        boolean coincide = numNovo.equalsIgnoreCase(numExistente)
                                || (!numNovoLimpo.isEmpty() && numNovoLimpo.equalsIgnoreCase(numExistenteLimpo));

                        if (coincide && orcExistente.getQc() != null) {
                            Qc qcExistente = orcExistente.getQc();
                            String nomeForn = (dto.getNomeFornecedor() != null && !dto.getNomeFornecedor().isBlank())
                                    ? dto.getNomeFornecedor()
                                    : (orcExistente.getFornecedor() != null ? orcExistente.getFornecedor().getNome() : "Fornecedor");

                            String msg = String.format("Atenção: O orçamento nº %s (%s) já está cadastrado no %s (elaborado em %s).",
                                    dto.getNumeroOrcamento(),
                                    nomeForn,
                                    qcExistente.getNumeroQuadro(),
                                    qcExistente.getDataCriacao() != null ? qcExistente.getDataCriacao().toString() : "data anterior");

                            return new ConflitoQcDto(
                                    true,
                                    qcExistente.getId(),
                                    qcExistente.getNumeroQuadro(),
                                    qcExistente.getDataCriacao(),
                                    dto.getNumeroOrcamento(),
                                    nomeForn,
                                    msg
                            );
                        }
                    }
                }
            }
        }

        // 3. Define a numeração do QC (ou número personalizado pelo usuário ou próximo sequencial da obra)
        String numeroQcFormatado;
        if (numeroQcPersonalizado != null && !numeroQcPersonalizado.isBlank()) {
            numeroQcFormatado = numeroQcPersonalizado.trim();
        } else {
            long quantidadeQcsNaObra = qcRepository.countByObraId(obraId);
            numeroQcFormatado = String.format("QC-%03d", quantidadeQcsNaObra + 1);
        }

        Qc novoQc = new Qc(numeroQcFormatado, LocalDate.now(), obra);
        qcRepository.save(novoQc);

        QuadroMetaDadosDto metadados = new QuadroMetaDadosDto(
                obra.getNomeObra(),
                numeroQcFormatado,
                obra.getNomeCliente(),
                obra.getCnpjCliente(),
                LocalDate.now()
        );

        for (QuadroConcorrenciaDto dto : listaOrcamentos) {
            salvarOrcamentoNoBanco(dto, novoQc);
        }

        return qcService.montarQuadroComparativo(novoQc.getId());
    }

    public Object processarMultiplosComObra(Long obraId, List<MultipartFile> files, boolean forceNew) {
        return processarMultiplosComObra(obraId, files, forceNew, null);
    }

    public QuadroComparativoDto processarMultiplosComObra(Long obraId, List<MultipartFile> files) {
        Object res = processarMultiplosComObra(obraId, files, true, null);
        return (QuadroComparativoDto) res;
    }

    private void salvarOrcamentoNoBanco(QuadroConcorrenciaDto dto, Qc qc){
        Fornecedor fornecedor = fornecedorService.buscarOuCriarFornecedor(dto);

        Orcamento orcamento = new Orcamento();
        orcamento.setFornecedor(fornecedor);
        orcamento.setNumeroOrcamento(dto.getNumeroOrcamento());
        orcamento.setDataEmissao(dto.getDataEmissao());
        orcamento.setDataValidade(dto.getDataValidade());
        orcamento.setValorTotal(dto.getValorTotalGeral());
        orcamento.setValorTotalMercadoria(dto.getValorTotalMercadoria());
        orcamento.setValorTotalIpi(dto.getValorTotalIpi());
        orcamento.setQc(qc);

        final Orcamento orcamentoFinal = orcamento;

        if(dto.getItens() != null){
            if (orcamento.getItens() == null) {
                orcamento.setItens(new ArrayList<>());
            } else {
                orcamento.getItens().clear();
            }

            List<ItemOrcamento> itensEntity = dto.getItens().stream().map(itemQuadroDTO -> {
                ItemOrcamento item = new ItemOrcamento();
                item.setMarca(itemQuadroDTO.marca());
                item.setQuantidade(itemQuadroDTO.quantidade());
                item.setValorTotal(itemQuadroDTO.valorTotal());
                item.setDescricao(itemQuadroDTO.descricao());
                item.setUnidadeDeMedida(itemQuadroDTO.unidadeMedida());
                item.setValorUnitario(itemQuadroDTO.valorUnitario());
                item.setAliquotaIpi(itemQuadroDTO.aliquotaIpi());
                item.setOrcamento(orcamentoFinal);
                return item;
            }).collect(Collectors.toList());

            orcamento.getItens().addAll(itensEntity);
        }

        orcamentoRepository.save(orcamento);
    }
}
