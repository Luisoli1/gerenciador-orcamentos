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
        String baseDir = "C:\\Users\\Administrador\\Desktop\\Orcamentos_Teste\\";
        File dir = new File(baseDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        String path1 = baseDir + "Cotacao_1_Santil_45010.pdf";
        String path2 = baseDir + "Cotacao_2_Andra_88214.pdf";
        String path3 = baseDir + "Cotacao_3_Eletrica_Luz_10325.pdf";

        gerarPdfSantil(path1);
        gerarPdfAndra(path2);
        gerarPdfEletricaLuz(path3);

        System.out.println("SUCESSO: 3 PDFs de teste gerados com exito em: " + baseDir);
        System.out.println(" - " + path1);
        System.out.println(" - " + path2);
        System.out.println(" - " + path3);
    }

    public static void gerarPdfSantil(String outputPath) throws IOException {
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
                cs.showText("SANTIL DISTRIBUIDORA DE MATERIAIS ELETRICOS LTDA");
                cs.endText();

                y -= 20;
                cs.beginText();
                cs.setFont(fontNormal, 10);
                cs.newLineAtOffset(50, y);
                cs.showText("CNPJ: 61.234.567/0001-89 | FONE: (11) 3990-2000 | SAO PAULO - SP");
                cs.endText();

                y -= 15;
                cs.beginText();
                cs.newLineAtOffset(50, y);
                cs.showText("VENDEDOR: Carlos Eduardo | EMAIL: vendas@santil.com.br");
                cs.endText();

                y -= 15;
                cs.beginText();
                cs.newLineAtOffset(50, y);
                cs.showText("PROPOSTA COMERCIAL: 45010 | DATA: 06/11/2026 | CONDICAO: 28 DIAS");
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
                cs.showText("IT  DESCRICAO DO PRODUTO                   UND    QTD     VLR.UNIT     VLR.TOTAL");
                cs.endText();

                y -= 10;
                cs.moveTo(50, y);
                cs.lineTo(545, y);
                cs.stroke();

                String[][] itens = {
                    {"1", "CX OCTOG FDO MOVEL 4X4 TIGRE",        "UN", "35",   "R$ 3,20",  "R$ 112,00"},
                    {"2", "ELETRODUTO CORRUGADO AMARELO 3/4",     "M",  "500",  "R$ 2,50",  "R$ 1.250,00"},
                    {"3", "LAMPADA LED BULBO 9W BIVOLT 6500K",    "UN", "100",  "R$ 12,00", "R$ 1.200,00"},
                    {"4", "DISJUNTOR MONOPOLAR DIN 20A STECK",    "UN", "15",   "R$ 14,50", "R$ 217,50"},
                    {"5", "CABO FLEXIVEL 2,5MM 750V AZUL",        "M",  "300",  "R$ 2,10",  "R$ 630,00"}
                };

                for (String[] it : itens) {
                    y -= 18;
                    cs.beginText();
                    cs.setFont(fontNormal, 9);
                    cs.newLineAtOffset(50, y);
                    String line = String.format("%-3s %-40s %-6s %-7s %-12s %-10s", it[0], it[1], it[2], it[3], it[4], it[5]);
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
                cs.showText("VALOR TOTAL DOS PRODUTOS: R$ 3.409,50");
                cs.endText();

                y -= 16;
                cs.beginText();
                cs.newLineAtOffset(50, y);
                cs.showText("VALOR TOTAL DA PROPOSTA: R$ 3.409,50 (FRETE CIF)");
                cs.endText();
            }

            doc.save(new File(outputPath));
        }
    }

    public static void gerarPdfAndra(String outputPath) throws IOException {
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
                cs.showText("ANDRA MATERIAIS ELETRICOS E ILUMINACAO LTDA");
                cs.endText();

                y -= 20;
                cs.beginText();
                cs.setFont(fontNormal, 10);
                cs.newLineAtOffset(50, y);
                cs.showText("CNPJ: 54.987.654/0001-32 | FONE: (11) 3352-7000 | SAO PAULO - SP");
                cs.endText();

                y -= 15;
                cs.beginText();
                cs.newLineAtOffset(50, y);
                cs.showText("ATENDIMENTO: Roberto Silva | EMAIL: rsilva@andra.com.br");
                cs.endText();

                y -= 15;
                cs.beginText();
                cs.newLineAtOffset(50, y);
                cs.showText("ORCAMENTO: 88214 | DATA: 06/11/2026 | CONDICAO: 30/60 DIAS");
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
                cs.showText("IT  DESCRICAO DO PRODUTO                   UND    QTD     VLR.UNIT     VLR.TOTAL");
                cs.endText();

                y -= 10;
                cs.moveTo(50, y);
                cs.lineTo(545, y);
                cs.stroke();

                String[][] itens = {
                    {"1", "CAIXA OCT 4X4 P/ LAJE",                "PC", "35",   "R$ 2,90",   "R$ 101,50"},
                    {"2", "ELETRODUTO CORRUGADO 3/4 (RL C/ 50M)", "RL", "10",   "R$ 125,00", "R$ 1.250,00"},
                    {"3", "LAMP LED 9W BRANCA FRIA E27",          "UN", "80",   "R$ 13,00",  "R$ 1.040,00"},
                    {"4", "DISJUNTOR DIN 1P 20A CURVA C",         "UN", "15",   "R$ 13,80",  "R$ 207,00"},
                    {"5", "FIO FLEXIVEL 2,5MM 750V AZ",           "M",  "300",  "R$ 2,05",   "R$ 615,00"}
                };

                for (String[] it : itens) {
                    y -= 18;
                    cs.beginText();
                    cs.setFont(fontNormal, 9);
                    cs.newLineAtOffset(50, y);
                    String line = String.format("%-3s %-40s %-6s %-7s %-12s %-10s", it[0], it[1], it[2], it[3], it[4], it[5]);
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
                cs.showText("VALOR TOTAL DOS PRODUTOS: R$ 3.213,50");
                cs.endText();

                y -= 16;
                cs.beginText();
                cs.newLineAtOffset(50, y);
                cs.showText("VALOR TOTAL DO PEDIDO: R$ 3.213,50 (FRETE CIF)");
                cs.endText();
            }

            doc.save(new File(outputPath));
        }
    }

    public static void gerarPdfEletricaLuz(String outputPath) throws IOException {
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
                cs.showText("ELETRICA LUZ & FORCA COMERCIO LTDA");
                cs.endText();

                y -= 20;
                cs.beginText();
                cs.setFont(fontNormal, 10);
                cs.newLineAtOffset(50, y);
                cs.showText("CNPJ: 42.111.222/0001-05 | FONE: (11) 2950-8800 | SAO PAULO - SP");
                cs.endText();

                y -= 15;
                cs.beginText();
                cs.newLineAtOffset(50, y);
                cs.showText("CONTATO: Marcelo Prado | EMAIL: vendas@eletricaluz.com.br");
                cs.endText();

                y -= 15;
                cs.beginText();
                cs.newLineAtOffset(50, y);
                cs.showText("COTACAO DE PRECOS: 10325 | DATA: 06/11/2026 | CONDICAO: A VISTA (3% DESC)");
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
                cs.showText("IT  DESCRICAO DO PRODUTO                   UND    QTD     VLR.UNIT     VLR.TOTAL");
                cs.endText();

                y -= 10;
                cs.moveTo(50, y);
                cs.lineTo(545, y);
                cs.stroke();

                String[][] itens = {
                    {"1", "CX OCT 4X4 LAJE TIGRE",                "UN", "35",   "R$ 2,85",  "R$ 99,75"},
                    {"2", "ELETRODUTO CORRUG 3/4 POL (BOBINA 25M)","UN", "20",  "R$ 70,00", "R$ 1.400,00"},
                    {"3", "LAMPADA LED 9W 6500K",                 "UN", "100",  "R$ 11,50", "R$ 1.150,00"},
                    {"4", "CABO ELETRICO FLEX 2,5MM AZUL SIL",     "M",  "300",  "R$ 2,20",  "R$ 660,00"}
                };

                for (String[] it : itens) {
                    y -= 18;
                    cs.beginText();
                    cs.setFont(fontNormal, 9);
                    cs.newLineAtOffset(50, y);
                    String line = String.format("%-3s %-40s %-6s %-7s %-12s %-10s", it[0], it[1], it[2], it[3], it[4], it[5]);
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
                cs.showText("VALOR TOTAL DOS ITENS: R$ 3.309,75");
                cs.endText();

                y -= 16;
                cs.beginText();
                cs.newLineAtOffset(50, y);
                cs.showText("OBS: ITEM DISJUNTOR 20A INDISPONIVEL EM NOSSO ESTOQUE NO MOMENTO.");
                cs.endText();
            }

            doc.save(new File(outputPath));
        }
    }
}
