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
        String pathBarbi = baseDir + "Cotacao_Barbi_PEX_10820.pdf";
        String pathTecnofluidos = baseDir + "Cotacao_Tecnofluidos_PERT_55410.pdf";

        gerarPdfSantil(path1);
        gerarPdfAndra(path2);
        gerarPdfEletricaLuz(path3);
        gerarPdfBarbiPex(pathBarbi);
        gerarPdfTecnofluidosPert(pathTecnofluidos);

        System.out.println("SUCESSO: PDFs de teste gerados com exito em: " + baseDir);
        System.out.println(" - " + pathBarbi);
        System.out.println(" - " + pathTecnofluidos);
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

    public static void gerarPdfBarbiPex(String outputPath) throws IOException {
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
                cs.showText("BARBI DO BRASIL SISTEMAS HIDRAULICOS LTDA");
                cs.endText();

                y -= 20;
                cs.beginText();
                cs.setFont(fontNormal, 10);
                cs.newLineAtOffset(50, y);
                cs.showText("CNPJ: 04.891.234/0001-50 | FONE: (11) 4589-3000 | JUNDIAI - SP");
                cs.endText();

                y -= 15;
                cs.beginText();
                cs.newLineAtOffset(50, y);
                cs.showText("VENDEDOR: Renato Barbi | EMAIL: orcamentos@barbi.com.br");
                cs.endText();

                y -= 15;
                cs.beginText();
                cs.newLineAtOffset(50, y);
                cs.showText("COTACAO: 10820 | DATA: 06/11/2026 | SISTEMA: PEX-B FLEXIO AGUA FRIA E QUENTE");
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
                    {"1", "TUBO PEX-B FLEXIO DN 16 (RL 200M)",            "RL", "1",   "R$ 960,00",  "R$ 960,00"},
                    {"2", "TUBO PEX-B FLEXIO DN 20 (RL 150M)",            "RL", "1",   "R$ 1.020,00","R$ 1.020,00"},
                    {"3", "CONECTOR FIXO COM ROSCA FEMEA 16 X 1/2",       "UN", "40",  "R$ 18,50",   "R$ 740,00"},
                    {"4", "CONECTOR FIXO COM ROSCA MACHO 16 X 1/2",       "UN", "30",  "R$ 16,90",   "R$ 507,00"},
                    {"5", "LUVA NORMAL 16MM LATAO",                       "UN", "25",  "R$ 14,20",   "R$ 355,00"},
                    {"6", "TE REDUCAO LATERAL 16 X 20 X 16 LATAO",        "UN", "20",  "R$ 29,80",   "R$ 596,00"},
                    {"7", "TE MISTURADOR COM ABA E ISOLANTE 1/2 X 16",    "UN", "10",  "R$ 48,00",   "R$ 480,00"},
                    {"8", "COTOVELO 90 COM ROSCA FEMEA 16 X 1/2",         "UN", "35",  "R$ 22,40",   "R$ 784,00"}
                };

                for (String[] it : itens) {
                    y -= 18;
                    cs.beginText();
                    cs.setFont(fontNormal, 8.5f);
                    cs.newLineAtOffset(50, y);
                    String line = String.format("%-3s %-42s %-6s %-7s %-12s %-10s", it[0], it[1], it[2], it[3], it[4], it[5]);
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
                cs.showText("VALOR TOTAL DOS MATERIAIS: R$ 5.442,00");
                cs.endText();

                y -= 16;
                cs.beginText();
                cs.setFont(fontNormal, 9);
                cs.newLineAtOffset(50, y);
                cs.showText("CONDICOES: 28 DIAS | FRETE CIF SAO PAULO | MARCA: BARBI DO BRASIL");
                cs.endText();
            }

            doc.save(new File(outputPath));
        }
    }

    public static void gerarPdfTecnofluidosPert(String outputPath) throws IOException {
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
                cs.showText("TECNOFLUIDOS DISTRIBUIDORA DE TUBOS E CONEXOES LTDA");
                cs.endText();

                y -= 20;
                cs.beginText();
                cs.setFont(fontNormal, 10);
                cs.newLineAtOffset(50, y);
                cs.showText("CNPJ: 18.765.432/0001-99 | FONE: (11) 3210-4400 | SAO PAULO - SP");
                cs.endText();

                y -= 15;
                cs.beginText();
                cs.newLineAtOffset(50, y);
                cs.showText("CONTATO: Amanda Ferreira | EMAIL: vendas@tecnofluidos.com.br");
                cs.endText();

                y -= 15;
                cs.beginText();
                cs.newLineAtOffset(50, y);
                cs.showText("PROPOSTA: 55410 | DATA: 06/11/2026 | SISTEMA: PE-RT TIPO II E CONEXOES ASF-C");
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
                    {"1", "TUBO PE-RT TIPO II DN 16 (RL 100M)",            "RL", "2",   "R$ 450,00",  "R$ 900,00"},
                    {"2", "TUBO PE-RT TIPO II DN 20 (ROLO 100M)",          "M",  "150", "R$ 6,50",    "R$ 975,00"},
                    {"3", "ASF-C ADAPTADOR FEMEA METALICA 16 X 1/2",       "PC", "40",  "R$ 17,80",   "R$ 712,00"},
                    {"4", "ASF-C ADAPTADOR MACHO METALICO 16 X 1/2",       "PC", "30",  "R$ 16,10",   "R$ 483,00"},
                    {"5", "ASF-C LUVA NORMAL 16MM METALICA",               "UN", "25",  "R$ 13,90",   "R$ 347,50"},
                    {"6", "ASF-C TE REDUCAO METALICO 16 X 20 X 16",        "UN", "20",  "R$ 28,50",   "R$ 570,00"},
                    {"7", "ASF-C TE MISTURADOR 1/2 X 16",                  "UN", "10",  "R$ 46,50",   "R$ 465,00"},
                    {"8", "ASF-C COTOVELO FEMEA COM SUPORTE 16 X 1/2",     "PC", "35",  "R$ 21,90",   "R$ 766,50"}
                };

                for (String[] it : itens) {
                    y -= 18;
                    cs.beginText();
                    cs.setFont(fontNormal, 8.5f);
                    cs.newLineAtOffset(50, y);
                    String line = String.format("%-3s %-42s %-6s %-7s %-12s %-10s", it[0], it[1], it[2], it[3], it[4], it[5]);
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
                cs.showText("VALOR TOTAL DOS MATERIAIS: R$ 5.219,00");
                cs.endText();

                y -= 16;
                cs.beginText();
                cs.setFont(fontNormal, 9);
                cs.newLineAtOffset(50, y);
                cs.showText("CONDICOES: 30 DIAS | FRETE CIF SAO PAULO | MARCA: TECNOFLUIDOS");
                cs.endText();
            }

            doc.save(new File(outputPath));
        }
    }
}
