package com.luisoliveira.ger_orcamentos.controller;

import com.luisoliveira.ger_orcamentos.dto.QuadroComparativoDto;
import com.luisoliveira.ger_orcamentos.dto.GerarQcVencedorRequestDto;
import com.luisoliveira.ger_orcamentos.dto.RestaurarItemDto;
import com.luisoliveira.ger_orcamentos.model.Qc;
import com.luisoliveira.ger_orcamentos.service.QcService;
import com.luisoliveira.ger_orcamentos.service.AuditoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/qc")
public class QcController {

    @Autowired
    private QcService qcService;

    @Autowired
    private AuditoriaService auditoriaService;

    @GetMapping
    public ResponseEntity<List<Qc>> listarTodos() {
        List<Qc> lista = qcService.listarTodos();
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/obra/{obraId}")
    public ResponseEntity<List<Qc>> listarPorObra(@PathVariable Long obraId) {
        List<Qc> lista = qcService.listarPorObra(obraId);
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Qc> buscarPorId(@PathVariable Long id) {
        return qcService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/comparativo")
    public ResponseEntity<QuadroComparativoDto> obterComparativoMontado(@PathVariable Long id) {
        try {
            QuadroComparativoDto dto = qcService.montarQuadroComparativo(id);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/conciliar-ia")
    public ResponseEntity<QuadroComparativoDto> conciliarQcComIa(@PathVariable Long id) {
        try {
            QuadroComparativoDto dto = qcService.conciliarQcComIa(id);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<Qc> criarQc(@RequestBody Qc qc) {
        Qc novoQc = qcService.salvar(qc);
        return ResponseEntity.status(HttpStatus.CREATED).body(novoQc);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Qc> atualizarQc(@PathVariable Long id, @RequestBody Qc qc) {
        return qcService.atualizar(id, qc)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarQc(@PathVariable Long id) {
        if (qcService.deletar(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/comparativo")
    public ResponseEntity<QuadroComparativoDto> atualizarComparativoCompleto(
            @PathVariable Long id,
            @RequestBody QuadroComparativoDto dto) {
        try {
            QuadroComparativoDto atualizado = qcService.atualizarComparativoCompleto(id, dto);
            
            String numQc = (atualizado.getMetadados() != null && atualizado.getMetadados().numeroQuadro() != null)
                    ? atualizado.getMetadados().numeroQuadro() : ("ID " + id);
            int totalOrcamentos = atualizado.getOrcamentos() != null ? atualizado.getOrcamentos().size() : 0;
            
            auditoriaService.registrar("ATUALIZACAO", "QC", id.toString(),
                    "Alterou itens, quantidades ou valores do QC " + numQc + " (" + totalOrcamentos + " fornecedores cotados)");

            return ResponseEntity.ok(atualizado);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    @PostMapping("/gerar-vencedor")
    public ResponseEntity<Qc> gerarQcVencedor(@RequestBody GerarQcVencedorRequestDto dto) {
        Qc criado = qcService.gerarQcVencedor(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(criado);
    }

    @PostMapping("/{id}/restaurar-item")
    public ResponseEntity<?> restaurarItem(
            @PathVariable Long id,
            @RequestBody RestaurarItemDto dto) {
        try {
            String mensagem = qcService.restaurarItem(id, dto);
            return ResponseEntity.ok(Map.of("sucesso", true, "mensagem", mensagem));
        } catch (NoSuchElementException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("sucesso", false, "mensagem", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("sucesso", false, "mensagem", "Erro interno ao restaurar item: " + e.getMessage()));
        }
    }

}
