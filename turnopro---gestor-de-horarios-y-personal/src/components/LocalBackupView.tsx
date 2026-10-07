import React, { useState, useRef } from 'react';
import {
  Worker,
  VacationRequest,
  ShiftDefinition,
  OvertimeRecord,
  QuadrantMetadata,
  ShiftAssignment,
} from '../types';
import {
  HardDrive,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  CalendarCheck,
  Users,
  Building2,
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  Lock,
} from 'lucide-react';

interface LocalBackupViewProps {
  workers: Worker[];
  departments: string[];
  vacations: VacationRequest[];
  shifts: Record<string, ShiftDefinition>;
  overtimeRecords: OvertimeRecord[];
  quadrants: QuadrantMetadata[];
  weeklyAssignments: Record<string, ShiftAssignment[]>;
  onRestoreBackup: (data: {
    workers?: Worker[];
    departments?: string[];
    vacations?: VacationRequest[];
    shifts?: Record<string, ShiftDefinition>;
    overtimeRecords?: OvertimeRecord[];
    quadrants?: QuadrantMetadata[];
    weeklyAssignments?: Record<string, ShiftAssignment[]>;
  }) => void;
  onResetAllData: () => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
  onExportICS: () => void;
}

export const LocalBackupView: React.FC<LocalBackupViewProps> = ({
  workers,
  departments,
  vacations,
  shifts,
  overtimeRecords,
  quadrants,
  weeklyAssignments,
  onRestoreBackup,
  onResetAllData,
  onExportExcel,
  onExportCSV,
  onExportICS,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Compute total shift assignments count
  const totalAssignmentsCount = Object.values(weeklyAssignments).reduce(
    (acc, list) => acc + (list ? list.length : 0),
    0
  );

  // Handler: Export full JSON backup
  const handleDownloadBackup = () => {
    try {
      const backupPayload = {
        app: 'TurnoPro',
        version: '2.0.0-local',
        exportedAt: new Date().toISOString(),
        workers,
        departments,
        vacations,
        shifts,
        overtimeRecords,
        quadrants,
        weeklyAssignments,
      };

      const jsonStr = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `turnopro_copia_local_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setFeedback({
        type: 'success',
        message: `Copia de seguridad local generada con éxito (archivo: turnopro_copia_local_${dateStr}.json).`,
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Ocurrió un error al generar la copia de seguridad: ' + (err.message || 'Error desconocido'),
      });
    }
  };

  // Handler: Import full JSON backup
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('El archivo no contiene un formato JSON válido.');
        }

        onRestoreBackup({
          workers: Array.isArray(parsed.workers) ? parsed.workers : undefined,
          departments: Array.isArray(parsed.departments) ? parsed.departments : undefined,
          vacations: Array.isArray(parsed.vacations) ? parsed.vacations : undefined,
          shifts: parsed.shifts && typeof parsed.shifts === 'object' ? parsed.shifts : undefined,
          overtimeRecords: Array.isArray(parsed.overtimeRecords) ? parsed.overtimeRecords : undefined,
          quadrants: Array.isArray(parsed.quadrants) ? parsed.quadrants : undefined,
          weeklyAssignments:
            parsed.weeklyAssignments && typeof parsed.weeklyAssignments === 'object'
              ? parsed.weeklyAssignments
              : undefined,
        });

        setFeedback({
          type: 'success',
          message: '¡Copia de seguridad restaurada con éxito! Todos los datos locales han sido actualizados.',
        });
        setTimeout(() => setFeedback(null), 5000);
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: 'Error al restaurar: ' + (err.message || 'Formato de archivo inválido.'),
        });
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <HardDrive className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Almacenamiento Local y Copias de Seguridad
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  100% Local y Gratuito
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Esta aplicación funciona exclusivamente de manera local en su equipo (sin servicios cloud externos, sin cuentas de terceros y sin ningún tipo de pago ni suscripción). Todos los datos se guardan en el almacenamiento local de su navegador.
              </p>
            </div>
          </div>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Database Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>Trabajadores</span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{workers.length}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Departamentos</span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{departments.length}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
            <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
            <span>Cuadrantes</span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{quadrants.length}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
            <CalendarCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Vacaciones</span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{vacations.length}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Horas Extras</span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{overtimeRecords.length}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
            <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
            <span>Asignaciones</span>
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{totalAssignmentsCount}</div>
        </div>
      </div>

      {/* Main Actions: Backup & Restore */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Backup Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Download className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                Descargar Copia de Seguridad Local
              </h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Exporta un archivo JSON completo con todos los trabajadores, turnos configurados, asignaciones semanales, horas extras y vacaciones. Puede guardarlo en una memoria USB o en cualquier carpeta de su equipo como resguardo.
            </p>
          </div>

          <button
            onClick={handleDownloadBackup}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Generar y Guardar Archivo de Copia (.json)</span>
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Upload className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                Restaurar Copia de Seguridad
              </h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cargue un archivo de respaldo previo en formato JSON para restaurar toda su información al instante en este equipo o en otro navegador local.
            </p>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition-colors"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Seleccionar Archivo de Respaldo (.json)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Export Formats & Privacy Details */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Exportaciones Directas para Gestión de la Empresa
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={onExportExcel}
            className="flex items-center gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-left transition-colors"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-slate-900">Excel (.xlsx)</div>
              <div className="text-[11px] text-slate-500">Cuadrante y cómputo de horas</div>
            </div>
          </button>

          <button
            onClick={onExportCSV}
            className="flex items-center gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-left transition-colors"
          >
            <FileText className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-slate-900">CSV Delimitado</div>
              <div className="text-[11px] text-slate-500">Para nóminas o bases de datos</div>
            </div>
          </button>

          <button
            onClick={onExportICS}
            className="flex items-center gap-3 p-3.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-left transition-colors"
          >
            <CalendarCheck className="w-5 h-5 text-purple-600 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-slate-900">Calendario iCal (.ics)</div>
              <div className="text-[11px] text-slate-500">Para calendarios locales</div>
            </div>
          </button>
        </div>
      </div>

      {/* Local Principles & Reset Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 text-xs font-bold">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Privacidad y Modo Sin Nube</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
            <li>
              <strong>Cero Servidores Externos:</strong> Los nombres, turnos y horarios de su empresa nunca viajan por internet.
            </li>
            <li>
              <strong>Funciona 100% Offline:</strong> No requiere conexión a internet para gestionar cuadrantes ni exportar.
            </li>
            <li>
              <strong>Sin Cuotas ni Pagos:</strong> Esta herramienta es de libre uso personal y empresarial para su negocio.
            </li>
          </ul>
        </div>

        <div className="bg-rose-50/60 rounded-xl border border-rose-200/70 p-5 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 text-rose-900 text-xs font-bold">
              <RotateCcw className="w-4 h-4 text-rose-600" />
              <span>Restablecer Datos Iniciales</span>
            </div>
            <p className="text-[11px] text-rose-700 mt-1 leading-relaxed">
              Restaura la plantilla inicial de demostración. Se recomienda guardar una copia en JSON antes de hacerlo.
            </p>
          </div>

          {isResetConfirmOpen ? (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-rose-800">
                ¿Seguro que desea reiniciar todos los datos locales?
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onResetAllData();
                    setIsResetConfirmOpen(false);
                    setFeedback({
                      type: 'success',
                      message: 'Datos locales reiniciados a los valores de plantilla por defecto.',
                    });
                    setTimeout(() => setFeedback(null), 4000);
                  }}
                  className="px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors"
                >
                  Sí, reiniciar
                </button>
                <button
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="py-2 px-3 border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Plantilla</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
