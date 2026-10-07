import React, { useState, useMemo, useEffect } from 'react';
import { Worker, Department } from '../types';
import {
  Search,
  Filter,
  UserPlus,
  Phone,
  Mail,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  Send,
  CheckCircle,
  FileSpreadsheet,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Building2,
} from 'lucide-react';
import { generateWhatsAppLink } from '../services/messagingService';

interface WorkersViewProps {
  workers: Worker[];
  onAddWorker: (worker: Worker) => void;
  onUpdateWorker: (worker: Worker) => void;
  onDeleteWorker: (workerId: string) => void;
  onDeleteMultipleWorkers?: (workerIds: string[]) => void;
  isAdmin: boolean;
  onToggleAdmin?: () => void;
  onOpenExcelImportModal?: () => void;
  onOpenOvertimeModal?: () => void;
  departments?: string[];
  onOpenDepartmentManager?: () => void;
}

export const WorkersView: React.FC<WorkersViewProps> = ({
  workers,
  onAddWorker,
  onUpdateWorker,
  onDeleteWorker,
  onDeleteMultipleWorkers,
  isAdmin,
  onToggleAdmin,
  onOpenExcelImportModal,
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
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('Todos');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState<Worker | null>(null);
  const [pendingAdminWorker, setPendingAdminWorker] = useState<Worker | null>(null);

  // Multi-selection state for batch actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkAdminPromptOpen, setIsBulkAdminPromptOpen] = useState(false);

  const selectedWorkersList = useMemo(() => {
    return workers.filter((w) => selectedIds.includes(w.id));
  }, [workers, selectedIds]);

  // Pagination for workers (20 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;


  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      const matchDept = selectedDept === 'Todos' || w.department === selectedDept;
      const matchStatus = selectedStatus === 'Todos' || w.status === selectedStatus;
      const matchSearch =
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.role.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDept && matchStatus && matchSearch;
    });
  }, [workers, selectedDept, selectedStatus, searchQuery]);

  const totalPages = Math.ceil(filteredWorkers.length / pageSize) || 1;
  const paginatedWorkers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredWorkers.slice(start, start + pageSize);
  }, [filteredWorkers, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Prune deleted IDs from selection
  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => workers.some((w) => w.id === id)));
  }, [workers]);

  const isAllCurrentPageSelected =
    paginatedWorkers.length > 0 && paginatedWorkers.every((w) => selectedIds.includes(w.id));

  const handleToggleSelectAllPage = () => {
    if (isAllCurrentPageSelected) {
      const pageIds = new Set(paginatedWorkers.map((w) => w.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const pageIds = paginatedWorkers.map((w) => w.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds(filteredWorkers.map((w) => w.id));
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleToggleWorker = (workerId: string) => {
    setSelectedIds((prev) =>
      prev.includes(workerId) ? prev.filter((id) => id !== workerId) : [...prev, workerId]
    );
  };

  const stats = useMemo(() => {
    const total = workers.length;
    const activos = workers.filter((w) => w.status === 'Activo').length;
    const vacaciones = workers.filter((w) => w.status === 'Vacaciones').length;
    const bajas = workers.filter((w) => w.status === 'Baja Médica').length;
    return { total, activos, vacaciones, bajas };
  }, [workers]);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-5">
      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Plantilla Total</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Efectivos registrados</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Personal Activo</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono tabular-nums">
            {stats.activos}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Disponibles para turnos</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">En Período de Vacaciones</div>
          <div className="text-2xl font-bold text-teal-600 mt-1 font-mono tabular-nums">
            {stats.vacaciones}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Solicitudes aprobadas</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Bajas Médicas / Permisos</div>
          <div className="text-2xl font-bold text-rose-600 mt-1 font-mono tabular-nums">
            {stats.bajas}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Coberturas sustitutorias</div>
        </div>
      </div>

      {/* Filter and Action bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por nombre, cargo o ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Todos">Todos los Departamentos</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Todos">Todos los Estados</option>
              <option value="Activo">Activo</option>
              <option value="Vacaciones">Vacaciones</option>
              <option value="Baja Médica">Baja Médica</option>
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          {onOpenExcelImportModal && (
            <button
              onClick={onOpenExcelImportModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors shadow-2xs"
              title="Importar hoja de Excel propia con trabajadores"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Importar Excel</span>
            </button>
          )}

          {onOpenOvertimeModal && (
            <button
              onClick={onOpenOvertimeModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
              title="Añadir horas extras y editar patrones de rotación"
            >
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span>Horas Extras</span>
            </button>
          )}

          {selectedIds.length > 0 && (
            <button
              onClick={() => {
                if (isAdmin) {
                  setIsBulkDeleteModalOpen(true);
                } else {
                  setIsBulkAdminPromptOpen(true);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-2xs animate-in fade-in"
              title="Eliminar los trabajadores seleccionados"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar Selección ({selectedIds.length})</span>
            </button>
          )}

          {onOpenDepartmentManager && (
            <button
              onClick={onOpenDepartmentManager}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
              title="Añadir o editar departamentos de la empresa"
            >
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Gestionar Dptos.</span>
            </button>
          )}

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-2xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Añadir Trabajador</span>
          </button>
        </div>
      </div>

      {/* Bulk Selection Action Strip */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[11px] shrink-0">
              {selectedIds.length}
            </span>
            <span className="font-semibold text-indigo-950">
              {selectedIds.length === 1 ? '1 trabajador seleccionado' : `${selectedIds.length} trabajadores seleccionados`}
            </span>
            <span className="text-indigo-300">|</span>
            <button
              onClick={handleSelectAllFiltered}
              className="text-indigo-700 hover:text-indigo-900 font-medium underline"
            >
              Seleccionar todos ({filteredWorkers.length} filtrados)
            </button>
            <button
              onClick={handleClearSelection}
              className="text-slate-500 hover:text-slate-700 font-medium ml-2"
            >
              Deseleccionar
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isAdmin) {
                  setIsBulkDeleteModalOpen(true);
                } else {
                  setIsBulkAdminPromptOpen(true);
                }
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar {selectedIds.length} seleccionados</span>
            </button>
          </div>
        </div>
      )}

      {/* Workers Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllCurrentPageSelected}
                    onChange={handleToggleSelectAllPage}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    title={isAllCurrentPageSelected ? 'Deseleccionar página' : 'Seleccionar todos en esta página'}
                  />
                </th>
                <th className="py-3 px-4 text-left">Nº Empleado</th>
                <th className="py-3 px-4 text-left">Nombre y Apellidos</th>
                <th className="py-3 px-4 text-left">Departamento</th>
                <th className="py-3 px-4 text-left">Puesto / Especialidad</th>
                <th className="py-3 px-4 text-center">Jornada</th>
                <th className="py-3 px-4 text-center">Patrón Rotativo</th>
                <th className="py-3 px-4 text-center">Vacaciones (Gast./Tot.)</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedWorkers.map((worker) => (
                <tr
                  key={worker.id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    selectedIds.includes(worker.id) ? 'bg-indigo-50/40' : ''
                  }`}
                >
                  <td className="py-3 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(worker.id)}
                      onChange={() => handleToggleWorker(worker.id)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-500">
                    {worker.employeeNumber}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {worker.name}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {worker.department}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {worker.role}
                  </td>
                  <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-700">
                    {worker.contractHours}h/sem
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                      {worker.rotationPattern}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono tabular-nums">
                    <span className="font-semibold text-slate-900">{worker.vacationDaysUsed}</span>
                    <span className="text-slate-400"> / {worker.vacationDaysTotal} d</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded ${
                        worker.status === 'Activo'
                          ? 'bg-emerald-50 text-emerald-700'
                          : worker.status === 'Vacaciones'
                          ? 'bg-teal-50 text-teal-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {worker.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <a
                        href={generateWhatsAppLink(
                          worker.phoneNumber,
                          `Hola ${worker.name}, te contacto desde la coordinación de horarios de TurnoPro.`
                        )}
                        target="_blank"
                        rel="noreferrer"
                        title="Enviar mensaje por WhatsApp"
                        className="p-1.5 text-slate-400 hover:text-emerald-600 rounded hover:bg-slate-100 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => setEditingWorker(worker)}
                        title="Editar empleado"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {isAdmin ? (
                        <button
                          onClick={() => setWorkerToDelete(worker)}
                          title="Eliminar empleado (Modo Administrador)"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setPendingAdminWorker(worker)}
                          title="Eliminar empleado (Requiere activar Modo Administrador)"
                          className="p-1.5 text-amber-600/70 hover:text-rose-600 rounded hover:bg-amber-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Página <span className="font-semibold text-slate-800">{currentPage}</span> de{' '}
              <span className="font-semibold text-slate-800">{totalPages}</span> ({filteredWorkers.length} empleados)
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 disabled:opacity-40"
              >
                Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded text-xs font-semibold ${
                    currentPage === page
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Worker Modal */}
      {editingWorker && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-sm">
                Editar Trabajador: {editingWorker.name}
              </h3>
              <button
                onClick={() => setEditingWorker(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Nombre y Apellidos</label>
                <input
                  type="text"
                  value={editingWorker.name}
                  onChange={(e) => setEditingWorker({ ...editingWorker, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Nº Empleado</label>
                <input
                  type="text"
                  value={editingWorker.employeeNumber}
                  onChange={(e) => setEditingWorker({ ...editingWorker, employeeNumber: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-slate-700">Departamento</label>
                  {onOpenDepartmentManager && (
                    <button
                      type="button"
                      onClick={onOpenDepartmentManager}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      + Gestionar
                    </button>
                  )}
                </div>
                <select
                  value={editingWorker.department}
                  onChange={(e) => setEditingWorker({ ...editingWorker, department: e.target.value as Department })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Puesto de Trabajo</label>
                <input
                  type="text"
                  value={editingWorker.role}
                  onChange={(e) => setEditingWorker({ ...editingWorker, role: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Teléfono (WhatsApp)</label>
                <input
                  type="text"
                  value={editingWorker.phoneNumber}
                  onChange={(e) => setEditingWorker({ ...editingWorker, phoneNumber: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Horas Contrato (semanales)</label>
                <input
                  type="number"
                  value={editingWorker.contractHours}
                  onChange={(e) => setEditingWorker({ ...editingWorker, contractHours: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Patrón de Rotación</label>
                <select
                  value={editingWorker.rotationPattern}
                  onChange={(e) => setEditingWorker({ ...editingWorker, rotationPattern: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value="5x2">5x2 Rotativo</option>
                  <option value="6x2">6x2 Continuo</option>
                  <option value="4x2">4x2 Industrial</option>
                  <option value="Fijo Central">Fijo Central (08:30-17:30)</option>
                  <option value="Rotativo Completo">Rotativo Completo</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Estado</label>
                <select
                  value={editingWorker.status}
                  onChange={(e) => setEditingWorker({ ...editingWorker, status: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value="Activo">Activo</option>
                  <option value="Vacaciones">Vacaciones</option>
                  <option value="Baja Médica">Baja Médica</option>
                  <option value="Permiso">Permiso</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const target = editingWorker;
                  setEditingWorker(null);
                  if (isAdmin) {
                    setWorkerToDelete(target);
                  } else {
                    setPendingAdminWorker(target);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Trabajador</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingWorker(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateWorker(editingWorker);
                    setEditingWorker(null);
                  }}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Worker Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-sm">
                Registrar Nuevo Trabajador
              </h3>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const newId = `w-${Date.now()}`;
                const newWorker: Worker = {
                  id: newId,
                  employeeNumber: (form.elements.namedItem('employeeNumber') as HTMLInputElement).value,
                  name: (form.elements.namedItem('name') as HTMLInputElement).value,
                  role: (form.elements.namedItem('role') as HTMLInputElement).value,
                  department: (form.elements.namedItem('department') as HTMLSelectElement).value as Department,
                  contractHours: Number((form.elements.namedItem('contractHours') as HTMLInputElement).value) || 40,
                  phoneNumber: (form.elements.namedItem('phoneNumber') as HTMLInputElement).value || '+34600000000',
                  email: (form.elements.namedItem('email') as HTMLInputElement).value,
                  status: 'Activo',
                  vacationDaysTotal: 30,
                  vacationDaysUsed: 0,
                  rotationPattern: (form.elements.namedItem('rotationPattern') as HTMLSelectElement).value as any,
                };
                onAddWorker(newWorker);
                setIsNewModalOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Nombre Completo</label>
                  <input
                    name="name"
                    required
                    placeholder="Ej. Rodrigo San Martín"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Nº Empleado</label>
                  <input
                    name="employeeNumber"
                    required
                    defaultValue={`EMP-${String(workers.length + 1).padStart(3, '0')}`}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-slate-700">Departamento</label>
                    {onOpenDepartmentManager && (
                      <button
                        type="button"
                        onClick={onOpenDepartmentManager}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        + Gestionar
                      </button>
                    )}
                  </div>
                  <select name="department" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Puesto</label>
                  <input
                    name="role"
                    required
                    placeholder="Ej. Operador de Línea"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Teléfono (WhatsApp)</label>
                  <input
                    name="phoneNumber"
                    required
                    defaultValue="+34611223399"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Horas Semanales</label>
                  <input
                    name="contractHours"
                    type="number"
                    defaultValue="40"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Patrón de Rotación</label>
                  <select name="rotationPattern" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <option value="5x2">5x2 Rotativo</option>
                    <option value="6x2">6x2 Continuo</option>
                    <option value="4x2">4x2 Industrial</option>
                    <option value="Fijo Central">Fijo Central</option>
                    <option value="Rotativo Completo">Rotativo Completo</option>
                  </select>
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Email</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="empleado@empresa.com"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  Dar de Alta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Worker Confirmation Modal */}
      {workerToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">
                  ¿Eliminar a {workerToDelete.name}?
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Esta acción retirará definitivamente al empleado ({workerToDelete.employeeNumber}) del departamento <strong>{workerToDelete.department}</strong>, así como todas sus asignaciones del cuadrante y registros asociados.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setWorkerToDelete(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    onDeleteWorker(workerToDelete.id);
                  } catch (err) {
                    console.error('Error deleting worker:', err);
                  } finally {
                    setWorkerToDelete(null);
                  }
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition-colors"
              >
                Sí, Eliminar Trabajador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Activation Prompt Modal if clicked without admin role */}
      {pendingAdminWorker && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">
                  Permiso de Administrador Requerido
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Para eliminar al empleado <strong>{pendingAdminWorker.name}</strong> ({pendingAdminWorker.employeeNumber}), se requiere tener activo el <strong>Modo Administrador</strong> para proteger los datos de la empresa.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPendingAdminWorker(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onToggleAdmin) {
                    onToggleAdmin();
                  }
                  const target = pendingAdminWorker;
                  setPendingAdminWorker(null);
                  setWorkerToDelete(target);
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Activar Modo Admin y Continuar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Workers Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-slate-900 text-sm">
                  ¿Eliminar {selectedIds.length} trabajadores seleccionados?
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Esta acción retirará definitivamente a los <strong>{selectedIds.length} empleados elegidos</strong> de la plantilla, así como todas sus asignaciones del cuadrante semanal, vacaciones y horas extras asociadas.
                </p>
              </div>
            </div>

            {/* List of workers to be deleted */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-1.5 text-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Personal que será eliminado ({selectedWorkersList.length}):
              </div>
              {selectedWorkersList.map((w) => (
                <div key={w.id} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-b-0 text-slate-700">
                  <span className="font-medium text-slate-900 truncate">{w.name}</span>
                  <span className="text-[11px] text-slate-400 font-mono shrink-0 ml-2">
                    {w.employeeNumber} · {w.department}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    if (onDeleteMultipleWorkers) {
                      onDeleteMultipleWorkers(selectedIds);
                    } else {
                      selectedIds.forEach((id) => onDeleteWorker(id));
                    }
                  } catch (err) {
                    console.error('Error during bulk deletion:', err);
                  } finally {
                    setSelectedIds([]);
                    setIsBulkDeleteModalOpen(false);
                  }
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition-colors"
              >
                Sí, Eliminar {selectedIds.length} Trabajadores
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Admin Activation Prompt Modal if clicked without admin role */}
      {isBulkAdminPromptOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">
                  Permiso de Administrador Requerido
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  La eliminación masiva de <strong>{selectedIds.length} trabajadores</strong> requiere tener activo el <strong>Modo Administrador</strong> para proteger los datos de la empresa.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkAdminPromptOpen(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onToggleAdmin) {
                    onToggleAdmin();
                  }
                  setIsBulkAdminPromptOpen(false);
                  setIsBulkDeleteModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Activar Modo Admin y Continuar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
