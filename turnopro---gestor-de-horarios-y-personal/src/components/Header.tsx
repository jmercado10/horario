import React, { useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  CalendarCheck,
  ShieldCheck,
  ShieldAlert,
  Clock,
  TrendingUp,
  Upload,
  Building2,
  CalendarDays,
  Plus,
  FolderKanban,
  ChevronDown,
} from 'lucide-react';
import { QuadrantMetadata } from '../types';

interface HeaderProps {
  currentWeekStart: string;
  onWeekChange: (newDateStr: string) => void;
  onOpenPrintModal: () => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
  onExportICS: () => void;
  activeView: string;
  isAdmin: boolean;
  onToggleAdmin: () => void;
  onOpenShiftEditor: () => void;
  onOpenOvertimeModal: () => void;
  onOpenExcelImportModal: () => void;
  onOpenDepartmentManager?: () => void;
  onOpenNewQuadrantModal?: () => void;
  quadrants?: QuadrantMetadata[];
}

export const Header: React.FC<HeaderProps> = ({
  currentWeekStart,
  onWeekChange,
  onOpenPrintModal,
  onExportExcel,
  onExportCSV,
  onExportICS,
  activeView,
  isAdmin,
  onToggleAdmin,
  onOpenShiftEditor,
  onOpenOvertimeModal,
  onOpenExcelImportModal,
  onOpenDepartmentManager,
  onOpenNewQuadrantModal,
  quadrants = [],
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isQuadrantMenuOpen, setIsQuadrantMenuOpen] = useState(false);

  // Compute week range label (e.g., "05 Oct - 11 Oct 2026")
  const startDate = new Date(currentWeekStart + 'T00:00:00');
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const formatDateLabel = (d: Date) => {
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };
  const weekLabel = `${formatDateLabel(startDate)} — ${formatDateLabel(endDate)} ${endDate.getFullYear()}`;

  const handlePrevWeek = () => {
    const prev = new Date(startDate);
    prev.setDate(prev.getDate() - 7);
    onWeekChange(prev.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const next = new Date(startDate);
    next.setDate(next.getDate() + 7);
    onWeekChange(next.toISOString().split('T')[0]);
  };

  const handleCurrentWeek = () => {
    onWeekChange('2026-10-05');
  };

  const getViewTitle = () => {
    switch (activeView) {
      case 'schedule':
        return 'Cuadrante Semanal';
      case 'workers':
        return 'Directorio de Personal';
      case 'vacations':
        return 'Gestión de Vacaciones';
      case 'reports':
        return 'Reportes de Asistencia';
      case 'messaging':
        return 'Mensajería y Notificaciones';
      case 'backup':
        return 'Datos y Copia Local';
      default:
        return 'Organizador de Turnos';
    }
  };

  const isWeekView = activeView === 'schedule' || activeView === 'reports' || activeView === 'messaging';
  const currentQuadrant = quadrants.find((q) => q.weekStartDate === currentWeekStart);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
      {/* Top Bar: Navigation, Brand, Admin Role & Quick Actions */}
      <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-4">
        {/* Zone 1: Context Breadcrumbs & Admin Switch */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center text-xs sm:text-sm">
            <span className="font-semibold text-slate-900 tracking-tight">TurnoPro</span>
            <span className="mx-1.5 sm:mx-2 text-slate-300">/</span>
            <span className="font-medium text-slate-600 truncate max-w-[130px] sm:max-w-none">
              {getViewTitle()}
            </span>
          </div>

          {/* Admin Role Toggle */}
          <button
            onClick={onToggleAdmin}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border shrink-0 ${
              isAdmin
                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs hover:bg-amber-100'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
            title={
              isAdmin
                ? 'Modo Administrador activado: puedes editar turnos y eliminar trabajadores'
                : 'Haga clic para activar Modo Administrador'
            }
          >
            {isAdmin ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="hidden sm:inline">Admin: ON</span>
                <span className="sm:hidden text-[11px]">ON</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="hidden sm:inline">Admin: OFF</span>
                <span className="sm:hidden text-[11px]">OFF</span>
              </>
            )}
          </button>
        </div>

        {/* Zone 2: Actions & Utilities (Clean & responsive, no redundant buttons) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Department Manager shortcut */}
          {onOpenDepartmentManager && (
            <button
              onClick={onOpenDepartmentManager}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
              title="Crear o editar departamentos de la empresa"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="hidden md:inline">Departamentos</span>
            </button>
          )}

          {/* Admin Shortcuts */}
          <button
            onClick={onOpenShiftEditor}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            title="Editar configuración de turnos y horarios"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Config. Turnos</span>
          </button>

          <button
            onClick={onOpenOvertimeModal}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            title="Sumar horas extras y editar patrones rotativos"
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Horas Extras</span>
          </button>

          <button
            onClick={onOpenExcelImportModal}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
            title="Cargar archivo propio de Excel con trabajadores y departamentos"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Cargar Excel</span>
          </button>

          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="hidden sm:inline">Exportar</span>
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-30">
                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    onExportExcel();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-100 text-left transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-medium">Excel (.xlsx)</div>
                    <div className="text-[11px] text-slate-400">Cuadrante, horas y vacaciones</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    onExportCSV();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-100 text-left transition-colors"
                >
                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <div className="font-medium">CSV Delimitado</div>
                    <div className="text-[11px] text-slate-400">Compatible con software ERP</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    onExportICS();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-100 text-left transition-colors"
                >
                  <CalendarCheck className="w-4 h-4 text-purple-600 shrink-0" />
                  <div>
                    <div className="font-medium">Calendario iCal (.ics)</div>
                    <div className="text-[11px] text-slate-400">Formato estándar de calendario local</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Print button */}
          <button
            onClick={onOpenPrintModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            title="Imprimir cuadrante en varios formatos"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="hidden sm:inline">Imprimir / PDF</span>
          </button>

          {/* Modo Local indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="hidden sm:inline">Modo Local</span>
          </div>
        </div>
      </div>

      {/* Sub-bar: Lowered Weekly Date Display & Quadrant Bar ("bajar la visualizacion de la fecha semanal") */}
      {isWeekView && (
        <div className="bg-slate-50/90 border-t border-slate-200/80 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Week Navigation controls & Date Label */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <button
                onClick={handlePrevWeek}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                title="Semana anterior"
                aria-label="Semana anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 px-2.5 py-1 text-slate-800 font-semibold tabular-nums text-xs">
                <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>{weekLabel}</span>
              </div>

              <button
                onClick={handleNextWeek}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                title="Semana siguiente"
                aria-label="Semana siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleCurrentWeek}
                className="px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border-l border-slate-200 transition-colors"
              >
                Hoy
              </button>
            </div>

            {/* Quadrant Selector Dropdown */}
            {quadrants.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setIsQuadrantMenuOpen(!isQuadrantMenuOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-700 shadow-2xs text-xs transition-colors"
                  title="Cambiar cuadrante activo"
                >
                  <FolderKanban className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="font-semibold text-slate-800 truncate max-w-[150px]">
                    {currentQuadrant?.name || 'Cuadrante Activo'}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      currentQuadrant?.status === 'Publicado'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {currentQuadrant?.status || 'Borrador'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </button>

                {isQuadrantMenuOpen && (
                  <div className="absolute left-0 mt-1 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-40 animate-in fade-in duration-100">
                    <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>Cuadrantes ({quadrants.length})</span>
                      {onOpenNewQuadrantModal && (
                        <button
                          onClick={() => {
                            setIsQuadrantMenuOpen(false);
                            onOpenNewQuadrantModal();
                          }}
                          className="text-indigo-600 hover:text-indigo-800 text-[11px] font-semibold flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Nuevo</span>
                        </button>
                      )}
                    </div>

                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
                      {quadrants.map((q) => {
                        const isSelected = q.weekStartDate === currentWeekStart;
                        return (
                          <button
                            key={q.weekStartDate}
                            onClick={() => {
                              onWeekChange(q.weekStartDate);
                              setIsQuadrantMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between ${
                              isSelected
                                ? 'bg-indigo-50/70 text-indigo-900 font-bold'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <div className="truncate font-medium">{q.name}</div>
                              <div className="text-[10px] text-slate-400 font-normal">
                                Semana del {q.weekStartDate}
                              </div>
                            </div>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                                q.status === 'Publicado'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {q.status}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Week metadata / indicator on the right side of the lowered bar */}
          <div className="flex items-center gap-3 text-slate-500 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Planificación activa
            </span>
            {currentQuadrant?.generatorPattern && (
              <span className="text-slate-500 hidden md:inline">
                Patrón: <strong className="text-slate-700 font-semibold">{currentQuadrant.generatorPattern}</strong>
              </span>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

