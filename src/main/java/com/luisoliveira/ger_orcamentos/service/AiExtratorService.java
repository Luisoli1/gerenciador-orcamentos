
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
        System.out.println("--> A iniciar a extração de texto do PDF...");

        String jsonTexto;
        try {
            jsonTexto = geminiClient.enviarPrompt(file);
        } catch (IOException e) {
            throw new RuntimeException(e);
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
