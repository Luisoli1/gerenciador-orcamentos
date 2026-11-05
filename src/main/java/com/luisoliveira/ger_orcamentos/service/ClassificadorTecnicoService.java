package com.luisoliveira.ger_orcamentos.service;

import com.luisoliveira.ger_orcamentos.dto.ClassificacaoTecnicaDto;
import com.luisoliveira.ger_orcamentos.dto.ConflitoBloqueanteDto;
import com.luisoliveira.ger_orcamentos.dto.RegraAtributoBloqueanteDto;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ClassificadorTecnicoService {

    // 1. Variantes de produto estritas
    private static final List<String> VARIANTES_ESPECIFICAS = List.of(
            "PONTA AZUL", "CONVENCIONAL", "REFORCADO", "LEVE", "PESADO", "ANTICHAMA",
            "SNAP FIT", "SKYBOX", "SELADA", "BLINDADA", "HERMETICA"
    );

    // 2. Cores elétricas padronizadas
    private static final List<String> CORES_ELETRICAS = List.of(
            "AZUL", "VERMELHO", "PRETO", "VERDE", "BRANCO", "AMARELO", "CINZA", "MARROM"
    );

    // 3. Fabricantes frequentes
    private static final List<String> FABRICANTES_CONHECIDOS = List.of(
            "TIGRE", "AMANCO", "SCHNEIDER", "STECK", "WEG", "LEGRAND", "PIAL",
            "TRAMONTINA", "PRYSMIAN", "SIL", "ELECON", "WETZEL", "MONT MAGNO", "SOEDRAL", "SIEMENS", "CORFIO", "COBRECOM"
    );

    /**
     * Retorna o catálogo oficial de regras de atributos bloqueantes por categoria para documentação e interface.
     */
    public List<RegraAtributoBloqueanteDto> listarRegrasAtributosBloqueantes() {
        return List.of(
                new RegraAtributoBloqueanteDto(
                        "Cabos e Fios",
                        "Condutores elétricos isolados e cabos de potência",
                        List.of("Bitola (mm²)", "Cor da Isolação", "Formação de Vias (ex: 2x2.5)", "Tensão de Isolação (750V vs 1kV)", "Material (Cobre vs Alumínio)"),
                        List.of("1.5mm², 2.5mm², 4.0mm², 6.0mm², 10mm²", "Azul, Vermelho, Preto, Verde, Branco", "2x1.5, 3x2.5, 4x2.5", "750V vs 1kV"),
                        "Confiança travada em <= 20%. Bloqueio absoluto de auto-mesclagem."
                ),
                new RegraAtributoBloqueanteDto(
                        "Dispositivos de Proteção",
                        "Disjuntores termomagnéticos, DPS, IDR/DR e contatores",
                        List.of("Número de Polos (1P, 2P, 3P, 4P)", "Corrente Nominal (Amperagem - A)", "Curva de Disparo (B, C, D)", "Sensibilidade DR (30mA vs 300mA)", "Capacidade DPS (kA)"),
                        List.of("1P (Mono), 2P (Bi), 3P (Tri)", "10A, 16A, 20A, 25A, 32A, 40A, 50A, 63A, 80A, 100A", "Curva B vs Curva C", "30mA vs 300mA", "20kA, 45kA"),
                        "Confiança travada em <= 20%. Risco grave de incompatibilidade elétrica."
                ),
                new RegraAtributoBloqueanteDto(
                        "Eletrodutos e Tubulações",
                        "Tubulações elétricas rígidas, flexíveis e conexões",
                        List.of("Diâmetro / Bitola (mm / pol)", "Variante Técnica (Ponta Azul vs Convencional)", "Material (PVC vs Metálico EMT)", "Classe (Leve vs Reforçado)"),
                        List.of("20mm (1/2\"), 25mm (3/4\"), 32mm (1\"), 40mm, 50mm", "Ponta Azul (Laje) vs Convencional (Parede)", "PVC Rígido vs EMT Galvanizado"),
                        "Confiança travada em <= 20%. Produtos distintos para alternativas de cotação."
                ),
                new RegraAtributoBloqueanteDto(
                        "Tubulações Hidráulicas",
                        "Tubos, joelhos, tês e curvas hidráulicas de água e esgoto",
                        List.of("Diâmetro Nominal (DN)", "Ângulo da Conexão (90° vs 45°)", "Linha Operacional (Água Fria vs Água Quente CPVC vs Esgoto)"),
                        List.of("DN 20 (1/2\"), DN 25 (3/4\"), DN 50, DN 100", "Joelho 90° vs Curva 45°", "PVC Soldável vs CPVC Água Quente vs Esgoto Série Reforçada"),
                        "Confiança travada em <= 20%. Geometria ou pressão incompatível."
                ),
                new RegraAtributoBloqueanteDto(
                        "Iluminação",
                        "Lâmpadas, painéis plafon LED, refletores e spots",
                        List.of("Potência (Watts)", "Tensão Nominal (127V vs 220V vs Bivolt)", "Temperatura de Cor (3000K vs 4000K vs 6500K)"),
                        List.of("9W, 12W, 18W, 24W, 36W, 50W, 100W", "127V vs 220V (risco de queima)", "3000K (Quente) vs 6500K (Frio)"),
                        "Confiança travada em <= 20%. Risco de queima ou estética inadequada."
                ),
                new RegraAtributoBloqueanteDto(
                        "Tomadas e Interruptores",
                        "Módulos e mecanismos elétricos residenciais e industriais",
                        List.of("Corrente da Tomada (10A vs 20A)", "Tipo de Tecla (Simples vs Paralelo/Three-Way vs Intermediário)"),
                        List.of("Tomada 10A (pinos 4mm) vs 20A (pinos 4.8mm)", "Interruptor Simples vs Paralelo (Three-Way)"),
                        "Confiança travada em <= 20%. Padrão normativo NBR 14136 estrito."
                ),
                new RegraAtributoBloqueanteDto(
                        "Infraestrutura e Perfilados",
                        "Perfilados, eletrocalhas, leitos e acessórios metálicos",
                        List.of("Dimensão (LxA)", "Tratamento / Acabamento (Galvanizado a Fogo vs Pré-Zincado)", "Espessura de Chapa (#14, #16, #18, #20)"),
                        List.of("38x38 vs 19x38; 50x50 vs 100x50", "Galvanizado a Fogo (GF) vs Eletrolítico (GE)", "Chapa 14 (1.9mm) vs Chapa 18 (1.2mm)"),
                        "Confiança travada em <= 20%. Diferença estrutural e de resistência à corrosão."
                )
        );
    }

    /**
     * DETECÇÃO COMPLETA DE CONFLITOS DE ATRIBUTOS BLOQUEANTES:
     * Avalia todas as categorias técnicas e retorna a lista de bloqueios que atuam como anti-evidências fortes.
     */
    public List<ConflitoBloqueanteDto> detectarConflitosBloqueantes(String descItemA, String descItemB) {
        if (descItemA == null || descItemB == null) return List.of();

        String normA = normalizar(descItemA);
        String normB = normalizar(descItemB);
        List<ConflitoBloqueanteDto> conflitos = new ArrayList<>();

        // 1. ATRIBUTO BLOQUEANTE: POLOS EM DISJUNTORES / PROTEÇÃO (1P, 2P, 3P, 4P)
        String polosA = extrairPolos(normA);
        String polosB = extrairPolos(normB);
        if (polosA != null && polosB != null && !polosA.equals(polosB)) {
            conflitos.add(new ConflitoBloqueanteDto(
                    "Dispositivos de Proteção",
                    "Polos",
                    polosA,
                    polosB,
                    String.format("⛔ BLOQUEIO [Polos]: Disjuntor %s vs Disjuntor %s. São itens eletricamente incompatíveis (monofásico vs polifásico).", polosA, polosB)
            ));
        }

        // 2. ATRIBUTO BLOQUEANTE: CORRENTE NOMINAL / AMPERAGEM EM PROTEÇÃO (10A, 20A, 32A, 50A...)
        String ampProtA = extrairAmperagemProtecao(normA);
        String ampProtB = extrairAmperagemProtecao(normB);
        if (ampProtA != null && ampProtB != null && !ampProtA.equals(ampProtB)) {
            conflitos.add(new ConflitoBloqueanteDto(
                    "Dispositivos de Proteção",
                    "Amperagem",
                    ampProtA,
                    ampProtB,
                    String.format("⛔ BLOQUEIO [Amperagem]: Disjuntor de %s vs %s. Corrente de desarme distinta.", ampProtA, ampProtB)
            ));
        }

        // 3. ATRIBUTO BLOQUEANTE: AMPERAGEM DE TOMADAS (10A vs 20A)
        String ampTomA = extrairAmperagemTomada(normA);
        String ampTomB = extrairAmperagemTomada(normB);
        if (ampTomA != null && ampTomB != null && !ampTomA.equals(ampTomB)) {
            conflitos.add(new ConflitoBloqueanteDto(
                    "Tomadas e Interruptores",
                    "Amperagem da Tomada",
                    ampTomA,
                    ampTomB,
                    String.format("⛔ BLOQUEIO [Tomada %s vs %s]: Pinos normativos de 4,0mm (10A) vs 4,8mm (20A) são produtos físicos diferentes (NBR 14136).", ampTomA, ampTomB)
            ));
        }

        // 4. ATRIBUTO BLOQUEANTE: COR DE ISOLAÇÃO EM CABOS ELÉTRICOS (Azul, Vermelho, Verde, Preto...)
        boolean ehCabo = contemQualquer(normA, "CABO", "FIO", "CONDUTOR") || contemQualquer(normB, "CABO", "FIO", "CONDUTOR");
        if (ehCabo) {
            String corA = extrairCorEletrica(normA);
            String corB = extrairCorEletrica(normB);
            if (corA != null && corB != null && !corA.equals(corB)) {
                conflitos.add(new ConflitoBloqueanteDto(
                        "Cabos e Fios",
                        "Cor da Isolação",
                        corA,
                        corB,
                        String.format("⛔ BLOQUEIO [Cor]: Cabo %s vs Cabo %s. Funções de circuito distintas pela NBR 5410 (ex: Neutro vs Fase vs Terra).", capitalizar(corA), capitalizar(corB))
                ));
            }
        }

        // 5. ATRIBUTO BLOQUEANTE: BITOLA DE CONDUTOR / CABO (1.5mm², 2.5mm², 4.0mm², 6.0mm²...)
        if (ehCabo) {
            String bitolaA = extrairBitolaCabo(normA);
            String bitolaB = extrairBitolaCabo(normB);
            if (bitolaA != null && bitolaB != null && !bitolaA.equals(bitolaB)) {
                conflitos.add(new ConflitoBloqueanteDto(
                        "Cabos e Fios",
                        "Bitola / Seção Reta",
                        bitolaA,
                        bitolaB,
                        String.format("⛔ BLOQUEIO [Bitola]: Cabo de %s vs %s. Seções de condução distintas.", bitolaA, bitolaB)
                ));
            }

            // Formação de vias em cabo PP (2x2.5 vs 3x2.5 vs 4x2.5)
            String viasA = extrairViasCabo(normA);
            String viasB = extrairViasCabo(normB);
            if (viasA != null && viasB != null && !viasA.equals(viasB)) {
                conflitos.add(new ConflitoBloqueanteDto(
                        "Cabos e Fios",
                        "Formação de Vias",
                        viasA,
                        viasB,
                        String.format("⛔ BLOQUEIO [Formação de Vias]: Cabo PP %s vs %s. Número de condutores divergente.", viasA, viasB)
                ));
            }
        }

        // 6. ATRIBUTO BLOQUEANTE: DIÂMETRO / BITOLA DE ELETRODUTOS E CONEXÕES (20mm, 25mm, 32mm, 50mm, 100mm...)
        boolean ehTuboConexao = contemQualquer(normA, "ELETRODUTO", "CONDUITE", "TUBO", "JOELHO", "CURVA", "LUVA", "TE", "DN")
                || contemQualquer(normB, "ELETRODUTO", "CONDUITE", "TUBO", "JOELHO", "CURVA", "LUVA", "TE", "DN");
        if (ehTuboConexao) {
            String diamA = extrairDiametroTubulacao(normA);
            String diamB = extrairDiametroTubulacao(normB);
            if (diamA != null && diamB != null && !diamA.equals(diamB)) {
                conflitos.add(new ConflitoBloqueanteDto(
                        "Eletrodutos e Tubulações",
                        "Diâmetro Nominal",
                        diamA,
                        diamB,
                        String.format("⛔ BLOQUEIO [Diâmetro]: Tubulação / Conexão de %s vs %s. Diâmetros incompatíveis.", diamA, diamB)
                ));
            }
        }

        // 7. ATRIBUTO BLOQUEANTE: TENSÃO OPERACIONAL (127V vs 220V vs 380V) E NÍVEL DE ISOLAÇÃO (750V vs 1KV)
        String tensaoA = extrairTensao(normA);
        String tensaoB = extrairTensao(normB);
        if (tensaoA != null && tensaoB != null && !tensaoA.equals(tensaoB)) {
            conflitos.add(new ConflitoBloqueanteDto(
                    "Tensão Operacional",
                    "Tensão Nominal",
                    tensaoA,
                    tensaoB,
                    String.format("⛔ BLOQUEIO [Tensão]: Equipamento / Cabo de %s vs %s. Risco de queima ou incompatibilidade de rede.", tensaoA, tensaoB)
            ));
        }

        // 8. ATRIBUTO BLOQUEANTE: POTÊNCIA LUMINOTÉCNICA (Watts - W)
        boolean ehIluminacao = contemQualquer(normA, "LED", "LAMPADA", "PAINEL", "PLAFON", "REFLETOR", "SPOT")
                || contemQualquer(normB, "LED", "LAMPADA", "PAINEL", "PLAFON", "REFLETOR", "SPOT");
        if (ehIluminacao) {
            String potA = extrairPotenciaWatts(normA);
            String potB = extrairPotenciaWatts(normB);
            if (potA != null && potB != null && !potA.equals(potB)) {
                conflitos.add(new ConflitoBloqueanteDto(
                        "Iluminação",
                        "Potência",
                        potA,
                        potB,
                        String.format("⛔ BLOQUEIO [Potência]: Luminária / Lâmpada de %s vs %s. Fluxo luminoso divergente.", potA, potB)
                ));
            }
        }

        // 9. ATRIBUTO BLOQUEANTE: ÂNGULO DE CONEXÃO (90° vs 45°)
        String angA = extrairAnguloConexao(normA);
        String angB = extrairAnguloConexao(normB);
        if (angA != null && angB != null && !angA.equals(angB)) {
            conflitos.add(new ConflitoBloqueanteDto(
                    "Conexões",
                    "Ângulo de Curvatura",
                    angA,
                    angB,
                    String.format("⛔ BLOQUEIO [Ângulo]: Conexão de %s vs %s. Geometria de traçado incompatível.", angA, angB)
            ));
        }

        // 10. ATRIBUTO BLOQUEANTE: ACABAMENTO METÁLICO (Galvanizado a Fogo / GF vs Pré-Zincado / GE)
        String acabA = extrairAcabamentoMetalico(normA);
        String acabB = extrairAcabamentoMetalico(normB);
        if (acabA != null && acabB != null && !acabA.equals(acabB)) {
            conflitos.add(new ConflitoBloqueanteDto(
                    "Infraestrutura e Perfilados",
                    "Acabamento",
                    acabA,
                    acabB,
                    String.format("⛔ BLOQUEIO [Acabamento]: %s vs %s. Resistência à corrosão e custo com ampla disparidade.", acabA, acabB)
            ));
        }

        // 11. ATRIBUTO BLOQUEANTE: ESPESSURA DE CHAPA (#14, #16, #18, #20)
        String chapaA = extrairEspessuraChapa(normA);
        String chapaB = extrairEspessuraChapa(normB);
        if (chapaA != null && chapaB != null && !chapaA.equals(chapaB)) {
            conflitos.add(new ConflitoBloqueanteDto(
                    "Infraestrutura e Perfilados",
                    "Espessura de Chapa",
                    chapaA,
                    chapaB,
                    String.format("⛔ BLOQUEIO [Chapa]: Perfilado / Eletrocalha %s vs %s. Capacidade de carga mecânica divergente.", chapaA, chapaB)
            ));
        }

        // 12. ATRIBUTO BLOQUEANTE: VARIANTES ESPECÍFICAS (Ponta Azul vs Convencional, Reforçado vs Leve, Skybox vs Snap Fit)
        boolean aPontaAzul = normA.contains("PONTA AZUL");
        boolean bPontaAzul = normB.contains("PONTA AZUL");
        if (aPontaAzul != bPontaAzul) {
            conflitos.add(new ConflitoBloqueanteDto(
                    "Eletrodutos",
                    "Variante de Laje",
                    aPontaAzul ? "Ponta Azul" : "Convencional",
                    bPontaAzul ? "Ponta Azul" : "Convencional",
                    "⛔ BLOQUEIO [Variante Técnica]: Um item é 'Ponta Azul' e o outro é 'Convencional/Reforçado'. São produtos distintos para cotação de alternativas."
            ));
        }

        boolean aSkybox = normA.contains("SKYBOX") || normA.contains("SELADA");
        boolean bSkybox = normB.contains("SKYBOX") || normB.contains("SELADA");
        boolean aSnapFit = normA.contains("SNAP FIT");
        boolean bSnapFit = normB.contains("SNAP FIT");
        if ((aSkybox && bSnapFit) || (bSkybox && aSnapFit)) {
            conflitos.add(new ConflitoBloqueanteDto(
                    "Caixas e Quadros",
                    "Tecnologia de Caixa de Laje",
                    aSkybox ? "Skybox Selada" : "Snap Fit",
                    bSkybox ? "Skybox Selada" : "Snap Fit",
                    "⛔ BLOQUEIO [Tecnologia]: Caixa Selada Skybox vs Caixa Snap Fit. Tecnologias de fabricação e custos diferentes."
            ));
        }

        return conflitos;
    }

    /**
     * Mantém compatibilidade com chamadas simples anteriores retornando a primeira mensagem de conflito ou null.
     */
    public String detectarConflitoEspecificacao(String descItemA, String descItemB) {
        List<ConflitoBloqueanteDto> conflitos = detectarConflitosBloqueantes(descItemA, descItemB);
        if (conflitos.isEmpty()) return null;
        return conflitos.get(0).mensagemFormatada();
    }

    // ==========================================
    // EXTRATORES TÉCNICOS ESPECÍFICOS DE ATRIBUTOS
    // ==========================================

    private String extrairPolos(String texto) {
        Matcher m1 = Pattern.compile("\\b(\\d)[\\s-]*(?:POLOS?|P)\\b").matcher(texto);
        if (m1.find()) return m1.group(1) + "P";
        if (texto.contains("UNIPOLAR") || texto.contains("MONOPOLAR") || texto.contains("1 POLO") || texto.contains("1POLO")) return "1P";
        if (texto.contains("BIPOLAR") || texto.contains("2 POLOS") || texto.contains("2POLOS")) return "2P";
        if (texto.contains("TRIPOLAR") || texto.contains("3 POLOS") || texto.contains("3POLOS")) return "3P";
        if (texto.contains("TETRAPOLAR") || texto.contains("4 POLOS") || texto.contains("4POLOS")) return "4P";
        return null;
    }

    private String extrairAmperagemProtecao(String texto) {
        // Disjuntores: 10A, 16A, 20A, 25A, 32A, 40A, 50A, 63A, 70A, 80A, 100A, 125A, 150A, 200A, 225A, 250A
        if (!contemQualquer(texto, "DISJUNTOR", "DR", "IDR", "DPS", "FUSIVEL", "DISJ")) return null;
        Matcher m = Pattern.compile("\\b(10|16|20|25|32|40|50|63|70|80|100|125|150|175|200|225|250)\\s*A\\b").matcher(texto);
        if (m.find()) return m.group(1) + "A";
        return null;
    }

    private String extrairAmperagemTomada(String texto) {
        if (!contemQualquer(texto, "TOMADA", "MODULO TOMADA", "PLACA TOMADA")) return null;
        Matcher m = Pattern.compile("\\b(10|20)\\s*A\\b").matcher(texto);
        if (m.find()) return m.group(1) + "A";
        return null;
    }

    private String extrairCorEletrica(String texto) {
        for (String cor : CORES_ELETRICAS) {
            if (Pattern.compile("\\b" + cor + "\\b").matcher(texto).find()) {
                return cor;
            }
        }
        return null;
    }

    private String extrairBitolaCabo(String texto) {
        // Normaliza valores numéricos de bitola seguidos de MM2 ou MM
        Matcher m = Pattern.compile("\\b(0[.,]5|0[.,]75|1[.,]0|1[.,]5|2[.,]5|4[.,]0|4|6[.,]0|6|10|16|25|35|50|70|95|120|150|185|240)\\s*(?:MM2|MM)?\\b").matcher(texto);
        while (m.find()) {
            try {
                double val = Double.parseDouble(m.group(1).replace(",", "."));
                return String.format(Locale.US, "%.1fmm²", val).replace(".0mm²", "mm²");
            } catch (Exception ignored) {}
        }
        return null;
    }

    private String extrairViasCabo(String texto) {
        Matcher m = Pattern.compile("\\b([2-5]X\\d+(?:[.,]\\d+)?)\\b").matcher(texto);
        if (m.find()) {
            return m.group(1).replace(",", ".");
        }
        return null;
    }

    private String extrairDiametroTubulacao(String texto) {
        // Milímetros: 20mm, 25mm, 32mm, 40mm, 50mm, 60mm, 75mm, 85mm, 100mm, 110mm, 150mm
        Matcher m1 = Pattern.compile("\\b(20|25|32|40|50|60|75|85|100|110|150)\\s*MM\\b").matcher(texto);
        if (m1.find()) return m1.group(1) + "mm";

        // Polegadas: 1/2, 3/4, 1", 1.1/4, 1.1/2, 2", 2.1/2, 3", 4"
        if (texto.contains("1/2")) return "20mm (1/2\")";
        if (texto.contains("3/4")) return "25mm (3/4\")";
        if (texto.contains("1.1/4") || texto.contains("1 1/4")) return "40mm (1.1/4\")";
        if (texto.contains("1.1/2") || texto.contains("1 1/2")) return "50mm (1.1/2\")";
        if (texto.contains("2.1/2") || texto.contains("2 1/2")) return "75mm (2.1/2\")";

        return null;
    }

    private String extrairTensao(String texto) {
        if (texto.contains("750V")) return "750V";
        if (texto.contains("1KV") || texto.contains("0.6/1KV") || texto.contains("0,6/1KV")) return "1kV (0.6/1kV)";
        if (texto.contains("127V") || texto.contains("110V")) return "127V";
        if (texto.contains("220V")) return "220V";
        if (texto.contains("380V")) return "380V";
        return null;
    }

    private String extrairPotenciaWatts(String texto) {
        Matcher m = Pattern.compile("\\b(\\d+(?:[.,]\\d+)?)\\s*W\\b").matcher(texto);
        if (m.find()) return m.group(1).replace(",", ".") + "W";
        return null;
    }

    private String extrairAnguloConexao(String texto) {
        if (texto.contains("90") && (texto.contains("GRAUS") || texto.contains("°") || texto.contains("GR"))) return "90°";
        if (texto.contains("45") && (texto.contains("GRAUS") || texto.contains("°") || texto.contains("GR"))) return "45°";
        return null;
    }

    private String extrairAcabamentoMetalico(String texto) {
        if (texto.contains("A FOGO") || texto.contains("A QUENTE") || texto.contains("GF")) return "Galvanizado a Fogo (GF)";
        if (texto.contains("PRE-ZINCADO") || texto.contains("PRE ZINCADO") || texto.contains("ELETROLITICO") || texto.contains("GE")) return "Pré-Zincado (GE)";
        if (texto.contains("INOX")) return "Aço Inox";
        return null;
    }

    private String extrairEspessuraChapa(String texto) {
        Matcher m = Pattern.compile("\\b(?:CHAPA|#)\\s*(14|16|18|20|22)\\b").matcher(texto);
        if (m.find()) return "Chapa #" + m.group(1);
        return null;
    }

    // ==========================================
    // CLASSIFICAÇÃO GERAL DE APOIO
    // ==========================================

    public ClassificacaoTecnicaDto extrairClassificacao(String textoOriginal) {
        if (textoOriginal == null || textoOriginal.isBlank()) {
            return new ClassificacaoTecnicaDto("OUTROS", null, List.of(), List.of(), null, null, "UN");
        }

        String norm = normalizar(textoOriginal);

        String categoria = "OUTROS";
        String subcategoria = null;

        if (contemQualquer(norm, "ELETRODUTO", "CONDUITE", "CORRUGADO", "TUBO EMT", "TUBO PVC", "DUTO")) {
            categoria = "Eletrodutos";
            if (contemQualquer(norm, "CORRUGADO", "CONDUITE")) {
                subcategoria = "Corrugados";
            } else if (contemQualquer(norm, "EMT", "GALVANIZADO", "METALICO")) {
                subcategoria = "Metálicos / EMT";
            } else if (contemQualquer(norm, "RIGIDO", "PVC")) {
                subcategoria = "Rígidos PVC";
            }
        } else if (contemQualquer(norm, "CABO", "FIO", "CONDUTOR", "CORDAO")) {
            categoria = "Cabos e Fios";
            if (contemQualquer(norm, "PP")) {
                subcategoria = "Cabos PP";
            } else if (contemQualquer(norm, "FLEX", "FLEXIVEL")) {
                subcategoria = "Cabos Flexíveis";
            } else if (contemQualquer(norm, "NU", "COBRE NU")) {
                subcategoria = "Cobre Nu";
            }
        } else if (contemQualquer(norm, "CAIXA", "CX", "QUADRO", "QDC", "PAINEL", "SKYBOX")) {
            categoria = "Caixas e Quadros";
            if (contemQualquer(norm, "OCTOGONAL", "OCT", "TETO", "LAJE", "SKYBOX")) {
                subcategoria = "Caixas de Laje / Teto";
            } else if (contemQualquer(norm, "4X2", "4X4")) {
                subcategoria = "Caixas de Embutir 4x2 / 4x4";
            } else if (contemQualquer(norm, "PASSAGEM")) {
                subcategoria = "Caixas de Passagem";
            } else if (contemQualquer(norm, "QUADRO", "QDC", "PAINEL", "DISTRIBUICAO")) {
                subcategoria = "Quadros de Distribuição";
            }
        } else if (contemQualquer(norm, "PERFILADO", "ELETROCALHA", "LEITO", "CANTONEIRA", "VERGALHAO")) {
            categoria = "Infraestrutura e Perfilados";
            if (contemQualquer(norm, "PERFILADO")) {
                subcategoria = "Perfilados";
            } else if (contemQualquer(norm, "ELETROCALHA")) {
                subcategoria = "Eletrocalhas";
            } else if (contemQualquer(norm, "VERGALHAO")) {
                subcategoria = "Vergalhões e Tirantes";
            }
        } else if (contemQualquer(norm, "DISJUNTOR", "DPS", "IDR", "DR", "FUSIVEL", "CHAVE")) {
            categoria = "Dispositivos de Proteção";
            if (contemQualquer(norm, "DISJUNTOR")) subcategoria = "Disjuntores";
            else if (contemQualquer(norm, "DPS")) subcategoria = "Protetores de Surto (DPS)";
            else if (contemQualquer(norm, "DR", "IDR")) subcategoria = "Interruptores DR";
        } else if (contemQualquer(norm, "LUVA", "CURVA", "ADAPTADOR", "BUCHA", "ARRUELA", "ABRACADEIRA", "JOELHO")) {
            categoria = "Conexões e Acessórios";
            if (contemQualquer(norm, "LUVA")) subcategoria = "Luvas";
            else if (contemQualquer(norm, "CURVA", "JOELHO")) subcategoria = "Curvas e Joelhos";
            else if (contemQualquer(norm, "ABRACADEIRA")) subcategoria = "Abraçadeiras";
        } else if (contemQualquer(norm, "LED", "LAMPADA", "PAINEL", "PLAFON", "REFLETOR", "SPOT")) {
            categoria = "Iluminação";
            subcategoria = "Luminárias e Lâmpadas LED";
        } else if (contemQualquer(norm, "TOMADA", "INTERRUPTOR", "PLACA", "MODULO")) {
            categoria = "Tomadas e Interruptores";
            subcategoria = "Mecanismos e Placas";
        }

        Set<String> aplicacoes = new LinkedHashSet<>();
        if (contemQualquer(norm, "LAJE", "TETO", "SKYBOX", "SNAP FIT", "CONCRETO")) aplicacoes.add("Laje");
        if (contemQualquer(norm, "PAREDE", "ALVENARIA", "DRYWALL", "GESSO", "EMBUTIR", "4X2", "4X4")) aplicacoes.add("Parede");
        if (contemQualquer(norm, "SOBREPOR", "APARENTE")) aplicacoes.add("Sobrepor / Aparente");
        if (contemQualquer(norm, "SUBTERRANEO", "ENTERRADO", "PISO")) aplicacoes.add("Subterrâneo / Piso");
        if (contemQualquer(norm, "SUSPENSAO", "AEREO", "TIRANTE", "PERFILADO")) aplicacoes.add("Infraestrutura Aérea");

        Set<String> caracteristicas = new LinkedHashSet<>();
        for (String var : VARIANTES_ESPECIFICAS) {
            if (norm.contains(var)) caracteristicas.add(capitalizar(var));
        }
        for (String cor : CORES_ELETRICAS) {
            if (Pattern.compile("\\b" + cor + "\\b").matcher(norm).find()) caracteristicas.add("Cor " + capitalizar(cor));
        }

        String fabricanteEncontrado = null;
        for (String fab : FABRICANTES_CONHECIDOS) {
            if (Pattern.compile("\\b" + fab + "\\b").matcher(norm).find()) {
                fabricanteEncontrado = capitalizar(fab);
                break;
            }
        }

        String codigoFabricante = null;
        Matcher mCod = Pattern.compile("(?:REF|COD|SKU|CODIGO)[.:\\s]*([A-Z0-9_-]+)").matcher(norm);
        if (mCod.find()) codigoFabricante = mCod.group(1);

        String unidade = "UN";
        if (categoria.equals("Cabos e Fios")) {
            unidade = contemQualquer(norm, "ROLO", "RL") ? "ROLO" : "M";
        } else if (categoria.equals("Eletrodutos") || categoria.equals("Infraestrutura e Perfilados")) {
            unidade = contemQualquer(norm, "BARRA", "BR") ? "BARRA" : (contemQualquer(norm, "ROLO", "RL") ? "ROLO" : "M");
        }

        return new ClassificacaoTecnicaDto(
                categoria,
                subcategoria,
                new ArrayList<>(aplicacoes),
                new ArrayList<>(caracteristicas),
                fabricanteEncontrado,
                codigoFabricante,
                unidade
        );
    }

    private boolean contemQualquer(String texto, String... termos) {
        for (String t : termos) {
            if (Pattern.compile("\\b" + t + "\\b").matcher(texto).find() || texto.contains(t)) {
                return true;
            }
        }
        return false;
    }

    private String normalizar(String texto) {
        return Normalizer.normalize(texto.toUpperCase(), Normalizer.Form.NFD)
                .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "")
                .replace("²", "2")
                .replace("³", "3")
                .replace(",", ".")
                .replaceAll("[^A-Z0-9\\s./\"-]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String capitalizar(String texto) {
        if (texto == null || texto.isBlank()) return "";
        String[] palavras = texto.toLowerCase().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String p : palavras) {
            if (!p.isBlank()) {
                sb.append(Character.toUpperCase(p.charAt(0))).append(p.substring(1)).append(" ");
            }
        }
        return sb.toString().trim();
    }
}
