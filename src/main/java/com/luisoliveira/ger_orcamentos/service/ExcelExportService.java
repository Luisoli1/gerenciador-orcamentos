package com.luisoliveira.ger_orcamentos.service;

import com.luisoliveira.ger_orcamentos.dto.ItemQuadroDTO;
import com.luisoliveira.ger_orcamentos.dto.QuadroComparativoDto;
import com.luisoliveira.ger_orcamentos.dto.QuadroConcorrenciaDto;
import com.luisoliveira.ger_orcamentos.dto.QuadroMetaDadosDto;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class ExcelExportService {

   @org.springframework.beans.factory.annotation.Autowired(required = false)
   private ConciliacaoService conciliacaoService;

   public ByteArrayInputStream gerarQuadroComparativoExcel(QuadroComparativoDto comparativo) {
      ByteArrayOutputStream out = new ByteArrayOutputStream();

      try (Workbook workbook = new XSSFWorkbook()) {
         Sheet sheet = workbook.createSheet("Quadro Comparativo");
         sheet.setDisplayGridlines(true);

         // --- PALETA DE CORES DA MAKINSTHAL ---
         byte[] tealRgb = new byte[]{(byte) 80, (byte) 180, (byte) 184};
         XSSFColor tealColor = new XSSFColor(tealRgb, null);

         byte[] grayRgb = new byte[]{(byte) 217, (byte) 217, (byte) 217};
         XSSFColor grayColor = new XSSFColor(grayRgb, null);

         // --- ESTILOS DE FONTE ---
         Font fontWhiteBold = workbook.createFont();
         fontWhiteBold.setBold(true);
         fontWhiteBold.setColor(IndexedColors.WHITE.getIndex());
         fontWhiteBold.setFontName("Arial");
         fontWhiteBold.setFontHeightInPoints((short) 9);

         Font fontBlackBold = workbook.createFont();
         fontBlackBold.setBold(true);
         fontBlackBold.setFontName("Arial");
         fontBlackBold.setFontHeightInPoints((short) 9);

         Font fontNormal = workbook.createFont();
         fontNormal.setFontName("Arial");
         fontNormal.setFontHeightInPoints((short) 8);

         Font fontTitle = workbook.createFont();
         fontTitle.setBold(true);
         fontTitle.setFontName("Arial");
         fontTitle.setFontHeightInPoints((short) 12);

         // --- BORDAS E ESTILOS ---
         CellStyle styleBase = workbook.createCellStyle();
         setBorders(styleBase);
         styleBase.setFont(fontNormal);

         CellStyle headerTealStyle = workbook.createCellStyle();
         setBorders(headerTealStyle);
         headerTealStyle.setFillForegroundColor(tealColor);
         headerTealStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
         headerTealStyle.setAlignment(HorizontalAlignment.CENTER);
         headerTealStyle.setVerticalAlignment(VerticalAlignment.CENTER);
         headerTealStyle.setFont(fontWhiteBold);
         headerTealStyle.setWrapText(true);

         CellStyle scopeGrayStyle = workbook.createCellStyle();
         setBorders(scopeGrayStyle);
         scopeGrayStyle.setFillForegroundColor(grayColor);
         scopeGrayStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
         scopeGrayStyle.setFont(fontBlackBold);
         scopeGrayStyle.setVerticalAlignment(VerticalAlignment.CENTER);

         CellStyle currencyStyle = workbook.createCellStyle();
         setBorders(currencyStyle);
         DataFormat format = workbook.createDataFormat();
         currencyStyle.setDataFormat(format.getFormat("R$ #,##0.00"));
         currencyStyle.setFont(fontNormal);
         currencyStyle.setAlignment(HorizontalAlignment.RIGHT);

         CellStyle currencyBoldStyle = workbook.createCellStyle();
         setBorders(currencyBoldStyle);
         currencyBoldStyle.setDataFormat(format.getFormat("R$ #,##0.00"));
         currencyBoldStyle.setFont(fontBlackBold);
         currencyBoldStyle.setAlignment(HorizontalAlignment.RIGHT);

         CellStyle currencyScopeStyle = workbook.createCellStyle();
         setBorders(currencyScopeStyle);
         currencyScopeStyle.setFillForegroundColor(grayColor);
         currencyScopeStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
         currencyScopeStyle.setDataFormat(format.getFormat("R$ #,##0.00"));
         currencyScopeStyle.setFont(fontBlackBold);
         currencyScopeStyle.setAlignment(HorizontalAlignment.RIGHT);

         CellStyle centerBoldStyle = workbook.createCellStyle();
         setBorders(centerBoldStyle);
         centerBoldStyle.setAlignment(HorizontalAlignment.CENTER);
         centerBoldStyle.setVerticalAlignment(VerticalAlignment.CENTER);
         centerBoldStyle.setFont(fontBlackBold);

         CellStyle titleStyle = workbook.createCellStyle();
         setBorders(titleStyle);
         titleStyle.setAlignment(HorizontalAlignment.CENTER);
         titleStyle.setVerticalAlignment(VerticalAlignment.CENTER);
         titleStyle.setFont(fontTitle);

         CellStyle mergedBoldStyle = workbook.createCellStyle();
         setBorders(mergedBoldStyle);
         mergedBoldStyle.setAlignment(HorizontalAlignment.CENTER);
         mergedBoldStyle.setVerticalAlignment(VerticalAlignment.CENTER);
         mergedBoldStyle.setFont(fontBlackBold);

         CellStyle mergedNormalStyle = workbook.createCellStyle();
         setBorders(mergedNormalStyle);
         mergedNormalStyle.setAlignment(HorizontalAlignment.CENTER);
         mergedNormalStyle.setVerticalAlignment(VerticalAlignment.CENTER);
         mergedNormalStyle.setFont(fontNormal);

         List<QuadroConcorrenciaDto> orcamentos = comparativo.getOrcamentos() != null ? comparativo.getOrcamentos() : new ArrayList<>();
         int numOrcamentos = orcamentos.size();
         int totalCols = 6 + (numOrcamentos * 2) + 2;

         // --- BLOCO 1: CABECALHO DA OBRA ---
         QuadroMetaDadosDto meta = comparativo.getMetadados();

         String nomeObra = (meta != null && meta.nomeObra() != null) ? meta.nomeObra() : "OBRA NÃO INFORMADA";
         String numeroQuadro = (meta != null && meta.numeroQuadro() != null) ? meta.numeroQuadro() : "QC-001";
         String nomeCliente = (meta != null && meta.nomeCliente() != null) ? meta.nomeCliente() : "";
         String cnpjCliente = (meta != null && meta.cnpjCliente() != null) ? " - CNPJ: " + meta.cnpjCliente() : "";
         String clienteCnpjFormatado = nomeCliente + cnpjCliente;
         String dataFormatada = (meta != null && meta.dataElaboracao() != null)
                 ? meta.dataElaboracao().format(DateTimeFormatter.ofPattern("dd/MM/yy"))
                 : LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yy"));

         createHeaderLabel(sheet, 0, 0, "Data", headerTealStyle);
         createHeaderLabel(sheet, 0, 1, dataFormatada, centerBoldStyle);
         createMergedHeader(sheet, 0, 0, 2, 3, nomeObra, centerBoldStyle);

         createHeaderLabel(sheet, 1, 0, "Nº Quadro", headerTealStyle);
         createHeaderLabel(sheet, 1, 1, numeroQuadro, centerBoldStyle);
         createMergedHeader(sheet, 1, 1, 2, 3, clienteCnpjFormatado, centerBoldStyle);

         createMergedHeader(sheet, 2, 6, 0, 3, "QUADRO DE CONCORRÊNCIA - MATERIAIS DA OBRA", titleStyle);

         // --- BLOCO 2: DADOS DOS FORNECEDORES ---
         createHeaderLabel(sheet, 0, 4, "DADOS", headerTealStyle);
         sheet.addMergedRegion(new CellRangeAddress(0, 0, 4, 5));
         getOrCreateCell(getOrCreateRow(sheet, 0), 5).setCellStyle(headerTealStyle);

         String[] labelsDados = {"Nome", "Contato", "Telefone", "Celular", "Local/Cidade", "E-mail"};
         for (int i = 0; i < labelsDados.length; i++) {
            setMergedValue(sheet, i + 1, 4, 5, labelsDados[i], centerBoldStyle);
         }

         int colFornec = 6;
         for (int idx = 0; idx < numOrcamentos; idx++) {
            QuadroConcorrenciaDto orc = orcamentos.get(idx);
            int colInicio = colFornec;
            int colFim = colFornec + 1;

            String nomeFornecedor = (orc != null && orc.getNomeFornecedor() != null) ? orc.getNomeFornecedor() : "";
            String nomeContato = (orc != null && orc.getNomeContato() != null) ? orc.getNomeContato() : "";
            String telefoneContato = (orc != null && orc.getTelefoneContato() != null) ? orc.getTelefoneContato() : "";
            String celularContato = (orc != null && orc.getCelularContato() != null) ? orc.getCelularContato() : "";
            String localCidade = (orc != null && orc.getLocalCidade() != null) ? orc.getLocalCidade() : "";
            String emailContato = (orc != null && orc.getEmailContato() != null) ? orc.getEmailContato() : "";

            createMergedHeader(sheet, 0, 0, colInicio, colFim, String.valueOf(idx + 1), headerTealStyle);

            setMergedValue(sheet, 1, colInicio, colFim, nomeFornecedor, mergedBoldStyle);
            setMergedValue(sheet, 2, colInicio, colFim, nomeContato, mergedNormalStyle);
            setMergedValue(sheet, 3, colInicio, colFim, telefoneContato, mergedNormalStyle);
            setMergedValue(sheet, 4, colInicio, colFim, celularContato, mergedNormalStyle);
            setMergedValue(sheet, 5, colInicio, colFim, localCidade, mergedNormalStyle);
            setMergedValue(sheet, 6, colInicio, colFim, emailContato, mergedNormalStyle);

            colFornec += 2;
         }

         // BLOCO 3: MELHOR VALOR
         int colMelhorVal = colFornec;
         createMergedHeader(sheet, 0, 6, colMelhorVal, colMelhorVal + 1, "MELHOR VALOR", headerTealStyle);

         // --- LINHA 7: CABEÇALHOS DA TABELA PRINCIPAL ---
         Row rowH7 = getOrCreateRow(sheet, 7);
         createCellWithStyle(rowH7, 0, "Item", headerTealStyle);
         createCellWithStyle(rowH7, 1, "Centro de custo MEGA", headerTealStyle);
         createCellWithStyle(rowH7, 2, "Centro de custo INC", headerTealStyle);
         createCellWithStyle(rowH7, 3, "Descrição", headerTealStyle);
         createCellWithStyle(rowH7, 4, "Unidade", headerTealStyle);
         createCellWithStyle(rowH7, 5, "QTD", headerTealStyle);

         colFornec = 6;
         for (int idx = 0; idx < numOrcamentos; idx++) {
            createCellWithStyle(rowH7, colFornec++, "Preço Unitário", headerTealStyle);
            createCellWithStyle(rowH7, colFornec++, "Total", headerTealStyle);
         }

         createCellWithStyle(rowH7, colFornec++, "MELHOR VALOR UNITÁRIO (R$)", headerTealStyle);
         createCellWithStyle(rowH7, colFornec++, "MELHOR VALOR TOTAL (R$)", headerTealStyle);

         // --- LINHA 8: LINHA DE ESCOPO ---
         Row rowH8 = getOrCreateRow(sheet, 8);
         createCellWithStyle(rowH8, 0, "1 - ESCOPO 1", scopeGrayStyle);
         createCellWithStyle(rowH8, 3, "DESCRIÇÃO DOS ITENS A SEREM CONTRATADOS", scopeGrayStyle);

         for (int c = 0; c < totalCols; c++) {
            Cell cell = getOrCreateCell(rowH8, c);
            cell.setCellStyle(scopeGrayStyle);
         }

         colFornec = 6;
         for (QuadroConcorrenciaDto orc : orcamentos) {
            getOrCreateCell(rowH8, colFornec++).setCellStyle(currencyScopeStyle);
            Cell cTotScope = getOrCreateCell(rowH8, colFornec++);
            cTotScope.setCellStyle(currencyScopeStyle);
            if (orc != null && orc.getValorTotalGeral() != null) {
               cTotScope.setCellValue(orc.getValorTotalGeral().doubleValue());
            }
         }

         // --- UNIÃO DE TODOS OS ITENS ÚNICOS DE TODAS AS PROPOSTAS ---
         List<ItemQuadroDTO> itensConsolidados = new ArrayList<>();
         for (QuadroConcorrenciaDto orc : orcamentos) {
            if (orc != null && orc.getItens() != null) {
               for (ItemQuadroDTO item : orc.getItens()) {
                  boolean jaExiste = itensConsolidados.stream()
                          .anyMatch(base -> saoItensEquivalentes(base.descricao(), item.descricao()));
                  if (!jaExiste) {
                     itensConsolidados.add(item);
                  }
               }
            }
         }

         int currentRow = 9;
         int itemSeq = 1;
         BigDecimal acumuladoMelhorTotal = BigDecimal.ZERO;

         for (ItemQuadroDTO itemBase : itensConsolidados) {
            Row row = getOrCreateRow(sheet, currentRow);

            for (int c = 0; c < totalCols; c++) {
               Cell cell = getOrCreateCell(row, c);
               if (cell.getCellStyle() == null || cell.getCellStyle().getIndex() == 0) {
                  cell.setCellStyle(styleBase);
               }
            }

            getOrCreateCell(row, 0).setCellValue(itemSeq++);
            getOrCreateCell(row, 0).setCellStyle(centerBoldStyle);

            getOrCreateCell(row, 1).setCellStyle(styleBase);
            getOrCreateCell(row, 2).setCellStyle(styleBase);

            getOrCreateCell(row, 3).setCellValue(itemBase.descricao());
            getOrCreateCell(row, 3).setCellStyle(styleBase);

            getOrCreateCell(row, 4).setCellValue(itemBase.unidadeMedida() != null ? itemBase.unidadeMedida() : "PÇ");
            getOrCreateCell(row, 4).setCellStyle(centerBoldStyle);

            getOrCreateCell(row, 5).setCellValue(itemBase.quantidade() != null ? itemBase.quantidade().doubleValue() : 0.0);
            getOrCreateCell(row, 5).setCellStyle(centerBoldStyle);

            colFornec = 6;
            BigDecimal melhorUnitario = null;
            BigDecimal melhorTotal = null;

            for (QuadroConcorrenciaDto orc : orcamentos) {
               Cell cellUnit = getOrCreateCell(row, colFornec++);
               Cell cellTot = getOrCreateCell(row, colFornec++);

               Optional<ItemQuadroDTO> match = (orc != null && orc.getItens() != null)
                       ? orc.getItens().stream()
                       .filter(i -> saoItensEquivalentes(i.descricao(), itemBase.descricao()))
                       .findFirst()
                       : Optional.empty();

               if (match.isPresent()) {
                  BigDecimal vu = match.get().valorUnitario();
                  BigDecimal vt = match.get().valorTotal();

                  if (vu != null && vu.compareTo(BigDecimal.ZERO) > 0) {
                     cellUnit.setCellValue(vu.doubleValue());
                     cellUnit.setCellStyle(currencyStyle);
                     if (melhorUnitario == null || vu.compareTo(melhorUnitario) < 0) {
                        melhorUnitario = vu;
                     }
                  } else {
                     cellUnit.setCellValue("-");
                     cellUnit.setCellStyle(styleBase);
                  }

                  if (vt != null && vt.compareTo(BigDecimal.ZERO) > 0) {
                     cellTot.setCellValue(vt.doubleValue());
                     cellTot.setCellStyle(currencyStyle);
                     if (melhorTotal == null || vt.compareTo(melhorTotal) < 0) {
                        melhorTotal = vt;
                     }
                  } else {
                     cellTot.setCellValue("-");
                     cellTot.setCellStyle(styleBase);
                  }
               } else {
                  cellUnit.setCellValue("-");
                  cellUnit.setCellStyle(styleBase);
                  cellTot.setCellValue("-");
                  cellTot.setCellStyle(styleBase);
               }
            }

            Cell cBestU = getOrCreateCell(row, colFornec++);
            cBestU.setCellStyle(currencyStyle);
            if (melhorUnitario != null) {
               cBestU.setCellValue(melhorUnitario.doubleValue());
            } else {
               cBestU.setCellValue("-");
            }

            Cell cBestT = getOrCreateCell(row, colFornec++);
            cBestT.setCellStyle(currencyStyle);
            if (melhorTotal != null) {
               cBestT.setCellValue(melhorTotal.doubleValue());
               acumuladoMelhorTotal = acumuladoMelhorTotal.add(melhorTotal);
            } else {
               cBestT.setCellValue("-");
            }

            currentRow++;
         }

         // --- RODAPÉ: TOTAL GERAL ---
         Row rowTotal = getOrCreateRow(sheet, currentRow);
         for (int c = 0; c < totalCols; c++) {
            getOrCreateCell(rowTotal, c).setCellStyle(styleBase);
         }

         Cell cObs = getOrCreateCell(rowTotal, 3);
         cObs.setCellValue("TOTAL GERAL");
         cObs.setCellStyle(headerTealStyle);

         colFornec = 6;
         for (QuadroConcorrenciaDto orc : orcamentos) {
            getOrCreateCell(rowTotal, colFornec++).setCellStyle(currencyBoldStyle);
            Cell cTotGen = getOrCreateCell(rowTotal, colFornec++);
            cTotGen.setCellStyle(currencyBoldStyle);
            if (orc != null && orc.getValorTotalGeral() != null) {
               cTotGen.setCellValue(orc.getValorTotalGeral().doubleValue());
            }
         }

         // Melhor valor total consolidado no rodapé
         getOrCreateCell(rowTotal, colFornec++).setCellStyle(currencyBoldStyle);
         Cell cMelhorTotGen = getOrCreateCell(rowTotal, colFornec++);
         cMelhorTotGen.setCellStyle(currencyBoldStyle);
         cMelhorTotGen.setCellValue(acumuladoMelhorTotal.doubleValue());

         for (int i = 0; i < totalCols; i++) {
            sheet.autoSizeColumn(i);
            sheet.setColumnWidth(i, Math.max(sheet.getColumnWidth(i), 3000));
         }
         sheet.setColumnWidth(3, 12000);

         workbook.write(out);

      } catch (IOException e) {
         throw new RuntimeException("Erro ao gerar arquivo Excel do quadro comparativo", e);
      }

      return new ByteArrayInputStream(out.toByteArray());
   }

   // --- MÉTODOS DE CORRESPONDÊNCIA INTELIGENTE DE ITENS ---

   public boolean saoItensEquivalentes(String descA, String descB) {
      if (descA == null || descB == null) return false;

      // 0. Base de Conhecimento De-Para (Item Canônico em Comum)
      if (conciliacaoService != null) {
         try {
            var sugA = conciliacaoService.resolverConciliacao(descA, null, null, null, null, null, null);
            var sugB = conciliacaoService.resolverConciliacao(descB, null, null, null, null, null, null);
            if (sugA != null && sugB != null && sugA.itemCanonicoSugeridoId() != null &&
                    sugA.itemCanonicoSugeridoId().equals(sugB.itemCanonicoSugeridoId())) {
               return true;
            }
         } catch (Exception ignored) {}
      }

      String normA = normalizarParaComparacao(descA);
      String normB = normalizarParaComparacao(descB);

      // 1. Igualdade estrita pós-normalização
      if (normA.equals(normB)) return true;

      // 2. Extração de tokens
      String[] tokensA = normA.split("\\s+");
      String[] tokensB = normB.split("\\s+");

      // 3. Comparação de especificações numéricas e medidas (ex: 2-1/2 vs 2 1/2)
      List<String> numsA = Arrays.stream(tokensA).filter(t -> t.matches(".*\\d.*")).toList();
      List<String> numsB = Arrays.stream(tokensB).filter(t -> t.matches(".*\\d.*")).toList();

      if (!numsA.isEmpty() && !numsB.isEmpty()) {
         boolean temNumeroComum = numsA.stream().anyMatch(numsB::contains);
         if (!temNumeroComum) {
            return false; // Medidas numéricas diferentes -> produtos diferentes
         }
      }

      // 4. Sobreposição de termos principais (mínimo 70% de similaridade)
      List<String> listB = Arrays.asList(tokensB);
      long comuns = Arrays.stream(tokensA).filter(listB::contains).count();
      int minLen = Math.min(tokensA.length, tokensB.length);

      return minLen > 0 && ((double) comuns / minLen >= 0.7);
   }

   private String normalizarParaComparacao(String texto) {
      if (texto == null) return "";
      String semAcento = Normalizer.normalize(texto, Normalizer.Form.NFD)
              .replaceAll("\\p{M}", "");
      return semAcento.toLowerCase()
              .replaceAll("c/", "com ")
              .replaceAll("p/", "para ")
              .replaceAll("s/", "sem ")
              .replaceAll("[-_.,/\"']", " ")
              .replaceAll("\\s+", " ")
              .trim();
   }

   // --- MÉTODOS AUXILIARES POI ---
   private Row getOrCreateRow(Sheet sheet, int rowIdx) {
      Row row = sheet.getRow(rowIdx);
      return (row == null) ? sheet.createRow(rowIdx) : row;
   }

   private Cell getOrCreateCell(Row row, int colIdx) {
      Cell cell = row.getCell(colIdx);
      return (cell == null) ? row.createCell(colIdx) : cell;
   }

   private void createCellWithStyle(Row row, int colIdx, String text, CellStyle style) {
      Cell cell = getOrCreateCell(row, colIdx);
      cell.setCellValue(text);
      cell.setCellStyle(style);
   }

   private void setBorders(CellStyle style) {
      style.setBorderTop(BorderStyle.THIN);
      style.setBorderBottom(BorderStyle.THIN);
      style.setBorderLeft(BorderStyle.THIN);
      style.setBorderRight(BorderStyle.THIN);
   }

   private void createHeaderLabel(Sheet sheet, int rowIdx, int colIdx, String text, CellStyle style) {
      Row row = getOrCreateRow(sheet, rowIdx);
      Cell cell = getOrCreateCell(row, colIdx);
      cell.setCellValue(text);
      cell.setCellStyle(style);
   }

   private void createMergedHeader(Sheet sheet, int rowStart, int rowEnd, int colStart, int colEnd, String value, CellStyle style) {
      for (int r = rowStart; r <= rowEnd; r++) {
         Row row = getOrCreateRow(sheet, r);
         for (int c = colStart; c <= colEnd; c++) {
            Cell cell = getOrCreateCell(row, c);
            cell.setCellStyle(style);
         }
      }
      getOrCreateCell(sheet.getRow(rowStart), colStart).setCellValue(value);
      sheet.addMergedRegion(new CellRangeAddress(rowStart, rowEnd, colStart, colEnd));
   }

   private void setMergedValue(Sheet sheet, int rowIdx, int colStart, int colEnd, String value, CellStyle style) {
      Row row = getOrCreateRow(sheet, rowIdx);

      for (int c = colStart; c <= colEnd; c++) {
         Cell cell = getOrCreateCell(row, c);
         cell.setCellStyle(style);
      }
      getOrCreateCell(row, colStart).setCellValue(value);
      sheet.addMergedRegion(new CellRangeAddress(rowIdx, rowIdx, colStart, colEnd));
   }
}