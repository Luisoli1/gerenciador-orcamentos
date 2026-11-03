package com.luisoliveira.ger_orcamentos;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;

import java.io.File;
import java.io.IOException;

public class GeradorPdfTeste {

    public static void main(String[] args) throws Exception {
        String path1 = "C:\\Users\\Administrador\\Downloads\\Cotacao_MONT_MAGNO_Teste.pdf";
        String path2 = "C:\\Users\\Administrador\\Downloads\\Cotacao_ELECON_Teste.pdf";

        gerarPdfMontMagno(path1);
        gerarPdfElecon(path2);

        System.out.println("SUCESSO: PDFs de teste gerados em:");
        System.out.println(path1);
        System.out.println(path2);
    }

    public static void gerarPdfMontMagno(String outputPath) throws IOException {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
                PDType1Font fontNormal = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

                float y = 780;

                // Cabecalho
                cs.beginText();
                cs.setFont(fontBold, 14);
                cs.newLineAtOffset(50, y);
                cs.showText("MONT MAGNO FIXADORES LTDA");
                cs.endText();

                y -= 20;
                cs.beginText();
                cs.setFont(fontNormal, 10);
                cs.newLineAtOffset(50, y);
                cs.showText("CNPJ: 62.956.115/0001-01 | FONE: (11) 2021-6121 | CEL: (11) 99240-4323");
                cs.endText();

                y -= 15;
                cs.beginText();
                cs.newLineAtOffset(50, y);
                cs.showText("CONTATO: Amanda Menossi | EMAIL: vendas7@montmagno.com.br");
                cs.endText();

                y -= 15;
                cs.beginText();
                cs.newLineAtOffset(50, y);
                cs.showText("ORCAMENTO NUMERO: MM-2026-901 | DATA: 2026-11-01 | VALIDADE: 2026-11-15");
                cs.endText();

                y -= 25;
                cs.setLineWidth(1);
                cs.moveTo(50, y);
                cs.lineTo(545, y);
                cs.stroke();

                // Titulo Itens
                y -= 20;
                cs.beginText();
                cs.setFont(fontBold, 10);
                cs.newLineAtOffset(50, y);
                cs.showText("IT  DESCRICAO                                  UND   QTD    VLR.UNIT     VLR.TOTAL");
                cs.endText();

                y -= 10;
                cs.moveTo(50, y);
                cs.lineTo(545, y);
                cs.stroke();

                String[][] itens = {
                    {"1", "Abracadeira D c/ Parafuso GE 2-1/2\"", "PC", "200", "R$ 1,45", "R$ 290,00"},
                    {"2", "Abracadeira D c/ Parafuso GE 2\"",     "PC", "300", "R$ 0,98", "R$ 294,00"},
                    {"3", "Porca Sextavada GE 3/8\"",             "PC", "1000", "R$ 0,12", "R$ 120,00"},
                    {"4", "Jaqueta e Cone GE 3/8\"",              "PC", "500", "R$ 0,85", "R$ 425,00"},
                    {"5", "Vergalhao Rosca Total GE 3/8 x 3mts",  "BRS", "60", "R$ 14,00", "R$ 840,00"},
                    {"6", "Parafuso AA Panela Phillips GE 4,8 x 38", "PC", "500", "R$ 0,13", "R$ 65,00"}
                };

                for (String[] it : itens) {
                    y -= 18;
                    cs.beginText();
                    cs.setFont(fontNormal, 9);
                    cs.newLineAtOffset(50, y);
                    String line = String.format("%-3s %-40s %-5s %-6s %-12s %-10s", it[0], it[1], it[2], it[3], it[4], it[5]);
                    cs.showText(line);
                    cs.endText();
                }

                y -= 25;
                cs.moveTo(50, y);
                cs.lineTo(545, y);
                cs.stroke();

                y -= 20;
                cs.beginText();
                cs.setFont(fontBold, 11);
                cs.newLineAtOffset(50, y);
                cs.showText("VALOR TOTAL DA MERCADORIA: R$ 2.034,00");
                cs.endText();

                y -= 16;
                cs.beginText();
                cs.newLineAtOffset(50, y);
                cs.showText("VALOR TOTAL GERAL DO ORCAMENTO: R$ 2.034,00");
                cs.endText();
            }

