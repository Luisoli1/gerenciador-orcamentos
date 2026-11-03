package com.luisoliveira.ger_orcamentos.controller;

import com.luisoliveira.ger_orcamentos.model.FaturamentoDireto;
import com.luisoliveira.ger_orcamentos.service.FaturamentoDiretoService;
import com.luisoliveira.ger_orcamentos.service.AuditoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayInputStream;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/faturamento-direto")
public class FaturamentoDiretoController {

    @Autowired
    private FaturamentoDiretoService faturamentoDiretoService;

    @Autowired
    private AuditoriaService auditoriaService;

    @GetMapping
    public ResponseEntity<List<FaturamentoDireto>> listar(
            @RequestParam(value = "obraId", required = false) Long obraId) {
        if (obraId != null) {
            return ResponseEntity.ok(faturamentoDiretoService.listarPorObra(obraId));
        }
        return ResponseEntity.ok(faturamentoDiretoService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FaturamentoDireto> buscarPorId(@PathVariable Long id) {
        return faturamentoDiretoService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    public record GerarFdRequest(
            Long qcId,
            String fornecedorNome,
            String numeroControle,
            FaturamentoDireto dadosComplementares
    ) {}

    @PostMapping("/gerar-de-qc")
    public ResponseEntity<FaturamentoDireto> gerarDeQc(@RequestBody GerarFdRequest req) {
        FaturamentoDireto fd = faturamentoDiretoService.criarAPartirDeQc(
                req.qcId(),
                req.fornecedorNome(),
                req.numeroControle(),
                req.dadosComplementares()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(fd);
    }

    @PostMapping
    public ResponseEntity<FaturamentoDireto> salvar(@RequestBody FaturamentoDireto fd) {
        FaturamentoDireto salvo = faturamentoDiretoService.salvar(fd);
        auditoriaService.registrar("CRIACAO", "FATURAMENTO_DIRETO", salvo.getId().toString(), "Gerou FD " + salvo.getNumeroControle() + " para fornecedor " + salvo.getFornecedorNome() + " (Total: R$ " + salvo.getValorTotalGeral() + ")");
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FaturamentoDireto> atualizar(
            @PathVariable Long id,
            @RequestBody FaturamentoDireto fd) {
        return faturamentoDiretoService.atualizar(id, fd)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (faturamentoDiretoService.deletar(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/excel")
    public ResponseEntity<InputStreamResource> baixarExcel(@PathVariable Long id) {
        ByteArrayInputStream in = faturamentoDiretoService.gerarExcelFaturamentoDireto(id);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=Faturamento_Direto_" + id + ".xlsx");

        return ResponseEntity
                .ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new InputStreamResource(in));
    }
}
