package com.luisoliveira.ger_orcamentos.controller;

import com.luisoliveira.ger_orcamentos.dto.FornecedorResponseDto;
import com.luisoliveira.ger_orcamentos.model.Fornecedor;
import com.luisoliveira.ger_orcamentos.service.FornecedorService;
import com.luisoliveira.ger_orcamentos.service.AuditoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/fornecedores")
public class FornecedorController {

    @Autowired
    private FornecedorService fornecedorService;

    @Autowired
    private AuditoriaService auditoriaService;

    @GetMapping
    public ResponseEntity<List<FornecedorResponseDto>> listarFornecedores() {
        List<FornecedorResponseDto> fornecedores = fornecedorService.listarFornecedoresDto();
        return ResponseEntity.ok(fornecedores);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FornecedorResponseDto> buscarPorId(@PathVariable Long id) {
        return fornecedorService.buscarPorIdDto(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> criarFornecedor(@RequestBody Fornecedor fornecedor) {
        // 1. Verifica se já existe por CNPJ
        if (fornecedor.getCnpj() != null && !fornecedor.getCnpj().isBlank()) {
            String cnpjLimpo = fornecedor.getCnpj().replaceAll("[^0-9]", "");
            if (!cnpjLimpo.isEmpty()) {
                Optional<Fornecedor> existenteCnpj = fornecedorService.listarFornecedores().stream()
                        .filter(f -> f.getCnpj() != null && f.getCnpj().replaceAll("[^0-9]", "").equals(cnpjLimpo))
                        .findFirst();
                if (existenteCnpj.isPresent()) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body(Map.of("message", "Já existe um fornecedor cadastrado com o CNPJ " + fornecedor.getCnpj() + " (" + existenteCnpj.get().getNome() + ")"));
                }
            }
        }

        // 2. Verifica se já existe por Razão Social / Nome
        if (fornecedor.getNome() != null && !fornecedor.getNome().isBlank()) {
            String nomeTrim = fornecedor.getNome().trim();
            Optional<Fornecedor> existenteNome = fornecedorService.listarFornecedores().stream()
                    .filter(f -> f.getNome() != null && f.getNome().trim().equalsIgnoreCase(nomeTrim))
                    .findFirst();
            if (existenteNome.isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("message", "Já existe um fornecedor cadastrado com a Razão Social/Nome '" + fornecedor.getNome() + "'"));
            }
        }

        // 3. Salva novo fornecedor
        Fornecedor novo = fornecedorService.salvar(fornecedor);
        auditoriaService.registrar("CRIACAO", "FORNECEDOR", novo.getId().toString(), "Cadastrou fornecedor: " + novo.getNome() + " (CNPJ: " + novo.getCnpj() + ")");
        return ResponseEntity.status(HttpStatus.CREATED).body(FornecedorResponseDto.fromEntity(novo));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FornecedorResponseDto> atualizarFornecedor(@PathVariable Long id, @RequestBody Fornecedor fornecedor) {
        return fornecedorService.atualizarFornecedor(id, fornecedor)
                .map(f -> {
                    auditoriaService.registrar("ATUALIZACAO", "FORNECEDOR", id.toString(), "Atualizou dados do fornecedor: " + f.nome());
                    return ResponseEntity.ok(f);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarFornecedor(@PathVariable Long id) {
        if (fornecedorService.buscarPorId(id).isPresent()) {
            fornecedorService.deletarFornecedor(id);
            auditoriaService.registrar("EXCLUSAO", "FORNECEDOR", id.toString(), "Excluiu fornecedor ID " + id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
