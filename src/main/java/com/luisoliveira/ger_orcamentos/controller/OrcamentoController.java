package com.luisoliveira.ger_orcamentos.controller;

import com.luisoliveira.ger_orcamentos.dto.ConflitoQcDto;
import com.luisoliveira.ger_orcamentos.dto.ItemVariacaoDto;
import com.luisoliveira.ger_orcamentos.dto.QuadroComparativoDto;
import com.luisoliveira.ger_orcamentos.dto.QuadroConcorrenciaDto;
import com.luisoliveira.ger_orcamentos.model.Orcamento;
import com.luisoliveira.ger_orcamentos.repositories.OrcamentoRepository;
import com.luisoliveira.ger_orcamentos.service.AnalisePrecoService;
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

    @Autowired
    private OrcamentoRepository orcamentoRepository;

    @Autowired
    private AnalisePrecoService analisePrecoService;

    // --- ROTAS DE PROCESSAMENTO E IA ---

    @PostMapping("/upload")
    public ResponseEntity<?> uploadOrcamento(
            @RequestParam("obraId") Long obraId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "forceNew", defaultValue = "false") boolean forceNew,
            @RequestParam(value = "numeroQc", required = false) String numeroQc) {

        Object resultado = orcamentoService.processarMultiplosComObra(obraId, files, forceNew, numeroQc);
        return ResponseEntity.ok(resultado);
    }

    @PostMapping("/comparativo-excel")
    public ResponseEntity<?> gerarComparativoExcel(
            @RequestParam("obraId") Long obraId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "forceNew", defaultValue = "false") boolean forceNew,
            @RequestParam(value = "numeroQc", required = false) String numeroQc) {

        Object resultado = orcamentoService.processarMultiplosComObra(obraId, files, forceNew, numeroQc);
        if (resultado instanceof ConflitoQcDto conflito) {
            return ResponseEntity.ok(conflito);
        }

        QuadroComparativoDto comparativoDto = (QuadroComparativoDto) resultado;
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
    public ResponseEntity<List<ItemVariacaoDto>> analisarVariacoesPreco(@RequestParam("file") MultipartFile file) {
        List<ItemVariacaoDto> variacoes = analisePrecoService.analisarVariacoesPreco(file);
        return ResponseEntity.ok(variacoes);
    }

    // --- CRUD ORÇAMENTOS ---

    @GetMapping
    public ResponseEntity<List<Orcamento>> listarOrcamentos() {
        return ResponseEntity.ok(orcamentoRepository.findAll());
    }

    @GetMapping("/obra/{obraId}")
    public ResponseEntity<List<Orcamento>> listarPorObra(@PathVariable Long obraId) {
        return ResponseEntity.ok(orcamentoRepository.findByQcObraId(obraId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Orcamento> buscarPorId(@PathVariable Long id) {
        return orcamentoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarOrcamento(@PathVariable Long id) {
        if (orcamentoRepository.existsById(id)) {
            orcamentoRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
