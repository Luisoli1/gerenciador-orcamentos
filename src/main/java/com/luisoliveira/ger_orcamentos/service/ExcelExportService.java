package com.luisoliveira.ger_orcamentos.service;

import com.luisoliveira.ger_orcamentos.dto.ItemQuadroDTO;
import com.luisoliveira.ger_orcamentos.dto.QuadroComparativoDto;
import com.luisoliveira.ger_orcamentos.dto.QuadroConcorrenciaDto;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class ExcelExportService {

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

         // --- BORDAS PADRÃO ---
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

         List<QuadroConcorrenciaDto> orcamentos = comparativo.getOrcamentos();
         int numOrcamentos = orcamentos != null ? orcamentos.size() : 0;

         int totalCols = 6 + (numOrcamentos * 2) + 2;

         for (int i = 0; i <= 25; i++) {
            Row r = sheet.createRow(i);
            for (int c = 0; c < totalCols; c++) {
               Cell cell = r.createCell(c);
               cell.setCellStyle(styleBase);
            }
         }

         // --- BLOCO 1: CABEÇALHO DA OBRA ---
         createHeaderLabel(sheet, 0, 0, "Data", headerTealStyle);
         createHeaderLabel(sheet, 0, 1, LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yy")), centerBoldStyle);
         createHeaderLabel(sheet, 0, 2, "CASA ALTO DE PINHEIROS", centerBoldStyle);
         sheet.addMergedRegion(new CellRangeAddress(0, 0, 2, 3));

         createHeaderLabel(sheet, 1, 0, "Nº Quadro", headerTealStyle);
         createHeaderLabel(sheet, 1, 1, "QC- 017", centerBoldStyle);
         createHeaderLabel(sheet, 1, 2, "EVEN DIÓGENES - CNPJ: 18.247.215/0001-77", centerBoldStyle);
         sheet.addMergedRegion(new CellRangeAddress(1, 1, 2, 3));

         createHeaderLabel(sheet, 2, 0, "QUADRO DE CONCORRÊNCIA - MATERIAIS DA OBRA", titleStyle);
         sheet.addMergedRegion(new CellRangeAddress(2, 6, 0, 3));

         // --- BLOCO 2: DADOS DOS FORNECEDORES ---
         createHeaderLabel(sheet, 0, 4, "DADOS", headerTealStyle);
         sheet.addMergedRegion(new CellRangeAddress(0, 0, 4, 5));

         String[] labelsDados = {"Nome", "Contato", "Telefone", "Celular", "Local/Cidade", "E-mail"};
         for (int i = 0; i < labelsDados.length; i++) {
            createHeaderLabel(sheet, i + 1, 4, labelsDados[i], centerBoldStyle);
            sheet.addMergedRegion(new CellRangeAddress(i + 1, i + 1, 4, 5));
         }

         int colFornec = 6;
         for (int idx = 0; idx < numOrcamentos; idx++) {
            QuadroConcorrenciaDto orc = orcamentos.get(idx);
            int colInicio = colFornec;
            int colFim = colFornec + 1;

            createHeaderLabel(sheet, 0, colInicio, String.valueOf(idx + 1), headerTealStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, colInicio, colFim));

            setMergedValue(sheet, workbook, 1, colInicio, colFim, orc.getNomeFornecedor() != null ? orc.getNomeFornecedor() : "", fontBlackBold);
            setMergedValue(sheet, workbook, 2, colInicio, colFim, "-", fontNormal);
            setMergedValue(sheet, workbook, 3, colInicio, colFim, "-", fontNormal);
            setMergedValue(sheet, workbook, 4, colInicio, colFim, "-", fontNormal);
            setMergedValue(sheet, workbook, 5, colInicio, colFim, "SÃO PAULO / SP", fontNormal);
            setMergedValue(sheet, workbook, 6, colInicio, colFim, "-", fontNormal);

            colFornec += 2;
         }

         // BLOCO 3: MELHOR VALOR
         int colMelhorVal = colFornec;
         createHeaderLabel(sheet, 0, colMelhorVal, "MELHOR VALOR", headerTealStyle);
         sheet.addMergedRegion(new CellRangeAddress(0, 6, colMelhorVal, colMelhorVal + 1));

         // --- LINHA 7: CABEÇALHOS DA TABELA PRINCIPAL ---
         Row rowH7 = sheet.getRow(7);
         rowH7.getCell(0).setCellValue("Item");
         rowH7.getCell(0).setCellStyle(headerTealStyle);

         rowH7.getCell(1).setCellValue("Centro de custo MEGA");
         rowH7.getCell(1).setCellStyle(headerTealStyle);

         rowH7.getCell(2).setCellValue("Centro de custo INC");
         rowH7.getCell(2).setCellStyle(headerTealStyle);

         rowH7.getCell(3).setCellValue("Descrição");
         rowH7.getCell(3).setCellStyle(headerTealStyle);

         rowH7.getCell(4).setCellValue("Unidade");
         rowH7.getCell(4).setCellStyle(headerTealStyle);

         rowH7.getCell(5).setCellValue("QTD");
         rowH7.getCell(5).setCellStyle(headerTealStyle);

         colFornec = 6;
         for (int idx = 0; idx < numOrcamentos; idx++) {
            Cell cUnit = rowH7.getCell(colFornec++);
            cUnit.setCellValue("Preço Unitário");
            cUnit.setCellStyle(headerTealStyle);

            Cell cTot = rowH7.getCell(colFornec++);
            cTot.setCellValue("Total");
            cTot.setCellStyle(headerTealStyle);
         }

         Cell cBestUnit = rowH7.getCell(colFornec++);
         cBestUnit.setCellValue("MELHOR VALOR UNITÁRIO (R$)");
         cBestUnit.setCellStyle(headerTealStyle);

         Cell cBestTot = rowH7.getCell(colFornec++);
         cBestTot.setCellValue("MELHOR VALOR TOTAL (R$)");
         cBestTot.setCellStyle(headerTealStyle);

         // --- LINHA 8: LINHA DE ESCOPO ---
         Row rowH8 = sheet.getRow(8);
         rowH8.getCell(0).setCellValue("1 - ESCOPO 1");
         rowH8.getCell(0).setCellStyle(scopeGrayStyle);

         rowH8.getCell(3).setCellValue("DESCRIÇÃO DOS ITENS A SEREM CONTRATADOS");
         rowH8.getCell(3).setCellStyle(scopeGrayStyle);

         for (int c = 1; c < totalCols; c++) {
            if (rowH8.getCell(c).getCellStyle() == styleBase) {
               rowH8.getCell(c).setCellStyle(scopeGrayStyle);
            }
         }

         colFornec = 6;
         for (QuadroConcorrenciaDto orc : orcamentos) {
            rowH8.getCell(colFornec++).setCellStyle(currencyScopeStyle);
            Cell cTotScope = rowH8.getCell(colFornec++);
            cTotScope.setCellStyle(currencyScopeStyle);
            if (orc.getValorTotalGeral() != null) {
               cTotScope.setCellValue(orc.getValorTotalGeral().doubleValue());
            }
         }

         // --- CORPO DA TABELA ---
         List<ItemQuadroDTO> itensBase = orcamentos.get(0).getItens();
         int currentRow = 9;
         int itemSeq = 1;

         for (ItemQuadroDTO itemBase : itensBase) {
            Row row = sheet.getRow(currentRow);
            if (row == null) {
               row = sheet.createRow(currentRow);
            }

            for (int c = 0; c < totalCols; c++) {
               if (row.getCell(c) == null) {
                  row.createCell(c).setCellStyle(styleBase);
               }
            }

            Cell c0 = row.getCell(0);
            c0.setCellValue(itemSeq++);
            c0.setCellStyle(centerBoldStyle);

            row.getCell(1).setCellStyle(styleBase);
            row.getCell(2).setCellStyle(styleBase);

            Cell c3 = row.getCell(3);
            c3.setCellValue(itemBase.descricao());
            c3.setCellStyle(styleBase);

            Cell c4 = row.getCell(4);
            c4.setCellValue(itemBase.unidadeMedida() != null ? itemBase.unidadeMedida() : "PÇ");
            c4.setCellStyle(centerBoldStyle);

            Cell c5 = row.getCell(5);
            c5.setCellValue(itemBase.quantidade() != null ? itemBase.quantidade().doubleValue() : 0.0);
            c5.setCellStyle(centerBoldStyle);

            colFornec = 6;
            BigDecimal melhorUnitario = null;
            BigDecimal melhorTotal = null;

            for (QuadroConcorrenciaDto orc : orcamentos) {
               Optional<ItemQuadroDTO> match = orc.getItens().stream()
                       .filter(i -> normalizar(i.descricao()).equals(normalizar(itemBase.descricao())))
                       .findFirst();

               Cell cellUnit = row.getCell(colFornec++);
               Cell cellTot = row.getCell(colFornec++);

               if (match.isPresent()) {
                  BigDecimal vu = match.get().valorUnitario();
                  BigDecimal vt = match.get().valorTotal();

                  if (vu != null) {
                     cellUnit.setCellValue(vu.doubleValue());
                     cellUnit.setCellStyle(currencyStyle);
                     if (melhorUnitario == null || vu.compareTo(melhorUnitario) < 0) {
                        melhorUnitario = vu;
                     }
                  } else {
                     cellUnit.setCellValue("-");
                  }

                  if (vt != null) {
                     cellTot.setCellValue(vt.doubleValue());
                     cellTot.setCellStyle(currencyStyle);
                     if (melhorTotal == null || vt.compareTo(melhorTotal) < 0) {
                        melhorTotal = vt;
                     }
                  } else {
                     cellTot.setCellValue("-");
                  }
               } else {
                  cellUnit.setCellValue("-");
                  cellTot.setCellValue("-");
               }
            }

            Cell cBestU = row.getCell(colFornec++);
            cBestU.setCellStyle(currencyStyle);
            if (melhorUnitario != null) {
               cBestU.setCellValue(melhorUnitario.doubleValue());
            }

            Cell cBestT = row.getCell(colFornec++);
            cBestT.setCellStyle(currencyStyle);
            if (melhorTotal != null) {
               cBestT.setCellValue(melhorTotal.doubleValue());
            }

            currentRow++;
         }

         // --- RODAPÉ: TOTAL GERAL ---
         Row rowTotal = sheet.createRow(currentRow);
         for (int c = 0; c < totalCols; c++) {
            rowTotal.createCell(c).setCellStyle(styleBase);
         }

         Cell cObs = rowTotal.getCell(3);
         cObs.setCellValue("TOTAL");
         cObs.setCellStyle(headerTealStyle);

         colFornec = 6;
         for (QuadroConcorrenciaDto orc : orcamentos) {
            rowTotal.getCell(colFornec++).setCellStyle(currencyBoldStyle);
            Cell cTotGen = rowTotal.getCell(colFornec++);
            cTotGen.setCellStyle(currencyBoldStyle);
            if (orc.getValorTotalGeral() != null) {
               cTotGen.setCellValue(orc.getValorTotalGeral().doubleValue());
            }
         }

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

   // --- MÉTODOS AUXILIARES DENTRO DA CLASSE ---
   private void setBorders(CellStyle style) {
      style.setBorderTop(BorderStyle.THIN);
      style.setBorderBottom(BorderStyle.THIN);
      style.setBorderLeft(BorderStyle.THIN);
      style.setBorderRight(BorderStyle.THIN);
   }

   private void createHeaderLabel(Sheet sheet, int rowIdx, int colIdx, String text, CellStyle style) {
      Row row = sheet.getRow(rowIdx);
      if (row == null) row = sheet.createRow(rowIdx);
      Cell cell = row.getCell(colIdx);
      if (cell == null) cell = row.createCell(colIdx);
      cell.setCellValue(text);
      cell.setCellStyle(style);
   }

   private void setMergedValue(Sheet sheet, Workbook workbook, int rowIdx, int colStart, int colEnd, String value, Font font) {
      Row row = sheet.getRow(rowIdx);
      if (row == null) row = sheet.createRow(rowIdx);

      CellStyle style = workbook.createCellStyle();
      setBorders(style);
      style.setAlignment(HorizontalAlignment.CENTER);
      style.setVerticalAlignment(VerticalAlignment.CENTER);
      style.setFont(font);

      for (int c = colStart; c <= colEnd; c++) {
         Cell cell = row.getCell(c);
         if (cell == null) cell = row.createCell(c);
         cell.setCellStyle(style);
      }
      row.getCell(colStart).setCellValue(value);
      sheet.addMergedRegion(new CellRangeAddress(rowIdx, rowIdx, colStart, colEnd));
   }

   private String normalizar(String texto) {
      if (texto == null) return "";
      return texto.trim().toLowerCase().replaceAll("\\s+", " ");
   }
}