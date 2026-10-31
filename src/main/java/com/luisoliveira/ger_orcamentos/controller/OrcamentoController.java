package com.luisoliveira.ger_orcamentos.controller;

import com.luisoliveira.ger_orcamentos.dto.ItemVariacaoDto;
import com.luisoliveira.ger_orcamentos.dto.QuadroComparativoDto;
import com.luisoliveira.ger_orcamentos.dto.QuadroConcorrenciaDto;
import com.luisoliveira.ger_orcamentos.service.ExcelExportService;
import com.luisoliveira.ger_orcamentos.service.OrcamentoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.util.List;

@RestController
@RequestMapping("/api/orcamentos")
public class OrcamentoController {

    @Autowired
    private OrcamentoService orcamentoService;

    @Autowired
    private ExcelExportService excelExportService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadOrcamento(
            @RequestParam("obraId") Long obraId, // Tornamos obrigatório para associar ao QC
            @RequestParam("files") List<MultipartFile> files) {

        if (files.size() == 1) {
            QuadroConcorrenciaDto resultado = orcamentoService.processarUploadOrcamento(files.get(0));
            return ResponseEntity.ok(resultado);
        } else {
            // Chamamos o método correto que processa com base na obra e gera o QC sequencial
            QuadroComparativoDto comparativoDto = orcamentoService.processarMultiplosComObra(obraId, files);
            return ResponseEntity.ok(comparativoDto);
        }
    }

    @PostMapping("/comparativo-excel")
    public ResponseEntity<InputStreamResource> gerarComparativoExcel(
            @RequestParam("obraId") Long obraId,
            @RequestParam("files") List<MultipartFile> files) {

        // 1. Processa os arquivos vinculando à Obra e incrementando o QC
        QuadroComparativoDto comparativoDto = orcamentoService.processarMultiplosComObra(obraId, files);

        // 2. Gera o fluxo de bytes da planilha Excel
        ByteArrayInputStream in = excelExportService.gerarQuadroComparativoExcel(comparativoDto);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=quadro_concorrencia.xlsx");

        return ResponseEntity
                .ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new InputStreamResource(in));
    }

    @PostMapping("/exportar-excel")
    public ResponseEntity<InputStreamResource> exportarExcel(@RequestBody QuadroComparativoDto comparativoDto) {
        ByteArrayInputStream in = excelExportService.gerarQuadroComparativoExcel(comparativoDto);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=quadro_concorrencia.xlsx");

        return ResponseEntity
                .ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new InputStreamResource(in));
    }

    @PostMapping("/analisar")
    public ResponseEntity<List<ItemVariacaoDto>> analisarOrcamento(@RequestParam("file") MultipartFile file) {
        try {
            List<ItemVariacaoDto> resultado = orcamentoService.analisarVariacoesPreco(file);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}