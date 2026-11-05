package com.luisoliveira.ger_orcamentos.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class PdfExtractorService {

    public String extrairTexto(MultipartFile file) {
        Path tempFile = null;
        try {
            tempFile = Files.createTempFile("pdf_extract_", ".pdf");
            file.transferTo(tempFile.toFile());
            try (PDDocument document = Loader.loadPDF(tempFile.toFile())) {
                PDFTextStripper stripper = new PDFTextStripper();
                stripper.setSortByPosition(true);
                int totalPages = document.getNumberOfPages();
                if (totalPages > 150) {
                    // Limita extração de catálogos gigantescos a 150 páginas para preservar memória
                    stripper.setEndPage(150);
                }
                return stripper.getText(document);
            }
        } catch (IOException e) {
            throw new RuntimeException("Erro ao processar e extrair texto do ficheiro PDF: " + e.getMessage(), e);
        } finally {
            if (tempFile != null) {
                try {
                    Files.deleteIfExists(tempFile);
                } catch (Exception ignored) {}
            }
        }
    }
}
