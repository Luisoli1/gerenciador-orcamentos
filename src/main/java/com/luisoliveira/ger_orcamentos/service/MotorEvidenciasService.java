package com.luisoliveira.ger_orcamentos.service;

import com.luisoliveira.ger_orcamentos.dto.EvidenciaSinalDto;
import com.luisoliveira.ger_orcamentos.dto.ResultadoAvaliacaoEvidenciasDto;
import com.luisoliveira.ger_orcamentos.model.ItemAlias;
import com.luisoliveira.ger_orcamentos.model.ItemCanonico;
import com.luisoliveira.ger_orcamentos.repositories.ItemAliasRepository;
import com.luisoliveira.ger_orcamentos.repositories.ItemCatalogoFabricanteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class MotorEvidenciasService {

    @Autowired
    private ItemAliasRepository itemAliasRepository;

    @Autowired
    private ItemCatalogoFabricanteRepository itemCatalogoFabricanteRepository;

    @Autowired
    private ClassificadorTecnicoService classificadorTecnicoService;

    /**
     * Avalia todas as fontes de evidência combinadas entre um item de orçamento e um material mestre (canônico).
     */
    public ResultadoAvaliacaoEvidenciasDto avaliarEvidencias(
            String descricaoItem,
            String unidadeItem,
            BigDecimal quantidadeItem,
            Long fornecedorId,
            String fornecedorNome,
            ItemCanonico canonico,
            BigDecimal fatorConversao,
            boolean quantidadeUnicaNoOrcamento,
            boolean geradoPorCotacaoSistema,
            Integer itemSeqCotacao
    ) {
        if (canonico == null || descricaoItem == null || descricaoItem.isBlank()) {
            return new ResultadoAvaliacaoEvidenciasDto(null, null, null, 0, List.of(), List.of(), null);
        }

        String normA = normalizar(descricaoItem);
        String normB = canonico.getDescricaoNormalizada();
        String uOrig = normalizarUnidade(unidadeItem);
        String uDest = normalizarUnidade(canonico.getUnidadePadrao());

        List<EvidenciaSinalDto> evidencias = new ArrayList<>();
        List<String> motivos = new ArrayList<>();
        int pontosAcumulados = 0;

        // -------------------------------------------------------------
        // EVIDÊNCIA 1: Alias / Sinônimo previamente validado no histórico
        // -------------------------------------------------------------
        List<ItemAlias> aliases = itemAliasRepository.buscarMelhorMatchAlias(normA, fornecedorId);
        boolean aliasEspecificoFornecedor = false;
        boolean aliasGlobal = false;

        for (ItemAlias al : aliases) {
            if (al.getItemCanonico() != null && Objects.equals(al.getItemCanonico().getId(), canonico.getId())) {
                if (al.getFornecedor() != null && Objects.equals(al.getFornecedor().getId(), fornecedorId)) {
                    aliasEspecificoFornecedor = true;
                } else {
                    aliasGlobal = true;
                }
            }
        }

        if (aliasEspecificoFornecedor) {
            pontosAcumulados += 35;
            evidencias.add(new EvidenciaSinalDto("ALIAS_CONFIRMADO_FORNECEDOR", "Alias de Fornecedor Confirmado", "Sinônimo validado anteriormente para este fornecedor (" + fornecedorNome + ")", 35, true));
            motivos.add("✓ Alias validado anteriormente para este fornecedor");
        } else if (aliasGlobal) {
            pontosAcumulados += 25;
            evidencias.add(new EvidenciaSinalDto("ALIAS_CONFIRMADO_GLOBAL", "Alias Global Confirmado", "Sinônimo registrado na base de conhecimento corporativa", 25, true));
            motivos.add("✓ Alias semelhante validado no histórico da empresa");
        }

        // -------------------------------------------------------------
        // EVIDÊNCIA 2: Código do Fabricante / Referência (SKU)
        // -------------------------------------------------------------
        String codA = extrairCodigoReferencia(normA);
        if (codA != null && (codA.equalsIgnoreCase(canonico.getCodigoReferencia()) || codA.equalsIgnoreCase(canonico.getCodigoNcm()))) {
            pontosAcumulados += 35;
            evidencias.add(new EvidenciaSinalDto("CODIGO_FABRICANTE_IGUAL", "Código de Fabricante Idêntico", "Código/SKU " + codA + " coincide perfeitamente", 35, true));
            motivos.add("✓ Código do fabricante coincidente (" + codA + ")");
        }

        // -------------------------------------------------------------
        // EVIDÊNCIA 3: Similaridade Textual & Números Técnicos
        // -------------------------------------------------------------
        List<String> numsA = extrairTokensNumericos(normA);
        List<String> numsB = extrairTokensNumericos(normB);
        boolean medidasCompativeis = true;

        if (!numsA.isEmpty() && !numsB.isEmpty()) {
            boolean temComum = numsA.stream().anyMatch(numsB::contains);
            if (!temComum) {
                medidasCompativeis = false;
                pontosAcumulados -= 40;
                evidencias.add(new EvidenciaSinalDto("BITOLA_DIVERGENTE", "Medida Numérica Incompatível", "Bitolas/medidas divergentes: " + numsA + " vs " + numsB, -40, false));
                motivos.add("⚠️ Medidas numéricas/bitolas divergentes (" + String.join(", ", numsA) + " vs " + String.join(", ", numsB) + ")");
            } else {
                pontosAcumulados += 15;
                evidencias.add(new EvidenciaSinalDto("MEDIDA_TECNICA_IDENTICA", "Medida Técnica Idêntica", "Bitola e dimensão técnica coincidentes: " + numsA, 15, true));
                motivos.add("✓ Bitola / medida técnica idêntica (" + String.join(", ", numsA) + ")");
            }
        }

        if (normA.equals(normB)) {
            pontosAcumulados += 25;
            evidencias.add(new EvidenciaSinalDto("TEXTO_IDENTICO", "Descrição Técnica Idêntica", "Texto pós-normalização 100% idêntico", 25, true));
            motivos.add("✓ Descrição técnica idêntica");
        } else {
            int scoreTokens = calcularScoreSobreposicao(normA, normB);
            if (scoreTokens >= 75) {
                pontosAcumulados += 15;
                evidencias.add(new EvidenciaSinalDto("SIMILARIDADE_TEXTUAL_ALTA", "Similaridade Textual Alta", "Sobreposição técnica de " + scoreTokens + "%", 15, true));
                motivos.add("✓ Similaridade textual alta (" + scoreTokens + "%)");
            } else if (scoreTokens >= 50) {
                pontosAcumulados += 8;
                evidencias.add(new EvidenciaSinalDto("SIMILARIDADE_TEXTUAL_MEDIA", "Similaridade Textual Moderada", "Sobreposição técnica de " + scoreTokens + "%", 8, true));
                motivos.add("✓ Similaridade textual moderada (" + scoreTokens + "%)");
            }
        }

        // -------------------------------------------------------------
        // EVIDÊNCIA 4: Unidade de Medida
        // -------------------------------------------------------------
        if (uOrig.equals(uDest)) {
            pontosAcumulados += 10;
            evidencias.add(new EvidenciaSinalDto("UNIDADE_IDENTICA", "Unidade Idêntica", "Mesma unidade de medida (" + uOrig + ")", 10, true));
            motivos.add("✓ Unidade idêntica (" + uOrig + ")");
        } else if (fatorConversao != null && fatorConversao.compareTo(BigDecimal.ZERO) > 0 && fatorConversao.compareTo(BigDecimal.ONE) != 0) {
            pontosAcumulados += 8;
            evidencias.add(new EvidenciaSinalDto("UNIDADE_CONVERTIVEL", "Unidade Compatível por Conversão", "Conversão cadastrada: 1 " + uOrig + " = " + fatorConversao + " " + uDest, 8, true));
            motivos.add("✓ Unidade compatível por conversão cadastrada (1 " + uOrig + " = " + fatorConversao + " " + uDest + ")");
        }

        // -------------------------------------------------------------
        // EVIDÊNCIA 5: Quantidade Física Idêntica & Quantidade Única
        // -------------------------------------------------------------
        if (quantidadeItem != null && quantidadeItem.compareTo(BigDecimal.ZERO) > 0) {
            pontosAcumulados += 10;
            evidencias.add(new EvidenciaSinalDto("QUANTIDADE_FISICA_CONHECIDA", "Quantidade Informada", "Item com volume cotado de " + quantidadeItem + " " + uOrig, 10, true));

            if (quantidadeUnicaNoOrcamento) {
                pontosAcumulados += 15;
                evidencias.add(new EvidenciaSinalDto("QUANTIDADE_UNICA_PROPOSTA", "Quantidade Única na Cotação", "A quantidade " + quantidadeItem + " " + uOrig + " é única nesta proposta (impressão digital da lista)", 15, true));
                motivos.add("✓ Quantidade (" + quantidadeItem + " " + uOrig + ") é única na cotação");
            }
        }

        // -------------------------------------------------------------
        // EVIDÊNCIA 6: Contexto de Cotação Emitida pelo Próprio Sistema (RFQ)
        // -------------------------------------------------------------
        if (geradoPorCotacaoSistema) {
            pontosAcumulados += 15;
            evidencias.add(new EvidenciaSinalDto("CONTEXTO_SISTEMA_RFQ", "Cotação Emitida pelo Sistema", "Item respondido a partir de requisição original emitida pela plataforma", 15, true));
            motivos.add("✓ Cotação vinculada a requisição original da plataforma");
        }

        // -------------------------------------------------------------
        // EVIDÊNCIA 7: Semântica de Categoria / Catálogo
        // -------------------------------------------------------------
        if (canonico.getCategoria() != null && normA.contains(normalizar(canonico.getCategoria()))) {
            pontosAcumulados += 10;
            evidencias.add(new EvidenciaSinalDto("CATEGORIA_COINCIDENTE", "Categoria Técnica Coincidente", "Pertence à categoria " + canonico.getCategoria(), 10, true));
            motivos.add("✓ Categoria técnica coincidente (" + canonico.getCategoria() + ")");
        }

        // -------------------------------------------------------------
        // EVIDÊNCIA NEGATIVA / ANTI-EVIDÊNCIA: Conflito de Especificação
        // (Ex: Ponta Azul vs Convencional, Reforçado vs Leve, Cor Azul vs Vermelho)
        // -------------------------------------------------------------
        String conflito = classificadorTecnicoService.detectarConflitoEspecificacao(descricaoItem, canonico.getDescricaoPadrao());
        if (conflito != null) {
            pontosAcumulados -= 50;
            evidencias.add(new EvidenciaSinalDto("CONFLITO_ESPECIFICACAO_TECNICA", "Conflito de Especificação Técnica", conflito, -50, false));
            motivos.add("⚠️ " + conflito);
        }

        // Cálculo da Confiança Normalizada (0 a 100%)
        int confiancaCalculada;
        if (aliasEspecificoFornecedor && medidasCompativeis && conflito == null) {
            confiancaCalculada = 98;
        } else if (aliasGlobal && medidasCompativeis && conflito == null) {
            confiancaCalculada = 95;
        } else {
            confiancaCalculada = Math.min(100, Math.max(0, (int) Math.round((pontosAcumulados / 85.0) * 100)));
        }

        // Teto de segurança: se há conflito de especificação ou medidas divergentes, nunca passa de 45%
        if (conflito != null || !medidasCompativeis) {
            confiancaCalculada = Math.min(confiancaCalculada, 45);
        }

        return new ResultadoAvaliacaoEvidenciasDto(
                canonico.getId(),
                canonico.getDescricaoPadrao(),
                canonico.getUnidadePadrao(),
                confiancaCalculada,
                evidencias,
                motivos,
                conflito
        );
    }

    /**
     * Avalia evidências comparando diretamente dois itens de propostas concorrentes no QC.
     */
    public ResultadoAvaliacaoEvidenciasDto avaliarEvidenciasEntreItens(
            String descA, String unidadeA, BigDecimal qtdA, String fornecedorA, boolean qtdAUnica,
            String descB, String unidadeB, BigDecimal qtdB, String fornecedorB, boolean qtdBUnica,
            ItemCanonico canonicoReferencia, BigDecimal fatorConversao
    ) {
        String normA = normalizar(descA);
        String normB = normalizar(descB);
        String uA = normalizarUnidade(unidadeA);
        String uB = normalizarUnidade(unidadeB);

        List<EvidenciaSinalDto> evidencias = new ArrayList<>();
        List<String> motivos = new ArrayList<>();
        int pontos = 0;

        // 1. Quantidade Idêntica
        boolean qtdIgual = false;
        if (qtdA != null && qtdB != null) {
            BigDecimal qtdBConvertida = (fatorConversao != null && fatorConversao.compareTo(BigDecimal.ZERO) > 0)
                    ? qtdB.multiply(fatorConversao) : qtdB;

            if (qtdA.compareTo(qtdB) == 0 || qtdA.compareTo(qtdBConvertida) == 0) {
                qtdIgual = true;
                pontos += 20;
                evidencias.add(new EvidenciaSinalDto("QUANTIDADE_IDENTICA", "Quantidade Idêntica", "Fornecedor " + fornecedorA + " e " + fornecedorB + " cotaram a mesma quantidade: " + qtdA + " " + uA, 20, true));
                motivos.add("✓ Quantidade física idêntica (" + qtdA + " " + uA + ")");
            }

            // 2. Quantidade Única em Ambas as Propostas (Fingerprint Estrutural Máximo)
            if (qtdIgual && qtdAUnica && qtdBUnica) {
                pontos += 25;
                evidencias.add(new EvidenciaSinalDto("QUANTIDADE_UNICA_AMBAS", "Quantidade Única em Ambas as Propostas", "A quantidade " + qtdA + " " + uA + " só aparece 1 vez em cada orçamento", 25, true));
                motivos.add("✓ Quantidade única em ambas as propostas (forte evidência)");
            }
        }

        // 3. Unidade Compatível
        if (uA.equals(uB)) {
            pontos += 10;
            evidencias.add(new EvidenciaSinalDto("UNIDADE_IDENTICA", "Unidade Idêntica", "Ambos utilizam a unidade " + uA, 10, true));
            motivos.add("✓ Unidade idêntica (" + uA + ")");
        } else if (fatorConversao != null && fatorConversao.compareTo(BigDecimal.ZERO) > 0) {
            pontos += 8;
            evidencias.add(new EvidenciaSinalDto("UNIDADE_CONVERTIVEL", "Unidade Convertível", "Conversão direta entre " + uA + " e " + uB, 8, true));
            motivos.add("✓ Unidades equivalentes por fator de conversão");
        }

        // 4. Medidas e Bitolas
        List<String> numsA = extrairTokensNumericos(normA);
        List<String> numsB = extrairTokensNumericos(normB);
        boolean medidasCompativeis = true;

        if (!numsA.isEmpty() && !numsB.isEmpty()) {
            boolean temComum = numsA.stream().anyMatch(numsB::contains);
            if (!temComum) {
                medidasCompativeis = false;
                pontos -= 40;
                evidencias.add(new EvidenciaSinalDto("BITOLA_DIVERGENTE", "Bitolas Incompatíveis", "Medidas numéricas distintas: " + numsA + " vs " + numsB, -40, false));
                motivos.add("⚠️ Medidas numéricas distintas (" + numsA + " vs " + numsB + ")");
            } else {
                pontos += 15;
                evidencias.add(new EvidenciaSinalDto("BITOLA_IDENTICA", "Bitola Idêntica", "Medidas técnicas coincidentes: " + numsA, 15, true));
                motivos.add("✓ Medidas técnicas coincidentes (" + String.join(", ", numsA) + ")");
            }
        }

        // 5. Similaridade Textual
        if (normA.equals(normB)) {
            pontos += 25;
            evidencias.add(new EvidenciaSinalDto("TEXTO_IDENTICO", "Descrição Idêntica", "Textos equivalentes", 25, true));
            motivos.add("✓ Descrição idêntica");
        } else {
            int scoreTokens = calcularScoreSobreposicao(normA, normB);
            if (scoreTokens >= 70) {
                pontos += 15;
                evidencias.add(new EvidenciaSinalDto("SIMILARIDADE_ALTA", "Similaridade Textual Alta", "Similaridade de " + scoreTokens + "%", 15, true));
                motivos.add("✓ Similaridade textual alta (" + scoreTokens + "%)");
            } else if (scoreTokens >= 40) {
                pontos += 8;
                evidencias.add(new EvidenciaSinalDto("SIMILARIDADE_MEDIA", "Similaridade Textual Média", "Similaridade de " + scoreTokens + "%", 8, true));
                motivos.add("✓ Similaridade textual média (" + scoreTokens + "%)");
            }
        }

        // 6. Anti-evidência de Especificação
        String conflito = classificadorTecnicoService.detectarConflitoEspecificacao(descA, descB);
        if (conflito != null) {
            pontos -= 50;
            evidencias.add(new EvidenciaSinalDto("CONFLITO_ESPECIFICACAO", "Conflito de Especificação", conflito, -50, false));
            motivos.add("⚠️ " + conflito);
        }

        int confiancaCalculada = Math.min(100, Math.max(0, (int) Math.round((pontos / 75.0) * 100)));
        if (conflito != null || !medidasCompativeis) {
            confiancaCalculada = Math.min(confiancaCalculada, 45);
        }

        Long canonicoId = (canonicoReferencia != null) ? canonicoReferencia.getId() : null;
        String descCanonico = (canonicoReferencia != null) ? canonicoReferencia.getDescricaoPadrao() : descA;
        String uCanonico = (canonicoReferencia != null) ? canonicoReferencia.getUnidadePadrao() : uA;

        return new ResultadoAvaliacaoEvidenciasDto(
                canonicoId,
                descCanonico,
                uCanonico,
                confiancaCalculada,
                evidencias,
                motivos,
                conflito
        );
    }

    private String extrairCodigoReferencia(String texto) {
        Matcher m = Pattern.compile("(?:REF|COD|SKU|CODIGO)[.:\\s]*([A-Z0-9_-]+)").matcher(texto);
        return m.find() ? m.group(1) : null;
    }

    private List<String> extrairTokensNumericos(String texto) {
        List<String> nums = new ArrayList<>();
        Matcher m = Pattern.compile("\\b\\d+(?:[.,]\\d+)?\\b").matcher(texto);
        while (m.find()) {
            nums.add(m.group().replace(",", "."));
        }
        return nums;
    }

    private int calcularScoreSobreposicao(String a, String b) {
        Set<String> stopWords = Set.of("DE", "DA", "DO", "PARA", "COM", "EM", "E", "OU", "TIPO", "MM", "M", "UN", "PÇ");
        Set<String> tokensA = Arrays.stream(a.split("\\s+"))
                .filter(t -> t.length() > 1 && !stopWords.contains(t))
                .collect(Collectors.toSet());
        Set<String> tokensB = Arrays.stream(b.split("\\s+"))
                .filter(t -> t.length() > 1 && !stopWords.contains(t))
                .collect(Collectors.toSet());

        if (tokensA.isEmpty() || tokensB.isEmpty()) return 0;

        long comuns = tokensA.stream().filter(tokensB::contains).count();
        int minSize = Math.min(tokensA.size(), tokensB.size());
        return (int) Math.round(((double) comuns / minSize) * 100);
    }

    private String normalizar(String texto) {
        return Normalizer.normalize(texto.toUpperCase(), Normalizer.Form.NFD)
                .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "")
                .replaceAll("[^A-Z0-9\\s./\"-]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String normalizarUnidade(String u) {
        if (u == null || u.isBlank()) return "UN";
        String n = u.trim().toUpperCase();
        if (n.equals("METRO") || n.equals("METROS") || n.equals("MTS")) return "M";
        if (n.equals("PECA") || n.equals("PECAS") || n.equals("PC") || n.equals("PÇ") || n.equals("PCS")) return "PÇ";
        if (n.equals("UNID") || n.equals("UNIDADE") || n.equals("UNIDADES")) return "UN";
        if (n.equals("BR") || n.equals("BARRAS")) return "BARRA";
        if (n.equals("RL") || n.equals("ROLOS")) return "ROLO";
        return n;
    }
}
