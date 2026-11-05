package com.luisoliveira.ger_orcamentos.service;

import com.luisoliveira.ger_orcamentos.dto.ConflitoBloqueanteDto;
import com.luisoliveira.ger_orcamentos.dto.EvidenciaSinalDto;
import com.luisoliveira.ger_orcamentos.dto.ResultadoAvaliacaoEvidenciasDto;
import com.luisoliveira.ger_orcamentos.model.ItemAlias;
import com.luisoliveira.ger_orcamentos.model.ItemCanonico;
import com.luisoliveira.ger_orcamentos.model.ItemCatalogoFabricante;
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

/**
 * MOTOR DE CONCILIAÇÃO POR EVIDÊNCIAS (EVIDENCE-BASED RECONCILIATION ENGINE)
 *
 * A conciliação não é uma decisão binária simples ("é o mesmo" ou "não é").
 * Funciona através de um sistema multifatorial de pontuação e confiança que combina:
 * 1. Aliases validados anteriormente (por fornecedor ou global).
 * 2. Códigos de fabricante / referências técnicas / SKU.
 * 3. Catálogos oficiais de fabricantes cadastrados (Tigre, Amanco, Schneider, etc.).
 * 4. Similaridade textual técnica e sinônimos elétricos/hidráulicos de mercado.
 * 5. Similaridade semântica via categorização técnica e IA.
 * 6. Compatibilidade de unidade de medida (idêntica ou por regra de conversão).
 * 7. Quantidade física idêntica entre orçamentos.
 * 8. Quantidade única na proposta ("fingerprint estrutural" do orçamento).
 * 9. Contexto da cotação emitida pelo sistema (RFQ original).
 * 10. Padrões aprendidos de orçamentos históricos.
 * 11. Anti-evidência e penalidades rígidas (cores divergentes, bitolas conflitantes, variantes técnicas).
 */
@Service
public class MotorEvidenciasService {

    @Autowired
    private ItemAliasRepository itemAliasRepository;

    @Autowired
    private ItemCatalogoFabricanteRepository itemCatalogoFabricanteRepository;

    @Autowired
    private ClassificadorTecnicoService classificadorTecnicoService;

    // Dicionário de equivalência de sinônimos técnicos comuns em obras e fornecedores
    private static final Map<String, String> SINONIMOS_TECNICOS = new HashMap<>();

    static {
        SINONIMOS_TECNICOS.put("FIO", "CABO");
        SINONIMOS_TECNICOS.put("CONDUTOR", "CABO");
        SINONIMOS_TECNICOS.put("CORDAO", "CABO");
        SINONIMOS_TECNICOS.put("CONDUITE", "ELETRODUTO");
        SINONIMOS_TECNICOS.put("DUTO", "ELETRODUTO");
        SINONIMOS_TECNICOS.put("OCT", "OCTOGONAL");
        SINONIMOS_TECNICOS.put("CX", "CAIXA");
        SINONIMOS_TECNICOS.put("QDC", "QUADRO");
        SINONIMOS_TECNICOS.put("FLEX", "FLEXIVEL");
        SINONIMOS_TECNICOS.put("BR", "BARRA");
        SINONIMOS_TECNICOS.put("VARA", "BARRA");
        SINONIMOS_TECNICOS.put("RL", "ROLO");
        SINONIMOS_TECNICOS.put("MM2", "MM");
    }

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
        // PRÉ-FILTRO TÉCNICO OBRIGATÓRIO (PLAUSIBILIDADE):
        // Se pertencerem a categorias incompatíveis (ex: Eletroduto vs Cabo, Disjuntor vs Caixa, Perfilado vs Conector),
        // descarta imediatamente com 0% de confiança para nunca poluir o ranking de sugestões.
        // -------------------------------------------------------------
        if (classificadorTecnicoService.saoCategoriasIncompativeis(null, canonico.getCategoria(), descricaoItem, canonico.getDescricaoPadrao())) {
            return new ResultadoAvaliacaoEvidenciasDto(
                    canonico.getId(),
                    canonico.getDescricaoPadrao(),
                    canonico.getUnidadePadrao(),
                    0,
                    List.of(new EvidenciaSinalDto("INCOMPATIBILIDADE_CATEGORIA", "Incompatibilidade Técnica", "Categorias técnicas estruturalmente incompatíveis", -100, false)),
                    List.of("⛔ Incompatibilidade técnica de categoria"),
                    "Incompatibilidade técnica de categoria."
            );
        }

