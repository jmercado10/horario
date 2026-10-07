import React, { useState, useEffect, useMemo } from 'react';
import {
  Worker,
  ShiftAssignment,
  ShiftCode,
  VacationRequest,
  ShiftDefinition,
  OvertimeRecord,
  QuadrantMetadata,
} from './types';
import { INITIAL_WORKERS } from './data/initialWorkers';
import { INITIAL_VACATION_REQUESTS } from './data/initialVacations';
import { INITIAL_OVERTIME_RECORDS } from './data/initialOvertime';
import { SHIFT_DEFINITIONS } from './data/shiftDefinitions';
import {
  getWeekDates,
  generateAssignmentsForWeek,
  validateSchedule,
} from './services/scheduleGenerator';
import { exportToExcel, exportToCSV, exportToICS, downloadFile } from './services/exportService';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { WeeklyScheduleView } from './components/WeeklyScheduleView';
import { WorkersView } from './components/WorkersView';
import { VacationsView } from './components/VacationsView';
import { AttendanceReportsView } from './components/AttendanceReportsView';
import { MessagingView } from './components/MessagingView';
import { LocalBackupView } from './components/LocalBackupView';
import { PrintModal } from './components/PrintModal';
import { ShiftEditorModal } from './components/ShiftEditorModal';
import { OvertimeModal } from './components/OvertimeModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { DepartmentManagerModal } from './components/DepartmentManagerModal';
import { NewQuadrantModal } from './components/NewQuadrantModal';

