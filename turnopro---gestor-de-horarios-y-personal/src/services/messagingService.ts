import { Worker, ShiftAssignment } from '../types';
import { SHIFT_DEFINITIONS } from '../data/shiftDefinitions';

export function formatWorkerScheduleMessage(
  worker: Worker,
  assignments: ShiftAssignment[],
  dates: string[],
  weekLabel: string
): string {
  const dayLabels = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
  const workerAssignments = assignments.filter((a) => a.workerId === worker.id);
  let totalHours = 0;

  const lines = [
    `📋 *HORARIO SEMANAL - ${worker.name.toUpperCase()}*`,
    `🏢 Dpto: ${worker.department} | Puesto: ${worker.role}`,
    `🗓️ Período: ${weekLabel}`,
    `--------------------------------------`,
  ];

  dates.forEach((dateStr, idx) => {
    const asgn = workerAssignments.find((a) => a.date === dateStr);
    const code = asgn?.shiftCode || 'OFF';
    const shiftDef = SHIFT_DEFINITIONS[code];
    const hours = shiftDef?.hours || 0;
    totalHours += hours;

    let icon = '☀️';
    if (code === 'T') icon = '🌤️';
    if (code === 'N') icon = '🌙';
    if (code === 'C') icon = '💼';
    if (code === 'FS') icon = '🛡️';
    if (code === 'OFF') icon = '🏖️';
    if (code === 'VAC') icon = '✈️';
    if (code === 'BAJ') icon = '🏥';

    const timeStr = shiftDef.isWorkShift ? `(${shiftDef.startTime} - ${shiftDef.endTime})` : '';
    lines.push(`${icon} *${dayLabels[idx]} ${dateStr.slice(8)}*: ${shiftDef.shortName} ${timeStr}`);
  });

  lines.push(`--------------------------------------`);
  lines.push(`⏱️ *Total horas programadas:* ${totalHours}h / Contrato: ${worker.contractHours}h`);
  lines.push(`ℹ️ _Por favor confirme la recepción de este mensaje. Para permutas contacte a RRHH con 24h de antelación._`);

  return lines.join('\n');
}

export function generateWhatsAppLink(phoneNumber: string, message: string): string {
  // Clean phone number (remove +, spaces, hyphens)
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

export function formatDepartmentGroupBroadcast(
  department: string,
  workers: Worker[],
  assignments: ShiftAssignment[],
  dates: string[],
  weekLabel: string
): string {
  const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const deptWorkers = workers.filter((w) => w.department === department);

  const lines = [
    `📢 *CUADRANTE GENERAL - DPTO. ${department.toUpperCase()}*`,
    `🗓️ Semana: ${weekLabel} (${deptWorkers.length} efectivos)`,
    `═══════════════════════════════`,
  ];

  deptWorkers.forEach((w) => {
    const shiftSummary = dates.map((d, i) => {
      const asgn = assignments.find((a) => a.workerId === w.id && a.date === d);
      return `${dayLabels[i]}:${asgn?.shiftCode || 'OFF'}`;
    }).join(' | ');

    lines.push(`👤 *${w.name}*: ${shiftSummary}`);
  });

  lines.push(`═══════════════════════════════`);
  lines.push(`Leyenda: M=Mañana(06-14) | T=Tarde(14-22) | N=Noche(22-06) | C=Central | OFF=Libre | VAC=Vacaciones`);
  lines.push(`Publicado por TurnoPro`);

  return lines.join('\n');
}

export function formatShiftChangeNotice(
  worker: Worker,
  date: string,
  oldShiftCode: string,
  newShiftCode: string,
  reason?: string
): string {
  const oldDef = (SHIFT_DEFINITIONS as Record<string, { name: string; startTime?: string; endTime?: string }>)[oldShiftCode] || { name: oldShiftCode };
  const newDef = (SHIFT_DEFINITIONS as Record<string, { name: string; startTime?: string; endTime?: string }>)[newShiftCode] || { name: newShiftCode, startTime: '', endTime: '' };

  const lines = [
    `⚠️ *NOTIFICACIÓN DE CAMBIO DE TURNO*`,
    `Hola ${worker.name}, se ha actualizado tu cuadrante de trabajo:`,
    ``,
    `📅 *Fecha:* ${date}`,
    `❌ *Turno anterior:* ${oldDef.name}`,
    `✅ *Nuevo turno asignado:* ${newDef.name} (${newDef.startTime} - ${newDef.endTime})`,
  ];

  if (reason) {
    lines.push(`📝 *Motivo:* ${reason}`);
  }

  lines.push(``);
  lines.push(`Si tienes alguna incompatibilidad, por favor responde a este mensaje de inmediato.`);

  return lines.join('\n');
}
