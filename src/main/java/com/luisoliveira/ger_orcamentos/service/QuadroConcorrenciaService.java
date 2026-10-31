package com.luisoliveira.ger_orcamentos.service;

import com.luisoliveira.ger_orcamentos.dto.ItemQuadroDTO;
import com.luisoliveira.ger_orcamentos.dto.QuadroComparativoDto;
import com.luisoliveira.ger_orcamentos.dto.QuadroConcorrenciaDto;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class QuadroConcorrenciaService {

    public QuadroComparativoDto montarQuadroComparativo(List<QuadroConcorrenciaDto> orcamentos) {
        if (orcamentos == null || orcamentos.size() < 2) {
            throw new IllegalArgumentException("É necessário pelo menos dois orçamentos para gerar o quadro comparativo.");
        }

        // 1. Mapeia os itens de cada orçamento usando uma chave normalizada (ex: descrição em maiúsculas e sem espaços extras)
        List<Set<String>> chavesItensPorOrcamento = new ArrayList<>();

        for (QuadroConcorrenciaDto orc : orcamentos) {
            Set<String> chaves = orc.getItens().stream()
                    .map(item -> normalizarTexto(item.descricao()))
                    .collect(Collectors.toSet());
            chavesItensPorOrcamento.add(chaves);
        }

        // 2. Encontra a interseção (itens que existem em TODOS os orçamentos comparados)
        Set<String> itensEmComum = new HashSet<>(chavesItensPorOrcamento.get(0));
        for (int i = 1; i < chavesItensPorOrcamento.size(); i++) {
            itensEmComum.retainAll(chavesItensPorOrcamento.get(i));
        }

        // 3. Validação: Se não houver itens em comum, avisa / interrompe
        if (itensEmComum.isEmpty()) {
            throw new IllegalStateException("Atenção: Os orçamentos comparados não possuem nenhum item em comum para análise de preços!");
        }

        // 4. Filtra os orçamentos mantendo apenas os itens que estão na interseção (em comum)
        List<QuadroConcorrenciaDto> orcamentosFiltrados = orcamentos.stream().map(orc -> {
            List<ItemQuadroDTO> itensFiltrados = orc.getItens().stream()
                    .filter(item -> itensEmComum.contains(normalizarTexto(item.descricao())))
                    .collect(Collectors.toList());

            // Cria um novo DTO contendo apenas os itens comuns validados
            QuadroConcorrenciaDto clone = new QuadroConcorrenciaDto();
            clone.setNomeFornecedor(orc.getNomeFornecedor());
            clone.setItens(itensFiltrados);
            // Recalcula o total geral considerando apenas os itens em comum (se necessário)
            clone.setValorTotalGeral(itensFiltrados.stream()
                    .map(ItemQuadroDTO::valorTotal)
                    .filter(Objects::nonNull)
                    .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add));
            return clone;
        }).collect(Collectors.toList());

        QuadroComparativoDto comparativo = new QuadroComparativoDto();
        comparativo.setOrcamentos(orcamentosFiltrados);
        return comparativo;
    }

    private String normalizarTexto(String texto) {
        if (texto == null) return "";
        return texto.trim().toLowerCase().replaceAll("\\s+", " ");
    }
}