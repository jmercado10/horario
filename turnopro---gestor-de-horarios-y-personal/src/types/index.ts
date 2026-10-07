export type ShiftCode = 'M' | 'T' | 'N' | 'C' | 'FS' | 'OFF' | 'VAC' | 'BAJ' | string;

export interface ShiftDefinition {
  code: ShiftCode;
  name: string;
  shortName: string;
  startTime: string; // "06:00"
  endTime: string;   // "14:00"
  hours: number;     // 8
  color: string;     // bg color class
  textColor: string;
  borderColor: string;
  badgeBg: string;
  description: string;
  isWorkShift: boolean;
}

export type Department =
  | 'Producción'
  | 'Operaciones'
  | 'Mantenimiento'
  | 'Calidad'
  | 'Atención al Cliente'
  | 'Administración y RRHH'
  | string;

export interface Worker {
  id: string;
  employeeNumber: string; // e.g. "EMP-042"
  name: string;
  role: string;
  department: Department;
  contractHours: number; // e.g. 40
  phoneNumber: string;   // formatted for WhatsApp, e.g. "+34612345678"
  email: string;
  status: 'Activo' | 'Vacaciones' | 'Baja Médica' | 'Permiso';
  vacationDaysTotal: number; // default 30
  vacationDaysUsed: number;
  rotationPattern: '5x2' | '6x2' | '4x2' | 'Fijo Mañana' | 'Fijo Central' | 'Rotativo Completo' | string;
  notes?: string;
}

export interface OvertimeRecord {
  id: string;
  workerId: string;
  workerName: string;
  department: Department;
  date: string;
  hours: number;
  reason: string;
  type: 'Abonable' | 'Compensable';
  status: 'Aprobada' | 'Pendiente';
  registeredAt: string;
}

export interface ShiftAssignment {
  id: string;
  workerId: string;
  date: string; // "YYYY-MM-DD"
  shiftCode: ShiftCode;
  customHours?: number;
  note?: string;
}

export interface VacationRequest {
  id: string;
  workerId: string;
  workerName: string;
  department: Department;
  startDate: string;
  endDate: string;
  daysCount: number;
  type: 'Vacaciones' | 'Baja Médica' | 'Asuntos Propios' | 'Paternidad/Maternidad';
  status: 'Aprobada' | 'Pendiente' | 'Rechazada';
  requestDate: string;
  notes?: string;
}

export interface WeeklyAttendanceSummary {
  workerId: string;
  workerName: string;
  department: Department;
  scheduledHours: number;
  contractHours: number;
  overtimeHours: number;
  daysWorked: number;
  daysOff: number;
  daysVacation: number;
  daysSick: number;
  complianceRate: number; // percentage
}

export interface DepartmentCoverageRule {
  department: Department;
  minMorning: number;
  minAfternoon: number;
  minNight: number;
  minWeekend: number;
}

export interface QuadrantMetadata {
  id: string;
  weekStartDate: string; // "YYYY-MM-DD"
  name: string;
  description?: string;
  status: 'Borrador' | 'Publicado' | 'Cerrado';
  createdAt: string;
  updatedAt: string;
  departmentScope?: string; // 'Todos' or specific
  generatorPattern?: string; // '5x2', '6x2', '4x2', 'Rotativo Completo', 'Copiado', 'En Blanco', etc.
  assignedWorkersCount?: number;
}

export interface DepartmentInfo {
  name: string;
  description?: string;
  defaultPattern?: string;
}

