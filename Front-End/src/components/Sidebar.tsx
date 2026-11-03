import React from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  FolderKanban, 
  Building2, 
  ReceiptText, 
  Truck,
  Users, 
  ShieldAlert, 
  LogOut, 
  Shield, 
  User 
} from 'lucide-react';
import type { ViewKey } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeView: ViewKey;
  onViewChange: (view: ViewKey) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { user, isDono, logout } = useAuth();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-100 text-sm tracking-wide">MAKINS THAL</h1>
            <p className="text-xs text-amber-400 font-semibold">Engenharia & Instalações</p>
          </div>
        </div>

        {/* Navegação Principal */}
        <nav className="space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Módulos Operacionais
          </div>

          <button
            onClick={() => onViewChange('qc')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'qc' 
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20' 
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Comparativo (QC)</span>
          </button>

          <button
            onClick={() => onViewChange('variation')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'variation' 
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20' 
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Variação de Preços</span>
          </button>

          <button
            onClick={() => onViewChange('obras')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'obras' 
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20' 
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>Histórico de Obras</span>
          </button>

          <button
            onClick={() => onViewChange('fornecedores')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'fornecedores' 
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20' 
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Fornecedores</span>
          </button>

          <button
            onClick={() => onViewChange('faturamento')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeView === 'faturamento' 
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20' 
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
          >
            <ReceiptText className="w-4 h-4" />
            <span>Faturamento Direto</span>
          </button>

          {/* Menus Exclusivos do Dono */}
          {isDono && (
            <div className="pt-4 mt-3 border-t border-slate-800 space-y-1">
              <div className="text-[10px] font-bold text-amber-400/90 uppercase tracking-wider px-3 mb-2 flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-amber-400" />
                <span>Gestão Master (Dono)</span>
              </div>

              <button
                onClick={() => onViewChange('usuarios')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeView === 'usuarios' 
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20' 
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Gestão de Usuários</span>
              </button>

              <button
                onClick={() => onViewChange('auditoria')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeView === 'auditoria' 
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20' 
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Trilha de Auditoria</span>
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Card do Usuário Logado & Logout */}
      <div className="space-y-3">
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0">
              {user?.nome ? user.nome.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div className="overflow-hidden">
              <span className="block font-semibold text-xs text-slate-200 truncate">
                {user?.nome || 'Usuário'}
              </span>
              <span className="block text-[10px] text-slate-400 truncate">
                {user?.role === 'DONO' ? '⭐ Dono da Aplicação' : 'Operador'}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
            title="Sair do Sistema"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="px-2 text-[10px] text-slate-500 text-center">
          Makinsthal v2.0 • Ambiente Seguro
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
