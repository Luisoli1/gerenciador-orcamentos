package com.luisoliveira.ger_orcamentos.service;

import com.luisoliveira.ger_orcamentos.dto.ItemQuadroDTO;
import com.luisoliveira.ger_orcamentos.dto.ItemVariacaoDto;
import com.luisoliveira.ger_orcamentos.dto.QuadroComparativoDto;
import com.luisoliveira.ger_orcamentos.dto.QuadroConcorrenciaDto;
import com.luisoliveira.ger_orcamentos.dto.QuadroMetaDadosDto;
import com.luisoliveira.ger_orcamentos.model.Fornecedor;
import com.luisoliveira.ger_orcamentos.model.ItemOrcamento;
import com.luisoliveira.ger_orcamentos.model.Obra;
import com.luisoliveira.ger_orcamentos.model.Orcamento;
import com.luisoliveira.ger_orcamentos.repositories.FornecedorRepository;
import com.luisoliveira.ger_orcamentos.repositories.ItemOrcamentoRepository;
import com.luisoliveira.ger_orcamentos.repositories.ObraRepository;
import com.luisoliveira.ger_orcamentos.repositories.OrcamentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
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
    private final FornecedorRepository fornecedorRepository;
    private final ObraRepository obraRepository; // Adicionado repositório de obra

    @Autowired
    private ItemOrcamentoRepository itemOrcamentoRepository;

    // Construtor atualizado com a injeção do ObraRepository
    public OrcamentoService(AiExtratorService aiExtratorService,
                            OrcamentoRepository orcamentoRepository,
                            FornecedorRepository fornecedorRepository,
                            ObraRepository obraRepository) {
        this.aiExtratorService = aiExtratorService;
        this.orcamentoRepository = orcamentoRepository;
        this.fornecedorRepository = fornecedorRepository;
        this.obraRepository = obraRepository;
    }

    public List<ItemVariacaoDto> analisarVariacoesPreco(MultipartFile file) {
        QuadroConcorrenciaDto quadroConcorrenciaDto = aiExtratorService.extrairDados(file);

        String cnpjFornecedor = quadroConcorrenciaDto.getCnpjFornecedor();
        List<ItemVariacaoDto> listaVariacoes = new ArrayList<>();

        for(ItemQuadroDTO itemAtual: quadroConcorrenciaDto.getItens()){
            List<ItemOrcamento> itemAnteriorOpt = itemOrcamentoRepository.buscarHistoricoPorFornecedoretem(
                    cnpjFornecedor,
                    itemAtual.descricao()
            );

            if(!itemAnteriorOpt.isEmpty()){
                ItemOrcamento itemAnterior = itemAnteriorOpt.get(0);

                boolean precoFoiAlterado = itemAtual.valorUnitario().compareTo(itemAnterior.getValorUnitario()) != 0;

                if(precoFoiAlterado) {
                    ItemVariacaoDto variacao = new ItemVariacaoDto(
                            quadroConcorrenciaDto.getNomeFornecedor(),
                            itemAtual.descricao(),
                            itemAtual.valorUnitario(),
                            itemAnterior.getValorUnitario(),
                            itemAnterior.getOrcamento().getNumeroOrcamento(),
                            itemAnterior.getOrcamento().getDataEmissao()
                    );

                    listaVariacoes.add(variacao);
                }
            }
        }

        return listaVariacoes;
    }

    public QuadroConcorrenciaDto processarUploadOrcamento(MultipartFile file) {
        QuadroConcorrenciaDto dto = aiExtratorService.extrairDados(file);
        salvarOrcamentoNoBanco(dto);
        return dto;
    }

    // Método principal atualizado para receber o obraId e gerar os metadados dinâmicos
    public QuadroComparativoDto processarMultiplosComObra(Long obraId, List<MultipartFile> files) {
        // 1. Busca a obra cadastrada no banco
        Obra obra = obraRepository.findById(obraId)
                .orElseThrow(() -> new RuntimeException("Obra não encontrada com ID: " + obraId));

        // 2. Gera o número sequencial do QC (ex: QC-001) baseado no contador da obra
        String numeroQcFormatado = String.format("QC-%03d", obra.getProximoNumeroQc());

        // 3. Incrementa o contador para a próxima vez e salva na obra
        obra.setProximoNumeroQc(obra.getProximoNumeroQc() + 1);
        obraRepository.save(obra);

        // 4. Cria o DTO de metadados para o relatório
        QuadroMetaDadosDto metadados = new QuadroMetaDadosDto(
                obra.getNomeObra(),
                numeroQcFormatado,
                obra.getNomeCliente(),
                obra.getCnpjCliente(),
                LocalDate.now()
        );

        // 5. Processamento normal dos orçamentos
        List<QuadroConcorrenciaDto> listaOrcamentos = new ArrayList<>();

        for (MultipartFile file : files) {
            QuadroConcorrenciaDto dto = aiExtratorService.extrairDados(file);
            salvarOrcamentoNoBanco(dto);
            listaOrcamentos.add(dto);
        }

        QuadroConcorrenciaDto vencedor = listaOrcamentos.stream()
                .filter(o -> o.getValorTotalGeral() != null)
                .min(Comparator.comparing(QuadroConcorrenciaDto::getValorTotalGeral))
                .orElse(null);

        String nomeVencedor = (vencedor != null && vencedor.getNomeFornecedor() != null)
                ? vencedor.getNomeFornecedor()
                : "Não identificado";

        String observacao = "Vencedor determinado pelo Valor Total Geral";

        // 6. Retorna utilizando o construtor que aceita os metadados
        return new QuadroComparativoDto(metadados, listaOrcamentos, nomeVencedor, observacao);
    }

    private void salvarOrcamentoNoBanco(QuadroConcorrenciaDto dto){
        Fornecedor fornecedor = null;

        if (dto.getCnpjFornecedor() != null && !dto.getCnpjFornecedor().isBlank()) {
            fornecedor = fornecedorRepository.findByCnpj(dto.getCnpjFornecedor()).orElse(null);
        }

        if (fornecedor == null && dto.getNomeFornecedor() != null && !dto.getNomeFornecedor().isBlank()) {
            fornecedor = fornecedorRepository.findByNome(dto.getNomeFornecedor()).orElse(null);
        }

        if (fornecedor == null) {
            Fornecedor novoFornecedor = new Fornecedor(
                    dto.getNomeFornecedor(),
                    dto.getCnpjFornecedor(),
                    dto.getNomeContato(),
                    dto.getEmailContato(),
                    dto.getTelefoneContato(),
                    dto.getLocalCidade()
            );
            fornecedor = fornecedorRepository.save(novoFornecedor);
        }

        Orcamento orcamento = new Orcamento();
        orcamento.setFornecedor(fornecedor);
        orcamento.setNumeroOrcamento(dto.getNumeroOrcamento());
        orcamento.setDataEmissao(dto.getDataEmissao());
        orcamento.setDataValidade(dto.getDataValidade());
        orcamento.setValorTotal(dto.getValorTotalGeral());
        orcamento.setValorTotalMercadoria(dto.getValorTotalMercadoria());
        orcamento.setValorTotalIpi(dto.getValorTotalIpi());

        if(dto.getItens() != null){
            List<ItemOrcamento> itensEntity = dto.getItens().stream().map(itemQuadroDTO -> {
                ItemOrcamento item = new ItemOrcamento();
                item.setMarca(itemQuadroDTO.marca());
                item.setQuantidade(itemQuadroDTO.quantidade());
                item.setValorTotal(itemQuadroDTO.valorTotal());
                item.setDescricao(itemQuadroDTO.descricao());
                item.setUnidadeDeMedida(itemQuadroDTO.unidadeMedida());
                item.setValorUnitario(itemQuadroDTO.valorUnitario());
                item.setAliquotaIpi(itemQuadroDTO.aliquotaIpi());
                item.setOrcamento(orcamento);
                return item;
            }).collect(Collectors.toList());

            orcamento.setItens(itensEntity);
        }

        orcamentoRepository.save(orcamento);
    }
}