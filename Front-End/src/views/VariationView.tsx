import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Upload, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  Search, 
  History, 
  Calendar, 
  Tag, 
  AlertTriangle, 
  Check, 
  FileText, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  UserCheck,
  Mail,
  Copy,
  ExternalLink,
  MessageCircle,
  X
} from 'lucide-react';
import { api } from '../services/api';
import type { ItemVariacaoDto } from '../types';

interface ModalReajusteGeralState {
  fornecedorNome: string;
  nomeContato: string;
  emailContato?: string;
  telefoneContato?: string;
  numeroOrcamentoAtual?: string;
  itens: ItemVariacaoDto[];
  assunto: string;
  emailTexto: string;
}

export function VariationView() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ItemVariacaoDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'up' | 'down' | 'stable'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Modal para Solicitar Reajuste de TODOS os Itens com Variação de Alta
  const [reajusteModal, setReajusteModal] = useState<ModalReajusteGeralState | null>(null);
  const [copiadoReajuste, setCopiadoReajuste] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.analisarVariacao(file);
      setResults(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Erro ao analisar variação:", err);
      setError(err?.response?.data?.message || "Erro ao consultar histórico do fornecedor no banco de dados.");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '-';
    return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Copiar argumento individual de negociação direcionado especificamente ao vendedor
  const handleCopyArgument = (item: ItemVariacaoDto, index: number) => {
    const varNum = Number(item.percentualVariacao || 0);
    const dif = Math.abs(Number(item.precoAtual || 0) - Number(item.precoAnterior || 0));
    
    const orcRef = item.numeroOrcamentoAnterior ? `nº ${item.numeroOrcamentoAnterior}` : `anterior`;
    const dataRef = item.dataEmissaoAnterior ? ` (emitido em ${item.dataEmissaoAnterior})` : '';

    const saudacao = item.nomeContato && item.nomeContato.trim().length > 0
      ? `Olá, ${item.nomeContato.trim()}!`
      : `Prezado(a) vendedor(a) da ${item.nomeFornecedor || 'empresa'},`;

    const texto = `${saudacao} Tudo bem?

Estamos validando a nova proposta da ${item.nomeFornecedor || 'sua empresa'} e identificamos uma alta de +${varNum.toFixed(1)}% (+${fmt(dif)}/unid) no item:
"${item.descricaoItem}".

• Histórico (${orcRef}${dataRef}): ${fmt(item.precoAnterior)}
• Preço na proposta atual: ${fmt(item.precoAtual)}

Consegue verificar com a gerência a possibilidade de mantermos a condição anterior de ${fmt(item.precoAnterior)} para viabilizarmos o fechamento desse pedido?

Fico no aguardo, obrigado!`;

    navigator.clipboard.writeText(texto);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 3000);
  };

  // Métricas
  const totalItens = results?.length || 0;
  const increases = useMemo(() => (results || []).filter(i => (i.percentualVariacao || 0) > 0), [results]);
  const decreases = useMemo(() => (results || []).filter(i => (i.percentualVariacao || 0) < 0), [results]);
  const stables = useMemo(() => (results || []).filter(i => (i.percentualVariacao || 0) === 0), [results]);

  const avgVariation = useMemo(() => {
    if (!results || results.length === 0) return 0;
    const sum = results.reduce((acc, curr) => acc + (Number(curr.percentualVariacao) || 0), 0);
    return sum / results.length;
  }, [results]);

  // Filtros de busca e tipo
  const filteredItems = useMemo(() => {
    if (!results) return [];
    return results.filter(item => {
      const varVal = Number(item.percentualVariacao || 0);
      const matchesSearch = item.descricaoItem.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (item.nomeFornecedor && item.nomeFornecedor.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (item.numeroOrcamentoAnterior && item.numeroOrcamentoAnterior.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (item.nomeContato && item.nomeContato.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;
      if (filterType === 'up') return varVal > 0;
      if (filterType === 'down') return varVal < 0;
      if (filterType === 'stable') return varVal === 0;
      return true;
    });
  }, [results, filterType, searchTerm]);

  // Abrir Modal de Solicitação de Reajuste de TODOS os Itens com Aumento
  const handleAbrirModalReajusteGeral = () => {
    if (increases.length === 0) return;

    const primeiro = increases[0];
    const fornecedorNome = primeiro.nomeFornecedor || 'Fornecedor';
    const nomeContato = primeiro.nomeContato && primeiro.nomeContato.trim().length > 0 
      ? primeiro.nomeContato.trim() 
      : '';
    const emailContato = primeiro.emailContato || '';
    const telefoneContato = primeiro.telefoneContato || '';
    const numOrcAtual = primeiro.numeroOrcamentoAtual 
      ? `nº ${primeiro.numeroOrcamentoAtual}` 
      : (file ? `(ref. ${file.name})` : 'atual');

    const listaItensTexto = increases.map((item, idx) => {
      const varNum = Number(item.percentualVariacao || 0);
      const dif = Math.abs(Number(item.precoAtual || 0) - Number(item.precoAnterior || 0));
      const orcAnt = item.numeroOrcamentoAnterior ? `nº ${item.numeroOrcamentoAnterior}` : 'anterior';
      const dataAnt = item.dataEmissaoAnterior ? ` em ${item.dataEmissaoAnterior}` : '';

      return `• Item ${idx + 1}: ${item.descricaoItem}
  - Preço na Proposta Atual: ${fmt(item.precoAtual)}
  - Cotação Anterior: ${fmt(item.precoAnterior)} (Orç. ${orcAnt}${dataAnt})
  - Reajuste Identificado: +${varNum.toFixed(2)}% (Diferença de +${fmt(dif)}/un)`;
    }).join('\n\n');

    const saudacao = nomeContato.length > 0
      ? `Prezado(a) ${nomeContato},`
      : `Prezado(a) vendedor(a) da ${fornecedorNome},`;

    const assunto = `Solicitação de Revisão de Reajuste - ${fornecedorNome} ${numOrcAtual}`;

    const mediaAumentos = increases.reduce((acc, curr) => acc + Number(curr.percentualVariacao || 0), 0) / increases.length;

    const texto = `${saudacao} Tudo bem?

Recebemos a nova proposta comercial da ${fornecedorNome} (${numOrcAtual}).

Ao realizarmos a auditoria comparativa com os nossos históricos recentes de compras e cotações aprovadas dessa mesma obra e fornecedor, identificamos oscilações e aumentos nos seguintes itens:

ITENS COM REAJUSTE DE PREÇO:
${listaItensTexto}

RESUMO DA AUDITORIA:
• Total de itens com aumento: ${increases.length} item(ns)
• Variação média dos aumentos: +${mediaAumentos.toFixed(2)}%

Tendo em vista a nossa parceria contínua e o volume de compras recente, gostaríamos de solicitar a manutenção dos preços praticados anteriormente (ou uma negociação especial nesses itens) para que possamos viabilizar o fechamento desse pedido com vocês.

Consegue verificar essa condição com a gerência comercial da ${fornecedorNome}?

Fico no aguardo do seu breve retorno para formalizarmos a compra!

Atenciosamente,
Equipe de Suprimentos - Makinsthal`;

    setReajusteModal({
      fornecedorNome,
      nomeContato: nomeContato || 'Vendedor Responsável',
      emailContato,
      telefoneContato,
      numeroOrcamentoAtual: numOrcAtual,
      itens: increases,
      assunto,
      emailTexto: texto
    });
    setCopiadoReajuste(false);
  };

  return (
    <div className="p-6 space-y-6 text-slate-100 font-sans w-full">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <TrendingUp className="w-4 h-4" />
            <span>Auditoria e Inteligência de Compras</span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight mt-1">
            Análise de Variação de Preços
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Recebeu um orçamento novo? Envie o PDF para cruzar automaticamente com as cotações e compras passadas do fornecedor no banco de dados.
          </p>
        </div>
      </div>

      {/* ÁREA DE SELEÇÃO E UPLOAD DO ORÇAMENTO NOVO */}
      <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-6 shadow-xl backdrop-blur-sm w-full">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <label className="flex-1 w-full border-2 border-dashed border-slate-700/80 hover:border-blue-500/60 rounded-xl p-4 flex items-center justify-center gap-3 cursor-pointer transition-colors bg-slate-950/40">
            <Upload className="w-5 h-5 text-blue-400 shrink-0" />
            <div className="truncate text-xs">
              {file ? (
                <span className="font-bold text-slate-100">{file.name}</span>
              ) : (
                <span className="text-slate-400">Clique para selecionar o <strong>PDF do Orçamento</strong> do fornecedor...</span>
              )}
            </div>
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              onChange={handleFileChange} 
            />
          </label>

          <button
            onClick={handleAnalyze}
            disabled={!file || loading}
            className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shrink-0 ${
              !file || loading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
                : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-blue-500/20 active:scale-95'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Consultando Histórico...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analisar Variação no Banco</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-center gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* RESULTADOS DA AUDITORIA */}
      {results !== null ? (
        <div className="space-y-6 w-full">
          {/* CARDS DE MÉTRICAS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Itens com Histórico</span>
              <div className="text-2xl font-black text-slate-100 mt-1 font-mono">{totalItens}</div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Identificados no banco</span>
            </div>

            <div className="bg-slate-900/90 border border-rose-950/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">Tiveram Aumento</span>
                  <ArrowUpRight className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl font-black text-rose-400 mt-1 font-mono">{increases.length}</div>
                <span className="text-[10px] text-rose-300/60 mt-0.5 block">Exigem negociação</span>
              </div>
              {increases.length > 0 && (
                <button
                  onClick={handleAbrirModalReajusteGeral}
                  className="mt-2 text-[10px] font-bold text-rose-300 hover:text-white bg-rose-950/80 hover:bg-rose-900/90 border border-rose-800/50 rounded-lg px-2.5 py-1 flex items-center justify-center gap-1 transition cursor-pointer"
                  title="Abrir negociação completa de todos os itens com aumento"
                >
                  <Mail className="w-3 h-3 text-rose-400" />
                  <span>Negociar Aumentos</span>
                </button>
              )}
            </div>

            <div className="bg-slate-900/90 border border-emerald-950/40 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Tiveram Queda</span>
                <ArrowDownRight className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">{decreases.length}</div>
              <span className="text-[10px] text-emerald-300/60 mt-0.5 block">Economia identificada</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Variação Média</span>
              <div className={`text-2xl font-black mt-1 font-mono ${
                avgVariation > 0 ? 'text-rose-400' : avgVariation < 0 ? 'text-emerald-400' : 'text-slate-200'
              }`}>
                {avgVariation > 0 ? `+${avgVariation.toFixed(2)}%` : `${avgVariation.toFixed(2)}%`}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Geral da cotação</span>
            </div>
          </div>

          {/* BARRA DE FILTROS, PESQUISA E BOTÃO DE REAJUSTE GERAL */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md w-full">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por material, vendedor ou nº orçamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 w-full md:w-auto">
              {/* BOTÃO INTELIGENTE: SOLICITAR REAJUSTE DE TODOS OS ITENS COM AUMENTO */}
              {increases.length > 0 && (
                <button
                  onClick={handleAbrirModalReajusteGeral}
                  className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                  title="Gerar mensagem consolidada com todos os itens que tiveram aumento para envio ao vendedor"
                >
                  <Mail className="w-4 h-4 text-white" />
                  <span>Solicitar Reajuste dos Itens com Aumento ({increases.length})</span>
                </button>
              )}

              {/* Filtros por Categoria */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Todos ({totalItens})
                </button>
                <button
                  onClick={() => setFilterType('up')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    filterType === 'up' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-rose-400 hover:bg-slate-700'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Altas ({increases.length})
                </button>
                <button
                  onClick={() => setFilterType('down')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    filterType === 'down' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  Baixas ({decreases.length})
                </button>
                <button
                  onClick={() => setFilterType('stable')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    filterType === 'stable' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" />
                  Estáveis ({stables.length})
                </button>
              </div>
            </div>
          </div>

          {/* LISTA DE ITENS AUDITADOS (GRID FLUIDO) */}
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800 w-full">
              Nenhum item encontrado com os critérios de filtro selecionados.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
              {filteredItems.map((item, index) => {
                const varNum = Number(item.percentualVariacao || 0);
                const isUp = varNum > 0;
                const isDown = varNum < 0;
                const dif = Number(item.precoAtual || 0) - Number(item.precoAnterior || 0);

                return (
                  <div 
                    key={index}
                    className={`bg-slate-950/70 border rounded-2xl p-5 space-y-4 shadow-md transition-all flex flex-col justify-between ${
                      isUp 
                        ? 'border-rose-900/40 hover:border-rose-700/60' 
                        : isDown 
                        ? 'border-emerald-900/40 hover:border-emerald-700/60' 
                        : 'border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Topo do Card: Fornecedor e Badge de Variação */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider truncate max-w-[200px]">
                            {item.nomeFornecedor}
                          </span>
                          {item.nomeContato && (
                            <span className="text-[10px] text-blue-400 flex items-center gap-1 mt-0.5 font-medium">
                              <UserCheck className="w-3 h-3" />
                              Vendedor(a): {item.nomeContato}
                            </span>
                          )}
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-xs font-black font-mono flex items-center gap-0.5 shrink-0 shadow-sm ${
                          isUp 
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                            : isDown 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {isUp && <ArrowUpRight className="w-3.5 h-3.5" />}
                          {isDown && <ArrowDownRight className="w-3.5 h-3.5" />}
                          {varNum > 0 ? `+${varNum.toFixed(2)}%` : `${varNum.toFixed(2)}%`}
                        </span>
                      </div>

                      {/* Descrição do Material */}
                      <h4 className="text-xs font-bold text-slate-100 leading-snug line-clamp-2 min-h-[32px]">
                        {item.descricaoItem}
                      </h4>

                      {/* Comparativo de Preço: Anterior vs Atual */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900">
                        <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800/60">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Cotação Anterior</span>
                          <div className="text-sm font-black text-slate-200 mt-0.5 font-mono">
                            {fmt(item.precoAnterior)}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 space-y-0.5">
                            {item.numeroOrcamentoAnterior && (
                              <div className="flex items-center gap-1 font-mono">
                                <Tag className="w-2.5 h-2.5 text-slate-400" />
                                <span>Orç. Anterior: <strong className="text-slate-300">{item.numeroOrcamentoAnterior}</strong></span>
                              </div>
                            )}
                            {item.dataEmissaoAnterior && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5 text-slate-400" />
                                <span>Emissão: {item.dataEmissaoAnterior}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800/60">
                          <span className="text-[10px] text-blue-400 font-semibold uppercase block">Preço Atual</span>
                          <div className="text-sm font-black text-white mt-0.5 font-mono">
                            {fmt(item.precoAtual)}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            <span>Diferença: </span>
                            <span className={`font-mono font-bold ${isUp ? 'text-rose-400' : isDown ? 'text-emerald-400' : 'text-slate-300'}`}>
                              {dif > 0 ? `+${fmt(dif)}` : fmt(dif)}
                            </span>
                            <span className="block text-[9px] text-slate-400">
                              {isUp ? 'Acréscimo no custo' : isDown ? 'Economia gerada' : 'Sem alteração'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Alerta de Variação e Ação Inteligente */}
                    <div className="pt-3 border-t border-slate-900 space-y-2">
                      {isUp && (
                        <div className="p-2 bg-rose-950/30 border border-rose-900/40 rounded-xl flex items-center gap-1.5 text-[10px] text-rose-300">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                          <span>
                            Atenção: Aumento de <strong>{varNum.toFixed(1)}%</strong> em relação ao orçamento nº <strong>{item.numeroOrcamentoAnterior || 'anterior'}</strong>!
                          </span>
                        </div>
                      )}

                      {/* Botão de Argumentação direcionado ao vendedor */}
                      {isUp && (
                        <div className="flex items-center justify-between pt-1">
                          <button
                            onClick={() => handleCopyArgument(item, index)}
                            className="w-full py-2 px-3 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 rounded-xl text-[11px] font-bold text-rose-300 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                            title="Copiar texto formal com histórico para questionar o vendedor"
                          >
                            {copiedIndex === index ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Argumento Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                                <span>Copiar Argumento {item.nomeContato ? `p/ ${item.nomeContato.split(' ')[0]}` : 'p/ Vendedor'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {isDown && (
                        <div className="p-2 bg-emerald-950/30 border border-emerald-900/40 rounded-xl flex items-center gap-1.5 text-[10px] text-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                          <span>
                            Excelente: Queda de <strong>{Math.abs(varNum).toFixed(1)}%</strong> gerando economia de <strong>{fmt(Math.abs(dif))}</strong>/un.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-16 text-center space-y-4 w-full">
          <div className="w-16 h-16 bg-slate-800/50 text-slate-500 rounded-2xl flex items-center justify-center mx-auto border border-slate-700/50">
            <History className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-300">Nenhuma análise realizada ainda</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Selecione uma proposta comercial em PDF recebida de um fornecedor e clique em <strong className="text-blue-400">"Analisar Variação no Banco"</strong> para identificar oscilações de preço, localizar o número do orçamento anterior e gerar o argumento para o vendedor responsável.
            </p>
          </div>
        </div>
      )}

      {/* MODAL DE SOLICITAÇÃO DE REAJUSTE DE TODOS OS ITENS COM AUMENTO */}
      {reajusteModal && createPortal(
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-rose-900/60 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col p-6 shadow-2xl space-y-4 animate-scaleUp">
            
            {/* Cabeçalho do Modal */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-rose-400 px-2 py-0.5 bg-rose-950 rounded border border-rose-500/30">
                      Auditoria de Variação de Preços
                    </span>
                    <span className="text-xs text-slate-400">
                      Fornecedor: <strong className="text-slate-200">{reajusteModal.fornecedorNome}</strong>
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-100 mt-1">
                    Solicitar Reajuste dos Itens com Aumento
                  </h3>
                  <p className="text-xs text-slate-400">
                    Destinatário: <strong className="text-emerald-400">{reajusteModal.nomeContato}</strong> 
                    {reajusteModal.emailContato ? ` (${reajusteModal.emailContato})` : ''}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setReajusteModal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Banner de Resumo da Auditoria */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-2 text-slate-300">
                <ArrowUpRight className="w-4 h-4 text-rose-400" />
                <span>
                  <strong className="text-rose-400">{reajusteModal.itens.length}</strong> itens identificados com aumento de preço
                </span>
              </div>
              <div className="text-right font-mono">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Status</span>
                <span className="text-rose-400 font-bold text-xs bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/40">
                  Pronto para Envio
                </span>
              </div>
            </div>

            {/* Caixa de Texto da Mensagem */}
            <div className="space-y-1.5 flex-1 flex flex-col min-h-[220px]">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Mensagem de Solicitação de Manutenção de Preços:</span>
                <span className="text-[11px] text-slate-500">Você pode editar o texto antes de enviar</span>
              </div>

              <textarea
                value={reajusteModal.emailTexto}
                onChange={(e) => setReajusteModal({ ...reajusteModal, emailTexto: e.target.value })}
                rows={10}
                className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-sans leading-relaxed focus:outline-none focus:border-rose-500 resize-none font-mono"
              />
            </div>

            {/* Ações: Copiar, WhatsApp e Abrir E-mail */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(reajusteModal.emailTexto);
                    setCopiadoReajuste(true);
                    setTimeout(() => setCopiadoReajuste(false), 3000);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {copiadoReajuste ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Texto Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span>Copiar Mensagem</span>
                    </>
                  )}
                </button>

                {reajusteModal.telefoneContato && (
                  <button
                    onClick={() => {
                      const num = reajusteModal.telefoneContato!.replace(/\D/g, '');
                      const texto = encodeURIComponent(reajusteModal.emailTexto);
                      window.open(`https://wa.me/55${num}?text=${texto}`, '_blank');
                    }}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title="Enviar direto pelo WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  const dest = reajusteModal.emailContato || '';
                  const subject = encodeURIComponent(reajusteModal.assunto);
                  const body = encodeURIComponent(reajusteModal.emailTexto);
                  window.location.href = `mailto:${dest}?subject=${subject}&body=${body}`;
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir no Seu E-mail</span>
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
