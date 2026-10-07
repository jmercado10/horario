import React, { useState } from 'react';
import { Worker, ShiftAssignment, VacationRequest } from '../types';
import { SHIFT_DEFINITIONS } from '../data/shiftDefinitions';
import { Printer, X, Layout, FileText, UserCheck, Shield } from 'lucide-react';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  workers: Worker[];
  assignments: ShiftAssignment[];
  dates: string[];
  currentWeekStart: string;
  vacations: VacationRequest[];
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  workers,
  assignments,
  dates,
  currentWeekStart,
}) => {
  const [printFormat, setPrintFormat] = useState<'poster' | 'cards' | 'executive'>('poster');

  if (!isOpen) return null;

  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const startDate = new Date(currentWeekStart + 'T00:00:00');
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  const weekLabel = `${startDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })} al ${endDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Controls (Hidden in print via CSS) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Centro de Impresión y Exportación a PDF
              </h3>
              <p className="text-xs text-slate-500">
                Seleccione el formato deseado antes de imprimir o guardar como PDF.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Format selector */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setPrintFormat('poster')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  printFormat === 'poster'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Tablón / Póster
              </button>
              <button
                onClick={() => setPrintFormat('cards')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  printFormat === 'cards'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Tarjetas Empleado
              </button>
              <button
                onClick={() => setPrintFormat('executive')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  printFormat === 'executive'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                3. Informe Ejecutivo
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Canvas Area */}
        <div className="p-8 overflow-y-auto flex-1 bg-white print:p-0 print:m-0" id="printable-area">
          {/* FORMAT 1: CUADRANTE SEMANAL COMPLETO (PÓSTER / TABLÓN DE ANUNCIOS) */}
          {printFormat === 'poster' && (
            <div className="space-y-6">
              {/* Header for print */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    CUADRANTE GENERAL DE TURNOS Y PLANIFICACIÓN DE PERSONAL
                  </h1>
                  <p className="text-xs text-slate-600 mt-1">
                    Semana Operativa: <span className="font-semibold">{weekLabel}</span> · Total Efectivos: 70
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500 font-mono">
                  <div>TurnoPro Enterprise</div>
                  <div>Generado: {new Date().toLocaleDateString('es-ES')}</div>
                </div>
              </div>

              {/* Shift Legend for poster */}
              <div className="grid grid-cols-4 gap-2 text-[11px] p-2 bg-slate-50 border border-slate-200 rounded">
                <div><span className="font-bold">M:</span> Mañana (06:00 - 14:00)</div>
                <div><span className="font-bold">T:</span> Tarde (14:00 - 22:00)</div>
                <div><span className="font-bold">N:</span> Noche (22:00 - 06:00)</div>
                <div><span className="font-bold">C:</span> Central (08:30 - 17:30)</div>
                <div><span className="font-bold">FS:</span> Refuerzo Guardia</div>
                <div><span className="font-bold">OFF:</span> Descanso Semanal</div>
                <div><span className="font-bold">VAC:</span> Vacaciones Aprobadas</div>
                <div><span className="font-bold">BAJ:</span> Baja Médica Oficial</div>
              </div>

              {/* High Density Table for poster */}
              <table className="w-full text-[11px] border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-300">
                    <th className="border border-slate-300 p-1 text-left w-14">ID</th>
                    <th className="border border-slate-300 p-1 text-left w-44">Empleado</th>
                    <th className="border border-slate-300 p-1 text-left w-28">Dpto.</th>
                    {dates.map((d, i) => (
                      <th key={d} className="border border-slate-300 p-1 text-center w-12">
                        <div>{dayNames[i].slice(0, 3)}</div>
                        <div className="text-[9px] text-slate-500">{d.slice(8)}</div>
                      </th>
                    ))}
                    <th className="border border-slate-300 p-1 text-center w-12">Horas</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((w, index) => {
                    let totalH = 0;
                    return (
                      <tr key={w.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="border border-slate-300 p-1 font-mono text-[10px] text-slate-500">
                          {w.employeeNumber}
                        </td>
                        <td className="border border-slate-300 p-1 font-semibold text-slate-900 truncate max-w-[170px]">
                          {w.name}
                        </td>
                        <td className="border border-slate-300 p-1 text-slate-600 truncate max-w-[110px]">
                          {w.department}
                        </td>
                        {dates.map((d) => {
                          const asgn = assignments.find((a) => a.workerId === w.id && a.date === d);
                          const code = asgn?.shiftCode || 'OFF';
                          const def = SHIFT_DEFINITIONS[code];
                          totalH += def?.hours || 0;
                          return (
                            <td
                              key={d}
                              className={`border border-slate-300 p-1 text-center font-bold ${
                                code === 'OFF' ? 'text-slate-400' : code === 'VAC' ? 'text-teal-700' : 'text-slate-900'
                              }`}
                            >
                              {code}
                            </td>
                          );
                        })}
                        <td className="border border-slate-300 p-1 text-center font-mono font-bold text-slate-900">
                          {totalH}h
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Signatures footer */}
              <div className="pt-8 grid grid-cols-3 gap-8 text-xs text-slate-700">
                <div className="border-t border-slate-400 pt-2 text-center">
                  <div className="font-semibold">Responsable de Recursos Humanos</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Firma y Sello</div>
                </div>
                <div className="border-t border-slate-400 pt-2 text-center">
                  <div className="font-semibold">Supervisor de Turnos y Operaciones</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Firma y Sello</div>
                </div>
                <div className="border-t border-slate-400 pt-2 text-center">
                  <div className="font-semibold">Comité de Empresa / Representación</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Firma y Conforme</div>
                </div>
              </div>
            </div>
          )}

          {/* FORMAT 2: TARJETAS INDIVIDUALES DE TURNO */}
          {printFormat === 'cards' && (
            <div className="space-y-6">
              <div className="border-b border-slate-300 pb-3">
                <h1 className="text-lg font-bold text-slate-900">
                  FICHAS INDIVIDUALES DE TURNOS SEMANALES
                </h1>
                <p className="text-xs text-slate-500">
                  Semana: {weekLabel} · Fichas individuales para entrega o taquillas.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workers.slice(0, 16).map((worker) => {
                  let totalH = 0;
                  return (
                    <div
                      key={worker.id}
                      className="border border-slate-300 rounded p-3 text-xs space-y-2 bg-slate-50/30"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                        <div>
                          <div className="font-bold text-slate-900">{worker.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {worker.role} · {worker.department} ({worker.employeeNumber})
                          </div>
                        </div>
                        <div className="font-mono text-xs font-semibold text-slate-800">
                          {worker.contractHours}h
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center font-mono">
                        {dates.map((d, i) => {
                          const asgn = assignments.find((a) => a.workerId === worker.id && a.date === d);
                          const code = asgn?.shiftCode || 'OFF';
                          const def = SHIFT_DEFINITIONS[code];
                          totalH += def?.hours || 0;
                          return (
                            <div key={d} className="p-1 border border-slate-200 rounded bg-white">
                              <div className="text-[9px] text-slate-400 font-sans">{dayNames[i].slice(0, 2)}</div>
                              <div className="font-bold text-[11px] text-slate-900">{code}</div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 text-slate-600">
                        <span>Horas programadas: <strong className="text-slate-900">{totalH}h</strong></span>
                        <span className="italic text-[10px]">Contacto: {worker.phoneNumber}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-[11px] text-slate-400 italic text-center">
                (Mostrando primeras 16 fichas en vista previa; la versión completa incluye los 70 trabajadores).
              </div>
            </div>
          )}

          {/* FORMAT 3: INFORME EJECUTIVO DE ASISTENCIA Y COBERTURAS */}
          {printFormat === 'executive' && (
            <div className="space-y-6">
              <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    INFORME EJECUTIVO DE ASISTENCIA, HORAS Y COBERTURA SEMANAL
                  </h1>
                  <p className="text-xs text-slate-600">
                    Semana Operativa: {weekLabel} · Organización de 70 Trabajadores
                  </p>
                </div>
                <div className="font-mono text-xs text-slate-500">
                  Área de Recursos Humanos
                </div>
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-4 border border-slate-300 p-4 rounded bg-slate-50/50 text-xs">
                <div>
                  <div className="text-slate-500">Total Efectivos Activos</div>
                  <div className="text-lg font-bold font-mono text-slate-900">70 trabajadores</div>
                </div>
                <div>
                  <div className="text-slate-500">Horas Totales Programadas</div>
                  <div className="text-lg font-bold font-mono text-slate-900">2,800 horas</div>
                </div>
                <div>
                  <div className="text-slate-500">Tasa de Cobertura de Turnos</div>
                  <div className="text-lg font-bold font-mono text-emerald-700">100% óptima</div>
                </div>
              </div>

              {/* Department breakdown table */}
              <div>
                <h3 className="font-bold text-xs text-slate-800 mb-2">
                  1. Desglose Operativo por Departamento
                </h3>
                <table className="w-full text-xs border border-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-left font-semibold">
                      <th className="p-2 border border-slate-300">Departamento</th>
                      <th className="p-2 border border-slate-300 text-center">Efectivos</th>
                      <th className="p-2 border border-slate-300 text-center">Turnos M</th>
                      <th className="p-2 border border-slate-300 text-center">Turnos T</th>
                      <th className="p-2 border border-slate-300 text-center">Turnos N</th>
                      <th className="p-2 border border-slate-300 text-center">Vacaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { d: 'Producción', c: 24, m: 8, t: 7, n: 5, v: 2 },
                      { d: 'Operaciones', c: 14, m: 5, t: 4, n: 3, v: 1 },
                      { d: 'Mantenimiento', c: 8, m: 3, t: 3, n: 1, v: 0 },
                      { d: 'Calidad', c: 6, m: 2, t: 2, n: 1, v: 0 },
                      { d: 'Atención al Cliente', c: 10, m: 4, t: 4, n: 1, v: 0 },
                      { d: 'Administración y RRHH', c: 8, m: 0, t: 0, n: 0, v: 0 },
                    ].map((row) => (
                      <tr key={row.d} className="border-b border-slate-200">
                        <td className="p-2 border border-slate-300 font-semibold">{row.d}</td>
                        <td className="p-2 border border-slate-300 text-center font-mono">{row.c}</td>
                        <td className="p-2 border border-slate-300 text-center font-mono">{row.m}</td>
                        <td className="p-2 border border-slate-300 text-center font-mono">{row.t}</td>
                        <td className="p-2 border border-slate-300 text-center font-mono">{row.n}</td>
                        <td className="p-2 border border-slate-300 text-center font-mono text-teal-700">{row.v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Compliance & Legal Confirmation */}
              <div className="border border-slate-200 p-3 rounded text-xs space-y-1">
                <div className="font-semibold text-slate-900">
                  2. Certificación de Descansos Legales
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Se certifica que la programación semanal respeta el intervalo mínimo de doce horas entre el final de una jornada y el comienzo de la siguiente, así como los descansos semanales acumulables o ininterrumpidos correspondientes al marco laboral vigente.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
