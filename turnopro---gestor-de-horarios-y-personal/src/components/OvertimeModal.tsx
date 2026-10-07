import React, { useState, useMemo, useEffect } from 'react';
import { Worker, OvertimeRecord, Department } from '../types';
import {
  Clock,
  PlusCircle,
  CheckCircle,
  Trash2,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  Users,
} from 'lucide-react';

interface OvertimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  workers: Worker[];
  overtimeRecords: OvertimeRecord[];
  onAddOvertime: (record: Omit<OvertimeRecord, 'id' | 'registeredAt'>) => void;
  onDeleteOvertime: (id: string) => void;
  onUpdateWorkerRotation: (workerId: string, newPattern: string) => void;
  onBatchUpdateRotation?: (department: string, newPattern: string) => void;
  departments?: string[];
}

export const OvertimeModal: React.FC<OvertimeModalProps> = ({
  isOpen,
  onClose,
  workers,
  overtimeRecords,
  onAddOvertime,
  onDeleteOvertime,
  onUpdateWorkerRotation,
  onBatchUpdateRotation,
  departments = [
    'Producción',
    'Operaciones',
    'Mantenimiento',
    'Calidad',
    'Atención al Cliente',
    'Administración y RRHH',
  ],
}) => {
  const [activeTab, setActiveTab] = useState<'overtime' | 'rotation'>('overtime');

  // Form for Overtime
  const [selectedWorkerId, setSelectedWorkerId] = useState(workers[0]?.id || '');
  const [overtimeDate, setOvertimeDate] = useState(new Date().toISOString().split('T')[0]);
  const [overtimeHours, setOvertimeHours] = useState<number>(2);
  const [overtimeReason, setOvertimeReason] = useState('Pico extraordinario de producción');
  const [overtimeType, setOvertimeType] = useState<'Abonable' | 'Compensable'>('Abonable');

  // Rotation edit state
  const [searchWorker, setSearchWorker] = useState('');
  const [selectedDept, setSelectedDept] = useState('Todos');

  // Batch rotation state
  const [batchDept, setBatchDept] = useState<Department>(departments[0] || 'Producción');
  const [batchPattern, setBatchPattern] = useState('5x2');

  useEffect(() => {
    if (!workers.some((w) => w.id === selectedWorkerId) && workers.length > 0) {
      setSelectedWorkerId(workers[0].id);
    }
  }, [workers, selectedWorkerId]);

  if (!isOpen) return null;

  const totalOvertimeHoursApproved = overtimeRecords
    .filter((r) => r.status === 'Aprobada')
    .reduce((acc, r) => acc + r.hours, 0);

  const handleAddOvertimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = workers.find((w) => w.id === selectedWorkerId);
    if (!target) return;

    onAddOvertime({
      workerId: target.id,
      workerName: target.name,
      department: target.department,
      date: overtimeDate,
      hours: Number(overtimeHours),
      reason: overtimeReason,
      type: overtimeType,
      status: 'Aprobada',
    });

    setOvertimeHours(2);
    setOvertimeReason('');
  };

  const filteredWorkers = workers.filter((w) => {
    const matchDept = selectedDept === 'Todos' || w.department === selectedDept;
    const matchSearch =
      w.name.toLowerCase().includes(searchWorker.toLowerCase()) ||
      w.employeeNumber.toLowerCase().includes(searchWorker.toLowerCase());
    return matchDept && matchSearch;
  });

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full p-6 space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Gestión de Horas Extras & Patrones Rotativos
              </h3>
              <p className="text-xs text-slate-500">
                Consignación de horas extraordinarias computables y configuración de cuadrantes de rotación.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('overtime')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'overtime'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Horas Extras Consignadas
              </button>
              <button
                onClick={() => setActiveTab('rotation')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === 'rotation'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Configurar Patrones Rotativos
              </button>
            </div>

            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm ml-2">
              ✕
            </button>
          </div>
        </div>

        {/* TAB 1: OVERTIME */}
        {activeTab === 'overtime' && (
          <div className="flex-1 overflow-y-auto space-y-5 pr-1">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200">
                <div className="text-[11px] text-amber-700 font-medium">Horas Extras Aprobadas</div>
                <div className="text-xl font-bold font-mono text-amber-900 mt-1 tabular-nums">
                  +{totalOvertimeHoursApproved} horas
                </div>
                <div className="text-[10px] text-amber-600 mt-0.5">Sumadas al cómputo de la plantilla</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Registros Consignados</div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                  {overtimeRecords.length} partes
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Histórico semanal activo</div>
              </div>
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
                <div className="text-[11px] text-emerald-700 font-medium">Modalidad Predominante</div>
                <div className="text-xl font-bold text-emerald-900 mt-1">
                  Abonable en Nómina
                </div>
                <div className="text-[10px] text-emerald-600 mt-0.5">O compensable en descansos</div>
              </div>
            </div>

            {/* Form to add Overtime */}
            <form onSubmit={handleAddOvertimeSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-amber-600" />
                <span>Consignar Nuevas Horas Extras para un Trabajador</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="md:col-span-2">
                  <label className="font-medium text-slate-700 block mb-1">Trabajador Beneficiario*</label>
                  <select
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800"
                  >
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.department} - {w.employeeNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={overtimeDate}
                    onChange={(e) => setOvertimeDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">Horas Extras*</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="12"
                    required
                    value={overtimeHours}
                    onChange={(e) => setOvertimeHours(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="font-medium text-slate-700 block mb-1">Modalidad</label>
                  <select
                    value={overtimeType}
                    onChange={(e) => setOvertimeType(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Abonable">Abonable en Nómina</option>
                    <option value="Compensable">Compensable en Descanso</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="font-medium text-slate-700 block mb-1">Motivo / Tarea desempeñada</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Pico imprevisto en envasado, guardia de emergencia..."
                    value={overtimeReason}
                    onChange={(e) => setOvertimeReason(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="pt-5">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shadow-2xs whitespace-nowrap"
                  >
                    + Sumar al Trabajador
                  </button>
                </div>
              </div>
            </form>

            {/* Overtime records table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="p-3 bg-slate-100 border-b border-slate-200 font-semibold text-xs text-slate-800">
                Registro Histórico de Horas Extras Consignadas ({overtimeRecords.length})
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-left font-semibold">
                    <th className="py-2.5 px-3">Trabajador</th>
                    <th className="py-2.5 px-3">Departamento</th>
                    <th className="py-2.5 px-3 text-center">Fecha</th>
                    <th className="py-2.5 px-3 text-center">Horas</th>
                    <th className="py-2.5 px-3">Motivo</th>
                    <th className="py-2.5 px-3 text-center">Modalidad</th>
                    <th className="py-2.5 px-3 text-center w-16">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overtimeRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{r.workerName}</td>
                      <td className="py-2.5 px-3 text-slate-600">{r.department}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">{r.date}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-700 tabular-nums">
                        +{r.hours}h
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{r.reason}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                          {r.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => onDeleteOvertime(r.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {overtimeRecords.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        No hay horas extras registradas actualmente.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ROTATION PATTERNS */}
        {activeTab === 'rotation' && (
          <div className="flex-1 overflow-y-auto space-y-5 pr-1">
            {/* Batch rotation update box */}
            {onBatchUpdateRotation && (
              <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-3 text-xs">
                <div className="font-semibold text-indigo-950 flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-indigo-600" />
                  <span>Actualización de Patrón Rotativo por Departamento (En Lote)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">Departamento</label>
                    <select
                      value={batchDept}
                      onChange={(e) => setBatchDept(e.target.value as Department)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      {departments.map((d) => (
                        <option key={d} value={d}>
                          {d} ({workers.filter((w) => w.department === d).length} trab.)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-medium text-slate-700 block mb-1">Nuevo Patrón a Asignar</label>
                    <select
                      value={batchPattern}
                      onChange={(e) => setBatchPattern(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="5x2">5x2 Rotativo (Semanal)</option>
                      <option value="6x2">6x2 Continuo Industrial</option>
                      <option value="4x2">4x2 Rápido</option>
                      <option value="Rotativo Completo">Rotativo Completo 3 Turnos</option>
                      <option value="Fijo Mañana">Fijo Mañana (06:00 - 14:00)</option>
                      <option value="Fijo Central">Fijo Central (08:30 - 17:30)</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => onBatchUpdateRotation(batchDept, batchPattern)}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-2xs"
                    >
                      Aplicar a todo el Dpto.
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Individual Worker Rotation List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="relative w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchWorker}
                    onChange={(e) => setSearchWorker(e.target.value)}
                    placeholder="Buscar trabajador..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                  >
                    <option value="Todos">Todos los Departamentos</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs max-h-96 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-100 z-10 border-b border-slate-200">
                    <tr className="text-slate-700 font-semibold text-left">
                      <th className="py-2.5 px-3">Empleado</th>
                      <th className="py-2.5 px-3">Departamento</th>
                      <th className="py-2.5 px-3">Puesto</th>
                      <th className="py-2.5 px-3 text-center">Patrón Rotativo Actual</th>
                      <th className="py-2.5 px-3 text-center w-52">Cambiar Patrón</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredWorkers.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{w.name}</td>
                        <td className="py-2.5 px-3 text-slate-600">{w.department}</td>
                        <td className="py-2.5 px-3 text-slate-600">{w.role}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium text-[11px]">
                            {w.rotationPattern}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <select
                            value={w.rotationPattern}
                            onChange={(e) => onUpdateWorkerRotation(w.id, e.target.value)}
                            className="p-1 bg-white border border-slate-300 rounded text-[11px] text-slate-800"
                          >
                            <option value="5x2">5x2 Rotativo</option>
                            <option value="6x2">6x2 Continuo Industrial</option>
                            <option value="4x2">4x2 Rápido</option>
                            <option value="Rotativo Completo">Rotativo Completo</option>
                            <option value="Fijo Mañana">Fijo Mañana</option>
                            <option value="Fijo Central">Fijo Central</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <div>
            Las horas extras registradas se suman de forma transparente al total de horas trabajadas y al balance semanal de nómina.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
