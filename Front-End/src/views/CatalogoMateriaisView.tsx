import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { ItemAlias, ItemCanonico, ConversaoPadrao } from '../types';
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
  Calendar,
  User,
  SlidersHorizontal,
  X
} from 'lucide-react';

export function CatalogoMateriaisView() {
  const [activeTab, setActiveTab] = useState<'aliases' | 'materiais' | 'conversoes'>('aliases');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

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
  const [cadNcm, setCadNcm] = useState('');
  const [cadCodigo, setCadCodigo] = useState('');
  const [salvandoMaterial, setSalvandoMaterial] = useState(false);

  // Estados de Conversões
  const [conversoes, setConversoes] = useState<ConversaoPadrao[]>([]);

  // Carregamento de Dados
  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resAliases, resMateriais, resConversoes] = await Promise.all([
        api.listarAliases(filtroAlias),
        api.listarMateriaisMestre(filtroMaterial),
        api.listarConversoesPadrao()
      ]);
      setAliases(resAliases);
      setMateriais(resMateriais);
      setConversoes(resConversoes);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao carregar catálogo de materiais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

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
        codigoNcm: cadNcm.trim() || undefined,
        codigoReferencia: cadCodigo.trim() || undefined,
      });

      setSucesso(`Material mestre "${cadDescricao.trim()}" cadastrado com sucesso!`);
      setModalNovoMaterial(false);
      setCadDescricao('');
      setCadCategoria('');
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
              <h1 className="text-2xl font-bold text-white tracking-tight">Catálogo & Base de Sinônimos (De-Para)</h1>
              <p className="text-sm text-slate-400 mt-1">
                Base de conhecimento contínua da Makinsthal: conciliação inteligente, equivalência de unidades e auditoria de materiais.
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
      <div className="flex items-center gap-2 border-b border-slate-700/60 pb-3">
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
      </div>

      {/* ABA 1: ALIASES & DE-PARA */}
      {activeTab === 'aliases' && (
        <div className="space-y-4">
          {/* BARRA DE PESQUISA */}
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

          {/* TABELA DE ALIASES */}
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
                        Nenhum sinônimo/alias encontrado na base. A cada QC confirmado, novos termos serão aprendidos aqui.
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
                            alias.origem === 'USUARIO_CONFIRMADO' || alias.origem === 'MANUAL'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                          }`}>
                            {alias.origem === 'USUARIO_CONFIRMADO' ? 'Orçamentista' : alias.origem}
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
          {/* BARRA DE PESQUISA */}
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

          {/* TABELA DE MATERIAIS MESTRE */}
          <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700/70">
                  <tr>
                    <th className="py-3.5 px-4">Código / NCM</th>
                    <th className="py-3.5 px-4">Descrição Padronizada</th>
                    <th className="py-3.5 px-4 text-center">Unidade Base</th>
                    <th className="py-3.5 px-4">Categoria</th>
                    <th className="py-3.5 px-4">Criado Em / Por</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {materiais.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        Nenhum material mestre cadastrado ainda. Crie um novo acima ou confirme itens na conciliação do QC!
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
                        <td className="py-3 px-4 text-xs text-slate-400">
                          {mat.categoria || 'Geral'}
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
              <span className="font-semibold text-white">Equalização Automática de Unidades de Medida:</span>
              <p className="text-xs text-slate-400 mt-1">
                Quando fornecedores cotam o mesmo material em unidades diferentes (ex: 30 barras vs 90 metros), o sistema utiliza estas regras oficiais de engenharia para converter e comparar o preço unitário justo sem distorções no QC.
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
                  <span className="text-[10px] text-slate-400 font-medium">Global</span>
                </div>
                <p className="text-xs text-slate-400">{conv.descricaoRegra}</p>
              </div>
            ))}
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
                <label className="text-xs font-semibold text-slate-300">Descrição Padronizada do Material *</label>
                <input
                  type="text"
                  required
                  value={cadDescricao}
                  onChange={(e) => setCadDescricao(e.target.value)}
                  placeholder="Ex: CABO FLEXÍVEL 2,5MM² 750V AZUL"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
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
                    placeholder="Ex: Elétrica"
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
