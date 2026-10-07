import React, { useState, useMemo } from 'react';
import {
  Worker,
  ShiftAssignment,
  VacationRequest,
  Department,
  ShiftDefinition,
  OvertimeRecord,
} from '../types';
import { validateSchedule } from '../services/scheduleGenerator';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Clock,
  Printer,
  FileSpreadsheet,
  CheckCircle,
  Users,
} from 'lucide-react';

interface AttendanceReportsViewProps {
  workers: Worker[];
  assignments: ShiftAssignment[];
  dates: string[];
  currentWeekStart: string;
  vacations: VacationRequest[];
  shifts: Record<string, ShiftDefinition>;
  overtimeRecords: OvertimeRecord[];
  onOpenPrintModal: () => void;
  onExportExcel: () => void;
  onOpenOvertimeModal?: () => void;
  departments?: string[];
}

export const AttendanceReportsView: React.FC<AttendanceReportsViewProps> = ({
  workers,
  assignments,
  dates,
  currentWeekStart,
  vacations,
  shifts,
  overtimeRecords,
  onOpenPrintModal,
  onExportExcel,
  onOpenOvertimeModal,
  departments = [
    'Producción',
    'Operaciones',
    'Mantenimiento',
    'Calidad',
    'Atención al Cliente',
    'Administración y RRHH',
  ],
}) => {
  const [selectedDept, setSelectedDept] = useState('Todos');

  const anomalies = useMemo(() => {
    return validateSchedule(workers, assignments, vacations);
  }, [workers, assignments, vacations]);

  // Aggregate metrics
  const reportData = useMemo(() => {
    let totalScheduledHours = 0;
    let totalContractHours = 0;
    let totalOvertimeHours = 0;
    let totalDeficitHours = 0;
    let totalShiftsWorked = 0;
    let morningCount = 0;
    let afternoonCount = 0;
    let nightCount = 0;
    let centralCount = 0;
    let vacationDaysCount = 0;
    let sickLeaveDaysCount = 0;

    const workerSummaries = workers.map((worker) => {
      let workerScheduled = 0;
      let daysWorked = 0;
      let daysOff = 0;
      let daysVac = 0;
      let daysSick = 0;

      dates.forEach((dateStr) => {
        const asgn = assignments.find((a) => a.workerId === worker.id && a.date === dateStr);
        const code = asgn?.shiftCode || 'OFF';
        const shiftDef = shifts[code] || shifts.OFF || { hours: 0, isWorkShift: false };

        if (shiftDef && shiftDef.isWorkShift) {
          workerScheduled += shiftDef.hours;
          daysWorked++;
          totalShiftsWorked++;

          if (code === 'M') morningCount++;
          if (code === 'T') afternoonCount++;
          if (code === 'N') nightCount++;
          if (code === 'C') centralCount++;
        } else if (code === 'VAC') {
          daysVac++;
          vacationDaysCount++;
        } else if (code === 'BAJ') {
          daysSick++;
          sickLeaveDaysCount++;
        } else {
          daysOff++;
        }
      });

      // Add approved overtime records
      const workerOt = overtimeRecords
        .filter((r) => r.workerId === worker.id && r.status === 'Aprobada')
        .reduce((acc, r) => acc + r.hours, 0);

      const effectiveHours = workerScheduled + workerOt;
      totalScheduledHours += effectiveHours;
      totalContractHours += worker.contractHours;

      const diff = effectiveHours - worker.contractHours;
      if (diff > 0) totalOvertimeHours += diff;
      if (diff < 0) totalDeficitHours += Math.abs(diff);

      return {
        worker,
        workerScheduled: effectiveHours,
        regularScheduled: workerScheduled,
        overtimeHours: workerOt,
        contractHours: worker.contractHours,
        diff,
        daysWorked,
        daysOff,
        daysVac,
        daysSick,
        complianceRate: Math.min(100, Math.round((effectiveHours / worker.contractHours) * 100)),
      };
    });

    return {
      totalScheduledHours,
      totalContractHours,
      totalOvertimeHours,
      totalDeficitHours,
      totalShiftsWorked,
      morningCount,
      afternoonCount,
      nightCount,
      centralCount,
      vacationDaysCount,
      sickLeaveDaysCount,
      workerSummaries,
    };
  }, [workers, assignments, dates]);

  const filteredSummaries = useMemo(() => {
    if (selectedDept === 'Todos') return reportData.workerSummaries;
    return reportData.workerSummaries.filter((s) => s.worker.department === selectedDept);
  }, [reportData.workerSummaries, selectedDept]);

  // Department breakdown
  const departmentBreakdown = useMemo(() => {
    return departments.map((d) => {
      const summaries = reportData.workerSummaries.filter((s) => s.worker.department === d);
      const sched = summaries.reduce((acc, s) => acc + s.workerScheduled, 0);
      const cont = summaries.reduce((acc, s) => acc + s.contractHours, 0);
      const ot = summaries.reduce((acc, s) => acc + (s.diff > 0 ? s.diff : 0), 0);
      return {
        department: d,
        headcount: summaries.length,
        scheduledHours: sched,
        contractHours: cont,
        overtimeHours: ot,
        compliance: cont > 0 ? Math.round((sched / cont) * 100) : 100,
      };
    });
  }, [reportData.workerSummaries, departments]);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Top Banner and Quick Exports */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Reporte Ejecutivo de Asistencia y Turnos Semanal
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Semana del {dates[0]} al {dates[6]} · Control de nómina, productividad y descansos.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenOvertimeModal && (
            <button
              onClick={onOpenOvertimeModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors shadow-2xs"
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
              <span>Consignar Horas Extras</span>
            </button>
          )}
          <button
            onClick={onExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel Nóminas</span>
          </button>
          <button
            onClick={onOpenPrintModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Informe</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Horas Planificadas Equipo</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
            {reportData.totalScheduledHours}h
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            vs {reportData.totalContractHours}h estipuladas
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Horas Extra Acumuladas</div>
          <div className="text-2xl font-bold text-amber-600 mt-1 font-mono tabular-nums">
            +{reportData.totalOvertimeHours}h
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Compensables según convenio
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Turnos Operativos Realizados</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1 font-mono tabular-nums">
            {reportData.totalShiftsWorked}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {reportData.morningCount} M · {reportData.afternoonCount} T · {reportData.nightCount} N · {reportData.centralCount} C
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Ausencias / Bajas Registradas</div>
          <div className="text-2xl font-bold text-teal-600 mt-1 font-mono tabular-nums">
            {reportData.vacationDaysCount + reportData.sickLeaveDaysCount} días
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {reportData.vacationDaysCount} vac. · {reportData.sickLeaveDaysCount} bajas médicas
          </div>
        </div>
      </div>

      {/* Labor Law & Safety Compliance Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 ${anomalies.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
            <h3 className="font-semibold text-slate-900 text-sm">
              Auditoría de Cumplimiento Legal y Descanso Mínimo (Estatuto de los Trabajadores)
            </h3>
          </div>
          <span
            className={`text-xs px-2.5 py-0.5 rounded font-semibold ${
              anomalies.length === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
            }`}
          >
            {anomalies.length === 0 ? 'Cumplimiento 100%' : `${anomalies.length} incidencias detectadas`}
          </span>
        </div>

        {anomalies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
            {anomalies.map((a, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 text-xs flex items-start gap-2.5"
              >
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900">
                    {a.workerName} <span className="font-mono text-slate-500">({a.date})</span>
                  </div>
                  <div className="text-slate-600 mt-0.5">{a.message}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500 flex items-center gap-2 pt-1">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Todos los turnos respetan el descanso mínimo obligatorio de 12 horas consecutivas entre jornadas y la jornada máxima semanal.</span>
          </div>
        )}
      </div>

      {/* Department Breakdown Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">
            Rendimiento y Cobertura por Departamento
          </h3>
          <span className="text-xs text-slate-500">6 centros de coste operativos</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3 px-4 text-left">Departamento</th>
                <th className="py-3 px-4 text-center">Efectivos</th>
                <th className="py-3 px-4 text-center">Horas Programadas</th>
                <th className="py-3 px-4 text-center">Horas Contrato</th>
                <th className="py-3 px-4 text-center">Horas Extras</th>
                <th className="py-3 px-4 text-center">Tasa Cumplimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departmentBreakdown.map((d) => (
                <tr key={d.department} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {d.department}
                  </td>
                  <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-700">
                    {d.headcount} trab.
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 tabular-nums">
                    {d.scheduledHours}h
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-500 tabular-nums">
                    {d.contractHours}h
                  </td>
                  <td className="py-3 px-4 text-center font-mono tabular-nums">
                    {d.overtimeHours > 0 ? (
                      <span className="text-amber-700 font-semibold">+{d.overtimeHours}h</span>
                    ) : (
                      <span className="text-slate-400">0h</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`font-semibold font-mono tabular-nums ${
                        d.compliance >= 100 ? 'text-emerald-600' : 'text-slate-700'
                      }`}
                    >
                      {d.compliance}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Worker Hours Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">
              Desglose Individual de Asistencia y Nómina ({filteredSummaries.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cómputo individual de horas, ausencias y descansos.
            </p>
          </div>

          <div className="flex items-center gap-2">
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
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-100 z-10">
              <tr className="text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3 px-4 text-left">Empleado</th>
                <th className="py-3 px-4 text-left">Departamento</th>
                <th className="py-3 px-4 text-center">H. Programadas</th>
                <th className="py-3 px-4 text-center">H. Contrato</th>
                <th className="py-3 px-4 text-center">Balance</th>
                <th className="py-3 px-4 text-center">Días Trab.</th>
                <th className="py-3 px-4 text-center">Descansos</th>
                <th className="py-3 px-4 text-center">Vacaciones</th>
                <th className="py-3 px-4 text-center">Cumplimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSummaries.map((s) => (
                <tr key={s.worker.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-4">
                    <div className="font-semibold text-slate-900">{s.worker.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{s.worker.employeeNumber}</div>
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">{s.worker.department}</td>
                  <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-800 tabular-nums">
                    {s.workerScheduled}h
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono text-slate-500 tabular-nums">
                    {s.contractHours}h
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono tabular-nums">
                    {s.diff > 0 ? (
                      <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                        +{s.diff}h
                      </span>
                    ) : s.diff < 0 ? (
                      <span className="text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded">
                        {s.diff}h
                      </span>
                    ) : (
                      <span className="text-emerald-700">0h</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono tabular-nums text-slate-700">
                    {s.daysWorked} d
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono tabular-nums text-slate-500">
                    {s.daysOff} d
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono tabular-nums">
                    {s.daysVac > 0 ? (
                      <span className="text-teal-700 font-semibold">{s.daysVac} d</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center font-mono font-semibold tabular-nums text-slate-800">
                    {s.complianceRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
