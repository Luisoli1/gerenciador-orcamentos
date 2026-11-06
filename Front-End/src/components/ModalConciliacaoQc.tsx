import React, { useState } from 'react';
import type { VerificacaoConciliacaoResponse, ItemCanonico } from '../types';
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  ShieldCheck,
  Link2
} from 'lucide-react';

interface ModalConciliacaoQcProps {
  verificacao: VerificacaoConciliacaoResponse;
  materiaisMestre: ItemCanonico[];
  itensOutrosFornecedores?: Array<{ fornecedor: string; descricao: string; unidade?: string }>;
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
  itensOutrosFornecedores = [],
  onConfirmar,
  onIgnorar,
}: ModalConciliacaoQcProps) {
  // Estado para cada discrepância/sugestão
  const [decisoes, setDecisoes] = useState<Record<string, {
    acao: 'mesclar' | 'separar';
    materialId: number;
    itemCorrespondenteDesc: string;
    nomeCustomizado: string;
    lembrar: boolean;
  }>>(() => {
    const initial: Record<string, any> = {};

    verificacao.discrepancias.forEach((disc) => {
      const primeiroSug = disc.possiveisEquivalentes?.[0];
      const outroDesc = primeiroSug?.descricaoCanonico || primeiroSug?.itemDescricaoEquivalente || '';
      initial[disc.descricaoItem] = {
        acao: 'mesclar',
        materialId: primeiroSug?.itemCanonicoSugeridoId || 0,
        itemCorrespondenteDesc: outroDesc,
        nomeCustomizado: primeiroSug?.descricaoCanonico || disc.descricaoItem,
        lembrar: true
      };
    });

    verificacao.sugestoes.forEach((sug) => {
      if (!initial[sug.itemDescricaoOriginal]) {
        initial[sug.itemDescricaoOriginal] = {
          acao: 'mesclar',
          materialId: sug.itemCanonicoSugeridoId || 0,
          itemCorrespondenteDesc: sug.itemDescricaoEquivalente || '',
          nomeCustomizado: sug.descricaoCanonico || sug.itemDescricaoOriginal,
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

  const handleChangeCorrespondente = (itemDescricao: string, outroDesc: string) => {
    setDecisoes(prev => {
      const atual = prev[itemDescricao];
      let nomeSugerido = atual?.nomeCustomizado || itemDescricao;
      if (outroDesc && (!atual?.nomeCustomizado || atual.nomeCustomizado === itemDescricao)) {
        nomeSugerido = itemDescricao;
      }
      return {
        ...prev,
        [itemDescricao]: {
          ...atual,
          itemCorrespondenteDesc: outroDesc,
          nomeCustomizado: nomeSugerido
        }
      };
    });
  };

  const handleChangeNomeCustomizado = (itemDescricao: string, nome: string) => {
    setDecisoes(prev => ({
      ...prev,
      [itemDescricao]: {
        ...prev[itemDescricao],
        nomeCustomizado: nome
      }
    }));
  };

  const handleChangeMaterialMestre = (itemDescricao: string, matId: number) => {
    const mat = materiaisMestre.find(m => m.id === matId);
    setDecisoes(prev => ({
      ...prev,
      [itemDescricao]: {
        ...prev[itemDescricao],
        materialId: matId,
        nomeCustomizado: mat ? mat.descricaoPadrao : prev[itemDescricao]?.nomeCustomizado || ''
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
    const listaAprovadas: Array<any> = [];

    Object.entries(decisoes).forEach(([descOriginal, d]) => {
      if (d.acao !== 'mesclar') return;

      const nomeFinal = d.nomeCustomizado?.trim() || descOriginal;

      // 1. Associa o item A
      listaAprovadas.push({
        descricaoOriginal: descOriginal,
        itemCanonicoId: d.materialId > 0 ? d.materialId : undefined,
        criarNovoCanonico: d.materialId <= 0,
        novaDescricaoCanonico: nomeFinal,
        lembrarPermanente: d.lembrar,
      });

      // 2. Se o usuário vinculou a outro item de outro orçamento, associa o item B ao mesmo material!
      if (d.itemCorrespondenteDesc && d.itemCorrespondenteDesc.trim().length > 0) {
        listaAprovadas.push({
          descricaoOriginal: d.itemCorrespondenteDesc.trim(),
          itemCanonicoId: d.materialId > 0 ? d.materialId : undefined,
          criarNovoCanonico: d.materialId <= 0,
          novaDescricaoCanonico: nomeFinal,
          lembrarPermanente: d.lembrar,
        });
      }
    });

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
                Conciliar Materiais entre Cotações
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-md border border-amber-500/30">
                  Pareamento Direto & Aprendizado
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Conecte os itens correspondentes dos fornecedores para que apareçam na mesma linha do Quadro Comparativo e memorizem esse sinônimo para sempre.
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
                Itens Pendentes de Conciliação
              </p>
              <p className="text-slate-300">
                {verificacao.mensagemAlerta}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Revise os itens abaixo ou vincule qualquer material a uma cotação concorrente.</span>
          </div>
        )}

        {/* LISTA DE SUGESTÕES / DISCREPÂNCIAS */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {verificacao.discrepancias.length === 0 && verificacao.sugestoes.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              Nenhuma linha pendente de conciliação detectada neste momento.
            </div>
          ) : (
            verificacao.discrepancias.map((disc, idx) => {
              const decisao = decisoes[disc.descricaoItem] || { 
                acao: 'mesclar', 
                materialId: 0, 
                itemCorrespondenteDesc: '',
                nomeCustomizado: disc.descricaoItem, 
                lembrar: true 
              };
              const sug = disc.possiveisEquivalentes?.[0];

              // Constrói lista de candidatos para pareamento
              const candidatosPareamento: Array<{ descricao: string; label: string }> = [];
              if (disc.possiveisEquivalentes) {
                disc.possiveisEquivalentes.forEach(s => {
                  const desc = s.descricaoCanonico || s.itemDescricaoEquivalente;
                  if (desc && desc !== disc.descricaoItem && !candidatosPareamento.some(c => c.descricao === desc)) {
                    candidatosPareamento.push({
                      descricao: desc,
                      label: `${s.fornecedorNome ? '[' + s.fornecedorNome + '] ' : ''}${desc} (Sugerido ${s.confianca}%)`
                    });
                  }
                });
              }
              itensOutrosFornecedores.forEach(it => {
                if (it.descricao !== disc.descricaoItem && !candidatosPareamento.some(c => c.descricao === it.descricao)) {
                  candidatosPareamento.push({
                    descricao: it.descricao,
                    label: `[${it.fornecedor}] ${it.descricao}`
                  });
                }
              });

              return (
                <div 
                  key={idx}
                  className={`p-4 rounded-xl border transition-all ${
                    decisao.acao === 'mesclar'
                      ? 'bg-slate-800/80 border-slate-700 hover:border-amber-500/40'
                      : 'bg-slate-900/40 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* LADO ESQUERDO: ITEM ORIGINAL */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-slate-700 text-slate-200 text-[11px] font-semibold rounded">
                          {disc.fornecedorPresente}
                        </span>
                        {sug && (
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                            sug.confianca >= 80
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {sug.confianca}% Similaridade
                          </span>
                        )}
                      </div>

                      <p className="font-mono text-sm font-bold text-white bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                        {disc.descricaoItem}
                      </p>

                      {sug && sug.justificativa && (
                        <p className="text-xs text-slate-400">
                          {sug.justificativa}
                        </p>
                      )}
                    </div>

                    {/* LADO DIREITO: CONTROLES DE CONCILIAÇÃO */}
                    <div className="flex flex-col gap-2.5 min-w-[340px]">
                      <div className="flex items-center justify-between gap-2">
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
                      </div>

                      {decisao.acao === 'mesclar' && (
                        <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-700/80">
                          {/* PAREAR COM ITEM DO OUTRO FORNECEDOR */}
                          {candidatosPareamento.length > 0 && (
                            <div className="space-y-1">
                              <label className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                                <Link2 className="w-3.5 h-3.5" />
                                <span>Vincular com item da outra cotação:</span>
                              </label>
                              <select
                                value={decisao.itemCorrespondenteDesc}
                                onChange={(e) => handleChangeCorrespondente(disc.descricaoItem, e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                              >
                                <option value="">-- Selecione o item correspondente --</option>
                                {candidatosPareamento.map((c, cIdx) => (
                                  <option key={cIdx} value={c.descricao}>
                                    {c.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* NOME PADRONIZADO DA LINHA */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-slate-300">
                              Nome da linha no Comparativo (Material Mestre):
                            </label>
                            <input
                              type="text"
                              value={decisao.nomeCustomizado}
                              onChange={(e) => handleChangeNomeCustomizado(disc.descricaoItem, e.target.value)}
                              placeholder="Digite ou ajuste o nome padronizado da linha"
                              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          {/* OU SELECIONAR DO CATÁLOGO MESTRE */}
                          {materiaisMestre.length > 0 && (
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400">
                                Ou vincular a um material já cadastrado:
                              </label>
                              <select
                                value={decisao.materialId}
                                onChange={(e) => handleChangeMaterialMestre(disc.descricaoItem, Number(e.target.value))}
                                className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-400 focus:outline-none focus:border-amber-500"
                              >
                                <option value={0}>-- Selecionar do Catálogo (Opcional) --</option>
                                {materiaisMestre.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.descricaoPadrao} ({m.unidadePadrao})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* LEMBRAR PERMANENTE */}
                          <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer select-none pt-1">
                            <input
                              type="checkbox"
                              checked={decisao.lembrar}
                              onChange={() => handleToggleLembrar(disc.descricaoItem)}
                              className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-0"
                            />
                            <span>Salvar no De-Para para orçamentos futuros</span>
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
            <span>Associações confirmadas unificam a linha no QC e alimentam o aprendizado de IA.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onIgnorar}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="button"
              disabled={salvando}
              onClick={handleSalvarTudo}
              className="flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {salvando ? 'Salvando...' : 'Aplicar Conciliação e Unificar no QC'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