        // -------------------------------------------------------------
        // EVIDÊNCIA 1: Alias / Sinônimo previamente validado no histórico
        // -------------------------------------------------------------
        List<ItemAlias> aliases = itemAliasRepository.buscarMelhorMatchAlias(normA, fornecedorId);
        boolean aliasEspecificoFornecedor = false;
        boolean aliasGlobal = false;
        boolean veioDeOrcamentoHistorico = false;

        for (ItemAlias al : aliases) {
            if (al.getItemCanonico() != null && Objects.equals(al.getItemCanonico().getId(), canonico.getId())) {
                if (al.getFornecedor() != null && Objects.equals(al.getFornecedor().getId(), fornecedorId)) {
                    aliasEspecificoFornecedor = true;
                } else {
                    aliasGlobal = true;
                }
                if (al.getOrigem() != null && (al.getOrigem().contains("HISTORICO") || al.getOrigem().contains("IMPORTACAO"))) {
                    veioDeOrcamentoHistorico = true;
                }
            }
        }

        if (aliasEspecificoFornecedor) {
            pontosAcumulados += 45;
            evidencias.add(new EvidenciaSinalDto("ALIAS_CONFIRMADO_FORNECEDOR", "Alias de Fornecedor Confirmado", "Sinônimo validado anteriormente para este fornecedor (" + fornecedorNome + ")", 45, true));
            motivos.add("✓ Alias validado anteriormente para este fornecedor");
        } else if (aliasGlobal) {
            pontosAcumulados += 35;
            evidencias.add(new EvidenciaSinalDto("ALIAS_CONFIRMADO_GLOBAL", "Alias Global Confirmado", "Sinônimo registrado na base de conhecimento corporativa", 35, true));
            motivos.add("✓ Alias semelhante validado no histórico da empresa");
        }

        if (veioDeOrcamentoHistorico) {
            pontosAcumulados += 10;
            evidencias.add(new EvidenciaSinalDto("ORCAMENTO_HISTORICO", "Orçamento Histórico", "Expressão aprendida de orçamentos históricos de obras passadas", 10, true));
            motivos.add("✓ Padrão identificado em orçamentos históricos");
        }

        // -------------------------------------------------------------
        // EVIDÊNCIA 2: Código do Fabricante / Referência (SKU)
        // -------------------------------------------------------------
        String codA = extrairCodigoReferencia(normA);
        if (codA != null && (codA.equalsIgnoreCase(canonico.getCodigoReferencia()) || codA.equalsIgnoreCase(canonico.getCodigoNcm()))) {
            pontosAcumulados += 40;
            evidencias.add(new EvidenciaSinalDto("CODIGO_FABRICANTE_IGUAL", "Código de Fabricante Idêntico", "Código/SKU " + codA + " coincide perfeitamente com o cadastro mestre", 40, true));
            motivos.add("✓ Código do fabricante coincidente (" + codA + ")");
        }

        // -------------------------------------------------------------
        // EVIDÊNCIA 3: Catálogos Oficiais de Fabricantes
        // -------------------------------------------------------------
        try {
            List<ItemCatalogoFabricante> itensCatalogo = itemCatalogoFabricanteRepository.findByItemCanonicoId(canonico.getId());
            for (ItemCatalogoFabricante cat : itensCatalogo) {
                boolean bateCodigo = codA != null && cat.getCodigoFabricante() != null && codA.equalsIgnoreCase(cat.getCodigoFabricante());
                boolean bateDescricao = cat.getDescricaoCatalogo() != null && normA.contains(normalizar(cat.getDescricaoCatalogo()));
                if (bateCodigo || bateDescricao) {
                    pontosAcumulados += 25;
                    String nomeFab = (cat.getFabricante() != null) ? cat.getFabricante().getNome() : "Fabricante";
                    evidencias.add(new EvidenciaSinalDto("CATALOGO_FABRICANTE", "Catálogo de Fabricante", "Item constante no catálogo oficial da " + nomeFab, 25, true));
                    motivos.add("✓ Coincide com catálogo oficial (" + nomeFab + ")");
                    break;
                }
            }
        } catch (Exception ignored) {
            // Segue avaliação mesmo se repo de catálogo não encontrar itens
        }

