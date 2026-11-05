package com.luisoliveira.ger_orcamentos.controller;

import com.luisoliveira.ger_orcamentos.dto.*;
import com.luisoliveira.ger_orcamentos.model.ConversaoPadrao;
import com.luisoliveira.ger_orcamentos.model.ItemCanonico;
import com.luisoliveira.ger_orcamentos.service.ConciliacaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conciliacao")
public class ConciliacaoController {

    @Autowired
    private ConciliacaoService conciliacaoService;

    // --- 1. GESTÃO DE ALIASES (DE-PARA) ---

    @GetMapping("/aliases")
    public ResponseEntity<List<ItemAliasResponseDto>> listarAliases(
            @RequestParam(value = "filtro", required = false) String filtro) {
        return ResponseEntity.ok(conciliacaoService.listarAliases(filtro));
    }

    @PutMapping("/aliases/{id}")
    public ResponseEntity<ItemAliasResponseDto> reassociarAlias(
            @PathVariable Long id,
            @RequestBody ReassociarAliasRequestDto dto,
            Authentication auth) {
        String usuarioNome = (auth != null) ? auth.getName() : "Usuário";
        return ResponseEntity.ok(conciliacaoService.reassociarAlias(id, dto, null, usuarioNome));
    }

    @DeleteMapping("/aliases/{id}")
    public ResponseEntity<Void> inativarAlias(
            @PathVariable Long id,
            Authentication auth) {
        String usuarioNome = (auth != null) ? auth.getName() : "Usuário";
        conciliacaoService.inativarAlias(id, null, usuarioNome);
        return ResponseEntity.noContent().build();
    }

    // --- 2. GESTÃO DE MATERIAIS MESTRE ---

    @GetMapping("/materiais")
    public ResponseEntity<List<ItemCanonico>> listarMateriaisMestre(
            @RequestParam(value = "termo", required = false) String termo) {
        return ResponseEntity.ok(conciliacaoService.listarMateriaisMestre(termo));
    }

    @PostMapping("/materiais")
    public ResponseEntity<ItemCanonico> criarMaterialMestre(
            @RequestBody CriarMaterialMestreRequestDto dto,
            Authentication auth) {
        String usuarioNome = (auth != null) ? auth.getName() : "Usuário";
        return ResponseEntity.ok(conciliacaoService.criarMaterialMestre(dto, usuarioNome));
    }

    // --- 3. DETECÇÃO DE DISCREPÂNCIAS E CONFIRMAÇÃO ---

    @PostMapping("/verificar-discrepancias")
    public ResponseEntity<VerificacaoConciliacaoResponseDto> verificarDiscrepancias(
            @RequestBody QuadroComparativoDto comparativo) {
        return ResponseEntity.ok(conciliacaoService.verificarDiscrepancias(comparativo));
    }

    @PostMapping("/confirmar")
    public ResponseEntity<Void> confirmarConciliacoes(
            @RequestBody ConfirmarConciliacaoRequestDto request,
            Authentication auth) {
        String usuarioNome = (auth != null) ? auth.getName() : "Usuário";
        conciliacaoService.aplicarConfirmacoes(request, null, usuarioNome);
        return ResponseEntity.ok().build();
    }

    // --- 4. CONVERSÕES DE UNIDADES ---

    @GetMapping("/conversoes")
    public ResponseEntity<List<ConversaoPadrao>> listarConversoesPadrao() {
        return ResponseEntity.ok(conciliacaoService.listarConversoesPadrao());
    }

    @PostMapping("/materiais/{id}/conversoes")
    public ResponseEntity<?> cadastrarConversaoItem(
            @PathVariable Long id,
            @RequestBody CadastrarConversaoItemDto dto,
            Authentication auth) {
        String usuarioNome = (auth != null) ? auth.getName() : "Usuário";
        return ResponseEntity.ok(conciliacaoService.cadastrarConversaoItem(
                id, dto.unidadeOrigem(), dto.unidadeDestino(), dto.fatorMultiplicador(), usuarioNome
        ));
    }

    // --- 5. TREINAMENTO DA BASE DE CONHECIMENTO (MODO VALIDAÇÃO EM MASSA) ---

    @GetMapping("/treinamento/proximo")
    public ResponseEntity<ItemTreinamentoDto> obterProximoItemTreinamento() {
        ItemTreinamentoDto proximo = conciliacaoService.obterProximoItemParaTreinar();
        if (proximo == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(proximo);
    }

    @PostMapping("/treinamento/validar")
    public ResponseEntity<ItemTreinamentoDto> validarItemTreinamento(
            @RequestBody ValidarItemTreinamentoRequestDto request,
            Authentication auth) {
        String usuarioNome = (auth != null) ? auth.getName() : "Usuário";
        ItemTreinamentoDto proximo = conciliacaoService.validarItemTreinamento(request, usuarioNome);
        return ResponseEntity.ok(proximo);
    }

    @GetMapping("/treinamento/estatisticas")
    public ResponseEntity<EstatisticasTreinamentoDto> obterEstatisticasTreinamento() {
        return ResponseEntity.ok(conciliacaoService.obterEstatisticasTreinamento());
    }

    @PostMapping("/treinamento/enfileirar")
    public ResponseEntity<Integer> enfileirarItensTreinamento(
            @RequestBody List<ItemQuadroDTO> itens,
            @RequestParam(value = "fornecedor", required = false) String fornecedor,
            @RequestParam(value = "documento", required = false) String documento,
            @RequestParam(value = "tipoFonte", defaultValue = "ORCAMENTO_HISTORICO") String tipoFonte) {
        int qtd = conciliacaoService.enfileirarItensLote(itens, fornecedor, documento, tipoFonte);
        return ResponseEntity.ok(qtd);
    }
}

