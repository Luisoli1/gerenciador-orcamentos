package com.luisoliveira.ger_orcamentos.controller;

import com.luisoliveira.ger_orcamentos.model.AuditoriaLog;
import com.luisoliveira.ger_orcamentos.service.AuditoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auditoria")
public class AuditoriaController {

    @Autowired
    private AuditoriaService auditoriaService;

    @GetMapping
    public ResponseEntity<List<AuditoriaLog>> listarLogs(@RequestParam(required = false) String busca) {
        if (busca != null && !busca.isBlank()) {
            return ResponseEntity.ok(auditoriaService.buscar(busca));
        }
        return ResponseEntity.ok(auditoriaService.listarLogsRecentes());
    }

    @GetMapping("/entidade/{entidade}")
    public ResponseEntity<List<AuditoriaLog>> listarPorEntidade(@PathVariable String entidade) {
        return ResponseEntity.ok(auditoriaService.listarLogsPorEntidade(entidade.toUpperCase()));
    }
}
