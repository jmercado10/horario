import React, { useState, useEffect } from 'react';
import { Worker, ShiftAssignment, Department } from '../types';
import {
  MessageSquare,
  Send,
  Copy,
  Check,
  Users,
  AlertCircle,
  Smartphone,
  Share2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  formatWorkerScheduleMessage,
  generateWhatsAppLink,
  formatDepartmentGroupBroadcast,
  formatShiftChangeNotice,
} from '../services/messagingService';

interface MessagingViewProps {
  workers: Worker[];
  assignments: ShiftAssignment[];
  dates: string[];
  currentWeekStart: string;
  departments?: string[];
}

export const MessagingView: React.FC<MessagingViewProps> = ({
  workers,
  assignments,
  dates,
  currentWeekStart,
  departments = [
    'Producción',
    'Operaciones',
    'Mantenimiento',
    'Calidad',
    'Atención al Cliente',
    'Administración y RRHH',
  ],
}) => {
  const [activeTab, setActiveTab] = useState<'individual' | 'group' | 'shift_change'>('individual');
  const [selectedWorkerId, setSelectedWorkerId] = useState(workers[0]?.id || '');
  const [selectedDept, setSelectedDept] = useState<Department>(departments[0] || 'Producción');
  const [copied, setCopied] = useState(false);

  // Shift change state
  const [changeWorkerId, setChangeWorkerId] = useState(workers[0]?.id || '');
  const [changeDate, setChangeDate] = useState(dates[0]);
  const [oldShift, setOldShift] = useState('M');
  const [newShift, setNewShift] = useState('T');
  const [changeReason, setChangeReason] = useState('Cobertura por baja médica imprevista');

  useEffect(() => {
    if (!workers.some((w) => w.id === selectedWorkerId) && workers.length > 0) {
      setSelectedWorkerId(workers[0].id);
    }
    if (!workers.some((w) => w.id === changeWorkerId) && workers.length > 0) {
      setChangeWorkerId(workers[0].id);
    }
  }, [workers, selectedWorkerId, changeWorkerId]);

  const selectedWorker = workers.find((w) => w.id === selectedWorkerId) || workers[0] || null;
  const changeWorker = workers.find((w) => w.id === changeWorkerId) || workers[0] || null;

  const startDate = new Date(currentWeekStart + 'T00:00:00');
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  const weekLabel = `${startDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} al ${endDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  const currentIndividualMessage = selectedWorker
    ? formatWorkerScheduleMessage(selectedWorker, assignments, dates, weekLabel)
    : '';

  const currentGroupMessage = formatDepartmentGroupBroadcast(
    selectedDept,
    workers,
    assignments,
    dates,
    weekLabel
  );

  const currentChangeMessage = changeWorker
    ? formatShiftChangeNotice(changeWorker, changeDate, oldShift, newShift, changeReason)
    : '';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Centro de Mensajería & Notificaciones al Personal
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sincronización directa con WhatsApp y herramientas de mensajería (Telegram / Slack / SMS) para 70 trabajadores.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('individual')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'individual' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Horario Individual
          </button>
          <button
            onClick={() => setActiveTab('group')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'group' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Difusión Grupal
          </button>
          <button
            onClick={() => setActiveTab('shift_change')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'shift_change' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Aviso de Cambio de Turno
          </button>
        </div>
      </div>

      {/* Tab 1: Individual WhatsApp Dispatch */}
      {activeTab === 'individual' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Worker Selector List */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <h3 className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              Seleccionar Empleado (70 en plantilla)
            </h3>

            <div className="space-y-1 max-h-[550px] overflow-y-auto pr-1">
              {workers.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setSelectedWorkerId(w.id)}
                  className={`w-full p-2.5 rounded-lg text-left text-xs transition-colors border ${
                    selectedWorkerId === w.id
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs'
                      : 'border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="font-semibold text-slate-900">{w.name}</div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between mt-0.5">
                    <span>{w.department}</span>
                    <span className="font-mono">{w.phoneNumber}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Message Preview and Send Button */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            {selectedWorker ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">
                      Vista Previa del Mensaje para: {selectedWorker.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Teléfono: <span className="font-mono text-slate-700">{selectedWorker.phoneNumber}</span> · Dpto: {selectedWorker.department}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(currentIndividualMessage)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
                    </button>

                    <a
                      href={generateWhatsAppLink(selectedWorker.phoneNumber, currentIndividualMessage)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Abrir WhatsApp Web / App</span>
                    </a>
                  </div>
                </div>

                {/* Chat bubble simulation */}
                <div className="bg-[#EFEAE2] p-6 rounded-xl border border-slate-200 max-w-xl mx-auto shadow-inner">
                  <div className="bg-white p-4 rounded-lg shadow-sm text-xs font-sans text-slate-800 whitespace-pre-wrap leading-relaxed border-l-4 border-emerald-500">
                    {currentIndividualMessage}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Seleccione un empleado de la lista para previsualizar y enviar su horario por WhatsApp.
              </div>
            )}

            <div className="text-[11px] text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                El botón abre directamente la aplicación de WhatsApp o WhatsApp Web en el navegador con el mensaje precargado y el destinatario seleccionado.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Department Group Broadcast */}
      {activeTab === 'group' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Difusión de Cuadrante para Grupo de Trabajo
              </h3>
              <p className="text-xs text-slate-500">
                Genera un resumen compacto de toda la semana para compartir en el grupo de WhatsApp o canal de Telegram/Slack.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value as Department)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d} ({workers.filter((w) => w.department === d).length} trab.)
                  </option>
                ))}
              </select>

              <button
                onClick={() => handleCopy(currentGroupMessage)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado!' : 'Copiar Resumen Grupal'}</span>
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(currentGroupMessage)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Compartir a Grupo</span>
              </a>
            </div>
          </div>

          <div className="bg-[#EFEAE2] p-5 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner max-h-96 overflow-y-auto">
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-emerald-500">
              {currentGroupMessage}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Shift Change Notice */}
      {activeTab === 'shift_change' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4 max-w-4xl mx-auto">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 text-sm">
              Generador de Notificación de Cambio Urgente de Turno
            </h3>
            <p className="text-xs text-slate-500">
              Notifique a un empleado sobre una sustitución, cambio de horario o cobertura inesperada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-medium text-slate-700 block mb-1">Empleado a notificar</label>
              <select
                value={changeWorkerId}
                onChange={(e) => setChangeWorkerId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">Fecha del cambio</label>
              <input
                type="date"
                value={changeDate}
                onChange={(e) => setChangeDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              />
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">Turno Previo</label>
              <select
                value={oldShift}
                onChange={(e) => setOldShift(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                <option value="M">Mañana (06:00 - 14:00)</option>
                <option value="T">Tarde (14:00 - 22:00)</option>
                <option value="N">Noche (22:00 - 06:00)</option>
                <option value="C">Central (08:30 - 17:30)</option>
                <option value="OFF">Libre (Descanso)</option>
              </select>
            </div>

            <div>
              <label className="font-medium text-slate-700 block mb-1">Nuevo Turno Asignado</label>
              <select
                value={newShift}
                onChange={(e) => setNewShift(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                <option value="M">Mañana (06:00 - 14:00)</option>
                <option value="T">Tarde (14:00 - 22:00)</option>
                <option value="N">Noche (22:00 - 06:00)</option>
                <option value="C">Central (08:30 - 17:30)</option>
                <option value="OFF">Libre (Descanso)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="font-medium text-slate-700 block mb-1">Motivo del Cambio</label>
              <input
                type="text"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              />
            </div>
          </div>

          <div className="bg-[#EFEAE2] p-4 rounded-xl border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap">
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-amber-500">
              {currentChangeMessage}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => handleCopy(currentChangeMessage)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
            </button>
            <a
              href={generateWhatsAppLink(changeWorker.phoneNumber, currentChangeMessage)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar por WhatsApp a {changeWorker.name}</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
