import React, { useState, useMemo } from 'react';
import {
  Worker,
  ShiftAssignment,
  ShiftCode,
  Department,
  VacationRequest,
  ShiftDefinition,
  OvertimeRecord,
} from '../types';
import {
  computeDailyCoverage,
  validateSchedule,
  generateAssignmentsForWeek,
} from '../services/scheduleGenerator';
import {
  Search,
  RotateCcw,
  ArrowLeftRight,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Info,
  Clock,
  TrendingUp,
  Building2,
  Plus,
} from 'lucide-react';

interface WeeklyScheduleViewProps {
  workers: Worker[];
  assignments: ShiftAssignment[];
  dates: string[];
  currentWeekStart: string;
  vacations: VacationRequest[];
  shifts: Record<string, ShiftDefinition>;
  overtimeRecords: OvertimeRecord[];
  onUpdateAssignment: (workerId: string, date: string, newShiftCode: ShiftCode) => void;
  onRegenerateSchedule: (pattern: '5x2' | '6x2' | '4x2' | 'Rotativo Completo') => void;
  onSwapShifts: (worker1Id: string, worker2Id: string, date: string) => void;
  onOpenShiftEditor?: () => void;
  onOpenOvertimeModal?: () => void;
  departments?: string[];
  onOpenDepartmentManager?: () => void;
  onOpenNewQuadrantModal?: () => void;
}