        // -------------------------------------------------------------
        // EVIDÊNCIA 4: Similaridade Textual & Números Técnicos (Bitolas)
        // -------------------------------------------------------------
        List<String> numsA = extrairTokensNumericos(normA);
        List<String> numsB = extrairTokensNumericos(normB);
        boolean medidasCompativeis = true;

        if (!numsA.isEmpty() && !numsB.isEmpty()) {
            boolean temComum = numsA.stream().anyMatch(numsB::contains);
            if (!temComum) {
                medidasCompativeis = false;
                pontosAcumulados -= 50;
                evidencias.add(new EvidenciaSinalDto("BITOLA_DIVERGENTE", "Medida Numérica Incompatível", "Bitolas/medidas divergentes: " + numsA + " vs " + numsB, -50, false));
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
                pontosAcumulados += 20;
                evidencias.add(new EvidenciaSinalDto("SIMILARIDADE_TEXTUAL_ALTA", "Similaridade Textual Alta", "Sobreposição técnica de sinônimos de " + scoreTokens + "%", 20, true));
                motivos.add("✓ Similaridade semântica alta");
            } else if (scoreTokens >= 50) {
                pontosAcumulados += 10;
                evidencias.add(new EvidenciaSinalDto("SIMILARIDADE_TEXTUAL_MEDIA", "Similaridade Textual Moderada", "Sobreposição técnica de sinônimos de " + scoreTokens + "%", 10, true));
                motivos.add("✓ Similaridade semântica moderada");
            }
        }

        // -------------------------------------------------------------
        // EVIDÊNCIA 5: Unidade de Medida
        // -------------------------------------------------------------
        if (uOrig.equals(uDest)) {
            pontosAcumulados += 10;
            evidencias.add(new EvidenciaSinalDto("UNIDADE_IDENTICA", "Unidade Idêntica", "Mesma unidade de medida (" + uOrig + ")", 10, true));
            motivos.add("✓ Unidade idêntica (" + uOrig + ")");
        } else if (fatorConversao != null && fatorConversao.compareTo(BigDecimal.ZERO) > 0 && fatorConversao.compareTo(BigDecimal.ONE) != 0) {
            pontosAcumulados += 8;
            evidencias.add(new EvidenciaSinalDto("UNIDADE_CONVERTIVEL", "Unidade Compatível por Conversão", "Conversão cadastrada: 1 " + uOrig + " = " + fatorConversao + " " + uDest, 8, true));
            motivos.add("✓ Unidade compatível por conversão (1 " + uOrig + " = " + fatorConversao + " " + uDest + ")");
        }

        // -------------------------------------------------------------
        // EVIDÊNCIA 6: Quantidade Física Idêntica & Quantidade Única
        // -------------------------------------------------------------
        if (quantidadeItem != null && quantidadeItem.compareTo(BigDecimal.ZERO) > 0) {
            if (quantidadeUnicaNoOrcamento) {
                pontosAcumulados += 20;
                evidencias.add(new EvidenciaSinalDto("QUANTIDADE_UNICA_PROPOSTA", "Quantidade Única na Cotação", "A quantidade " + quantidadeItem + " " + uOrig + " é única nesta proposta (impressão digital da lista)", 20, true));
                motivos.add("✓ Quantidade única na proposta (" + quantidadeItem + " " + uOrig + ")");
            }
        }

        // -------------------------------------------------------------
        // EVIDÊNCIA 7: Contexto de Cotação Emitida pelo Próprio Sistema (RFQ)
        // -------------------------------------------------------------
        if (geradoPorCotacaoSistema) {
            pontosAcumulados += 25;
            evidencias.add(new EvidenciaSinalDto("CONTEXTO_SISTEMA_RFQ", "Cotação Emitida pelo Sistema", "Item respondido a partir de requisição original emitida pela plataforma", 25, true));
            motivos.add("✓ Incluso na mesma cotação / requisição do sistema");
        }

        // -------------------------------------------------------------
        // EVIDÊNCIA 8: Semântica de Categoria Técnica
        // -------------------------------------------------------------
        if (canonico.getCategoria() != null && normA.contains(normalizar(canonico.getCategoria()))) {
            pontosAcumulados += 10;
            evidencias.add(new EvidenciaSinalDto("CATEGORIA_COINCIDENTE", "Categoria Técnica Coincidente", "Pertence à categoria " + canonico.getCategoria(), 10, true));
            motivos.add("✓ Categoria técnica coincidente (" + canonico.getCategoria() + ")");
        }