export default function App() {
  const [activeView, setActiveView] = useState<string>('schedule');
  const [currentWeekStart, setCurrentWeekStart] = useState<string>('2026-10-05');

  // Admin Role State
  const [isAdmin, setIsAdmin] = useState<boolean>(true);

  // Core Data (with 100% local persistence in localStorage for local business use)
  const [workers, setWorkers] = useState<Worker[]>(() => {
    try {
      const saved = localStorage.getItem('turnopro_workers');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_WORKERS;
  });

  const [vacations, setVacations] = useState<VacationRequest[]>(() => {
    try {
      const saved = localStorage.getItem('turnopro_vacations');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_VACATION_REQUESTS;
  });

  const [shifts, setShifts] = useState<Record<string, ShiftDefinition>>(() => {
    try {
      const saved = localStorage.getItem('turnopro_shifts');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return SHIFT_DEFINITIONS;
  });

  const [overtimeRecords, setOvertimeRecords] = useState<OvertimeRecord[]>(() => {
    try {
      const saved = localStorage.getItem('turnopro_overtime');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_OVERTIME_RECORDS;
  });

  // Departments State (with local persistence)
  const DEFAULT_DEPARTMENTS: string[] = [
    'Producción',
    'Operaciones',
    'Mantenimiento',
    'Calidad',
    'Atención al Cliente',
    'Administración y RRHH',
  ];

  const [departments, setDepartments] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('turnopro_departments');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_DEPARTMENTS;
  });

  // Quadrants Management State (with local persistence)
  const [quadrants, setQuadrants] = useState<QuadrantMetadata[]>(() => {
    try {
      const saved = localStorage.getItem('turnopro_quadrants');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'quad-2026-10-05',
        weekStartDate: '2026-10-05',
        name: 'Cuadrante Semana 41 (05 al 11 Oct)',
        description: 'Planificación operativa general de plantilla',
        status: 'Publicado',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        generatorPattern: 'Rotativo 5x2 / 6x2 / 4x2',
        assignedWorkersCount: INITIAL_WORKERS.length,
      },
    ];
  });

  // Auto-save all state changes to local storage
  useEffect(() => {
    try {
      localStorage.setItem('turnopro_workers', JSON.stringify(workers));
    } catch (e) {}
  }, [workers]);

  useEffect(() => {
    try {
      localStorage.setItem('turnopro_vacations', JSON.stringify(vacations));
    } catch (e) {}
  }, [vacations]);

  useEffect(() => {
    try {
      localStorage.setItem('turnopro_shifts', JSON.stringify(shifts));
    } catch (e) {}
  }, [shifts]);

  useEffect(() => {
    try {
      localStorage.setItem('turnopro_overtime', JSON.stringify(overtimeRecords));
    } catch (e) {}
  }, [overtimeRecords]);

  useEffect(() => {
    try {
      localStorage.setItem('turnopro_departments', JSON.stringify(departments));
    } catch (e) {}
  }, [departments]);

  useEffect(() => {
    try {
      localStorage.setItem('turnopro_quadrants', JSON.stringify(quadrants));
    } catch (e) {}
  }, [quadrants]);

  // Notification Toast state
  const [toast, setToast] = useState<{
    id: number;
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now();
    setToast({ id, type, message });
    setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 4500);
  };

  // Compute dates for current week
  const dates = useMemo(() => getWeekDates(currentWeekStart), [currentWeekStart]);

  // Assignments store: grouped by week start date (persisted in localStorage)
  const [weeklyAssignments, setWeeklyAssignments] = useState<Record<string, ShiftAssignment[]>>(() => {
    try {
      const saved = localStorage.getItem('turnopro_weekly_assignments');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    const initialAsgns = generateAssignmentsForWeek(INITIAL_WORKERS, '2026-10-05', INITIAL_VACATION_REQUESTS);
    return {
      '2026-10-05': initialAsgns,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('turnopro_weekly_assignments', JSON.stringify(weeklyAssignments));
    } catch (e) {}
  }, [weeklyAssignments]);

  // Current week assignments
  const currentAssignments = useMemo(() => {
    if (weeklyAssignments[currentWeekStart]) {
      return weeklyAssignments[currentWeekStart];
    }
    // Auto generate if not yet created for this week
    const generated = generateAssignmentsForWeek(workers, currentWeekStart, vacations);
    return generated;
  }, [weeklyAssignments, currentWeekStart, workers, vacations]);

  // Keep state synchronized if a new week is requested
  useEffect(() => {
    if (!weeklyAssignments[currentWeekStart]) {
      const generated = generateAssignmentsForWeek(workers, currentWeekStart, vacations);
      setWeeklyAssignments((prev) => ({
        ...prev,
        [currentWeekStart]: generated,
      }));
    }
  }, [currentWeekStart, workers, vacations]);

  // Modals
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isShiftEditorModalOpen, setIsShiftEditorModalOpen] = useState(false);
  const [isOvertimeModalOpen, setIsOvertimeModalOpen] = useState(false);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [isNewQuadrantModalOpen, setIsNewQuadrantModalOpen] = useState(false);

  // Anomalies count
  const anomalies = useMemo(() => {
    return validateSchedule(workers, currentAssignments, vacations);
  }, [workers, currentAssignments, vacations]);

  const pendingVacationsCount = useMemo(() => {
    return vacations.filter((v) => v.status === 'Pendiente').length;
  }, [vacations]);

  // Handler: Update shift code of a single cell (upsert by workerId & date)
  const handleUpdateAssignment = (workerId: string, date: string, newShiftCode: ShiftCode) => {
    setWeeklyAssignments((prev) => {
      const weekAsgns = prev[currentWeekStart] || currentAssignments;
      const index = weekAsgns.findIndex((a) => a.workerId === workerId && a.date === date);

      let updated: ShiftAssignment[];
      if (index >= 0) {
        updated = weekAsgns.map((a, i) =>
          i === index ? { ...a, shiftCode: newShiftCode } : a
        );
      } else {
        const newAsgn: ShiftAssignment = {
          id: `asgn-${workerId}-${date}-${Date.now()}`,
          workerId,
          date,
          shiftCode: newShiftCode,
        };
        updated = [...weekAsgns, newAsgn];
      }

      return {
        ...prev,
        [currentWeekStart]: updated,
      };
    });
  };

  // Handler: Regenerate schedule for week with chosen pattern
  const handleRegenerateSchedule = (pattern: '5x2' | '6x2' | '4x2' | 'Rotativo Completo') => {
    const updatedWorkers = workers.map((w) =>
      w.department === 'Administración y RRHH' ? w : { ...w, rotationPattern: pattern }
    );
    const newAsgns = generateAssignmentsForWeek(updatedWorkers, currentWeekStart, vacations);
    setWeeklyAssignments((prev) => ({
      ...prev,
      [currentWeekStart]: newAsgns,
    }));
  };

  // Handler: Swap shifts between two workers (with safe upsert)
  const handleSwapShifts = (worker1Id: string, worker2Id: string, date: string) => {
    setWeeklyAssignments((prev) => {
      const weekAsgns = prev[currentWeekStart] || currentAssignments;
      const a1 = weekAsgns.find((a) => a.workerId === worker1Id && a.date === date);
      const a2 = weekAsgns.find((a) => a.workerId === worker2Id && a.date === date);

      const code1 = a1?.shiftCode || 'OFF';
      const code2 = a2?.shiftCode || 'OFF';

      let updated = [...weekAsgns];
      if (a1) {
        updated = updated.map((a) => (a.id === a1.id ? { ...a, shiftCode: code2 } : a));
      } else {
        updated.push({ id: `asgn-${worker1Id}-${date}-${Date.now()}`, workerId: worker1Id, date, shiftCode: code2 });
      }

      if (a2) {
        updated = updated.map((a) => (a.id === a2.id ? { ...a, shiftCode: code1 } : a));
      } else {
        updated.push({ id: `asgn-${worker2Id}-${date}-${Date.now() + 1}`, workerId: worker2Id, date, shiftCode: code1 });
      }

      return {
        ...prev,
        [currentWeekStart]: updated,
      };
    });
  };

  // Handler: Worker management (immediately initializes rotation shifts for the new worker)
  const handleAddWorker = (newWorker: Worker) => {
    setWorkers((prev) => [...prev, newWorker]);

    // Automatically generate assignments for the new worker for all loaded weeks
    setWeeklyAssignments((prev) => {
      const nextMap: Record<string, ShiftAssignment[]> = { ...prev };
      const trackedWeeks = Object.keys(nextMap).length > 0 ? Object.keys(nextMap) : [currentWeekStart];

      trackedWeeks.forEach((wKey) => {
        const newAsgns = generateAssignmentsForWeek([newWorker], wKey, vacations);
        nextMap[wKey] = [...(nextMap[wKey] || []), ...newAsgns];
      });

      if (!nextMap[currentWeekStart]) {
        nextMap[currentWeekStart] = generateAssignmentsForWeek([newWorker], currentWeekStart, vacations);
      }

      return nextMap;
    });

    showToast('success', `Trabajador ${newWorker.name} agregado y turnos asignados correctamente.`);
  };

  const handleUpdateWorker = (updatedWorker: Worker) => {
    setWorkers((prev) => prev.map((w) => (w.id === updatedWorker.id ? updatedWorker : w)));
  };

  // Delete worker (Enforces Admin permission with full cleanup and toast feedback)
  const handleDeleteWorker = (workerId: string): boolean => {
    if (!isAdmin) {
      showToast('error', 'Acceso denegado: debe activar el Modo Administrador para eliminar personal.');
      return false;
    }

    const target = workers.find((w) => w.id === workerId);
    if (!target) {
      showToast('error', 'No se localizó al trabajador en la plantilla.');
      return false;
    }

    try {
      setWorkers((prev) => prev.filter((w) => w.id !== workerId));
      setOvertimeRecords((prev) => prev.filter((r) => r.workerId !== workerId));
      setVacations((prev) => prev.filter((v) => v.workerId !== workerId));
      setWeeklyAssignments((prev) => {
        const nextMap: Record<string, ShiftAssignment[]> = {};
        Object.keys(prev).forEach((wKey) => {
          const list = prev[wKey];
          if (Array.isArray(list)) {
            nextMap[wKey] = list.filter((a) => a.workerId !== workerId);
          }
        });
        return nextMap;
      });

      showToast('success', `Empleado ${target.name} (${target.employeeNumber}) eliminado correctamente.`);
      return true;
    } catch (err: any) {
      console.error('Error al eliminar trabajador:', err);
      showToast('error', `Error al eliminar trabajador: ${err?.message || 'Error desconocido'}`);
      return false;
    }
  };

  // Delete multiple workers (Batch deletion with Admin enforcement)
  const handleDeleteMultipleWorkers = (workerIds: string[]): boolean => {
    if (!isAdmin) {
      showToast('error', 'Acceso denegado: debe activar el Modo Administrador para eliminar personal.');
      return false;
    }

    if (!workerIds || workerIds.length === 0) {
      return false;
    }

    const idSet = new Set(workerIds);

    try {
      setWorkers((prev) => prev.filter((w) => !idSet.has(w.id)));
      setOvertimeRecords((prev) => prev.filter((r) => !idSet.has(r.workerId)));
      setVacations((prev) => prev.filter((v) => !idSet.has(v.workerId)));
      setWeeklyAssignments((prev) => {
        const nextMap: Record<string, ShiftAssignment[]> = {};
        Object.keys(prev).forEach((wKey) => {
          const list = prev[wKey];
          if (Array.isArray(list)) {
            nextMap[wKey] = list.filter((a) => !idSet.has(a.workerId));
          }
        });
        return nextMap;
      });

      showToast('success', `Se han eliminado ${workerIds.length} trabajadores correctamente.`);
      return true;
    } catch (err: any) {
      console.error('Error al eliminar múltiples trabajadores:', err);
      showToast('error', `Error al eliminar trabajadores: ${err?.message || 'Error desconocido'}`);
      return false;
    }
  };

  // Handler: Shifts configuration (Admin)
  const handleSaveShift = (updatedShift: ShiftDefinition) => {
    setShifts((prev) => ({
      ...prev,
      [updatedShift.code]: updatedShift,
    }));
  };

  const handleCreateShift = (newShift: ShiftDefinition) => {
    setShifts((prev) => ({
      ...prev,
      [newShift.code]: newShift,
    }));
  };

  const handleDeleteShift = (shiftCode: string) => {
    setShifts((prev) => {
      const copy = { ...prev };
      delete copy[shiftCode];
      return copy;
    });
  };

  // Handlers: Department Management
  const handleAddDepartment = (name: string, description?: string, defaultPattern?: string) => {
    if (departments.some((d) => d.toLowerCase() === name.toLowerCase())) {
      showToast('error', `El departamento "${name}" ya existe.`);
      return;
    }
    setDepartments((prev) => [...prev, name]);
    showToast('success', `Departamento "${name}" creado exitosamente.`);
  };

  const handleUpdateDepartment = (oldName: string, newName: string) => {
    if (oldName === newName) return;
    setDepartments((prev) => prev.map((d) => (d === oldName ? newName : d)));
    let count = 0;
    setWorkers((prev) =>
      prev.map((w) => {
        if (w.department === oldName) {
          count++;
          return { ...w, department: newName };
        }
        return w;
      })
    );
    setOvertimeRecords((prev) =>
      prev.map((r) => (r.department === oldName ? { ...r, department: newName } : r))
    );
    setVacations((prev) =>
      prev.map((v) => (v.department === oldName ? { ...v, department: newName } : v))
    );
    showToast('success', `Departamento "${newName}" actualizado. Se reasignaron ${count} trabajadores.`);
  };

  const handleDeleteDepartment = (name: string, reassignToDept?: string) => {
    if (!isAdmin) {
      showToast('error', 'Acceso denegado: debe activar el Modo Administrador para eliminar departamentos.');
      return;
    }
    if (departments.length <= 1) {
      showToast('error', 'Debe existir al menos un departamento.');
      return;
    }

    setDepartments((prev) => prev.filter((d) => d !== name));
    if (reassignToDept) {
      let movedCount = 0;
      setWorkers((prev) =>
        prev.map((w) => {
          if (w.department === name) {
            movedCount++;
            return { ...w, department: reassignToDept };
          }
          return w;
        })
      );
      setOvertimeRecords((prev) =>
        prev.map((r) => (r.department === name ? { ...r, department: reassignToDept } : r))
      );
      setVacations((prev) =>
        prev.map((v) => (v.department === name ? { ...v, department: reassignToDept } : v))
      );
      showToast('info', `Departamento "${name}" eliminado. ${movedCount} trabajadores reasignados a "${reassignToDept}".`);
    } else {
      showToast('info', `Departamento "${name}" eliminado.`);
    }
  };

  // Handlers: Quadrant Management
  const handleCreateQuadrant = (params: {
    weekStartDate: string;
    name: string;
    description?: string;
    mode: 'auto' | 'pattern' | 'copy' | 'blank';
    pattern?: string;
    selectedDepartments: string[];
    respectVacations: boolean;
    status: 'Borrador' | 'Publicado';
  }) => {
    const {
      weekStartDate,
      name,
      description,
      mode,
      pattern,
      selectedDepartments,
      respectVacations,
      status,
    } = params;

    const targetWorkers = workers.filter((w) => selectedDepartments.includes(w.department));
    let newAssignments: ShiftAssignment[] = [];

    if (mode === 'copy') {
      const baseWeek = weeklyAssignments[currentWeekStart] || currentAssignments;
      const targetDates = getWeekDates(weekStartDate);
      const baseDates = getWeekDates(currentWeekStart);

      newAssignments = [];
      targetWorkers.forEach((w) => {
        targetDates.forEach((tDate, dIdx) => {
          const bDate = baseDates[dIdx];
          const found = baseWeek.find((a) => a.workerId === w.id && a.date === bDate);
          newAssignments.push({
            id: `asgn-${w.id}-${tDate}-${Date.now() + Math.random()}`,
            workerId: w.id,
            date: tDate,
            shiftCode: found ? found.shiftCode : 'OFF',
          });
        });
      });
    } else if (mode === 'blank') {
      newAssignments = generateAssignmentsForWeek(
        targetWorkers,
        weekStartDate,
        vacations,
        0,
        'BLANK',
        respectVacations
      );
    } else if (mode === 'pattern') {
      newAssignments = generateAssignmentsForWeek(
        targetWorkers,
        weekStartDate,
        vacations,
        0,
        pattern,
        respectVacations
      );
    } else {
      newAssignments = generateAssignmentsForWeek(
        targetWorkers,
        weekStartDate,
        vacations,
        0,
        undefined,
        respectVacations
      );
    }

    setWeeklyAssignments((prev) => ({
      ...prev,
      [weekStartDate]: newAssignments,
    }));

    const newMeta: QuadrantMetadata = {
      id: `quad-${weekStartDate}-${Date.now()}`,
      weekStartDate,
      name,
      description,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generatorPattern:
        mode === 'copy'
          ? 'Copia de semana anterior'
          : mode === 'blank'
          ? 'En blanco (manual)'
          : pattern || 'Rotación Automática',
      assignedWorkersCount: targetWorkers.length,
    };

    setQuadrants((prev) => {
      const filtered = prev.filter((q) => q.weekStartDate !== weekStartDate);
      return [...filtered, newMeta];
    });

    setCurrentWeekStart(weekStartDate);
    showToast('success', `¡Cuadrante "${name}" creado con éxito para la semana ${weekStartDate}!`);
  };

  const handleDeleteQuadrant = (weekStartDate: string) => {
    if (quadrants.length <= 1) {
      showToast('error', 'No se puede eliminar el único cuadrante existente.');
      return;
    }
    setQuadrants((prev) => prev.filter((q) => q.weekStartDate !== weekStartDate));
    setWeeklyAssignments((prev) => {
      const copy = { ...prev };
      delete copy[weekStartDate];
      return copy;
    });
    if (currentWeekStart === weekStartDate) {
      const remaining = quadrants.filter((q) => q.weekStartDate !== weekStartDate);
      if (remaining.length > 0) {
        setCurrentWeekStart(remaining[0].weekStartDate);
      }
    }
    showToast('info', 'Cuadrante eliminado correctamente.');
  };

  // Handler: Overtime Records
  const handleAddOvertime = (record: Omit<OvertimeRecord, 'id' | 'registeredAt'>) => {
    const newRecord: OvertimeRecord = {
      ...record,
      id: `ot-${Date.now()}`,
      registeredAt: new Date().toISOString().split('T')[0],
    };
    setOvertimeRecords((prev) => [newRecord, ...prev]);
  };

  const handleDeleteOvertime = (id: string) => {
    setOvertimeRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // Handler: Rotation Pattern management
  const handleUpdateWorkerRotation = (workerId: string, newPattern: string) => {
    setWorkers((prev) =>
      prev.map((w) => (w.id === workerId ? { ...w, rotationPattern: newPattern as any } : w))
    );
  };

  const handleBatchUpdateRotation = (department: string, newPattern: string) => {
    setWorkers((prev) =>
      prev.map((w) => (w.department === department ? { ...w, rotationPattern: newPattern as any } : w))
    );
  };

  // Handler: Excel Import
  const handleImportWorkers = (newWorkers: Worker[], mode: 'replace' | 'append') => {
    // Automatically register any new departments present in the import
    const importedDepts = Array.from(new Set(newWorkers.map((w) => w.department).filter(Boolean)));
    if (importedDepts.length > 0) {
      setDepartments((prev) => Array.from(new Set([...prev, ...importedDepts])));
    }

    if (mode === 'replace') {
      setWorkers(newWorkers);
      // Generate clean assignments for the replaced workforce
      const freshAssignments = generateAssignmentsForWeek(newWorkers, currentWeekStart, []);
      setWeeklyAssignments({
        [currentWeekStart]: freshAssignments,
      });
      setOvertimeRecords([]);
      setVacations([]);
    } else {
      setWorkers((prev) => [...prev, ...newWorkers]);
      const addedAssignments = generateAssignmentsForWeek(newWorkers, currentWeekStart, []);
      setWeeklyAssignments((prev) => ({
        ...prev,
        [currentWeekStart]: [...(prev[currentWeekStart] || currentAssignments), ...addedAssignments],
      }));
    }
  };

  // Handler: Vacations
  const handleApproveVacation = (vacationId: string) => {
    const targetVac = vacations.find((v) => v.id === vacationId);
    if (!targetVac) return;

    setVacations((prev) =>
      prev.map((v) => (v.id === vacationId ? { ...v, status: 'Aprobada' } : v))
    );

    // Update worker status and used days
    setWorkers((prev) =>
      prev.map((w) => {
        if (w.id === targetVac.workerId) {
          return {
            ...w,
            status: targetVac.type === 'Baja Médica' ? 'Baja Médica' : 'Vacaciones',
            vacationDaysUsed:
              targetVac.type === 'Vacaciones'
                ? Math.min(w.vacationDaysTotal, w.vacationDaysUsed + targetVac.daysCount)
                : w.vacationDaysUsed,
          };
        }
        return w;
      })
    );

    // Update current weekly assignments if falling in current week
    setWeeklyAssignments((prev) => {
      const currentList = prev[currentWeekStart] || currentAssignments;
      const updated = currentList.map((a) => {
        if (
          a.workerId === targetVac.workerId &&
          a.date >= targetVac.startDate &&
          a.date <= targetVac.endDate
        ) {
          return {
            ...a,
            shiftCode: (targetVac.type === 'Baja Médica' ? 'BAJ' : 'VAC') as ShiftCode,
          };
        }
        return a;
      });
      return {
        ...prev,
        [currentWeekStart]: updated,
      };
    });
  };

  const handleRejectVacation = (vacationId: string) => {
    setVacations((prev) =>
      prev.map((v) => (v.id === vacationId ? { ...v, status: 'Rechazada' } : v))
    );
  };

  const handleRequestVacation = (
    requestData: Omit<VacationRequest, 'id' | 'status' | 'requestDate'>
  ) => {
    const newRequest: VacationRequest = {
      ...requestData,
      id: `vac-${Date.now()}`,
      status: 'Pendiente',
      requestDate: new Date().toISOString().split('T')[0],
    };
    setVacations((prev) => [newRequest, ...prev]);
  };

  // Export handlers
  const handleExportExcel = () => {
    const blob = exportToExcel(
      workers,
      currentAssignments,
      dates,
      vacations,
      `Semana ${dates[0]}`
    );
    downloadFile(blob, `TurnoPro_Cuadrante_${dates[0]}_a_${dates[6]}.xlsx`);
  };

  const handleExportCSV = () => {
    const csvContent = exportToCSV(workers, currentAssignments, dates);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, `TurnoPro_Cuadrante_${dates[0]}.csv`);
  };

  const handleExportICS = () => {
    const icsContent = exportToICS(workers, currentAssignments);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    downloadFile(blob, `TurnoPro_Turnos_${dates[0]}.ics`);
  };

  // Local Backup and Reset Handlers
  const handleRestoreBackup = (data: {
    workers?: Worker[];
    departments?: string[];
    vacations?: VacationRequest[];
    shifts?: Record<string, ShiftDefinition>;
    overtimeRecords?: OvertimeRecord[];
    quadrants?: QuadrantMetadata[];
    weeklyAssignments?: Record<string, ShiftAssignment[]>;
  }) => {
    if (data.workers) setWorkers(data.workers);
    if (data.departments) setDepartments(data.departments);
    if (data.vacations) setVacations(data.vacations);
    if (data.shifts) setShifts(data.shifts);
    if (data.overtimeRecords) setOvertimeRecords(data.overtimeRecords);
    if (data.quadrants) setQuadrants(data.quadrants);
    if (data.weeklyAssignments) setWeeklyAssignments(data.weeklyAssignments);

    showToast('success', '¡Copia de seguridad local restaurada correctamente!');
  };

  const handleResetAllData = () => {
    try {
      localStorage.removeItem('turnopro_workers');
      localStorage.removeItem('turnopro_departments');
      localStorage.removeItem('turnopro_vacations');
      localStorage.removeItem('turnopro_shifts');
      localStorage.removeItem('turnopro_overtime');
      localStorage.removeItem('turnopro_quadrants');
      localStorage.removeItem('turnopro_weekly_assignments');
    } catch (e) {}

    setWorkers(INITIAL_WORKERS);
    setDepartments(DEFAULT_DEPARTMENTS);
    setVacations(INITIAL_VACATION_REQUESTS);
    setShifts(SHIFT_DEFINITIONS);
    setOvertimeRecords(INITIAL_OVERTIME_RECORDS);
    setQuadrants([
      {
        id: 'quad-2026-10-05',
        weekStartDate: '2026-10-05',
        name: 'Cuadrante Semana 41 (05 al 11 Oct)',
        description: 'Planificación operativa general de plantilla',
        status: 'Publicado',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        generatorPattern: 'Rotativo 5x2 / 6x2 / 4x2',
        assignedWorkersCount: INITIAL_WORKERS.length,
      },
    ]);
    const resetAsgns = generateAssignmentsForWeek(INITIAL_WORKERS, '2026-10-05', INITIAL_VACATION_REQUESTS);
    setWeeklyAssignments({
      '2026-10-05': resetAsgns,
    });
    setCurrentWeekStart('2026-10-05');
    showToast('info', 'Datos locales reiniciados a los valores de plantilla por defecto.');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 antialiased selection:bg-indigo-100">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        workersCount={workers.length}
        pendingVacationsCount={pendingVacationsCount}
        anomaliesCount={anomalies.length}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentWeekStart={currentWeekStart}
          onWeekChange={setCurrentWeekStart}
          onOpenPrintModal={() => setIsPrintModalOpen(true)}
          onExportExcel={handleExportExcel}
          onExportCSV={handleExportCSV}
          onExportICS={handleExportICS}
          activeView={activeView}
          isAdmin={isAdmin}
          onToggleAdmin={() => setIsAdmin(!isAdmin)}
          onOpenShiftEditor={() => setIsShiftEditorModalOpen(true)}
          onOpenOvertimeModal={() => setIsOvertimeModalOpen(true)}
          onOpenExcelImportModal={() => setIsExcelImportModalOpen(true)}
          onOpenDepartmentManager={() => setIsDepartmentModalOpen(true)}
          onOpenNewQuadrantModal={() => setIsNewQuadrantModalOpen(true)}
          quadrants={quadrants}
        />

        <main className="flex-1 overflow-y-auto">
          {activeView === 'schedule' && (
            <WeeklyScheduleView
              workers={workers}
              assignments={currentAssignments}
              dates={dates}
              currentWeekStart={currentWeekStart}
              vacations={vacations}
              shifts={shifts}
              overtimeRecords={overtimeRecords}
              departments={departments}
              onUpdateAssignment={handleUpdateAssignment}
              onRegenerateSchedule={handleRegenerateSchedule}
              onSwapShifts={handleSwapShifts}
              onOpenShiftEditor={() => setIsShiftEditorModalOpen(true)}
              onOpenOvertimeModal={() => setIsOvertimeModalOpen(true)}
              onOpenDepartmentManager={() => setIsDepartmentModalOpen(true)}
              onOpenNewQuadrantModal={() => setIsNewQuadrantModalOpen(true)}
            />
          )}

          {activeView === 'workers' && (
            <WorkersView
              workers={workers}
              departments={departments}
              onAddWorker={handleAddWorker}
              onUpdateWorker={handleUpdateWorker}
              onDeleteWorker={handleDeleteWorker}
              onDeleteMultipleWorkers={handleDeleteMultipleWorkers}
              isAdmin={isAdmin}
              onToggleAdmin={() => setIsAdmin(!isAdmin)}
              onOpenExcelImportModal={() => setIsExcelImportModalOpen(true)}
              onOpenOvertimeModal={() => setIsOvertimeModalOpen(true)}
              onOpenDepartmentManager={() => setIsDepartmentModalOpen(true)}
            />
          )}

          {activeView === 'vacations' && (
            <VacationsView
              workers={workers}
              vacations={vacations}
              departments={departments}
              onApproveVacation={handleApproveVacation}
              onRejectVacation={handleRejectVacation}
              onRequestVacation={handleRequestVacation}
            />
          )}

          {activeView === 'reports' && (
            <AttendanceReportsView
              workers={workers}
              assignments={currentAssignments}
              dates={dates}
              currentWeekStart={currentWeekStart}
              vacations={vacations}
              shifts={shifts}
              overtimeRecords={overtimeRecords}
              departments={departments}
              onOpenPrintModal={() => setIsPrintModalOpen(true)}
              onExportExcel={handleExportExcel}
              onOpenOvertimeModal={() => setIsOvertimeModalOpen(true)}
            />
          )}

          {activeView === 'messaging' && (
            <MessagingView
              workers={workers}
              assignments={currentAssignments}
              dates={dates}
              currentWeekStart={currentWeekStart}
              departments={departments}
            />
          )}

          {activeView === 'backup' && (
            <LocalBackupView
              workers={workers}
              departments={departments}
              vacations={vacations}
              shifts={shifts}
              overtimeRecords={overtimeRecords}
              quadrants={quadrants}
              weeklyAssignments={weeklyAssignments}
              onRestoreBackup={handleRestoreBackup}
              onResetAllData={handleResetAllData}
              onExportExcel={handleExportExcel}
              onExportCSV={handleExportCSV}
              onExportICS={handleExportICS}
            />
          )}
        </main>
      </div>

      {/* Admin Shift Editor Modal */}
      <ShiftEditorModal
        isOpen={isShiftEditorModalOpen}
        onClose={() => setIsShiftEditorModalOpen(false)}
        shifts={shifts}
        onSaveShift={handleSaveShift}
        onCreateShift={handleCreateShift}
        onDeleteShift={handleDeleteShift}
        isAdmin={isAdmin}
      />

      {/* Overtime & Rotation Patterns Modal */}
      <OvertimeModal
        isOpen={isOvertimeModalOpen}
        onClose={() => setIsOvertimeModalOpen(false)}
        workers={workers}
        overtimeRecords={overtimeRecords}
        departments={departments}
        onAddOvertime={handleAddOvertime}
        onDeleteOvertime={handleDeleteOvertime}
        onUpdateWorkerRotation={handleUpdateWorkerRotation}
        onBatchUpdateRotation={handleBatchUpdateRotation}
      />

      {/* Department Manager Modal */}
      <DepartmentManagerModal
        isOpen={isDepartmentModalOpen}
        onClose={() => setIsDepartmentModalOpen(false)}
        departments={departments}
        workers={workers}
        onAddDepartment={handleAddDepartment}
        onUpdateDepartment={handleUpdateDepartment}
        onDeleteDepartment={handleDeleteDepartment}
        isAdmin={isAdmin}
      />

      {/* New Shift Quadrant Modal */}
      <NewQuadrantModal
        isOpen={isNewQuadrantModalOpen}
        onClose={() => setIsNewQuadrantModalOpen(false)}
        currentWeekStart={currentWeekStart}
        workers={workers}
        departments={departments}
        vacations={vacations}
        quadrants={quadrants}
        onCreateQuadrant={handleCreateQuadrant}
        onSelectQuadrant={(weekStr) => setCurrentWeekStart(weekStr)}
        onDeleteQuadrant={handleDeleteQuadrant}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
        onImportWorkers={handleImportWorkers}
        currentWorkersCount={workers.length}
      />

      {/* Multi-format Print Modal */}
      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        workers={workers}
        assignments={currentAssignments}
        dates={dates}
        currentWeekStart={currentWeekStart}
        vacations={vacations}
      />

      {/* Floating System Notifications / Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[70] max-w-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl border flex items-center justify-between gap-3 text-xs font-medium ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">
                {toast.type === 'success' ? '✓' : toast.type === 'error' ? '⚠️' : 'ℹ️'}
              </span>
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-white/70 hover:text-white text-xs ml-2"
              aria-label="Cerrar notificación"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