export const WeeklyScheduleView: React.FC<WeeklyScheduleViewProps> = ({
  workers,
  assignments,
  dates,
  vacations,
  shifts,
  overtimeRecords,
  onUpdateAssignment,
  onRegenerateSchedule,
  onSwapShifts,
  onOpenShiftEditor,
  onOpenOvertimeModal,
  departments = [
    'Producción',
    'Operaciones',
    'Mantenimiento',
    'Calidad',
    'Atención al Cliente',
    'Administración y RRHH',
  ],
  onOpenDepartmentManager,
  onOpenNewQuadrantModal,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCellEdit, setActiveCellEdit] = useState<{
    workerId: string;
    date: string;
    currentCode: ShiftCode;
  } | null>(null);

  // Quick generator modal state
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState<'5x2' | '6x2' | '4x2' | 'Rotativo Completo'>('5x2');

  // Swap modal state
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [swapWorker1, setSwapWorker1] = useState<string>('');
  const [swapWorker2, setSwapWorker2] = useState<string>('');
  const [swapDate, setSwapDate] = useState<string>(dates[0]);

  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // Filtered workers
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      const matchDept = selectedDept === 'Todos' || w.department === selectedDept;
      const matchQuery =
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.role.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDept && matchQuery;
    });
  }, [workers, selectedDept, searchQuery]);

  // Anomalies / Alerts
  const anomalies = useMemo(() => {
    return validateSchedule(workers, assignments, vacations);
  }, [workers, assignments, vacations]);

  // Map assignments for fast lookup: `${workerId}_${date}`
  const assignmentMap = useMemo(() => {
    const map = new Map<string, ShiftAssignment>();
    assignments.forEach((a) => {
      map.set(`${a.workerId}_${a.date}`, a);
    });
    return map;
  }, [assignments]);

  const handleShiftSelect = (worker: Worker, date: string, newCode: ShiftCode) => {
    onUpdateAssignment(worker.id, date, newCode);
    setActiveCellEdit(null);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-5">
      {/* Top Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, cargo o ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Todos">Todos los Departamentos ({workers.length})</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d} ({workers.filter((w) => w.department === d).length})
                </option>
              ))}
            </select>

            {onOpenDepartmentManager && (
              <button
                type="button"
                onClick={onOpenDepartmentManager}
                title="Añadir o editar departamentos"
                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 text-xs"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gestionar Dptos.</span>
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500">
            Mostrando <span className="font-semibold text-slate-800 tabular-nums">{filteredWorkers.length}</span> de <span className="tabular-nums">{workers.length}</span> trabajadores
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenNewQuadrantModal && (
            <button
              onClick={onOpenNewQuadrantModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Cuadrante</span>
            </button>
          )}

          <button
            onClick={() => setIsSwapModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
            <span>Permuta de Turnos</span>
          </button>

          <button
            onClick={() => setIsGeneratorModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Generar Cuadrante Rotativo</span>
          </button>
        </div>
      </div>

      {/* Anomalies Banner (if any) */}
      {anomalies.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-900">
                Se detectaron {anomalies.length} incidencias en la planificación de esta semana:
              </div>
              <div className="text-amber-800 mt-0.5 space-y-0.5">
                {anomalies.slice(0, 3).map((a, i) => (
                  <div key={i}>
                    • <span className="font-medium">{a.workerName}</span> ({a.date}): {a.message}
                  </div>
                ))}
                {anomalies.length > 3 && (
                  <div className="text-[11px] text-amber-700 italic">
                    +{anomalies.length - 3} alertas más. Revise el panel de Asistencia.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shift Legend & Daily Coverage Counters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-2xs">
        {/* Shift Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Turnos y Códigos:</span>
            {onOpenShiftEditor && (
              <button
                onClick={onOpenShiftEditor}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 underline font-medium"
              >
                (Editar horarios)
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {Object.values(shifts).map((def) => {
              return (
                <div
                  key={def.code}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 border border-slate-200"
                >
                  <span className={`w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center ${def.badgeBg} ${def.textColor}`}>
                    {def.code}
                  </span>
                  <span className="text-slate-700 font-medium">{def.shortName}</span>
                  {def.isWorkShift && (
                    <span className="text-slate-400 font-mono text-[11px] tabular-nums">
                      {def.startTime}-{def.endTime} ({def.hours}h)
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Coverage Summary Strip */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500 font-medium">
                <th className="w-48 py-1">Cobertura de Personal</th>
                {dates.map((d, i) => (
                  <th key={d} className="text-center py-1 font-semibold text-slate-700">
                    {dayNames[i]} ({d.slice(8)})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-100">
                <td className="py-1.5 font-medium text-slate-600">
                  Efectivos en Mañana (M)
                </td>
                {dates.map((d) => {
                  const cov = computeDailyCoverage(
                    assignments,
                    d,
                    selectedDept === 'Todos' ? undefined : (selectedDept as Department),
                    workers
                  );
                  return (
                    <td key={d} className="text-center py-1.5 font-mono font-semibold text-amber-700 tabular-nums">
                      {cov.M} pers.
                    </td>
                  );
                })}
              </tr>
              <tr className="border-t border-slate-100">
                <td className="py-1.5 font-medium text-slate-600">
                  Efectivos en Tarde (T)
                </td>
                {dates.map((d) => {
                  const cov = computeDailyCoverage(
                    assignments,
                    d,
                    selectedDept === 'Todos' ? undefined : (selectedDept as Department),
                    workers
                  );
                  return (
                    <td key={d} className="text-center py-1.5 font-mono font-semibold text-blue-700 tabular-nums">
                      {cov.T} pers.
                    </td>
                  );
                })}
              </tr>
              <tr className="border-t border-slate-100">
                <td className="py-1.5 font-medium text-slate-600">
                  Efectivos en Noche (N)
                </td>
                {dates.map((d) => {
                  const cov = computeDailyCoverage(
                    assignments,
                    d,
                    selectedDept === 'Todos' ? undefined : (selectedDept as Department),
                    workers
                  );
                  return (
                    <td key={d} className="text-center py-1.5 font-mono font-semibold text-indigo-700 tabular-nums">
                      {cov.N} pers.
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Schedule Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3 px-4 text-left w-64 sticky left-0 bg-slate-100 z-10">
                  Trabajador y Departamento
                </th>
                {dates.map((dateStr, idx) => {
                  const isWeekend = idx >= 5;
                  return (
                    <th
                      key={dateStr}
                      className={`py-3 px-2 text-center min-w-[100px] border-l border-slate-200 ${
                        isWeekend ? 'bg-slate-200/50' : ''
                      }`}
                    >
                      <div className="font-semibold text-slate-800">{dayNames[idx]}</div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums">{dateStr.slice(5)}</div>
                    </th>
                  );
                })}
                <th className="py-3 px-3 text-center w-24 border-l border-slate-200 bg-slate-100">
                  Horas
                </th>
                <th className="py-3 px-3 text-center w-24 border-l border-slate-200 bg-slate-100">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredWorkers.map((worker) => {
                let scheduledHours = 0;

                const dayCells = dates.map((dateStr, dayIdx) => {
                  const key = `${worker.id}_${dateStr}`;
                  const asgn = assignmentMap.get(key);
                  const code: ShiftCode = asgn?.shiftCode || 'OFF';
                  const shiftDef = shifts[code] || shifts.OFF || {
                    code,
                    name: code,
                    shortName: code,
                    hours: 0,
                    color: 'bg-slate-100 text-slate-600 border-slate-200',
                    textColor: 'text-slate-600',
                    badgeBg: 'bg-slate-200',
                    isWorkShift: false,
                  };
                  scheduledHours += shiftDef.hours;

                  // Check if cell is active for editing
                  const isEditing =
                    activeCellEdit?.workerId === worker.id && activeCellEdit?.date === dateStr;

                  return (
                    <td
                      key={dateStr}
                      className={`p-1.5 text-center border-l border-slate-200 relative group transition-colors ${
                        dayIdx >= 5 ? 'bg-slate-50/70' : ''
                      }`}
                    >
                      {/* Cell Badge Button */}
                      <button
                        onClick={() =>
                          setActiveCellEdit(
                            isEditing
                              ? null
                              : { workerId: worker.id, date: dateStr, currentCode: code }
                          )
                        }
                        className={`w-full py-1.5 px-1 rounded font-medium text-xs border transition-all flex flex-col items-center justify-center gap-0.5 ${shiftDef.color} hover:brightness-95`}
                      >
                        <span className="font-bold tracking-wider">{shiftDef.code}</span>
                        <span className="text-[10px] opacity-75 font-mono tabular-nums">
                          {shiftDef.isWorkShift ? `${shiftDef.hours}h` : shiftDef.shortName}
                        </span>
                      </button>

                      {/* Shift Selection Popover */}
                      {isEditing && (
                        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl p-2 z-30 text-left max-h-60 overflow-y-auto">
                          <div className="text-[11px] font-semibold text-slate-700 mb-1 px-1 flex items-center justify-between">
                            <span>Seleccionar turno:</span>
                            {onOpenShiftEditor && (
                              <button
                                onClick={onOpenShiftEditor}
                                className="text-[10px] text-indigo-600 hover:underline"
                              >
                                Editar
                              </button>
                            )}
                          </div>
                          <div className="space-y-1">
                            {Object.values(shifts).map((opt) => {
                              return (
                                <button
                                  key={opt.code}
                                  onClick={() => handleShiftSelect(worker, dateStr, opt.code)}
                                  className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs hover:bg-slate-100 transition-colors ${
                                    opt.code === code ? 'bg-slate-100 font-bold' : ''
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center ${opt.badgeBg} ${opt.textColor}`}
                                    >
                                      {opt.code}
                                    </span>
                                    <span className="text-slate-800">{opt.shortName}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {opt.hours}h
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </td>
                  );
                });

                // Compute overtime sum for this worker
                const workerOt = overtimeRecords
                  .filter((r) => r.workerId === worker.id && r.status === 'Aprobada')
                  .reduce((acc, r) => acc + r.hours, 0);

                const totalHours = scheduledHours + workerOt;
                const balance = totalHours - worker.contractHours;

                return (
                  <tr key={worker.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Worker Info Column */}
                    <td className="py-2.5 px-4 sticky left-0 bg-white z-10 shadow-r border-r border-slate-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span>{worker.name}</span>
                            {worker.status !== 'Activo' && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-teal-50 text-teal-700 rounded font-medium">
                                {worker.status}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <span className="font-mono text-slate-400">{worker.employeeNumber}</span>
                            <span>·</span>
                            <span>{worker.role}</span>
                            <span>·</span>
                            <span className="font-medium text-slate-600">{worker.department}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 7 Day Cells */}
                    {dayCells}

                    {/* Total Hours */}
                    <td className="py-2.5 px-3 text-center border-l border-slate-200 font-mono text-xs tabular-nums">
                      <div className="font-bold text-slate-800">{totalHours}h</div>
                      {workerOt > 0 && (
                        <div className="text-[10px] text-amber-700 font-semibold bg-amber-50 rounded px-1 py-0.5 mt-0.5" title={`${workerOt}h extras sumadas`}>
                          +{workerOt}h extra
                        </div>
                      )}
                    </td>

                    {/* Balance */}
                    <td className="py-2.5 px-3 text-center border-l border-slate-200 font-mono text-xs tabular-nums">
                      {balance > 0 ? (
                        <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                          +{balance}h
                        </span>
                      ) : balance < 0 ? (
                        <span className="text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded">
                          {balance}h
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium">
                          0h
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generator Modal */}
      {isGeneratorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-slate-900 text-sm">
                  Generador Automático de Cuadrante Rotativo
                </h3>
              </div>
              <button
                onClick={() => setIsGeneratorModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Esta función regenera automáticamente los turnos para los 70 trabajadores en la semana actual, respetando las vacaciones aprobadas, los descansos mínimos obligatorios de 12h y los mínimos de cobertura por departamento.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Seleccione el Patrón de Rotación a aplicar:
              </label>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  {
                    id: '5x2',
                    name: 'Patrón 5x2 Rotativo',
                    desc: '5 días trabajados, 2 libres consecutivos. Rota Mañana / Tarde / Noche.',
                  },
                  {
                    id: '6x2',
                    name: 'Patrón 6x2 Continuo',
                    desc: '6 días trabajados, 2 descanso. Ideal para líneas de producción 24/7.',
                  },
                  {
                    id: '4x2',
                    name: 'Patrón 4x2 Industrial',
                    desc: '2 Mañanas, 2 Tardes, 2 Libres.',
                  },
                  {
                    id: 'Rotativo Completo',
                    name: 'Rotativo 3 Turnos Equilibrado',
                    desc: 'Distribución estricta y equilibrada entre M, T y N con guardias de fin de semana.',
                  },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPattern(p.id as any)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedPattern === p.id
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-semibold text-slate-900">{p.name}</div>
                    <div className="text-[11px] text-slate-500 mt-1">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsGeneratorModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onRegenerateSchedule(selectedPattern);
                  setIsGeneratorModalOpen(false);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs"
              >
                Generar y Aplicar al Equipo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Swap Modal */}
      {isSwapModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
                <h3 className="font-semibold text-slate-900 text-sm">
                  Permuta / Intercambio de Turnos
                </h3>
              </div>
              <button
                onClick={() => setIsSwapModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Fecha de la permuta:</label>
                <select
                  value={swapDate}
                  onChange={(e) => setSwapDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  {dates.map((d, i) => (
                    <option key={d} value={d}>
                      {dayNames[i]} {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Primer trabajador:</label>
                <select
                  value={swapWorker1}
                  onChange={(e) => setSwapWorker1(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value="">Seleccione trabajador...</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Segundo trabajador:</label>
                <select
                  value={swapWorker2}
                  onChange={(e) => setSwapWorker2(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value="">Seleccione trabajador...</option>
                  {workers
                    .filter((w) => w.id !== swapWorker1)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.department})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsSwapModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                Cancelar
              </button>
              <button
                disabled={!swapWorker1 || !swapWorker2}
                onClick={() => {
                  onSwapShifts(swapWorker1, swapWorker2, swapDate);
                  setIsSwapModalOpen(false);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
              >
                Confirmar Permuta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
