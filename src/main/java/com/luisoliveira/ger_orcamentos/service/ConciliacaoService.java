package com.luisoliveira.ger_orcamentos.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.luisoliveira.ger_orcamentos.client.GeminiClient;
import com.luisoliveira.ger_orcamentos.dto.*;
import com.luisoliveira.ger_orcamentos.model.*;
import com.luisoliveira.ger_orcamentos.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ConciliacaoService {

    @Autowired
    private ItemCanonicoRepository itemCanonicoRepository;

    @Autowired
    private ItemAliasRepository itemAliasRepository;

    @Autowired
    private FabricanteRepository fabricanteRepository;

    @Autowired
    private ConversaoPadraoRepository conversaoPadraoRepository;

    @Autowired
    private ItemConversaoUnidadeRepository itemConversaoUnidadeRepository;

    @Autowired
    private ItemTreinamentoFilaRepository itemTreinamentoFilaRepository;

    @Autowired
    private ClassificadorTecnicoService classificadorTecnicoService;

    @Autowired
    private MotorEvidenciasService motorEvidenciasService;

    @Autowired
    private AuditoriaService auditoriaService;

    @Autowired(required = false)
    private GeminiClient geminiClient;

    @Autowired(required = false)
    private AiExtratorService aiExtratorService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // ==========================================
    // 1. NORMALIZAÇÃO TÉCNICA E AUXILIARES
    // ==========================================

    public String normalizarTexto(String texto) {
        if (texto == null) return "";
        String semAcento = Normalizer.normalize(texto, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return semAcento.toLowerCase()
                .replaceAll("[,]", ".") // vírgula decimal para ponto
                .replaceAll("c/", "com ")
                .replaceAll("p/", "para ")
                .replaceAll("s/", "sem ")
                .replaceAll("[-_./\"'ºª°²³]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    public String normalizarUnidade(String unidade) {
        if (unidade == null) return "UN";
        String u = unidade.trim().toUpperCase()
                .replaceAll("[^A-Z]", "");
        return switch (u) {
            case "M", "MT", "MTS", "METRO", "METROS" -> "M";
            case "BR", "BARRA", "BARRAS" -> "BARRA";
            case "RL", "ROLO", "ROLOS" -> "ROLO";
            case "CX", "CAIXA", "CAIXAS" -> "CX";
            case "PC", "PCA", "PECA", "PECAS" -> "PÇ";
            case "KG", "QUILO", "QUILOS" -> "KG";
            case "CT", "CENTO", "CENTOS" -> "CENTO";
            case "MIL", "MILHEIRO", "MILHEIROS" -> "MILHEIRO";
            default -> u.isEmpty() ? "UN" : u;
        };
    }

    // ==========================================
    // 2. MOTOR DE CONVERSÃO DE UNIDADES
    // ==========================================

    public BigDecimal obterFatorConversao(Long itemCanonicoId, String unidadeOrigem, String unidadeDestino) {
        if (unidadeOrigem == null || unidadeDestino == null) return BigDecimal.ONE;
        String uOrig = normalizarUnidade(unidadeOrigem);
        String uDest = normalizarUnidade(unidadeDestino);

        if (uOrig.equalsIgnoreCase(uDest)) {
            return BigDecimal.ONE;
        }

        // 1. Verifica conversão específica do material mestre
        if (itemCanonicoId != null) {
            Optional<ItemConversaoUnidade> convItem = itemConversaoUnidadeRepository
                    .findByItemCanonicoIdAndUnidadeOrigemAndUnidadeDestino(itemCanonicoId, uOrig, uDest);
            if (convItem.isPresent()) {
                return convItem.get().getFatorMultiplicador();
            }
            // Inversa
            Optional<ItemConversaoUnidade> convItemInv = itemConversaoUnidadeRepository
                    .findByItemCanonicoIdAndUnidadeOrigemAndUnidadeDestino(itemCanonicoId, uDest, uOrig);
            if (convItemInv.isPresent() && convItemInv.get().getFatorMultiplicador().compareTo(BigDecimal.ZERO) > 0) {
                return BigDecimal.ONE.divide(convItemInv.get().getFatorMultiplicador(), 4, RoundingMode.HALF_UP);
            }
        }

        // 2. Verifica conversão padrão global de engenharia
        Optional<ConversaoPadrao> convPadrao = conversaoPadraoRepository
                .findByUnidadeOrigemAndUnidadeDestinoAndAtivoTrue(uOrig, uDest);
        if (convPadrao.isPresent()) {
            return convPadrao.get().getFatorMultiplicador();
        }
        // Inversa
        Optional<ConversaoPadrao> convPadraoInv = conversaoPadraoRepository
                .findByUnidadeOrigemAndUnidadeDestinoAndAtivoTrue(uDest, uOrig);
        if (convPadraoInv.isPresent() && convPadraoInv.get().getFatorMultiplicador().compareTo(BigDecimal.ZERO) > 0) {
            return BigDecimal.ONE.divide(convPadraoInv.get().getFatorMultiplicador(), 4, RoundingMode.HALF_UP);
        }

        return BigDecimal.ONE;
    }

    @Transactional
    public ItemConversaoUnidade cadastrarConversaoItem(Long itemCanonicoId, String unidadeOrigem, String unidadeDestino, BigDecimal fatorMultiplicador, String usuarioNome) {
        ItemCanonico canonico = itemCanonicoRepository.findById(itemCanonicoId)
                .orElseThrow(() -> new RuntimeException("Material mestre não encontrado: ID " + itemCanonicoId));

        String uOrig = normalizarUnidade(unidadeOrigem);
        String uDest = normalizarUnidade(unidadeDestino);

        Optional<ItemConversaoUnidade> existente = itemConversaoUnidadeRepository
                .findByItemCanonicoIdAndUnidadeOrigemAndUnidadeDestino(itemCanonicoId, uOrig, uDest);

        ItemConversaoUnidade conv;
        if (existente.isPresent()) {
            conv = existente.get();
            conv.setFatorMultiplicador(fatorMultiplicador);
        } else {
            conv = new ItemConversaoUnidade(canonico, uOrig, uDest, fatorMultiplicador);
        }

        ItemConversaoUnidade salvo = itemConversaoUnidadeRepository.save(conv);

        auditoriaService.registrar(
                "CONVERSAO_UNIDADE",
                "CADASTRO_ESPECIFICO",
                String.valueOf(salvo.getId()),
                String.format("Conversão cadastrada para '%s': 1 %s = %s %s por %s",
                        canonico.getDescricaoPadrao(), uOrig, fatorMultiplicador.toString(), uDest, usuarioNome)
        );

        return salvo;
    }

    // ==========================================
    // 3. MOTOR DE CONCILIAÇÃO POR EVIDÊNCIAS
    // ==========================================

    public SugestaoConciliacaoDto resolverConciliacao(String descricaoOriginal, String unidadeOriginal,
                                                     BigDecimal quantidadeOriginal, BigDecimal precoUnitarioOriginal,
                                                     Long fornecedorId, String fornecedorNome,
                                                     List<ItemCanonico> cacheMateriais) {
        return resolverConciliacaoCompleta(
                descricaoOriginal, unidadeOriginal, quantidadeOriginal, precoUnitarioOriginal,
                fornecedorId, fornecedorNome, cacheMateriais, false, false, null
        );
    }

    public SugestaoConciliacaoDto resolverConciliacaoCompleta(String descricaoOriginal, String unidadeOriginal,
                                                             BigDecimal quantidadeOriginal, BigDecimal precoUnitarioOriginal,
                                                             Long fornecedorId, String fornecedorNome,
                                                             List<ItemCanonico> cacheMateriais,
                                                             boolean quantidadeUnicaNoOrcamento,
                                                             boolean geradoPorCotacaoSistema,
                                                             Integer itemSeqCotacao) {
        if (descricaoOriginal == null || descricaoOriginal.isBlank()) {
            return null;
        }

        String uOrig = normalizarUnidade(unidadeOriginal);
        List<ItemCanonico> materiais = (cacheMateriais != null) ? cacheMateriais : itemCanonicoRepository.findByAtivoTrueOrderByDescricaoPadraoAsc();

        ResultadoAvaliacaoEvidenciasDto melhorAvaliacao = null;
        ItemCanonico melhorCanonico = null;
        int maiorConfianca = 0;

        for (ItemCanonico mat : materiais) {
            BigDecimal fator = obterFatorConversao(mat.getId(), uOrig, mat.getUnidadePadrao());
            ResultadoAvaliacaoEvidenciasDto aval = motorEvidenciasService.avaliarEvidencias(
                    descricaoOriginal, unidadeOriginal, quantidadeOriginal,
                    fornecedorId, fornecedorNome, mat, fator,
                    quantidadeUnicaNoOrcamento, geradoPorCotacaoSistema, itemSeqCotacao
            );

            if (aval.confianca() > maiorConfianca) {
                maiorConfianca = aval.confianca();
                melhorAvaliacao = aval;
                melhorCanonico = mat;
            }
        }

        if (melhorCanonico != null && maiorConfianca >= 50) {
            BigDecimal fator = obterFatorConversao(melhorCanonico.getId(), uOrig, melhorCanonico.getUnidadePadrao());
            BigDecimal qtdConvertida = (quantidadeOriginal != null) ? quantidadeOriginal.multiply(fator) : null;
            BigDecimal precoConvertido = (precoUnitarioOriginal != null && fator.compareTo(BigDecimal.ZERO) > 0)
                    ? precoUnitarioOriginal.divide(fator, 4, RoundingMode.HALF_UP)
                    : precoUnitarioOriginal;

            String justificativa = (melhorAvaliacao != null && !melhorAvaliacao.motivos().isEmpty())
                    ? String.join(" • ", melhorAvaliacao.motivos())
                    : "Similaridade semântica por evidências combinadas (" + maiorConfianca + "%).";

            return new SugestaoConciliacaoDto(
                    descricaoOriginal, fornecedorNome, fornecedorId,
                    melhorCanonico.getId(), melhorCanonico.getDescricaoPadrao(),
                    maiorConfianca, justificativa,
                    "MOTOR_EVIDENCIAS", uOrig, melhorCanonico.getUnidadePadrao(),
                    fator, quantidadeOriginal, qtdConvertida, precoUnitarioOriginal, precoConvertido,
                    melhorAvaliacao != null ? melhorAvaliacao.alertaConflito() : null,
                    melhorAvaliacao != null ? melhorAvaliacao.motivos() : List.of(),
                    melhorAvaliacao != null ? melhorAvaliacao.evidencias() : List.of()
            );
        }

        return null; // Sem correspondência com evidências suficientes
    }

    public ResultadoAvaliacaoEvidenciasDto avaliarEvidenciasItem(
            String descricaoItem, String unidadeItem, BigDecimal quantidadeItem,
            Long fornecedorId, String fornecedorNome, Long canonicoId,
            boolean quantidadeUnica, boolean cotacaoSistema) {
        ItemCanonico canonico = itemCanonicoRepository.findById(canonicoId)
                .orElseThrow(() -> new RuntimeException("Material mestre não encontrado: " + canonicoId));
        BigDecimal fator = obterFatorConversao(canonico.getId(), unidadeItem, canonico.getUnidadePadrao());
        return motorEvidenciasService.avaliarEvidencias(
                descricaoItem, unidadeItem, quantidadeItem, fornecedorId, fornecedorNome,
                canonico, fator, quantidadeUnica, cotacaoSistema, null
        );
    }

    private List<String> extrairTokensNumericos(String texto) {
        List<String> nums = new ArrayList<>();
        Matcher m = Pattern.compile("\\b\\d+(?:\\.\\d+)?\\b").matcher(texto);
        while (m.find()) {
            nums.add(m.group());
        }
        return nums;
    }

    private int calcularScoreSobreposicao(String textoA, String textoB) {
        String[] tokensA = textoA.split("\\s+");
        String[] tokensB = textoB.split("\\s+");
        Set<String> setB = new HashSet<>(Arrays.asList(tokensB));

        long comuns = Arrays.stream(tokensA).filter(setB::contains).count();
        int minLen = Math.min(tokensA.length, tokensB.length);
        if (minLen == 0) return 0;

        return (int) Math.round(((double) comuns / minLen) * 100);
    }

    // ==========================================
    // 4. DETECÇÃO DE DISCREPÂNCIAS (30 + 30 = 33)
    // ==========================================

    public VerificacaoConciliacaoResponseDto verificarDiscrepancias(QuadroComparativoDto comparativo) {
        if (comparativo == null || comparativo.getOrcamentos() == null || comparativo.getOrcamentos().isEmpty()) {
            return new VerificacaoConciliacaoResponseDto(false, 0, 0, 0, "Sem orçamentos para verificar.", List.of(), List.of());
        }

        List<QuadroConcorrenciaDto> orcs = comparativo.getOrcamentos();
        int maiorLinhas = orcs.stream().mapToInt(o -> (o.getItens() != null) ? o.getItens().size() : 0).max().orElse(0);
        int menorLinhas = orcs.stream().mapToInt(o -> (o.getItens() != null) ? o.getItens().size() : 0).min().orElse(0);

        List<ItemCanonico> materiaisAtivos = itemCanonicoRepository.findByAtivoTrueOrderByDescricaoPadraoAsc();

        // Pré-computa frequências de quantidades por orçamento para detectar "quantidades únicas" (fingerprint de lista)
        Map<String, Map<BigDecimal, Long>> frequenciasQtdPorOrc = new HashMap<>();
        for (QuadroConcorrenciaDto orc : orcs) {
            if (orc.getItens() == null) continue;
            Map<BigDecimal, Long> freq = orc.getItens().stream()
                    .filter(it -> it.quantidade() != null)
                    .collect(Collectors.groupingBy(ItemQuadroDTO::quantidade, Collectors.counting()));
            frequenciasQtdPorOrc.put(orc.getNomeFornecedor(), freq);
        }

        // 1. Resolve cada item de cada orçamento pelo Motor de Evidências
        Map<String, SugestaoConciliacaoDto> sugestoesPorDescricao = new HashMap<>();
        List<SugestaoConciliacaoDto> todasSugestoes = new ArrayList<>();

        for (QuadroConcorrenciaDto orc : orcs) {
            if (orc.getItens() == null) continue;
            Map<BigDecimal, Long> freq = frequenciasQtdPorOrc.getOrDefault(orc.getNomeFornecedor(), Map.of());

            for (ItemQuadroDTO it : orc.getItens()) {
                if (it.descricao() == null) continue;
                boolean qtdUnica = it.quantidade() != null && freq.getOrDefault(it.quantidade(), 0L) == 1L;

                SugestaoConciliacaoDto sug = resolverConciliacaoCompleta(
                        it.descricao(), it.unidadeMedida(), it.quantidade(), it.valorUnitario(),
                        null, orc.getNomeFornecedor(), materiaisAtivos,
                        qtdUnica, false, null
                );
                if (sug != null) {
                    sugestoesPorDescricao.put(normalizarTexto(it.descricao()), sug);
                    todasSugestoes.add(sug);
                }
            }
        }

        // 2. Mapeia itens únicos agrupando por item canônico (ou pela descrição normalizada se não tiver canônico)
        Set<String> chavesUnicasQc = new HashSet<>();
        for (QuadroConcorrenciaDto orc : orcs) {
            if (orc.getItens() == null) continue;
            for (ItemQuadroDTO it : orc.getItens()) {
                String norm = normalizarTexto(it.descricao());
                SugestaoConciliacaoDto sug = sugestoesPorDescricao.get(norm);
                if (sug != null && sug.itemCanonicoSugeridoId() != null) {
                    chavesUnicasQc.add("CANONICO_" + sug.itemCanonicoSugeridoId());
                } else {
                    chavesUnicasQc.add("DESC_" + norm);
                }
            }
        }

        int totalLinhasQc = chavesUnicasQc.size();
        boolean possuiDiscrepancia = (orcs.size() >= 2 && totalLinhasQc > maiorLinhas);

        List<DiscrepanciaItemDto> discrepancias = new ArrayList<>();
        String mensagem = "Quadro comparativo conciliado perfeitamente com " + totalLinhasQc + " linhas.";

        if (possuiDiscrepancia) {
            int diferenca = totalLinhasQc - maiorLinhas;
            mensagem = String.format("Atenção: O maior orçamento possui %d itens, mas o quadro gerou %d linhas (%d linhas a mais). Foram detectadas possíveis duplicidades de itens com descrições divergentes.",
                    maiorLinhas, totalLinhasQc, diferenca);

            // Identifica itens com apenas 1 fornecedor (linhas 'órfãs') para revisão e calcula evidências cruzadas
            for (QuadroConcorrenciaDto orc : orcs) {
                if (orc.getItens() == null) continue;
                Map<BigDecimal, Long> freq = frequenciasQtdPorOrc.getOrDefault(orc.getNomeFornecedor(), Map.of());

                for (ItemQuadroDTO it : orc.getItens()) {
                    String norm = normalizarTexto(it.descricao());
                    SugestaoConciliacaoDto sug = sugestoesPorDescricao.get(norm);

                    if (sug == null || sug.confianca() < 90) {
                        List<String> faltantes = orcs.stream()
                                .map(QuadroConcorrenciaDto::getNomeFornecedor)
                                .filter(f -> !Objects.equals(f, orc.getNomeFornecedor()))
                                .collect(Collectors.toList());

                        List<SugestaoConciliacaoDto> sugestoesEquivalentes = new ArrayList<>();
                        if (sug != null) {
                            sugestoesEquivalentes.add(sug);
                        }

                        // Busca item correspondente em outro fornecedor com evidências cruzadas (ex: 157m idêntico)
                        boolean qtdAUnica = it.quantidade() != null && freq.getOrDefault(it.quantidade(), 0L) == 1L;

                        for (QuadroConcorrenciaDto outroOrc : orcs) {
                            if (Objects.equals(outroOrc.getNomeFornecedor(), orc.getNomeFornecedor()) || outroOrc.getItens() == null) continue;
                            Map<BigDecimal, Long> outroFreq = frequenciasQtdPorOrc.getOrDefault(outroOrc.getNomeFornecedor(), Map.of());

                            for (ItemQuadroDTO outroIt : outroOrc.getItens()) {
                                if (outroIt.descricao() == null) continue;
                                boolean qtdBUnica = outroIt.quantidade() != null && outroFreq.getOrDefault(outroIt.quantidade(), 0L) == 1L;

                                ResultadoAvaliacaoEvidenciasDto crossEvidencias = motorEvidenciasService.avaliarEvidenciasEntreItens(
                                        it.descricao(), it.unidadeMedida(), it.quantidade(), orc.getNomeFornecedor(), qtdAUnica,
                                        outroIt.descricao(), outroIt.unidadeMedida(), outroIt.quantidade(), outroOrc.getNomeFornecedor(), qtdBUnica,
                                        null, BigDecimal.ONE
                                );

                                if (crossEvidencias.confianca() >= 45) {
                                    String justificativa = !crossEvidencias.motivos().isEmpty()
                                            ? String.join(" • ", crossEvidencias.motivos())
                                            : "Correspondência cruzada por evidências (" + crossEvidencias.confianca() + "%).";

                                    sugestoesEquivalentes.add(new SugestaoConciliacaoDto(
                                            it.descricao(), outroOrc.getNomeFornecedor(), null,
                                            null, outroIt.descricao(),
                                            crossEvidencias.confianca(), justificativa,
                                            "CROSS_ORCAMENTO", it.unidadeMedida(), outroIt.unidadeMedida(),
                                            BigDecimal.ONE, it.quantidade(), outroIt.quantidade(),
                                            it.valorUnitario(), outroIt.valorUnitario(),
                                            crossEvidencias.alertaConflito(),
                                            crossEvidencias.motivos(),
                                            crossEvidencias.evidencias()
                                    ));
                                }
                            }
                        }

                        sugestoesEquivalentes.sort(Comparator.comparingInt(SugestaoConciliacaoDto::confianca).reversed());

                        discrepancias.add(new DiscrepanciaItemDto(
                                it.descricao(), orc.getNomeFornecedor(), faltantes,
                                sugestoesEquivalentes
                        ));
                    }
                }
            }
        }

        return new VerificacaoConciliacaoResponseDto(
                possuiDiscrepancia, totalLinhasQc, maiorLinhas, menorLinhas,
                mensagem, todasSugestoes, discrepancias
        );
    }

    // ==========================================
    // 5. APRENDIZADO PROGRESSIVO & CONFIRMAÇÃO
    // ==========================================

    @Transactional
    public void aplicarConfirmacoes(ConfirmarConciliacaoRequestDto request, Long usuarioId, String usuarioNome) {
        if (request == null || request.associacoes() == null) return;

        for (ConfirmarConciliacaoRequestDto.ItemAssociacaoConfirmadaDto item : request.associacoes()) {
            ItemCanonico canonico;

            if (item.criarNovoCanonico() || item.itemCanonicoId() == null) {
                String descPadrao = (item.novaDescricaoCanonico() != null && !item.novaDescricaoCanonico().isBlank())
                        ? item.novaDescricaoCanonico().trim().toUpperCase()
                        : item.descricaoOriginal().trim().toUpperCase();

                String norm = normalizarTexto(descPadrao);
                canonico = itemCanonicoRepository.findByDescricaoNormalizada(norm)
                        .orElseGet(() -> {
                            ItemCanonico novo = new ItemCanonico(
                                    descPadrao, norm, item.unidadePadrao(), item.categoria(), usuarioNome
                            );
                            return itemCanonicoRepository.save(novo);
                        });
            } else {
                canonico = itemCanonicoRepository.findById(item.itemCanonicoId())
                        .orElseThrow(() -> new RuntimeException("Material mestre não encontrado: ID " + item.itemCanonicoId()));
            }

            if (item.lembrarPermanente()) {
                salvarOuAtualizarAlias(
                        canonico, item.fornecedorId(), item.descricaoOriginal(),
                        "USUARIO_CONFIRMADO", usuarioId, usuarioNome
                );
            }
        }
    }

    @Transactional
    public ItemAlias salvarOuAtualizarAlias(ItemCanonico canonico, Long fornecedorId, String descricaoOriginal,
                                           String origem, Long usuarioId, String usuarioNome) {
        if (canonico == null || descricaoOriginal == null || descricaoOriginal.isBlank()) return null;

        String norm = normalizarTexto(descricaoOriginal);
        Fornecedor fornecedor = null; // se fornecedorId != null busca do repo

        List<ItemAlias> existentes = itemAliasRepository.buscarMelhorMatchAlias(norm, fornecedorId);
        ItemAlias alias;
        if (!existentes.isEmpty()) {
            alias = existentes.get(0);
            alias.setItemCanonico(canonico);
            alias.setVezesUtilizado(alias.getVezesUtilizado() + 1);
            alias.setAlteradoPorUsuarioId(usuarioId);
            alias.setAlteradoPorNome(usuarioNome);
            alias.setDataAtualizacao(LocalDateTime.now());
            alias.setAtivo(true);
        } else {
            alias = new ItemAlias(canonico, fornecedor, descricaoOriginal.trim(), norm, origem, usuarioId, usuarioNome);
        }

        ItemAlias salvo = itemAliasRepository.save(alias);

        auditoriaService.registrar(
                "ASSOCIACAO_CONFIRMADA",
                "DE_PARA_ALIAS",
                String.valueOf(salvo.getId()),
                String.format("Alias '%s' vinculado ao Material Mestre '%s' (ID %d) por %s",
                        descricaoOriginal, canonico.getDescricaoPadrao(), canonico.getId(), usuarioNome != null ? usuarioNome : "Sistema")
        );

        return salvo;
    }

    // ==========================================
    // 6. GESTÃO DE ALIASES (TELA ADMIN)
    // ==========================================

    public List<ItemAliasResponseDto> listarAliases(String filtro) {
        List<ItemAlias> lista;
        if (filtro != null && !filtro.isBlank()) {
            lista = itemAliasRepository.buscarAliasesPorFiltro(filtro.trim());
        } else {
            lista = itemAliasRepository.findByAtivoTrueOrderByDataAtualizacaoDesc();
        }

        return lista.stream().map(a -> new ItemAliasResponseDto(
                a.getId(),
                a.getDescricaoOriginal(),
                a.getDescricaoNormalizada(),
                a.getOrigem(),
                a.getVezesUtilizado(),
                a.getFornecedor() != null ? a.getFornecedor().getId() : null,
                a.getFornecedor() != null ? a.getFornecedor().getNome() : "Global (Todos)",
                a.getItemCanonico() != null ? a.getItemCanonico().getId() : null,
                a.getItemCanonico() != null ? a.getItemCanonico().getDescricaoPadrao() : "Não vinculado",
                a.getItemCanonico() != null ? a.getItemCanonico().getUnidadePadrao() : "UN",
                a.getCriadoPorNome(),
                a.getDataCriacao(),
                a.getAlteradoPorNome(),
                a.getDataAtualizacao()
        )).collect(Collectors.toList());
    }

    @Transactional
    public ItemAliasResponseDto reassociarAlias(Long aliasId, ReassociarAliasRequestDto dto, Long usuarioId, String usuarioNome) {
        ItemAlias alias = itemAliasRepository.findById(aliasId)
                .orElseThrow(() -> new RuntimeException("Alias não encontrado com ID: " + aliasId));

        ItemCanonico antigoCanonico = alias.getItemCanonico();
        ItemCanonico novoCanonico;

        if (dto.novoItemCanonicoId() != null) {
            novoCanonico = itemCanonicoRepository.findById(dto.novoItemCanonicoId())
                    .orElseThrow(() -> new RuntimeException("Material mestre não encontrado com ID: " + dto.novoItemCanonicoId()));
        } else if (dto.novaDescricaoCanonico() != null && !dto.novaDescricaoCanonico().isBlank()) {
            String desc = dto.novaDescricaoCanonico().trim().toUpperCase();
            String norm = normalizarTexto(desc);
            novoCanonico = itemCanonicoRepository.findByDescricaoNormalizada(norm)
                    .orElseGet(() -> itemCanonicoRepository.save(new ItemCanonico(
                            desc, norm, dto.unidadePadrao(), dto.categoria(), usuarioNome
                    )));
        } else {
            throw new IllegalArgumentException("Informe o novo material mestre ou uma nova descrição para reassociar.");
        }

        alias.setItemCanonico(novoCanonico);
        alias.setAlteradoPorUsuarioId(usuarioId);
        alias.setAlteradoPorNome(usuarioNome);
        alias.setDataAtualizacao(LocalDateTime.now());
        ItemAlias salvo = itemAliasRepository.save(alias);

        auditoriaService.registrar(
                "RECLASSIFICACAO",
                "DE_PARA_ALIAS",
                String.valueOf(salvo.getId()),
                String.format("Alias '%s' (ID %d) desvinculado de '%s' e reclassificado para '%s' (ID %d)",
                        alias.getDescricaoOriginal(), alias.getId(),
                        antigoCanonico != null ? antigoCanonico.getDescricaoPadrao() : "Nenhum",
                        novoCanonico.getDescricaoPadrao(), novoCanonico.getId())
        );

        return new ItemAliasResponseDto(
                salvo.getId(), salvo.getDescricaoOriginal(), salvo.getDescricaoNormalizada(),
                salvo.getOrigem(), salvo.getVezesUtilizado(),
                salvo.getFornecedor() != null ? salvo.getFornecedor().getId() : null,
                salvo.getFornecedor() != null ? salvo.getFornecedor().getNome() : "Global (Todos)",
                novoCanonico.getId(), novoCanonico.getDescricaoPadrao(), novoCanonico.getUnidadePadrao(),
                salvo.getCriadoPorNome(), salvo.getDataCriacao(), salvo.getAlteradoPorNome(), salvo.getDataAtualizacao()
        );
    }

    @Transactional
    public void inativarAlias(Long aliasId, Long usuarioId, String usuarioNome) {
        ItemAlias alias = itemAliasRepository.findById(aliasId)
                .orElseThrow(() -> new RuntimeException("Alias não encontrado com ID: " + aliasId));

        alias.setAtivo(false);
        alias.setAlteradoPorUsuarioId(usuarioId);
        alias.setAlteradoPorNome(usuarioNome);
        alias.setDataAtualizacao(LocalDateTime.now());
        itemAliasRepository.save(alias);

        auditoriaService.registrar(
                "INATIVACAO",
                "DE_PARA_ALIAS",
                String.valueOf(alias.getId()),
                String.format("Alias '%s' (ID %d) inativado da base de conhecimento.", alias.getDescricaoOriginal(), alias.getId())
        );
    }

    // ==========================================
    // 7. GESTÃO DE MATERIAIS MESTRE (CANÔNICOS)
    // ==========================================

    public List<ItemCanonico> listarMateriaisMestre(String termo) {
        if (termo != null && !termo.isBlank()) {
            return itemCanonicoRepository.buscarPorTermo(termo.trim());
        }
        return itemCanonicoRepository.findByAtivoTrueOrderByDescricaoPadraoAsc();
    }

    @Transactional
    public ItemCanonico criarMaterialMestre(CriarMaterialMestreRequestDto dto, String usuarioNome) {
        if (dto.descricaoPadrao() == null || dto.descricaoPadrao().isBlank()) {
            throw new IllegalArgumentException("A descrição padrão do material é obrigatória.");
        }

        String desc = dto.descricaoPadrao().trim().toUpperCase();
        String norm = normalizarTexto(desc);

        Optional<ItemCanonico> jaExiste = itemCanonicoRepository.findByDescricaoNormalizada(norm);
        if (jaExiste.isPresent()) {
            return jaExiste.get();
        }

        ItemCanonico novo = new ItemCanonico(
                desc, norm, dto.unidadePadrao(), dto.categoria(), usuarioNome
        );
        novo.setCodigoNcm(dto.codigoNcm());
        novo.setCodigoReferencia(dto.codigoReferencia());

        // Se usuário forneceu classificações, usa elas; caso contrário, enriquece automaticamente com IA/regras técnicas
        ClassificacaoTecnicaDto extraida = classificadorTecnicoService.extrairClassificacao(desc);
        novo.setCategoria((dto.categoria() != null && !dto.categoria().isBlank()) ? dto.categoria() : extraida.categoria());
        novo.setSubcategoria((dto.subcategoria() != null && !dto.subcategoria().isBlank()) ? dto.subcategoria() : extraida.subcategoria());
        novo.setAplicacoes((dto.aplicacoes() != null && !dto.aplicacoes().isBlank()) ? dto.aplicacoes() : String.join(", ", extraida.aplicacoes()));
        novo.setCaracteristicas((dto.caracteristicas() != null && !dto.caracteristicas().isBlank()) ? dto.caracteristicas() : String.join(", ", extraida.caracteristicas()));

        ItemCanonico salvo = itemCanonicoRepository.save(novo);

        auditoriaService.registrar(
                "CRIACAO",
                "MATERIAL_MESTRE",
                String.valueOf(salvo.getId()),
                String.format("Material Mestre criado: '%s' (ID %d, Unidade: %s)", salvo.getDescricaoPadrao(), salvo.getId(), salvo.getUnidadePadrao())
        );

        return salvo;
    }

    public List<ConversaoPadrao> listarConversoesPadrao() {
        return conversaoPadraoRepository.findByAtivoTrue();
    }

    // ==========================================
    // 8. FILA DE TREINAMENTO E VALIDAÇÃO EM MASSA
    // ==========================================

    @Transactional
    public int enfileirarItensLote(List<ItemQuadroDTO> itens, String fornecedorOrigem, String documentoOrigem, String tipoFonte) {
        if (itens == null || itens.isEmpty()) return 0;

        int novosEnfileirados = 0;
        for (ItemQuadroDTO it : itens) {
            if (it.descricao() == null || it.descricao().isBlank()) continue;
            String norm = normalizarTexto(it.descricao());

            // 1. Se já existe como alias ativo para esse fornecedor ou global, não precisa treinar
            List<ItemAlias> aliases = itemAliasRepository.buscarMelhorMatchAlias(norm, null);
            if (!aliases.isEmpty()) {
                continue;
            }

            // 2. Se já está na fila de treinamento, não duplica
            if (itemTreinamentoFilaRepository.existsByDescricaoNormalizadaAndFornecedor(norm, fornecedorOrigem)) {
                continue;
            }

            ClassificacaoTecnicaDto classif = classificadorTecnicoService.extrairClassificacao(it.descricao());
            String unid = (it.unidadeMedida() != null && !it.unidadeMedida().isBlank())
                    ? normalizarUnidade(it.unidadeMedida()) : classif.unidadeSugerida();

            ItemTreinamentoFila filaItem = new ItemTreinamentoFila(
                    it.descricao().trim(),
                    norm,
                    unid,
                    fornecedorOrigem,
                    documentoOrigem,
                    tipoFonte
            );
            filaItem.setCategoriaSugerida(classif.categoria());
            filaItem.setSubcategoriaSugerida(classif.subcategoria());
            filaItem.setAplicacoesSugeridas(String.join(", ", classif.aplicacoes()));
            filaItem.setCaracteristicasSugeridas(String.join(", ", classif.caracteristicas()));
            filaItem.setFabricanteSugerido((fornecedorOrigem != null && !fornecedorOrigem.isBlank()) ? fornecedorOrigem : classif.fabricante());
            filaItem.setCodigoFabricanteSugerido(classif.codigoFabricante());
            itemTreinamentoFilaRepository.save(filaItem);
            novosEnfileirados++;
        }
        return novosEnfileirados;
    }

    @Transactional
    public UploadPdfTreinamentoResponseDto processarUploadPdfsTreinamento(
            List<MultipartFile> files, String fornecedorManual, String documentoManual, String tipoFonte) {
        if (files == null || files.isEmpty()) {
            return new UploadPdfTreinamentoResponseDto(0, 0, 0, List.of(), "Nenhum arquivo enviado.");
        }

        int totalItensExtraidos = 0;
        int totalNovosEnfileirados = 0;
        List<String> nomesArquivos = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) continue;
            nomesArquivos.add(file.getOriginalFilename());

            try {
                if (aiExtratorService != null) {
                    QuadroConcorrenciaDto extraido = aiExtratorService.extrairDados(file);
                    if (extraido != null && extraido.getItens() != null && !extraido.getItens().isEmpty()) {
                        totalItensExtraidos += extraido.getItens().size();

                        String fornecedor = (fornecedorManual != null && !fornecedorManual.isBlank())
                                ? fornecedorManual : extraido.getNomeFornecedor();
                        String documento = (documentoManual != null && !documentoManual.isBlank())
                                ? documentoManual : (extraido.getNumeroOrcamento() != null ? extraido.getNumeroOrcamento() : file.getOriginalFilename());

                        int enfileirados = enfileirarItensLote(extraido.getItens(), fornecedor, documento, tipoFonte);
                        totalNovosEnfileirados += enfileirados;
                    }
                }
            } catch (Exception e) {
                System.err.println("Erro ao processar PDF para treinamento (" + file.getOriginalFilename() + "): " + e.getMessage());
            }
        }

        String msg = String.format("Processados %d arquivo(s) PDF com sucesso! %d produtos/itens extraídos pela IA, sendo %d novos adicionados à Fila de Treinamento.",
                nomesArquivos.size(), totalItensExtraidos, totalNovosEnfileirados);

        return new UploadPdfTreinamentoResponseDto(nomesArquivos.size(), totalItensExtraidos, totalNovosEnfileirados, nomesArquivos, msg);
    }

    public ItemTreinamentoDto obterProximoItemParaTreinar() {
        Optional<ItemTreinamentoFila> proximoOpt = itemTreinamentoFilaRepository.findFirstByStatusOrderByIdAsc("PENDENTE");
        if (proximoOpt.isEmpty()) {
            return null;
        }

        ItemTreinamentoFila itemFila = proximoOpt.get();

        // Garante que classificações sugeridas existam mesmo em itens previamente enfileirados
        if (itemFila.getCategoriaSugerida() == null || itemFila.getCategoriaSugerida().isBlank()) {
            ClassificacaoTecnicaDto auto = classificadorTecnicoService.extrairClassificacao(itemFila.getDescricaoBruta());
            itemFila.setCategoriaSugerida(auto.categoria());
            itemFila.setSubcategoriaSugerida(auto.subcategoria());
            itemFila.setAplicacoesSugeridas(String.join(", ", auto.aplicacoes()));
            itemFila.setCaracteristicasSugeridas(String.join(", ", auto.caracteristicas()));
            itemFila.setFabricanteSugerido(auto.fabricante());
            itemFila.setCodigoFabricanteSugerido(auto.codigoFabricante());
            itemTreinamentoFilaRepository.save(itemFila);
        }

        List<ItemCanonico> materiais = itemCanonicoRepository.findByAtivoTrueOrderByDescricaoPadraoAsc();
        List<SugestaoItemTreinamentoDto> sugestoes = gerarTopSugestoes(itemFila.getDescricaoBruta(), itemFila.getCategoriaSugerida(), itemFila.getDescricaoNormalizada(), materiais);

        List<String> appsSug = (itemFila.getAplicacoesSugeridas() != null && !itemFila.getAplicacoesSugeridas().isBlank())
                ? Arrays.stream(itemFila.getAplicacoesSugeridas().split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList()
                : List.of();
        List<String> caracSug = (itemFila.getCaracteristicasSugeridas() != null && !itemFila.getCaracteristicasSugeridas().isBlank())
                ? Arrays.stream(itemFila.getCaracteristicasSugeridas().split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList()
                : List.of();

        return new ItemTreinamentoDto(
                itemFila.getId(),
                itemFila.getDescricaoBruta(),
                itemFila.getUnidadeBruta(),
                itemFila.getFornecedorOrigem(),
                itemFila.getDocumentoOrigem(),
                itemFila.getTipoFonte(),
                itemFila.getStatus(),
                itemFila.getCategoriaSugerida(),
                itemFila.getSubcategoriaSugerida(),
                appsSug,
                caracSug,
                itemFila.getFabricanteSugerido(),
                itemFila.getCodigoFabricanteSugerido(),
                sugestoes
        );
    }

    private List<SugestaoItemTreinamentoDto> gerarTopSugestoes(String descBruta, String catSugerida, String normItem, List<ItemCanonico> materiais) {
        List<SugestaoItemTreinamentoDto> lista = new ArrayList<>();

        for (ItemCanonico mat : materiais) {
            // 1. PRÉ-FILTRO TÉCNICO OBRIGATÓRIO (PLAUSIBILIDADE):
            // Descarta imediatamente materiais de categorias incompatíveis (ex: Eletroduto vs Cabo, Disjuntor vs Caixa)
            if (classificadorTecnicoService.saoCategoriasIncompativeis(catSugerida, mat.getCategoria(), descBruta, mat.getDescricaoPadrao())) {
                continue;
            }

            ResultadoAvaliacaoEvidenciasDto aval = motorEvidenciasService.avaliarEvidencias(
                    normItem, mat.getUnidadePadrao(), null,
                    null, null, mat, BigDecimal.ONE,
                    false, false, null
            );

            // 2. LIMIAR MÍNIMO ESTRITO (THRESHOLD >= 30%):
            // - Descarta se houver conflito técnico bloqueante
            // - Descarta se a pontuação for < 30%
            if (aval.alertaConflito() != null || aval.confianca() < 30) {
                continue;
            }

            List<String> appsList = (mat.getAplicacoes() != null && !mat.getAplicacoes().isBlank())
                    ? Arrays.stream(mat.getAplicacoes().split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList()
                    : List.of();
            List<String> caracList = (mat.getCaracteristicas() != null && !mat.getCaracteristicas().isBlank())
                    ? Arrays.stream(mat.getCaracteristicas().split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList()
                    : List.of();

            String justificativa = !aval.motivos().isEmpty()
                    ? String.join(" • ", aval.motivos())
                    : "Similaridade de especificações (" + aval.confianca() + "%).";

            String origem = (mat.getOrigem() != null && !mat.getOrigem().isBlank())
                    ? mat.getOrigem() : "Catálogo Mestre";

            lista.add(new SugestaoItemTreinamentoDto(
                    mat.getId(),
                    mat.getDescricaoPadrao(),
                    mat.getUnidadePadrao(),
                    mat.getCategoria(),
                    mat.getSubcategoria(),
                    appsList,
                    caracList,
                    aval.confianca(),
                    justificativa,
                    null,
                    aval.motivos(),
                    aval.evidencias(),
                    origem
            ));
        }

        lista.sort(Comparator.comparingInt(SugestaoItemTreinamentoDto::confianca).reversed());
        return lista.stream().limit(4).collect(Collectors.toList());
    }

    @Transactional
    public ItemTreinamentoDto validarItemTreinamento(ValidarItemTreinamentoRequestDto request, String usuarioNome) {
        ItemTreinamentoFila itemFila = itemTreinamentoFilaRepository.findById(request.itemTreinamentoId())
                .orElseThrow(() -> new RuntimeException("Item da fila de treinamento não encontrado: ID " + request.itemTreinamentoId()));

        if ("IGNORAR".equalsIgnoreCase(request.acao())) {
            itemFila.setStatus("IGNORADO");
            itemFila.setValidadoPor(usuarioNome);
            itemFila.setDataValidacao(LocalDateTime.now());
            itemTreinamentoFilaRepository.save(itemFila);
            return obterProximoItemParaTreinar();
        }

        ItemCanonico canonico;
        if ("CRIAR_NOVO".equalsIgnoreCase(request.acao()) || request.itemCanonicoId() == null) {
            String descPadrao = (request.novaDescricaoCanonico() != null && !request.novaDescricaoCanonico().isBlank())
                    ? request.novaDescricaoCanonico().trim().toUpperCase()
                    : itemFila.getDescricaoBruta().trim().toUpperCase();

            String norm = normalizarTexto(descPadrao);
            canonico = itemCanonicoRepository.findByDescricaoNormalizada(norm)
                    .orElseGet(() -> {
                        ClassificacaoTecnicaDto extraida = classificadorTecnicoService.extrairClassificacao(descPadrao);
                        ItemCanonico novo = new ItemCanonico(
                                descPadrao, norm,
                                (request.unidadePadrao() != null && !request.unidadePadrao().isBlank()) ? request.unidadePadrao() : itemFila.getUnidadeBruta(),
                                (request.categoria() != null && !request.categoria().isBlank()) ? request.categoria() : extraida.categoria(),
                                usuarioNome
                        );
                        novo.setSubcategoria((request.subcategoria() != null && !request.subcategoria().isBlank()) ? request.subcategoria() : extraida.subcategoria());
                        novo.setAplicacoes((request.aplicacoes() != null && !request.aplicacoes().isBlank()) ? request.aplicacoes() : String.join(", ", extraida.aplicacoes()));
                        novo.setCaracteristicas((request.caracteristicas() != null && !request.caracteristicas().isBlank()) ? request.caracteristicas() : String.join(", ", extraida.caracteristicas()));
                        novo.setCodigoNcm(request.codigoNcm());
                        String origemReg = "Catálogo Mestre";
                        if (itemFila.getTipoFonte() != null) {
                            if (itemFila.getTipoFonte().contains("ORCAMENTO")) origemReg = "Orçamento Histórico";
                            else if (itemFila.getTipoFonte().contains("CATALOGO")) origemReg = "Catálogo Fabricante";
                            else if (itemFila.getTipoFonte().contains("PDF")) origemReg = "PDF Importado";
                        }
                        novo.setOrigem(origemReg);
                        return itemCanonicoRepository.save(novo);
                    });
        } else {
            canonico = itemCanonicoRepository.findById(request.itemCanonicoId())
                    .orElseThrow(() -> new RuntimeException("Material mestre não encontrado: ID " + request.itemCanonicoId()));
        }

        // 1. Cria ou atualiza o Alias permanente
        salvarOuAtualizarAlias(
                canonico, null, itemFila.getDescricaoBruta(),
                "TREINAMENTO_HISTORICO", null, usuarioNome
        );

        // 2. Se houver conversão de unidade específica informada pelo usuário, cadastra
        if (request.cadastrarConversao() && request.fatorConversao() != null && request.fatorConversao().compareTo(BigDecimal.ZERO) > 0) {
            String uOrig = (itemFila.getUnidadeBruta() != null && !itemFila.getUnidadeBruta().isBlank())
                    ? itemFila.getUnidadeBruta() : "UN";
            cadastrarConversaoItem(canonico.getId(), uOrig, canonico.getUnidadePadrao(), request.fatorConversao(), usuarioNome);
        }

        // 3. Atualiza status na fila
        itemFila.setStatus("VALIDADO");
        itemFila.setItemCanonicoEscolhido(canonico);
        itemFila.setValidadoPor(usuarioNome);
        itemFila.setDataValidacao(LocalDateTime.now());
        itemTreinamentoFilaRepository.save(itemFila);

        return obterProximoItemParaTreinar();
    }

    public EstatisticasTreinamentoDto obterEstatisticasTreinamento() {
        long pendentes = itemTreinamentoFilaRepository.countByStatus("PENDENTE");
        long validados = itemTreinamentoFilaRepository.countByStatus("VALIDADO");
        long ignorados = itemTreinamentoFilaRepository.countByStatus("IGNORADO");
        long total = pendentes + validados + ignorados;
        double pct = (total > 0) ? Math.round(((double) (validados + ignorados) / total) * 1000.0) / 10.0 : 0.0;

        return new EstatisticasTreinamentoDto(pendentes, validados, ignorados, total, pct);
    }

    @Transactional
    public void deletarMaterialMestre(Long id, String usuarioNome) {
        ItemCanonico item = itemCanonicoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Material mestre não encontrado: ID " + id));
        item.setAtivo(false);
        itemCanonicoRepository.save(item);
        if (auditoriaService != null) {
            auditoriaService.registrar("EXCLUSAO", "MATERIAL_MESTRE", id.toString(), "Material inativado: " + item.getDescricaoPadrao(), null);
        }
    }

    @Transactional
    public void zerarDadosTeste() {
        itemTreinamentoFilaRepository.deleteAll();
        itemConversaoUnidadeRepository.deleteAll();
        itemAliasRepository.deleteAll();
        itemCanonicoRepository.deleteAll();
        System.out.println("BASE DE CONCILIAÇÃO E TREINAMENTO ZERADA PARA INÍCIO LIMPO.");
    }
}
