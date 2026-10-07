import React, { useState } from 'react';
import { ShiftDefinition, ShiftCode } from '../types';
import { Clock, Plus, Edit2, Check, X, Shield, Trash2, Palette } from 'lucide-react';

interface ShiftEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: Record<string, ShiftDefinition>;
  onSaveShift: (updatedShift: ShiftDefinition) => void;
  onCreateShift: (newShift: ShiftDefinition) => void;
  onDeleteShift: (shiftCode: string) => void;
  isAdmin: boolean;
}

export const ShiftEditorModal: React.FC<ShiftEditorModalProps> = ({
  isOpen,
  onClose,
  shifts,
  onSaveShift,
  onCreateShift,
  onDeleteShift,
  isAdmin,
}) => {
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Edit form state
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');
  const [hours, setHours] = useState(8);
  const [description, setDescription] = useState('');
  const [isWorkShift, setIsWorkShift] = useState(true);
  const [colorTheme, setColorTheme] = useState('blue');

  // New shift code
  const [newCode, setNewCode] = useState('');

  if (!isOpen) return null;

  const colorPresets: Record<string, { color: string; textColor: string; borderColor: string; badgeBg: string }> = {
    blue: {
      color: 'bg-blue-50 text-blue-900 border-blue-200',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-300',
      badgeBg: 'bg-blue-100',
    },
    amber: {
      color: 'bg-amber-50 text-amber-900 border-amber-200',
      textColor: 'text-amber-800',
      borderColor: 'border-amber-300',
      badgeBg: 'bg-amber-100',
    },
    indigo: {
      color: 'bg-indigo-900 text-indigo-100 border-indigo-700',
      textColor: 'text-indigo-900',
      borderColor: 'border-indigo-400',
      badgeBg: 'bg-indigo-100',
    },
    emerald: {
      color: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      textColor: 'text-emerald-800',
      borderColor: 'border-emerald-300',
      badgeBg: 'bg-emerald-100',
    },
    purple: {
      color: 'bg-purple-50 text-purple-900 border-purple-200',
      textColor: 'text-purple-800',
      borderColor: 'border-purple-300',
      badgeBg: 'bg-purple-100',
    },
    rose: {
      color: 'bg-rose-50 text-rose-900 border-rose-200',
      textColor: 'text-rose-800',
      borderColor: 'border-rose-300',
      badgeBg: 'bg-rose-100',
    },
    teal: {
      color: 'bg-teal-50 text-teal-900 border-teal-200',
      textColor: 'text-teal-800',
      borderColor: 'border-teal-300',
      badgeBg: 'bg-teal-100',
    },
    slate: {
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      textColor: 'text-slate-700',
      borderColor: 'border-slate-300',
      badgeBg: 'bg-slate-200',
    },
  };

  const startEdit = (shift: ShiftDefinition) => {
    setEditingCode(shift.code);
    setName(shift.name);
    setShortName(shift.shortName);
    setStartTime(shift.startTime);
    setEndTime(shift.endTime);
    setHours(shift.hours);
    setDescription(shift.description);
    setIsWorkShift(shift.isWorkShift);
    setIsCreating(false);
  };

  const handleSaveEdit = (code: string) => {
    const existing = shifts[code];
    const theme = colorPresets[colorTheme] || {
      color: existing.color,
      textColor: existing.textColor,
      borderColor: existing.borderColor,
      badgeBg: existing.badgeBg,
    };

    onSaveShift({
      ...existing,
      name,
      shortName,
      startTime,
      endTime,
      hours: Number(hours),
      description,
      isWorkShift,
      ...theme,
    });
    setEditingCode(null);
  };

  const handleCreateNew = () => {
    const code = newCode.trim().toUpperCase();
    if (!code) return;

    const theme = colorPresets[colorTheme] || colorPresets.indigo;

    onCreateShift({
      code,
      name: name || `Turno ${code}`,
      shortName: shortName || code,
      startTime,
      endTime,
      hours: Number(hours),
      description: description || `Horario ${startTime} a ${endTime}`,
      isWorkShift,
      ...theme,
    });

    setIsCreating(false);
    setNewCode('');
    setName('');
    setShortName('');
  };

  const shiftList = Object.values(shifts);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full p-6 space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 text-sm">
                  Configuración y Edición de Turnos
                </h3>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Panel de Administrador
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Ajuste los horarios de entrada/salida, cómputo de horas laborables y cree nuevos tipos de turno.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm">
            ✕
          </button>
        </div>

        {/* Notice if not Admin */}
        {!isAdmin && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600" />
            <span>
              Actualmente se encuentra en modo visualizador. Active el <strong>Modo Administrador</strong> en la barra superior para editar o agregar turnos.
            </span>
          </div>
        )}

        {/* Content list & forms */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Create new shift trigger */}
          {isAdmin && !isCreating && (
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setIsCreating(true);
                  setEditingCode(null);
                  setNewCode('');
                  setName('');
                  setShortName('');
                  setStartTime('08:00');
                  setEndTime('16:00');
                  setHours(8);
                  setDescription('');
                  setIsWorkShift(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear Nuevo Turno</span>
              </button>
            </div>
          )}

          {/* Form for Creating New Shift */}
          {isCreating && (
            <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between font-semibold text-indigo-950">
                <span>Nuevo Tipo de Turno</span>
                <button
                  onClick={() => setIsCreating(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Código (1-4 letras)*</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="Ej. TP, GRD"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Nombre Completo*</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Turno Partido"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Nombre Corto</label>
                  <input
                    type="text"
                    placeholder="Ej. Partido"
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Color / Tema</label>
                  <select
                    value={colorTheme}
                    onChange={(e) => setColorTheme(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="blue">Azul</option>
                    <option value="amber">Ámbar / Amarillo</option>
                    <option value="emerald">Verde Esmeralda</option>
                    <option value="indigo">Índigo / Oscuro</option>
                    <option value="purple">Morado</option>
                    <option value="rose">Rosa / Rojizo</option>
                    <option value="teal">Turquesa</option>
                    <option value="slate">Gris / Neutro</option>
                  </select>
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Hora Fin</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Horas Computables</label>
                  <input
                    type="number"
                    step="0.5"
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isWorkShift}
                      onChange={(e) => setIsWorkShift(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <span className="font-medium text-slate-700">¿Es turno de trabajo activo?</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1 text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  disabled={!newCode.trim()}
                  onClick={handleCreateNew}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-semibold shadow-2xs"
                >
                  Guardar Nuevo Turno
                </button>
              </div>
            </div>
          )}

          {/* Existing shifts table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-left w-16">Código</th>
                  <th className="py-2.5 px-3 text-left">Nombre</th>
                  <th className="py-2.5 px-3 text-center">Horario</th>
                  <th className="py-2.5 px-3 text-center">Horas</th>
                  <th className="py-2.5 px-3 text-left">Descripción</th>
                  <th className="py-2.5 px-3 text-center">Tipo</th>
                  <th className="py-2.5 px-3 text-center w-28">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shiftList.map((shift) => {
                  const isEditingThis = editingCode === shift.code;

                  if (isEditingThis) {
                    return (
                      <tr key={shift.code} className="bg-indigo-50/40">
                        <td className="py-2.5 px-3 font-bold font-mono text-indigo-900">
                          {shift.code}
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-1 bg-white border border-slate-300 rounded text-xs"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          <div className="flex items-center gap-1 justify-center">
                            <input
                              type="time"
                              value={startTime}
                              onChange={(e) => setStartTime(e.target.value)}
                              className="p-1 bg-white border border-slate-300 rounded text-[11px] w-20 text-center"
                            />
                            <span>-</span>
                            <input
                              type="time"
                              value={endTime}
                              onChange={(e) => setEndTime(e.target.value)}
                              className="p-1 bg-white border border-slate-300 rounded text-[11px] w-20 text-center"
                            />
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            step="0.5"
                            value={hours}
                            onChange={(e) => setHours(Number(e.target.value))}
                            className="p-1 bg-white border border-slate-300 rounded text-xs w-16 text-center font-mono"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-1 bg-white border border-slate-300 rounded text-xs"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <select
                            value={colorTheme}
                            onChange={(e) => setColorTheme(e.target.value)}
                            className="p-1 bg-white border border-slate-300 rounded text-[11px]"
                          >
                            <option value="blue">Azul</option>
                            <option value="amber">Ámbar</option>
                            <option value="emerald">Verde</option>
                            <option value="indigo">Índigo</option>
                            <option value="purple">Morado</option>
                            <option value="rose">Rosa</option>
                            <option value="teal">Turquesa</option>
                            <option value="slate">Gris</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleSaveEdit(shift.code)}
                              className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                              title="Guardar cambios"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingCode(null)}
                              className="p-1.5 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={shift.code} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3">
                        <span
                          className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${shift.badgeBg} ${shift.textColor}`}
                        >
                          {shift.code}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {shift.name}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600 tabular-nums">
                        {shift.isWorkShift ? `${shift.startTime} - ${shift.endTime}` : '--:--'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800 tabular-nums">
                        {shift.hours}h
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {shift.description}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                            shift.isWorkShift
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {shift.isWorkShift ? 'Trabajo' : 'Ausencia / Descanso'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isAdmin ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => startEdit(shift)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
                              title="Editar turno"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {/* Allow deleting custom shifts if not in core defaults */}
                            {!['M', 'T', 'N', 'C', 'OFF', 'VAC', 'BAJ'].includes(shift.code) && (
                              <button
                                onClick={() => onDeleteShift(shift.code)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                                title="Eliminar turno"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Protegido</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <div>
            Los cambios en los horarios se reflejan de inmediato en el cálculo de horas semanales y en la exportación local a Excel y calendarios iCal.
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
