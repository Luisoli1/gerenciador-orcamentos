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
    private AuditoriaService auditoriaService;

    @Autowired(required = false)
    private GeminiClient geminiClient;

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
    // 3. PIPELINE DE CONCILIAÇÃO MULTICAMADAS
    // ==========================================

    /**
     * Tenta conciliar um item de orçamento com os materiais mestre em 3 tiers.
     */
    public SugestaoConciliacaoDto resolverConciliacao(String descricaoOriginal, String unidadeOriginal,
                                                     BigDecimal quantidadeOriginal, BigDecimal precoUnitarioOriginal,
                                                     Long fornecedorId, String fornecedorNome,
                                                     List<ItemCanonico> cacheMateriais) {
        if (descricaoOriginal == null || descricaoOriginal.isBlank()) {
            return null;
        }

        String norm = normalizarTexto(descricaoOriginal);
        String uOrig = normalizarUnidade(unidadeOriginal);

        // --- TIER 1: Dicionário De-Para Conhecido (100% Confiança) ---
        List<ItemAlias> aliases = itemAliasRepository.buscarMelhorMatchAlias(norm, fornecedorId);
        if (!aliases.isEmpty()) {
            ItemAlias alias = aliases.get(0);
            ItemCanonico canonico = alias.getItemCanonico();
            if (canonico != null && canonico.isAtivo()) {
                BigDecimal fator = obterFatorConversao(canonico.getId(), uOrig, canonico.getUnidadePadrao());
                BigDecimal qtdConvertida = (quantidadeOriginal != null) ? quantidadeOriginal.multiply(fator) : null;
                BigDecimal precoConvertido = (precoUnitarioOriginal != null && fator.compareTo(BigDecimal.ZERO) > 0)
                        ? precoUnitarioOriginal.divide(fator, 4, RoundingMode.HALF_UP)
                        : precoUnitarioOriginal;

                return new SugestaoConciliacaoDto(
                        descricaoOriginal, fornecedorNome, fornecedorId,
                        canonico.getId(), canonico.getDescricaoPadrao(),
                        100, "Encontrado no dicionário De-Para permanente.",
                        "TIER1_ALIAS", uOrig, canonico.getUnidadePadrao(),
                        fator, quantidadeOriginal, qtdConvertida, precoUnitarioOriginal, precoConvertido
                );
            }
        }

        // --- TIER 2: Similaridade Sintática e Numérica Local ---
        List<ItemCanonico> materiais = (cacheMateriais != null) ? cacheMateriais : itemCanonicoRepository.findByAtivoTrueOrderByDescricaoPadraoAsc();
        ItemCanonico melhorMatchSintatico = null;
        int melhorScore = 0;
        String justificativaSintatica = "";

        List<String> numerosA = extrairTokensNumericos(norm);

        for (ItemCanonico mat : materiais) {
            String normMat = mat.getDescricaoNormalizada();
            if (norm.equals(normMat)) {
                melhorMatchSintatico = mat;
                melhorScore = 98;
                justificativaSintatica = "Texto normalizado idêntico ao material cadastrado.";
                break;
            }

            List<String> numerosB = extrairTokensNumericos(normMat);
            if (!numerosA.isEmpty() && !numerosB.isEmpty()) {
                boolean temNumeroComum = numerosA.stream().anyMatch(numerosB::contains);
                if (!temNumeroComum) {
                    continue; // Medidas numéricas diferentes -> produtos distintos
                }
            }

            int score = calcularScoreSobreposicao(norm, normMat);
            if (score > melhorScore && score >= 75) {
                melhorScore = score;
                melhorMatchSintatico = mat;
                justificativaSintatica = "Forte sobreposição técnica (" + score + "% de similaridade) e medidas compatíveis.";
            }
        }

        if (melhorMatchSintatico != null && melhorScore >= 80) {
            BigDecimal fator = obterFatorConversao(melhorMatchSintatico.getId(), uOrig, melhorMatchSintatico.getUnidadePadrao());
            BigDecimal qtdConvertida = (quantidadeOriginal != null) ? quantidadeOriginal.multiply(fator) : null;
            BigDecimal precoConvertido = (precoUnitarioOriginal != null && fator.compareTo(BigDecimal.ZERO) > 0)
                    ? precoUnitarioOriginal.divide(fator, 4, RoundingMode.HALF_UP)
                    : precoUnitarioOriginal;

            return new SugestaoConciliacaoDto(
                    descricaoOriginal, fornecedorNome, fornecedorId,
                    melhorMatchSintatico.getId(), melhorMatchSintatico.getDescricaoPadrao(),
                    melhorScore, justificativaSintatica,
                    "TIER2_SINTATICO", uOrig, melhorMatchSintatico.getUnidadePadrao(),
                    fator, quantidadeOriginal, qtdConvertida, precoUnitarioOriginal, precoConvertido
            );
        }

        return null; // Item sem match direto conhecido
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

        // 1. Resolve cada item de cada orçamento pelo pipeline
        Map<String, SugestaoConciliacaoDto> sugestoesPorDescricao = new HashMap<>();
        List<SugestaoConciliacaoDto> todasSugestoes = new ArrayList<>();

        for (QuadroConcorrenciaDto orc : orcs) {
            if (orc.getItens() == null) continue;
            for (ItemQuadroDTO it : orc.getItens()) {
                if (it.descricao() == null) continue;
                SugestaoConciliacaoDto sug = resolverConciliacao(
                        it.descricao(), it.unidadeMedida(), it.quantidade(), it.valorUnitario(),
                        null, orc.getNomeFornecedor(), materiaisAtivos
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

            // Identifica itens com apenas 1 fornecedor (linhas 'órfãs') para revisão
            for (QuadroConcorrenciaDto orc : orcs) {
                if (orc.getItens() == null) continue;
                for (ItemQuadroDTO it : orc.getItens()) {
                    String norm = normalizarTexto(it.descricao());
                    SugestaoConciliacaoDto sug = sugestoesPorDescricao.get(norm);
                    if (sug == null || sug.confianca() < 95) {
                        List<String> faltantes = orcs.stream()
                                .map(QuadroConcorrenciaDto::getNomeFornecedor)
                                .filter(f -> !Objects.equals(f, orc.getNomeFornecedor()))
                                .collect(Collectors.toList());

                        discrepancias.add(new DiscrepanciaItemDto(
                                it.descricao(), orc.getNomeFornecedor(), faltantes,
                                (sug != null) ? List.of(sug) : List.of()
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

            ItemTreinamentoFila filaItem = new ItemTreinamentoFila(
                    it.descricao().trim(),
                    norm,
                    normalizarUnidade(it.unidadeMedida()),
                    fornecedorOrigem,
                    documentoOrigem,
                    tipoFonte
            );
            itemTreinamentoFilaRepository.save(filaItem);
            novosEnfileirados++;
        }
        return novosEnfileirados;
    }

    public ItemTreinamentoDto obterProximoItemParaTreinar() {
        Optional<ItemTreinamentoFila> proximoOpt = itemTreinamentoFilaRepository.findFirstByStatusOrderByIdAsc("PENDENTE");
        if (proximoOpt.isEmpty()) {
            return null;
        }

        ItemTreinamentoFila itemFila = proximoOpt.get();
        List<ItemCanonico> materiais = itemCanonicoRepository.findByAtivoTrueOrderByDescricaoPadraoAsc();
        List<SugestaoItemTreinamentoDto> sugestoes = gerarTopSugestoes(itemFila.getDescricaoNormalizada(), materiais);

        return new ItemTreinamentoDto(
                itemFila.getId(),
                itemFila.getDescricaoBruta(),
                itemFila.getUnidadeBruta(),
                itemFila.getFornecedorOrigem(),
                itemFila.getDocumentoOrigem(),
                itemFila.getTipoFonte(),
                itemFila.getStatus(),
                sugestoes
        );
    }

    private List<SugestaoItemTreinamentoDto> gerarTopSugestoes(String normItem, List<ItemCanonico> materiais) {
        List<SugestaoItemTreinamentoDto> lista = new ArrayList<>();
        List<String> numsA = extrairTokensNumericos(normItem);

        for (ItemCanonico mat : materiais) {
            String normMat = mat.getDescricaoNormalizada();
            int score = 0;
            String justificativa;

            if (normItem.equals(normMat)) {
                score = 98;
                justificativa = "Texto exato pós-normalização.";
            } else {
                List<String> numsB = extrairTokensNumericos(normMat);
                if (!numsA.isEmpty() && !numsB.isEmpty()) {
                    boolean temNum = numsA.stream().anyMatch(numsB::contains);
                    if (!temNum) {
                        continue; // números técnicos incompatíveis não são sugeridos
                    }
                }
                score = calcularScoreSobreposicao(normItem, normMat);
                justificativa = "Similaridade de termos técnicos (" + score + "%).";
            }

            if (score >= 40) {
                lista.add(new SugestaoItemTreinamentoDto(
                        mat.getId(),
                        mat.getDescricaoPadrao(),
                        mat.getUnidadePadrao(),
                        mat.getCategoria(),
                        score,
                        justificativa
                ));
            }
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
                        ItemCanonico novo = new ItemCanonico(
                                descPadrao, norm,
                                (request.unidadePadrao() != null && !request.unidadePadrao().isBlank()) ? request.unidadePadrao() : itemFila.getUnidadeBruta(),
                                request.categoria(),
                                usuarioNome
                        );
                        novo.setCodigoNcm(request.codigoNcm());
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
}
