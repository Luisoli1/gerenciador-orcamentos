import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { AuditoriaLog, DiffItem } from '../types';
import api from '../services/api';
import { 
  History, 
  ShieldAlert, 
  Filter, 
  Search, 
  RefreshCw, 
  FileText, 
  Building2, 
  Users, 
  ReceiptText, 
  X, 
  AlertCircle,
  GitCompare,
  Columns,
  ListFilter,
  CheckCircle2
} from 'lucide-react';

export const AuditoriaView: React.FC = () => {
  const [logs, setLogs] = useState<AuditoriaLog[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroEntidade, setFiltroEntidade] = useState<string>('TODOS');
  const [busca, setBusca] = useState('');

  // Estado para o Modal de Diff Estilo GitHub
  const [logSelecionadoParaDiff, setLogSelecionadoParaDiff] = useState<AuditoriaLog | null>(null);
  const [modoVisualizacaoDiff, setModoVisualizacaoDiff] = useState<'split' | 'unified'>('split');

  const carregarLogs = async (termo?: string) => {
    try {
      setCarregando(true);
      if (termo && termo.trim()) {
        const data = await api.listarAuditoria(termo.trim());
        setLogs(data);
      } else if (filtroEntidade === 'TODOS') {
        const data = await api.listarAuditoria();
        setLogs(data);
      } else {
        const data = await api.listarAuditoriaPorEntidade(filtroEntidade);
        setLogs(data);
      }
    } catch (err) {
      console.error('Erro ao carregar auditoria:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarLogs(busca);
  }, [filtroEntidade]);

  const handleBuscaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    carregarLogs(busca);
  };

  const limparBusca = () => {
    setBusca('');
    carregarLogs('');
  };

  const aplicarFiltroRapido = (termo: string) => {
    setBusca(termo);
    carregarLogs(termo);
  };

  // Helper para destacar a palavra buscada no texto
  const destacarTexto = (texto: string, highlight: string) => {
    if (!highlight || !highlight.trim()) return texto;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^$\{}()|[\]\\]/g, '\\$&')})`, 'gi');
    const partes = texto.split(regex);
    return partes.map((parte, i) =>
      regex.test(parte) ? (
        <mark key={i} className="bg-amber-500/30 text-amber-300 font-bold px-1 rounded">
          {parte}
        </mark>
      ) : (
        parte
      )
    );
  };

  // Helper para extrair os itens de diff (seja do diffJson ou por parsing de detalhes)
  const obterDiffItems = (log: AuditoriaLog): DiffItem[] => {
    if (log.diffJson) {
      try {
        const parsed = JSON.parse(log.diffJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Erro ao fazer parse do diffJson:', e);
      }
    }

    // Fallback: se houver '➔' no texto de detalhes, faz parse estruturado
    if (log.detalhes && log.detalhes.includes('➔')) {
      const partes = log.detalhes.split('|');
      const resultado: DiffItem[] = [];

      for (let p of partes) {
        if (p.includes('➔')) {
          const antesEDepois = p.split('➔');
          const parteEsquerda = antesEDepois[0].trim();
          const parteDireita = antesEDepois[1].trim();

          let item = 'Item';
          let campo = 'Alteração';
          let antes = parteEsquerda;

          // Se tiver colchetes [Campo] ou [Fornecedor]
          const matchCampo = parteEsquerda.match(/\[(.*?)\]/);
          if (matchCampo) {
            campo = matchCampo[1];
            item = parteEsquerda.replace(matchCampo[0], '').replace(/:$/, '').trim();
          }
          if (antes.includes(':')) {
            const splitAntes = antes.split(':');
            item = splitAntes[0].trim();
            antes = splitAntes.slice(1).join(':').trim();
          }

          resultado.push({
            item,
            campo,
            antes,
            depois: parteDireita
          });
        }
      }

      if (resultado.length > 0) return resultado;
    }

    return [];
  };

  const getAcaoBadge = (acao: string) => {
    switch (acao) {
      case 'CRIACAO':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">CRIAÇÃO</span>;
      case 'ATUALIZACAO':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">ATUALIZAÇÃO</span>;
      case 'EXCLUSAO':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">EXCLUSÃO</span>;
      case 'LOGIN':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">LOGIN</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-300 border border-slate-500/30">{acao}</span>;
    }
  };

  const getEntidadeIcon = (entidade: string) => {
    switch (entidade) {
      case 'FORNECEDOR': return <Building2 className="w-3.5 h-3.5 text-amber-400" />;
      case 'QC': return <FileText className="w-3.5 h-3.5 text-blue-400" />;
      case 'FATURAMENTO_DIRETO': return <ReceiptText className="w-3.5 h-3.5 text-emerald-400" />;
      case 'USUARIO': return <Users className="w-3.5 h-3.5 text-purple-400" />;
      default: return <History className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 shadow-sm backdrop-blur">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Trilha de Auditoria & Registro de Alterações
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Exclusivo do Dono
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Veja exatamente quem alterou o que, compare o <strong>Antes</strong> e o <strong>Depois</strong> estilo GitHub com linhas destacadas.
          </p>
        </div>

        <button
          onClick={() => carregarLogs(busca)}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
          <span>Atualizar Trilha</span>
        </button>
      </div>

      {/* SUPER BARRA DE BUSCA EM TEMPO REAL */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-lg space-y-3">
        <form onSubmit={handleBuscaSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Digite para buscar: ex: '15', 'qc 15', 'mangueiras', 'joao@makinsthal.com.br', 'quantidade'..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-medium"
            />
            {busca && (
              <button
                type="button"
                onClick={limparBusca}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all shrink-0 flex items-center justify-center gap-2"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Pesquisar na Trilha</span>
          </button>
        </form>

        {/* Filtros Rápidos & Chips de Exemplo */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filtro por Módulo:
            </span>
            {['TODOS', 'QC', 'FORNECEDOR', 'FATURAMENTO_DIRETO', 'OBRA', 'USUARIO'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFiltroEntidade(cat)}
                className={`px-2.5 py-1 rounded-lg font-semibold text-[10px] transition-colors ${
                  filtroEntidade === cat
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat === 'FATURAMENTO_DIRETO' ? 'FAT. DIRETO' : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>Buscas Rápidas:</span>
            <button
              onClick={() => aplicarFiltroRapido('QC')}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded font-mono text-[10px]"
            >
              QCs
            </button>
            <button
              onClick={() => aplicarFiltroRapido('ATUALIZACAO')}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded font-mono text-[10px]"
            >
              Alterações
            </button>
            <button
              onClick={() => aplicarFiltroRapido('EXCLUSAO')}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded font-mono text-[10px]"
            >
              Exclusões
            </button>
          </div>
        </div>
      </div>

      {/* Contador de Resultados */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Mostrando <strong className="text-white">{logs.length}</strong> registro(s) de auditoria
          {busca ? <span> para o termo <strong className="text-amber-400">"{busca}"</strong></span> : ''}
        </span>
      </div>

      {/* Tabela de Registros de Auditoria */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Data & Hora</th>
                <th className="py-3.5 px-4">Quem Alterou</th>
                <th className="py-3.5 px-4">Ação</th>
                <th className="py-3.5 px-4">Módulo</th>
                <th className="py-3.5 px-4">Detalhamento da Alteração</th>
                <th className="py-3.5 px-4 text-right">Comparativo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {carregando ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="inline-block w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <p>Buscando na trilha de auditoria...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-400">Nenhum registro encontrado.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {busca ? `Nenhum resultado corresponde à busca "${busca}".` : 'Nenhuma alteração registrada ainda.'}
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const dataFormatada = new Date(log.dataHora).toLocaleString('pt-BR');
                  const diffItems = obterDiffItems(log);
                  const temDiff = diffItems.length > 0;

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        {dataFormatada}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-white">
                          {destacarTexto(log.usuarioNome, busca)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {destacarTexto(log.usuarioEmail, busca)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getAcaoBadge(log.acao)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 font-medium text-slate-300">
                          {getEntidadeIcon(log.entidade)}
                          <span className="text-[11px]">{destacarTexto(log.entidade, busca)}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-200 leading-relaxed">
                        {destacarTexto(log.detalhes, busca)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {temDiff ? (
                          <button
                            onClick={() => setLogSelecionadoParaDiff(log)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
                            title="Ver comparativo lado a lado estilo GitHub (Antes vs Depois)"
                          >
                            <GitCompare className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Ver Alterações ({diffItems.length})</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-600 italic">
                            Sem diff
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE COMPARAÇÃO DE ALTERAÇÕES ESTILO GITHUB */}
      {logSelecionadoParaDiff && createPortal(
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header do Modal */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 rounded-xl">
                  <GitCompare className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Comparativo de Alterações (Antes vs Depois)
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      {logSelecionadoParaDiff.entidade} #{logSelecionadoParaDiff.idRegistro || logSelecionadoParaDiff.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Alterado por <strong className="text-slate-200">{logSelecionadoParaDiff.usuarioNome}</strong> ({logSelecionadoParaDiff.usuarioEmail}) em {new Date(logSelecionadoParaDiff.dataHora).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Alternador de Modo de Visualização */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setModoVisualizacaoDiff('split')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold text-[11px] transition-colors ${
                      modoVisualizacaoDiff === 'split'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>Lado a Lado</span>
                  </button>
                  <button
                    onClick={() => setModoVisualizacaoDiff('unified')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold text-[11px] transition-colors ${
                      modoVisualizacaoDiff === 'unified'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ListFilter className="w-3.5 h-3.5" />
                    <span>Unificado</span>
                  </button>
                </div>

                <button
                  onClick={() => setLogSelecionadoParaDiff(null)}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Conteúdo do Diff */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {obterDiffItems(logSelecionadoParaDiff).map((diff, index) => (
                <div key={index} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-md">
                  {/* Cabeçalho do Bloco de Alteração */}
                  <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">
                        {diff.item}
                      </span>
                      {diff.fornecedor && (
                        <span className="text-[11px] text-amber-400 font-medium">
                          • {diff.fornecedor}
                        </span>
                      )}
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      Campo: {diff.campo}
                    </span>
                  </div>

                  {/* Visualização Split (Lado a Lado) */}
                  {modoVisualizacaoDiff === 'split' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 font-mono text-xs">
                      {/* LADO ANTES (VERMELHO) */}
                      <div className="p-3.5 bg-rose-950/20 border-l-4 border-rose-500 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Como estava Antes (Valor Antigo)
                          </span>
                          <span className="text-rose-500 font-bold">-</span>
                        </div>
                        <div className="text-rose-200 bg-rose-950/40 p-2.5 rounded-lg border border-rose-900/50 break-words font-semibold">
                          {diff.antes || '(vazio)'}
                        </div>
                      </div>

                      {/* LADO DEPOIS (VERDE) */}
                      <div className="p-3.5 bg-emerald-950/20 border-l-4 border-emerald-500 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Como ficou Depois (Novo Valor)
                          </span>
                          <span className="text-emerald-500 font-bold">+</span>
                        </div>
                        <div className="text-emerald-200 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-900/50 break-words font-semibold">
                          {diff.depois || '(vazio)'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Visualização Unificada (Unified Diff - Linhas - e +) */
                    <div className="p-2 space-y-1 font-mono text-xs">
                      <div className="px-3 py-2 bg-rose-950/30 border-l-4 border-rose-500 text-rose-300 rounded flex items-center justify-between">
                        <span className="break-words">
                          <strong className="text-rose-500 mr-2">-</strong>
                          <span className="text-rose-400 font-semibold mr-1">Antes:</span>
                          {diff.antes || '(vazio)'}
                        </span>
                      </div>
                      <div className="px-3 py-2 bg-emerald-950/30 border-l-4 border-emerald-500 text-emerald-300 rounded flex items-center justify-between">
                        <span className="break-words">
                          <strong className="text-emerald-500 mr-2">+</strong>
                          <span className="text-emerald-400 font-semibold mr-1">Depois:</span>
                          {diff.depois || '(vazio)'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Total de <strong className="text-white">{obterDiffItems(logSelecionadoParaDiff).length}</strong> alteração(ões) identificada(s) neste registro.
              </span>
              <button
                onClick={() => setLogSelecionadoParaDiff(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
