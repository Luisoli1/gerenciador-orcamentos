import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Dropzone } from '../components/Dropzone';
import type { 
  ItemAlias, 
  ItemCanonico, 
  ConversaoPadrao, 
  ItemTreinamento, 
  EstatisticasTreinamento, 
  ItemQuadroDTO,
  RegraAtributoBloqueante 
} from '../types';
import { 
  BookOpen, 
  Search, 
  Layers, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Scale, 
  HelpCircle, 
  Tag, 
  ArrowRight, 
  ShieldCheck, 
  ShieldAlert, 
  Calendar, 
  User, 
  SlidersHorizontal, 
  X, 
  Sparkles, 
  Check, 
  SkipForward, 
  FileText, 
  Upload, 
  UploadCloud,
  Zap, 
  ChevronRight, 
  Keyboard 
} from 'lucide-react';

export function CatalogoMateriaisView() {
  const [activeTab, setActiveTab] = useState<'aliases' | 'materiais' | 'conversoes' | 'treinamento' | 'bloqueios'>('aliases');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [regrasBloqueantes, setRegrasBloqueantes] = useState<RegraAtributoBloqueante[]>([]);

  // Estados de Aliases
  const [aliases, setAliases] = useState<ItemAlias[]>([]);
  const [filtroAlias, setFiltroAlias] = useState('');
  const [aliasEditando, setAliasEditando] = useState<ItemAlias | null>(null);
  const [novoMaterialId, setNovoMaterialId] = useState<number | ''>('');
  const [novaDescricaoMestre, setNovaDescricaoMestre] = useState('');
  const [novaUnidadeMestre, setNovaUnidadeMestre] = useState('UN');
  const [novaCategoriaMestre, setNovaCategoriaMestre] = useState('');
  const [modoCriarNovoNoAlias, setModoCriarNovoNoAlias] = useState(false);
  const [salvandoAlias, setSalvandoAlias] = useState(false);

  // Estados de Materiais Mestre
  const [materiais, setMateriais] = useState<ItemCanonico[]>([]);
  const [filtroMaterial, setFiltroMaterial] = useState('');
  const [modalNovoMaterial, setModalNovoMaterial] = useState(false);
  const [cadDescricao, setCadDescricao] = useState('');
  const [cadUnidade, setCadUnidade] = useState('UN');
  const [cadCategoria, setCadCategoria] = useState('');
  const [cadSubcategoria, setCadSubcategoria] = useState('');
  const [cadAplicacoes, setCadAplicacoes] = useState('');
  const [cadCaracteristicas, setCadCaracteristicas] = useState('');
  const [cadNcm, setCadNcm] = useState('');
  const [cadCodigo, setCadCodigo] = useState('');
  const [salvandoMaterial, setSalvandoMaterial] = useState(false);
  const [extraindoClassificacao, setExtraindoClassificacao] = useState(false);

  // Estados de Conversões
  const [conversoes, setConversoes] = useState<ConversaoPadrao[]>([]);

  // Estados da Fila de Treinamento (Modo Validação em Massa)
  const [itemTreinando, setItemTreinando] = useState<ItemTreinamento | null>(null);
  const [estatisticas, setEstatisticas] = useState<EstatisticasTreinamento | null>(null);
  const [opcaoTreino, setOpcaoTreino] = useState<'sugestao' | 'novo' | 'existente' | 'ignorar'>('sugestao');
  const [sugestaoEscolhidaIdx, setSugestaoEscolhidaIdx] = useState<number>(0);
  const [materialExistenteId, setMaterialExistenteId] = useState<number | ''>('');
  const [filtroMaterialTreino, setFiltroMaterialTreino] = useState('');
  const [novoTreinoDescricao, setNovoTreinoDescricao] = useState('');
  const [novoTreinoUnidade, setNovoTreinoUnidade] = useState('UN');
  const [novoTreinoCategoria, setNovoTreinoCategoria] = useState('');
  const [novoTreinoSubcategoria, setNovoTreinoSubcategoria] = useState('');
  const [novoTreinoAplicacoes, setNovoTreinoAplicacoes] = useState('');
  const [novoTreinoCaracteristicas, setNovoTreinoCaracteristicas] = useState('');
  const [cadastrarConversaoTreino, setCadastrarConversaoTreino] = useState(false);
  const [fatorConversaoTreino, setFatorConversaoTreino] = useState<number>(1);
  const [processandoTreino, setProcessandoTreino] = useState(false);

  // Modal de Enfileirar Lote (PDF ou Manual)
  const [modalLoteAberto, setModalLoteAberto] = useState(false);
  const [modoImportacao, setModoImportacao] = useState<'pdf' | 'manual'>('pdf');
  const [arquivosPdf, setArquivosPdf] = useState<File[]>([]);
  const [progressoPdf, setProgressoPdf] = useState<{ atual: number; total: number; nomeAtual: string; statusEtapa?: string } | null>(null);
  const cancelarEnvioRef = React.useRef(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const [loteTexto, setLoteTexto] = useState('');
  const [loteFornecedor, setLoteFornecedor] = useState('');
  const [loteDocumento, setLoteDocumento] = useState('');
  const [loteTipoFonte, setLoteTipoFonte] = useState<'ORCAMENTO_HISTORICO' | 'CATALOGO_FABRICANTE'>('ORCAMENTO_HISTORICO');
  const [enfileirandoLote, setEnfileirandoLote] = useState(false);

  // Carregamento de Dados Gerais com fallback resiliente para evitar falsos erros
  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resAliases, resMateriais, resConversoes, resRegras] = await Promise.all([
        api.listarAliases(filtroAlias).catch(() => []),
        api.listarMateriaisMestre(filtroMaterial).catch(() => []),
        api.listarConversoesPadrao().catch(() => []),
        api.listarRegrasAtributosBloqueantes().catch(() => [])
      ]);
      setAliases(resAliases);
      setMateriais(resMateriais);
      setConversoes(resConversoes);
      if (resRegras && resRegras.length > 0) {
        setRegrasBloqueantes(resRegras);
      }
    } catch (err: any) {
      console.warn('Aviso ao carregar dados do catálogo:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregamento da Fila de Treinamento
  const carregarFilaTreinamento = useCallback(async () => {
    try {
      const [proximo, stats] = await Promise.all([
        api.obterProximoItemTreinamento(),
        api.obterEstatisticasTreinamento()
      ]);
      setItemTreinando(proximo);
      setEstatisticas(stats);

      if (proximo) {
        setOpcaoTreino(proximo.sugestoes && proximo.sugestoes.length > 0 ? 'sugestao' : 'novo');
        setSugestaoEscolhidaIdx(0);
        setMaterialExistenteId('');
        setFiltroMaterialTreino('');
        setNovoTreinoDescricao(proximo.descricaoBruta);
        setNovoTreinoUnidade(proximo.unidadeBruta || 'UN');
        setNovoTreinoCategoria(proximo.categoriaSugerida || '');
        setNovoTreinoSubcategoria(proximo.subcategoriaSugerida || '');
        setNovoTreinoAplicacoes(proximo.aplicacoesSugeridas?.join(', ') || '');
        setNovoTreinoCaracteristicas(proximo.caracteristicasSugeridas?.join(', ') || '');
        setCadastrarConversaoTreino(false);
        setFatorConversaoTreino(1);
      }
    } catch (err: any) {
      console.error('Erro ao carregar fila de treinamento:', err);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (activeTab === 'treinamento') {
      carregarFilaTreinamento();
    }
  }, [activeTab, carregarFilaTreinamento]);

  const handleBuscarAliases = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.listarAliases(filtroAlias);
      setAliases(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao filtrar aliases.');
    } finally {
      setLoading(false);
    }
  };

  const handleBuscarMateriais = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.listarMateriaisMestre(filtroMaterial);
      setMateriais(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao filtrar materiais.');
    } finally {
      setLoading(false);
    }
  };

  // Desfazer / Inativar Alias
  const handleInativarAlias = async (alias: ItemAlias) => {
    if (!window.confirm(`Tem certeza que deseja desvincular o termo "${alias.descricaoOriginal}"? Nas próximas cotações, o sistema perguntará novamente ao usuário.`)) {
      return;
    }
    setLoading(true);
    try {
      await api.inativarAlias(alias.id);
      setSucesso(`Associação de "${alias.descricaoOriginal}" desfeita com sucesso!`);
      setTimeout(() => setSucesso(null), 4000);
      await carregarDados();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao desvincular alias.');
    } finally {
      setLoading(false);
    }
  };

  // Reassociar / Editar Alias
  const abrirModalEditarAlias = (alias: ItemAlias) => {
    setAliasEditando(alias);
    setNovoMaterialId(alias.itemCanonicoId || '');
    setNovaDescricaoMestre('');
    setModoCriarNovoNoAlias(false);
  };

  const handleSalvarReassociacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aliasEditando) return;

    if (!modoCriarNovoNoAlias && !novoMaterialId) {
      alert('Selecione o material mestre correspondente.');
      return;
    }
    if (modoCriarNovoNoAlias && !novaDescricaoMestre.trim()) {
      alert('Digite o nome do novo material mestre.');
      return;
    }

    setSalvandoAlias(true);
    try {
      await api.reassociarAlias(aliasEditando.id, {
        novoItemCanonicoId: !modoCriarNovoNoAlias && novoMaterialId ? Number(novoMaterialId) : undefined,
        novaDescricaoCanonico: modoCriarNovoNoAlias ? novaDescricaoMestre.trim() : undefined,
        unidadePadrao: novaUnidadeMestre,
        categoria: novaCategoriaMestre || undefined,
      });

      setSucesso(`Associação de "${aliasEditando.descricaoOriginal}" atualizada com sucesso!`);
      setAliasEditando(null);
      setTimeout(() => setSucesso(null), 4000);
      await carregarDados();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erro ao reassociar alias.');
    } finally {
      setSalvandoAlias(false);
    }
  };

  // Auto-classificar com IA na criação de Material Mestre
  const handleAutoClassificar = async () => {
    if (!cadDescricao.trim()) return;
    setExtraindoClassificacao(true);
    try {
      const info = await api.extrairClassificacaoTecnica(cadDescricao.trim());
      if (info.categoria) setCadCategoria(info.categoria);
      if (info.subcategoria) setCadSubcategoria(info.subcategoria);
      if (info.aplicacoes && info.aplicacoes.length > 0) setCadAplicacoes(info.aplicacoes.join(', '));
      if (info.caracteristicas && info.caracteristicas.length > 0) setCadCaracteristicas(info.caracteristicas.join(', '));
      if (info.unidadeSugerida) setCadUnidade(info.unidadeSugerida);
    } catch (e) {
      console.error('Erro na extração de classificação:', e);
    } finally {
      setExtraindoClassificacao(false);
    }
  };

  // Criar Novo Material Mestre
  const handleCriarMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cadDescricao.trim()) {
      alert('A descrição do material mestre é obrigatória.');
      return;
    }

    setSalvandoMaterial(true);
    try {
      await api.criarMaterialMestre({
        descricaoPadrao: cadDescricao.trim(),
        unidadePadrao: cadUnidade,
        categoria: cadCategoria.trim() || undefined,
        subcategoria: cadSubcategoria.trim() || undefined,
        aplicacoes: cadAplicacoes.trim() || undefined,
        caracteristicas: cadCaracteristicas.trim() || undefined,
        codigoNcm: cadNcm.trim() || undefined,
        codigoReferencia: cadCodigo.trim() || undefined,
      });

      setSucesso(`Material mestre "${cadDescricao.trim()}" cadastrado com sucesso!`);
      setModalNovoMaterial(false);
      setCadDescricao('');
      setCadCategoria('');
      setCadSubcategoria('');
      setCadAplicacoes('');
      setCadCaracteristicas('');
      setCadNcm('');
      setCadCodigo('');
      setTimeout(() => setSucesso(null), 4000);
      await carregarDados();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erro ao criar material mestre.');
    } finally {
      setSalvandoMaterial(false);
    }
  };

  // Enfileirar via Upload de Múltiplos PDFs com IA Gemini - Processamento Resiliente Arquivo a Arquivo
  const handleUploadPdfsTreinamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (arquivosPdf.length === 0) {
      alert('Por favor, selecione ao menos um arquivo PDF de catálogo ou orçamento.');
      return;
    }

    cancelarEnvioRef.current = false;
    setEnfileirandoLote(true);
    let totalProcessados = 0;
    let totalItens = 0;
    let totalNovos = 0;
    const errosOcorridos: string[] = [];

    try {
      for (let i = 0; i < arquivosPdf.length; i++) {
        if (cancelarEnvioRef.current) {
          errosOcorridos.push('Processamento interrompido a pedido do usuário.');
          break;
        }

        const file = arquivosPdf[i];
        abortControllerRef.current = new AbortController();

        setProgressoPdf({
          atual: i + 1,
          total: arquivosPdf.length,
          nomeAtual: file.name,
          statusEtapa: `Iniciando envio de ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`
        });

        try {
          // Envia um arquivo por vez: com AbortController e acompanhamento de upload em tempo real
          const resp = await api.uploadPdfsTreinamento(
            [file],
            loteTipoFonte,
            loteFornecedor.trim() || undefined,
            loteDocumento.trim() || undefined,
            abortControllerRef.current.signal,
            (progressEvent) => {
              if (progressEvent.total) {
                const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                const mbLoaded = (progressEvent.loaded / (1024 * 1024)).toFixed(1);
                const mbTotal = (progressEvent.total / (1024 * 1024)).toFixed(1);
                setProgressoPdf(prev => prev ? {
                  ...prev,
                  statusEtapa: pct < 100 
                    ? `Enviando arquivo: ${mbLoaded} MB de ${mbTotal} MB (${pct}%)...`
                    : 'Arquivo recebido na nuvem! IA Gemini analisando produtos e tabelas...'
                } : null);
              }
            }
          );

          totalProcessados += (resp.totalArquivosProcessados || 1);
          totalItens += (resp.totalItensExtraidos || 0);
          totalNovos += (resp.totalNovosEnfileirados || 0);
        } catch (itemErr: any) {
          if (cancelarEnvioRef.current || itemErr?.name === 'CanceledError' || itemErr?.code === 'ERR_CANCELED') {
            errosOcorridos.push(`${file.name}: Interrompido pelo usuário.`);
            break;
          }
          console.error(`Erro ao processar ${file.name}:`, itemErr);
          const msgErro = itemErr?.response?.data?.message || itemErr?.message || 'Falha de comunicação/timeout';
          errosOcorridos.push(`${file.name}: ${msgErro}`);
        }
      }

      if (totalProcessados > 0) {
        let msg = `Concluído! ${totalProcessados} de ${arquivosPdf.length} PDF(s) processados com sucesso. ${totalItens} itens identificados pela IA (${totalNovos} novos itens adicionados à fila de treinamento).`;
        if (errosOcorridos.length > 0) {
          msg += ` Atenção: ${errosOcorridos.length} arquivo(s) tiveram avisos: ${errosOcorridos.join('; ')}`;
        }
        setSucesso(msg);
        setModalLoteAberto(false);
        setArquivosPdf([]);
        setLoteTexto('');
        setLoteFornecedor('');
        setLoteDocumento('');
        setTimeout(() => setSucesso(null), 6000);
        await carregarFilaTreinamento();
      } else {
        alert(`Não foi possível processar os PDFs selecionados.\n\nDetalhes:\n${errosOcorridos.join('\n') || 'Verifique se o backend no Render já concluiu a reinicialização da versão atualizada.'}`);
      }
    } finally {
      setEnfileirandoLote(false);
      setProgressoPdf(null);
      cancelarEnvioRef.current = false;
    }
  };

  // Enfileirar Lote de Textos Históricos (Entrada Manual)
  const handleEnfileirarLote = async (e: React.FormEvent) => {
    e.preventDefault();
    const linhas = loteTexto
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (linhas.length === 0) {
      alert('Insira ao menos um item para enfileirar.');
      return;
    }

    setEnfileirandoLote(true);
    try {
      const itensDto: ItemQuadroDTO[] = linhas.map(l => {
        // Tenta identificar unidade se informada no formato "Item - 30 BR" ou apenas texto
        return {
          descricao: l,
          unidadeMedida: 'UN',
        };
      });

      const qtd = await api.enfileirarItensTreinamento(
        itensDto,
        loteFornecedor.trim() || undefined,
        loteDocumento.trim() || 'Importação Manual',
        loteTipoFonte
      );

      setSucesso(`${qtd} novos itens enfileirados para treinamento!`);
      setModalLoteAberto(false);
      setLoteTexto('');
      setLoteFornecedor('');
      setLoteDocumento('');
      setTimeout(() => setSucesso(null), 4000);
      await carregarFilaTreinamento();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erro ao enfileirar lote.');
    } finally {
      setEnfileirandoLote(false);
    }
  };

  // Confirmar Item no Treinamento em Massa
  const handleConfirmarTreinamento = async () => {
    if (!itemTreinando) return;
    setProcessandoTreino(true);

    try {
      let acao: 'VINCULAR_EXISTENTE' | 'CRIAR_NOVO' | 'IGNORAR' = 'VINCULAR_EXISTENTE';
      let itemCanonicoId: number | undefined;

      if (opcaoTreino === 'ignorar') {
        acao = 'IGNORAR';
      } else if (opcaoTreino === 'novo') {
        acao = 'CRIAR_NOVO';
      } else if (opcaoTreino === 'existente') {
        if (!materialExistenteId) {
          alert('Por favor, selecione qual Material Mestre existente corresponde a este item.');
          setProcessandoTreino(false);
          return;
        }
        acao = 'VINCULAR_EXISTENTE';
        itemCanonicoId = Number(materialExistenteId);
      } else {
        const sug = itemTreinando.sugestoes[sugestaoEscolhidaIdx];
        if (!sug) {
          acao = 'CRIAR_NOVO';
        } else {
          itemCanonicoId = sug.itemCanonicoId;
        }
      }

      const proximo = await api.validarItemTreinamento({
        itemTreinamentoId: itemTreinando.id,
        acao,
        itemCanonicoId,
        novaDescricaoCanonico: opcaoTreino === 'novo' ? novoTreinoDescricao.trim() : undefined,
        unidadePadrao: novoTreinoUnidade,
        categoria: novoTreinoCategoria || undefined,
        subcategoria: novoTreinoSubcategoria || undefined,
        aplicacoes: novoTreinoAplicacoes || undefined,
        caracteristicas: novoTreinoCaracteristicas || undefined,
        cadastrarConversao: cadastrarConversaoTreino,
        fatorConversao: cadastrarConversaoTreino ? Number(fatorConversaoTreino) : undefined,
      });

      // Atualiza estatísticas e item
      const stats = await api.obterEstatisticasTreinamento();
      setEstatisticas(stats);
      setItemTreinando(proximo);

      if (proximo) {
        setOpcaoTreino(proximo.sugestoes && proximo.sugestoes.length > 0 ? 'sugestao' : 'novo');
        setSugestaoEscolhidaIdx(0);
        setMaterialExistenteId('');
        setFiltroMaterialTreino('');
        setNovoTreinoDescricao(proximo.descricaoBruta);
        setNovoTreinoUnidade(proximo.unidadeBruta || 'UN');
        setNovoTreinoCategoria(proximo.categoriaSugerida || '');
        setNovoTreinoSubcategoria(proximo.subcategoriaSugerida || '');
        setNovoTreinoAplicacoes(proximo.aplicacoesSugeridas?.join(', ') || '');
        setNovoTreinoCaracteristicas(proximo.caracteristicasSugeridas?.join(', ') || '');
        setCadastrarConversaoTreino(false);
        setFatorConversaoTreino(1);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erro ao validar item.');
    } finally {
      setProcessandoTreino(false);
    }
  };

  // Atalhos de Teclado no Treinador
  useEffect(() => {
    if (activeTab !== 'treinamento' || !itemTreinando || modalLoteAberto) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se estiver digitando em campo de texto
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === '1' && itemTreinando.sugestoes.length >= 1) {
        setOpcaoTreino('sugestao');
        setSugestaoEscolhidaIdx(0);
      } else if (e.key === '2' && itemTreinando.sugestoes.length >= 2) {
        setOpcaoTreino('sugestao');
        setSugestaoEscolhidaIdx(1);
      } else if (e.key === '3' && itemTreinando.sugestoes.length >= 3) {
        setOpcaoTreino('sugestao');
        setSugestaoEscolhidaIdx(2);
      } else if (e.key.toLowerCase() === 'n') {
        setOpcaoTreino('novo');
      } else if (e.key.toLowerCase() === 'e') {
        setOpcaoTreino('existente');
      } else if (e.key.toLowerCase() === 'i') {
        setOpcaoTreino('ignorar');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirmarTreinamento();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, itemTreinando, opcaoTreino, sugestaoEscolhidaIdx, modalLoteAberto, novoTreinoDescricao, cadastrarConversaoTreino, fatorConversaoTreino]);

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Catálogo & Base de Conhecimento</h1>
              <p className="text-sm text-slate-400 mt-1">
                Construção contínua da inteligência da Makinsthal: catálogos, orçamentos históricos, equivalência e conversão de unidades.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={carregarDados}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700/70 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-600/60 transition shadow-sm font-medium text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>

          {activeTab === 'materiais' && (
            <button
              onClick={() => setModalNovoMaterial(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-xl shadow-lg shadow-amber-500/20 transition text-sm"
            >
              <Plus className="w-4 h-4" />
              Novo Material Mestre
            </button>
          )}

          {activeTab === 'treinamento' && (
            <button
              onClick={() => setModalLoteAberto(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition text-sm"
            >
              <Upload className="w-4 h-4" />
              Importar / Enfileirar Itens
            </button>
          )}
        </div>
      </div>

      {/* MENSAGENS DE STATUS */}
      {sucesso && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{sucesso}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ABAS DE NAVEGAÇÃO */}
      <div className="flex items-center gap-2 border-b border-slate-700/60 pb-3 flex-wrap">
        <button
          onClick={() => setActiveTab('treinamento')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition ${
            activeTab === 'treinamento'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
              : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Treinador de Materiais (Modo em Massa)</span>
          {estatisticas && estatisticas.totalPendentes > 0 && (
            <span className="px-2 py-0.5 bg-slate-950/80 text-amber-300 rounded-full text-xs font-mono font-bold">
              {estatisticas.totalPendentes}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('aliases')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition ${
            activeTab === 'aliases'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Tag className="w-4 h-4" />
          Sinônimos & De-Para ({aliases.length})
        </button>

        <button
          onClick={() => setActiveTab('materiais')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition ${
            activeTab === 'materiais'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          Materiais Mestre ({materiais.length})
        </button>

        <button
          onClick={() => setActiveTab('conversoes')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition ${
            activeTab === 'conversoes'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Scale className="w-4 h-4" />
          Conversão de Unidades ({conversoes.length})
        </button>

        <button
          onClick={() => setActiveTab('bloqueios')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition ${
            activeTab === 'bloqueios'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 font-bold'
              : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Atributos Bloqueantes & Anti-Evidências</span>
        </button>
      </div>

      {/* ABA 4: TREINADOR DE MATERIAIS (MODO VALIDAÇÃO EM MASSA) */}
      {activeTab === 'treinamento' && (
        <div className="space-y-6">
          {/* BARRA DE PROGRESSO & MÉTRICAS */}
          {estatisticas && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-800/70 border border-slate-700/80 rounded-2xl">
                <span className="text-xs text-slate-400">Pendentes para Validar</span>
                <p className="text-2xl font-bold text-amber-400 font-mono mt-1">
                  {estatisticas.totalPendentes}
                </p>
              </div>

              <div className="p-4 bg-slate-800/70 border border-slate-700/80 rounded-2xl">
                <span className="text-xs text-slate-400">Validados & Aprendidos</span>
                <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                  {estatisticas.totalValidados}
                </p>
              </div>

              <div className="p-4 bg-slate-800/70 border border-slate-700/80 rounded-2xl">
                <span className="text-xs text-slate-400">Ignorados / Descartados</span>
                <p className="text-2xl font-bold text-slate-400 font-mono mt-1">
                  {estatisticas.totalIgnorados}
                </p>
              </div>

              <div className="p-4 bg-slate-800/70 border border-slate-700/80 rounded-2xl flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Progresso Geral</span>
                  <span className="text-xs font-bold text-amber-400 font-mono">{estatisticas.percentualConcluido}%</span>
                </div>
                <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden mt-2">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${estatisticas.percentualConcluido}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ÁREA CENTRAL DO ITEM EM TREINAMENTO */}
          {itemTreinando ? (
            <div className="bg-slate-800/90 border border-amber-500/30 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
              
              {/* CABEÇALHO DO ITEM EM FOCO */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/70 pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold rounded-lg uppercase tracking-wider">
                      Item Bruto Encontrado
                    </span>
                    <span className="px-2.5 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-lg font-medium">
                      Fonte: {itemTreinando.tipoFonte === 'ORCAMENTO_HISTORICO' ? 'Orçamento Histórico' : 'Catálogo'}
                    </span>
                    {itemTreinando.fornecedorOrigem && (
                      <span className="px-2.5 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-lg">
                        Fornecedor: <strong>{itemTreinando.fornecedorOrigem}</strong>
                      </span>
                    )}
                    {itemTreinando.documentoOrigem && (
                      <span className="text-xs text-slate-400">
                        ({itemTreinando.documentoOrigem})
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl md:text-3xl font-extrabold font-mono text-white tracking-wide">
                    "{itemTreinando.descricaoBruta}"
                  </h2>
                </div>

                <div className="flex items-center gap-2 self-start md:self-center">
                  <span className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-slate-300">
                    Unidade: <strong className="text-amber-400">{itemTreinando.unidadeBruta || 'UN'}</strong>
                  </span>
                </div>
              </div>

              {/* CLASSIFICAÇÃO TÉCNICA ESTRUTURADA IDENTIFICADA PELA IA */}
              <div className="p-4 bg-slate-900/90 border border-slate-700/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Classificação Técnica Extraída Automaticamente:
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Atributos auxiliares para busca, filtros e IA
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {itemTreinando.categoriaSugerida && (
                    <span className="px-2.5 py-1 bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold">
                      📁 Categoria: {itemTreinando.categoriaSugerida}
                    </span>
                  )}
                  {itemTreinando.subcategoriaSugerida && (
                    <span className="px-2.5 py-1 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-semibold">
                      🏷️ Subcategoria: {itemTreinando.subcategoriaSugerida}
                    </span>
                  )}
                  {itemTreinando.aplicacoesSugeridas && itemTreinando.aplicacoesSugeridas.map((app, i) => (
                    <span key={i} className="px-2.5 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-lg text-xs">
                      🏢 Aplicação: {app}
                    </span>
                  ))}
                  {itemTreinando.caracteristicasSugeridas && itemTreinando.caracteristicasSugeridas.map((car, i) => (
                    <span key={i} className="px-2.5 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-lg text-xs font-mono">
                      ⚡ {car}
                    </span>
                  ))}
                  {itemTreinando.fabricanteSugerido && (
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-lg text-xs">
                      🏭 Fabricante: {itemTreinando.fabricanteSugerido}
                    </span>
                  )}
                </div>

                {/* DIRETRIZ FUNDAMENTAL: FINALIDADE NÃO GERA MERGE */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-start gap-2.5 text-xs text-amber-200/90">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-300 font-bold block mb-0.5">
                      Diretriz Makinsthal: Mesma aplicação não significa mesmo produto!
                    </strong>
                    <span>
                      Materiais com a mesma finalidade (ex: <em>Laje</em>) porém com tecnologias distintas (ex: <em>Ponta Azul</em> vs <em>Convencional</em>, ou <em>Skybox Selada</em> vs <em>Snap Fit</em>) devem ser mantidos como <strong>materiais separados [N]</strong> para comparar alternativas no QC.
                    </span>
                  </div>
                </div>
              </div>

              {/* OPÇÃO 1: SUGESTÕES DA IA / SINTÁTICO */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Sugestões Ranqueadas pela IA (A decisão final é sua):
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Keyboard className="w-3.5 h-3.5" />
                    Use as teclas [1], [2], [3] ou clique para selecionar
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {itemTreinando.sugestoes.map((sug, idx) => (
                    <div
                      key={sug.itemCanonicoId}
                      onClick={() => {
                        setOpcaoTreino('sugestao');
                        setSugestaoEscolhidaIdx(idx);
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        opcaoTreino === 'sugestao' && sugestaoEscolhidaIdx === idx
                          ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/5'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs border shrink-0 mt-0.5 ${
                          opcaoTreino === 'sugestao' && sugestaoEscolhidaIdx === idx
                            ? 'bg-amber-500 text-slate-950 border-amber-500'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-100">
                              {sug.descricaoPadrao}
                            </span>
                            <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-mono rounded">
                              {sug.unidadePadrao}
                            </span>
                            {sug.categoria && (
                              <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 text-[10px] rounded border border-indigo-500/20">
                                {sug.categoria}
                              </span>
                            )}
                            {sug.subcategoria && (
                              <span className="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-300 text-[10px] rounded border border-cyan-500/20">
                                {sug.subcategoria}
                              </span>
                            )}
                          </div>
                          
                          <span className="text-xs text-slate-400 block">
                            {sug.justificativa}
                          </span>

                          {/* MOTIVOS E EVIDÊNCIAS MULTIFATORIAIS */}
                          {sug.motivos && sug.motivos.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {sug.motivos.map((motivo, mIdx) => (
                                <span 
                                  key={mIdx}
                                  className={`text-[10px] px-2.5 py-0.5 rounded-md font-medium border flex items-center gap-1 ${
                                    motivo.startsWith('⛔')
                                      ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 font-bold shadow-sm'
                                      : motivo.startsWith('⚠️')
                                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                  }`}
                                >
                                  {motivo}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* ALERTA DE DIVERGÊNCIA TÉCNICA */}
                          {sug.avisoDivergenciaTecnica && (
                            <div className="p-2 bg-amber-500/15 border border-amber-500/30 rounded-lg text-xs text-amber-300 flex items-start gap-1.5 mt-1">
                              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                              <span>{sug.avisoDivergenciaTecnica}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end md:self-center">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border font-mono ${
                          sug.confianca >= 80
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {sug.confianca}% Match
                        </span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                          opcaoTreino === 'sugestao' && sugestaoEscolhidaIdx === idx
                            ? 'bg-amber-500 border-amber-500 text-slate-950'
                            : 'border-slate-700'
                        }`}>
                          {opcaoTreino === 'sugestao' && sugestaoEscolhidaIdx === idx && (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* OPÇÃO: CRIAR NOVO MATERIAL MESTRE */}
                  <div
                    onClick={() => setOpcaoTreino('novo')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      opcaoTreino === 'novo'
                        ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/5'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs border ${
                          opcaoTreino === 'novo'
                            ? 'bg-amber-500 text-slate-950 border-amber-500'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          N
                        </span>
                        <div>
                          <span className="font-bold text-sm text-slate-100 block">
                            Criar Novo Material Mestre no Catálogo
                          </span>
                          <span className="text-xs text-slate-400">
                            Nenhuma das sugestões acima corresponde a este item com exatidão técnica.
                          </span>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                        opcaoTreino === 'novo'
                          ? 'bg-amber-500 border-amber-500 text-slate-950'
                          : 'border-slate-700'
                      }`}>
                        {opcaoTreino === 'novo' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    {/* CAMPOS EXPANDIDOS QUANDO 'NOVO' ESTIVER SELECIONADO */}
                    {opcaoTreino === 'novo' && (
                      <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="md:col-span-2">
                            <label className="text-xs font-semibold text-slate-300 block mb-1">
                              Descrição Padronizada do Novo Material:
                            </label>
                            <input
                              type="text"
                              value={novoTreinoDescricao}
                              onChange={(e) => setNovoTreinoDescricao(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-1">
                              Unidade Base:
                            </label>
                            <select
                              value={novoTreinoUnidade}
                              onChange={(e) => setNovoTreinoUnidade(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                            >
                              <option value="M">M (Metro)</option>
                              <option value="UN">UN (Unidade)</option>
                              <option value="BARRA">BARRA (Barra)</option>
                              <option value="PÇ">PÇ (Peça)</option>
                              <option value="KG">KG (Quilo)</option>
                              <option value="ROLO">ROLO (Rolo)</option>
                              <option value="CX">CX (Caixa)</option>
                            </select>
                          </div>
                        </div>

                        {/* CLASSIFICAÇÃO TÉCNICA SUGERIDA */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
                          <div>
                            <label className="text-xs font-semibold text-slate-400 block mb-1">
                              Categoria:
                            </label>
                            <input
                              type="text"
                              value={novoTreinoCategoria}
                              onChange={(e) => setNovoTreinoCategoria(e.target.value)}
                              placeholder="Ex: Eletrodutos"
                              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-400 block mb-1">
                              Subcategoria:
                            </label>
                            <input
                              type="text"
                              value={novoTreinoSubcategoria}
                              onChange={(e) => setNovoTreinoSubcategoria(e.target.value)}
                              placeholder="Ex: Corrugados"
                              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-400 block mb-1">
                              Aplicações (Obra):
                            </label>
                            <input
                              type="text"
                              value={novoTreinoAplicacoes}
                              onChange={(e) => setNovoTreinoAplicacoes(e.target.value)}
                              placeholder="Ex: Laje, Parede"
                              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-400 block mb-1">
                              Características Técnicas:
                            </label>
                            <input
                              type="text"
                              value={novoTreinoCaracteristicas}
                              onChange={(e) => setNovoTreinoCaracteristicas(e.target.value)}
                              placeholder="Ex: Ponta Azul, 20mm"
                              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* OPÇÃO: VINCULAR A MATERIAL MESTRE EXISTENTE (BUSCAR NO CATÁLOGO) */}
                  <div
                    onClick={() => setOpcaoTreino('existente')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      opcaoTreino === 'existente'
                        ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/5'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs border ${
                          opcaoTreino === 'existente'
                            ? 'bg-amber-500 text-slate-950 border-amber-500'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          E
                        </span>
                        <div>
                          <span className="font-bold text-sm text-slate-100 block">
                            Vincular a um Material Mestre Já Cadastrado (Buscar no Catálogo)
                          </span>
                          <span className="text-xs text-slate-400">
                            Este termo cotado é a versão de fabricante de um molde canônico que já existe no catálogo.
                          </span>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                        opcaoTreino === 'existente'
                          ? 'bg-amber-500 border-amber-500 text-slate-950'
                          : 'border-slate-700'
                      }`}>
                        {opcaoTreino === 'existente' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    {/* SELEÇÃO E BUSCA DE MATERIAL MESTRE EXISTENTE */}
                    {opcaoTreino === 'existente' && (
                      <div className="mt-4 pt-4 border-t border-slate-800 space-y-3" onClick={(e) => e.stopPropagation()}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-1">
                              Filtrar por nome do material:
                            </label>
                            <div className="relative">
                              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                              <input
                                type="text"
                                value={filtroMaterialTreino}
                                onChange={(e) => setFiltroMaterialTreino(e.target.value)}
                                placeholder="Digite para filtrar (ex: caixa, condutor, eletroduto)..."
                                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-1">
                              Selecione o Material Mestre Molde ({materiais.length} no catálogo):
                            </label>
                            <select
                              value={materialExistenteId}
                              onChange={(e) => setMaterialExistenteId(e.target.value ? Number(e.target.value) : '')}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                            >
                              <option value="">-- Escolha o Material Canônico Molde --</option>
                              {materiais
                                .filter((m) =>
                                  !filtroMaterialTreino ||
                                  m.descricaoPadrao.toLowerCase().includes(filtroMaterialTreino.toLowerCase()) ||
                                  (m.categoria && m.categoria.toLowerCase().includes(filtroMaterialTreino.toLowerCase()))
                                )
                                .map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.descricaoPadrao} ({m.unidadePadrao}) {m.categoria ? `• ${m.categoria}` : ''}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* OPÇÃO: IGNORAR ITEM */}
                  <div
                    onClick={() => setOpcaoTreino('ignorar')}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      opcaoTreino === 'ignorar'
                        ? 'bg-rose-500/10 border-rose-500/50'
                        : 'bg-slate-900/30 border-slate-800 hover:border-slate-700 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs border ${
                        opcaoTreino === 'ignorar'
                          ? 'bg-rose-500 text-white border-rose-500'
                          : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}>
                        I
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        Ignorar este item (não cadastrar e passar para o próximo)
                      </span>
                    </div>
                    {opcaoTreino === 'ignorar' && (
                      <span className="text-xs font-bold text-rose-400">Selecionado para Descarte</span>
                    )}
                  </div>
                </div>
              </div>

              {/* SEÇÃO DE CONVERSÃO DE UNIDADE ESPECÍFICA (A REGRA FUNDAMENTAL) */}
              {opcaoTreino !== 'ignorar' && (
                <div className="p-4 bg-slate-900/70 border border-slate-700/80 rounded-2xl space-y-3">
                  <div className="flex items-start gap-3">
                    <Scale className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-xs text-white uppercase tracking-wider">
                        Atenção a Conversões de Medida (Item Canônico é a Fonte da Verdade):
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Nem toda barra tem 3 metros e nem todo rolo tem 100 metros. Se este material possuir uma embalagem específica, cadastre a conversão definitiva aqui.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={cadastrarConversaoTreino}
                        onChange={(e) => setCadastrarConversaoTreino(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0"
                      />
                      <span>Cadastrar conversão específica para este material</span>
                    </label>

                    {cadastrarConversaoTreino && (
                      <div className="flex items-center gap-2 pl-4 border-l border-slate-700">
                        <span className="text-xs text-slate-400">1 {itemTreinando.unidadeBruta || 'UN'} = </span>
                        <input
                          type="number"
                          step="any"
                          value={fatorConversaoTreino}
                          onChange={(e) => setFatorConversaoTreino(Number(e.target.value))}
                          placeholder="Fator"
                          className="w-24 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-amber-400 font-mono font-bold text-center focus:outline-none focus:border-amber-500"
                        />
                        <span className="text-xs text-slate-400 font-bold">
                          {opcaoTreino === 'novo' ? novoTreinoUnidade : (itemTreinando.sugestoes[sugestaoEscolhidaIdx]?.unidadePadrao || 'UN')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* BOTÕES DE CONFIRMAÇÃO & ATALHOS */}
              <div className="flex items-center justify-between border-t border-slate-700/70 pt-5">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>A decisão validada cria um De-Para permanente e nunca mais será perguntada.</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={processandoTreino}
                    onClick={handleConfirmarTreinamento}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold rounded-2xl text-sm shadow-xl shadow-amber-500/25 transition cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Confirmar e Próximo [Enter]</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center bg-slate-800/40 border border-slate-700/60 rounded-3xl space-y-4">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Fila de Treinamento Vazia!</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Todos os materiais foram validados e convertidos em conhecimento permanente no sistema. Importe novos orçamentos históricos ou catálogos para continuar treinando!
              </p>
              <button
                onClick={() => setModalLoteAberto(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition"
              >
                <Upload className="w-4 h-4" />
                Importar Novo Lote de Itens
              </button>
            </div>
          )}
        </div>
      )}

      {/* ABA 1: ALIASES & DE-PARA */}
      {activeTab === 'aliases' && (
        <div className="space-y-4">
          <form onSubmit={handleBuscarAliases} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={filtroAlias}
                onChange={(e) => setFiltroAlias(e.target.value)}
                placeholder="Buscar por termo da cotação, material mestre vinculado ou fornecedor..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-medium transition"
            >
              Buscar
            </button>
          </form>

          <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700/70">
                  <tr>
                    <th className="py-3.5 px-4">Fornecedor</th>
                    <th className="py-3.5 px-4">Termo na Cotação (Alias)</th>
                    <th className="py-3.5 px-4">Material Mestre Vinculado</th>
                    <th className="py-3.5 px-4 text-center">Origem</th>
                    <th className="py-3.5 px-4 text-center">Usos</th>
                    <th className="py-3.5 px-4">Auditoria / Atualizado</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {aliases.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        Nenhum sinônimo/alias encontrado na base. Utilize o Treinador ou confirme QCs para alimentar a base.
                      </td>
                    </tr>
                  ) : (
                    aliases.map((alias) => (
                      <tr key={alias.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-200">
                          {alias.fornecedorNome ? (
                            <span className="px-2 py-0.5 bg-slate-700/70 text-slate-300 rounded text-xs border border-slate-600/50">
                              {alias.fornecedorNome}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-xs border border-indigo-500/20 font-semibold">
                              Global (Todos)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-amber-300/90 font-medium">
                          "{alias.descricaoOriginal}"
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-emerald-400 text-xs">
                              {alias.itemCanonicoDescricao}
                            </span>
                            <span className="px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded text-[10px] font-mono">
                              {alias.itemCanonicoUnidade}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            alias.origem === 'TREINAMENTO_HISTORICO'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : alias.origem === 'USUARIO_CONFIRMADO' || alias.origem === 'MANUAL'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                          }`}>
                            {alias.origem === 'TREINAMENTO_HISTORICO' ? 'Treinamento' : alias.origem === 'USUARIO_CONFIRMADO' ? 'Orçamentista' : alias.origem}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-xs text-slate-400">
                          {alias.vezesUtilizado}x
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-400">
                          <div>{alias.alteradoPorNome || alias.criadoPorNome || 'Sistema'}</div>
                          <div className="text-[10px] text-slate-500">
                            {alias.dataAtualizacao ? new Date(alias.dataAtualizacao).toLocaleDateString('pt-BR') : '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => abrirModalEditarAlias(alias)}
                              title="Editar associação / Mudar Material Mestre"
                              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-700 rounded-lg transition"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleInativarAlias(alias)}
                              title="Desvincular (Desfazer associação)"
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: MATERIAIS MESTRE */}
      {activeTab === 'materiais' && (
        <div className="space-y-4">
          <form onSubmit={handleBuscarMateriais} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={filtroMaterial}
                onChange={(e) => setFiltroMaterial(e.target.value)}
                placeholder="Buscar materiais mestre por descrição padronizada, categoria ou código..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-medium transition"
            >
              Buscar
            </button>
          </form>

          <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700/70">
                  <tr>
                    <th className="py-3.5 px-4">Código / NCM</th>
                    <th className="py-3.5 px-4">Descrição Padronizada</th>
                    <th className="py-3.5 px-4 text-center">Unidade Base</th>
                    <th className="py-3.5 px-4">Categoria / Subcategoria</th>
                    <th className="py-3.5 px-4">Aplicações & Características</th>
                    <th className="py-3.5 px-4">Criado Em / Por</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {materiais.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        Nenhum material mestre cadastrado ainda. Crie um novo acima ou valide itens no Treinador!
                      </td>
                    </tr>
                  ) : (
                    materiais.map((mat) => (
                      <tr key={mat.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs">
                          {mat.codigoNcm ? (
                            <span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded border border-slate-600/50">
                              NCM {mat.codigoNcm}
                            </span>
                          ) : (
                            <span className="text-slate-500">{mat.codigoReferencia || `#${mat.id}`}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-100">
                          {mat.descricaoPadrao}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 font-mono font-bold rounded-lg border border-amber-500/20 text-xs">
                            {mat.unidadePadrao}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <div className="text-slate-300 font-medium">{mat.categoria || 'Geral'}</div>
                          {mat.subcategoria && (
                            <div className="text-[11px] text-cyan-400 font-normal">{mat.subcategoria}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {mat.aplicacoes && mat.aplicacoes.split(',').map((app, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded text-[10px]">
                                {app.trim()}
                              </span>
                            ))}
                            {mat.caracteristicas && mat.caracteristicas.split(',').map((car, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded text-[10px] font-mono">
                                {car.trim()}
                              </span>
                            ))}
                            {!mat.aplicacoes && !mat.caracteristicas && (
                              <span className="text-slate-600 italic text-[11px]">-</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-400">
                          <div>{mat.criadoPor || 'Sistema'}</div>
                          <div className="text-[10px] text-slate-500">
                            {mat.dataCriacao ? new Date(mat.dataCriacao).toLocaleDateString('pt-BR') : '-'}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: CONVERSÃO DE UNIDADES */}
      {activeTab === 'conversoes' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-800/80 border border-slate-700/70 rounded-xl text-sm text-slate-300 flex items-start gap-3">
            <Scale className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold text-white">Equalização de Unidades de Medida:</span>
              <p className="text-xs text-slate-400 mt-1">
                As conversões padrão abaixo servem como atalhos de conveniência. Conversões cadastradas diretamente em cada Item Canônico (ex: 1 barra = 6m, 1 caixa = 500un) possuem prioridade absoluta e evitam distorções no QC.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {conversoes.map((conv) => (
              <div key={conv.id} className="p-4 bg-slate-800/60 border border-slate-700/70 rounded-2xl shadow-md">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 font-bold font-mono text-xs rounded border border-amber-500/20">
                      1 {conv.unidadeOrigem}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-bold font-mono text-xs rounded border border-emerald-500/20">
                      {Number(conv.fatorMultiplicador)} {conv.unidadeDestino}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Sugestão Global</span>
                </div>
                <p className="text-xs text-slate-400">{conv.descricaoRegra}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 5: ATRIBUTOS BLOQUEANTES & ANTI-EVIDÊNCIAS */}
      {activeTab === 'bloqueios' && (
        <div className="space-y-6">
          <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-slate-300 flex items-start gap-4">
            <div className="p-3 bg-rose-500/20 rounded-xl text-rose-400 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Catálogo de Atributos Bloqueantes por Categoria
                <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 text-xs font-semibold rounded-md border border-rose-500/30">
                  Anti-Evidências Fortes
                </span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Em instalações elétricas e hidráulicas, produtos que compartilham a mesma finalidade (ex: atender laje ou conduzir eletricidade) não podem ser mesclados se houver divergência em atributos normativos críticos. Quando o <strong>Motor de Conciliação por Evidências</strong> detecta conflito em qualquer atributo abaixo, ele aplica uma penalidade severa e <strong>trava a confiança em &le; 20%</strong>, impedindo a auto-mesclagem.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {regrasBloqueantes.map((regra, idx) => (
              <div 
                key={idx}
                className="bg-slate-900/70 border border-slate-800 hover:border-rose-500/40 rounded-2xl p-5 space-y-4 shadow-xl transition-all"
              >
                <div className="border-b border-slate-800 pb-3 flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                      {regra.categoria}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">{regra.descricao}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Atributos Bloqueantes Estritos:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {regra.atributosBloqueantes.map((attr, aIdx) => (
                      <span 
                        key={aIdx}
                        className="px-2 py-0.5 bg-rose-500/10 text-rose-300 border border-rose-500/25 rounded-md text-[11px] font-medium"
                      >
                        ⛔ {attr}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Exemplos que Disparam o Bloqueio:
                  </span>
                  <ul className="text-xs text-slate-300 space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    {regra.exemplosValores.map((ex, eIdx) => (
                      <li key={eIdx} className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{ex}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5 text-[11px] text-rose-300/90 font-medium">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                  <span>{regra.impactoBloqueio}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL ENFILEIRAR LOTE DE ITENS (PDF COM IA OU MANUAL) */}
      {modalLoteAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl shadow-2xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8">
            
            {/* CABEÇALHO DO MODAL */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Alimentar Base de Conhecimento</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Importe catálogos ou orçamentos passados para ensinar materiais e sinônimos ao sistema.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setModalLoteAberto(false);
                  setArquivosPdf([]);
                }} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SELEÇÃO DO MODO DE IMPORTAÇÃO (TABS) */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setModoImportacao('pdf')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
                  modoImportacao === 'pdf'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload de PDFs com IA (Recomendado)</span>
              </button>
              <button
                type="button"
                onClick={() => setModoImportacao('manual')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition ${
                  modoImportacao === 'manual'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Keyboard className="w-4 h-4" />
                <span>Digitação / Colar Texto Manual</span>
              </button>
            </div>

            <form onSubmit={modoImportacao === 'pdf' ? handleUploadPdfsTreinamento : handleEnfileirarLote} className="space-y-4">
              
              {/* TIPO DE DOCUMENTO / FONTE */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Tipo de Fonte de Aprendizado:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setLoteTipoFonte('ORCAMENTO_HISTORICO')}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                      loteTipoFonte === 'ORCAMENTO_HISTORICO'
                        ? 'bg-amber-500/10 border-amber-500 text-slate-100'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <FileText className={`w-4 h-4 mt-0.5 flex-shrink-0 ${loteTipoFonte === 'ORCAMENTO_HISTORICO' ? 'text-amber-400' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-xs font-bold block text-slate-200">Orçamento Histórico de Obra</span>
                      <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                        Reflete a linguagem real de fornecedores (ex: CX OCT TETO, FIO FLEX AZUL).
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() => setLoteTipoFonte('CATALOGO_FABRICANTE')}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                      loteTipoFonte === 'CATALOGO_FABRICANTE'
                        ? 'bg-amber-500/10 border-amber-500 text-slate-100'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <BookOpen className={`w-4 h-4 mt-0.5 flex-shrink-0 ${loteTipoFonte === 'CATALOGO_FABRICANTE' ? 'text-amber-400' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-xs font-bold block text-slate-200">Catálogo Oficial de Fabricante</span>
                      <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                        Portfólio técnico oficial (ex: Tigre, Amanco, Schneider, WEG, Prysmian, Sil).
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CAMPOS COMPLEMENTARES DE ORIGEM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {loteTipoFonte === 'CATALOGO_FABRICANTE' ? 'Fabricante / Marca:' : 'Fornecedor / Origem:'}
                  </label>
                  <input
                    type="text"
                    value={loteFornecedor}
                    onChange={(e) => setLoteFornecedor(e.target.value)}
                    placeholder={loteTipoFonte === 'CATALOGO_FABRICANTE' ? 'Ex: Tigre, Schneider, Amanco, WEG' : 'Ex: Elecon, Soedral, Comercial Silva'}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Documento / Referência:</label>
                  <input
                    type="text"
                    value={loteDocumento}
                    onChange={(e) => setLoteDocumento(e.target.value)}
                    placeholder={loteTipoFonte === 'CATALOGO_FABRICANTE' ? 'Ex: Catálogo Predial 2024 Ed. 02' : 'Ex: Orçamento 1042/2023 - Obra Alpha'}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* CONTEÚDO DINÂMICO CONFORME O MODO SELECIONADO */}
              {modoImportacao === 'pdf' ? (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">
                      Arquivos PDF (Catálogos ou Orçamentos):
                    </label>
                    <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Extração automática de materiais via IA
                    </span>
                  </div>

                  <Dropzone
                    multiple={true}
                    onFilesSelected={setArquivosPdf}
                    label="Clique ou arraste catálogos e orçamentos em PDF aqui"
                    hint="Suporta múltiplos PDFs simultâneos (Tigre, Amanco, Schneider, etc.). A IA lerá itens, descrições e unidades."
                  />

                  {arquivosPdf.length > 0 && (
                    <div className="flex items-center justify-between px-1 text-xs text-slate-400">
                      <span>{arquivosPdf.length} arquivo(s) selecionado(s)</span>
                      {arquivosPdf.length > 15 && (
                        <span className="text-amber-400 font-medium">
                          ⚠️ Lote grande (~{Math.ceil(arquivosPdf.length * 10 / 60)} min). O sistema processará arquivo por arquivo.
                        </span>
                      )}
                    </div>
                  )}

                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-300">💡 Dica de Desempenho e Limites da Nuvem:</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Como a IA analisa meticulosamente cada página e tabela (~10s por documento), <strong>o ideal para não cansar o navegador é enviar lotes de 5 a 15 PDFs por vez</strong>. O aprendizado é acumulativo, você pode subir em rodadas sucessivas com segurança.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Itens Brutos (Cole um por linha):
                  </label>
                  <textarea
                    rows={6}
                    value={loteTexto}
                    onChange={(e) => setLoteTexto(e.target.value)}
                    placeholder={"FIO FLEX AZUL 2,5\nCX OCT TETO\nCOND FLEX 2,5 AZ\nTUBO PVC 3/4...\nDISJUNTOR 1P 16A CURVA C"}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[11px] text-slate-500">
                    Dica: Cada linha será enfileirada individualmente com similaridade semântica e atributos técnicos pré-calculados.
                  </p>
                </div>
              )}

              {/* PROGRESSO EM TEMPO REAL ARQUIVO A ARQUIVO */}
              {enfileirandoLote && progressoPdf && (
                <div className="p-4 bg-slate-950/80 border border-amber-500/30 rounded-2xl space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-300 flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Analisando PDF {progressoPdf.atual} de {progressoPdf.total} com IA Gemini
                    </span>
                    <span className="font-mono font-bold text-amber-400">
                      {Math.round((progressoPdf.atual / progressoPdf.total) * 100)}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 truncate font-mono bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                    📄 {progressoPdf.nomeAtual}
                  </p>

                  {progressoPdf.statusEtapa && (
                    <div className="flex items-center gap-2 text-xs text-amber-300 font-medium bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                      <RefreshCw className="w-3 h-3 animate-spin shrink-0 text-amber-400" />
                      <span className="truncate">{progressoPdf.statusEtapa}</span>
                    </div>
                  )}

                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.round((progressoPdf.atual / progressoPdf.total) * 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Processando individualmente na nuvem com resiliência.</span>
                    <button
                      type="button"
                      onClick={() => {
                        cancelarEnvioRef.current = true;
                        if (abortControllerRef.current) {
                          abortControllerRef.current.abort();
                        }
                      }}
                      className="text-rose-400 hover:text-rose-300 font-semibold hover:underline cursor-pointer"
                    >
                      Interromper
                    </button>
                  </div>
                </div>
              )}

              {/* BOTÕES DE AÇÃO */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setModalLoteAberto(false);
                    setArquivosPdf([]);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition"
                >
                  Cancelar
                </button>

                {modoImportacao === 'pdf' ? (
                  <button
                    type="submit"
                    disabled={enfileirandoLote || arquivosPdf.length === 0}
                    className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer"
                  >
                    {enfileirandoLote ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Extraindo dados com IA nos PDFs... aguarde</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Processar {arquivosPdf.length > 0 ? `${arquivosPdf.length} PDF(s)` : 'PDFs'} com IA & Enfileirar</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={enfileirandoLote || !loteTexto.trim()}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer"
                  >
                    {enfileirandoLote ? 'Enfileirando...' : 'Adicionar à Fila de Treinamento'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR / REASSOCIAR ALIAS */}
      {aliasEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Editar / Desfazer Associação</h3>
                <p className="text-xs text-slate-400 mt-0.5">Corrija para qual material mestre este termo deve apontar.</p>
              </div>
              <button onClick={() => setAliasEditando(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs space-y-1">
              <span className="text-slate-400">Termo original cotado pelo fornecedor:</span>
              <p className="font-mono text-amber-300 font-bold text-sm">"{aliasEditando.descricaoOriginal}"</p>
              <div className="flex items-center gap-2 text-slate-400 pt-1">
                <span>Fornecedor: <strong className="text-slate-200">{aliasEditando.fornecedorNome || 'Global'}</strong></span>
                <span>•</span>
                <span>Atual: <strong className="text-emerald-400">{aliasEditando.itemCanonicoDescricao}</strong></span>
              </div>
            </div>

            <form onSubmit={handleSalvarReassociacao} className="space-y-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setModoCriarNovoNoAlias(false)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition ${
                    !modoCriarNovoNoAlias ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Vincular a Material Existente
                </button>
                <button
                  type="button"
                  onClick={() => setModoCriarNovoNoAlias(true)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition ${
                    modoCriarNovoNoAlias ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  Criar Novo Material Mestre
                </button>
              </div>

              {!modoCriarNovoNoAlias ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Selecione o Material Mestre Correto:</label>
                  <select
                    value={novoMaterialId}
                    onChange={(e) => setNovoMaterialId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Escolha um material cadastrado --</option>
                    {materiais.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.descricaoPadrao} ({m.unidadePadrao})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Nova Descrição Padronizada:</label>
                    <input
                      type="text"
                      value={novaDescricaoMestre}
                      onChange={(e) => setNovaDescricaoMestre(e.target.value)}
                      placeholder="Ex: CABO PP 2X2,5MM² 500V PRETO"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Unidade Base:</label>
                      <select
                        value={novaUnidadeMestre}
                        onChange={(e) => setNovaUnidadeMestre(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                      >
                        <option value="M">M (Metro)</option>
                        <option value="UN">UN (Unidade)</option>
                        <option value="BARRA">BARRA (Barra)</option>
                        <option value="PÇ">PÇ (Peça)</option>
                        <option value="KG">KG (Quilo)</option>
                        <option value="ROLO">ROLO (Rolo)</option>
                        <option value="CX">CX (Caixa)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Categoria:</label>
                      <input
                        type="text"
                        value={novaCategoriaMestre}
                        onChange={(e) => setNovaCategoriaMestre(e.target.value)}
                        placeholder="Ex: Elétrica"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAliasEditando(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoAlias}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm shadow-md transition"
                >
                  {salvandoAlias ? 'Salvando...' : 'Salvar Alteração'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CRIAR NOVO MATERIAL MESTRE */}
      {modalNovoMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Cadastrar Material Mestre</h3>
                <p className="text-xs text-slate-400 mt-0.5">Adiciona ao catálogo corporativo da Makinsthal.</p>
              </div>
              <button onClick={() => setModalNovoMaterial(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCriarMaterial} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">Descrição Padronizada do Material *</label>
                  <button
                    type="button"
                    onClick={handleAutoClassificar}
                    disabled={extraindoClassificacao || !cadDescricao.trim()}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold disabled:opacity-40"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{extraindoClassificacao ? 'Classificando...' : 'Auto-extrair com IA'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={cadDescricao}
                  onChange={(e) => setCadDescricao(e.target.value)}
                  placeholder="Ex: CABO FLEXÍVEL 2,5MM² 750V AZUL"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Unidade Base *</label>
                  <select
                    value={cadUnidade}
                    onChange={(e) => setCadUnidade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="M">M (Metro)</option>
                    <option value="UN">UN (Unidade)</option>
                    <option value="BARRA">BARRA (Barra)</option>
                    <option value="PÇ">PÇ (Peça)</option>
                    <option value="KG">KG (Quilo)</option>
                    <option value="ROLO">ROLO (Rolo)</option>
                    <option value="CX">CX (Caixa)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Categoria</label>
                  <input
                    type="text"
                    value={cadCategoria}
                    onChange={(e) => setCadCategoria(e.target.value)}
                    placeholder="Ex: Eletrodutos"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Subcategoria</label>
                  <input
                    type="text"
                    value={cadSubcategoria}
                    onChange={(e) => setCadSubcategoria(e.target.value)}
                    placeholder="Ex: Corrugados"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Aplicações (Obra)</label>
                  <input
                    type="text"
                    value={cadAplicacoes}
                    onChange={(e) => setCadAplicacoes(e.target.value)}
                    placeholder="Ex: Laje, Parede"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Características</label>
                  <input
                    type="text"
                    value={cadCaracteristicas}
                    onChange={(e) => setCadCaracteristicas(e.target.value)}
                    placeholder="Ex: Ponta Azul, 20mm"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">NCM Fiscal (NFe)</label>
                  <input
                    type="text"
                    value={cadNcm}
                    onChange={(e) => setCadNcm(e.target.value)}
                    placeholder="Ex: 8544.49.00"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Código / SKU</label>
                  <input
                    type="text"
                    value={cadCodigo}
                    onChange={(e) => setCadCodigo(e.target.value)}
                    placeholder="Ex: MAT-00120"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalNovoMaterial(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoMaterial}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm shadow-md transition"
                >
                  {salvandoMaterial ? 'Cadastrando...' : 'Cadastrar Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CatalogoMateriaisView;
