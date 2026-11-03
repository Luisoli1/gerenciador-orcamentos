package com.luisoliveira.ger_orcamentos.controller;

import com.luisoliveira.ger_orcamentos.model.Obra;
import com.luisoliveira.ger_orcamentos.service.ObraService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/obras")
public class ObraController {

    @Autowired
    private ObraService obraService;

    @PostMapping
    public ResponseEntity<?> criarObra(@RequestBody Obra obra) {
        try {
            Obra novaObra = obraService.criarObra(obra);
            return ResponseEntity.ok(novaObra);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Obra>> listarObras() {
        return ResponseEntity.ok(obraService.listarObras());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Obra> buscarObraPorId(@PathVariable Long id) {
        return obraService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizarObra(@PathVariable Long id, @RequestBody Obra obraAtualizada) {
        try {
            Obra obraSalva = obraService.atualizarObra(id, obraAtualizada);
            return ResponseEntity.ok(obraSalva);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarObra(@PathVariable Long id) {
        try {
            obraService.deletarObra(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}