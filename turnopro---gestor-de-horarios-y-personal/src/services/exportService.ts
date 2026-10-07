import * as XLSX from 'xlsx';
import { Worker, ShiftAssignment, VacationRequest } from '../types';
import { SHIFT_DEFINITIONS } from '../data/shiftDefinitions';

export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 1. EXCEL (.xlsx) EXPORT
export function exportToExcel(
  workers: Worker[],
  assignments: ShiftAssignment[],
  dates: string[],
  vacations: VacationRequest[],
  weekLabel: string
): Blob {
  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const workerMap = new Map(workers.map((w) => [w.id, w]));

  // Sheet 1: Cuadrante de Turnos
  const cuadranteData = workers.map((worker) => {
    const row: Record<string, any> = {
      'Nº Empleado': worker.employeeNumber,
      'Nombre y Apellidos': worker.name,
      'Departamento': worker.department,
      'Puesto': worker.role,
      'Contrato (h)': worker.contractHours,
    };

    let totalHours = 0;
    let daysOff = 0;

    dates.forEach((dateStr, idx) => {
      const dayHeader = `${dayNames[idx]} (${dateStr.slice(5)})`;
      const asgn = assignments.find((a) => a.workerId === worker.id && a.date === dateStr);
      const code = asgn?.shiftCode || 'OFF';
      const shiftDef = SHIFT_DEFINITIONS[code];
      const hours = shiftDef?.hours || 0;
      totalHours += hours;
      if (code === 'OFF' || code === 'VAC' || code === 'BAJ') daysOff++;

      row[dayHeader] = `${code} (${hours}h)`;
    });

    row['Total Horas'] = totalHours;
    row['Diferencia Contrato'] = totalHours - worker.contractHours;
    row['Días Descanso/Ausencia'] = daysOff;

    return row;
  });

  // Sheet 2: Resumen Asistencia & Nómina
  const asistenciaData = workers.map((worker) => {
    let scheduledHours = 0;
    let daysWorked = 0;
    let daysOff = 0;
    let daysVac = 0;
    let daysSick = 0;

    dates.forEach((dateStr) => {
      const asgn = assignments.find((a) => a.workerId === worker.id && a.date === dateStr);
      const code = asgn?.shiftCode || 'OFF';
      const shiftDef = SHIFT_DEFINITIONS[code];
      if (shiftDef && shiftDef.isWorkShift) {
        scheduledHours += shiftDef.hours;
        daysWorked++;
      } else if (code === 'VAC') {
        daysVac++;
      } else if (code === 'BAJ') {
        daysSick++;
      } else {
        daysOff++;
      }
    });

    const overtime = Math.max(0, scheduledHours - worker.contractHours);
    const deficit = Math.max(0, worker.contractHours - scheduledHours);

    return {
      'Nº Empleado': worker.employeeNumber,
      'Trabajador': worker.name,
      'Departamento': worker.department,
      'Puesto': worker.role,
      'Horas Contrato': worker.contractHours,
      'Horas Programadas': scheduledHours,
      'Horas Extras': overtime,
      'Horas Déficit': deficit,
      'Días Trabajados': daysWorked,
      'Días Vacaciones': daysVac,
      'Días Baja Médica': daysSick,
      'Días Descanso': daysOff,
      'Estado': worker.status,
    };
  });

  // Sheet 3: Control de Vacaciones
  const vacacionesData = workers.map((worker) => ({
    'Nº Empleado': worker.employeeNumber,
    'Trabajador': worker.name,
    'Departamento': worker.department,
    'Días Totales Anuales': worker.vacationDaysTotal,
    'Días Disfrutados': worker.vacationDaysUsed,
    'Días Pendientes': worker.vacationDaysTotal - worker.vacationDaysUsed,
    'Patrón Asignado': worker.rotationPattern,
    'Teléfono Contacto': worker.phoneNumber,
  }));

  const wb = XLSX.utils.book_new();

  const wsCuadrante = XLSX.utils.json_to_sheet(cuadranteData);
  const wsAsistencia = XLSX.utils.json_to_sheet(asistenciaData);
  const wsVacaciones = XLSX.utils.json_to_sheet(vacacionesData);

  // Set widths
  wsCuadrante['!cols'] = [
    { wch: 12 }, { wch: 28 }, { wch: 20 }, { wch: 22 }, { wch: 12 },
    { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
    { wch: 14 }, { wch: 18 }, { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, wsCuadrante, 'Cuadrante Semanal');
  XLSX.utils.book_append_sheet(wb, wsAsistencia, 'Reporte Asistencia');
  XLSX.utils.book_append_sheet(wb, wsVacaciones, 'Control Vacaciones');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

// 2. CSV EXPORT (with UTF-8 BOM)
export function exportToCSV(
  workers: Worker[],
  assignments: ShiftAssignment[],
  dates: string[]
): string {
  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
  const headers = [
    'NumEmpleado',
    'Nombre',
    'Departamento',
    'Puesto',
    'HorasContrato',
    ...dates.map((d, i) => `${dayNames[i]}_${d}`),
    'HorasTotales',
    'BalanceHoras',
  ];

  const rows: string[] = [headers.join(';')];

  workers.forEach((worker) => {
    let totalH = 0;
    const shiftCols: string[] = [];

    dates.forEach((dateStr) => {
      const asgn = assignments.find((a) => a.workerId === worker.id && a.date === dateStr);
      const code = asgn?.shiftCode || 'OFF';
      const shiftDef = SHIFT_DEFINITIONS[code];
      const hours = shiftDef?.hours || 0;
      totalH += hours;
      shiftCols.push(`"${code} (${hours}h)"`);
    });

    const row = [
      `"${worker.employeeNumber}"`,
      `"${worker.name}"`,
      `"${worker.department}"`,
      `"${worker.role}"`,
      worker.contractHours,
      ...shiftCols,
      totalH,
      totalH - worker.contractHours,
    ];

    rows.push(row.join(';'));
  });

  return '\uFEFF' + rows.join('\r\n');
}

// 3. iCALENDAR (.ics) EXPORT
export function exportToICS(
  workers: Worker[],
  assignments: ShiftAssignment[],
  workerIdFilter?: string
): string {
  const workerMap = new Map(workers.map((w) => [w.id, w]));
  
  let targetAssignments = assignments.filter((a) => {
    const shiftDef = SHIFT_DEFINITIONS[a.shiftCode];
    return shiftDef && shiftDef.isWorkShift;
  });

  if (workerIdFilter) {
    targetAssignments = targetAssignments.filter((a) => a.workerId === workerIdFilter);
  }

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TurnoPro//Organizador de Horarios//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Cuadrante TurnoPro',
  ];

  targetAssignments.forEach((asgn) => {
    const worker = workerMap.get(asgn.workerId);
    const shiftDef = SHIFT_DEFINITIONS[asgn.shiftCode];
    if (!worker || !shiftDef) return;

    const startClean = asgn.date.replace(/-/g, '') + 'T' + shiftDef.startTime.replace(':', '') + '00';
    let endDate = asgn.date;
    if (shiftDef.code === 'N') {
      const d = new Date(asgn.date + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      endDate = d.toISOString().split('T')[0];
    }
    const endClean = endDate.replace(/-/g, '') + 'T' + shiftDef.endTime.replace(':', '') + '00';

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:turnopro-${asgn.id}@empresa.com`);
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
    lines.push(`DTSTART:${startClean}`);
    lines.push(`DTEND:${endClean}`);
    lines.push(`SUMMARY:[Turno ${shiftDef.shortName}] ${worker.name}`);
    lines.push(`DESCRIPTION:Turno ${shiftDef.name} (${shiftDef.startTime} - ${shiftDef.endTime}). Departamento: ${worker.department}. Puesto: ${worker.role}.`);
    lines.push(`LOCATION:Instalaciones Centrales`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
