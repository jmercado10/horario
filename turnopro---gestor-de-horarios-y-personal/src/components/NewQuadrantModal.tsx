import React, { useState, useMemo } from 'react';
import { Worker, VacationRequest, ShiftAssignment, QuadrantMetadata } from '../types';
import {
  CalendarDays,
  Calendar,
  Sparkles,
  Copy,
  Layers,
  FilePlus,
  CheckCircle2,
  Clock,
  Users,
  FolderKanban,
  Trash2,
  ArrowRight,
  X,
  Building2,
} from 'lucide-react';
import { getWeekDates } from '../services/scheduleGenerator';

interface NewQuadrantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeekStart: string;
  workers: Worker[];
  departments: string[];
  vacations: VacationRequest[];
  quadrants: QuadrantMetadata[];
  onCreateQuadrant: (params: {
    weekStartDate: string;
    name: string;
    description?: string;
    mode: 'auto' | 'pattern' | 'copy' | 'blank';
    pattern?: string;
    selectedDepartments: string[];
    respectVacations: boolean;
    status: 'Borrador' | 'Publicado';
  }) => void;
  onSelectQuadrant: (weekStartDate: string) => void;
  onDeleteQuadrant?: (weekStartDate: string) => void;
}

export const NewQuadrantModal: React.FC<NewQuadrantModalProps> = ({
  isOpen,
  onClose,
  currentWeekStart,
  workers,
  departments,
  quadrants,
  onCreateQuadrant,
  onSelectQuadrant,
  onDeleteQuadrant,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');

  // Compute next Monday by default
  const defaultNextWeek = useMemo(() => {
    const d = new Date(currentWeekStart + 'T00:00:00');
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }, [currentWeekStart]);

  const [startDate, setStartDate] = useState(defaultNextWeek);

  // Generate nice default title
  const computedWeekLabel = useMemo(() => {
    const dates = getWeekDates(startDate);
    const start = new Date(dates[0] + 'T00:00:00');
    const end = new Date(dates[6] + 'T00:00:00');
    const startStr = start.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    const endStr = end.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    return `Cuadrante ${startStr} — ${endStr}`;
  }, [startDate]);

  const [name, setName] = useState(computedWeekLabel);
  const [isNameCustomized, setIsNameCustomized] = useState(false);
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'auto' | 'pattern' | 'copy' | 'blank'>('auto');
  const [uniformPattern, setUniformPattern] = useState<'5x2' | '6x2' | '4x2' | 'Rotativo Completo' | 'Fijo Mañana' | 'Fijo Central'>('5x2');
  const [allDepartments, setAllDepartments] = useState(true);
  const [selectedDepts, setSelectedDepts] = useState<string[]>(departments);
  const [respectVacations, setRespectVacations] = useState(true);
  const [status, setStatus] = useState<'Borrador' | 'Publicado'>('Publicado');

  // When date changes and name hasn't been custom typed, update name
  const handleDateChange = (newDate: string) => {
    setStartDate(newDate);
    if (!isNameCustomized) {
      const dates = getWeekDates(newDate);
      const start = new Date(dates[0] + 'T00:00:00');
      const end = new Date(dates[6] + 'T00:00:00');
      const startStr = start.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      const endStr = end.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      setName(`Cuadrante ${startStr} — ${endStr}`);
    }
  };

  const handleQuickAddDays = (days: number) => {
    const d = new Date(currentWeekStart + 'T00:00:00');
    d.setDate(d.getDate() + days);
    handleDateChange(d.toISOString().split('T')[0]);
  };

  const toggleDept = (dept: string) => {
    if (selectedDepts.includes(dept)) {
      if (selectedDepts.length > 1) {
        setSelectedDepts(selectedDepts.filter((d) => d !== dept));
      }
    } else {
      setSelectedDepts([...selectedDepts, dept]);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateQuadrant({
      weekStartDate: startDate,
      name: name.trim() || computedWeekLabel,
      description: description.trim() || undefined,
      mode,
      pattern: mode === 'pattern' ? uniformPattern : undefined,
      selectedDepartments: allDepartments ? departments : selectedDepts,
      respectVacations,
      status,
    });
    onClose();
  };

  const datesPreview = getWeekDates(startDate);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60] animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Gestor de Cuadrantes de Turno
              </h2>
              <p className="text-xs text-slate-500">
                Planifique y cree nuevos cuadrantes semanales con rotaciones automáticas o plantillas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveTab('create')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'create'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>+ Crear Nuevo Cuadrante</span>
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'list'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Cuadrantes Registrados ({quadrants.length})</span>
          </button>
        </div>

        {/* Tab 1: Create New Quadrant */}
        {activeTab === 'create' && (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
            {/* 1. Name & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre del Cuadrante
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setIsNameCustomized(true);
                  }}
                  placeholder="Ej: Cuadrante Semana 42..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fecha de Inicio (Lunes de la semana)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Quick date presets */}
            <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[11px] font-medium text-slate-500">Atajos de fecha:</span>
              <button
                type="button"
                onClick={() => handleQuickAddDays(7)}
                className="text-[11px] px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium rounded-md shadow-2xs"
              >
                +1 Semana ({new Date(new Date(currentWeekStart + 'T00:00:00').setDate(new Date(currentWeekStart + 'T00:00:00').getDate() + 7)).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })})
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddDays(14)}
                className="text-[11px] px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium rounded-md shadow-2xs"
              >
                +2 Semanas
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddDays(21)}
                className="text-[11px] px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium rounded-md shadow-2xs"
              >
                +3 Semanas
              </button>
              <button
                type="button"
                onClick={() => handleDateChange(currentWeekStart)}
                className="text-[11px] px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium rounded-md shadow-2xs ml-auto"
              >
                Semana Actual
              </button>
            </div>

            {/* Range indicator banner */}
            <div className="px-3 py-2 bg-indigo-50/60 border border-indigo-100 rounded-lg flex items-center justify-between text-xs text-indigo-900">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>
                  Período a planificar: <strong>{datesPreview[0]}</strong> al <strong>{datesPreview[6]}</strong> (7 jornadas continuas)
                </span>
              </div>
              <span className="font-semibold text-[11px] bg-indigo-200/60 px-2 py-0.5 rounded text-indigo-800">
                Lunes - Domingo
              </span>
            </div>

            {/* 2. Generation Mode */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Método de Generación de Turnos
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Mode: Auto */}
                <label
                  className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                    mode === 'auto'
                      ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="genMode"
                    value="auto"
                    checked={mode === 'auto'}
                    onChange={() => setMode('auto')}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Rotación Automática Equilibrada
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Aplica el patrón configurado a cada empleado (5x2, 6x2, 4x2, Rotativo) con cobertura continua 24/7.
                    </p>
                  </div>
                </label>

                {/* Mode: Copy */}
                <label
                  className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                    mode === 'copy'
                      ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="genMode"
                    value="copy"
                    checked={mode === 'copy'}
                    onChange={() => setMode('copy')}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Copy className="w-3.5 h-3.5 text-indigo-600" />
                      Duplicar Cuadrante Actual
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Copia con exactitud las asignaciones de la semana actual ({currentWeekStart}) para realizar ajustes menores.
                    </p>
                  </div>
                </label>

                {/* Mode: Uniform Pattern */}
                <label
                  className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                    mode === 'pattern'
                      ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="genMode"
                    value="pattern"
                    checked={mode === 'pattern'}
                    onChange={() => setMode('pattern')}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      Patrón Específico Uniforme
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Fuerza un único patrón de rotación a toda la plantilla para este cuadrante.
                    </p>
                  </div>
                </label>

                {/* Mode: Blank */}
                <label
                  className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                    mode === 'blank'
                      ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="genMode"
                    value="blank"
                    checked={mode === 'blank'}
                    onChange={() => setMode('blank')}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <FilePlus className="w-3.5 h-3.5 text-indigo-600" />
                      Cuadrante en Blanco
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Inicia con todos los turnos en descanso (OFF) para asignarlos manualmente casilla por casilla.
                    </p>
                  </div>
                </label>
              </div>

              {/* Pattern selector if uniform pattern */}
              {mode === 'pattern' && (
                <div className="pt-2 pl-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Seleccionar patrón para este cuadrante:
                  </label>
                  <select
                    value={uniformPattern}
                    onChange={(e) => setUniformPattern(e.target.value as any)}
                    className="w-full sm:w-72 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="5x2">5x2 Rotativo Semanal (M / T / N)</option>
                    <option value="6x2">6x2 Continuo Industrial</option>
                    <option value="4x2">4x2 Rápido</option>
                    <option value="Rotativo Completo">Rotativo Completo 3 Turnos</option>
                    <option value="Fijo Mañana">Fijo Mañana (06:00 - 14:00)</option>
                    <option value="Fijo Central">Fijo Central (08:30 - 17:30)</option>
                  </select>
                </div>
              )}
            </div>

            {/* 3. Scope of Departments */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  Alcance de Departamentos
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAllDepartments(true);
                      setSelectedDepts(departments);
                    }}
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded transition-colors ${
                      allDepartments
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Todos los Dptos. ({workers.length} trab.)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllDepartments(false)}
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded transition-colors ${
                      !allDepartments
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Personalizar Selección
                  </button>
                </div>
              </div>

              {!allDepartments && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {departments.map((dept) => {
                    const count = workers.filter((w) => w.department === dept).length;
                    const isChecked = selectedDepts.includes(dept);
                    return (
                      <label
                        key={dept}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-white border-indigo-300 text-indigo-950 font-medium'
                            : 'bg-slate-100/50 border-transparent text-slate-500'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleDept(dept)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="truncate">{dept}</span>
                        <span className="text-[10px] text-slate-400 font-mono ml-auto">
                          ({count})
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. Extra options & status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={respectVacations}
                  onChange={(e) => setRespectVacations(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800">
                    Sincronizar vacaciones y bajas médicas
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Asigna automáticamente los códigos VAC y BAJ correspondientes a las fechas aprobadas.
                  </p>
                </div>
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estado Inicial del Cuadrante
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Publicado">Publicado (Visible y oficial para el equipo)</option>
                  <option value="Borrador">Borrador (Solo visible en edición administrativa)</option>
                </select>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md flex items-center gap-2 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Crear Cuadrante y Abrir</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Saved Quadrants History */}
        {activeTab === 'list' && (
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Listado de todos los cuadrantes registrados en el sistema</span>
              <span>Total: <strong className="text-slate-800">{quadrants.length}</strong> cuadrantes</span>
            </div>

            <div className="space-y-2.5">
              {quadrants.map((q) => {
                const isCurrent = q.weekStartDate === currentWeekStart;
                const dates = getWeekDates(q.weekStartDate);

                return (
                  <div
                    key={q.id || q.weekStartDate}
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-indigo-50/50 border-indigo-300 ring-1 ring-indigo-200'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">
                            {q.name}
                          </h4>
                          {isCurrent && (
                            <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">
                              Activo ahora
                            </span>
                          )}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              q.status === 'Publicado'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {q.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {dates[0]} al {dates[6]}
                          </span>
                          {q.generatorPattern && (
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-indigo-400" />
                              {q.generatorPattern}
                            </span>
                          )}
                          {q.assignedWorkersCount !== undefined && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-slate-400" />
                              {q.assignedWorkersCount} trabajadores
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectQuadrant(q.weekStartDate);
                            onClose();
                          }}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs ${
                            isCurrent
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{isCurrent ? 'Viendo' : 'Abrir'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>

                        {onDeleteQuadrant && quadrants.length > 1 && !isCurrent && (
                          <button
                            type="button"
                            onClick={() => onDeleteQuadrant(q.weekStartDate)}
                            title="Eliminar cuadrante"
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
