package com.luisoliveira.ger_orcamentos.controller;




import com.luisoliveira.ger_orcamentos.service.ExcelExportService;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.ui.Model;
import com.luisoliveira.ger_orcamentos.dto.ItemVariacaoDto;
import com.luisoliveira.ger_orcamentos.dto.QuadroComparativoDto;
import com.luisoliveira.ger_orcamentos.dto.QuadroConcorrenciaDto;
import com.luisoliveira.ger_orcamentos.service.OrcamentoService;
import org.springframework.beans.factory.annotation.Autowired;
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
            @RequestParam("file") List<MultipartFile> files) {
        if (files.size() == 1) {
            QuadroConcorrenciaDto resultado = orcamentoService.processarUploadOrcamento(files.get(0));
            return ResponseEntity.ok(resultado);
        } else {
            QuadroComparativoDto comparativoDto = orcamentoService.processarMultiplos(files);
            return ResponseEntity.ok(comparativoDto);
        }
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
            // Processa o PDF com o Gemini e faz o comparativo com a base de dados
            List<ItemVariacaoDto> resultado = orcamentoService.analisarVariacoesPreco(file);

            // Retorna 200 OK com o JSON contendo todos os dados da análise
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

}