import React, { useState } from 'react';
import { Worker, Department } from '../types';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Users,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface DepartmentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: string[];
  workers: Worker[];
  onAddDepartment: (name: string, description?: string, defaultPattern?: string) => void;
  onUpdateDepartment: (oldName: string, newName: string) => void;
  onDeleteDepartment: (name: string, reassignToDept?: string) => void;
  isAdmin: boolean;
}

const PRESET_SUGGESTIONS = [
  'Logística y Distribución',
  'Almacén y Stock',
  'Seguridad y Salud Laboral',
  'Sistemas y TI',
  'I+D e Innovación',
  'Marketing y Ventas',
  'Limpieza y Servicios',
];

export const DepartmentManagerModal: React.FC<DepartmentManagerModalProps> = ({
  isOpen,
  onClose,
  departments,
  workers,
  onAddDepartment,
  onUpdateDepartment,
  onDeleteDepartment,
  isAdmin,
}) => {
  // Form for new department
  const [newName, setNewName] = useState('');
  const [newPattern, setNewPattern] = useState('5x2');
  const [newDesc, setNewDesc] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Edit state
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [editingNewName, setEditingNewName] = useState('');

  // Delete state
  const [deptToDelete, setDeptToDelete] = useState<string | null>(null);
  const [reassignTargetDept, setReassignTargetDept] = useState<string>('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setFormError('El nombre del departamento no puede estar vacío.');
      return;
    }
    if (departments.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
      setFormError('Ya existe un departamento con este nombre.');
      return;
    }

    onAddDepartment(trimmed, newDesc.trim() || undefined, newPattern);
    setNewName('');
    setNewDesc('');
    setFormError(null);
  };

  const handleStartEdit = (dept: string) => {
    setEditingDept(dept);
    setEditingNewName(dept);
    setDeptToDelete(null);
  };

  const handleSaveEdit = (oldName: string) => {
    const trimmed = editingNewName.trim();
    if (!trimmed) return;
    if (trimmed !== oldName && departments.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
      alert('Ya existe otro departamento con este nombre.');
      return;
    }
    onUpdateDepartment(oldName, trimmed);
    setEditingDept(null);
    setEditingNewName('');
  };

  const handleStartDelete = (dept: string) => {
    const remaining = departments.filter((d) => d !== dept);
    setDeptToDelete(dept);
    setReassignTargetDept(remaining[0] || '');
    setEditingDept(null);
  };

  const handleConfirmDelete = () => {
    if (!deptToDelete) return;
    const workerCount = workers.filter((w) => w.department === deptToDelete).length;
    if (workerCount > 0 && !reassignTargetDept) {
      alert('Debe seleccionar un departamento destino para reasignar a los empleados.');
      return;
    }
    onDeleteDepartment(deptToDelete, workerCount > 0 ? reassignTargetDept : undefined);
    setDeptToDelete(null);
    setReassignTargetDept('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60] animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Gestión de Departamentos y Áreas
              </h2>
              <p className="text-xs text-slate-500">
                Añada nuevos departamentos o renombre los existentes. Los cambios se sincronizan en la plantilla.
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

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Non-admin notice */}
          {!isAdmin && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Para modificar o eliminar departamentos debe tener activado el <strong>Modo Administrador</strong> en la barra superior.
              </span>
            </div>
          )}

          {/* Form: Add New Department */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                Añadir Nuevo Departamento
              </span>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nombre del Departamento *
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="Ej: Logística, Almacén, Seguridad..."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Patrón de Turnos Sugerido
                  </label>
                  <select
                    value={newPattern}
                    onChange={(e) => setNewPattern(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="5x2">5x2 Rotativo Semanal</option>
                    <option value="6x2">6x2 Continuo Industrial</option>
                    <option value="4x2">4x2 Rápido</option>
                    <option value="Rotativo Completo">Rotativo Completo 3 Turnos</option>
                    <option value="Fijo Mañana">Fijo Mañana (06:00 - 14:00)</option>
                    <option value="Fijo Central">Fijo Central (08:30 - 17:30)</option>
                  </select>
                </div>
              </div>

              {/* Suggestions pills */}
              <div className="space-y-1.5">
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  <span>Sugerencias rápidas:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_SUGGESTIONS.map((preset) => {
                    const exists = departments.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        disabled={exists}
                        onClick={() => setNewName(preset)}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                          exists
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed line-through'
                            : 'bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50'
                        }`}
                      >
                        + {preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              {formError && (
                <p className="text-xs text-rose-600 font-medium">{formError}</p>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={!newName.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Guardar Departamento</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Existing Departments */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Departamentos Actuales ({departments.length})
              </span>
              <span className="text-xs text-slate-500">
                Total plantilla: <strong className="text-slate-800">{workers.length}</strong> empleados
              </span>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {departments.map((dept) => {
                const deptWorkers = workers.filter((w) => w.department === dept);
                const isEditing = editingDept === dept;
                const isDeleting = deptToDelete === dept;

                return (
                  <div key={dept} className="p-3.5 hover:bg-slate-50/50 transition-colors">
                    {/* Standard or Edit display */}
                    {isEditing ? (
                      <div className="space-y-2 bg-indigo-50/40 p-3 rounded-lg border border-indigo-200">
                        <div className="flex items-center justify-between text-xs font-semibold text-indigo-900">
                          <span>Editar nombre de "{dept}"</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingNewName}
                            onChange={(e) => setEditingNewName(e.target.value)}
                            className="flex-1 px-3 py-1.5 text-xs bg-white border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Nuevo nombre..."
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(dept)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-2xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Guardar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingDept(null)}
                            className="px-2.5 py-1.5 bg-white border border-slate-300 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50"
                          >
                            Cancelar
                          </button>
                        </div>
                        <p className="text-[11px] text-indigo-700 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Se actualizará automáticamente el departamento de {deptWorkers.length} empleados asignados.
                        </p>
                      </div>
                    ) : isDeleting ? (
                      <div className="space-y-3 bg-rose-50/70 p-3.5 rounded-lg border border-rose-200 text-xs">
                        <div className="flex items-start gap-2 text-rose-900">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold">¿Eliminar departamento "{dept}"?</div>
                            {deptWorkers.length > 0 ? (
                              <p className="text-rose-800 mt-1">
                                Hay <strong>{deptWorkers.length} trabajadores</strong> asignados a este departamento. Debe reasignarlos a otro antes de eliminarlo:
                              </p>
                            ) : (
                              <p className="text-rose-800 mt-1">
                                No hay trabajadores en este departamento. La eliminación es segura.
                              </p>
                            )}
                          </div>
                        </div>

                        {deptWorkers.length > 0 && (
                          <div>
                            <label className="block text-[11px] font-semibold text-rose-900 mb-1">
                              Reasignar los {deptWorkers.length} empleados a:
                            </label>
                            <select
                              value={reassignTargetDept}
                              onChange={(e) => setReassignTargetDept(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-rose-300 rounded-lg text-xs text-slate-800"
                            >
                              {departments
                                .filter((d) => d !== dept)
                                .map((target) => (
                                  <option key={target} value={target}>
                                    {target}
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setDeptToDelete(null)}
                            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleConfirmDelete}
                            className="px-3.5 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-2xs"
                          >
                            Confirmar Eliminación
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 font-bold text-xs">
                            {dept.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 text-xs flex items-center gap-2 truncate">
                              <span className="truncate">{dept}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                                <Users className="w-3 h-3 text-slate-400" />
                                {deptWorkers.length} empleados
                              </span>
                              {deptWorkers.length > 0 && (
                                <span className="text-slate-400 truncate max-w-xs hidden sm:inline">
                                  ({deptWorkers.slice(0, 3).map((w) => w.name.split(' ')[0]).join(', ')}
                                  {deptWorkers.length > 3 ? ` +${deptWorkers.length - 3}` : ''})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(dept)}
                            title="Editar nombre del departamento"
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Renombrar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartDelete(dept)}
                            disabled={!isAdmin || departments.length <= 1}
                            title={
                              departments.length <= 1
                                ? 'Debe existir al menos un departamento'
                                : !isAdmin
                                ? 'Requiere Modo Administrador'
                                : 'Eliminar departamento'
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Total {departments.length} departamentos activos
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs shadow-2xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
