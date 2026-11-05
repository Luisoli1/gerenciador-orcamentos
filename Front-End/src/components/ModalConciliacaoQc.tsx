import React, { useState } from 'react';
import type { VerificacaoConciliacaoResponse, ItemCanonico } from '../types';
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Scale, 
  ArrowRight, 
  HelpCircle, 
  X, 
  Layers,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface ModalConciliacaoQcProps {
  verificacao: VerificacaoConciliacaoResponse;
  materiaisMestre: ItemCanonico[];
  onConfirmar: (associacoesAprovadas: Array<{
    descricaoOriginal: string;
    fornecedorId?: number;
    itemCanonicoId?: number;
    criarNovoCanonico?: boolean;
    novaDescricaoCanonico?: string;
    unidadePadrao?: string;
    categoria?: string;
    lembrarPermanente: boolean;
  }>) => void;
  onIgnorar: () => void;
}

export function ModalConciliacaoQc({
  verificacao,
  materiaisMestre,
  onConfirmar,
  onIgnorar,
}: ModalConciliacaoQcProps) {
  // Estado para cada discrepância/sugestão
  // Mapeia a decisão do usuário: 'mesclar' | 'separar'
  const [decisoes, setDecisoes] = useState<Record<string, {
    acao: 'mesclar' | 'separar';
    materialId: number;
    lembrar: boolean;
  }>>(() => {
    const initial: Record<string, any> = {};
    verificacao.sugestoes.forEach((sug) => {
      initial[sug.itemDescricaoOriginal] = {
        acao: 'mesclar',
        materialId: sug.itemCanonicoSugeridoId || (materiaisMestre[0]?.id || 0),
        lembrar: true
      };
    });
    verificacao.discrepancias.forEach((disc) => {
      if (!initial[disc.descricaoItem]) {
        const primeiroSug = disc.possiveisEquivalentes?.[0];
        initial[disc.descricaoItem] = {
          acao: primeiroSug ? 'mesclar' : 'separar',
          materialId: primeiroSug?.itemCanonicoSugeridoId || (materiaisMestre[0]?.id || 0),
          lembrar: true
        };
      }
    });
    return initial;
  });

  const [salvando, setSalvando] = useState(false);

  const handleToggleAcao = (itemDescricao: string, novaAcao: 'mesclar' | 'separar') => {
    setDecisoes(prev => ({
      ...prev,
      [itemDescricao]: {
        ...prev[itemDescricao],
        acao: novaAcao
      }
    }));
  };

  const handleChangeMaterial = (itemDescricao: string, matId: number) => {
    setDecisoes(prev => ({
      ...prev,
      [itemDescricao]: {
        ...prev[itemDescricao],
        materialId: matId
      }
    }));
  };

  const handleToggleLembrar = (itemDescricao: string) => {
    setDecisoes(prev => ({
      ...prev,
      [itemDescricao]: {
        ...prev[itemDescricao],
        lembrar: !prev[itemDescricao]?.lembrar
      }
    }));
  };

  const handleSalvarTudo = () => {
    setSalvando(true);
    const listaAprovadas = Object.entries(decisoes)
      .filter(([_, d]) => d.acao === 'mesclar' && d.materialId > 0)
      .map(([descOriginal, d]) => ({
        descricaoOriginal: descOriginal,
        itemCanonicoId: d.materialId,
        lembrarPermanente: d.lembrar,
      }));

    onConfirmar(listaAprovadas);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-4xl shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Assistente de Conciliação Inteligente de Itens
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-md border border-amber-500/30">
                  Aprendizado Progressivo
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Revise os itens equivalentes antes de finalizar o Quadro Comparativo para evitar linhas duplicadas e comparar preços justos.
              </p>
            </div>
          </div>
          <button onClick={onIgnorar} className="text-slate-400 hover:text-white p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ALERTA DE DISCREPÂNCIA */}
        {verificacao.possuiDiscrepancia ? (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-amber-300 text-sm">
                Discrepância na Contagem de Linhas do Quadro
              </p>
              <p className="text-slate-300">
                {verificacao.mensagemAlerta}
              </p>
              <p className="text-amber-400/90 font-mono text-[11px] pt-1">
                • Maior proposta: {verificacao.maiorOrcamentoLinhas} itens | Quadro gerado: {verificacao.totalLinhasQc} linhas
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Nenhuma inconsistência grave de quantidade de linhas detectada. Você pode revisar as sugestões de sinônimos abaixo.</span>
          </div>
        )}

        {/* LISTA DE SUGESTÕES / DISCREPÂNCIAS */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-2">
          {verificacao.discrepancias.length === 0 && verificacao.sugestoes.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              Todos os itens deste orçamento já estão conciliados com a base de conhecimento.
            </div>
          ) : (
            verificacao.discrepancias.map((disc, idx) => {
              const decisao = decisoes[disc.descricaoItem] || { acao: 'mesclar', materialId: 0, lembrar: true };
              const sug = disc.possiveisEquivalentes?.[0];

              return (
                <div 
                  key={idx}
                  className={`p-4 rounded-xl border transition-all ${
                    decisao.acao === 'mesclar'
                      ? 'bg-slate-800/80 border-slate-700 hover:border-amber-500/40'
                      : 'bg-slate-900/40 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-[11px] font-medium rounded">
                          {disc.fornecedorPresente}
                        </span>
                        {sug && (
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                            sug.confianca >= 90
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {sug.confianca}% de Similaridade
                          </span>
                        )}
                        {sug?.fatorConversao && Number(sug.fatorConversao) !== 1 && (
                          <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[10px] font-semibold rounded border border-cyan-500/20 flex items-center gap-1">
                            <Scale className="w-3 h-3" />
                            Conversão: 1 {sug.unidadeOriginal} = {Number(sug.fatorConversao)} {sug.unidadeCanonico}
                          </span>
                        )}
                      </div>

                      <p className="font-mono text-sm font-semibold text-white">
                        "{disc.descricaoItem}"
                      </p>

                      {sug && (
                        <p className="text-xs text-slate-400">
                          {sug.justificativa}
                        </p>
                      )}

                      {sug?.motivos && sug.motivos.length > 0 && (
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

                      {sug?.alertaEspecificacao && (
                        <div className="p-2 bg-amber-500/15 border border-amber-500/30 rounded-lg text-xs text-amber-300 flex items-start gap-1.5 mt-1">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span>{sug.alertaEspecificacao}</span>
                        </div>
                      )}
                    </div>

                    {/* SELEÇÃO DO MATERIAL CANÔNICO */}
                    <div className="flex flex-col md:items-end gap-2 min-w-[280px]">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleAcao(disc.descricaoItem, 'mesclar')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                            decisao.acao === 'mesclar'
                              ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          Mesclar Linha
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleAcao(disc.descricaoItem, 'separar')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                            decisao.acao === 'separar'
                              ? 'bg-slate-700 text-white border-slate-600'
                              : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-white'
                          }`}
                        >
                          Manter Separado
                        </button>
                      </div>

                      {decisao.acao === 'mesclar' && (
                        <div className="w-full space-y-1.5">
                          <select
                            value={decisao.materialId}
                            onChange={(e) => handleChangeMaterial(disc.descricaoItem, Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                          >
                            <option value={0}>-- Selecione o Material Mestre --</option>
                            {materiaisMestre.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.descricaoPadrao} ({m.unidadePadrao})
                              </option>
                            ))}
                          </select>

                          <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={decisao.lembrar}
                              onChange={() => handleToggleLembrar(disc.descricaoItem)}
                              className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0"
                            />
                            <span>Salvar na base de conhecimento para sempre</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RODAPÉ */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Associações confirmadas serão salvas no dicionário de De-Para e auditadas.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onIgnorar}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition"
            >
              Ignorar e Abrir QC
            </button>
            <button
              type="button"
              disabled={salvando}
              onClick={handleSalvarTudo}
              className="flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              {salvando ? 'Salvando...' : 'Aplicar Conciliação e Abrir QC'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

