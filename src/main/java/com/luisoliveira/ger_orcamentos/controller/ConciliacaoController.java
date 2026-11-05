package com.luisoliveira.ger_orcamentos.controller;

import com.luisoliveira.ger_orcamentos.dto.*;
import com.luisoliveira.ger_orcamentos.model.ConversaoPadrao;
import com.luisoliveira.ger_orcamentos.model.ItemCanonico;
import com.luisoliveira.ger_orcamentos.service.ConciliacaoService;
import com.luisoliveira.ger_orcamentos.service.ClassificadorTecnicoService;
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

    @Autowired
    private ClassificadorTecnicoService classificadorTecnicoService;

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

    @PutMapping("/materiais/{id}")
    public ResponseEntity<ItemCanonico> atualizarMaterialMestre(
            @PathVariable Long id,
            @RequestBody CriarMaterialMestreRequestDto dto,
            Authentication auth) {
        String usuarioNome = (auth != null) ? auth.getName() : "Usuário";
        return ResponseEntity.ok(conciliacaoService.atualizarMaterialMestre(id, dto, usuarioNome));
    }

    @DeleteMapping("/materiais/{id}")
    public ResponseEntity<Void> deletarMaterialMestre(
            @PathVariable Long id,
            Authentication auth) {
        String usuarioNome = (auth != null) ? auth.getName() : "Usuário";
        conciliacaoService.deletarMaterialMestre(id, usuarioNome);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/base/zerar-dados-teste")
    public ResponseEntity<?> zerarDadosTeste() {
        conciliacaoService.zerarDadosTeste();
        return ResponseEntity.ok(java.util.Map.of("message", "Base de treinamento e catálogo mestre zerados com sucesso."));
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

    @PostMapping(value = "/treinamento/upload-pdf", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UploadPdfTreinamentoResponseDto> uploadPdfsTreinamento(
            @RequestParam("files") List<org.springframework.web.multipart.MultipartFile> files,
            @RequestParam(value = "tipoFonte", defaultValue = "ORCAMENTO_HISTORICO") String tipoFonte,
            @RequestParam(value = "fornecedor", required = false) String fornecedor,
            @RequestParam(value = "documento", required = false) String documento) {
        return ResponseEntity.ok(conciliacaoService.processarUploadPdfsTreinamento(files, fornecedor, documento, tipoFonte));
    }

    @GetMapping("/classificacao/extrair")
    public ResponseEntity<com.luisoliveira.ger_orcamentos.dto.ClassificacaoTecnicaDto> extrairClassificacao(
            @RequestParam("texto") String texto) {
        return ResponseEntity.ok(classificadorTecnicoService.extrairClassificacao(texto));
    }

    @GetMapping("/atributos-bloqueantes")
    public ResponseEntity<List<com.luisoliveira.ger_orcamentos.dto.RegraAtributoBloqueanteDto>> listarRegrasAtributosBloqueantes() {
        return ResponseEntity.ok(classificadorTecnicoService.listarRegrasAtributosBloqueantes());
    }

    // --- 6. MOTOR DE EVIDÊNCIAS DIRETO ---

    @GetMapping("/evidencias/avaliar")
    public ResponseEntity<ResultadoAvaliacaoEvidenciasDto> avaliarEvidencias(
            @RequestParam("descricaoItem") String descricaoItem,
            @RequestParam(value = "unidadeItem", defaultValue = "UN") String unidadeItem,
            @RequestParam(value = "quantidadeItem", required = false) java.math.BigDecimal quantidadeItem,
            @RequestParam(value = "fornecedorId", required = false) Long fornecedorId,
            @RequestParam(value = "fornecedorNome", required = false) String fornecedorNome,
            @RequestParam("canonicoId") Long canonicoId,
            @RequestParam(value = "quantidadeUnica", defaultValue = "false") boolean quantidadeUnica,
            @RequestParam(value = "cotacaoSistema", defaultValue = "false") boolean cotacaoSistema) {
        return ResponseEntity.ok(conciliacaoService.avaliarEvidenciasItem(
                descricaoItem, unidadeItem, quantidadeItem, fornecedorId, fornecedorNome,
                canonicoId, quantidadeUnica, cotacaoSistema
        ));
    }

    @GetMapping("/diagnostico-ia")
    public ResponseEntity<java.util.Map<String, Object>> diagnosticoIa() {
        return ResponseEntity.ok(conciliacaoService.obterDiagnosticoIa());
    }
}

