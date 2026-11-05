package com.luisoliveira.ger_orcamentos.service;

import com.luisoliveira.ger_orcamentos.dto.ClassificacaoTecnicaDto;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ClassificadorTecnicoService {

    // Palavras que indicam especificações técnicas distintas que NUNCA devem ser mescladas automaticamente
    private static final List<String> VARIANTES_ESPECIFICAS = List.of(
            "PONTA AZUL", "CONVENCIONAL", "REFORCADO", "LEVE", "PESADO", "ANTICHAMA",
            "SNAP FIT", "SKYBOX", "SELADA", "BLINDADA", "HERMETICA",
            "CHAPA 14", "CHAPA 16", "CHAPA 18", "CHAPA 20",
            "CURVA 90", "CURVA 45", "750V", "1KV", "0.6/1KV"
    );

    // Cores elétricas técnicas
    private static final List<String> CORES_ELETRICAS = List.of(
            "AZUL", "VERMELHO", "PRETO", "VERDE", "BRANCO", "AMARELO", "CINZA"
    );

    // Fabricantes frequentes
    private static final List<String> FABRICANTES_CONHECIDOS = List.of(
            "TIGRE", "AMANCO", "SCHNEIDER", "STECK", "WEG", "LEGRAND", "PIAL",
            "TRAMONTINA", "PRYSMIAN", "SIL", "ELECON", "WETZEL", "MONT MAGNO", "SOEDRAL", "SIEMENS", "CORFIO", "COBRECOM"
    );

    public ClassificacaoTecnicaDto extrairClassificacao(String textoOriginal) {
        if (textoOriginal == null || textoOriginal.isBlank()) {
            return new ClassificacaoTecnicaDto("OUTROS", null, List.of(), List.of(), null, null, "UN");
        }

        String norm = normalizar(textoOriginal);

        // 1. Categoria e Subcategoria
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
        } else if (contemQualquer(norm, "LUVA", "CURVA", "ADAPTADOR", "BUCHA", "ARRUELA", "ABRACADEIRA")) {
            categoria = "Conexões e Acessórios";
            if (contemQualquer(norm, "LUVA")) subcategoria = "Luvas";
            else if (contemQualquer(norm, "CURVA")) subcategoria = "Curvas";
            else if (contemQualquer(norm, "ABRACADEIRA")) subcategoria = "Abraçadeiras";
        }

        // 2. Aplicações (Finalidades - Atributo AUXILIAR, não chave de merge)
        Set<String> aplicacoes = new LinkedHashSet<>();
        if (contemQualquer(norm, "LAJE", "TETO", "SKYBOX", "SNAP FIT", "CONCRETO")) {
            aplicacoes.add("Laje");
        }
        if (contemQualquer(norm, "PAREDE", "ALVENARIA", "DRYWALL", "GESSO", "EMBUTIR", "4X2", "4X4")) {
            aplicacoes.add("Parede");
        }
        if (contemQualquer(norm, "SOBREPOR", "APARENTE")) {
            aplicacoes.add("Sobrepor / Aparente");
        }
        if (contemQualquer(norm, "SUBTERRANEO", "ENTERRADO", "PISO")) {
            aplicacoes.add("Subterrâneo / Piso");
        }
        if (contemQualquer(norm, "SUSPENSAO", "AEREO", "TIRANTE", "PERFILADO")) {
            aplicacoes.add("Infraestrutura Aérea");
        }

        // 3. Características Técnicas (Diferenciadores estritos de produto)
        Set<String> caracteristicas = new LinkedHashSet<>();

        // Variantes específicas
        for (String var : VARIANTES_ESPECIFICAS) {
            if (norm.contains(var)) {
                caracteristicas.add(capitalizar(var));
            }
        }

        // Cores elétricas
        for (String cor : CORES_ELETRICAS) {
            if (Pattern.compile("\\b" + cor + "\\b").matcher(norm).find()) {
                caracteristicas.add("Cor " + capitalizar(cor));
            }
        }

        // Bitolas e Dimensões (20mm, 25mm, 3/4", 2.5mm², 38x38, etc.)
        Matcher mDim = Pattern.compile("(\\b\\d+(?:[,.]\\d+)?(?:MM2|MM|M|POL|POLEGADAS|\"|')\\b|\\b\\d+X\\d+\\b)").matcher(norm);
        while (mDim.find()) {
            caracteristicas.add(mDim.group().replace("MM2", "mm²").replace("MM", "mm"));
        }

        // 4. Fabricante
        String fabricanteEncontrado = null;
        for (String fab : FABRICANTES_CONHECIDOS) {
            if (Pattern.compile("\\b" + fab + "\\b").matcher(norm).find()) {
                fabricanteEncontrado = capitalizar(fab);
                break;
            }
        }

        // 5. Código do Fabricante / Referência
        String codigoFabricante = null;
        Matcher mCod = Pattern.compile("(?:REF|COD|SKU|CODIGO)[.:\\s]*([A-Z0-9_-]+)").matcher(norm);
        if (mCod.find()) {
            codigoFabricante = mCod.group(1);
        }

        // 6. Unidade sugerida
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

    /**
     * REGRA DE OURO DO CADASTRO MESTRE:
     * Mesma finalidade/aplicação NÃO significa mesmo produto!
     * Verifica se dois materiais possuem finalidades semelhantes mas especificações/variantes técnicas conflitantes.
     *
     * @return Mensagem de conflito se houver divergência técnica substancial, ou null se compatíveis.
     */
    public String detectarConflitoEspecificacao(String descItemA, String descItemB) {
        if (descItemA == null || descItemB == null) return null;

        String normA = normalizar(descItemA);
        String normB = normalizar(descItemB);

        // 1. Conflito de variantes de produto conhecidas (ex: PONTA AZUL vs CONVENCIONAL, REFORÇADO vs LEVE)
        boolean aPontaAzul = normA.contains("PONTA AZUL");
        boolean bPontaAzul = normB.contains("PONTA AZUL");
        if (aPontaAzul != bPontaAzul) {
            return "Divergência de especificação: Um item é 'Ponta Azul' e o outro é convencional/reforçado. São produtos distintos para cotação de alternativas.";
        }

        boolean aReforcado = normA.contains("REFORCADO") || normA.contains("PESADO");
        boolean bReforcado = normB.contains("REFORCADO") || normB.contains("PESADO");
        boolean aLeve = normA.contains("LEVE") || normA.contains("CONVENCIONAL");
        boolean bLeve = normB.contains("LEVE") || normB.contains("CONVENCIONAL");
        if ((aReforcado && bLeve) || (bReforcado && aLeve)) {
            return "Divergência de especificação: 'Reforçado/Pesado' vs 'Convencional/Leve'. São produtos diferentes que devem ser comparados com cautela.";
        }

        boolean aSkybox = normA.contains("SKYBOX") || normA.contains("SELADA");
        boolean bSkybox = normB.contains("SKYBOX") || normB.contains("SELADA");
        boolean aSnapFit = normA.contains("SNAP FIT");
        boolean bSnapFit = normB.contains("SNAP FIT");
        if (aSkybox != bSkybox || aSnapFit != bSnapFit) {
            if ((aSkybox && bSnapFit) || (bSkybox && aSnapFit)) {
                return "Divergência de modelo: Caixa Selada Skybox vs Snap Fit. Embora ambas atendam Laje, possuem tecnologias e custos de fabricação diferentes.";
            }
        }

        // 2. Conflito de cores em condutores/cabos (ex: Cabo Azul vs Cabo Vermelho)
        for (String cor : CORES_ELETRICAS) {
            boolean aTem = Pattern.compile("\\b" + cor + "\\b").matcher(normA).find();
            for (String outraCor : CORES_ELETRICAS) {
                if (cor.equals(outraCor)) continue;
                boolean bTem = Pattern.compile("\\b" + outraCor + "\\b").matcher(normB).find();
                if (aTem && bTem) {
                    return String.format("Divergência de cor: Cabo %s vs Cabo %s. Circuitos elétricos distintos.", capitalizar(cor), capitalizar(outraCor));
                }
            }
        }

        return null;
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