        // -------------------------------------------------------------
        // ANTI-EVIDÊNCIAS FORTES: ATRIBUTOS BLOQUEANTES POR CATEGORIA
        // (Cor, Bitola, Diâmetro, Potência, Tensão, Polos, Amperagem, etc.)
        // -------------------------------------------------------------
        List<ConflitoBloqueanteDto> conflitosBloqueantes = classificadorTecnicoService.detectarConflitosBloqueantes(descricaoItem, canonico.getDescricaoPadrao());
        for (ConflitoBloqueanteDto c : conflitosBloqueantes) {
            pontosAcumulados -= 70;
            evidencias.add(new EvidenciaSinalDto(
                    "ANTI_EVIDENCIA_" + c.atributo().toUpperCase().replaceAll("[^A-Z0-9_]", "_"),
                    "Atributo Bloqueante: " + c.atributo(),
                    c.mensagemFormatada(),
                    -70,
                    false
            ));
            motivos.add(c.mensagemFormatada());
        }

        String conflitoPrimeiro = conflitosBloqueantes.isEmpty() ? null : conflitosBloqueantes.get(0).mensagemFormatada();

        // Cálculo da Confiança Normalizada (0 a 100%)
        int confiancaCalculada;
        if (aliasEspecificoFornecedor && medidasCompativeis && conflitosBloqueantes.isEmpty()) {
            confiancaCalculada = 98;
        } else if (aliasGlobal && medidasCompativeis && conflitosBloqueantes.isEmpty()) {
            confiancaCalculada = 96;
        } else {
            confiancaCalculada = Math.min(100, Math.max(0, (int) Math.round((pontosAcumulados / 85.0) * 100)));
        }

        // TRAVA RIGOROSA: Havendo qualquer conflito de atributo bloqueante, limita a confiança em <= 20%
        if (!conflitosBloqueantes.isEmpty()) {
            confiancaCalculada = Math.min(confiancaCalculada, 20);
        } else if (!medidasCompativeis) {
            confiancaCalculada = Math.min(confiancaCalculada, 40);
        }