            doc.save(new File(outputPath));
        }
    }

    public static void gerarPdfElecon(String outputPath) throws IOException {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
                PDType1Font fontNormal = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

                float y = 780;

                // Cabecalho
                cs.beginText();
                cs.setFont(fontBold, 14);
                cs.newLineAtOffset(50, y);
                cs.showText("Elecon Industria e Comercio Ltda.");
                cs.endText();

                y -= 20;
                cs.beginText();
                cs.setFont(fontNormal, 10);
                cs.newLineAtOffset(50, y);
                cs.showText("CNPJ: 43.486.604/0001-00 | FONE: (11) 2066-4100 | CEL: (11) 94138-7010");
                cs.endText();

                y -= 15;
                cs.beginText();
                cs.newLineAtOffset(50, y);
                cs.showText("CONTATO: LUCAS PEREIRA | EMAIL: lucas@elecon.com.br | GUARULHOS - SP");
                cs.endText();

                y -= 15;
                cs.beginText();
                cs.newLineAtOffset(50, y);
                cs.showText("COTACAO NUMERO: 832.100 | DATA: 2026-11-02 | VALIDADE: 2026-11-10");
                cs.endText();

                y -= 25;
                cs.setLineWidth(1);
                cs.moveTo(50, y);
                cs.lineTo(545, y);
                cs.stroke();

                // Titulo Itens
                y -= 20;
                cs.beginText();
                cs.setFont(fontBold, 10);
                cs.newLineAtOffset(50, y);
                cs.showText("IT  DESCRICAO                                  UND   QTD    VLR.UNIT     VLR.TOTAL");
                cs.endText();

                y -= 10;
                cs.moveTo(50, y);
                cs.lineTo(545, y);
                cs.stroke();

                // OS MESMOS 6 ITENS COM PRECOS DIFERENTES
                String[][] itens = {
                    {"1", "Abracadeira D c/ Parafuso GE 2-1/2\"", "PC", "200", "R$ 1,60", "R$ 320,00"},
                    {"2", "Abracadeira D c/ Parafuso GE 2\"",     "PC", "300", "R$ 0,90", "R$ 270,00"},
                    {"3", "Porca Sextavada GE 3/8\"",             "PC", "1000", "R$ 0,10", "R$ 100,00"},
                    {"4", "Jaqueta e Cone GE 3/8\"",              "PC", "500", "R$ 0,92", "R$ 460,00"},
                    {"5", "Vergalhao Rosca Total GE 3/8 x 3mts",  "BRS", "60", "R$ 13,20", "R$ 792,00"},
                    {"6", "Parafuso AA Panela Phillips GE 4,8 x 38", "PC", "500", "R$ 0,11", "R$ 55,00"}
                };

                for (String[] it : itens) {
                    y -= 18;
                    cs.beginText();
                    cs.setFont(fontNormal, 9);
                    cs.newLineAtOffset(50, y);
                    String line = String.format("%-3s %-40s %-5s %-6s %-12s %-10s", it[0], it[1], it[2], it[3], it[4], it[5]);
                    cs.showText(line);
                    cs.endText();
                }

                y -= 25;
                cs.moveTo(50, y);
                cs.lineTo(545, y);
                cs.stroke();

                y -= 20;
                cs.beginText();
                cs.setFont(fontBold, 11);
                cs.newLineAtOffset(50, y);
                cs.showText("VALOR TOTAL DA MERCADORIA: R$ 1.997,00");
                cs.endText();

                y -= 16;
                cs.beginText();
                cs.newLineAtOffset(50, y);
                cs.showText("VALOR TOTAL IPI: R$ 0,00");
                cs.endText();

                y -= 16;
                cs.beginText();
                cs.newLineAtOffset(50, y);
                cs.showText("VALOR TOTAL GERAL DO ORCAMENTO: R$ 1.997,00");
                cs.endText();
            }

            doc.save(new File(outputPath));
        }
    }
}