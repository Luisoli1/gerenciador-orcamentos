import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Sidebar } from './components/Sidebar';
import { QCView } from './views/Qcview';
import { VariationView } from './views/VariationView';
import { ObrasView } from './views/ObrasView';
import { FornecedoresView } from './views/FornecedoresView';
import { FaturamentoDiretoView } from './views/FaturamentoDiretoView';
import { UsuariosView } from './views/UsuariosView';
import { AuditoriaView } from './views/AuditoriaView';
import { LoginView } from './views/LoginView';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Building2, HardHat, FolderDown, Check, X, FolderOpen, Info, ShieldCheck } from 'lucide-react';
import type { ViewKey, Obra, QuadroComparativoDto } from './types';
import { api } from './services/api';
import { getDownloadPreference, setDownloadPreference, type DownloadMode } from './utils/fileDownloader';

function MainApp() {
  const { user, loading, isDono } = useAuth();
  const [activeView, setActiveView] = useState<ViewKey>('qc');
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraId] = useState<number>(1);
  const [loadingObras, setLoadingObras] = useState<boolean>(true);

  // Estado para montar QC na tela selecionado a partir da Central da Obra
  const [selectedQcId, setSelectedQcId] = useState<number | null>(null);
  const [preloadedQcData, setPreloadedQcData] = useState<QuadroComparativoDto | null>(null);

  // Preferência individual de Downloads da máquina do usuário
  const [modalDownloadAberto, setModalDownloadAberto] = useState<boolean>(false);
  const [downloadMode, setDownloadMode] = useState<DownloadMode>(() => getDownloadPreference(user?.id));

  const handleSalvarPreferenciaDownload = (novoModo: DownloadMode) => {
    setDownloadMode(novoModo);
    setDownloadPreference(novoModo, user?.id);
  };

  // Buscar as obras reais diretamente do backend Spring Boot
  const carregarObras = useCallback(() => {
    if (!user) return;
    setLoadingObras(true);
    api.listarObras()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setObras(data);
          setObraId(prev => {
            const existe = data.some((o: Obra) => o.id === prev);
            return existe ? prev : data[0].id!;
          });
        } else {
          setObras([]);
        }
        setLoadingObras(false);
      })
      .catch(err => {
        console.error("Erro ao carregar obras do backend:", err);
        setLoadingObras(false);
      });
  }, [user]);

  useEffect(() => {
    if (user) {
      carregarObras();
    }
  }, [user, carregarObras]);

  // Se estiver carregando verificação de autenticação inicial
  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-300 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <HardHat className="w-7 h-7 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold tracking-wide uppercase text-slate-400">
            Carregando ambiente seguro Makinsthal...
          </span>
        </div>
      </div>
    );
  }

  // Se não estiver logado, exibe a tela de login
  if (!user) {
    return <LoginView />;
  }

  // Navegação unificada com troca opcional de obra
  const handleNavigate = (view: ViewKey, targetObraId?: number) => {
    if (targetObraId) {
      setObraId(targetObraId);
    }
    setActiveView(view);
  };

  // Carregar e montar QC específico na tela vindo da Central da Obra
  const handleSelectQc = async (qcId: number, targetObraId: number) => {
    setObraId(targetObraId);
    setSelectedQcId(qcId);
    try {
      const data = await api.buscarQcComparativo(qcId);
      setPreloadedQcData(data);
    } catch (e) {
      console.error("Erro ao carregar QC montado:", e);
    }
    setActiveView('qc');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Barra Lateral */}
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar com Seletor Dinâmico de Obras */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-sm font-semibold text-slate-200">
                Makinsthal Engenharia • Gestão de Compras & Orçamentos
              </h2>
              <p className="text-xs text-slate-400">
                {user ? `Conectado como ${user.nome} (${user.role === 'DONO' ? 'Dono' : 'Operador'})` : ''}
              </p>
            </div>
          </div>

            {/* SELETOR LIGADO AO BACKEND */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Obra Ativa:</span>
              {loadingObras ? (
                <span className="text-xs text-slate-500">A carregar obras...</span>
              ) : obras.length === 0 ? (
                <span className="text-xs text-amber-400">Nenhuma obra encontrada</span>
              ) : (
                <select 
                  value={obraId} 
                  onChange={(e) => {
                    setObraId(Number(e.target.value));
                    setSelectedQcId(null);
                    setPreloadedQcData(null);
                  }}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                >
                  {obras.map((obra) => (
                    <option key={obra.id} value={obra.id}>
                      #{obra.id} - {obra.nomeObra || `Obra ${obra.id}`}
                    </option>
                  ))}
                </select>
              )}

              {/* Botão de Preferência de Download / Escolha de Pasta */}
              <button
                type="button"
                onClick={() => setModalDownloadAberto(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer shadow-sm ml-1"
                title="Configurar onde salvar downloads (Janela do Windows ou Pasta Padrão)"
              >
                <FolderDown className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Pasta de Downloads</span>
              </button>
            </div>
        </header>

        {/* Área Dinâmica das Vistas com Layout Fluido em Tela Cheia */}
        <main className="flex-1 overflow-y-auto w-full">
          <div className="w-full">
            {activeView === 'qc' && (
              <QCView 
                obraId={obraId} 
                initialQcId={selectedQcId}
                initialQcData={preloadedQcData}
                onClearInitialQc={() => {
                  setSelectedQcId(null);
                  setPreloadedQcData(null);
                }}
              />
            )}
            {activeView === 'variation' && <VariationView />}
            {activeView === 'obras' && (
              <ObrasView 
                activeObraId={obraId}
                onSelectObra={(id) => handleNavigate('qc', id)}
                onNavigate={handleNavigate}
                onSelectQc={handleSelectQc}
                onObrasChanged={carregarObras}
              />
            )}
            {activeView === 'fornecedores' && <FornecedoresView />}
            {activeView === 'faturamento' && <FaturamentoDiretoView obraId={obraId} />}
            {activeView === 'usuarios' && isDono && <UsuariosView />}
            {activeView === 'auditoria' && isDono && <AuditoriaView />}
          </div>
        </main>
      </div>

      {/* MODAL DE PREFERÊNCIAS DE DOWNLOAD E PASTAS */}
      {modalDownloadAberto && createPortal(
        <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-scaleUp">
            
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
                  <FolderDown className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    Onde Salvar os Downloads
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Preferência individual do seu usuário para planilhas e relatórios
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalDownloadAberto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label 
                onClick={() => handleSalvarPreferenciaDownload('salvar_como')}
                className={`p-4 rounded-2xl border cursor-pointer flex items-start gap-3.5 transition-all ${
                  downloadMode === 'salvar_como'
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/5'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="downloadMode"
                  checked={downloadMode === 'salvar_como'}
                  onChange={() => handleSalvarPreferenciaDownload('salvar_como')}
                  className="mt-1 text-amber-500 focus:ring-amber-400"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold text-slate-100">
                      Escolher pasta no Windows (Salvar Como...)
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Ao baixar qualquer QC ou Faturamento Direto, o sistema abre a janela de arquivos do Windows para você escolher a pasta da obra. O Windows guarda a pasta usada para os próximos downloads!
                  </p>
                </div>
              </label>

              <label 
                onClick={() => handleSalvarPreferenciaDownload('direto_downloads')}
                className={`p-4 rounded-2xl border cursor-pointer flex items-start gap-3.5 transition-all ${
                  downloadMode === 'direto_downloads'
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/5'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="downloadMode"
                  checked={downloadMode === 'direto_downloads'}
                  onChange={() => handleSalvarPreferenciaDownload('direto_downloads')}
                  className="mt-1 text-amber-500 focus:ring-amber-400"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FolderDown className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-bold text-slate-100">
                      Download direto na pasta padrão do navegador
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Salva diretamente na pasta padrão de Downloads do seu computador sem abrir janela de confirmação.
                  </p>
                </div>
              </label>
            </div>

            {/* Caixa de Ajuda / Instrução do Navegador */}
            <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-1.5 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Dica para qualquer navegador (Chrome / Edge):</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Para que o seu navegador sempre pergunte a pasta em todos os sites: acesse as <strong>Configurações</strong> do Chrome/Edge &gt; <strong>Downloads</strong> &gt; Ative a opção <em>"Perguntar onde salvar cada arquivo antes de fazer download"</em>.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setModalDownloadAberto(false)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Concluir
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