        return new ResultadoAvaliacaoEvidenciasDto(
                canonico.getId(),
                canonico.getDescricaoPadrao(),
                canonico.getUnidadePadrao(),
                confiancaCalculada,
                evidencias,
                motivos,
                conflitoPrimeiro
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

        // Pré-filtro técnico obrigatório (plausibilidade):
        if (classificadorTecnicoService.saoCategoriasIncompativeis(null, null, descA, descB)) {
            return new ResultadoAvaliacaoEvidenciasDto(
                    null, descA, uA, 0,
                    List.of(new EvidenciaSinalDto("INCOMPATIBILIDADE_CATEGORIA", "Incompatibilidade Técnica", "Categorias técnicas estruturalmente incompatíveis", -100, false)),
                    List.of("⛔ Incompatibilidade técnica"),
                    "Incompatibilidade técnica de categoria."
            );
        }

        // 1. Quantidade Física Idêntica
        boolean qtdIgual = false;
        if (qtdA != null && qtdB != null) {
            BigDecimal qtdBConvertida = (fatorConversao != null && fatorConversao.compareTo(BigDecimal.ZERO) > 0)
                    ? qtdB.multiply(fatorConversao) : qtdB;

            if (qtdA.compareTo(qtdB) == 0 || qtdA.compareTo(qtdBConvertida) == 0) {
                qtdIgual = true;
                pontos += 20;
                evidencias.add(new EvidenciaSinalDto("QUANTIDADE_IDENTICA", "Quantidade Idêntica", "Fornecedor " + fornecedorA + " e " + fornecedorB + " cotaram a mesma quantidade: " + qtdA + " " + uA, 20, true));
                motivos.add("✓ Quantidade idêntica (" + qtdA + " " + uA + ")");
            }

            // 2. Quantidade Única em Ambas as Propostas (Impressão Digital Estrutural Máxima)
            if (qtdIgual && qtdAUnica && qtdBUnica) {
                pontos += 25;
                evidencias.add(new EvidenciaSinalDto("QUANTIDADE_UNICA_AMBAS", "Quantidade Única em Ambas as Propostas", "A quantidade " + qtdA + " " + uA + " só aparece 1 vez em cada orçamento", 25, true));
                motivos.add("✓ Quantidade única em ambas as propostas");
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
            motivos.add("✓ Unidades equivalentes por conversão");
        }

        // 4. Medidas e Bitolas
        List<String> numsA = extrairTokensNumericos(normA);
        List<String> numsB = extrairTokensNumericos(normB);
        boolean medidasCompativeis = true;

        if (!numsA.isEmpty() && !numsB.isEmpty()) {
            boolean temComum = numsA.stream().anyMatch(numsB::contains);
            if (!temComum) {
                medidasCompativeis = false;
                pontos -= 50;
                evidencias.add(new EvidenciaSinalDto("BITOLA_DIVERGENTE", "Bitolas Incompatíveis", "Medidas numéricas distintas: " + numsA + " vs " + numsB, -50, false));
                motivos.add("⚠️ Medidas numéricas distintas (" + numsA + " vs " + numsB + ")");
            } else {
                pontos += 15;
                evidencias.add(new EvidenciaSinalDto("BITOLA_IDENTICA", "Bitola Idêntica", "Medidas técnicas coincidentes: " + numsA, 15, true));
                motivos.add("✓ Bitola coincidente (" + String.join(", ", numsA) + ")");
            }
        }

        // 5. Similaridade Textual com Sinônimos de Mercado
        if (normA.equals(normB)) {
            pontos += 25;
            evidencias.add(new EvidenciaSinalDto("TEXTO_IDENTICO", "Descrição Idêntica", "Textos equivalentes", 25, true));
            motivos.add("✓ Descrição idêntica");
        } else {
            int scoreTokens = calcularScoreSobreposicao(normA, normB);
            if (scoreTokens >= 70) {
                pontos += 20;
                evidencias.add(new EvidenciaSinalDto("SIMILARIDADE_ALTA", "Similaridade Textual Alta", "Similaridade técnica de " + scoreTokens + "%", 20, true));
                motivos.add("✓ Similaridade semântica alta");
            } else if (scoreTokens >= 40) {
                pontos += 10;
                evidencias.add(new EvidenciaSinalDto("SIMILARIDADE_MEDIA", "Similaridade Textual Média", "Similaridade técnica de " + scoreTokens + "%", 10, true));
                motivos.add("✓ Similaridade semântica moderada");
            }
        }

        // 6. ANTI-EVIDÊNCIAS FORTES: ATRIBUTOS BLOQUEANTES ENTRE ITENS CONCORRENTES
        List<ConflitoBloqueanteDto> conflitosBloqueantes = classificadorTecnicoService.detectarConflitosBloqueantes(descA, descB);
        for (ConflitoBloqueanteDto c : conflitosBloqueantes) {
            pontos -= 70;
            evidencias.add(new EvidenciaSinalDto(
                    "ANTI_EVIDENCIA_" + c.atributo().toUpperCase().replaceAll("[^A-Z0-9_]", "_"),
                    "Atributo Bloqueante: " + c.atributo(),
                    c.mensagemFormatada(),
                    -70,
                    false
            ));
            motivos.add(c.mensagemFormatada());
        }

        String conflitoPrimeiro = conflitosBloqueantes.isEmpty() ? null : conflitosBloqueantes.get(0).mensagemFormatada();

        int confiancaCalculada = Math.min(100, Math.max(0, (int) Math.round((pontos / 75.0) * 100)));
        if (!conflitosBloqueantes.isEmpty()) {
            confiancaCalculada = Math.min(confiancaCalculada, 20);
        } else if (!medidasCompativeis) {
            confiancaCalculada = Math.min(confiancaCalculada, 40);
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
                conflitoPrimeiro
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
                .map(this::traduzirSinonimo)
                .collect(Collectors.toSet());
        Set<String> tokensB = Arrays.stream(b.split("\\s+"))
                .filter(t -> t.length() > 1 && !stopWords.contains(t))
                .map(this::traduzirSinonimo)
                .collect(Collectors.toSet());

        if (tokensA.isEmpty() || tokensB.isEmpty()) return 0;

        long comuns = tokensA.stream().filter(tokensB::contains).count();
        int minSize = Math.min(tokensA.size(), tokensB.size());
        return (int) Math.round(((double) comuns / minSize) * 100);
    }

    private String traduzirSinonimo(String token) {
        return SINONIMOS_TECNICOS.getOrDefault(token, token);
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
