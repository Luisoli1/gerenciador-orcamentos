package com.luisoliveira.ger_orcamentos.service;

import com.luisoliveira.ger_orcamentos.dto.QuadroComparativoDto;
import com.luisoliveira.ger_orcamentos.dto.QuadroConcorrenciaDto;
import com.luisoliveira.ger_orcamentos.model.Fornecedor;
import com.luisoliveira.ger_orcamentos.model.ItemOrcamento;
import com.luisoliveira.ger_orcamentos.model.Orcamento;
import com.luisoliveira.ger_orcamentos.repositories.FornecedorRepository;
import com.luisoliveira.ger_orcamentos.repositories.ItemOrcamentoRepository;
import com.luisoliveira.ger_orcamentos.repositories.OrcamentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrcamentoService {

    private final AiExtratorService aiExtratorService;

    private final OrcamentoRepository orcamentoRepository;

    private final FornecedorRepository fornecedorRepository;

    public OrcamentoService(AiExtratorService aiExtratorService, OrcamentoRepository orcamentoRepository, FornecedorRepository fornecedorRepository) {
        this.aiExtratorService = aiExtratorService;
        this.orcamentoRepository = orcamentoRepository;
        this.fornecedorRepository = fornecedorRepository;
    }

    public QuadroConcorrenciaDto processarUploadOrcamento(MultipartFile file) {
        // Delega para o serviço de IA extrair os dados do PDF de forma inteligente
        QuadroConcorrenciaDto dto = aiExtratorService.extrairDados(file);

        salvarOrcamentoNoBanco(dto);
        return dto;
    }

    public QuadroComparativoDto processarMultiplos(List<MultipartFile> files) {
        List<QuadroConcorrenciaDto> listaOrcamentos = new ArrayList<>();

        for (MultipartFile file : files) {
            QuadroConcorrenciaDto dto = aiExtratorService.extrairDados(file);

            // Guarda cada orçamento individualmente no histórico
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

        return new QuadroComparativoDto(listaOrcamentos, nomeVencedor, observacao);

    }

    private void salvarOrcamentoNoBanco(QuadroConcorrenciaDto dto){

        // 1. Procura se o fornecedor já existe na base de dados para evitar duplicados
        Fornecedor fornecedor = null;

        if (dto.getCnpjFornecedor() != null && !dto.getCnpjFornecedor().isBlank()) {
            fornecedor = fornecedorRepository.findByCnpj(dto.getCnpjFornecedor()).orElse(null);
        }

        if (fornecedor == null && dto.getNomeFornecedor() != null && !dto.getNomeFornecedor().isBlank()) {
            fornecedor = fornecedorRepository.findByNome(dto.getNomeFornecedor()).orElse(null);
        }

        // Se não existir, criamos um novo objeto (o CascadeType.PERSIST vai gravá-lo automaticamente)
        if (fornecedor == null) {
            fornecedor = new Fornecedor();
            fornecedor.setNome(dto.getNomeFornecedor());
            fornecedor.setCnpj(dto.getCnpjFornecedor());
        }

        Orcamento orcamento = new Orcamento();
        orcamento.setFornecedor(new Fornecedor(dto.getNomeFornecedor(), dto.getCnpjFornecedor()));
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
                item.setValorTotal(itemQuadroDTO.valorTotal());
                item.setAliquotaIpi(itemQuadroDTO.aliquotaIpi());
                item.setOrcamento(orcamento);
                return item;
            }).collect(Collectors.toList());

            orcamento.setItens(itensEntity);
        }

        orcamentoRepository.save(orcamento);
    }
}
