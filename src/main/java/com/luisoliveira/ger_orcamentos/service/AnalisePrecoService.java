package com.luisoliveira.ger_orcamentos.service;

import com.luisoliveira.ger_orcamentos.dto.ItemQuadroDTO;
import com.luisoliveira.ger_orcamentos.dto.ItemVariacaoDto;
import com.luisoliveira.ger_orcamentos.dto.QuadroConcorrenciaDto;
import com.luisoliveira.ger_orcamentos.model.Fornecedor;
import com.luisoliveira.ger_orcamentos.model.ItemOrcamento;
import com.luisoliveira.ger_orcamentos.repositories.FornecedorRepository;
import com.luisoliveira.ger_orcamentos.repositories.ItemOrcamentoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Service
public class AnalisePrecoService {

    private final AiExtratorService aiExtratorService;
    private final ItemOrcamentoRepository itemOrcamentoRepository;
    private final FornecedorRepository fornecedorRepository;

    public AnalisePrecoService(AiExtratorService aiExtratorService,
                               ItemOrcamentoRepository itemOrcamentoRepository,
                               FornecedorRepository fornecedorRepository) {
        this.aiExtratorService = aiExtratorService;
        this.itemOrcamentoRepository = itemOrcamentoRepository;
        this.fornecedorRepository = fornecedorRepository;
    }

    @Transactional(readOnly = true)
    public List<ItemVariacaoDto> analisarVariacoesPreco(MultipartFile file) {
        QuadroConcorrenciaDto quadroConcorrenciaDto = aiExtratorService.extrairDados(file);

        String cnpjFornecedor = quadroConcorrenciaDto.getCnpjFornecedor();
        String nomeFornecedor = quadroConcorrenciaDto.getNomeFornecedor();
        String numeroOrcAtual = quadroConcorrenciaDto.getNumeroOrcamento();
        List<ItemVariacaoDto> listaVariacoes = new ArrayList<>();

        if (quadroConcorrenciaDto.getItens() == null) {
            return listaVariacoes;
        }

        // Tenta encontrar o fornecedor no banco para recuperar o nome do vendedor e contatos
        Fornecedor fornecedorBanco = null;
        if (cnpjFornecedor != null && !cnpjFornecedor.isBlank()) {
            fornecedorBanco = fornecedorRepository.findByCnpj(cnpjFornecedor).orElse(null);
        }
        if (fornecedorBanco == null && nomeFornecedor != null && !nomeFornecedor.isBlank()) {
            fornecedorBanco = fornecedorRepository.findByNome(nomeFornecedor).orElse(null);
        }

        // Pega o primeiro nome do fornecedor para buscas tolerantes
        String primeiroNome = (nomeFornecedor != null && nomeFornecedor.contains(" "))
                ? nomeFornecedor.split(" ")[0]
                : nomeFornecedor;

        String emailContato = quadroConcorrenciaDto.getEmailContato() != null && !quadroConcorrenciaDto.getEmailContato().isBlank()
                ? quadroConcorrenciaDto.getEmailContato()
                : (fornecedorBanco != null ? fornecedorBanco.getEmailContato() : null);

        String telefoneContato = quadroConcorrenciaDto.getCelularContato() != null && !quadroConcorrenciaDto.getCelularContato().isBlank()
                ? quadroConcorrenciaDto.getCelularContato()
                : (quadroConcorrenciaDto.getTelefoneContato() != null && !quadroConcorrenciaDto.getTelefoneContato().isBlank()
                ? quadroConcorrenciaDto.getTelefoneContato()
                : (fornecedorBanco != null ? (fornecedorBanco.getCelularContato() != null ? fornecedorBanco.getCelularContato() : fornecedorBanco.getTelefoneContato()) : null));

        for (ItemQuadroDTO itemAtual : quadroConcorrenciaDto.getItens()) {
            if (itemAtual.valorUnitario() == null) continue;

            List<ItemOrcamento> historico = itemOrcamentoRepository.buscarHistoricoPorFornecedoretem(
                    cnpjFornecedor,
                    primeiroNome,
                    itemAtual.descricao()
            );

            // Filtrar para não comparar com o próprio documento se ele já estiver salvo no banco
            ItemOrcamento itemAnterior = historico.stream()
                    .filter(h -> h.getOrcamento() != null &&
                            (numeroOrcAtual == null || !numeroOrcAtual.equalsIgnoreCase(h.getOrcamento().getNumeroOrcamento())))
                    .findFirst()
                    .orElse(null);

            // Se não achou diferente, e tiver histórico, pega o primeiro
            if (itemAnterior == null && !historico.isEmpty()) {
                itemAnterior = historico.get(0);
            }

            if (itemAnterior != null && itemAnterior.getValorUnitario() != null) {
                // Prioridade para o nome do vendedor: 1) IA do PDF atual, 2) Cadastro do Fornecedor, 3) Histórico do Orçamento
                String nomeContato = null;
                if (quadroConcorrenciaDto.getNomeContato() != null && !quadroConcorrenciaDto.getNomeContato().isBlank()) {
                    nomeContato = quadroConcorrenciaDto.getNomeContato();
                } else if (fornecedorBanco != null && fornecedorBanco.getNomeContato() != null && !fornecedorBanco.getNomeContato().isBlank()) {
                    nomeContato = fornecedorBanco.getNomeContato();
                } else if (itemAnterior.getOrcamento() != null && itemAnterior.getOrcamento().getFornecedor() != null) {
                    nomeContato = itemAnterior.getOrcamento().getFornecedor().getNomeContato();
                }

                String fornFinal = nomeFornecedor != null ? nomeFornecedor
                        : (itemAnterior.getOrcamento() != null && itemAnterior.getOrcamento().getFornecedor() != null
                        ? itemAnterior.getOrcamento().getFornecedor().getNome() : "");

                ItemVariacaoDto variacao = new ItemVariacaoDto(
                        fornFinal,
                        nomeContato,
                        emailContato,
                        telefoneContato,
                        itemAtual.descricao(),
                        itemAtual.valorUnitario(),
                        itemAnterior.getValorUnitario(),
                        numeroOrcAtual,
                        itemAnterior.getOrcamento() != null ? itemAnterior.getOrcamento().getNumeroOrcamento() : "Histórico",
                        itemAnterior.getOrcamento() != null ? itemAnterior.getOrcamento().getDataEmissao() : null
                );

                listaVariacoes.add(variacao);
            }
        }

        return listaVariacoes;
    }
}
