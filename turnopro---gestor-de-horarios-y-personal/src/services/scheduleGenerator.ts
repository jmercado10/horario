import { Worker, ShiftAssignment, VacationRequest, ShiftCode, Department } from '../types';
import { SHIFT_DEFINITIONS, DEFAULT_COVERAGE_RULES } from '../data/shiftDefinitions';

export function getWeekDates(startDateStr: string): string[] {
  // Returns 7 date strings (Monday through Sunday)
  const start = new Date(startDateStr + 'T00:00:00');
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export function isDateInVacation(
  workerId: string,
  dateStr: string,
  vacations: VacationRequest[]
): { isVacation: boolean; type?: 'Vacaciones' | 'Baja Médica' | 'Asuntos Propios' | 'Paternidad/Maternidad' } {
  for (const vac of vacations) {
    if (vac.workerId === workerId && vac.status === 'Aprobada') {
      if (dateStr >= vac.startDate && dateStr <= vac.endDate) {
        return { isVacation: true, type: vac.type };
      }
    }
  }
  return { isVacation: false };
}

export function generateAssignmentsForWeek(
  workers: Worker[],
  startDateStr: string,
  vacations: VacationRequest[] = [],
  weekIndexOffset: number = 0,
  overridePattern?: string,
  respectVacations: boolean = true
): ShiftAssignment[] {
  const dates = getWeekDates(startDateStr);
  const assignments: ShiftAssignment[] = [];

  // Categorize workers by department and index to stagger shifts properly
  const deptCounters: Record<string, number> = {};

  workers.forEach((worker) => {
    const dept = worker.department || 'General';
    if (deptCounters[dept] === undefined) {
      deptCounters[dept] = 0;
    }
    const workerIdx = deptCounters[dept]++;
    
    // Check rotation pattern and generate 7 days
    dates.forEach((dateStr, dayIndex) => {
      // Check vacation / sick leave first if enabled
      if (respectVacations) {
        const vacCheck = isDateInVacation(worker.id, dateStr, vacations);
        if (vacCheck.isVacation) {
          const code: ShiftCode = vacCheck.type === 'Baja Médica' ? 'BAJ' : 'VAC';
          assignments.push({
            id: `asgn-${worker.id}-${dateStr}`,
            workerId: worker.id,
            date: dateStr,
            shiftCode: code,
            customHours: 0,
          });
          return;
        }
      }

      // If override pattern is 'BLANK', assign OFF
      if (overridePattern === 'BLANK') {
        assignments.push({
          id: `asgn-${worker.id}-${dateStr}`,
          workerId: worker.id,
          date: dateStr,
          shiftCode: 'OFF',
        });
        return;
      }

      const patternToUse = overridePattern || worker.rotationPattern;

      // Department: Administración y RRHH or Fijo Central is Monday-Friday Central, Weekend OFF
      if ((dept === 'Administración y RRHH' && !overridePattern) || patternToUse === 'Fijo Central') {
        const code: ShiftCode = dayIndex >= 5 ? 'OFF' : 'C';
        assignments.push({
          id: `asgn-${worker.id}-${dateStr}`,
          workerId: worker.id,
          date: dateStr,
          shiftCode: code,
        });
        return;
      }

      if (patternToUse === 'Fijo Mañana') {
        const code: ShiftCode = dayIndex >= 5 ? 'OFF' : 'M';
        assignments.push({
          id: `asgn-${worker.id}-${dateStr}`,
          workerId: worker.id,
          date: dateStr,
          shiftCode: code,
        });
        return;
      }

      // For 24/7 & Industrial departments (Producción, Operaciones, Mantenimiento, etc.)
      let assignedCode: ShiftCode = 'OFF';

      if (patternToUse === '5x2') {
        // Rotates weekly: Week 0 -> M, Week 1 -> T, Week 2 -> N
        // Weekend or staggered off days based on workerIdx
        const offDay1 = (workerIdx % 2 === 0) ? 5 : 0; // Saturday or Monday off
        const offDay2 = (workerIdx % 2 === 0) ? 6 : 6; // Sunday off
        
        if (dayIndex === offDay1 || dayIndex === offDay2) {
          assignedCode = 'OFF';
        } else {
          const shiftCycle: ShiftCode[] = ['M', 'T', 'N', 'M'];
          const cycleIdx = (workerIdx + weekIndexOffset) % shiftCycle.length;
          assignedCode = shiftCycle[cycleIdx];
        }
      } else if (patternToUse === '6x2') {
        // Continuous cycle over 8 days
        const globalDay = dayIndex + (weekIndexOffset * 7) + (workerIdx * 3);
        const cyclePos = globalDay % 8;
        if (cyclePos >= 6) {
          assignedCode = 'OFF';
        } else if (cyclePos < 2) {
          assignedCode = 'M';
        } else if (cyclePos < 4) {
          assignedCode = 'T';
        } else {
          assignedCode = 'N';
        }
      } else if (patternToUse === '4x2') {
        const globalDay = dayIndex + (weekIndexOffset * 7) + (workerIdx * 2);
        const cyclePos = globalDay % 6;
        if (cyclePos >= 4) {
          assignedCode = 'OFF';
        } else if (cyclePos < 2) {
          assignedCode = 'M';
        } else {
          assignedCode = 'T';
        }
      } else {
        // Rotativo Completo / 3 turnos
        // Balanced distribution
        const stagger = (workerIdx * 2 + weekIndexOffset + dayIndex) % 7;
        if (stagger === 5 || stagger === 6) {
          assignedCode = 'OFF';
        } else {
          const shiftSlot = (workerIdx + Math.floor(dayIndex / 2) + weekIndexOffset) % 3;
          assignedCode = shiftSlot === 0 ? 'M' : shiftSlot === 1 ? 'T' : 'N';
        }
      }

      assignments.push({
        id: `asgn-${worker.id}-${dateStr}`,
        workerId: worker.id,
        date: dateStr,
        shiftCode: assignedCode,
      });
    });
  });

  return assignments;
}

export interface ScheduleAnomaly {
  workerId: string;
  workerName: string;
  date: string;
  type: 'REST_PERIOD_VIOLATION' | 'OVERTIME' | 'VACATION_CONFLICT' | 'UNDERTIME';
  message: string;
  severity: 'high' | 'medium' | 'low';
}

export function validateSchedule(
  workers: Worker[],
  assignments: ShiftAssignment[],
  vacations: VacationRequest[]
): ScheduleAnomaly[] {
  const anomalies: ScheduleAnomaly[] = [];
  const workerMap = new Map(workers.map((w) => [w.id, w]));

  // Group assignments by worker and sort by date
  const byWorker = new Map<string, ShiftAssignment[]>();
  assignments.forEach((a) => {
    const list = byWorker.get(a.workerId) || [];
    list.push(a);
    byWorker.set(a.workerId, list);
  });

  byWorker.forEach((workerAssignments, workerId) => {
    const worker = workerMap.get(workerId);
    if (!worker) return;

    // Sort by date
    workerAssignments.sort((a, b) => a.date.localeCompare(b.date));

    let weeklyHours = 0;

    for (let i = 0; i < workerAssignments.length; i++) {
      const current = workerAssignments[i];
      const shiftDef = SHIFT_DEFINITIONS[current.shiftCode];
      weeklyHours += shiftDef ? shiftDef.hours : 0;

      // Check rest period between consecutive days
      if (i > 0) {
        const prev = workerAssignments[i - 1];
        // If previous was Night (ends 06:00) and current is Morning (starts 06:00) -> 0h rest!
        if (prev.shiftCode === 'N' && current.shiftCode === 'M') {
          anomalies.push({
            workerId: worker.id,
            workerName: worker.name,
            date: current.date,
            type: 'REST_PERIOD_VIOLATION',
            message: `Incumplimiento de descanso obligatorio (Turno Noche anterior seguido de Mañana sin 12h de descanso legal).`,
            severity: 'high',
          });
        }
        // If previous was Night and current is Afternoon (starts 14:00) -> 8h rest (< 12h)
        if (prev.shiftCode === 'N' && current.shiftCode === 'T') {
          anomalies.push({
            workerId: worker.id,
            workerName: worker.name,
            date: current.date,
            type: 'REST_PERIOD_VIOLATION',
            message: `Descanso reducido: Solo 8h entre Noche y Tarde (mínimo legal recomendado 12h).`,
            severity: 'medium',
          });
        }
      }

      // Check vacation conflict
      const vacCheck = isDateInVacation(worker.id, current.date, vacations);
      if (vacCheck.isVacation && current.shiftCode !== 'VAC' && current.shiftCode !== 'BAJ' && current.shiftCode !== 'OFF') {
        anomalies.push({
          workerId: worker.id,
          workerName: worker.name,
          date: current.date,
          type: 'VACATION_CONFLICT',
          message: `El empleado tiene aprobadas ${vacCheck.type} y tiene un turno de trabajo asignado (${current.shiftCode}).`,
          severity: 'high',
        });
      }
    }

    // Overtime
    if (weeklyHours > worker.contractHours + 4) {
      anomalies.push({
        workerId: worker.id,
        workerName: worker.name,
        date: workerAssignments[0]?.date || '',
        type: 'OVERTIME',
        message: `Exceso de jornada: ${weeklyHours}h programadas vs ${worker.contractHours}h contratadas (+${weeklyHours - worker.contractHours}h extra).`,
        severity: 'medium',
      });
    }
  });

  return anomalies;
}

export function computeDailyCoverage(
  assignments: ShiftAssignment[],
  date: string,
  department?: Department,
  workers?: Worker[]
): { M: number; T: number; N: number; C: number; FS: number; OFF: number; VAC: number; BAJ: number; [key: string]: number } {
  const counts: Record<string, number> = { M: 0, T: 0, N: 0, C: 0, FS: 0, OFF: 0, VAC: 0, BAJ: 0 };
  
  let targetAssignments = assignments.filter((a) => a.date === date);

  if (department && workers) {
    const workerDeptMap = new Map(workers.map((w) => [w.id, w.department]));
    targetAssignments = targetAssignments.filter((a) => workerDeptMap.get(a.workerId) === department);
  }

  targetAssignments.forEach((a) => {
    if (counts[a.shiftCode] !== undefined) {
      counts[a.shiftCode]++;
    } else {
      counts[a.shiftCode] = 1;
    }
  });

  return counts as any;
}
