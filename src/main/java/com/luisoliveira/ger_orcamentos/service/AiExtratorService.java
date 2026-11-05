package com.luisoliveira.ger_orcamentos.service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import com.luisoliveira.ger_orcamentos.client.GeminiClient;
import com.luisoliveira.ger_orcamentos.dto.ItemQuadroDTO;
import com.luisoliveira.ger_orcamentos.dto.QuadroConcorrenciaDto;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class AiExtratorService {

    private final PdfExtractorService pdfExtractorService;
    private final GeminiClient geminiClient;
    private final JsonMapper jsonMapper;

    public AiExtratorService(
            PdfExtractorService pdfExtractorService,
            GeminiClient geminiClient,
            JsonMapper jsonMapper) {

        this.pdfExtractorService = pdfExtractorService;
        this.geminiClient = geminiClient;
        this.jsonMapper = jsonMapper;
    }

    public QuadroConcorrenciaDto extrairDados(MultipartFile file)  {
        String nomeArquivo = file.getOriginalFilename();
        long tamanhoKb = file.getSize() / 1024;
        System.out.println("--> A iniciar extração de dados do PDF: " + nomeArquivo + " (" + tamanhoKb + " KB)...");

        String jsonTexto = null;
        String textoExtraido = null;

        // 1. Tenta extrair texto com Apache PDFBox (muito mais rápido, consome quase zero memória e suporta catálogos enormes)
        try {
            textoExtraido = pdfExtractorService.extrairTexto(file);
        } catch (Exception ex) {
            System.out.println("Aviso: Falha ao extrair texto bruto via PDFBox: " + ex.getMessage());
        }

        // Se o documento tiver camada de texto consistente (> 100 caracteres)
        if (textoExtraido != null && textoExtraido.trim().length() > 100) {
            System.out.println("--> Camada de texto detectada (" + textoExtraido.trim().length() + " caracteres). Enviando texto ao Gemini...");
            if (textoExtraido.length() > 300000) {
                textoExtraido = textoExtraido.substring(0, 300000);
            }
            jsonTexto = geminiClient.enviarPromptTexto(textoExtraido, nomeArquivo);
        } else {
            // Documento escaneado / sem texto selecionável
            if (file.getSize() > 19 * 1024 * 1024) {
                throw new RuntimeException("O arquivo '" + nomeArquivo + "' possui mais de 19MB e não contém texto selecionável (apenas imagens escaneadas). Comprima o arquivo ou use uma versão com texto pesquisável.");
            }
            System.out.println("--> PDF escaneado ou sem texto selecionável. Enviando arquivo binário para visão multimodal do Gemini...");
            try {
                jsonTexto = geminiClient.enviarPrompt(file);
            } catch (IOException e) {
                throw new RuntimeException("Erro ao enviar PDF binário para IA: " + e.getMessage(), e);
            }
        }

        System.out.println("--> Resposta recebida do Gemini com sucesso!");

        if (jsonTexto != null) {
            jsonTexto = jsonTexto.replaceAll("```json", "")
                    .replaceAll("```", "").trim();
            int primeiroIndex = jsonTexto.indexOf('{');
            int ultimoIndex = jsonTexto.lastIndexOf('}');
            if (primeiroIndex >= 0 && ultimoIndex > primeiroIndex) {
                jsonTexto = jsonTexto.substring(primeiroIndex, ultimoIndex + 1).trim();
            }
        }

        try {
            System.out.println("--> Resposta crua da IA:\n" + jsonTexto);
            return jsonMapper.readValue(jsonTexto, QuadroConcorrenciaDto.class);
        } catch (Exception e) {
            System.err.println("Aviso: Falha ao mapear diretamente para QuadroConcorrenciaDto (" + e.getMessage() + "). Tentando fallback resiliente via JsonNode...");
            try {
                JsonNode root = jsonMapper.readTree(jsonTexto);
                QuadroConcorrenciaDto fallback = new QuadroConcorrenciaDto();
                if (root.has("nomeFornecedor")) fallback.setNomeFornecedor(root.get("nomeFornecedor").asText(null));
                if (root.has("cnpjFornecedor")) fallback.setCnpjFornecedor(root.get("cnpjFornecedor").asText(null));
                if (root.has("numeroOrcamento")) fallback.setNumeroOrcamento(root.get("numeroOrcamento").asText(null));

                if (root.has("itens") && root.get("itens").isArray()) {
                    List<ItemQuadroDTO> itens = new ArrayList<>();
                    for (JsonNode itNode : root.get("itens")) {
                        String desc = itNode.has("descricao") ? itNode.get("descricao").asText(null) : null;
                        if (desc == null || desc.isBlank()) continue;
                        String unid = itNode.has("unidadeMedida") && !itNode.get("unidadeMedida").isNull() ? itNode.get("unidadeMedida").asText("UN") : "UN";
                        String marca = itNode.has("marca") && !itNode.get("marca").isNull() ? itNode.get("marca").asText(null) : null;
                        BigDecimal qtd = BigDecimal.ONE;
                        if (itNode.has("quantidade") && !itNode.get("quantidade").isNull()) {
                            try { qtd = new BigDecimal(itNode.get("quantidade").asText("1").replace(",", ".")); } catch (Exception ignored) {}
                        }
                        BigDecimal vlrUnit = BigDecimal.ZERO;
                        if (itNode.has("valorUnitario") && !itNode.get("valorUnitario").isNull()) {
                            try { vlrUnit = new BigDecimal(itNode.get("valorUnitario").asText("0").replace(",", ".")); } catch (Exception ignored) {}
                        }
                        BigDecimal vlrTot = BigDecimal.ZERO;
                        if (itNode.has("valorTotal") && !itNode.get("valorTotal").isNull()) {
                            try { vlrTot = new BigDecimal(itNode.get("valorTotal").asText("0").replace(",", ".")); } catch (Exception ignored) {}
                        }
                        itens.add(new ItemQuadroDTO(marca, desc.trim(), unid.trim().toUpperCase(), qtd, vlrUnit, vlrTot, null));
                    }
                    fallback.setItens(itens);
                }
                return fallback;
            } catch (Exception exFallback) {
                throw new RuntimeException("Erro ao desserializar o JSON da IA para o QuadroConcorrenciaDto: " + e.getMessage(), e);
            }
        }
    }
}
