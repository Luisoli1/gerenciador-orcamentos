import React, { useState, useEffect, useCallback } from 'react';
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
import { Building2, HardHat } from 'lucide-react';
import type { ViewKey, Obra, QuadroComparativoDto } from './types';
import { api } from './services/api';

function MainApp() {
  const { user, loading, isDono } = useAuth();
  const [activeView, setActiveView] = useState<ViewKey>('qc');
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraId] = useState<number>(1);
  const [loadingObras, setLoadingObras] = useState<boolean>(true);

  // Estado para montar QC na tela selecionado a partir da Central da Obra
  const [selectedQcId, setSelectedQcId] = useState<number | null>(null);
  const [preloadedQcData, setPreloadedQcData] = useState<QuadroComparativoDto | null>(null);

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
