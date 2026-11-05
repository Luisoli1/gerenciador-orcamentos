package com.luisoliveira.ger_orcamentos.service;

import tools.jackson.databind.json.JsonMapper;

import com.luisoliveira.ger_orcamentos.client.GeminiClient;
import com.luisoliveira.ger_orcamentos.dto.QuadroConcorrenciaDto;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

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
        }

        try {
            System.out.println("--> Resposta crua da IA:\n" + jsonTexto);
            return jsonMapper.readValue(jsonTexto, QuadroConcorrenciaDto.class);
        } catch (Exception e) {
            throw new RuntimeException(
                    "Erro ao desserializar o JSON da IA para o QuadroConcorrenciaDto: "
                            + e.getMessage(), e);
        }
    }
}
