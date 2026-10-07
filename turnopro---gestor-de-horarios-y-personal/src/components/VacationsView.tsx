import React, { useState, useMemo, useEffect } from 'react';
import { VacationRequest, Worker, Department } from '../types';
import {
  Palmtree,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  PlusCircle,
  Search,
  Filter,
  AlertCircle,
} from 'lucide-react';

interface VacationsViewProps {
  workers: Worker[];
  vacations: VacationRequest[];
  onApproveVacation: (vacationId: string) => void;
  onRejectVacation: (vacationId: string) => void;
  onRequestVacation: (request: Omit<VacationRequest, 'id' | 'status' | 'requestDate'>) => void;
  departments?: string[];
}

export const VacationsView: React.FC<VacationsViewProps> = ({
  workers,
  vacations,
  onApproveVacation,
  onRejectVacation,
  onRequestVacation,
  departments = [
    'Producción',
    'Operaciones',
    'Mantenimiento',
    'Calidad',
    'Atención al Cliente',
    'Administración y RRHH',
  ],
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchWorker, setSearchWorker] = useState('');
  const [selectedDept, setSelectedDept] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Pendiente' | 'Aprobada' | 'Rechazada'>('Todos');

  // Form state
  const [workerId, setWorkerId] = useState(workers[0]?.id || '');
  const [startDate, setStartDate] = useState('2026-10-19');
  const [endDate, setEndDate] = useState('2026-10-23');
  const [vacType, setVacType] = useState<'Vacaciones' | 'Baja Médica' | 'Asuntos Propios' | 'Paternidad/Maternidad'>('Vacaciones');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!workers.some((w) => w.id === workerId) && workers.length > 0) {
      setWorkerId(workers[0].id);
    }
  }, [workers, workerId]);

  const filteredRequests = useMemo(() => {
    return vacations.filter((v) => {
      const matchStatus = statusFilter === 'Todos' || v.status === statusFilter;
      const matchDept = selectedDept === 'Todos' || v.department === selectedDept;
      const matchSearch =
        v.workerName.toLowerCase().includes(searchWorker.toLowerCase()) ||
        v.notes?.toLowerCase().includes(searchWorker.toLowerCase());
      return matchStatus && matchDept && matchSearch;
    });
  }, [vacations, statusFilter, selectedDept, searchWorker]);

  const pendingCount = vacations.filter((v) => v.status === 'Pendiente').length;
  const approvedCount = vacations.filter((v) => v.status === 'Aprobada').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetWorker = workers.find((w) => w.id === workerId);
    if (!targetWorker) return;

    // Calculate days
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    onRequestVacation({
      workerId,
      workerName: targetWorker.name,
      department: targetWorker.department,
      startDate,
      endDate,
      daysCount,
      type: vacType,
      notes,
    });

    setIsModalOpen(false);
    setNotes('');
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Top Banner & Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Solicitudes Pendientes</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-1 font-mono tabular-nums">
            {pendingCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Requieren aprobación de RRHH</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Ausencias Aprobadas Activas</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono tabular-nums">
            {approvedCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Sincronizadas con el cuadrante</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Régimen Anual</span>
            <Palmtree className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
            30 días
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Convenio colectivo anual por empleado</div>
        </div>
      </div>

      {/* Filter and New Request Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchWorker}
              onChange={(e) => setSearchWorker(e.target.value)}
              placeholder="Buscar por empleado o motivo..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
            >
              <option value="Todos">Todos los Departamentos</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            {(['Todos', 'Pendiente', 'Aprobada', 'Rechazada'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-2xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Solicitar Vacaciones / Baja</span>
        </button>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="font-semibold text-slate-900 text-sm">
            Registro y Solicitudes de Ausencia ({filteredRequests.length})
          </div>
          <div className="text-xs text-slate-500">
            Al aprobar una solicitud, se actualiza automáticamente el cuadrante semanal.
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3 px-4 text-left">Empleado</th>
                <th className="py-3 px-4 text-left">Departamento</th>
                <th className="py-3 px-4 text-left">Tipo de Ausencia</th>
                <th className="py-3 px-4 text-center">Período Solicitado</th>
                <th className="py-3 px-4 text-center">Días</th>
                <th className="py-3 px-4 text-left">Motivo / Notas</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {req.workerName}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {req.department}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                        req.type === 'Vacaciones'
                          ? 'bg-teal-50 text-teal-800'
                          : req.type === 'Baja Médica'
                          ? 'bg-rose-50 text-rose-800'
                          : 'bg-indigo-50 text-indigo-800'
                      }`}
                    >
                      {req.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-700">
                    {req.startDate} ➔ {req.endDate}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 tabular-nums">
                    {req.daysCount} d
                  </td>
                  <td className="py-3 px-4 text-slate-500 italic">
                    {req.notes || '—'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded ${
                        req.status === 'Aprobada'
                          ? 'bg-emerald-50 text-emerald-700'
                          : req.status === 'Pendiente'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {req.status === 'Pendiente' ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onApproveVacation(req.id)}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-medium transition-colors text-[11px] shadow-2xs"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => onRejectVacation(req.id)}
                          className="px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors text-[11px]"
                        >
                          Rechazar
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Procesada</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vacation Balance Overview for all 70 workers */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <h3 className="font-semibold text-slate-900 text-sm">
          Balance de Días de Vacaciones por Trabajador (Año en curso)
        </h3>
        <p className="text-xs text-slate-500">
          Control de los 30 días reglamentarios por trabajador. Evite acumulaciones excesivas o vacíos de cobertura en el último trimestre.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-96 overflow-y-auto pr-1">
          {workers.map((w) => {
            const remaining = w.vacationDaysTotal - w.vacationDaysUsed;
            const pct = Math.round((w.vacationDaysUsed / w.vacationDaysTotal) * 100);
            return (
              <div
                key={w.id}
                className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-900">{w.name}</div>
                  <div className="text-[11px] text-slate-400">
                    {w.department} · {w.employeeNumber}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-800 tabular-nums">
                    {w.vacationDaysUsed} / {w.vacationDaysTotal} d
                  </div>
                  <div className="text-[10px] text-teal-600 font-medium">
                    {remaining} d restantes ({pct}%)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Nueva Solicitud */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-sm">
                Registrar Solicitud de Vacaciones o Baja
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Trabajador</label>
                <select
                  value={workerId}
                  onChange={(e) => setWorkerId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.department} - {w.employeeNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Tipo de Ausencia</label>
                <select
                  value={vacType}
                  onChange={(e) => setVacType(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value="Vacaciones">Vacaciones Reglamentarias</option>
                  <option value="Baja Médica">Baja Médica / Incapacidad Temporal</option>
                  <option value="Asuntos Propios">Permiso por Asuntos Propios</option>
                  <option value="Paternidad/Maternidad">Permiso Paternidad / Maternidad</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Fecha de Fin</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Motivo o Justificante (Opcional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles sobre la ausencia..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs"
                >
                  Registrar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
