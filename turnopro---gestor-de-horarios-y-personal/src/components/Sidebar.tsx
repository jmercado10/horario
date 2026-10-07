import React from 'react';
import {
  CalendarDays,
  Users,
  Palmtree,
  BarChart3,
  MessageSquareShare,
  HardDrive,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  workersCount: number;
  pendingVacationsCount: number;
  anomaliesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  workersCount,
  pendingVacationsCount,
  anomaliesCount,
}) => {
  const navItems = [
    {
      id: 'schedule',
      label: 'Cuadrante de Turnos',
      icon: CalendarDays,
      badge: anomaliesCount > 0 ? `${anomaliesCount} alertas` : undefined,
      badgeColor: 'text-amber-700 bg-amber-50',
    },
    {
      id: 'workers',
      label: 'Plantilla de Personal',
      icon: Users,
      badge: `${workersCount}`,
      badgeColor: 'text-slate-600 bg-slate-100',
    },
    {
      id: 'vacations',
      label: 'Vacaciones y Ausencias',
      icon: Palmtree,
      badge: pendingVacationsCount > 0 ? `${pendingVacationsCount} sol.` : undefined,
      badgeColor: 'text-teal-700 bg-teal-50',
    },
    {
      id: 'reports',
      label: 'Reportes de Asistencia',
      icon: BarChart3,
    },
    {
      id: 'messaging',
      label: 'Mensajería & WhatsApp',
      icon: MessageSquareShare,
    },
    {
      id: 'backup',
      label: 'Copia y Datos Locales',
      icon: HardDrive,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 h-screen sticky top-0 border-r border-slate-800">
      {/* Brand header */}
      <div>
        <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            TP
          </div>
          <div>
            <div className="font-semibold text-white tracking-tight text-sm">
              TurnoPro Suite
            </div>
            <div className="text-[11px] text-slate-400">
              Gestión 24/7 · 70 Efectivos
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold tabular-nums shrink-0 ${
                      isActive ? 'bg-indigo-800 text-white' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/80 rounded-lg p-3 text-xs space-y-2 border border-slate-700/50">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Turnos configurados
            </span>
            <span className="font-mono text-white font-semibold">6 activos</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Descanso legal &gt;12h
            </span>
            <span className="font-mono text-emerald-400 font-semibold">Controlado</span>
          </div>
          <div className="pt-1 border-t border-slate-700/60 text-[11px] text-slate-400">
            Modo 100% Local · Exportación a Excel, CSV e iCal sin nube.
          </div>
        </div>
      </div>
    </aside>
  );
};
