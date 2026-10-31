package com.luisoliveira.ger_orcamentos.controller;

import com.luisoliveira.ger_orcamentos.model.Obra;
import com.luisoliveira.ger_orcamentos.repositories.ObraRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/obras")
public class ObraController {

    private final ObraRepository obraRepository;

    public ObraController(ObraRepository obraRepository) {
        this.obraRepository = obraRepository;
    }

    @PostMapping
    public ResponseEntity<Obra> criarObra(@RequestBody Obra obra) {
        if (obra.getProximoNumeroQc() == null) {
            obra.setProximoNumeroQc(1L);
        }
        Obra novaObra = obraRepository.save(obra);
        return ResponseEntity.ok(novaObra);
    }

    @GetMapping
    public ResponseEntity<List<Obra>> listarObras() {
        List<Obra> obras = obraRepository.findAll();
        return ResponseEntity.ok(obras);
    }
}